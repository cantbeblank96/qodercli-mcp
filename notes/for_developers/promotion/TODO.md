# qodercli-mcp 推广计划 (Promotion Plan)

**项目**: qodercli-mcp  
**版本**: v0.4.3  
**开始日期**: 2026-08-20  
**负责人**: cantbeblank96  

---

## 🎯 Phase 1 — 目录收录 ✅ COMPLETED

| 平台 | 状态 | 详情 | 备注 |
|------|------|------|------|
| **npm** | ✅ Done | v0.4.3 published | `npx -y qodercli-mcp` ready |
| **MCP Registry** | ✅ Done | `io.github.cantbeblank96/qodercli-mcp` | 需要 mcpName 字段 + npm 所有权验证 |
| **Smithery** | ✅ Done | https://smithery.ai/servers/xukaiming1996/qodercli-mcp | MCPB bundle 发布 |
| **Glama** | ✅ Auto-indexed | Verified via crawler | Topics: mcp, cli, agent, coding |
| **awesome-mcp-servers (punkpeye)** | 🟡 PR #12527 submitted | Need merge | Agent ID: 🤖🤖🤖 |
| **awesome-mcp-servers (wong2)** | ❌ Blocked | Fork PRs & issues disabled | Switch to Phase 3 Chinese channels |
| **MCP.so** | ⏳ Waiting | Only $39 paid channel | Wait for crawler indexing |
| **PulseMCP** | ⏳ Paused | Submission paused (ingestion refactor) | Retry later |

---

## 📢 Phase 2 — 社区发布 🔥 IN PROGRESS

### 发布时间窗（PT = Pacific Time）：
- **最佳窗口**: Tue–Thu 9–11 AM (北京时间次日 5–7 PM)
- **今日 (Thu Aug 20)**: PT 03:00 → 已错过首波，但可继续发

### 发布清单：

#### ✅ Reddit r/mcp — DONE
- **链接**: https://www.reddit.com/r/mcp/comments/1vtfpli/i_built_qoderclimcp_let_qoder_ide_claude_code/
- **标题**: "I built qodercli-mcp: Let Qoder IDE, Claude Code, Cursor call each other over MCP"
- **标签**: Showcase
- **时间**: 2026-08-20 18:30 CST

#### ⏳ Reddit r/commandline — SCHEDULED (Aug 21)
- **目标版规**: No spam, share experience
- **策略**: Day 2 错峰发，避免同账号连发
- **标题草案**: "Turning terminal coding agents into MCP servers: what works, what silently doesn't"

#### ⏳ Reddit r/opensource — SCHEDULED (Aug 21)
- **目标版规**: Self-promo OK with transparency
- **策略**: 披露作者身份，求 honest review
- **标题草案**: "[Self-promotion] qodercli-mcp: a tiny MCP server that gives Qoder CLI a server mode"

#### ⏳ Reddit r/LocalLLaMA — SCHEDULED (Aug 22)
- **风险点**: 需强调"local machine, local model"
- **策略**: 讨论 MCP delegation 模式而非硬推
- **标题草案**: "Delegating from MCP clients to local CLI coding agents — anyone else building this?"

#### ⏳ X / Twitter Thread — READY TO POST TODAY
- **时机**: PT 9–11 点已过，但可发（算法不分时段）
- **长度**: 5-tweet thread
- **内容**: Hook + Demo GIF → Tools → Permissions → Distribution → CTA
- **Hashtags**: #MCP #AIAgents
- **回复挂链接**: GitHub + npm (外链降权规避)

#### ⏳ Product Hunt — PLANNED (Aug 25–27, Tue preferred)
- **目标**: Tuesday 00:01 PT launch
- **素材准备**:
  - ✅ Gallery image: `docs/ph-gallery.png` (1270×760)
  - ✅ Tagline options (max 60 chars): "Delegate coding tasks to Qoder from any MCP client" (52)
  - ✅ Demo video: Convert GIF → MP4
- **首评模板**: Story-driven ("CLI agents can't call each other → I built wrapper...")
- **QA 模板**: 3 canned responses prepared

---

## 🇨🇳 Phase 3 — 华语圈 (差异化优势)

**错开美西时区**: Thu/Sat 发，利用周末流量

### 渠道清单：

#### ⏳ V2EX「分享创造」节点
- **标题**: 《给 Qoder CLI 写了个 MCP server，任意客户端 可调用》
- **风格**: 技术向 + 简短代码示例
- **时间**: Thu evening CST (今晚 20:00?)

#### ✅ 知乎专栏文章 — DONE (2026-08-20)
- **链接**: https://zhuanlan.zhihu.com/p/2073843039026536568
- **专栏**: agent使用 (c_2063028042922976615)
- **话题**: MCP协议 / 智能体 / CLI工具（已绑定，校验非空）
- **风格**: 使用场景向 + 权限语义实测亮点
- **源文件**: notes/for_developers/promotion/zhihu_article.md

#### ⏳ 掘金技术文章
- **标题**: 《为什么 CLI Agent 需要 MCP server 模式？qodercli-mcp 实践分享》
- **风格**: 教程 + 对比分析
- **标签**: AI、MCP、命令行、Agent

#### ⏳ 小红书图文
- **配图**: README screenshot + demo GIF screenshot
- **文案**: 简洁版亮点介绍 + 安装命令
- **标签**: #AI 工具 #MCP #编程开发

#### ⏳ B 站视频（可选）
- **时长**: 3–5 分钟
- **内容**: 屏幕录制演示 + 画外音讲解
- **素材**: demo.gif + ph-gallery.png 转图片

---

## 🚀 Phase 4 — 生态杠杆

- **Qoder 官方联系**: Issue on main repo asking for feature request
- **MCP client integration lists**: PR to popular MCP client awesome lists
- **Thought leadership article**: "Why CLI Agents Need MCP Server Mode" (dev.to + 掘金同步)

---

## 📊 指标追踪

### 核心 KPI（发布后 4 周）：
- [ ] GitHub stars ≥ 50 (current: ?)
- [ ] npm weekly downloads ≥ 100
- [ ] Reddit post upvotes/comment ratio ≥ 3:1
- [ ] PH upvotes ≥ 200
- [ ] Average comment response time ≤ 2 hours

### 负面指标监控：
- [ ] GitHub issue rate < 5/week
- [ ] npm install failure rate monitored
- [ ] Negative sentiment tracked on social mentions

---

## 🛠️ 依赖与准备

### 已完成：
- ✅ README EN/CN toggle + download badges
- ✅ PH gallery image (1270×760)
- ✅ Promotion skill docs updated
- ✅ All content drafts reviewed by Ultimate model

### 待办：
- ⏳ B站视频素材剪辑（如做）
- ⏳ Product Hunt Hunter 确认（self-hunt vs Top Hunter）
- ⏳ Zhihu column binding check

---

## 💬 沟通模板库

已准备好的回复模板：
1. **PH QA**: What is Qoder / How different from Codex MCP
2. **PH QA**: Works with which MCP clients
3. **PH QA**: Safety & permission modes
4. **Reddit AMA**: Permission semantics questions
5. **PR review feedback**: Thanks + implementation notes

---

## 📝 备注

- **HN 受限**: GitHub 账户发帖受限 → Switch to Reddit-first strategy
- **Wong2 blocked**: No submission channel → Focus on V2EX/Zhihu instead
- **Playwright MCP issues**: Broken pipe errors → Manual posting more reliable
- **Timezone awareness**: PT 9–11 = CST 次日 5–7 PM, adjust accordingly

**Next milestone**: Tomorrow (Aug 21) push Reddit alternative subs + X thread
