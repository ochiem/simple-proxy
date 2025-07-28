// File: api/index.js
export default async function handler(req, res) {
  const target = req.query.url;
  if (!target) return res.status(400).json({ error: 'Missing url parameter' });

  // Set header CORS manual
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-MEXC-APIKEY,X-MBX-APIKEY');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const fetchRes = await fetch(target, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(target).host
      },
      body: ['POST','PUT','PATCH'].includes(req.method) ? req.body : undefined
    });

    const data = await fetchRes.arrayBuffer();
    res.setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/json');
    res.status(fetchRes.status).send(Buffer.from(data));
  } catch (e) {
    res.status(500).json({ error: 'Failed to proxy', message: e.message });
  }
}
