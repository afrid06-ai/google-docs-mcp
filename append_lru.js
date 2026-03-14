#!/usr/bin/env node
/**
 * Insert LRU Cache with line-by-line explanation at top of interview doc.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS = join(__dirname, "credentials.json");
const TOKEN = join(__dirname, "token.json");
const DOC_ID = process.argv[2] || "1uok9aFtCpjUFKG61t8G-xnOTblFkD6-e84BytkZXGJM";

const LRU_CONTENT = `

LRU CACHE — Full Code with Line-by-Line Explanation

PROBLEM: Design a cache that evicts the Least Recently Used item when capacity is full.
API: get(key) → value, put(key, value), both O(1) average.

APPROACH: HashMap + Doubly Linked List
- HashMap: O(1) lookup by key → node
- DLL: O(1) add/remove at head and tail; keeps access order (recent = head, least = tail)

---

COMPLETE CODE (Python):

from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):           # 1. Constructor
        self.cap = capacity                      # 2. Store max capacity
        self.cache = OrderedDict()              # 3. OrderedDict = hash map + DLL internally

    def get(self, key: int) -> int:             # 4. Get value for key
        if key not in self.cache:                # 5. Key not in cache
            return -1                            # 6. Return -1 per problem
        self.cache.move_to_end(key)              # 7. Move to end = mark as most recent
        return self.cache[key]                   # 8. Return value

    def put(self, key: int, value: int) -> None:# 9. Insert/update key-value
        if key in self.cache:                    # 10. Key exists: update
            self.cache.move_to_end(key)          # 11. Move to end (most recent)
            self.cache[key] = value             # 12. Update value
            return                               # 13. Done
        if len(self.cache) >= self.cap:         # 14. Cache full, must evict
            self.cache.popitem(last=False)      # 15. Remove least recent (first item)
        self.cache[key] = value                  # 16. Add new key at end (most recent)

---

LINE-BY-LINE EXPLANATION:

1-3: __init__ takes capacity; cache is OrderedDict which maintains insertion order.
     First item = least recently used, Last item = most recently used.

4-8: get(key): If key missing, return -1. Else move_to_end(key) puts it at "most recent"
     position, then return value. move_to_end is O(1) in OrderedDict.

9-16: put(key, value):
  - 10-13: If key exists, move to end + update value, return.
  - 14-15: If cache full (len >= cap), popitem(last=False) removes the FIRST item
           (least recently used) since we access from the front.
  - 16: Add new (key, value) at end. OrderedDict adds at end by default.

WHY OrderedDict?
- Regular dict: no order guarantee (Python 3.7+ preserves insert order, but no move_to_end).
- OrderedDict: explicitly maintains order; move_to_end(key) in O(1) for re-access.

ALTERNATIVE (Custom DLL + HashMap): Same idea—DLL for order, HashMap for O(1) lookup.
Time: O(1) get, O(1) put | Space: O(capacity)

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
  await insertBlockAtTop(docs, DOC_ID, LRU_CONTENT);

  console.log("Inserted LRU Cache with line-by-line explanation at top.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
