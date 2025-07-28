export default async function handler(req, res) {
  const { url } = req.query;
  const targetUrl = decodeURIComponent(url || "");

  if (!url || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "Missing or invalid ?url=" });
  }

  // 🛡️ Whitelist origin (tambahkan domain kamu jika ingin batasi)
  const allowedOrigins = [
    "http://localhost:3000",
    "https://yourdomain.vercel.app"
  ];

  const origin = req.headers.origin || "";
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Forbidden origin" });
  }

  // 🚫 Filter headers agar tidak mengganggu server target
  const forwardedHeaders = { ...req.headers };
  delete forwardedHeaders["host"];
  delete forwardedHeaders["referer"];
  delete forwardedHeaders["origin"];

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardedHeaders,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    });

    // Clone response
    const data = await response.arrayBuffer();

    // Copy headers dari response target
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    // ✅ Inject CORS headers ke response
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
