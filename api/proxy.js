export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "Invalid or missing ?url=https://target.com" });
  }

  try {
    const forwardedHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lowerKey = key.toLowerCase();
      if (
        !["host", "x-vercel-proxy-signature", "content-length", "content-encoding"].includes(lowerKey)
      ) {
        forwardedHeaders[key] = value;
      }
    }

    // Ganti origin & referer supaya tidak diblok
    forwardedHeaders["origin"] = "";
    forwardedHeaders["referer"] = "";
    forwardedHeaders["user-agent"] = "Mozilla/5.0 (CryptoProxyBot/1.0)";

    // Tangani preflight OPTIONS
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.status(200).end();
      return;
    }

    // Baca body mentah (penting untuk signature)
    let body = undefined;
    if (!["GET", "HEAD"].includes(req.method)) {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardedHeaders,
      body,
    });

    // Salin semua header dari response target
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    // Tambah header CORS agar client bisa akses
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
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
