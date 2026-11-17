# Changelog

## Unreleased — 2026-11-17

- `dsh-mesh-node`: fix `session_history` on non-`~/.dshN` layouts — `homeOf()` now tries `DSH_HOME` → `~/.dsh` → `~/.dshN` and accepts the first candidate whose `sessions/` exists (issues #4, PR #6).
- `dsh-mesh-node`: fix `session_history` on the Electron desktop app — the script spawn now sets `ELECTRON_RUN_AS_NODE=1` so it does not launch a GUI until timeout (issue #3).
- `dsh-mesh-node`: ship the missing `scripts/session-history.mjs` in the published package (issue #1, PR #7). The source repo already had it; `build-public.mjs` did not copy it.
- `dsh-mesh-node`: export `"./package.json"` so `dsh-mesh-ui`'s `resolveRepo()` fallback no longer throws `ERR_PACKAGE_PATH_NOT_EXPORTED` (issues #2/#8, PR #9).
- `dsh-mesh` CLI: any subcommand accepts `--help`/`-h` and prints help instead of acting (`peer patch --help` no longer rewrites the overlay); `peer add` output now explains that the profile is not mounted automatically and that bare patch entries are silently ignored (issue #5).
- Public build: sanitize the `packages/dsh-mesh` (meta) copy with the same personal-device rules as `dsh-mesh-ui`; the rebuilt mirror no longer carries personal device labels.
- Public repo root now has a `package.json`, so `dsh plugin --profile web add github:LinYanZhi/dsh-mesh` installs the meta plugin (fixes dsh.so L5 install-inventory check on the next re-test).
- AI docs: rewritten `docs/INSTALL-FOR-AGENTS.md`, added `docs/AI-CHECKLIST.md`, `docs/AI-PROMPTS.md`, `docs/TROUBLESHOOTING.zh.md`, and `tools/ai-install.mjs`.
- Thanks to @wenyuwen2011 (issues #1–#5, PRs #6/#7), @blackll7 (issue #8) and @wyf115 (PR #9) for the detailed reports and patches; the fixes were merged into `main`. This project is a dev preview: `main` is the development board, no separate release gate.

## 2026-11-09 — 0.0.2

- `dsh-mesh-node@0.0.2`: tunnel status collection (self-hosted frps + Sakura account tunnels), stricter TLS/cluster handling, new `sakura-api.js` / `tunnels.js` core modules.
- `dsh-mesh-ui@0.0.2`: topology panel redesign — three-channel links (LAN / public relay / Sakura), relay server cards, device filtering, layout autofit and drag fixes.

## 2026-11-09 — 0.0.1

- First public release: `dsh-mesh-node@0.0.1`, `dsh-mesh-host@0.0.1`, `dsh-mesh-ui@0.0.1`, `dsh-mesh-autostart@0.0.1` (host/autostart later 0.0.2 with `dsh.bundle` manifests).

> 更早的历史（0.1.0+ 内部版本）来自私有仓，未公开。

