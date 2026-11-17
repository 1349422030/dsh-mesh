# 给 AI 的提示词模板（复制即用）

> 把「模板 1」发给**要安装的那台机器**的 DSH AI；装第二台时用「模板 2」。
> 这些模板故意把「重启 DSH」「UAC/防火墙」「转交配对码」留给用户——AI 不能替用户做这些。
> 安全：提示词里不要贴 token / 私钥；配对码让用户在界面里输入，不要贴进聊天记录。

## 模板 1：在这台机器安装 dsh-mesh

```text
请帮我安装 dsh-mesh（DSH 多设备 AI 网络），严格按下面的流程做，不要跳步：

1) 先读这两个文件（如果本机没有源码仓，就按我贴的 URL 读）：
   - https://github.com/LinYanZhi/dsh-mesh/blob/main/docs/AI-CHECKLIST.md
   - https://github.com/LinYanZhi/dsh-mesh/blob/main/docs/INSTALL-FOR-AGENTS.md
2) 环境检查：Node >= 22.19、dsh >= 0.2.0-rc.2；确认我的 DSH_HOME 和 profile（web/desktop）。
3) 安装：dsh plugin --profile <我的profile> add @linyanzhi/dsh-mesh
4) 验证包已落地：dsh plugin --profile <profile> list 能看到 @linyanzhi/dsh-mesh；
   并且 profile 的 cordis.patch.yml 里有 dsh-mesh 条目。
5) 装完停下来，告诉我要重启 DSH，等我重启后再继续验证。
6) 重启后：确认左侧栏出现「AI 网络」；跑 dsh-mesh host status 做单机自检。
7) 如果我还有第二台机器要组网，再告诉我下一步（不要自己尝试跨公网/隧道）。

安全要求：不要打印 token/密钥；不要开启远程桌面控制；不要自动重启或 kill 进程；
需要管理员权限/UAC 时停下来让我操作；同一步失败两次就停下报告原文。
```

## 模板 2：第二台机器（安装 + 准备配对）

```text
请在这台机器上安装 dsh-mesh 并准备配对，按 docs/AI-CHECKLIST.md 执行：

1) 检查 Node/dsh/DSH_HOME/profile，然后安装：
   dsh plugin --profile <我的profile> add @linyanzhi/dsh-mesh
2) 验证包落地与 patch 条目，然后提醒我重启 DSH。
3) 重启后确认左侧栏「AI 网络」可见、dsh-mesh host status 正常。
4) 配对时不要自己猜配对码：我看到对方屏幕上的码后，会在「AI 网络 → 局域网连接」里手动输入；
   如果扫描不到对方，再让我提供对方的局域网 IP，你帮我判断网络/防火墙问题。
5) 不要尝试跨公网隧道；需要时告诉我准备 VPS 或樱花/Tailscale，让我决定。

安全要求同上：不打印 token/码、不自动重启、不 kill 进程、UAC 时停。
```

## 模板 3：出问题了，帮我排障

```text
dsh-mesh 出问题了，请按 docs/TROUBLESHOOTING.zh.md 排查，不要瞎改配置。

现象：<贴现象，例如：左侧栏没有 AI 网络 / 只有本机 / 配对失败 / 页面报 repo not found>
我做过：<装过什么、重启过几次、改过什么>
环境：<Windows 版本、DSH 版本、几台机器、是否同一局域网>

要求：
1) 先给只读检查命令，我执行后把输出贴给你；
2) 每一步告诉我预期结果，不符合就停下，不要连续重试超过 2 次；
3) 不要打印 token/配对码；不要自动重启；不要动用户级/系统级配置；
4) 最后给我：根因、要改什么、回滚方法。
```
