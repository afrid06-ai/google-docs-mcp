#!/usr/bin/env node
/**
 * Insert content at top with black background + white text (text-level style).
 * When you delete the text, the black goes with it - no table.
 * Usage: node append-with-table-block.js "Your content here" [DOC_ID]
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS = join(__dirname, "credentials.json");
const TOKEN = join(__dirname, "token.json");
const DEFAULT_DOC_ID = "1uok9aFtCpjUFKG61t8G-xnOTblFkD6-e84BytkZXGJM";

async function appendAsTextBlock(content, docId = DEFAULT_DOC_ID) {
  if (!existsSync(CREDENTIALS) || !existsSync(TOKEN)) {
    throw new Error("Missing credentials.json or token.json. Run: node auth.js");
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
  await insertBlockAtTop(docs, docId, content);
  return docId;
}

const content = process.argv[2] || "Sample content";
const docId = process.argv[3] || DEFAULT_DOC_ID;

appendAsTextBlock(content, docId)
  .then((id) => console.log(`Inserted at top of doc ${id} (black bg + white text on text)`))
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
