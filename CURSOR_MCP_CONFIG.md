# Cursor MCP Config for Google Docs

## Fix: "Cannot find module '/Users/afridshaik/server.js'"

The error occurs because Cursor runs `node server.js` from your home directory instead of the project folder. Use **one** of these configs:

---

## Option A: Use `cwd` (recommended)

Add this to **Cursor Settings → MCP → Edit Config** (or `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "google-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["server.js"],
      "cwd": "/Users/afridshaik/google-docs-mcp"
    }
  }
}
```

---

## Option B: Absolute path to server.js

```json
{
  "mcpServers": {
    "google-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/afridshaik/google-docs-mcp/server.js"]
    }
  }
}
```

---

## Option C: If workspace is `google-docs-mcp`

If you open Cursor with the folder `google-docs-mcp` as the workspace root:

```json
{
  "mcpServers": {
    "google-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["./server.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

*(Note: `${workspaceFolder}` may or may not be supported—use Option A if unsure.)*

---

## Setup Steps

1. **Install dependencies:** `npm install` (already done)
2. **Create credentials.json:** Get OAuth 2.0 credentials from [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth client (Desktop)
3. **Authorize:** Run `npm run auth` or `node auth.js` once, follow the URL, paste the code → creates `token.json`
4. **Restart Cursor** after updating MCP config
5. **Test:** Ask Cursor to use the `ping` tool, then try `read_doc` with a Google Doc ID
