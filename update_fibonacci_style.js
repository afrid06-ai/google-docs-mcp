#!/usr/bin/env node
/**
 * Update Fibonacci code block to black background + white text.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS = join(__dirname, "credentials.json");
const TOKEN = join(__dirname, "token.json");
const DOC_ID = "1uok9aFtCpjUFKG61t8G-xnOTblFkD6-e84BytkZXGJM";

const FIBONACCI_CODE_LENGTH = 160;

async function main() {
  if (!existsSync(CREDENTIALS) || !existsSync(TOKEN)) {
    console.error("Missing credentials.json or token.json.");
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

  const getRes = await docs.documents.get({ documentId: DOC_ID });
  const content = getRes.data.body?.content || [];
  const lastElement = content[content.length - 1];
  const endIndex = lastElement ? lastElement.endIndex : 1;
  const startIndex = Math.max(1, endIndex - FIBONACCI_CODE_LENGTH);

  await docs.documents.batchUpdate({
    documentId: DOC_ID,
    requestBody: {
      requests: [
        {
          updateTextStyle: {
            range: {
              startIndex,
              endIndex,
              segmentId: "",
            },
            textStyle: {
              backgroundColor: {
                color: { rgbColor: { red: 0, green: 0, blue: 0 } },
              },
              foregroundColor: {
                color: { rgbColor: { red: 1, green: 1, blue: 1 } },
              },
            },
            fields: "backgroundColor,foregroundColor",
          },
        },
      ],
    },
  });

  console.log("Updated Fibonacci code to black background, white text.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
