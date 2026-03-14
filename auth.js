#!/usr/bin/env node
/**
 * One-time OAuth setup for Google Docs MCP.
 * Run: node auth.js
 * Creates token.json for use by the MCP server.
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import readline from "node:readline";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCOPES = ["https://www.googleapis.com/auth/documents"];
const CREDENTIALS_PATH = join(__dirname, "credentials.json");
const TOKEN_PATH = join(__dirname, "token.json");

async function authorize() {
  if (!existsSync(CREDENTIALS_PATH)) {
    console.error(
      "Error: credentials.json not found.\n" +
        "1. Go to https://console.cloud.google.com/\n" +
        "2. Create OAuth 2.0 credentials (Desktop app)\n" +
        "3. Download and save as credentials.json in this folder"
    );
    process.exit(1);
  }

  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(
      JSON.parse(readFileSync(TOKEN_PATH, "utf8"))
    );
    console.log("Already authorized. token.json exists.");
    return;
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("Authorize this app by visiting:\n", authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise((resolve) => {
    rl.question("Enter the code from that page: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log("Saved token to token.json. You can now use the MCP server.");
}

authorize().catch((err) => {
  console.error(err);
  process.exit(1);
});
