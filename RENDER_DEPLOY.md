# Deploy Google Docs MCP to Render

Server runs in the cloud 24/7. Claude connects directly—no tunnel or local machine needed.

---

## Step 1: Push to GitHub

```bash
cd /Users/afridshaik/google-docs-mcp
git init   # if not already a repo
git add .
git commit -m "Deploy to Render"
git remote add origin https://github.com/YOUR_USERNAME/google-docs-mcp.git
git push -u origin main
```

**Important:** `credentials.json` and `token.json` must be in `.gitignore` (they already are). Never commit them.

---

## Step 2: Prepare credentials for env vars

Run this and copy each block into Render:

```bash
cd /Users/afridshaik/google-docs-mcp
node prepare-render.js
```

Copy the first block → `GOOGLE_CREDENTIALS_JSON`  
Copy the second block → `GOOGLE_TOKEN_JSON`

---

## Step 3: Deploy on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign up/login (free).

2. Click **New +** → **Web Service**.

3. Connect your GitHub account and select the `google-docs-mcp` repo.

4. Configure:
   - **Name:** `google-docs-mcp` (or any name)
   - **Region:** Oregon (or nearest)
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `node server-http.js`
   - **Instance Type:** Free

5. Click **Advanced** and add Environment Variables:
   - **Key:** `GOOGLE_CREDENTIALS_JSON`  
     **Value:** (paste the credentials JSON from Step 2)  
     **Type:** Secret
   - **Key:** `GOOGLE_TOKEN_JSON`  
     **Value:** (paste the token JSON from Step 2)  
     **Type:** Secret

6. Click **Create Web Service**.

7. Wait for the first deploy to finish (2–3 min).

---

## Step 4: Get your URL

After deploy, Render shows a URL like:
```
https://google-docs-mcp-xxxx.onrender.com
```

**Claude Remote MCP URL:**
```
https://google-docs-mcp-xxxx.onrender.com/mcp
```

Add this in **Claude → Settings → Remote MCP → Remote MCP server URL**.

---

## Step 5: Test

```bash
node test-mcp.js https://google-docs-mcp-xxxx.onrender.com
```

Expected: `✅ MCP server is working!`

---

## Free tier: sleep after 15 min

On the free plan, the service sleeps after ~15 minutes of no traffic. The first request after sleep can take 30–60 seconds.

**Keep it awake:** Use [UptimeRobot](https://uptimerobot.com) (free):
1. Create a monitor
2. URL: `https://YOUR-APP.onrender.com/`
3. Interval: 5 or 10 minutes

---

## Summary

| What | Value |
|------|-------|
| Build | `npm install` |
| Start | `node server-http.js` |
| Env vars | `GOOGLE_CREDENTIALS_JSON`, `GOOGLE_TOKEN_JSON` |
| Claude URL | `https://YOUR-APP.onrender.com/mcp` |
