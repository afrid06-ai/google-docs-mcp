#!/usr/bin/env node
/**
 * Append Fibonacci series content with black background to interview doc.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS = join(__dirname, "credentials.json");
const TOKEN = join(__dirname, "token.json");
const DOC_ID = "1uok9aFtCpjUFKG61t8G-xnOTblFkD6-e84BytkZXGJM";

const FIBONACCI_CONTENT = `

FIBONACCI SERIES — Background & Overview

The Fibonacci sequence is a famous integer sequence where each number is the sum of the two preceding ones: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...

History: Named after Leonardo of Pisa (Fibonacci), who introduced it in his 1202 book "Liber Abaci" while describing rabbit population growth.

Definition: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2) for n≥2

Recurrence relation: Each term depends on the previous two — a classic example of recursion and dynamic programming.

Applications: Golden ratio, nature (spirals in shells, sunflower seeds), algorithms (recursion vs DP), coding interviews.

`;

async function main() {
  if (!existsSync(CREDENTIALS) || !existsSync(TOKEN)) {
    console.error("Missing credentials.json or token.json. Run: node auth.js");
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(CREDENTIALS, "utf8"));
  const oauth = new google.auth.OAuth2(
    creds.installed.client_id,
    creds.installed.client_secret,
    creds.installed.redirect_uris[0]
  );
  oauth.setCredentials(JSON.parse(readFileSync(TOKEN, "utf8")));
  const docs = google.docs({ version: "v1", auth: oauth });

  const { insertBlockAtTop } = await import("./append-utils.js");
  await insertBlockAtTop(docs, DOC_ID, FIBONACCI_CONTENT);

  console.log("Inserted Fibonacci section as solid black block at top.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
