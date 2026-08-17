#!/usr/bin/env node
/**
 * qodercli-mcp — a minimal MCP server that wraps qodercli (Qoder CLI).
 *
 * It lets any MCP client (Qoder IDE, Claude Code, Cursor, ...) delegate
 * coding tasks to a local qodercli agent via the `ask-qoder` tool, and
 * inspect local sessions via `list-sessions`.
 *
 * Environment variables:
 *   QODERCLI_PATH          Absolute path to the qodercli binary
 *                          (default: "qodercli" resolved via PATH).
 *   QODERCLI_TIMEOUT_MS    Default per-call timeout in milliseconds
 *                          (default: 600000 = 10 minutes).
 *   QODERCLI_MAX_OUTPUT_MB Per-call stdout/stderr cap in MB to protect the
 *                          long-lived server from OOM (default: 50).
 *   HTTP_PROXY / HTTPS_PROXY  If set, injected into every qodercli
 *                          subprocess so it can use Qoder CLI proxy quota.
 *
 * MIT License. See LICENSE.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { spawn } from "node:child_process";
import { z } from "zod";

const QODERCLI_BIN = process.env.QODERCLI_PATH || "qodercli";
const DEFAULT_TIMEOUT_MS = Number(process.env.QODERCLI_TIMEOUT_MS) || 10 * 60 * 1000;
const MAX_TIMEOUT_MS = 60 * 60 * 1000;
const DEFAULT_PERMISSION_MODE = "dont_ask";

// Proxy settings for qodercli via proxy quota
const HTTP_PROXY = process.env.HTTP_PROXY || null;
const HTTPS_PROXY = process.env.HTTPS_PROXY || null;

const PERMISSION_MODES = [
  "default",
  "accept_edits",
  "bypass_permissions",
  "dont_ask",
  "auto",
];

// Sandbox modes mirror codex MCP naming for familiarity.
const SANDBOX_MODES = ["read-only", "workspace-write", "danger-full-access"];

// gemini-family write/shell tool names, verified accepted by
// `qodercli --disallowed-tools` (see README "Sandbox mapping").
const READ_ONLY_DISALLOWED_TOOLS = ["write_file", "replace", "run_shell_command"];

// Per-call output cap (bytes) protecting the long-lived server from OOM.
const MAX_OUTPUT_BYTES =
  (Number(process.env.QODERCLI_MAX_OUTPUT_MB) || 50) * 1024 * 1024;

// Flags with dedicated tool parameters; blocked in extra_args so a
// prompt-injected client cannot silently override safety-relevant settings.
const RESERVED_EXTRA_ARGS = new Set([
  "-p",
  "--print",
  "-o",
  "--output-format",
  "-r",
  "--resume",
  "-m",
  "--model",
  "-w",
  "--cwd",
  "--permission-mode",
  "--system-prompt",
  "--append-system-prompt",
]);

// codex-style approval policy mapped onto qodercli permission modes.
const APPROVAL_POLICIES = ["untrusted", "on-request", "never"];
const APPROVAL_POLICY_MAP = {
  untrusted: "dont_ask",
  "on-request": "default",
  never: "bypass_permissions",
};

function reservedExtraArg(extraArgs) {
  if (!extraArgs) return null;
  for (const a of extraArgs) {
    const flag = a.split("=")[0];
    if (RESERVED_EXTRA_ARGS.has(flag)) return flag;
  }
  return null;
}

/**
 * Spawn qodercli and collect its output. Never throws; always resolves
 * with a structured result so the MCP layer can report errors cleanly.
 */
function runQodercli(args, { cwd, timeoutMs }) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let outBytes = 0;
    let errBytes = 0;
    let settled = false;
    let timedOut = false;
    let truncated = false;

    // Prepare environment with optional proxy support
    const env = {
      ...process.env,
      // Inject proxy vars if defined at MCP server level
      ...(HTTP_PROXY ? { HTTP_PROXY } : {}),
      ...(HTTPS_PROXY ? { HTTPS_PROXY } : {}),
    };

    const child = spawn(QODERCLI_BIN, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const killChild = () => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* already dead */
      }
    };

    const timer = setTimeout(() => {
      timedOut = true;
      killChild();
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      outBytes += d.length;
      if (outBytes > MAX_OUTPUT_BYTES) {
        truncated = true;
        killChild();
        return;
      }
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      errBytes += d.length;
      if (errBytes > MAX_OUTPUT_BYTES) {
        truncated = true;
        killChild();
        return;
      }
      stderr += d;
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      resolve({
        ok: false,
        code: -1,
        stdout,
        stderr: stderr ? `${stderr}\n${String(err)}` : String(err),
        timedOut,
        truncated,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      resolve({ ok: code === 0, code, stdout, stderr, timedOut, truncated });
    });
  });
}

/**
 * Parse the `-o json` result envelope emitted by qodercli.
 * Returns null when the output is not (or not fully) JSON.
 */
function parseResultJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    const obj = JSON.parse(trimmed);
    return typeof obj === "object" && obj !== null ? obj : null;
  } catch {
    /* fall through to line scan */
  }
  const lines = trimmed.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith("{")) continue;
    try {
      const obj = JSON.parse(line);
      if (obj && typeof obj === "object") return obj;
    } catch {
      /* keep scanning */
    }
  }
  return null;
}

function buildCliArgs(opts) {
  const args = ["-p"];
  if (opts.resume_session_id) args.push("-r", opts.resume_session_id);
  if (opts.model) args.push("-m", opts.model);
  if (opts.reasoning_effort) {
    args.push("--reasoning-effort", opts.reasoning_effort);
  }
  // Resolve the effective permission mode exactly once.
  let permissionMode =
    opts.permission_mode ??
    (opts.approval_policy
      ? APPROVAL_POLICY_MAP[opts.approval_policy]
      : DEFAULT_PERMISSION_MODE);
  if (
    opts.sandbox === "danger-full-access" &&
    !opts.permission_mode &&
    !opts.approval_policy
  ) {
    // Full access implies no permission prompts.
    permissionMode = "bypass_permissions";
  }
  args.push("--permission-mode", permissionMode);
  if (opts.sandbox === "read-only") {
    args.push("--disallowed-tools", READ_ONLY_DISALLOWED_TOOLS.join(","));
  }
  if (opts.system_prompt) args.push("--system-prompt", opts.system_prompt);
  if (opts.append_system_prompt) {
    args.push("--append-system-prompt", opts.append_system_prompt);
  }
  // Structured output by default so we can surface session_id & metrics.
  args.push("-o", opts.output_format ?? "json");
  if (opts.cwd) args.push("-w", opts.cwd);
  if (opts.extra_args) args.push(...opts.extra_args);
  args.push(opts.prompt);
  return args;
}

const server = new McpServer(
  {
    name: "qodercli-mcp",
    version: "0.3.0",
  },
  {
    // Server-level guidance surfaced to clients via the initialize result.
    instructions:
      "qodercli-mcp wraps the local qodercli (Qoder CLI) agent. " +
      "Before choosing a model name, call the list-models tool to get the " +
      "currently supported models. Use ask-qoder for tasks; its structured " +
      "output contains session_id — pass it back via resume_session_id for " +
      "multi-turn follow-ups. Use list-sessions to discover past session ids.",
  }
);

const askQoderOutputSchema = {
  session_id: z.string().optional().describe("qodercli session id for follow-ups."),
  content: z.string().describe("The assistant's final answer."),
  is_error: z.boolean(),
  exit_code: z.number().optional(),
  duration_ms: z.number().optional(),
  total_credits: z.number().optional(),
  num_turns: z.number().optional(),
  timed_out: z.boolean(),
  truncated: z.boolean(),
};

server.registerTool(
  "ask-qoder",
  {
    description:
      "Delegate a task to qodercli (Qoder CLI), a local agentic coding assistant. " +
      "Use it to get a second opinion, a code review, or to have Qoder perform " +
      "a self-contained coding task in a given working directory. " +
      "Returns structured output including session_id; pass it back as " +
      "resume_session_id to continue the conversation.",
    inputSchema: {
      prompt: z.string().describe("The task or question for qodercli."),
      cwd: z
        .string()
        .optional()
        .describe("Working directory for qodercli (project to operate on)."),
      model: z
        .string()
        .optional()
        .describe(
          "Model to use for this session (e.g. 'Auto', 'Ultimate', " +
            "'Qwen3.8-Max', 'Kimi-K3'). Call the list-models tool first to " +
            "get the currently supported model names."
        ),
      reasoning_effort: z
        .string()
        .optional()
        .describe(
          "Reasoning effort level passed to --reasoning-effort " +
            "(e.g. 'low', 'medium', 'high'); supported levels depend on the " +
            "selected model."
        ),
      permission_mode: z
        .enum(PERMISSION_MODES)
        .optional()
        .describe(
          `Permission mode (default: ${DEFAULT_PERMISSION_MODE}). ` +
            `Mutually exclusive with approval_policy.`
        ),
      approval_policy: z
        .enum(APPROVAL_POLICIES)
        .optional()
        .describe(
          "codex-style approval policy: untrusted->dont_ask, " +
            "on-request->default, never->bypass_permissions. " +
            "Mutually exclusive with permission_mode."
        ),
      sandbox: z
        .enum(SANDBOX_MODES)
        .optional()
        .describe(
          "Sandbox level, codex-style: read-only blocks write/shell tools; " +
            "workspace-write is the default behavior; danger-full-access " +
            "implies bypass_permissions unless permission_mode is set."
        ),
      system_prompt: z
        .string()
        .optional()
        .describe("Replace qodercli's default system prompt for this call."),
      append_system_prompt: z
        .string()
        .optional()
        .describe("Append extra instructions to the default system prompt."),
      resume_session_id: z
        .string()
        .optional()
        .describe("Resume a previous qodercli session by its identifier."),
      output_format: z
        .string()
        .optional()
        .describe("CLI output format passed to -o (default: json)."),
      extra_args: z
        .array(z.string())
        .optional()
        .describe(
          "Additional raw CLI arguments appended before the prompt. " +
            "Flags with dedicated parameters (permission mode, system " +
            "prompt, model, output format, resume, cwd) are rejected."
        ),
      timeout_ms: z
        .number()
        .int()
        .positive()
        .max(MAX_TIMEOUT_MS)
        .optional()
        .describe(`Timeout in ms (default: ${DEFAULT_TIMEOUT_MS}).`),
    },
    outputSchema: askQoderOutputSchema,
  },
  async (opts) => {
    if (opts.approval_policy && opts.permission_mode) {
      const msg =
        "[qodercli-mcp] approval_policy and permission_mode are mutually exclusive; set only one.";
      return {
        content: [{ type: "text", text: msg }],
        structuredContent: { content: msg, is_error: true, timed_out: false, truncated: false },
        isError: true,
      };
    }
    const badFlag = reservedExtraArg(opts.extra_args);
    if (badFlag) {
      const msg = `[qodercli-mcp] extra_args contains reserved flag "${badFlag}"; use the dedicated parameter instead.`;
      return {
        content: [{ type: "text", text: msg }],
        structuredContent: { content: msg, is_error: true, timed_out: false, truncated: false },
        isError: true,
      };
    }

    const args = buildCliArgs(opts);
    const res = await runQodercli(args, {
      cwd: opts.cwd,
      timeoutMs: opts.timeout_ms ?? DEFAULT_TIMEOUT_MS,
    });

    const wantJson = (opts.output_format ?? "json") === "json";
    const parsed = wantJson ? parseResultJson(res.stdout) : null;
    const answer = parsed?.result ?? res.stdout.trim();
    const isError = !res.ok || Boolean(parsed?.is_error) || res.timedOut;

    const structured = {
      session_id: parsed?.session_id,
      content: answer,
      is_error: isError,
      exit_code: res.code,
      duration_ms: parsed?.duration_ms,
      total_credits: parsed?.total_credits,
      num_turns: parsed?.num_turns,
      timed_out: res.timedOut,
      truncated: res.truncated,
    };

    const parts = [];
    if (answer) parts.push(answer);
    if (res.stderr.trim()) parts.push(`[stderr]\n${res.stderr.trim()}`);
    if (res.truncated) {
      parts.push(
        `[qodercli-mcp] output exceeded ${Math.round(MAX_OUTPUT_BYTES / 1024 / 1024)}MB cap; process killed and output truncated`
      );
    }
    if (res.timedOut) {
      parts.push(
        `[qodercli-mcp] process killed after ${opts.timeout_ms ?? DEFAULT_TIMEOUT_MS}ms timeout`
      );
    } else if (!res.ok) {
      parts.push(`[qodercli-mcp] qodercli exited with code ${res.code}`);
    }

    const text = parts.join("\n\n") || "[qodercli-mcp] qodercli produced no output";
    return {
      content: [{ type: "text", text }],
      structuredContent: structured,
      isError,
    };
  }
);

server.registerTool(
  "list-sessions",
  {
    description:
      "List local qodercli sessions (index + id + summary) so you can pick " +
      "a resume_session_id for ask-qoder.",
    inputSchema: {},
    outputSchema: { content: z.string() },
  },
  async () => {
    const res = await runQodercli(["--list-sessions"], { timeoutMs: 30000 });
    const text =
      (res.stdout.trim() || res.stderr.trim()) ||
      "[qodercli-mcp] no sessions found";
    return {
      content: [{ type: "text", text }],
      structuredContent: { content: text },
      isError: !res.ok,
    };
  }
);

server.registerTool(
  "list-models",
  {
    description:
      "List models currently supported by qodercli. Use this before picking " +
      "a model name for ask-qoder.",
    inputSchema: {},
    outputSchema: {
      content: z.string().describe("Model names, one per line."),
      models: z.array(z.string()).describe("Model names as an array."),
    },
  },
  async () => {
    const res = await runQodercli(["--list-models"], { timeoutMs: 30000 });
    const raw = (res.stdout.trim() || res.stderr.trim()) ||
      "[qodercli-mcp] failed to list models";
    // The CLI prints a "MODEL" header followed by one name per line.
    const models = res.stdout
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && l !== "MODEL");
    return {
      content: [{ type: "text", text: raw }],
      structuredContent: { content: raw, models },
      isError: !res.ok,
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[qodercli-mcp] server running on stdio (binary: ${QODERCLI_BIN})`);
  if (HTTP_PROXY || HTTPS_PROXY) {
    console.error(
      `[qodercli-mcp] Proxy enabled:`,
      HTTP_PROXY && `HTTP_PROXY=${HTTP_PROXY}`,
      HTTPS_PROXY && `HTTPS_PROXY=${HTTPS_PROXY}`
    );
  }
}

main().catch((err) => {
  console.error("[qodercli-mcp] fatal:", err);
  process.exit(1);
});
