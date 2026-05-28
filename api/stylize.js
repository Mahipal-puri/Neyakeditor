// Vercel serverless port of the dev-only replicateStylize middleware.
//
//   GET  /api/stylize → { configured, perStyle, fallbackModel, perStyleModels }
//   POST /api/stylize → image/* bytes of the styled output
//
// Body: { image: dataUrl, prompt: string, style?: string }

const TOKEN = process.env.REPLICATE_API_TOKEN || '';
const FALLBACK_MODEL = process.env.REPLICATE_STYLE_MODEL || '';
const PER_STYLE = {
  ghibli: process.env.REPLICATE_GHIBLI_MODEL || '',
  anime: process.env.REPLICATE_ANIME_MODEL || '',
  cartoon: process.env.REPLICATE_CARTOON_MODEL || '',
  sketch: process.env.REPLICATE_SKETCH_MODEL || '',
  watercolor: process.env.REPLICATE_WATERCOLOR_MODEL || '',
  oilpaint: process.env.REPLICATE_OILPAINT_MODEL || '',
  popart: process.env.REPLICATE_POPART_MODEL || '',
  pixelart: process.env.REPLICATE_PIXELART_MODEL || '',
};
const resolveModel = (style) => (style && PER_STYLE[style]) || FALLBACK_MODEL;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const perStyleConfigured = Object.fromEntries(
      Object.keys(PER_STYLE).map((k) => [k, Boolean(TOKEN && resolveModel(k))])
    );
    res.status(200).json({
      configured: Boolean(TOKEN && FALLBACK_MODEL),
      fallbackModel: FALLBACK_MODEL,
      perStyle: perStyleConfigured,
      perStyleModels: PER_STYLE,
    });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed');
    return;
  }
  if (!TOKEN) {
    res.status(503).json({ error: 'REPLICATE_API_TOKEN is not set.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!body.image) throw new Error('Request body must include `image` (data URL).');
    if (!body.prompt) throw new Error('Request body must include `prompt`.');

    const model = resolveModel(body.style);
    if (!model) {
      res.status(503).json({
        error: body.style
          ? `No model configured for style "${body.style}". Set REPLICATE_${body.style.toUpperCase()}_MODEL or REPLICATE_STYLE_MODEL.`
          : 'REPLICATE_STYLE_MODEL is not set.',
      });
      return;
    }

    const r = await fetch(
      `https://api.replicate.com/v1/models/${model}/predictions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${TOKEN}`,
          'Content-Type': 'application/json',
          Prefer: 'wait=55',
        },
        body: JSON.stringify({
          input: { image: body.image, prompt: body.prompt },
        }),
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
