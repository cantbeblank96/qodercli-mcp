# 开源推广手册（Promotion Playbook）

> 目标：让 qodercli-mcp 在 MCP/AI-agent 开源社区打出名气。
> 现状资产：GitHub Public（8 topics）+ npm 已发布（npx 可用）+ 双语 README + 实测语义文档（差异化卖点）。

## 0. 定位语句（所有文案的母版）

- EN: *The missing MCP server mode for Qoder CLI — delegate coding tasks to local Qoder agents from any MCP client (Qoder IDE, Claude Code, Cursor…).*
- CN: *给 Qoder CLI 补上 MCP server 模式：让任意 MCP 客户端把任务委托给本地 Qoder Agent。*

差异化卖点（文案里反复打）：
1. `npx -y qodercli-mcp` 零配置可用；
2. **权限语义实测文档化**（dont_ask 只读等坑，全网独此一份）；
3. 运行时模型发现（list-models），不依赖过时模型清单；
4. codex 风格 sandbox/approval_policy 参数，迁移成本低。

## 1. Phase 0 — 素材（决定转化率，先做）

- [ ] **30 秒 demo GIF** 放 README 首屏：MCP 客户端委托 → qodercli 执行 → 结构化返回。
      录制建议：`asciinema rec` + `agg` 转 GIF，或终端录屏工具；脚本：委托一个 code review 小任务。
- [ ] badges：npm version / MIT / stars（shields.io）。
- [ ] README 首屏一屏内出现：定位句 + demo + `npx` 安装 + 三工具表。

## 2. Phase 1 — 目录收录（MCP 项目长尾流量主来源，ROI 最高，当天见效）

| 目标 | 说明 |
|---|---|
| [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | 最大列表，提 PR（按模板填一行 + 简介） |
| [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) | 中文版，华语圈影响力大 |
| Smithery (smithery.ai) | MCP server 市场，提交收录 |
| Glama (glama.ai/mcp/servers) | 收录 + 可验证安装 |
| MCP.so / PulseMCP (pulsemcp.com) | 目录流量 |
| 官方 MCP Registry | modelcontextprotocol 官方注册表，提交 |

## 3. Phase 2 — 社区发布（集中爆发，选一个工作日三连发）

- **Show HN**：标题草案 *Show HN: qodercli-mcp – MCP server that wraps Qoder CLI as a delegatable agent*。
  时间：美西周二–周四 9–11 点；正文讲“缺口”叙事（codex 有 server 模式，qodercli 没有）。
- **Reddit**：r/mcp、r/commandline、r/opensource、r/LocalLLaMA（各版规自查，先参与后发）。
- **X/Twitter**：demo GIF + 线程（3–5 条：问题→方案→实测坑→安装），标签 #MCP #AIAgents，@ MCP 圈活跃账号。
- **Product Hunt**：作为 developer tool 发布，准备 3 条 comment 回复模板。

## 4. Phase 3 — 华语圈（差异化优势，错峰跟进）

- **V2EX**（分享创造节点）：标题《给 Qoder CLI 写了个 MCP server，任意客户端可调用》。
- **掘金 / 知乎**：技术文，重点写“权限语义实测”（dont_ask 只读这种坑最吸睛）。
- **小红书 / B 站**：demo 短视频（本仓库维护者有 xhs 发帖经验，参考 auto_research 根目录 xhs_post.md 风格）。
- 思想文占位：*《为什么 CLI Agent 需要 MCP server 模式》*（dev.to + 掘金同步）。

## 5. Phase 4 — 生态杠杆（最大的星）

- 联系 **Qoder 官方**：社区版 MCP 若进官方文档/社区推荐，流量量级差异。
- 给主流 MCP 客户端的 awesome/集成列表提 PR；回应所有 issue/PR（48h 内），star 随活跃度涨。

## 6. 可安装的推广 Skills（agent 可直接用）

仓库：[kostja94/marketing-skills](https://github.com/kostja94/marketing-skills)（MIT，160+ 纯 Markdown skill，无执行代码）。

```bash
# 实测 2026-08：skill 名为 product-hunt-launch / twitter-x-posts / reddit-posts（原手册 x/reddit/launch 不存在）；
# 交互式 agent 选择可用 -a '*' -y 跳过；安装产物在 .agents/（已 gitignore）
npx --yes skills add kostja94/marketing-skills --skill cold-start-strategy directory-submission github product-hunt-launch twitter-x-posts reddit-posts indie-hacker-strategy -a '*' -y
```

| Skill | 对应阶段 | 产出 |
|---|---|---|
| `cold-start-strategy` | 总编排 | 0→1 推广执行单 |
| `directory-submission` | Phase 1 | 目录清单 + 提交模板 |
| `github` | 仓库 SEO | topics/关键词/页面优化 |
| `launch` | Phase 2 | HN/PH 发布日节奏 |
| `x` / `reddit` | Phase 2 | 平台化文案（线程/帖） |
| `indie-hacker-strategy` | Phase 2/3 | 独立开发者社区打法 |

使用提示：先填 `project-context.md`（产品/受众/关键词）再跑 skill，产出才不泛化；
说 “skip intro / just do it” 可跳过铺垫直接出活。
发现更多 skill：skills.sh、VoltAgent/awesome-agent-skills、awesomeskill.ai。

## 7. 执行顺序与度量

1. Phase 0 素材 → 2. Phase 1 目录（当天）→ 3. Phase 2 三连发（选日）→ 4. Phase 3 华语错峰 → 5. Phase 4 生态。
度量：GitHub stars/周增、npm weekly downloads、目录收录数、HN/Reddit 帖子存活与评论数。
节奏：发布后 2 周内每周复盘一次，按数据加码或换渠道。

## 8. 合规与礼仪

- 各平台 self-promotion 版规先读后发；披露作者身份；不刷量、不跨版连发同一文案。
- issue/PR 响应速度是开源声誉的核心，推广期尤其如此。
