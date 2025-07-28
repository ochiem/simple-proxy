export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  const { method, headers } = req;
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  try {
    const fetchOptions = {
      method,
      headers: {
        ...headers,
        host: undefined, // hilangkan host agar tidak bentrok
      },
      body: ['POST', 'PUT', 'PATCH'].includes(method) ? req : undefined,
    };

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || 'application/json';

    // Tambahkan header CORS agar bisa diakses dari frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-MEXC-APIKEY');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    res.status(response.status);
    res.setHeader('Content-Type', contentType);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: 'Proxy failed', detail: err.message });
  }
}
