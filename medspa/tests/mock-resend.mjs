// Stand-in for the Resend API during tests: records every email it receives.
import http from "node:http";
const emails = [];
http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/emails") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const json = JSON.parse(body || "{}");
      if (req.headers.authorization !== "Bearer test-key") { res.writeHead(401); return res.end("{}"); }
      emails.push(json);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id: `mock_${emails.length}` }));
    });
    return;
  }
  if (req.method === "GET" && req.url === "/emails") { res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(emails)); }
  if (req.method === "DELETE" && req.url === "/emails") { emails.length = 0; res.writeHead(200); return res.end("{}"); }
  res.writeHead(404); res.end();
}).listen(Number(process.env.MOCK_PORT || 4010), "127.0.0.1");
