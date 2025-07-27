export default async function handler(req, res) {
  const targetUrl = req.query.url;

  // Validasi URL
  let parsedUrl;
  try {
    if (!targetUrl) throw new Error("Missing URL");
    parsedUrl = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch (err) {
    return res.status(400).json({ error: "Invalid or missing ?url=https://..." });
  }

  // CORS headers agar bisa diakses dari browser
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Header forward: bawa semua kecuali yang bahaya
    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (!["host", "content-length", "connection", "accept-encoding"].includes(lower)) {
        forwardHeaders[key] = value;
      }
    }

    // Tambahan header untuk menyamarkan asal
    forwardHeaders["origin"] = "";
    forwardHeaders["referer"] = "";
    forwardHeaders["user-agent"] = "CryptoProxyBot/1.0";

    const hasBody = !["GET", "HEAD"].includes(req.method);

    // Fetch ke target
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: hasBody ? req.body : undefined,
    });

    // Teruskan headers dari target (kecuali encoding)
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() !== "content-encoding") {
        res.setHeader(key, value);
      }
    }

    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (err) {
    console.error("Proxy Error:", err);
    res.status(500).json({ error: "Proxy failed", detail: err.message });
  }
}
