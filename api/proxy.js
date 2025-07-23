export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "Invalid or missing ?url=https://target.com" });
  }

  try {
    // Siapkan headers yang aman untuk diteruskan
    const forwardedHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lowerKey = key.toLowerCase();
      if (
        !["host", "x-vercel-proxy-signature", "content-length", "content-encoding"].includes(lowerKey)
      ) {
        forwardedHeaders[key] = value;
      }
    }

    // Force some browser-friendly headers
    forwardedHeaders["origin"] = "";
    forwardedHeaders["referer"] = "";
    forwardedHeaders["user-agent"] = "Mozilla/5.0 (compatible; CryptoProxyBot/1.0)";

    // Tangani preflight (OPTIONS)
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.status(200).end();
      return;
    }

    // Ambil body (support text, JSON, buffer)
    let body = undefined;
    if (!["GET", "HEAD"].includes(req.method)) {
      const contentType = req.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        body = JSON.stringify(req.body);
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        body = new URLSearchParams(req.body).toString();
      } else {
        body = req.body;
      }
    }

    const fetchResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardedHeaders,
      body,
    });

    // Set headers dari response target
    for (const [key, value] of fetchResponse.headers.entries()) {
      res.setHeader(key, value);
    }

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "*");

    const buffer = await fetchResponse.arrayBuffer();
    res.status(fetchResponse.status).send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch from target URL",
      detail: err.message || err.toString(),
    });
  }
}
