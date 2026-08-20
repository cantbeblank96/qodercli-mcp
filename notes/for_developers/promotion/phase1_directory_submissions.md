# Phase 1 — 目录收录素材包（即用文案）

> 状态追踪在 `project-context.md` 的 Channels 表。提交后回填 ⬜→✅ 并记日期。
> 合规：各平台 self-promotion 版规先读后发；PR 里按模板披露作者身份。

## 1. punkpeye/awesome-mcp-servers（最大列表）

- ✅ **2026-08-20 已提 PR：https://github.com/punkpeye/awesome-mcp-servers/pull/12527**
  （插在 Coding Agents 分区 djerok/glm-mcp 之后；标题带 🤖🤖🤖 走官方 agent 快速通道）
- 仓库：https://github.com/punkpeye/awesome-mcp-servers
- 流程：fork → 按 CONTRIBUTING 模板在合适分类（建议 Developer Tools / Coding Agents 相关分区）加一行 → PR。
- 条目文案（一行，照列表格式）：

```markdown
**[qodercli-mcp](https://github.com/cantbeblank96/qodercli-mcp)** - MCP server mode for Qoder CLI: delegate coding tasks to a local Qoder agent from any MCP client. Zero-config via `npx -y qodercli-mcp`; codex-style sandbox levels; verified permission semantics.
```

- PR 描述要点：填补缺口（codex 有官方 server 模式，qodercli 没有）；npm 已发布；MIT。

## 2. wong2/awesome-mcp-servers（华语圈）

- 仓库：https://github.com/wong2/awesome-mcp-servers
- ❌ **2026-08-20 实测：该仓库关闭了 fork PR（CreatePullRequest 权限拒绝）且 issues 关闭**，无提交通道。
  文案已备好，若日后重开可直接用；华语圈覆盖改由 Phase 3（V2EX/掘金/知乎）承担。
- 条目文案（备用）：

```markdown
- [qodercli-mcp](https://github.com/cantbeblank96/qodercli-mcp) - 给 Qoder CLI 补上 MCP server 模式：任意 MCP 客户端可把任务委托给本地 Qoder Agent，`npx -y qodercli-mcp` 零配置，权限语义实测文档化。
```

## 3. Smithery（smithery.ai）

- ✅ **2026-08-20 已发布：https://smithery.ai/servers/xukaiming1996/qodercli-mcp**
- 路径：stdio 服务器走 **MCPB bundle**（URL 通道只收远程 HTTP server）。
  流程：`npx -y @smithery/cli auth login`（浏览器授权）→ 打包 .mcpb（manifest.json + src + 生产依赖 node_modules）→
  `npx -y @smithery/cli mcp publish ./qodercli-mcp.mcpb -n xukaiming1996/qodercli-mcp`。
- manifest 要点：server.type=node，entry_point=src/index.js，mcp_config.command=node、args=["${__dirname}/src/index.js"]。
- 仓库根目录的 `smithery.yaml` 是旧爬虫格式，新平台已不读；保留无害。
- 描述文案（280 字符内）：

```
MCP server mode for Qoder CLI — delegate coding tasks to a local Qoder agent from any MCP client. Zero-config: npx -y qodercli-mcp. Codex-style sandbox/approval_policy, runtime model discovery, verified permission semantics.
```

## 4. Glama（glama.ai/mcp/servers）

- ✅ **2026-08-20 爬虫自动收录**：https://glama.ai/mcp/servers/cantbeblank96/qodercli-mcp
  （三工具全列出，分类 Coding Agents / Developer Tools，MIT）——无需手动提交。
- Short description：

```
Wraps qodercli (Qoder CLI) as an MCP server: any MCP client can delegate coding tasks to a local Qoder agent with structured results.
```

- Tags 建议：`cli`, `coding`, `agent`, `qoder`, `delegation`, `stdio`

## 5. MCP.so / PulseMCP（pulsemcp.com）

- MCP.so：2026-08-20 未收录；Submit 表单**仅 $39 付费通道**（无免费按钮），不花钱，等其 GitHub 爬虫自然收录。
- PulseMCP：2026-08-20 官网公告**提交暂停**（ingestion 重构，“until mid-August” 仍未恢复），搜索 0 结果；恢复后重试。
- 简介通用版（恢复后用）：

```
qodercli-mcp is the missing MCP server mode for Qoder CLI. It exposes three tools —
ask-qoder (delegate a task with codex-style sandbox levels), list-sessions (resume
multi-turn delegation), and list-models (runtime model discovery) — over MCP stdio.
Zero-config install: npx -y qodercli-mcp. Permission semantics are experimentally
verified and documented (e.g. dont_ask is read-only).
```

## 6. 官方 MCP Registry（modelcontextprotocol/registry）

- 流程：注册 https://registry.modelcontextprotocol.io（或向 modelcontextprotocol/registry 仓库提 PR），
  提交 server 元数据。核心字段：

```json
{
  "name": "io.github.cantbeblank96/qodercli-mcp",
  "description": "MCP server mode for Qoder CLI — delegate coding tasks to a local Qoder agent from any MCP client.",
  "repository": { "url": "https://github.com/cantbeblank96/qodercli-mcp", "source": "github" },
  "packages": [{
    "registry_name": "npm",
    "name": "qodercli-mcp",
    "version": "0.4.2",
    "runtime": "node",
    "transport": "stdio"
  }]
}
```

## 提交顺序建议（当天可完成）

1. punkpeye PR（流量最大，审核可能排队，先发）
2. 官方 Registry（审核制，早提交）
3. wong2 PR → Smithery → Glama → MCP.so/PulseMCP（表单类，10 分钟/个）
