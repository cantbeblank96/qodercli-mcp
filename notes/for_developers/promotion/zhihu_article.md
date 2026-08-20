# 【qodercli-mcp】给 Qoder CLI 补上 MCP server 模式：让任意 MCP 客户端委托编码任务

我最近遇到一个很具体的问题：团队里有人用 Qoder IDE，有人用 Claude Code，有人用 Cursor——它们都是 MCP 客户端，但**彼此之间没法委托任务**。Codex 有官方的 MCP server 模式（`codex mcp-server`），任何 MCP 客户端都能把编码任务委托给它；而 Qoder CLI（qodercli）目前只能当 MCP **客户端**，没有 server 模式。

于是我写了 **qodercli-mcp**：一个约 500 行的薄包装层，给 Qoder CLI 补上 MCP server 模式。现在任意 MCP 客户端都能像调用子 Agent 一样，把编码任务委托给本地的 Qoder Agent。

## 它实际能解决什么

- **多客户端委托**：Qoder IDE（本地）把任务委托给另一个环境里的 Qoder Agent，反之亦然。编辑器、CI、终端脚本都能成为"发包方"。
- **多轮续接**：通过 `resume_session_id` 续接之前的会话，不用每次重复上下文，适合"先重构、再补错误处理"这种链式任务。
- **运行时模型发现**：`list-models` 工具返回目标机器上**当前真实可用**的模型清单，不依赖过时的模型列表知识。

## 三个工具，各管一件事

- `ask-qoder`：委托任意编码任务——解释代码、安全审查、重构模块、架构梳理，都交给它。
- `list-sessions`：列出本地可续接的历史会话，挑一个 `resume_session_id` 继续干。
- `list-models`：运行时查询可用模型，先查再选，避免"模型名写错直接报错"。

安装是零配置的：

```json
{ "mcpServers": { "qodercli-mcp": { "command": "npx", "args": ["-y", "qodercli-mcp"] } } }
```

把这段加进任意 MCP 客户端的配置（`~/.qoder/mcp.json`、`claude_desktop_config.json` 等）即可，无需克隆仓库。

## 做这个项目最值钱的发现：权限语义不能靠猜

包装 CLI Agent 最难的不是协议，而是**权限模式到底意味着什么**。我做了对照实验（spawn 子进程、观察写文件/shell 的真实行为），结论和直觉相反：

- `dont_ask`（默认）：**不是** "YOLO 全开"，而是**只读**——需要授权的工具调用被静默拒绝。名字像"别问直接干"，实际是"别问直接拒"。
- `accept_edits`：自动批准文件编辑，shell 仍受策略约束。
- `bypass_permissions`：全开（含任意 shell），个人部署才建议用。

这些语义都带实验证据写进了 README。委托型 Agent 工具如果靠猜权限配置，是可能删你文件的——这个坑值得所有做 Agent 编排的人知道。

## 生态现状

项目已发布到 npm（`npx -y qodercli-mcp`），收录进官方 MCP Registry、Smithery、Glama，MIT 许可，单文件纯 ESM、Node.js >= 18、无构建步骤。

## 最后

这是我的个人项目，与 Qoder 官方无关。如果你也在做"MCP 客户端互相委托"这类编排，或者对委托型 Agent 的默认权限语义有想法，欢迎评论区聊聊：你会希望一个委托型 server 默认强制哪种权限？

项目地址与完整文档见 GitHub：cantbeblank96/qodercli-mcp（链接在评论区置顶）。
