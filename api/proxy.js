export default async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).send('Missing "url" query parameter.');

  const headers = { ...req.headers };

  // Jangan kirim headers yang bisa diblok server target
  delete headers['host'];
  delete headers['referer'];
  delete headers['origin'];

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });

    const data = await response.arrayBuffer();

    res.status(response.status);

    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    // Inject CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');

    res.send(Buffer.from(data));
  } catch (e) {
    res.status(500).send(e.toString());
  }
};
