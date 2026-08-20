# Phase 2 — 社区发布文案草稿（待维护者审核后发）

> 规范来源：已装推广 skills（reddit-posts / twitter-x-posts / product-hunt-launch）。
> 纪律：各版规先读后发；披露作者身份；不跨版连发同一文案；链接放回复不放主帖（X）。
> 时间窗：Show HN 美西周二–周四 9–11 点；PH 美西周二–周四 00:01。

## 1. Show HN

**标题**：

```
Show HN: qodercli-mcp – MCP server mode for the Qoder CLI (I built it)
```

**正文**：

```
Hi HN,

Codex ships an official MCP server mode, so any MCP client can delegate coding
tasks to it. Qoder CLI (qodercli) — a capable terminal coding agent — only acts
as an MCP *client*. qodercli-mcp fills that gap: a ~500-line, dependency-light
MCP server that wraps qodercli over stdio, installable with `npx -y qodercli-mcp`.

It exposes three tools: ask-qoder (delegate a task, codex-style sandbox
levels), list-sessions (resume multi-turn delegation), list-models (runtime
model discovery).

The part I'd actually like feedback on: permission semantics. I experimentally
verified what each mode really does — e.g. `dont_ask` is not "approve
everything", it's read-only with silent denials. That's documented in the
repo, because guessing here is how agents delete your files.

*Zero-config, MIT, npm-published, listed in the official MCP Registry. I'm the author.*

Repo: https://github.com/cantbeblank96/qodercli-mcp
npm:  https://www.npmjs.com/package/qodercli-mcp

Happy to answer anything — especially from people who've built MCP servers
around other CLIs.
```

## 2. Reddit（每版一稿，勿复用）

### r/mcp（flair: Project / Showcase，按侧栏自查）

**标题**：`I tested my CLI agent's permission modes — here's what dont_ask *really* does`

**正文**：

```
Been building qodercli-mcp, an MCP server that lets any MCP client delegate
coding tasks to a local Qoder CLI agent (like codex mcp-server does for Codex).

The part that took real time wasn't the wrapping — it was figuring out what
the permission modes *actually* do. Example: `dont_ask` sounds like YOLO mode.
It isn't. In my tests it behaves read-only: write operations are silently
denied instead of prompted. If you've been configuring CLI agents by
guessing mode names, that's a footgun worth knowing about.

What you get over stdio:
- ask-qoder: delegate a task, codex-style sandbox levels
- list-sessions: resume multi-turn delegation
- list-models: runtime model discovery

Install is `npx -y qodercli-mcp`. MIT, source on GitHub, listed in the
official MCP Registry.

I'm the author. Feedback welcome — especially: which permission semantics
would you want a delegating server to enforce by default?
```

### r/commandline（flair 按侧栏；经验分享向）

**标题**：`Turning terminal coding agents into MCP servers: what works, what silently doesn't`

**正文**:

```
I built qodercli-mcp, a tiny wrapper that gives Qoder CLI an MCP server
mode (the way Codex has one officially). One CLI, callable from Cursor,
Claude Code, any MCP client.

Two things surprised me building it:
```

1. CLI agents make great MCP *clients* but almost none ship a server mode —
   the ecosystem gap is real.
2. Permission flags are not what they say. `dont_ask` in qodercli turned out
   to be read-only with silent denials in my experiments, not "accept
   everything". I now document every mode with test evidence instead of
   marketing adjectives.

If you run CLI agents from editors, would you delegate to them over MCP, or
is terminal-only the point? Curious how others wire this up.

(Project links in comments if allowed by mods — I'm the author.)
```

### r/opensource（透明自荐 + 求 review）

**标题**：`[Self-promotion] qodercli-mcp: a tiny MCP server that gives Qoder CLI a server mode — looking for honest review`

**正文**:

```
Built by me. qodercli-mcp wraps the Qoder CLI as an MCP server so any MCP
client can delegate coding tasks to it. Single file, pure ESM, no build step,
Author here. qodercli-mcp wraps the Qoder CLI as an MCP server so any MCP
client can delegate coding tasks to it. Single file, pure ESM, no build step,
MIT, on npm (`npx -y qodercli-mcp`).

Why I think it's interesting beyond the wrapper itself:
- It documents *experimentally verified* permission semantics (e.g. dont_ask
  is read-only, not YOLO) — a pattern I wish more agent tooling adopted.
- It's published in the official MCP Registry, Smithery and Glama, so the
  packaging/distribution story is complete.

What I'd love review on: stdio protocol edge cases, the sandbox/approval
priority chain, and whether the tool surface (ask-qoder / list-sessions /
list-models) is the right split.

GitHub: https://github.com/cantbeblank96/qodercli-mcp
```

**标题**：`Delegating from MCP clients to local CLI coding agents over MCP — anyone else building this locally?`

**正文**:

```
I've been running CLI coding agents as delegated workers behind MCP servers
(my project **qodercli-mcp** does this for Qoder CLI, **runs entirely on your machine**, local model), and the pattern that

```
I've been running CLI coding agents as delegated workers behind MCP servers
(my project **qodercli-mcp** does this for Qoder CLI, **runs entirely on your machine**, local model), and the pattern that
emerged is: editor/agent as orchestrator → CLI agent as sandboxed worker →
session resume for multi-turn work.

Two findings that might save others time:
- `dont_ask`-style flags often mean "read-only with silent denials", not
  "approve everything". Test your agent's permission matrix before trusting
  it with writes.
- stdio transport + npx install makes the whole thing zero-config for
  teammates.

Curious: are people here delegating to *local* model-backed CLI agents over
MCP? What's your sandbox setup — the codex-style levels or something stricter?

(I'm the author of one such wrapper; happy to share the repo if useful.)
```

## 3. X / Twitter 线程（5 条；链接放第 5 条的回复）

> 每条 ≤280；首条带 demo GIF；末条 CTA。

```
1/5
Codex has an official MCP server mode.
Qoder CLI didn't.

I built qodercli-mcp in ~2 weeks to give Qoder CLI a server mode —
one npx command, and any MCP client can delegate real coding tasks.

[附 demo GIF]

...
5/5
If your editor could delegate to a CLI agent today, what would you hand off first?

(Repo + npm link in reply 👇 | **built by me**)  #MCP #AIAgents

2/5
Three tools over stdio:

• ask-qoder — delegate a task, codex-style sandbox levels
• list-sessions — resume multi-turn delegation
• list-models — runtime model discovery

Zero-config: npx -y qodercli-mcp

3/5
The scary part of delegating to agents? Permissions.

So I tested every mode instead of guessing.

Finding: dont_ask is NOT YOLO. It's read-only — writes silently denied.

Now every mode ships with test evidence, not adjectives.

4/5
Distribution done properly:

✓ npm (npx-ready)
✓ official MCP Registry
✓ Smithery (MCPB bundle)
✓ Glama
✓ awesome-mcp-servers PR **(in progress)**

One CLI, discoverable everywhere MCP clients look.

```

**回复（挂链接）：**

```
https://github.com/cantbeblank96/qodercli-mcp
https://www.npmjs.com/package/qodercli-mcp
```

## 4. Product Hunt

**Tagline 候选（≤60 字符）**：

1. `Delegate coding tasks to Qoder agents from any MCP client`（58）→ 改为：
   `Delegate coding tasks to Qoder from any MCP client`（52）
2. `The missing MCP server mode for Qoder CLI`（42）
3. `Your terminal coding agent, callable from anywhere`（50）

**Topic tags**：Developer Tools / Artificial Intelligence / GitHub / Command Line / Productivity

**首评（maker comment，故事向，发布后立即发）**：

```
Hey PH 👋 I'm the maker of qodercli-mcp.

The story: CLI coding agents are everywhere now, but almost none of them can
be *called* by your editor — they only know how to call out. Codex solved
this with an official MCP server mode; Qoder CLI had no answer.

qodercli-mcp is that answer: one npx command, and Cursor / Claude Code / any
MCP client can delegate real coding tasks to a local Qoder agent, resume
sessions, and discover models at runtime.

The detail I'm proudest of: every permission mode is documented with
experimental evidence (**dont_ask = read-only**). Pick the trust level explicitly.

Ask me anything — especially about sandboxing delegated agents.
```

**3 条回复模板**：

```
Q: What is Qoder / how is this different from Codex's MCP server?
A: Qoder CLI is a terminal coding agent (like Codex CLI). Codex ships an
   official MCP server mode; Qoder didn't — qodercli-mcp is the community
   equivalent: same delegation pattern (sandbox levels, session resume),
   zero-config npx install, MIT.

Q: Does it work with Cursor / Claude Code / <client>?
A: Yes — anything that speaks MCP stdio. Config is one command:
   npx -y qodercli-mcp. There's a copy-paste snippet in the README for the
   popular clients.

Q: Is it safe to let an agent run tasks on my machine?
A: That's the whole design focus. Delegation runs under codex-style sandbox
   levels, and the default permission semantics are documented from real
   tests (e.g. dont_ask = read-only, silent denials) — you pick the trust
   level explicitly instead of guessing.
```

**素材缺口（发布前补）**：gallery 图 1270×760（可用 demo GIF 首帧 + badges 拼一张）；
demo 视频 <2min 可选（现有 GIF 可转 mp4）。

## 5. 发布顺序与度量

1. 周二：Show HN（9–11 PT）+ X 线程同窗口。
2. 周三：Reddit 两版（r/mcp、r/commandline），周四另两版（错开，避免连发同款）。
3. PH 单独选一个周二 00:01 PT，与 HN 错周。
4. 度量：帖子存活/评论数、stars 周增、npm weekly downloads；建议延长至 4 周复盘周期（含负向指标：issue 率、安装失败率）。
