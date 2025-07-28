// File: api/index.js

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query parameter" });
  }

  if (req.method === 'OPTIONS') {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.status(200).end();
    return;
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: { ...req.headers },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    };

    // Hapus host agar tidak bentrok dengan target
    delete fetchOptions.headers.host;

    const response = await fetch(url, fetchOptions);

    const contentType = response.headers.get('content-type') || 'application/json';
    const buffer = await response.arrayBuffer();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", contentType);

    res.status(response.status).send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}
