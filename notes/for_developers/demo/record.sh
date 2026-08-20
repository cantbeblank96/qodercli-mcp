#!/usr/bin/env bash
# record.sh — qodercli-mcp 30s demo 的 JSON-RPC 脚本流。
# 用法：
#   1) 直接验证脚本本身（不录制）： bash record.sh
#   2) 录制 GIF（需要 asciinema + agg）：
#        asciinema rec demo.cast --command "bash record.sh" --cols 100 --rows 30
#        agg demo.cast docs/demo.gif --font-size 16
#      然后 git add docs/demo.gif 并解开 README 首屏的 demo 注释。
# 说明：
#   - 走 initialize → tools/list → tools/call(list-models) 三步，展示
#     "MCP 客户端委托 → qodercli 执行 → 结构化返回"，约 20-30s。
#   - list-models 会真实 spawn qodercli，需要本机已 qodercli login；
#     不消耗额度（不调用模型）。若需代理额度环境，先 export HTTP(S)_PROXY。
#   - 可选加第四步 ask-qoder（消耗额度），默认不开启。
set -euo pipefail

SERVER="${SERVER:-npx -y qodercli-mcp}"   # 开发期可改 SERVER="node src/index.js"
WITH_ASK_QODER="${WITH_ASK_QODER:-0}"      # 设 1 追加 ask-qoder 调用（消耗额度）

{
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"demo-client","version":"0.0.1"}}}'
  echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
  echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list-models","arguments":{}}}'
  if [ "$WITH_ASK_QODER" = "1" ]; then
    echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"ask-qoder","arguments":{"prompt":"Say OK if you can read this. Reply with OK only.","timeout_ms":120000}}}'
  fi
  sleep 1
} | $SERVER
