export default async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('Missing "url" query parameter.');
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: { ...req.headers, host: new URL(url).host },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });

    const data = await response.arrayBuffer();
    const headers = Object.fromEntries(response.headers.entries());

    res.status(response.status);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Inject CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');

    res.send(Buffer.from(data));
  } catch (err) {
    res.status(500).send(err.toString());
  }
};
