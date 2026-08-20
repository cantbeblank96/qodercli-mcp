# Project Context (for promotion skills)

> 供 .agents/skills/ 下的推广 skill 读取的项目上下文。不属于 npm 包（package.json files 白名单不含本文件）。
> Usage notes in 03_PROMOTION_PLAYBOOK.md: fill this first, then run skills.

## Product / 产品

- **Name**: qodercli-mcp
- **One-liner (EN)**: The missing MCP server mode for Qoder CLI — delegate coding tasks to local Qoder agents from any MCP client.
- **One-liner (CN)**: 给 Qoder CLI 补上 MCP server 模式：让任意 MCP 客户端把任务委托给本地 Qoder Agent。
- **Category**: Developer tool / MCP server / AI agent infrastructure
- **License**: MIT | **Runtime**: Node.js >= 18, zero build step
- **GitHub**: https://github.com/cantbeblank96/qodercli-mcp
- **npm**: https://www.npmjs.com/package/qodercli-mcp (`npx -y qodercli-mcp`)

## Problem & Gap Narrative / 缺口叙事

Some CLI agents ship an official MCP server mode (e.g. `codex mcp-server`), but
qodercli only acts as an MCP **client**. qodercli-mcp fills that gap with a thin,
auditable wrapper (~500 lines, single file): spawn `qodercli -p <prompt>`, parse
`-o json`, return structured results over MCP stdio.

## Audience / 受众

1. MCP client users (Qoder IDE, Claude Code, Cursor, Windsurf…) who want to delegate sub-tasks to a local Qoder agent.
2. Multi-agent orchestrators needing a codex-style interface (`sandbox` / `approval_policy`) to Qoder.
3. CN developer community (V2EX / 掘金 / 知乎) — maintainer is bilingual; CN content is first-class.

## Differentiators / 差异化卖点（文案反复打）

1. `npx -y qodercli-mcp` — zero-config, works today.
2. **Verified permission semantics, documented** — e.g. `dont_ask` is actually *read-only* (silently denies writes); we proved it with controlled experiments. Only doc of its kind.
3. Runtime model discovery (`list-models`) — never a stale model list.
4. Codex-style `sandbox` / `approval_policy` params — low migration cost for codex users.
5. Security hardening: reserved-flag blacklist on `extra_args` (anti prompt-injection privilege escalation), output size cap (OOM protection), mutually exclusive permission params.

## Keywords / 关键词

EN: MCP server, Model Context Protocol, Qoder CLI, AI agent delegation, sub-agent,
LLM coding agent, stdio MCP, npx MCP server, agent orchestration.
CN: MCP 服务器、Qoder CLI、AI Agent 委托、子代理、CLI Agent、模型上下文协议.

## Proof points / 可信素材

- Permission semantics table derived from controlled experiments (README "verified semantics" section).
- Structured output: session_id, duration_ms, total_credits, num_turns, is_error, timed_out, truncated.
- Session resume for multi-turn delegation.

## Tone / 调性

- Technical, precise, no hype; show commands and real output.
- Bilingual EN/CN for all public copy where the platform allows.
- Disclose authorship when posting (self-promotion rules).

## Channels & status / 渠道状态

| Channel | Status |
|---|---|
| GitHub (public, 8 topics) | ✅ live |
| npm (published, npx-ready) | ✅ live, v0.4.2 |
| awesome-mcp-servers (punkpeye) | ⬜ to submit |
| awesome-mcp-servers (wong2) | ⬜ to submit |
| Smithery / Glama / MCP.so / PulseMCP | ⬜ to submit |
| Official MCP Registry | ⬜ to submit |
| Show HN / Reddit / X / Product Hunt | ⬜ scheduled |
| V2EX / 掘金 / 知乎 / 小红书 | ⬜ scheduled |
