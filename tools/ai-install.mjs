#!/usr/bin/env node
// @generated 2026-11-17 AI 友好的 dsh-mesh 安装/验机脚本（只读检查 + 可选安装）。
//
// [why] 小白把安装交给 DSH 的 AI 时，AI 不需要读长文档：先跑 --check 拿机器可读报告，
//       需要装时再 --apply；安装后脚本只告诉 AI「必须让用户重启 DSH」，绝不自杀式重启。
//
// 用法：
//   node tools/ai-install.mjs            # 只读检查（默认；不安装、不重启）
//   node tools/ai-install.mjs --apply    # 执行 dsh plugin ... add @linyanzhi/dsh-mesh
//   node tools/ai-install.mjs --json     # 机器可读输出
//   可选：--profile web（默认）、--dsh-home <path>
//
// 退出码：0 正常/安装成功；1 检查失败；2 需要用户操作（重启/UAC/缺 dsh）。
// 安全：不打印 token/配对码；不改用户级环境变量；不 kill 进程；不自动重启 DSH。

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const arg = (f, d) => {
  const i = argv.indexOf(f)
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d
}
const asJson = has('--json')
const apply = has('--apply')
const profile = arg('--profile', 'web')
const dshHome = arg('--dsh-home', process.env.DSH_HOME || join(homedir(), '.dsh'))
const isWin = process.platform === 'win32'
const PKG = '@linyanzhi/dsh-mesh'

const steps = []
function step(id, status, detail, next = '') {
  steps.push({ id, status, detail, next })
}

function run(cmd, args, timeout = 120000) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    shell: isWin,
    windowsHide: true,
    timeout
  })
  return { code: r.status, out: String(r.stdout || '').trim(), err: String(r.stderr || '').trim() }
}

function parseVersion(v) {
  const m = String(v || '').match(/(\d+)\.(\d+)\.(\d+)/)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}
function atLeast(v, [a, b, c]) {
  const x = parseVersion(v)
  if (!x) return false
  return x[0] > a || (x[0] === a && (x[1] > b || (x[1] === b && x[2] >= c)))
}

// 1) Node
const nodeV = process.versions.node
step('node', atLeast(nodeV, [22, 19, 0]) ? 'ok' : 'fail', `node ${nodeV}`, atLeast(nodeV, [22, 19, 0]) ? '' : '升级到 Node 22.19+ 或 24+')

// 2) dsh CLI + 版本
let dshV = ''
const dshTry = run('dsh', ['--version'], 30000)
if (dshTry.code === 0) dshV = dshTry.out || dshTry.err
step('dsh', dshV ? 'ok' : 'fail', dshV || 'dsh CLI not found in PATH', dshV ? '' : '让用户提供可在终端运行的 dsh（或从 DSH App 的安装目录找 bin/dsh.cmd）')
const dshCompat = !dshV || atLeast(dshV, [0, 2, 0]) // 0.2.0-rc.2 起
step('dsh-version', dshCompat ? 'ok' : 'fail', dshV || 'unknown', dshCompat ? '' : 'DSH 需要 0.2.0-rc.2+（推荐 0.2.2-rc.1）')

// 3) profile
const profileDir = join(dshHome, 'profiles', profile)
let profiles = []
try {
  profiles = readdirSync(join(dshHome, 'profiles')).filter((d) => existsSync(join(dshHome, 'profiles', d, 'package.json')))
} catch {}
if (!existsSync(profileDir)) {
  step('profile', 'fail', `${profileDir} 不存在`, `现有 profile: ${profiles.join(', ') || '（未找到）'}；让用户确认用哪个 profile（常见 web / desktop）`)
} else {
  step('profile', 'ok', profileDir, '')
}

// 4) 是否已安装
const pkgJson = join(profileDir, 'node_modules', PKG, 'package.json')
const installed = existsSync(pkgJson)
let installedVersion = ''
if (installed) {
  try {
    installedVersion = JSON.parse(readFileSync(pkgJson, 'utf8')).version || ''
  } catch {}
}
step('package', installed ? 'ok' : 'missing', installed ? `${PKG}@${installedVersion}` : `${PKG} not installed in this profile`, installed ? '' : '运行本脚本加 --apply，或 dsh plugin --profile web add @linyanzhi/dsh-mesh')

// 5) patch 挂载
const patch = join(profileDir, 'cordis.patch.yml')
let patchHasMesh = false
if (existsSync(patch)) {
  const text = readFileSync(patch, 'utf8')
  patchHasMesh = /dsh-mesh|linyanzhi\/dsh-mesh/.test(text)
}
step('profile-patch', patchHasMesh ? 'ok' : 'missing', patchHasMesh ? 'patch contains dsh-mesh entries' : `${patch} 没有 dsh-mesh 条目`, patchHasMesh ? '' : '安装后如仍缺失，交由用户检查/重装；不要手改未知 profile 配置')

// 6) 可选安装
if (apply && !installed && existsSync(profileDir)) {
  const r = run('dsh', ['plugin', '--profile', profile, 'add', PKG], 300000)
  const ok = r.code === 0 && existsSync(pkgJson)
  step('apply', ok ? 'ok' : 'fail', ok ? `installed ${PKG}@${(() => { try { return JSON.parse(readFileSync(pkgJson, 'utf8')).version } catch { return '' } })()}` : `install command failed (exit ${r.code}): ${(r.err || r.out).slice(-400)}`, ok ? '让用户重启 DSH（见 next）' : '把错误原文报告给用户；不要反复重试超过 2 次')
}

// 7) 下一步（永远不自动重启）
const needsRestart = installed || apply
step('restart', needsRestart ? 'user-action' : 'skip', needsRestart ? '安装后必须重启该 DSH 实例，客户端插件才会加载' : '尚未安装', needsRestart ? '请让用户重启 DSH：桌面 App 退出重开；终端运行的 dsh web 用 Ctrl+C 后重新启动。AI 不要 kill 自己的进程。' : '')

// 8) 验证命令（重启后由 AI 再跑）
step('verify', 'pending', '重启后验证', [
  `dsh plugin --profile ${profile} list   # 应看到 ${PKG}`,
  `dsh-mesh host status                  # 若 dsh-mesh 命令不可用：用 profile 下 node_modules/.bin 的 dsh-mesh`,
  'GET /api/dsh-mesh/status 应返回 {"ok": true}（需要该 DSH Web 的 token；没有浏览器时让用户确认左侧栏「AI 网络」可见）'
].join('\n'))

const summary = {
  ok: !steps.some((s) => s.status === 'fail' || s.status === 'missing'),
  platform: `${process.platform} ${process.arch}`,
  node: nodeV,
  dsh: dshV || null,
  dshHome,
  profile,
  profileDir,
  installed,
  installedVersion,
  apply,
  steps,
  restartRequired: Boolean(needsRestart),
  humanActions: steps.filter((s) => s.status === 'user-action').map((s) => s.next)
}

if (asJson) {
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log(`dsh-mesh AI 安装检查 · ${summary.platform} · profile=${profile}`)
  for (const s of steps) console.log(`  [${s.status}] ${s.id}: ${s.detail}`)
  if (summary.humanActions.length) {
    console.log('\n需要用户做的事：')
    for (const a of summary.humanActions) console.log(`  - ${a}`)
  }
  if (needsRestart) console.log('\n⚠️ 安装后请让用户重启 DSH（不要 kill 进程、不要自动重启）')
}

const hardFail = steps.some((s) => s.status === 'fail')
process.exit(hardFail ? 1 : needsRestart ? 0 : 0)
