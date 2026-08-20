# 开发、测试与发布流程（Development / Test / Release）

## 1. 环境准备

```bash
# 前置：Node >= 18；qodercli 已安装并登录（qodercli login）
npm install
npm start          # 以 stdio MCP server 方式启动（Ctrl-C 退出）
```

代理额度（可选但推荐，维护者机器依赖它）：

```bash
export HTTP_PROXY=http://127.0.0.1:39900 HTTPS_PROXY=http://127.0.0.1:39900
export QODERCLI_PATH=$HOME/.local/bin/qodercli
```

## 2. 环境变量（全部支持项）

| 变量 | 默认 | 作用 |
|---|---|---|
| `QODERCLI_PATH` | `qodercli` | qodercli 二进制路径 |
| `QODERCLI_TIMEOUT_MS` | `600000` | 单次调用默认超时（硬上限 3600000） |
| `QODERCLI_MAX_OUTPUT_MB` | `50` | stdout/stderr 各自上限（OOM 保护），超限 SIGKILL 且 `truncated=true` |
| `QODERCLI_DEFAULT_PERMISSION_MODE` | `dont_ask` | 调用方未传权限参数时的默认模式；设 `bypass_permissions` 即 YOLO |
| `HTTP_PROXY` / `HTTPS_PROXY` | - | 注入每个 qodercli 子进程（代理额度） |

## 3. 测试

```bash
node --check src/index.js     # 语法
npm test                      # 协议测试：initialize 握手、instructions、三工具齐备（免费）
QODERCLI_MCP_E2E=1 npm test   # E2E：list-models + ask-qoder + workspace-write 写文件回归
```

⚠️ E2E 会真实调用 qodercli，**消耗 Qoder 额度**（单次约 0.5–7 credits，视账号侧模型路由而定），
且需要代理 env 才能走额度。不要无意义反复跑。

## 4. 代码地图（src/index.js）

- 常量区：二进制/超时/输出上限/代理；`PERMISSION_MODES`；`DEFAULT_PERMISSION_MODE`（env 可覆盖）；
  `SANDBOX_MODES` / `SANDBOX_PERMISSION_MAP`；`READ_ONLY_DISALLOWED_TOOLS`；
  `RESERVED_EXTRA_ARGS`；`APPROVAL_POLICY_MAP`。
- `buildCliArgs(opts)`：**权限解析链**（见下）+ 参数拼装 + 保留 flag 拦截在 handler 前置校验。
- `runQodercli(...)`：spawn + 字节计数上限 + 超时 SIGKILL；返回 `{ok, code, stdout, stderr, timedOut, truncated}`。
- `McpServer` 构造：第二参数透传 `instructions`（含权限提示，且**动态显示当前默认权限模式**）。
- 三个 `registerTool`：ask-qoder / list-sessions / list-models（zod schema + outputSchema）。

权限解析链（优先级从高到低）：

```js
const permissionMode =
  opts.permission_mode ??                                   // 显式最高
  (opts.approval_policy ? APPROVAL_POLICY_MAP[...] : null) ??
  (opts.sandbox ? SANDBOX_PERMISSION_MAP[...] : null) ??
  DEFAULT_PERMISSION_MODE;                                  // env 可配，默认 dont_ask
```

映射表（实测语义，详见 02 文档）：

- sandbox：`read-only`→dont_ask（并追加 `--disallowed-tools write_file,replace,run_shell_command`，除非显式覆盖）；
  `workspace-write`→accept_edits；`danger-full-access`→bypass_permissions。
- approval_policy：`untrusted`→dont_ask；`on-request`→auto；`never`→bypass_permissions。

## 5. 发版清单（Release Checklist）

1. **改代码 + 更新 README**（用户可见行为变化必须同步双语 README 与 schema description）。
2. **版本号两处同步**：`package.json` 的 `version` 与 `src/index.js` 的 `new McpServer({ version })`。
3. `node --check src/index.js && npm test`（必要时跑 E2E）。
4. `git add -A && git commit -m "feat(vX.Y.Z): ..." && git push`（推前**不做安全扫描**，维护者既定偏好）。
5. **npm 发布**：
   ```bash
   npm publish --access public
   ```
   账号启用了 Security Key 2FA，CLI 无法输入 OTP，因此 npm 会打印
   `Authenticate your account at: https://www.npmjs.com/auth/cli/<uuid>` ——
   **必须由维护者在浏览器打开并点按 Security Key 授权**，发布才会继续。
   （备选：granular access token + bypass-2FA，但维护者偏好浏览器 2FA 方式。）
   注意：`--token` 参数已被 npm 废弃为 `--token-description`，**不要**用它传 token。
6. 验证：
   ```bash
   curl -s https://registry.npmjs.org/qodercli-mcp | jq '.dist-tags.latest'
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}' \
     | timeout 60 npx -y qodercli-mcp@latest   # 冷启动握手
   ```
7. **提醒所有 MCP 客户端用户重载/重启 MCP**：客户端会缓存 tools schema
   （Qoder 缓存位于 `~/.config/Qoder/SharedClientCache/projects/<proj>/mcps/qodercli-mcp/`），
   不重载则 LLM 看到的仍是旧描述。

## 6. 本地开发 vs npx 切换

`~/.qoder/mcp.json` 默认走 npx（已发布版）。开发迭代时临时改为本地源码：

```json
"command": "<nvm>/bin/node",
"args": ["<repo>/src/index.js"]
```

改完重载 MCP 验证；发版后切回 `"command": "<nvm>/bin/npx", "args": ["-y","qodercli-mcp"]`。

## 7. 风格约定

- 单文件 server 保持“可直接阅读”；注释密度与现有代码一致。
- 用户可见字符串（description/instructions/README）双语。
- 任何“语义性”结论（如权限模式行为）必须**对照实验确证**后再写入文档，不靠猜。
