# dsh-mesh 排障指南（公开版）

> 先看现象，再按顺序排查。大多数问题出在：**没重启 DSH**、**装错 profile**、**防火墙/监听地址**、**隧道客户端没跑**。
> 如果是让 AI 来排障，把现象贴给 AI，并让它按本文件执行（别让它猜）。

---

## 0. 先做这两件事

1. **确认装到了正在用的那个 DSH 实例**：`dsh plugin --profile <profile> list` 能看到 `@linyanzhi/dsh-mesh`
2. **确认重启过**：装完只刷新页面不生效，必须重启该 DSH 实例

---

## 1. 左侧栏没有「AI 网络」

- 是不是装到了另一个实例的 profile？（多实例时常见）
- 重启一次（不是刷新），再按 `Ctrl+Shift+R` 硬刷新
- 看 `dsh plugin --profile <profile> list` 有没有包
- 仍没有：把 `dsh plugin list` 输出和浏览器 Console 的红色报错原文发给维护者/提 issue

## 2. 页面只有本机一个节点

- 正常：还没配对时只有本机
- 已配对但仍只有本机：确认装的是 **meta 包/UI**（`@linyanzhi/dsh-mesh`），不是只装了 `dsh-mesh-node`
- 页面报 `dsh-mesh repo not found`：升级到最新 meta 包后重启；旧版本在部分桌面版上有已知问题
- 对端在线但显示不出来：在「节点管理」里看是否被禁用；看 `/api/dsh-mesh/status`（需要该 DSH Web token）

## 3. 配对失败 / 扫描不到

按顺序检查：

1. 两台在**同一局域网**吗？（`ipconfig` 看 IP 前三段）
2. 被访问端的 mesh 是否监听 `0.0.0.0:8124`（只走局域网才需要）
3. Windows 防火墙是否放行 TCP 8124（管理员 PowerShell）：
   ```powershell
   New-NetFirewallRule -DisplayName "dsh-mesh TCP 8124" -Direction Inbound -Protocol TCP -LocalPort 8124 -Action Allow -Profile Private
   ```
4. 扫描不到就**手动填 IP**：`https://<对方局域网IP>:8124`
5. 配对报证书指纹不一致（`E_PIN_MISMATCH`）：对端证书换过，重新生成配对码再配
6. 配对是一次性双向的：想让两边都能互相调用，两边各出一次码、各兑换一次

## 4. 公网 / 内网穿透离线

- 隧道客户端是否在跑？（樱花 App / frpc 是否常驻）
- 手机端：樱花客户端需要允许后台运行、并保持登录
- 自建 frps：确认 VPS 上 `frps` 在跑、端口映射正确（见 [SELF-HOST-RELAY.md](SELF-HOST-RELAY.md)）
- 同局域网先确认能通，再排查公网

## 5. 文件传输记录为空

- 记录是**按节点存**的：谁执行读取/写入，记录就在谁那边
- 切到「全网记录」可以汇总查看（需要其他节点可达）
- 传输有配额（默认单文件 256MB、每天 2GB），超限会失败

## 6. 调用被拒绝（E_DENIED）

- 对端的 ACL/角色不允许这个工具：常见于 `shell_run`、`host_call`、`pc_*`、`fs_write`
- **不要反复重试**；让对端用户去「权限设置」放开，或把操作改成委托对端 AI 执行
- 默认关闭的能力包括：远程桌面、shell、频道消息、修复工具

## 7. 版本不一致 / 想更新

- 多台机器尽量保持 DSH 和插件版本一致
- 插件更新：`dsh plugin --profile <profile> update`（或重新 `add`），然后重启
- 升级后如果页面异常：先确认所有节点版本一致，再看 `~/.dsh-mesh/` 配置是否被旧版写坏（升级前建议备份）

## 8. 要提 issue 时请附上

- 系统/DSH/插件版本
- 现象 + 复现步骤
- 相关报错原文（**不要贴 token/配对码/内网地址**）
- `dsh plugin --profile <profile> list` 输出

## 9. 卸载 / 回滚

```sh
dsh plugin --profile <profile> remove @linyanzhi/dsh-mesh
```

- 配置与配对关系在 `~/.dsh-mesh/`，需要保留就先备份；删除后无法恢复
- 卸载不会删除你的项目文件

---

更多：[安装给 AI](INSTALL-FOR-AGENTS.md) · [AI Checklist](AI-CHECKLIST.md) · [README](../README.md) · [安全](../SECURITY.md)
