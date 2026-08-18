/**
 * Smoke test for qodercli-mcp.
 *
 * Always:   protocol handshake + tools/list (no qodercli needed).
 * Optional: set QODERCLI_MCP_E2E=1 to also invoke ask-qoder with a trivial
 *           prompt (requires a signed-in local qodercli).
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVER = join(ROOT, "src", "index.js");
const E2E = process.env.QODERCLI_MCP_E2E === "1";

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

const child = spawn(process.execPath, [SERVER], {
  stdio: ["pipe", "pipe", "inherit"],
});

const pending = new Map();
let buffer = "";

child.stdout.on("data", (d) => {
  buffer += d.toString();
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch {
      /* ignore non-JSON noise */
    }
  }
});

function request(id, method, params) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 120000);
    pending.set(id, (msg) => {
      clearTimeout(t);
      resolve(msg);
    });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
}

function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
}

try {
  const init = await request(1, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke-test", version: "0.0.1" },
  });
  if (init.result?.serverInfo?.name !== "qodercli-mcp") {
    fail(`unexpected serverInfo: ${JSON.stringify(init.result?.serverInfo)}`);
  }
  if (typeof init.result?.instructions !== "string" || !init.result.instructions.includes("list-models")) {
    fail(`expected server instructions mentioning list-models, got: ${JSON.stringify(init.result?.instructions)}`);
  }
  console.log("PASS: initialize handshake ->", init.result.serverInfo.name);

  notify("notifications/initialized", {});

  const tools = await request(2, "tools/list", {});
  const names = (tools.result?.tools ?? []).map((t) => t.name);
  if (!names.includes("ask-qoder") || !names.includes("list-sessions") || !names.includes("list-models")) {
    fail(`expected ask-qoder + list-sessions + list-models, got: ${names.join(", ")}`);
  }
  console.log("PASS: tools/list ->", names.join(", "));

  if (E2E) {
    console.log("... invoking list-models end-to-end");
    const lm = await request(4, "tools/call", {
      name: "list-models",
      arguments: {},
    });
    const models = lm.result?.structuredContent?.models;
    if (lm.result?.isError || !Array.isArray(models) || models.length === 0) {
      fail(`list-models returned no models: ${JSON.stringify(lm.result).slice(0, 200)}`);
    }
    console.log("PASS: list-models ->", models.length, "models:", models.slice(0, 5).join(", "), "...");

    console.log("... invoking ask-qoder end-to-end (this may take a while)");
    const call = await request(3, "tools/call", {
      name: "ask-qoder",
      arguments: {
        prompt: "Reply with exactly one word: OK",
        timeout_ms: 300000,
      },
    });
    const text = call.result?.content?.[0]?.text ?? "";
    if (call.result?.isError || !text) {
      fail(`ask-qoder returned error or empty output: ${text}`);
    }
    const sc = call.result?.structuredContent;
    if (!sc?.session_id || typeof sc.content !== "string") {
      fail(`structured output missing session_id/content: ${JSON.stringify(sc)}`);
    }
    if (
      typeof sc.is_error !== "boolean" ||
      typeof sc.timed_out !== "boolean" ||
      typeof sc.truncated !== "boolean" ||
      typeof sc.exit_code !== "number"
    ) {
      fail(`structured output field types wrong: ${JSON.stringify(sc)}`);
    }
    console.log(
      "PASS: ask-qoder end-to-end ->",
      text.slice(0, 120),
      `| session_id=${sc.session_id} credits=${sc.total_credits}`
    );

    // Regression test: sandbox=workspace-write must grant edit capability
    // (previously it stayed in the read-only dont_ask mode).
    const writeDir = join(tmpdir(), "qodercli-mcp-smoke");
    mkdirSync(writeDir, { recursive: true });
    const marker = join(writeDir, ".qodercli-mcp-write-test.txt");
    rmSync(marker, { force: true });
    console.log("... invoking ask-qoder write test (sandbox=workspace-write)");
    const writeCall = await request(5, "tools/call", {
      name: "ask-qoder",
      arguments: {
        prompt:
          `Create a file named .qodercli-mcp-write-test.txt in the current ` +
          `working directory containing exactly the word SMOKE. No other actions.`,
        cwd: writeDir,
        sandbox: "workspace-write",
        timeout_ms: 300000,
      },
    });
    if (writeCall.result?.isError) {
      fail(`workspace-write call errored: ${(writeCall.result?.content?.[0]?.text ?? "").slice(0, 200)}`);
    }
    if (!existsSync(marker)) {
      fail(`sandbox=workspace-write did not allow writing: ${marker} missing`);
    }
    rmSync(marker, { force: true });
    console.log("PASS: sandbox=workspace-write allows file creation");
  } else {
    console.log("SKIP: end-to-end call (set QODERCLI_MCP_E2E=1 to enable)");
  }

  child.kill();
  console.log("ALL PASS");
  process.exit(0);
} catch (err) {
  child.kill();
  fail(String(err));
}
