// Vercel serverless port of the dev-only animeganStylize middleware.
// Calls the akhaliq/AnimeGANv2 HF Space (Gradio v4+ SSE flow).
//
//   GET  /api/animegan → { configured, styles, upstream, gradioVersion }
//   POST /api/animegan → image/* bytes (body: { image: dataUrl, style: 'ghibli'|'anime'|'sketch' })

const SPACE_URL = 'https://akhaliq-animeganv2.hf.space';
const SUPPORTED_STYLES = new Set(['ghibli', 'anime', 'sketch']);
const VERSION = 'Version 2';

async function readSSEEvent(reader, decoder, bufRef) {
  while (true) {
    const idx = bufRef.value.indexOf('\n\n');
    if (idx >= 0) {
      const block = bufRef.value.slice(0, idx);
      bufRef.value = bufRef.value.slice(idx + 2);
      let event = 'message';
      let data = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += (data ? '\n' : '') + line.slice(5).trim();
      }
      return { event, data };
    }
    const { value, done } = await reader.read();
    if (done) return null;
    bufRef.value += decoder.decode(value, { stream: true });
  }
}

async function runAnimeGAN(imageDataUrl) {
  const postRes = await fetch(`${SPACE_URL}/gradio_api/call/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        { url: imageDataUrl, meta: { _type: 'gradio.FileData' } },
        VERSION,
      ],
    }),
  });
  if (!postRes.ok) {
    const errText = await postRes.text().catch(() => '');
    throw new Error(`Gradio POST ${postRes.status}: ${errText.slice(0, 200) || '(empty body)'}`);
  }
  const { event_id } = await postRes.json();
  if (!event_id) throw new Error('Gradio POST returned no event_id.');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55_000);

  let sseRes;
  try {
    sseRes = await fetch(`${SPACE_URL}/gradio_api/call/generate/${event_id}`, {
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('HF Space timed out (likely cold-starting; try again).');
    }
    throw err;
  }

  if (!sseRes.ok || !sseRes.body) {
    clearTimeout(timer);
    throw new Error(`Gradio SSE returned ${sseRes.status}`);
  }

  const reader = sseRes.body.getReader();
  const decoder = new TextDecoder('utf-8');
  const bufRef = { value: '' };
  let result = null;
  let upstreamError = null;

  try {
    while (true) {
      const evt = await readSSEEvent(reader, decoder, bufRef);
      if (!evt) break;
      if (evt.event === 'complete' && evt.data) {
        try {
          result = JSON.parse(evt.data);
        } catch {
          throw new Error(`SSE data parse failed: ${evt.data.slice(0, 120)}`);
        }
        break;
      }
      if (evt.event === 'error') {
        upstreamError = evt.data || 'unspecified upstream error';
        break;
      }
    }
  } finally {
    clearTimeout(timer);
    reader.cancel().catch(() => {});
  }

  if (upstreamError) throw new Error(`Gradio reported: ${upstreamError}`);
  if (!result) throw new Error('SSE stream ended without a complete event.');

  const outFile = Array.isArray(result) ? result[0] : result;
  const outUrl =
    outFile?.url ||
    (outFile?.path ? `${SPACE_URL}/gradio_api/file=${outFile.path}` : null);
  if (!outUrl) {
    throw new Error(`Unexpected output shape: ${JSON.stringify(result).slice(0, 200)}`);
  }

  const imgRes = await fetch(outUrl);
  if (!imgRes.ok) throw new Error(`Output fetch returned ${imgRes.status}`);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  if (buffer.length < 1024) {
    throw new Error(`Suspicious tiny response: ${buffer.length} bytes.`);
  }
  return { buffer, contentType: imgRes.headers.get('content-type') || 'image/jpeg' };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    res.status(200).json({
      configured: true,
      styles: [...SUPPORTED_STYLES],
      upstream: SPACE_URL,
      gradioVersion: 'v4+ (/gradio_api/call streaming)',
    });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed');
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!body.image) throw new Error('Missing `image` (data URL).');
    if (!body.style) throw new Error('Missing `style`.');
    if (!SUPPORTED_STYLES.has(body.style)) {
      throw new Error(
        `AnimeGAN doesn't support "${body.style}". Supported: ${[...SUPPORTED_STYLES].join(', ')}.`
      );
    }
    if (!/^data:[^;]+;base64,/.test(body.image)) {
      throw new Error('`image` must be a base64 data URL.');
    }

    const { buffer, contentType } = await runAnimeGAN(body.image);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(buffer.length));
    res.status(200).send(buffer);
  } catch (err) {
    res.status(502).json({ error: err.message ?? 'Upstream error.' });
  }
}
