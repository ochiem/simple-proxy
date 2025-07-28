export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  const targetURL = decodeURIComponent(url);

  try {
    const headers = { ...req.headers };
    delete headers.host;

    const apiRes = await fetch(targetURL, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });

    // Salin header dari target API
    const contentType = apiRes.headers.get('content-type');
    const body = await apiRes.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (contentType) res.setHeader('Content-Type', contentType);

    res.status(apiRes.status).send(body);
  } catch (error) {
    res.status(500).json({ error: 'Proxy fetch failed', detail: error.message });
  }
}
