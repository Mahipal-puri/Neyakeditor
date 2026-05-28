// Vercel serverless port of the dev-only replicateProxy middleware
// from client/vite.config.js.
//
//   GET  /api/remove-bg → { configured, model }
//   POST /api/remove-bg → image/* bytes of the cut-out
//
// REPLICATE_API_TOKEN must be set in Vercel project env vars.

const MODEL = process.env.REPLICATE_BG_MODEL || '851-labs/background-remover';
const TOKEN = process.env.REPLICATE_API_TOKEN || '';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    res.status(200).json({ configured: Boolean(TOKEN), model: MODEL });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed');
    return;
  }
  if (!TOKEN) {
    res.status(503).json({
      error: 'REPLICATE_API_TOKEN is not set in Vercel project env vars.',
    });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!body.image) throw new Error('Request body must include `image` (data URL).');

    const r = await fetch(
      `https://api.replicate.com/v1/models/${MODEL}/predictions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${TOKEN}`,
          'Content-Type': 'application/json',
          Prefer: 'wait=55',
        },
        body: JSON.stringify({ input: { image: body.image } }),
      }
    );

    if (!r.ok) {
      const errText = await r.text();
      res.status(r.status).json({ error: `Replicate API ${r.status}: ${errText}` });
      return;
    }

    const prediction = await r.json();
    if (prediction.status !== 'succeeded') {
      res.status(202).json({
        error: prediction.error || `Prediction still ${prediction.status}.`,
        status: prediction.status,
        id: prediction.id,
      });
      return;
    }

    const outputUrl = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;
    if (!outputUrl) throw new Error('Replicate returned an empty output.');

    const imgRes = await fetch(outputUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch output image: ${imgRes.status}`);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const ct = imgRes.headers.get('content-type') || 'image/png';

    res.setHeader('Content-Type', ct);
    res.setHeader('Content-Length', String(buffer.length));
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message ?? 'Unknown server error.' });
  }
}
