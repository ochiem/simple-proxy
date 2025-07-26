export default async function handler(req, res) {
  const targetUrl = req.query.url;

  // Validasi URL
  try {
    const parsedUrl = new URL(targetUrl);

    // Batasi hanya domain yang termasuk 'trusted CEX'
    const allowedHosts = [
      "api.binance.com",
      "api-gcp.binance.com",
      "api.mexc.com",
      "api.gateio.ws",
      "www.indodax.com",
    ];

    if (!allowedHosts.includes(parsedUrl.hostname)) {
      return res.status(403).json({ error: "Target host not allowed" });
    }
  } catch {
    return res.status(400).json({ error: "Invalid or missing ?url=https://..." });
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Siapkan headers custom dari frontend
    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (
        ![
          "host",
          "content-length",
          "x-vercel-proxy-signature",
          "connection",
          "accept-encoding"
        ].includes(lower)
      ) {
        forwardHeaders[key] = value;
      }
    }

    // Paksa header tertentu
    forwardHeaders["origin"] = "";
    forwardHeaders["referer"] = "";
    forwardHeaders["user-agent"] = "CryptoProxyBot/1.0";

    // Body untuk metode selain GET/HEAD
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: hasBody ? req.body : undefined,
    });

    // Teruskan semua response header
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === "content-encoding") continue; // hindari brotli/gzip
      res.setHeader(key, value);
    }

    // Kirim body response sebagai buffer
    const buffer = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(buffer));
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Proxy failed", detail: err.message });
  }
}
