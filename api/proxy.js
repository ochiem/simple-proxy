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
    // Forward headers seperti browser
    const forwardHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif," +
        "image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": parsedUrl.origin,
      "Origin": parsedUrl.origin,
    };

    // Copy headers dari original request kecuali yang bahaya
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (!["host", "content-length", "connection", "accept-encoding"].includes(lower)) {
        forwardHeaders[key] = value;
      }
    }

    const hasBody = !["GET", "HEAD"].includes(req.method);

    // Lakukan fetch ke target
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
