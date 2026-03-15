const http = require("http");
const crypto = require("crypto");
const { execSync } = require("child_process");

const SECRET = process.env.WEBHOOK_SECRET || "iped-auto-deploy-2026";
const PORT = 9000;
const REPO_DIR = "/var/www/iped";

function verifySignature(payload, signature) {
  if (!signature) return false;
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  return `sha256=${sig}` === signature;
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/deploy") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const sig = req.headers["x-hub-signature-256"];
      if (!verifySignature(body, sig)) {
        res.writeHead(403);
        res.end("Forbidden");
        console.log("[DEPLOY] Invalid signature, rejected");
        return;
      }

      try {
        const payload = JSON.parse(body);
        const branch = payload.ref;
        if (branch !== "refs/heads/main") {
          res.writeHead(200);
          res.end("Skipped: not main branch");
          console.log(`[DEPLOY] Skipped: ${branch}`);
          return;
        }

        console.log(`[DEPLOY] Deploying from main...`);
        console.log(`[DEPLOY] Commit: ${payload.head_commit?.message || "unknown"}`);

        // Run deploy
        const output = execSync(
          `cd ${REPO_DIR} && git pull origin main && npm run build && pm2 restart iped`,
          { encoding: "utf8", timeout: 120000 }
        );
        console.log(`[DEPLOY] Success:\n${output}`);

        res.writeHead(200);
        res.end("Deploy successful");
      } catch (err) {
        console.error(`[DEPLOY] Error: ${err.message}`);
        res.writeHead(500);
        res.end(`Deploy failed: ${err.message}`);
      }
    });
  } else if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`[DEPLOY] Webhook server listening on port ${PORT}`);
  console.log(`[DEPLOY] Secret: ${SECRET.substring(0, 4)}...`);
});
