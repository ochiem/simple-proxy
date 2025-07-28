export default async function handler(req, res) {
  // CORS agar bisa dipanggil dari browser
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  // Handle preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  // Ambil target URL
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "Missing ?url=" });
  }

  try {
    const parsedUrl = new URL(targetUrl);

    // ✅ KHUSUS untuk MEXC get balance
    if (
      parsedUrl.hostname === "api.mexc.com" &&
      parsedUrl.pathname === "/api/v3/account"
    ) {
      const { apiKey, secretKey } = req.body;
      if (!apiKey || !secretKey) {
        return res.status(400).json({ error: "Missing apiKey or secretKey" });
      }

      const recvWindow = 5000;
      const timestamp = Date.now();
      const queryString = `recvWindow=${recvWindow}&timestamp=${timestamp}`;

      const crypto = await import('crypto');
      const signature = crypto.createHmac('sha256', secretKey)
        .update(queryString)
        .digest('hex');

      const fullUrl = `${parsedUrl.origin}${parsedUrl.pathname}?${queryString}&signature=${signature}`;

      const mexcResponse = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "X-MEXC-APIKEY": apiKey,
          "Accept": "application/json"
        }
      });

      const json = await mexcResponse.json();
      return res.status(mexcResponse.status).json(json);
    }

    // 🌐 UNTUK SEMUA URL LAIN (default proxy)
    const forwardHeaders = {
      "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
      "Accept": "application/json",
    };

    const hasBody = !["GET", "HEAD"].includes(req.method);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: hasBody ? req.body : undefined,
    });

    const buffer = await response.arrayBuffer();
    res.status(response.status);
    response.headers.forEach((val, key) => {
      if (key.toLowerCase() !== "content-encoding") {
        res.setHeader(key, val);
      }
    });
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Proxy Error:", err);
    res.status(500).json({ error: "Proxy failed", detail: err.message });
  }
}
