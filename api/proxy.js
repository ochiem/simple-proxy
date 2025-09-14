import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

export default async function handler(req, res) {
  try {
    const url = req.query.url;
    if (!url) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(400).json({
        title: 'CORS Proxy Error - Required parameter is missing',
        detail: 'The parameter: url was not provided',
      });
    }

    const r = await fetch(url, {
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'] || undefined,
      },
      body:
        req.method !== 'GET' && req.method !== 'HEAD'
          ? JSON.stringify(req.body || {})
          : undefined,
    });

    const buf = await r.arrayBuffer();

    res.status(r.status);
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (r.headers.get('content-type'))
      res.setHeader('Content-Type', r.headers.get('content-type'));
    if (r.headers.get('content-encoding'))
      res.setHeader('Content-Encoding', r.headers.get('content-encoding'));

    return res.send(Buffer.from(buf));
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ title: 'Proxy Error', detail: String(e) });
  }
}
