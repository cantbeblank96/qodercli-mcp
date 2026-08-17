# qodercli-mcp

> A minimal MCP server that wraps [qodercli](https://qoder.com/cli) (Qoder CLI), letting any MCP client delegate coding tasks to a local Qoder agent.

一个极简的 MCP server，把本地的 qodercli（Qoder CLI）包装成 MCP 工具，让任意 MCP 客户端（Qoder IDE、Claude Code、Cursor 等）可以像调用子 Agent 一样调用 Qoder。

## Why / 为什么

Some CLI agents ship an official MCP server mode (e.g. `codex mcp-server`), but `qodercli` currently only acts as an MCP **client**. This project fills that gap with a thin wrapper: it spawns `qodercli -p <prompt>` under the hood and streams the result back over MCP stdio.

部分 CLI Agent 自带官方 MCP server 模式（如 `codex mcp-server`），但 qodercli 目前只能作为 MCP **客户端**。本项目用一个薄包装层补上这个缺口：内部调用 `qodercli -p <prompt>`，把结果通过 MCP stdio 返回。

## Features / 功能

- Single tool `ask-qoder` — delegate a prompt to qodercli
- 单一工具 `ask-qoder` —— 把任务委托给 qodercli
- Working directory, model, permission mode, output format control
- 支持指定工作目录、模型、权限模式、输出格式
- Session resume (`resume_session_id`) for multi-turn delegation
- 支持会话续接（`resume_session_id`），可多轮委托
- Timeout protection with SIGKILL fallback
- 超时保护（超时自动 SIGKILL）
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

添加到 `~/.qoder/mcp.json`。建议使用 `node` 的绝对路径并显式设置 `QODERCLI_PATH`（MCP 子进程的 PATH 中经常缺少 nvm 管理的二进制目录）：

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
| `permission_mode` | enum | `default` \| `accept_edits` \| `bypass_permissions` \| `dont_ask` (default) \| `auto` |
| `resume_session_id` | string | Resume a previous session / 续接之前的会话 |
| `output_format` | string | Passed to `-o` (e.g. `text`, `json`) / 透传给 `-o` |
| `extra_args` | string[] | Raw CLI args appended before the prompt / 追加的原始 CLI 参数 |
| `timeout_ms` | number | Timeout in ms, default 600000 / 超时毫秒数，默认 600000 |

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
// First call
{ "name": "ask-qoder", "arguments": {
  "prompt": "Help me refactor this module to improve readability",
  "cwd": "/projects/backend",
  "timeout_ms": 300000 
}}
// Get session_id from response, then:
{ "name": "ask-qoder", "arguments": {
  "prompt": "Now add error handling for database timeouts",
  "resume_session_id": "session-xyz-abc-123"
}}
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

#### Example 5: Sandbox testing / 沙盒测试
```javascript
{ "name": "ask-qoder", "arguments": {
  "prompt": "Create a Python script that processes CSV data and generate charts",
  "extra_args": ["-s"], // -s triggers sandbox mode in newer qodercli versions
  "timeout_ms": 180000 
}}
```
注意：`-s` 标志需要较新版本的 qodercli 支持，且沙盒环境可能受限。

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
5. **Permission mode** — `dont_ask` is safest for read-only analysis; use `bypass_permissions` with caution
   `dont_ask` 适合只读分析；慎用 `bypass_permissions`

## Environment variables / 环境变量

| Variable | Default | Description |
|---|---|---|
| `QODERCLI_PATH` | `qodercli` | Path to the qodercli binary / qodercli 二进制路径 |
| `QODERCLI_TIMEOUT_MS` | `600000` | Default timeout / 默认超时 |
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
