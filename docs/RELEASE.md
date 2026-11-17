# 发布流程（Trusted Publishing / OIDC）

本项目用 **npm Trusted Publishing** 发布：GitHub Actions 通过 OIDC 临时凭证发布，**本机不保存长期 npm token**。

## 一次性配置（npm 网站，每个包一次）

需要给这 3 个包配置 Trusted Publisher：

- `dsh-mesh-node`
- `dsh-mesh-ui`
- `@linyanzhi/dsh-mesh`

步骤（每个包重复）：

1. 登录 npm，打开对应包页面，进入 **Settings**（或 **Access** 页面里的 **Trusted Publishing**）
   - `https://www.npmjs.com/package/dsh-mesh-node/settings`
   - `https://www.npmjs.com/package/dsh-mesh-ui/settings`
   - `https://www.npmjs.com/package/@linyanzhi%2Fdsh-mesh/settings`
2. 选择 **GitHub Actions** 作为 Provider
3. 填写：
   - Organization / User：`LinYanZhi`
   - Repository：`dsh-mesh`
   - Workflow filename：`publish.yml`
   - Environment：留空
4. 保存（可能需要一次 2FA 验证）

> 配好后，GitHub Actions 里的 `publish` workflow 才有权发布这些包；本机不需要 token。

## 日常发布

1. 改代码、跑测试
2. bump 版本（`meta-package/package.json`、`plugin/dsh-mesh-ui/package.json`、`scripts/security/build-public.mjs` 里硬编码版本）
3. `node scripts/security/build-public.mjs` 重建公开镜像
4. commit + push（公开仓 CI 必须绿）
5. 打 tag 并 push：
   ```sh
   git tag v0.3.47
   git push origin v0.3.47
   ```
6. GitHub Actions 触发 `publish.yml`：
   - `tools/publish-changed.mjs` 会跳过 npm 上已存在的版本
   - 按依赖顺序发布：node → host → autostart → brand-color → ui → meta
7. 在 Actions 日志确认所有包发布成功；用 npm registry 校验 latest

## 失败处理

- **Trusted Publisher 未配置**：Actions 里会报 OIDC/权限错误 → 按上面「一次性配置」补齐
- **版本已存在**：脚本自动 skip；确认版本号是否已 bump
- **某包失败**：修好重跑 workflow（已发布的包会自动跳过）
- **不要**为了图快在本地建 Bypass 2FA token；本项目不使用长期发布 token

## 手动触发（不推 tag）

GitHub → Actions → `publish` → Run workflow（分支选 main）。
