#!/usr/bin/env node
/**
 * Insert LFU cache content at top of interview doc (black highlight, white text).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS = join(__dirname, "credentials.json");
const TOKEN = join(__dirname, "token.json");
const DOC_ID = process.argv[2] || "1uok9aFtCpjUFKG61t8G-xnOTblFkD6-e84BytkZXGJM";

const LFU_CONTENT = `

LFU (Least Frequently Used) Cache

PROBLEM:
Design a cache that evicts the least frequently used item when capacity is exceeded. On a tie, evict least recently used.

API: get(key), put(key, value) — both O(1) avg.

APPROACH:
- Use a dict for key → (value, freq)
- Use freq → OrderedDict (or DLL) to track items at each frequency
- min_freq tracks current minimum frequency

SOLUTION (Python):

from collections import defaultdict
from collections import OrderedDict

class LFUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.key_to_val_freq = {}
        self.freq_to_keys = defaultdict(OrderedDict)
        self.min_freq = 0

    def get(self, key: int) -> int:
        if key not in self.key_to_val_freq:
            return -1
        val, freq = self.key_to_val_freq[key]
        self._update_freq(key, val, freq)
        return val

    def put(self, key: int, value: int) -> None:
        if self.cap == 0:
            return
        if key in self.key_to_val_freq:
            _, freq = self.key_to_val_freq[key]
            self._update_freq(key, value, freq)
            return
        if len(self.key_to_val_freq) >= self.cap:
            k, _ = self.freq_to_keys[self.min_freq].popitem(last=False)
            del self.key_to_val_freq[k]
        self.key_to_val_freq[key] = (value, 1)
        self.freq_to_keys[1][key] = None
        self.min_freq = 1

    def _update_freq(self, key, val, freq):
        del self.freq_to_keys[freq][key]
        if not self.freq_to_keys[freq] and freq == self.min_freq:
            self.min_freq += 1
        new_freq = freq + 1
        self.key_to_val_freq[key] = (val, new_freq)
        self.freq_to_keys[new_freq][key] = None

# Time: O(1) get/put | Space: O(capacity)

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
  await insertBlockAtTop(docs, DOC_ID, LFU_CONTENT);

  console.log("Inserted LFU cache as solid black block at top.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
