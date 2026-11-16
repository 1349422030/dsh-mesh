# @linyanzhi/dsh-mesh

**把你自己几台电脑上的 DSH 连成一个 AI 网络**：侧栏拓扑、跨机文件传输、AI 之间互相派任务。不经过任何云端。

> 早期版本（0.x），Windows 优先，适合愿意自己动手的开发者。完整说明、截图与排障见：
> https://github.com/LinYanZhi/dsh-mesh

## 安装

```powershell
dsh plugin --profile web add @linyanzhi/dsh-mesh
```

装完**重启这个 DSH 实例**（只刷新页面不生效），左侧栏会出现 **AI 网络**。

## 它装了什么

这一个包会一并安装：

- `dsh-mesh-node` — mesh 服务端 / 节点之间通信
- `dsh-mesh-host` — 每个 DSH 实例的宿主桥（loopback）
- `dsh-mesh-autostart` — 保持服务在引擎重启后仍存活
- 本体：**AI 网络** 侧栏页（拓扑、节点健康、节点管理、文件传输、委托台账、告警与诊断）

## 适合谁

- 有 **2 台以上**自己长期开机的电脑，都跑 DSH
- 愿意用命令行、会配端口/防火墙，或愿意用 frp / 樱花 / Tailscale 打通网络
- 想让 AI 跨机器读文件、传文件、派任务

## 不适合谁（诚实说明）

- 只有 1 台电脑、也不打算加第二台
- 完全不想碰命令行 / 不懂端口与防火墙（现阶段没有一键安装器）
- 机器在不可信网络（公司公共网、合租、咖啡厅）又不愿配配对码 + ACL
- 需要商业 SLA、安全认证，或期待远程桌面/SSH 替代品
- 主力 macOS / Linux / 手机（Windows 10/11 验证最充分，其他平台属于"能跑但别指望零坑"）

## 你需要准备

- Windows 10/11 x64，管理员权限
- DSH `0.2.2-rc.1`（兼容 `0.2.0-rc.2` ~ `0.2.x`；多台机器尽量同版本）
- Node `22.19+` 或 `24+`（DSH 自带运行时）
- 网络：同一局域网，或每台有可用的公网 TCP 入口（frp / 樱花 / 隧道）
- 端口：`8124/tcp` 节点间可达；`9100+` 只在本机；`8129/udp` 局域网发现（可选）

## 安全默认值

- 节点间 TLS（自签证书 + 指纹固定），配对码换专属 token，token 只存本机 `~/.dsh-mesh/`
- 默认允许：读/检索/写对端 `~/Code` 文件、读会话历史与日志、委托任务
- 默认关闭：`shell_run`、频道消息、远程桌面、修复类操作（需要显式放开）
- `/api/dsh-mesh/*` 只接受本机回环请求；没有云端
- **插件是 in-process JS，权限等于你的用户权限** —— 装任何 DSH 插件都是这个模型，请只装可信来源

## 已知限制

- 0.x 早期，接口/配置格式会变
- Windows 优先：开机自启、远程重启等只做了 Windows
- 手机（Android + proot）为实验性节点；樱花客户端必须常驻
- 不是远程桌面/SSH 替代品；没有多用户/团队权限
- 跨网络必须自备隧道，没有公共中继

## 快速验证

```powershell
node scripts/mesh-health.mjs --fast
node scripts/self-update.mjs status --deep
```

在另一台装好后，用一次性配对码配对，即可在拓扑里看到对方。

## 文档

- 新手安装：[docs/QUICKSTART.zh.md](https://github.com/LinYanZhi/dsh-mesh/blob/main/docs/QUICKSTART.zh.md)
- 排障：[docs/TROUBLESHOOTING.zh.md](https://github.com/LinYanZhi/dsh-mesh/blob/main/docs/TROUBLESHOOTING.zh.md)
- 公网入口：[docs/SELFHOST-FRP.md](https://github.com/LinYanZhi/dsh-mesh/blob/main/docs/SELFHOST-FRP.md)
- 完整仓库说明：[README](https://github.com/LinYanZhi/dsh-mesh#readme)

## English TL;DR

Connects your own DSH instances across machines into one AI network: sidebar topology, cross-machine file transfer, and task delegation between AIs. No cloud relay — bring LAN reachability or your own tunnel (frp/Sakura/Tailscale).

Requires Windows 10/11 (primary), DSH `0.2.2-rc.1` (compatible `0.2.0-rc.2`–`0.2.x`), reachable TCP `8124`, admin rights. Early 0.x software; not a remote-desktop/SSH replacement; not for untrusted LANs without pairing + ACL. Full docs: https://github.com/LinYanZhi/dsh-mesh

MIT © LinYanZhi
