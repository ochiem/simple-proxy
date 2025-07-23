export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Parameter "url" diperlukan' });
  }

  try {
    const fetchResponse = await fetch(url);
    const contentType = fetchResponse.headers.get("content-type");

    res.setHeader("Content-Type", contentType || "application/json");
    const body = await fetchResponse.text();
    res.status(200).send(body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
