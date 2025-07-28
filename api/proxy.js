// api/index.js

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  // Buat request ke URL target
  try {
    const targetRes = await fetch(url, {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined,             // Hapus header yang bermasalah
        'content-length': undefined,
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method)
        ? req.body
        : undefined,
    });

    const data = await targetRes.arrayBuffer(); // agar bisa mengirim selain JSON juga (binary, blob, dll)

    // Copy semua header dari targetRes ke response
    targetRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Tambahkan header CORS agar bisa dipakai dari browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    res.status(targetRes.status).send(Buffer.from(data));
  } catch (err) {
    console.error('[Proxy Error]', err);
    res.status(500).json({ error: 'Proxy request failed', details: err.message });
  }
}
