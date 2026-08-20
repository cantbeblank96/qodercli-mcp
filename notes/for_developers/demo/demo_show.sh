#!/usr/bin/env bash
# demo_show.sh — 演示用展示脚本（配合 asciinema 录 GIF）。
# 与 record.sh 走同样的 JSON-RPC 流程，但分步显示请求与响应，
# 并对超长响应做摘要（tools schema 只留 name+简介），保证画面干净。
# 录制：
#   asciinema rec demo.cast --command "bash notes/for_developers/demo/demo_show.sh" --cols 100 --rows 32 --overwrite
#   agg demo.cast docs/demo.gif --font-size 16
set -euo pipefail
export QODERCLI_PATH="${QODERCLI_PATH:-$HOME/.local/bin/qodercli}"
SERVER="${SERVER:-node src/index.js}"

IN=$(mktemp -u); mkfifo "$IN"
trap 'rm -f "$IN"' EXIT

# 响应美化器：pretty-print + 摘要
pretty() {
  node --input-type=module -e '
import readline from "node:readline";
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  if (!line.trim()) return;
  try {
    const m = JSON.parse(line);
    if (Array.isArray(m.result?.tools)) {
      m.result.tools = m.result.tools.map(t => ({ name: t.name, description: (t.description || "").slice(0, 70) + "…" }));
    }
    if (typeof m.result?.instructions === "string") m.result.instructions = m.result.instructions.slice(0, 200) + " …";
    if (Array.isArray(m.result?.structuredContent?.content)) {
      const c = m.result.structuredContent;
      c.content = c.content.map(x => typeof x.text === "string" ? x.text.slice(0, 120) + " …" : x);
    }
    console.log(JSON.stringify(m, null, 2));
  } catch { console.log(line); }
});'
}

echo "qodercli-mcp demo — any MCP client ⇄ qodercli-mcp ⇄ qodercli"
echo
echo '$ npx -y qodercli-mcp        # start the MCP server (stdio)'
$SERVER <"$IN" 2>/dev/null | pretty &
exec 3>"$IN"
sleep 1

send() {
  local title="$1" payload="$2"
  echo
  echo "# $title"
  echo "$payload"
  echo "$payload" >&3
}

send "initialize handshake" \
'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"demo-client","version":"0.0.1"}}}'
sleep 2

send "tools/list — 3 tools exposed" \
'{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
sleep 2

send "tools/call list-models — runtime model discovery" \
'{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"list-models","arguments":{}}}'
sleep 12

echo
echo "# done — structured results over MCP stdio"
exec 3>&-
sleep 1
