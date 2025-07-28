import getRawBody from 'raw-body';

export const config = {
  api: {
    bodyParser: false, // penting agar bisa meneruskan raw body (misalnya POST json)
  },
};

export default async function handler(req, res) {
  const targetUrl = req.headers['x-target-url']; // URL tujuan wajib dikirim di header
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing x-target-url header' });
  }

  try {
    const method = req.method;
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['x-target-url']; // jangan teruskan header internal ini ke target

    const body =
      method === 'GET' || method === 'HEAD'
        ? undefined
        : await getRawBody(req); // biarkan dalam bentuk Buffer

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType || 'application/json');
    res.status(response.status);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: 'Proxy Error', detail: error.message });
  }
}
