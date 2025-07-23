export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid or missing ?url=https://target.com' });
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: { ...req.headers },
    };

    // Jika bukan GET/HEAD, sertakan body
    if (!['GET', 'HEAD'].includes(req.method)) {
      fetchOptions.body = req.body;
    }

    // Hapus beberapa header yang mengganggu
    delete fetchOptions.headers['host'];
    delete fetchOptions.headers['x-vercel-proxy-signature'];
    delete fetchOptions.headers['content-length'];

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    // Salin headers dari response
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from target URL', detail: err.message });
  }
}
