# 实测语义与踩坑库（Semantics & Pitfalls）

> 本文所有语义结论均来自**真实对照实验**（spawn 子进程写文件/shell 观察行为），不是文档猜测。
> 修改权限/沙箱相关逻辑前必读；新增结论请先做对照实验再写入。

## 1. qodercli 权限模式实测语义

| 模式 | 实测行为 | 无头可用性 |
|---|---|---|
| `dont_ask` | **只读**：静默拒绝一切需要授权的工具调用（写文件、shell 全拒） | ✅ 安全但只读 |
| `accept_edits` | 自动批准文件编辑 | ✅ 改文件任务 |
| `bypass_permissions` | 全部批准，含任意 shell（YOLO） | ✅ 全开 |
| `default` | 交互式确认 | ❌ 无头会卡死 |
| `auto` | qodercli 自身自动策略 | ✅ |

**最大坑**：`dont_ask` 名字像“别问直接干”，实际是“别问直接**拒**”。v0.4.0 之前我们把它当保守无头模式，
用户实测发现委托任务被静默拒绝（agent 回复“处于 Don't ask 只读权限模式”）。

## 2. sandbox / approval_policy 映射（v0.4.0+）

| sandbox | 映射权限 | 附加 |
|---|---|---|
| `read-only` | dont_ask | 追加 `--disallowed-tools write_file,replace,run_shell_command`（双保险；显式 permission_mode/approval_policy 存在时不追加） |
| `workspace-write` | accept_edits | - |
| `danger-full-access` | bypass_permissions | - |
| （缺省） | DEFAULT（env 可配，上游默认 dont_ask） | - |

| approval_policy（codex 风格） | 映射 |
|---|---|
| `untrusted` | dont_ask |
| `on-request` | auto（无头无法交互询问，故不映射 default） |
| `never` | bypass_permissions |

**优先级链**：`permission_mode` > `approval_policy` > `sandbox` > 默认。
坑：同时传 `permission_mode: dont_ask` + `sandbox: workspace-write` 时前者生效 → 又变只读。
README 与 schema description 均明确“勿混用”。

## 3. 安全加固相关

- `RESERVED_EXTRA_ARGS` 黑名单：`-p --print -o --output-format -r --resume -m --model -w --cwd --permission-mode --system-prompt --append-system-prompt`。
  目的：防 prompt 注入通过 extra_args 提权/改模型/改系统提示。handler 前置校验，命中即报错。
- `permission_mode` 与 `approval_policy` 互斥校验。
- 输出上限：stdout/stderr 各自按字节计数，超 `QODERCLI_MAX_OUTPUT_MB`（默认 50）SIGKILL + `truncated=true`，保护长驻 server 不 OOM。

## 4. CLI 细节坑

- `qodercli -p` 是**布尔 flag**（--print），prompt 是**位置参数**。外部 reviewer 曾误报“参数顺序错”，复核为误报——别“修”。
- `--list-models` 输出含表头行 `MODEL`，解析时要过滤。
- qodercli 二进制 strings 里 grep 不到权限模式说明文本——语义只能靠行为实验。

## 5. MCP 生态坑

- **客户端 schema 缓存**：Qoder 会把 tools schema 缓存到
  `~/.config/Qoder/SharedClientCache/projects/<proj>/mcps/qodercli-mcp/tools/*.json`。
  server 升级后不重载 MCP，LLM 看到的是旧描述（曾导致 v0.3.0 缓存滞后到 v0.4.0 才刷新）。
  发版后必须提醒用户重载。
- `initialize` 的 `instructions` 是除 schema description 外的第二信息通道，权限提示要放进去并随默认模式动态变化。

## 6. npm 发布坑

- 账号开 2FA 后 `npm publish` 必须 2FA 验证：CLI 打印 `Authenticate your account at: https://www.npmjs.com/auth/cli/<uuid>`，
  维护者浏览器点按 **Security Key** 授权（维护者偏好此方式）。
- **Security Key 无法生成 6 位 OTP**，终端里给不了 `--otp`；备选是 granular token + bypass-2FA（维护者不偏好）。
- `npm publish --token xxx` 的 `--token` 已被废弃为 `--token-description`，传了等于没传认证。
- 发布前确认 `bin` 入口文件有 shebang（`#!/usr/bin/env node`），否则 npx 无法直接执行。

## 7. 测试与额度

- E2E 测试消耗 Qoder 额度（观测 0.5–7 credits/次），且需 `HTTP_PROXY/HTTPS_PROXY` 走代理额度；
  额度用尽时 E2E 会失败——先查额度再怀疑代码。
- 协议测试（`npm test`）免费，CI/日常随便跑。

## 8. 方法论（本项目验证有效的做法）

1. **外部 reviewer 结论逐条实证复核**：曾有 M1 级误报（参数顺序），也有真问题（权限语义）；复核后才修。
2. **语义性变更先做最小对照实验**（accept_edits vs dont_ask 写文件），再改代码与文档。
3. **文档与 schema 同步**：README 表、schema description、instructions 三处同改，避免信息漂移。
