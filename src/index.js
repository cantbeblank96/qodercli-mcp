#!/usr/bin/env node
/**
 * qodercli-mcp — a minimal MCP server that wraps qodercli (Qoder CLI).
 *
 * It lets any MCP client (Qoder IDE, Claude Code, Cursor, ...) delegate
 * coding tasks to a local qodercli agent via the `ask-qoder` tool.
 *
 * Environment variables:
 *   QODERCLI_PATH       Absolute path to the qodercli binary
 *                       (default: "qodercli" resolved via PATH).
 *   QODERCLI_TIMEOUT_MS Default per-call timeout in milliseconds
 *                       (default: 600000 = 10 minutes).
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

/**
 * Spawn qodercli and collect its output. Never throws; always resolves
 * with a structured result so the MCP layer can report errors cleanly.
 */
function runQodercli(args, { cwd, timeoutMs }) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;

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

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch {
        /* already dead */
      }
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

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
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      resolve({ ok: code === 0, code, stdout, stderr, timedOut });
    });
  });
}

function buildCliArgs(opts) {
  const args = ["-p"];
  if (opts.resume_session_id) args.push("-r", opts.resume_session_id);
  if (opts.model) args.push("-m", opts.model);
  args.push("--permission-mode", opts.permission_mode ?? DEFAULT_PERMISSION_MODE);
  if (opts.output_format) args.push("-o", opts.output_format);
  if (opts.cwd) args.push("-w", opts.cwd);
  if (opts.extra_args) args.push(...opts.extra_args);
  args.push(opts.prompt);
  return args;
}

const server = new McpServer({
  name: "qodercli-mcp",
  version: "0.1.0",
});

server.tool(
  "ask-qoder",
  "Delegate a task to qodercli (Qoder CLI), a local agentic coding assistant. " +
    "Use it to get a second opinion, a code review, or to have Qoder perform " +
    "a self-contained coding task in a given working directory. " +
    "Pass resume_session_id to continue a previous conversation.",
  {
    prompt: z.string().describe("The task or question for qodercli."),
    cwd: z
      .string()
      .optional()
      .describe("Working directory for qodercli (project to operate on)."),
    model: z.string().optional().describe("Model to use for this session."),
    permission_mode: z
      .enum(PERMISSION_MODES)
      .optional()
      .describe(`Permission mode (default: ${DEFAULT_PERMISSION_MODE}).`),
    resume_session_id: z
      .string()
      .optional()
      .describe("Resume a previous qodercli session by its identifier."),
    output_format: z
      .string()
      .optional()
      .describe("CLI output format passed to -o (e.g. text, json)."),
    extra_args: z
      .array(z.string())
      .optional()
      .describe("Additional raw CLI arguments appended before the prompt."),
    timeout_ms: z
      .number()
      .int()
      .positive()
      .max(MAX_TIMEOUT_MS)
      .optional()
      .describe(`Timeout in ms (default: ${DEFAULT_TIMEOUT_MS}).`),
  },
  async (opts) => {
    const args = buildCliArgs(opts);
    const res = await runQodercli(args, {
      cwd: opts.cwd,
      timeoutMs: opts.timeout_ms ?? DEFAULT_TIMEOUT_MS,
    });

    const parts = [];
    if (res.stdout.trim()) parts.push(res.stdout.trim());
    if (res.stderr.trim()) parts.push(`[stderr]\n${res.stderr.trim()}`);
    if (res.timedOut) {
      parts.push(`[qodercli-mcp] process killed after ${opts.timeout_ms ?? DEFAULT_TIMEOUT_MS}ms timeout`);
    } else if (!res.ok) {
      parts.push(`[qodercli-mcp] qodercli exited with code ${res.code}`);
    }

    const text = parts.join("\n\n") || "[qodercli-mcp] qodercli produced no output";
    return { content: [{ type: "text", text }], isError: !res.ok };
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
