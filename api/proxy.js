export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  const method = req.method;
  const headers = { ...req.headers };

  // Jangan forward headers internal Vercel
  delete headers['host'];
  delete headers['x-vercel-proxy-signature'];
  delete headers['x-vercel-id'];
  delete headers['x-forwarded-for'];

  try {
    const fetchResponse = await fetch(targetUrl, {
      method,
      headers,
      body: ['GET', 'HEAD'].includes(method) ? undefined : req.body,
    });

    const contentType = fetchResponse.headers.get('content-type');
    const body = await fetchResponse.text();

    res.setHeader('Content-Type', contentType || 'text/plain');

    // ✅ Tambahkan header CORS agar bisa diakses dari browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', '*');

    if (method === 'OPTIONS') {
      return res.status(200).end();
    }

    res.status(fetchResponse.status).send(body);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}
