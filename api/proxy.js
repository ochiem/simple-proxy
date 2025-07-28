export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: 'Missing "url" query' });

  try {
    const targetRes = await fetch(decodeURIComponent(url), {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined,
        origin: undefined,
        referer: undefined,
        'content-length': undefined
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
    });

    const contentType = targetRes.headers.get('content-type');
    const buffer = await targetRes.arrayBuffer();

    // Inject CORS header yang penting
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*, Authorization, X-MEXC-APIKEY, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (contentType) res.setHeader('Content-Type', contentType);

    res.status(targetRes.status).send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: 'Proxy request failed', details: err.message });
  }
}
