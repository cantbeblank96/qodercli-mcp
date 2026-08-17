# qodercli-mcp

> A minimal MCP server that wraps [qodercli](https://qoder.com/cli) (Qoder CLI), letting any MCP client delegate coding tasks to a local Qoder agent.

一个极简的 MCP server，把本地的 qodercli（Qoder CLI）包装成 MCP 工具，让任意 MCP 客户端（Qoder IDE、Claude Code、Cursor 等）可以像调用子 Agent 一样调用 Qoder。

## Why / 为什么

Some CLI agents ship an official MCP server mode (e.g. `codex mcp-server`), but `qodercli` currently only acts as an MCP **client**. This project fills that gap with a thin wrapper: it spawns `qodercli -p <prompt>` under the hood and streams the result back over MCP stdio.

部分 CLI Agent 自带官方 MCP server 模式（如 `codex mcp-server`），但 qodercli 目前只能作为 MCP **客户端**。本项目用一个薄包装层补上这个缺口：内部调用 `qodercli -p <prompt>`，把结果通过 MCP stdio 返回。

## Features / 功能

- Single tool `ask-qoder` — delegate a prompt to qodercli
- 单一工具 `ask-qoder` —— 把任务委托给 qodercli
- Structured output (`session_id`, `is_error`, `duration_ms`, `total_credits`, `num_turns`) via `-o json` parsing
- 结构化输出（`session_id`、`is_error`、`duration_ms`、`total_credits`、`num_turns`），自动解析 `-o json`
- `list-sessions` tool to discover resumable sessions
- `list-sessions` 工具，用于发现可续接的会话
- Codex-style `sandbox` levels (`read-only` / `workspace-write` / `danger-full-access`)
- 仿 codex 的 `sandbox` 分级（`read-only` / `workspace-write` / `danger-full-access`）
- System prompt injection (`system_prompt` / `append_system_prompt`)
- 系统提示注入（`system_prompt` / `append_system_prompt`）
- Working directory, model, permission mode, output format control
- 支持指定工作目录、模型、权限模式、输出格式
- Session resume (`resume_session_id`) for multi-turn delegation
- 支持会话续接（`resume_session_id`），可多轮委托
- Timeout protection with SIGKILL fallback
- 超时保护（超时自动 SIGKILL）
- Proxy quota support (`HTTP_PROXY` / `HTTPS_PROXY` injection)
- 代理额度支持（`HTTP_PROXY` / `HTTPS_PROXY` 注入）
- Zero build step — plain ESM JavaScript, Node.js >= 18
- 无需构建 —— 纯 ESM JavaScript，Node.js >= 18

## Prerequisites / 前置条件

1. Node.js >= 18
2. `qodercli` installed and signed in (`qodercli login`)

## Install / 安装

```bash
git clone https://github.com/your-username/qodercli-mcp.git
cd qodercli-mcp
npm install
```

## MCP client configuration / MCP 客户端配置

### Qoder IDE

Add to `~/.qoder/mcp.json`. Prefer the absolute path of `node` and set `QODERCLI_PATH` explicitly (nvm-managed binaries are often missing from the PATH seen by MCP child processes):

> **Proxy Support**: To use your Qoder CLI proxy quota, add `HTTP_PROXY` and/or `HTTPS_PROXY` to the server's environment. When these are set at the MCP server level, they will be passed to all qodercli subprocesses.

添加到 `~/.qoder/mcp.json`。建议使用 `node` 的绝对路径并显式设置 `QODERCLI_PATH`（MCP 子进程的 PATH 中经常缺少 nvm 管理的二进制目录）：

> **代理支持**：要使用 Qoder CLI 代理额度，可在服务器的环境变量中添加 `HTTP_PROXY` 和/或 `HTTPS_PROXY`。当这些变量在 MCP 服务器级别设置时，它们会被传递到所有 qodercli 子进程。

```json
{
  "mcpServers": {
    "qodercli-mcp": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/qodercli-mcp/src/index.js"],
      "env": {
        "QODERCLI_PATH": "/absolute/path/to/qodercli",
        "PATH": "/usr/local/bin:/usr/bin:/bin"
      }
    },
    "qodercli-mcp-with-proxy": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/qodercli-mcp/src/index.js"],
      "env": {
        "QODERCLI_PATH": "/absolute/path/to/qodercli",
        "HTTP_PROXY": "http://127.0.0.1:39900",
        "HTTPS_PROXY": "http://127.0.0.1:39900",
        "PATH": "/usr/local/bin:/usr/bin:/bin"
      }
    }
  }
}
```

### Claude Code / Claude Desktop

```json
{
  "mcpServers": {
    "qodercli-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/qodercli-mcp/src/index.js"],
      "env": {
        "QODERCLI_PATH": "/absolute/path/to/qodercli"
      }
    }
  }
}
```

## Tool: `ask-qoder`

| Parameter | Type | Description |
|---|---|---|
| `prompt` | string (required) | The task or question for qodercli / 交给 qodercli 的任务或问题 |
| `cwd` | string | Working directory / 工作目录 |
| `model` | string | Model for this session / 本次会话使用的模型 |
| `permission_mode` | enum | `default` \| `accept_edits` \| `bypass_permissions` \| `dont_ask` (default) \| `auto`; mutually exclusive with `approval_policy` / 与 `approval_policy` 互斥 |
| `approval_policy` | enum | codex-style: `untrusted` \| `on-request` \| `never` (mapped to qodercli permission modes) / 仿 codex 审批策略，自动映射 |
| `sandbox` | enum | `read-only` \| `workspace-write` \| `danger-full-access` (codex-style) |
| `system_prompt` | string | Replace the default system prompt / 替换默认系统提示 |
| `append_system_prompt` | string | Append instructions to the default system prompt / 追加系统提示 |
| `resume_session_id` | string | Resume a previous session / 续接之前的会话 |
| `output_format` | string | Passed to `-o` (default `json`) / 透传给 `-o`（默认 `json`）。Note: non-json formats degrade structured output (`session_id` etc. become unavailable) / 非 json 格式会使结构化字段失效 |
| `extra_args` | string[] | Raw CLI args appended before the prompt; reserved flags (permission mode, system prompt, model, `-o`, `-r`, `-w`...) are rejected / 追加原始 CLI 参数；保留 flag 会被拒绝 |
| `timeout_ms` | number | Timeout in ms, default 600000 / 超时毫秒数，默认 600000 |

### Structured output / 结构化输出

`ask-qoder` declares an MCP `outputSchema` and returns, in addition to the
human-readable text, a `structuredContent` object:

`ask-qoder` 声明了 MCP `outputSchema`，除可读文本外还返回 `structuredContent` 对象：

```json
{
  "session_id": "77826b5c-...",   // pass back as resume_session_id / 回传用于续接
  "content": "OK",
  "is_error": false,
  "exit_code": 0,
  "duration_ms": 1280,
  "total_credits": 0.53,
  "num_turns": 1,
  "timed_out": false,
  "truncated": false
}
```

### Sandbox mapping / 沙箱映射

| sandbox | Effect on qodercli / 对 qodercli 的效果 |
|---|---|
| `read-only` | Adds `--disallowed-tools write_file,replace,run_shell_command` (blocks writes & shell) / 禁用写文件与 shell 工具 |
| `workspace-write` | Default behavior / 默认行为 |
| `danger-full-access` | Implies `--permission-mode bypass_permissions` unless `permission_mode`/`approval_policy` is set / 未显式设置 permission_mode 或 approval_policy 时等价 bypass_permissions |

## Tool: `list-sessions`

Lists local qodercli sessions (index, summary, session id) so a client can
pick a `resume_session_id`. Takes no arguments.

列出本地 qodercli 会话（序号、摘要、会话 ID），便于挑选 `resume_session_id`。无参数。

### Usage Examples / 使用示例

#### Example 1: Simple code explanation / 简单代码解释
```javascript
{ "name": "ask-qoder", "arguments": { 
  "prompt": "Explain what main.py does",
  "cwd": "/path/to/project",
  "timeout_ms": 180000 
}}
```
结果会返回一段自然语言解释，帮助理解文件功能。

#### Example 2: Ask a second opinion / 获取第二意见
```javascript
{ "name": "ask-qoder", "arguments": { 
  "prompt": "@src/service.py Review this file for security issues and suggest improvements",
  "model": "qwen-plus",
  "permission_mode": "dont_ask",
  "timeout_ms": 300000 
}}
```
Qoder 会给出安全建议和改进方案。

#### Example 3: Multi-turn conversation via resume / 多轮对话续接
```javascript
// First call — session_id comes back in structuredContent
// 首次调用 —— session_id 会在 structuredContent 中返回
{ "name": "ask-qoder", "arguments": {
  "prompt": "Help me refactor this module to improve readability",
  "cwd": "/projects/backend",
  "timeout_ms": 300000 
}}
// Then reuse structuredContent.session_id:
// 然后把 structuredContent.session_id 回传：
{ "name": "ask-qoder", "arguments": {
  "prompt": "Now add error handling for database timeouts",
  "resume_session_id": "77826b5c-cd6b-4213-b423-d95b4e1deab0"
}}
// Or discover ids with list-sessions / 或用 list-sessions 查找历史会话 ID
{ "name": "list-sessions", "arguments": {} }
```
通过 `resume_session_id` 可实现多轮交互式迭代优化。

#### Example 4: Code review with specific focus / 针对性代码审查
```javascript
{ "name": "ask-qoder", "arguments": {
  "prompt": "Analyze performance bottlenecks in utils.py",
  "model": "qwen-max",
  "permission_mode": "default",
  "output_format": "text",
  "timeout_ms": 240000 
}}
```
适合性能分析和优化建议场景。

#### Example 5: Read-only analysis / 只读分析
```javascript
{ "name": "ask-qoder", "arguments": {
  "prompt": "Audit this codebase for security issues; do not modify anything",
  "cwd": "/workspaces/repo",
  "sandbox": "read-only",
  "timeout_ms": 300000 
}}
```
`read-only` 会禁用写文件与 shell 工具，适合审计/评审场景。

#### Example 6: Project-wide analysis / 项目范围分析
```javascript
{ "name": "ask-qoder", "arguments": {
  "prompt": "Summarize the architecture of this project and identify key modules",
  "cwd": "/workspaces/repo",
  "timeout_ms": 420000,
  "model": "qwen-plus"
}}
```
适用于大型项目快速梳理和架构理解。

### Best Practices / 最佳实践

1. **Specify working directory** — Always pass `cwd` when operating on a specific project
   操作特定项目时务必指定 `cwd`
2. **Use timeout protection** — For complex prompts, set explicit `timeout_ms` shorter than 60min
   复杂任务设置 `timeout_ms`（建议 5–10 分钟），避免挂起
3. **Resume for multi-turn** — Chain follow-ups via `resume_session_id` instead of repeating context
   后续追问用 `resume_session_id` 续接会话，避免重复上下文
4. **Model selection** — Larger models like `qwen-plus` or `qwen-max` are better for deep analysis
   深度分析建议使用 `qwen-plus` / `qwen-max` 等大模型
5. **Permission mode** — the server default `dont_ask` is a conservative headless mode suitable for most delegated analysis; only escalate to `accept_edits`/`bypass_permissions` when the task must edit files or run commands
   服务器默认 `dont_ask` 是适合多数委托分析的保守无头模式；仅当任务需要改文件或跑命令时才升级到 `accept_edits`/`bypass_permissions`

## Environment variables / 环境变量

| Variable | Default | Description |
|---|---|---|
| `QODERCLI_PATH` | `qodercli` | Path to the qodercli binary / qodercli 二进制路径 |
| `QODERCLI_TIMEOUT_MS` | `600000` | Default timeout / 默认超时 |
| `QODERCLI_MAX_OUTPUT_MB` | `50` | Per-call stdout/stderr cap in MB (OOM protection) / 单次调用输出上限（MB，防 OOM） |
| `HTTP_PROXY` | - | HTTP proxy URL for qodercli / qodercli 的 HTTP 代理地址 |
| `HTTPS_PROXY` | - | HTTPS proxy URL for qodercli / qodercli 的 HTTPS 代理地址 |

## Development / 开发

```bash
npm test        # smoke test: protocol handshake + tool invocation
node src/index.js   # run the server manually (stdio)
```

## Disclaimer / 免责声明

This is an unofficial, third-party tool. It is not affiliated with, endorsed, or sponsored by Qoder. Use `permission_mode: bypass_permissions` with care — delegated prompts may modify files in the target working directory.

本项目为非官方第三方工具，与 Qoder 官方无关。请谨慎使用 `bypass_permissions` 权限模式——委托的任务可能修改目标工作目录中的文件。

## License

MIT
