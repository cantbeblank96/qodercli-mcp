# qodercli-mcp

**[English](./README.md)** | 简体中文

[![npm version](https://img.shields.io/npm/v/qodercli-mcp)](https://www.npmjs.com/package/qodercli-mcp)
[![npm weekly downloads](https://img.shields.io/npm/dw/qodercli-mcp?label=downloads%2Fweek)](https://www.npmjs.com/package/qodercli-mcp)
[![npm total downloads](https://img.shields.io/npm/dt/qodercli-mcp?label=总下载量)](https://www.npmjs.com/package/qodercli-mcp)
[![License: MIT](https://img.shields.io/github/license/cantbeblank96/qodercli-mcp)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/cantbeblank96/qodercli-mcp?style=social)](https://github.com/cantbeblank96/qodercli-mcp)

> **给 Qoder CLI 补上 MCP server 模式**：让任意 MCP 客户端把任务委托给本地 Qoder Agent。

一个极简的 MCP server，把本地的 `qodercli`（Qoder CLI）包装成 MCP 工具，让任意 MCP 客户端（Qoder IDE、Claude Code、Cursor 等）可以像调用子 Agent 一样调用 Qoder。

![demo](docs/demo.gif)

*30 秒演示：MCP 客户端 ⇄ qodercli-mcp ⇄ qodercli —— initialize → tools/list → list-models（真实输出，非加速）*

## Quick start / 快速开始

零配置：通过 npx 添加即可 —— 把下面这段加进你的 MCP 客户端配置（`~/.qoder/mcp.json`、`claude_desktop_config.json` 等）：

```json
{ "mcpServers": { "qodercli-mcp": { "command": "npx", "args": ["-y", "qodercli-mcp"] } } }
```

提供三个工具：

| 工具 | 用途 |
|---|---|
| `ask-qoder` | 把任务委托给 qodercli |
| `list-sessions` | 发现可续接的历史会话 |
| `list-models` | 运行时查询可用模型 |

亮点：**实测权限语义文档化**（见下方——如 `dont_ask` 是只读），codex 风格 `sandbox`/`approval_policy`，结构化输出（`session_id`/`duration_ms`/`total_credits`）。

完整配置见下方 [安装](#install)。

## Why / 为什么

部分 CLI Agent 自带官方 MCP server 模式（如 `codex mcp-server`），但 `qodercli` 目前只能作为 MCP **客户端**。本项目用一个薄包装层补上这个缺口：内部调用 `qodercli -p <prompt>`，把结果通过 MCP stdio 返回。

## Features / 功能

- `ask-qoder` 工具 —— 把任务委托给 qodercli
- 结构化输出（`session_id`、`is_error`、`duration_ms`、`total_credits`、`num_turns`），自动解析 `-o json`
- `list-sessions` 工具，用于发现可续接的会话
- `list-models` 工具，运行时发现可用模型（不依赖过时清单）
- `reasoning_effort` 参数（透传 `--reasoning-effort`）
- MCP initialize 结果携带服务器使用说明，引导客户端正确调用
- 仿 codex 的 `sandbox` 分级（`read-only` / `workspace-write` / `danger-full-access`）
- 系统提示注入（`system_prompt` / `append_system_prompt`）
- 支持指定工作目录、模型、权限模式、输出格式
- 支持会话续接（`resume_session_id`），可多轮委托
- 超时保护（超时自动 SIGKILL）
- 代理额度支持（`HTTP_PROXY` / `HTTPS_PROXY` 注入）
- 无需构建 —— 纯 ESM JavaScript，Node.js >= 18

## Prerequisites / 前置条件

1. Node.js >= 18
2. 已安装并登录 `qodercli`（执行 `qodercli login`）

## Install / 安装

**Option A — npx（推荐）**：无需克隆，MCP 客户端首次使用时自动下载：

```json
"command": "npx", "args": ["-y", "qodercli-mcp"]
```

**Option B — from source（开发用）**：

```bash
git clone https://github.com/cantbeblank96/qodercli-mcp.git
cd qodercli-mcp
npm install
```

## MCP client configuration / MCP 客户端配置

### Qoder IDE

添加到 `~/.qoder/mcp.json`。建议使用 `node` 的绝对路径并显式设置 `QODERCLI_PATH`（MCP 子进程的 PATH 中经常缺少 nvm 管理的二进制目录）：

> **代理支持**：要使用 Qoder CLI 代理额度，可在服务器的环境变量中添加 `HTTP_PROXY` 和/或 `HTTPS_PROXY`。当这些变量在 MCP 服务器级别设置时，它们会被传递到所有 qodercli 子进程。

```json
{
  "mcpServers": {
    "qodercli-mcp": {
      "command": "npx",
      "args": ["-y", "qodercli-mcp"],
      "env": {
        "QODERCLI_PATH": "/absolute/path/to/qodercli",
        "PATH": "/usr/local/bin:/usr/bin:/bin"
      }
    },
    "qodercli-mcp-with-proxy": {
      "command": "npx",
      "args": ["-y", "qodercli-mcp"],
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

使用本地源码（方式 B）的开发者请将 `command`/`args` 换成 `node` 绝对路径与 `/path/to/qodercli-mcp/src/index.js`（MCP 子进程的 PATH 中经常缺少 nvm 管理的二进制目录）。

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

| 参数 | 类型 | 说明 |
|---|---|---|
| `prompt` | string（必需） | 交给 qodercli 的任务或问题 |
| `cwd` | string | 工作目录 |
| `model` | string | 本次会话使用的模型，先用 `list-models` 查询 |
| `reasoning_effort` | string | 推理强度（`--reasoning-effort`），如 `low`/`medium`/`high`；取决于模型能力 |
| `permission_mode` | enum | `dont_ask`（默认，**只读**） \| `accept_edits`（自动批准文件编辑） \| `bypass_permissions`（完全权限，含 shell） \| `auto` \| `default`；与 `approval_policy` 互斥，推荐用 `sandbox` |
| `approval_policy` | enum | codex 风格：`untrusted`→只读 \| `on-request`→auto \| `never`→全开 |
| `sandbox` | enum | `read-only` \| `workspace-write` \| `danger-full-access`（codex 风格，控制实际权限级别） |
| `system_prompt` | string | 替换默认系统提示 |
| `append_system_prompt` | string | 追加系统提示 |
| `resume_session_id` | string | 续接之前的会话 |
| `output_format` | string | 透传给 `-o`（默认 `json`）。注意：非 json 格式会使结构化字段失效 |
| `extra_args` | string[] | 追加原始 CLI 参数；保留 flag 会被拒绝 |
| `timeout_ms` | number | 超时毫秒数，默认 600000 |

### Structured output / 结构化输出

`ask-qoder` 声明了 MCP `outputSchema`，除可读文本外还返回 `structuredContent` 对象：

```json
{
  "session_id": "77826b5c-...",   // 回传用于续接
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

| sandbox | 实际权限模式 | 对 qodercli 的效果 |
|---|---|---|
| （缺省） | `dont_ask` | 只读：需授权的工具调用被静默拒绝 |
| `read-only` | `dont_ask` | 额外禁用写/shell 工具，双保险 |
| `workspace-write` | `accept_edits` | 可在 `cwd` 创建/修改文件 |
| `danger-full-access` | `bypass_permissions` | 完全权限（含 shell） |

显式设置的 `permission_mode` / `approval_policy` 优先于 `sandbox`。

### Permission modes（实测语义）

| 模式 | 行为 |
|---|---|
| `dont_ask` | **只读**：静默拒绝一切需授权的工具调用；无头安全默认值 |
| `accept_edits` | 自动批准文件编辑 |
| `bypass_permissions` | 全部自动批准（含 shell） |
| `auto` | qodercli 自动策略 |
| `default` | 交互式确认，无头调用中应避免 |

## Tool: `list-sessions`

列出本地 qodercli 会话（序号、摘要、会话 ID），便于挑选 `resume_session_id`。无参数。

## Tool: `list-models`

列出 qodercli 当前支持的模型，供运行时选择有效的 `model` 值（不依赖过时知识）。返回文本清单和结构化 `models` 数组。无参数。

### Usage Examples / 使用示例

#### Example 1: Simple code explanation / 简单代码解释
```javascript
{ "name": "ask-qoder", "arguments": { 
  "prompt": "Explain what main.py does",
  "cwd": "/path/to/project",
  "timeout_ms": 180000 
}}
```

#### Example 2: Ask a second opinion / 获取第二意见
```javascript
{ "name": "ask-qoder", "arguments": { 
  "prompt": "@src/service.py Review this file for security issues and suggest improvements",
  "model": "qwen-plus",
  "permission_mode": "dont_ask",
  "timeout_ms": 300000 
}}
```

#### Example 3: Multi-turn conversation via resume / 多轮对话续接
```javascript
// 首次调用 —— session_id 会在 structuredContent 中返回
{ "name": "ask-qoder", "arguments": {
  "prompt": "Help me refactor this module to improve readability",
  "cwd": "/projects/backend",
  "timeout_ms": 300000 
}}
// 然后把 structuredContent.session_id 回传：
{ "name": "ask-qoder", "arguments": {
  "prompt": "Now add error handling for database timeouts",
  "resume_session_id": "77826b5c-cd6b-4213-b423-d95b4e1deab0"
}}
// 或用 list-sessions 查找历史会话 ID
{ "name": "list-sessions", "arguments": {} }
```

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

#### Example 5: Read-only analysis / 只读分析
```javascript
{ "name": "ask-qoder", "arguments": {
  "prompt": "Audit this codebase for security issues; do not modify anything",
  "cwd": "/workspaces/repo",
  "sandbox": "read-only",
  "timeout_ms": 300000 
}}
```

#### Example 6: Project-wide analysis / 项目范围分析
```javascript
{ "name": "ask-qoder", "arguments": {
  "prompt": "Summarize the architecture of this project and identify key modules",
  "cwd": "/workspaces/repo",
  "timeout_ms": 420000,
  "model": "qwen-plus"
}}
```

### Best Practices / 最佳实践

1. **Specify working directory** — 操作特定项目时务必指定 `cwd`
2. **Use timeout protection** — 复杂任务设置 `timeout_ms`（建议 5–10 分钟），避免挂起
3. **Resume for multi-turn** — 后续追问用 `resume_session_id` 续接会话，避免重复上下文
4. **Model selection** — 先调 `list-models` 查询当前可用模型；深度分析建议选择大模型
5. **Permission mode** — 服务器默认只读（`dont_ask`）；个人部署可用 `QODERCLI_DEFAULT_PERMISSION_MODE=bypass_permissions` 将全开（YOLO）设为默认。单次调用：需要改文件设 `sandbox: "workspace-write"`，需要 shell 用 `danger-full-access`；勿与显式 `permission_mode` 混用（后者优先生效）

## Environment variables / 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `QODERCLI_PATH` | `qodercli` | qodercli 二进制路径 |
| `QODERCLI_TIMEOUT_MS` | `600000` | 默认超时 |
| `QODERCLI_MAX_OUTPUT_MB` | `50` | 单次调用输出上限（MB，防 OOM） |
| `QODERCLI_DEFAULT_PERMISSION_MODE` | `dont_ask` | 调用方未指定权限参数时的默认模式；设 `bypass_permissions` 即全开（YOLO） |
| `HTTP_PROXY` | - | qodercli 的 HTTP 代理地址 |
| `HTTPS_PROXY` | - | qodercli 的 HTTPS 代理地址 |

## Development / 开发

```bash
npm test        # smoke test: 协议握手 + 工具调用测试
node src/index.js   # 手动运行 server（stdio）
```

## Disclaimer / 免责声明

本项目为非官方第三方工具，与 Qoder 官方无关。请谨慎使用 `bypass_permissions` 权限模式——委托的任务可能修改目标工作目录中的文件。

## License

MIT
