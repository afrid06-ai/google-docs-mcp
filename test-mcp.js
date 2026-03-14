#!/usr/bin/env node
/**
 * Test script for Google Docs MCP (HTTP transport).
 * Usage: node test-mcp.js [baseUrl]
 * Default: http://localhost:3000
 * Example: node test-mcp.js https://prechemical-achromatic-ngoc.ngrok-free.dev
 */
const baseUrl = process.argv[2] || "http://localhost:3000";
const mcpUrl = `${baseUrl}/mcp`;

async function sendRpc(method, params = {}, isNotification = false) {
  const body = {
    jsonrpc: "2.0",
    method,
    params: params || {},
  };
  if (!isNotification) body.id = `test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const res = await fetch(mcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const contentType = res.headers.get("content-type") || "";
  let data;

  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    const lines = text.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith("data: ")) {
        try {
          data = JSON.parse(lines[i].slice(6));
          break;
        } catch (_) {}
      }
    }
    if (!data) throw new Error("No JSON in SSE response");
  } else {
    data = await res.json();
  }

  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  return data;
}

async function sendNotification(method, params) {
  const res = await fetch(mcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params: params || {},
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

async function main() {
  console.log(`\n🧪 Testing Google Docs MCP at ${mcpUrl}\n`);

  try {
    // 1. Initialize
    console.log("1. Sending initialize...");
    const initRes = await sendRpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    });
    console.log("   ✅ Server:", initRes.result?.serverInfo?.name || "ok");

    // 2. Initialized (notification - no response expected)
    console.log("2. Sending initialized...");
    await sendNotification("initialized", {});
    console.log("   ✅");

    // 3. Call ping
    console.log("3. Calling ping...");
    const pingRes = await sendRpc("tools/call", {
      name: "ping",
      arguments: {},
    });
    const text = pingRes.result?.content?.[0]?.text ?? JSON.stringify(pingRes.result);
    if (text.includes("pong")) {
      console.log("   ✅ ping → pong");
    } else {
      console.log("   ⚠️ Response:", text);
    }

    // 4. List tools
    console.log("4. Listing tools...");
    const listRes = await sendRpc("tools/list", {});
    const tools = listRes.result?.tools || [];
    console.log("   ✅ Tools:", tools.map((t) => t.name).join(", ") || "(none)");

    console.log("\n✅ MCP server is working!\n");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  }
}

main();
