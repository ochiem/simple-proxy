export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: 'Missing url query' });

  const targetUrl = decodeURIComponent(url);

  // ✅ Filter agar hanya domain tertentu yang boleh (opsional)
  const allowedOrigins = ['https://yourfrontend.com']; // tambahkan domainmu

  const origin = req.headers.origin || '';
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  // 🔧 Atur header manual
  const filteredHeaders = { ...req.headers };
  delete filteredHeaders['host'];
  delete filteredHeaders['referer'];
  delete filteredHeaders['origin'];

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: filteredHeaders,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });

    const data = await response.arrayBuffer();

    // Copy headers dari response target
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Inject CORS Header agar frontend bisa menerima
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*, X-MEXC-APIKEY, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
