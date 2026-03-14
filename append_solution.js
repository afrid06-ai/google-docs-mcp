#!/usr/bin/env node
/**
 * Append the Amazon Flash Sale solution to a Google Doc.
 * Usage: node append_solution.js [DOC_ID]
 * Default doc ID: 1uok9aFtCpjUFKG61t8G-xnOTblFkD6-e84BytkZXGJM
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS = join(__dirname, "credentials.json");
const TOKEN = join(__dirname, "token.json");
const DOC_ID = process.argv[2] || "1uok9aFtCpjUFKG61t8G-xnOTblFkD6-e84BytkZXGJM";

const content = `
AMAZON FLASH SALE: Minimum Cost Subarray with Adjacent Difference Constraint

PROBLEM:
Given N product prices and window size K, find the minimum cost contiguous subarray of size K where no two adjacent products have a price difference > threshold T.

Input: prices = [10, 12, 15, 11, 9, 8, 7, 20], K = 3, T = 4
Output: 24 → subarray [9, 8, 7], diffs = [1, 1] ≤ 4 ✓

Constraints: 1 ≤ K ≤ N ≤ 10^5, 0 ≤ T ≤ 10^4

---

SOLUTION (Python):

def min_cost_subarray(prices, K, T):
    """Find min sum contiguous subarray of size K with adjacent diff ≤ T."""
    n = len(prices)
    if n < K:
        return -1

    min_sum = float('inf')
    for i in range(n - K + 1):
        window = prices[i : i + K]
        valid = True
        for j in range(len(window) - 1):
            if abs(window[j + 1] - window[j]) > T:
                valid = False
                break
        if valid:
            min_sum = min(min_sum, sum(window))

    return min_sum if min_sum != float('inf') else -1

# Example:
prices = [10, 12, 15, 11, 9, 8, 7, 20]
K, T = 3, 4
print(min_cost_subarray(prices, K, T))  # 24 → [9, 8, 7]

---

EXPLANATION:

1. Sliding Window: We slide a window of size K over the array. For each position i, we consider the subarray prices[i : i+K].

2. Validity Check: For each window, check that every adjacent pair satisfies |prices[j+1] - prices[j]| ≤ T. If any pair exceeds T, skip this window.

3. Cost = Sum: The cost of a window is the sum of its elements. We keep the minimum sum among all valid windows.

4. Example Walkthrough:
   - [10,12,15]: diffs 2,3 ✓ sum=37
   - [12,15,11]: diffs 3,4 ✓ sum=38
   - [15,11,9]: diffs 4,2 ✓ sum=35
   - [11,9,8]: diffs 2,1 ✓ sum=28
   - [9,8,7]: diffs 1,1 ✓ sum=24 ← MINIMUM
   - [8,7,20]: diff 13 > 4 ✗ invalid

5. Complexity: Time O(N*K), Space O(1)
`;

async function append() {
  if (!existsSync(CREDENTIALS) || !existsSync(TOKEN)) {
    console.error("Missing credentials.json or token.json. Run: node auth.js");
    process.exit(1);
  }

  const creds = JSON.parse(readFileSync(CREDENTIALS, "utf8"));
  const { client_secret, client_id, redirect_uris } = creds.installed;
  const oauth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oauth.setCredentials(JSON.parse(readFileSync(TOKEN, "utf8")));

  const docs = google.docs({ version: "v1", auth: oauth });

  const { insertBlockAtTop } = await import("./append-utils.js");
  await insertBlockAtTop(docs, DOC_ID, content);

  console.log(`Inserted solid black block at top of doc ${DOC_ID}`);
}

append().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
