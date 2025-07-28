export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: 'Missing url query' });

  const targetUrl = decodeURIComponent(url);
  const origin = req.headers.origin || '*'; // sementara '*'

  // Handle Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*, X-MEXC-APIKEY, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }

  // Filter header penting
  const filteredHeaders = {};
  for (const key in req.headers) {
    if (['x-mexc-apikey', 'content-type', 'accept'].includes(key.toLowerCase())) {
      filteredHeaders[key] = req.headers[key];
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: filteredHeaders,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });

    const data = await response.arrayBuffer();

    // Salin semua response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Inject CORS header agar bisa diakses frontend
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*, X-MEXC-APIKEY, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
