# Run Google Docs MCP 24/7

Two options so you don't have to manually start the server:

---

## Option 1: Deploy to Render (Best – runs even when laptop is off)

Server runs in the cloud. Claude connects directly. No tunnel needed.

### Steps

1. **Push to GitHub** (if not already). Ensure `credentials.json` and `token.json` are in `.gitignore`.

2. **Prepare env vars** (minified JSON, one line):
   ```bash
   cat credentials.json | tr -d '\n' | tr -s ' '
   cat token.json | tr -d '\n' | tr -s ' '
   ```

3. **Deploy on Render:**
   - [dashboard.render.com](https://dashboard.render.com) → New → Web Service
   - Connect your repo
   - Build: `npm install`
   - Start: `node server-http.js`
   - Add env vars (as **Secret**):
     - `GOOGLE_CREDENTIALS_JSON` = (first JSON)
     - `GOOGLE_TOKEN_JSON` = (second JSON)

4. **Claude URL:** `https://YOUR-APP.onrender.com/mcp`

**Note:** Free tier sleeps after 15 min. First request may take ~30 sec. Use [UptimeRobot](https://uptimerobot.com) to ping every 14 min to keep it awake.

---

## Option 2: macOS launchd (runs when Mac is on)

Starts on login, restarts if it crashes. Still need a tunnel (ngrok/cloudflared) for Claude.

### Setup

1. Create the plist:
   ```bash
   mkdir -p ~/Library/LaunchAgents
   ```

2. Copy and install the plist (fix node path if needed – run `which node` first):
   ```bash
   # If node is at /opt/homebrew/bin/node (Apple Silicon), the included plist works.
   # Otherwise edit com.google-docs-mcp.plist and change the node path.
   cp /Users/afridshaik/google-docs-mcp/com.google-docs-mcp.plist ~/Library/LaunchAgents/
   ```

   Or create `~/Library/LaunchAgents/com.google-docs-mcp.plist` manually:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.google-docs-mcp</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/afridshaik/google-docs-mcp/server-http.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/Users/afridshaik/google-docs-mcp</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/google-docs-mcp.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/google-docs-mcp.err</string>
</dict>
</plist>
```

3. Fix node path if needed:
   ```bash
   which node   # e.g. /opt/homebrew/bin/node
   ```
   Update `ProgramArguments` with your node path.

4. Load and start:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.google-docs-mcp.plist
   ```

5. Check:
   ```bash
   curl http://localhost:3000/
   ```

### Commands

| Action | Command |
|--------|---------|
| Stop | `launchctl unload ~/Library/LaunchAgents/com.google-docs-mcp.plist` |
| Start | `launchctl load ~/Library/LaunchAgents/com.google-docs-mcp.plist` |
| Logs | `tail -f /tmp/google-docs-mcp.log` |

---

## Summary

| Option | When it runs | Tunnel needed |
|--------|--------------|---------------|
| **Render** | 24/7 (cloud) | No |
| **launchd** | When Mac is on | Yes (ngrok/cloudflared) |
