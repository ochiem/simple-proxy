export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "Invalid or missing ?url=https://target.com" });
  }

  // Tangani preflight OPTIONS
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.status(200).end();
    return;
  }

  try {
    // Siapkan headers
    const filteredHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lowerKey = key.toLowerCase();
      if (!["host", "x-vercel-proxy-signature", "content-length", "content-encoding"].includes(lowerKey)) {
        filteredHeaders[key] = value;
      }
    }

    // Paksa beberapa headers untuk keamanan dan bypass
    filteredHeaders["origin"] = "";
    filteredHeaders["referer"] = "";
    filteredHeaders["user-agent"] = "Mozilla/5.0 (CryptoProxyBot/1.0)";

    // Tangani body untuk POST / PUT / PATCH
    let body = undefined;
    if (!["GET", "HEAD"].includes(req.method)) {
      body = req.body;
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: filteredHeaders,
      body,
    });

    // Set ulang semua headers dari response target
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    // Tambahkan CORS header agar bisa dipanggil dari browser
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch from target URL",
      detail: err.message || err.toString(),
    });
  }
}
