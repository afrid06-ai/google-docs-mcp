#!/usr/bin/env node
/**
 * One-time OAuth setup for LinkedIn MCP.
 * Run: node auth.js
 * Creates token.json for use by the MCP server.
 *
 * Prerequisites:
 * 1. Create app at https://developer.linkedin.com/
 * 2. Add "Share on LinkedIn" or "Marketing API" product
 * 3. Request scopes: openid, profile, w_member_social
 * 4. Save Client ID and Client Secret as linkedin-credentials.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { parse } from "node:url";

const SCOPES = ["openid", "profile", "w_member_social"];
const CREDENTIALS_PATH = "linkedin-credentials.json";
const TOKEN_PATH = "token.json";
const REDIRECT_PORT = 3999;

async function authorize() {
  if (!existsSync(CREDENTIALS_PATH)) {
    console.error(
      "Error: linkedin-credentials.json not found.\n\n" +
        "1. Go to https://developer.linkedin.com/\n" +
        "2. Create an app and add 'Share on LinkedIn' / Marketing API\n" +
        "3. In Auth tab, add redirect: http://localhost:3999/callback\n" +
        "4. Create linkedin-credentials.json:\n" +
        '   { "client_id": "YOUR_CLIENT_ID", "client_secret": "YOUR_CLIENT_SECRET" }\n'
    );
    process.exit(1);
  }

  const cred = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
  const { client_id, client_secret } = cred;

  const redirectUri = `http://localhost:${REDIRECT_PORT}/callback`;
  const authUrl =
    "https://www.linkedin.com/oauth/v2/authorization?" +
    new URLSearchParams({
      response_type: "code",
      client_id,
      redirect_uri: redirectUri,
      scope: SCOPES.join(" "),
      state: "linkedin-mcp-" + Math.random().toString(36).slice(2),
    }).toString();

  console.log("\n1. Open this URL in your browser:\n");
  console.log(authUrl);
  console.log("\n2. Authorize the app and you'll be redirected back.\n");

  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const { pathname, query } = parse(req.url, true);
      if (pathname !== "/callback") {
        res.writeHead(404);
        res.end();
        return;
      }

      const code = query.code;
      if (!code) {
        res.writeHead(400);
        res.end("Missing code. Try again.");
        server.close();
        resolve(null);
        return;
      }

      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id,
          client_secret,
        }).toString(),
      });

      const tokens = await tokenRes.json();
      if (tokens.error) {
        res.writeHead(200);
        res.end(`Error: ${tokens.error_description || tokens.error}`);
        server.close();
        resolve(null);
        return;
      }

      writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      res.writeHead(200);
      res.end("Success! You can close this tab. token.json has been saved.");
      server.close();
      resolve(tokens);
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`Listening on http://localhost:${REDIRECT_PORT} for callback...\n`);
    });
  });
}

authorize().catch((err) => {
  console.error(err);
  process.exit(1);
});
