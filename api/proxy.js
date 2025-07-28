export const config = {
  api: {
    bodyParser: false, // biar bisa handle semua tipe request
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
        host: undefined, // penting: hapus header `host`
      },
      body: ['POST', 'PUT', 'PATCH'].includes(method) ? req : undefined,
    };

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    // Forward response status, headers, and body
    res.status(response.status);
    res.setHeader('Content-Type', contentType);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: 'Proxy failed', detail: err.message });
  }
}
