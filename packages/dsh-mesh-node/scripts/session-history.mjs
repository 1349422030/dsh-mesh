#!/usr/bin/env node
// @generated 2026-10-27 会话正文只读导出（给 mesh 的 session_history 工具用；本机执行、零第三方依赖）
// [why] P1：以前「读对端某条会话正文」只能委托对端 AI 去导出（起会话、花 token、几十秒）。
//       DSH 的会话日志就是本地 append-only 的 zstd 多帧文件（session.v4.jsonl.zstd），本脚本直接解帧读出，
//       由 mesh server 在自己机器上跑 → 跨机一条命令就能看正文。
// 用法：
//   node scripts/session-history.mjs --session <sessionId> [--home ~/.dsh0] [--limit 40] [--json]
// 说明：只读；不做脱敏（会话内容本身就是目的，ACL/令牌是边界）；--limit 取最后 N 条消息。
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ZSTD_MAGIC = 0xfd2fb528

const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const arg = (f, d = undefined) => {
  const i = argv.indexOf(f)
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d
}
const sessionId = arg('--session')
const home = arg('--home') || process.env.DSH_HOME || join(homedir(), '.dsh0')
const limit = Math.min(Math.max(Number(arg('--limit', '40')), 1), 200)

function emit(payload, code = 0) {
  console.log(JSON.stringify(payload, null, 2))
  process.exit(code)
}
if (!sessionId) emit({ ok: false, code: 'E_USAGE', message: '--session <sessionId> is required' }, 2)
if (!/^[A-Za-z0-9._-]{8,120}$/.test(sessionId)) emit({ ok: false, code: 'E_INVALID_ARG', message: 'sessionId looks invalid' }, 2)

/** Walk the zstd frame descriptors: the log is many concatenated frames, not one. */
function scanZstdFrames(buffer) {
  const frames = []
  let offset = 0
  while (offset < buffer.length) {
    const start = offset
    if (buffer.length - offset < 4) return { frames, tornStart: start }
    if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) throw new Error(`zstd frame magic mismatch @${offset}`)
    offset += 4
    if (offset === buffer.length) return { frames, tornStart: start }
    const descriptor = buffer.readUInt8(offset)
    offset += 1
    if ((descriptor & 0x18) !== 0) throw new Error(`zstd frame reserved bits set @${offset - 1}`)
    const contentSizeFlag = descriptor >>> 6
    const singleSegment = (descriptor & 0x20) !== 0
    const checksum = (descriptor & 0x04) !== 0
    const dictionaryFlag = descriptor & 0x03
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag
    const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag
    const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes
    if (buffer.length - offset < remainingHeaderBytes) return { frames, tornStart: start }
    offset += remainingHeaderBytes
    for (;;) {
      if (buffer.length - offset < 3) return { frames, tornStart: start }
      const blockHeader = buffer.readUIntLE(offset, 3)
      offset += 3
      const lastBlock = (blockHeader & 1) !== 0
      const blockType = (blockHeader >>> 1) & 0x03
      const blockSize = blockHeader >>> 3
      if (blockType === 0x03) throw new Error(`zstd reserved block type @${offset - 3}`)
      const payloadBytes = blockType === 0x01 ? 1 : blockSize
      if (buffer.length - offset < payloadBytes) return { frames, tornStart: start }
      offset += payloadBytes
      if (lastBlock) break
    }
    if (checksum) {
      if (buffer.length - offset < 4) return { frames, tornStart: start }
      offset += 4
    }
    frames.push({ start, end: offset })
  }
  return { frames }
}

function findSessionLog(dshHome, id) {
  const root = join(dshHome, 'sessions')
  if (!existsSync(root)) return null
  for (const projectKey of readdirSync(root)) {
    const file = join(root, projectKey, id, 'session.v4.jsonl.zstd')
    if (existsSync(file)) return file
  }
  return null
}

function readSessionLogFile(file) {
  const raw = readFileSync(file)
  const { frames } = scanZstdFrames(raw)
  const records = []
  for (const frame of frames) {
    const text = zstdDecompressSync(raw.subarray(frame.start, frame.end)).toString('utf8')
    for (const line of text.split('\n')) {
      if (!line.trim()) continue
      try {
        records.push(JSON.parse(line))
      } catch {
        /* append-only log: tolerate a torn tail */
      }
    }
  }
  return { records, frameCount: frames.length, bytes: raw.length }
}

function normalizeHistory(records) {
  const out = []
  for (const r of records) {
    if (r.type === 'user/message') {
      const text = (r.data?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n')
      out.push({ seq: r.seq, time: r.time, role: 'user', text })
    } else if (r.type === 'assistant/message') {
      const text = (r.data?.message?.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n')
      if (text) out.push({ seq: r.seq, time: r.time, role: 'assistant', text })
    } else if (r.type === 'session/title') {
      out.push({ seq: r.seq, time: r.time, role: 'title', text: r.data?.title || '' })
    } else if (r.type === 'session/end-seed' || r.type === 'session/start') {
      const title = r.data?.title
      if (typeof title === 'string' && title) out.push({ seq: r.seq, time: r.time, role: 'title', text: title })
    }
  }
  return out
}

try {
  const file = findSessionLog(home, sessionId)
  if (!file) {
    emit({ ok: false, code: 'E_NOT_FOUND', message: `session log not found for ${sessionId} under ${home}\\sessions`, sessionId, home }, 1)
  }
  const { records, frameCount, bytes } = readSessionLogFile(file)
  const messages = normalizeHistory(records)
  const title = messages.find((m) => m.role === 'title')?.text || ''
  const body = messages.filter((m) => m.role !== 'title')
  const tail = body.slice(Math.max(0, body.length - limit))
  emit({
    ok: true,
    sessionId,
    home,
    file,
    frameCount,
    bytes,
    totalMessages: body.length,
    title,
    limit,
    messages: tail
  })
} catch (error) {
  emit({ ok: false, code: 'E_HISTORY', message: String(error?.message || error) }, 1)
}
