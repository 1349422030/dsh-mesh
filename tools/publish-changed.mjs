// @generated 2026-11-17 公开仓发布脚本：只发布“npm 上还不存在的版本”。
// 由 .github/workflows/publish.yml 在 GitHub Actions 中运行（Trusted Publishing / OIDC）。
// 安全：不打印 token；不覆盖已发布版本；按依赖顺序发布。
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const ROOT = process.cwd()
const PACKAGES = [
  'packages/dsh-mesh-node',
  'packages/dsh-mesh-host',
  'packages/dsh-mesh-autostart',
  'packages/dsh-brand-color',
  'packages/dsh-mesh-ui',
  'packages/dsh-mesh'
]

async function published(name, version) {
  const url = `https://registry.npmjs.org/${name.replace('/', '%2f')}`
  const res = await fetch(url)
  if (!res.ok) return false
  const data = await res.json()
  return Boolean(data.versions && data.versions[version])
}

for (const rel of PACKAGES) {
  const dir = join(ROOT, rel)
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  if (await published(pkg.name, pkg.version)) {
    console.log(`skip ${pkg.name}@${pkg.version} (already published)`)
    continue
  }
  console.log(`publishing ${pkg.name}@${pkg.version} ...`)
  const args = ['publish', '--provenance']
  if (pkg.name.startsWith('@')) args.push('--access', 'public')
  const r = spawnSync('npm', args, { cwd: dir, stdio: 'inherit', env: process.env })
  if (r.status !== 0) {
    console.error(`publish failed for ${pkg.name}@${pkg.version} (exit ${r.status})`)
    process.exit(r.status || 1)
  }
}
console.log('publish-changed: done')
