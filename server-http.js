#!/usr/bin/env node
/**
 * Google Docs MCP Server - HTTP transport for Docker / Claude / ngrok
 * Listens on port 3000 (or PORT env). Use with ngrok or cloud deploy.
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { google } from "googleapis";
import { z } from "zod";
import { insertBlockAtTop } from "./append-utils.js";
import { readFileSync, existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CREDENTIALS_PATH = join(__dirname, "credentials.json");
const TOKEN_PATH = join(__dirname, "token.json");

function loadCredentials() {
  const env = process.env.GOOGLE_CREDENTIALS_JSON;
  if (env) {
    try { return JSON.parse(env); } catch (_) {}
  }
  if (existsSync(CREDENTIALS_PATH)) return JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
  return null;
}
function loadToken() {
  const env = process.env.GOOGLE_TOKEN_JSON;
  if (env) {
    try { return JSON.parse(env); } catch (_) {}
  }
  if (existsSync(TOKEN_PATH)) return JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
  return null;
}
function hasAuth() {
  const c = loadCredentials();
  const t = loadToken();
  return c && t && (c.installed || c.web);
}

function createServer() {
  const server = new McpServer({
    name: "google-docs",
    version: "1.0.0",
  });

  server.registerTool(
    "ping",
    {
      description: "Test connectivity. Returns pong.",
      inputSchema: {},
    },
    async () => ({ content: [{ type: "text", text: "pong" }] })
  );

  server.registerTool(
    "read_doc",
    {
      description:
        "Read a Google Doc by document ID from the URL (docs.google.com/document/d/DOC_ID/edit)",
      inputSchema: {
        docId: z.string().describe("The Google Doc document ID from the URL"),
      },
    },
    async ({ docId }) => {
      try {
        if (!hasAuth()) {
          return { content: [{ type: "text", text: "Error: Set GOOGLE_CREDENTIALS_JSON and GOOGLE_TOKEN_JSON (cloud) or run auth locally." }] };
        }
        const credentials = loadCredentials();
        const cred = credentials.installed || credentials.web;
        const { client_secret, client_id, redirect_uris } = cred;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, (redirect_uris && redirect_uris[0]) || "urn:ietf:wg:oauth:2.0:oob");
        oAuth2Client.setCredentials(loadToken());
        const docs = google.docs({ version: "v1", auth: oAuth2Client });
        const res = await docs.documents.get({ documentId: docId });
        const body = res.data.body;
        const content = body?.content || [];
        let docText = "";
        for (const block of content) {
          if (block.paragraph?.elements) {
            for (const elem of block.paragraph.elements) {
              if (elem.textRun?.content) docText += elem.textRun.content;
            }
          }
        }
        const title = res.data.title || "Untitled";
        return { content: [{ type: "text", text: `# ${title}\n\n${docText.trim() || "(empty)"}` }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err?.message || err}` }] };
      }
    }
  );

  server.registerTool(
    "write_doc",
    {
      description:
        "Insert text at TOP of a Google Doc with black background and white text. Use document ID from URL.",
      inputSchema: {
        docId: z.string().describe("The Google Doc document ID"),
        text: z.string().describe("The text to insert"),
      },
    },
    async ({ docId, text }) => {
      try {
        if (!hasAuth()) {
          return { content: [{ type: "text", text: "Error: Set GOOGLE_CREDENTIALS_JSON and GOOGLE_TOKEN_JSON (cloud) or run auth locally." }] };
        }
        const credentials = loadCredentials();
        const cred = credentials.installed || credentials.web;
        const { client_secret, client_id, redirect_uris } = cred;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, (redirect_uris && redirect_uris[0]) || "urn:ietf:wg:oauth:2.0:oob");
        oAuth2Client.setCredentials(loadToken());
        const docs = google.docs({ version: "v1", auth: oAuth2Client });
        await insertBlockAtTop(docs, docId, text);
        return { content: [{ type: "text", text: "Successfully inserted at top of document." }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err?.message || err}` }] };
      }
    }
  );

  return server;
}

const app = createMcpExpressApp({ host: "0.0.0.0" });

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: String(err) }, id: null });
    }
  } finally {
    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });
  }
});

app.get("/mcp", (req, res) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null });
});
app.get("/", (req, res) => res.json({ status: "ok", service: "google-docs-mcp" }));

const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, "0.0.0.0", (err) => {
  if (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
  console.log(`Google Docs MCP HTTP server listening on port ${PORT}`);
});
