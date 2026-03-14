# Deploy Google Docs MCP with Docker + ngrok

## Prerequisites

- Docker and Docker Compose (for Docker flow) or Node.js (for local flow)
- `credentials.json` and `token.json` (run `node auth.js` first)
- ngrok (for local exposure)

---

## Claude Remote MCP (Node + ngrok)

Fastest way to use with Claude without Docker:

```bash
# 1. Start the HTTP server
node server-http.js

# 2. In another terminal, configure ngrok (one-time)
# Sign up: https://dashboard.ngrok.com/signup
# Get token: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN

# 3. Expose port 3000
ngrok http 3000
```

Use the ngrok HTTPS URL (e.g. `https://abc123.ngrok-free.app`) in Claude's **Remote MCP server URL** field. The full MCP endpoint is:

```
https://YOUR-NGROK-URL.ngrok-free.app/mcp
```

Example: If ngrok shows `Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000`, use:

```
https://abc123.ngrok-free.app/mcp
```

---

## Quick Start (Docker)

```bash
# 1. Ensure credentials exist
ls credentials.json token.json   # must exist

# 2. Build and run
docker compose up --build

# 3. In another terminal, expose with ngrok (after ngrok config add-authtoken)
ngrok http 3000
```

Use the ngrok HTTPS URL in Claude as above.

---

## Commands

| Command | Description |
|---------|-------------|
| `docker compose up --build` | Build and run |
| `docker compose up -d` | Run in background |
| `docker compose down` | Stop |
| `docker compose logs -f` | View logs |

---

## Volume Mounts

- `credentials.json` and `token.json` are mounted from your host. Keep them in the project folder.

## Test It

```bash
# Test localhost
node test-mcp.js

# Test ngrok (use your ngrok URL)
node test-mcp.js https://YOUR-NGROK-URL.ngrok-free.dev
```

Expected: `✅ MCP server is working!` with ping → pong and tools listed.

## Security

- Do not commit `credentials.json` or `token.json` to git
- ngrok URLs are public; anyone with the URL could use your Google Docs access
- For production, use a proper cloud deploy with auth
