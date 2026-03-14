#!/usr/bin/env node
/**
 * Prepares credentials for Render env vars.
 * Run: node prepare-render.js
 * Copy each output block into Render's Environment Variables.
 */
import { readFileSync, existsSync } from "node:fs";

const credPath = "credentials.json";
const tokenPath = "token.json";

if (!existsSync(credPath) || !existsSync(tokenPath)) {
  console.error("Error: credentials.json and token.json must exist. Run node auth.js first.");
  process.exit(1);
}

const cred = readFileSync(credPath, "utf8");
const token = readFileSync(tokenPath, "utf8");

const credMin = JSON.stringify(JSON.parse(cred));
const tokenMin = JSON.stringify(JSON.parse(token));

console.log("\n=== GOOGLE_CREDENTIALS_JSON (copy everything below, paste in Render) ===\n");
console.log(credMin);
console.log("\n=== GOOGLE_TOKEN_JSON (copy everything below, paste in Render) ===\n");
console.log(tokenMin);
console.log("\n");
