export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "Missing 'url' query parameter." });
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers, // forward semua headers dari client
        host: null,     // hapus host agar tidak konflik
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });

    const contentType = response.headers.get('content-type');
    const body = await response.text();

    res.setHeader('Content-Type', contentType || 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS allow
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.status(response.status).send(body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
