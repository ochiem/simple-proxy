
export default async function handler(req, res) {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    // ✅ CORS HEADERS DIBUTUHKAN
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // ✅ Agar cache bagus (opsional)
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from target URL' });
  }
}
