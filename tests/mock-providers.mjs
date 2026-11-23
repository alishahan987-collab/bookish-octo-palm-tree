// Stand-in for the Resend and WhatsApp Cloud APIs during automated tests.
// Records every request so tests can assert exactly what would have been sent.
import http from "node:http";

const port = Number(process.env.MOCK_PORT ?? 4010);
const requests = [];

http
  .createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.url === "/__requests") {
        if (req.method === "DELETE") requests.length = 0;
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(requests));
      }
      const json = body ? JSON.parse(body) : null;
      requests.push({ method: req.method, url: req.url, auth: req.headers.authorization ?? null, body: json });
      res.writeHead(200, { "Content-Type": "application/json" });
      if (req.url?.startsWith("/wa/")) return res.end(JSON.stringify({ messages: [{ id: `wamid.${requests.length}` }] }));
      res.end(JSON.stringify({ id: `email_${requests.length}` }));
    });
  })
  .listen(port, () => console.log(`mock providers on :${port}`));
