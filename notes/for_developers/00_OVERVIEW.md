# qodercli-mcp 开发者总览（Developer Overview）

> 面向接手本项目的开发者/agent。读完本文 + `01_DEVELOPMENT.md` 即可开始改代码；
> `02_SEMANTICS_PITFALLS.md` 是实测语义与踩坑库；`03_PROMOTION_PLAYBOOK.md` 是开源推广手册。

## 1. 项目定位

qodercli-mcp 是一个**极简 MCP server**，把本地 `qodercli`（Qoder CLI）包装成 MCP 工具，
让任意 MCP 客户端（Qoder IDE、Claude Code、Cursor 等）可以像调用子 Agent 一样调用 Qoder。

- **缺口**：部分 CLI agent 自带官方 MCP server 模式（如 `codex mcp-server`），但 qodercli 只能作为 MCP **客户端**。本项目用薄包装层补上缺口。
- **实现**：内部 spawn `qodercli -p <prompt> ...`，解析 `-o json` 输出，经 MCP stdio 返回结构化结果。

## 2. 公开资产

| 资产 | 地址 / 值 |
|---|---|
| GitHub | https://github.com/cantbeblank96/qodercli-mcp （Public，默认分支 main） |
| npm | https://www.npmjs.com/package/qodercli-mcp （包名 `qodercli-mcp`，`npx -y qodercli-mcp` 可直接运行） |
| Topics | ai-agent, cli-agent, llm-agent, mcp, model-context-protocol, nodejs, qoder, stdio |
| License | MIT |
| 运行时 | Node.js >= 18，纯 ESM，**无构建步骤** |
| 依赖 | `@modelcontextprotocol/sdk ^1.12.0`、`zod ^3.23.8` |

## 3. 仓库结构

```
qodercli-mcp/
├── src/index.js          # 单文件 server（全部逻辑，约 500 行）
├── test/smoke.test.js    # 协议测试（免费）+ E2E 测试（QODERCLI_MCP_E2E=1，消耗额度）
├── package.json          # bin: qodercli-mcp -> src/index.js（带 shebang，npx 可用）
├── README.md             # 双语（EN/CN）文档，含权限语义表与最佳实践
├── LICENSE               # MIT
└── notes/for_developers/ # 本目录：接手文档
```

## 4. 对外工具面（3 个 MCP tools）

| Tool | 作用 | 关键参数 |
|---|---|---|
| `ask-qoder` | 委托任务给 qodercli | `prompt`(必填)、`cwd`、`model`、`reasoning_effort`、`sandbox`、`permission_mode`、`approval_policy`、`system_prompt`/`append_system_prompt`、`resume_session_id`、`extra_args`、`timeout_ms`、`output_format` |
| `list-sessions` | 发现可续接的历史会话 | - |
| `list-models` | **运行时**解析 `qodercli --list-models`，返回当前可用模型（不硬编码、不过时） | - |

结构化输出字段：`content`、`session_id`、`is_error`、`timed_out`、`truncated`、`exit_code`、`duration_ms`、`num_turns`、`total_credits`。

## 5. 核心设计原则（改代码时请遵守）

1. **薄包装**：不重新实现 agent 逻辑，只做进程编排与协议转换。
2. **运行时发现优于硬编码**：模型清单等易变信息一律运行时查询（`list-models`）。
3. **实测语义必须文档化**：qodercli 的权限模式语义靠对照实验确证（见 02 文档），README 与 schema description 同步维护。
4. **安全默认 + 环境变量覆盖**：上游默认只读（`dont_ask`）；个人部署用 `QODERCLI_DEFAULT_PERMISSION_MODE=bypass_permissions` 全开。
5. **防注入提权**：`extra_args` 有保留 flag 黑名单，禁止通过它覆盖权限/模型/系统提示。
6. **双语文档**：README 与用户可见描述保持 EN/CN 双语。

## 6. 版本历史（commit → 变更）

| 版本 | commit | 内容 |
|---|---|---|
| v0.1 | `aea7efe` | HTTP_PROXY/HTTPS_PROXY 注入子进程（代理额度） |
| v0.2.0 | `675d6bd` | 结构化输出、sandbox 分级、系统提示注入、list-sessions |
| v0.2.1 | `f048e83` | 外部评审加固：输出上限（OOM 保护）、extra_args 黑名单、互斥校验、approval_policy |
| v0.3.0 | `9a9cdc5` | list-models 运行时模型发现、reasoning_effort、initialize instructions |
| v0.4.0 | `4d02a86` | **权限语义修正**：dont_ask 实为只读；sandbox 真正驱动权限模式 |
| v0.4.1 | `b035d67` | `QODERCLI_DEFAULT_PERMISSION_MODE` 可配置默认权限（YOLO 默认） |
| - | `8d1a255` | 仓库占位符替换为真实 GitHub 地址 |
| v0.4.2 | `e4458f7` | npx 安装方式作为推荐路径；配置示例改用 npx |
| v0.4.3 | `ea41963` | 官方 MCP Registry 收录：package.json 加 `mcpName`（registry 所有权验证必需） |

## 7. 本机部署现状（维护者机器）

- `~/.qoder/mcp.json` 中 qodercli-mcp 走 **npx**：`command: <nvm>/npx, args: ["-y","qodercli-mcp"]`，
  env 含 `QODERCLI_PATH`、`QODERCLI_DEFAULT_PERMISSION_MODE=bypass_permissions`、`HTTP(S)_PROXY=http://127.0.0.1:39900`、含 nvm bin 的 `PATH`。
- 因此**本地源码改动不会自动生效**（npx 跑的是已发布版本）。开发迭代时把 command/args 换回
  `node <repo>/src/index.js`（见 01 文档），发版后再切回 npx。
