#!/usr/bin/env node
/**
 * Google Docs MCP Server - Stdio transport for Cursor
 * Uses McpServer + StdioServerTransport (no HTTP, no port)
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";
import { z } from "zod";
import { insertBlockAtTop } from "./append-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCOPES = ["https://www.googleapis.com/auth/documents"];
const CREDENTIALS_PATH = join(__dirname, "credentials.json");
const TOKEN_PATH = join(__dirname, "token.json");

const server = new McpServer({
  name: "google-docs",
  version: "1.0.0",
});

// 1. Ping tool - minimal connectivity test
server.registerTool(
  "ping",
  {
    description: "Test connectivity to the Google Docs MCP server. Returns pong.",
    inputSchema: {},
  },
  async () => {
    return {
      content: [{ type: "text", text: "pong" }],
    };
  }
);

// 2. read_doc tool - read Google Doc by ID
server.registerTool(
  "read_doc",
  {
    description:
      "Read the content of a Google Doc by its document ID. The doc ID is the string in the document URL (e.g. docs.google.com/document/d/DOC_ID/edit)",
    inputSchema: {
      docId: z.string().describe("The Google Doc document ID from the URL"),
    },
  },
  async ({ docId }) => {
    try {
      if (!existsSync(CREDENTIALS_PATH)) {
        return {
          content: [
            {
              type: "text",
              text: "Error: credentials.json not found. Run 'node auth.js' first to set up OAuth.",
            },
          ],
        };
      }

      if (!existsSync(TOKEN_PATH)) {
        return {
          content: [
            {
              type: "text",
              text: "Error: token.json not found. Run 'node auth.js' once to authorize and create token.json.",
            },
          ],
        };
      }

      const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
      const { client_secret, client_id, redirect_uris } = credentials.installed;

      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      oAuth2Client.setCredentials(
        JSON.parse(readFileSync(TOKEN_PATH, "utf8"))
      );

      const docs = google.docs({ version: "v1", auth: oAuth2Client });
      const res = await docs.documents.get({ documentId: docId });

      const body = res.data.body;
      const content = body?.content || [];
      let docText = "";

      for (const block of content) {
        if (block.paragraph?.elements) {
          for (const elem of block.paragraph.elements) {
            if (elem.textRun?.content) {
              docText += elem.textRun.content;
            }
          }
        }
      }

      const title = res.data.title || "Untitled";
      const output = `# ${title}\n\n${docText.trim() || "(empty document)"}`;

      return {
        content: [{ type: "text", text: output }],
      };
    } catch (err) {
      const msg = err?.message || String(err);
      return {
        content: [
          {
            type: "text",
            text: `Error reading document: ${msg}`,
          },
        ],
      };
    }
  }
);

// 3. write_doc tool - append text to a Google Doc
server.registerTool(
  "write_doc",
  {
    description:
      "Insert text at the TOP of a Google Doc with black background and white text (text-level style; when you delete the text, the black goes with it). Use the document ID from the URL.",
    inputSchema: {
      docId: z.string().describe("The Google Doc document ID from the URL"),
      text: z.string().describe("The text to append to the document"),
    },
  },
  async ({ docId, text }) => {
    try {
      if (!existsSync(CREDENTIALS_PATH)) {
        return {
          content: [
            {
              type: "text",
              text: "Error: credentials.json not found. Run 'node auth.js' first.",
            },
          ],
        };
      }

      if (!existsSync(TOKEN_PATH)) {
        return {
          content: [
            {
              type: "text",
              text: "Error: token.json not found. Run 'node auth.js' once to authorize.",
            },
          ],
        };
      }

      const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
      const { client_secret, client_id, redirect_uris } = credentials.installed;

      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      oAuth2Client.setCredentials(
        JSON.parse(readFileSync(TOKEN_PATH, "utf8"))
      );

      const docs = google.docs({ version: "v1", auth: oAuth2Client });

      // Insert as solid black block at top (table with black cell + white text)
      await insertBlockAtTop(docs, docId, text);

      return {
        content: [
          {
            type: "text",
            text: `Successfully inserted as solid black block at top of document.`,
          },
        ],
      };
    } catch (err) {
      const msg = err?.message || String(err);
      return {
        content: [
          {
            type: "text",
            text: `Error writing to document: ${msg}`,
          },
        ],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});
