// Browser-side image stylization — classical computer-vision techniques only.
// Each baker returns Promise<Blob> of a PNG sized w × h. Heavy: a 2000×2000
// image takes ~1–4 s on a typical laptop depending on which baker.
//
// Not a generative model — these passes can't redraw the subject as an anime
// character. They produce a stylized rendering of the original pixels. For
// real character regeneration, configure REPLICATE_<STYLE>_MODEL in .env.
//
// All bakers accept an `intensity` argument in [0..1] (default 1). The
// strength of each effect scales with intensity — kernel sizes, posterize
// levels, edge thresholds, etc.

// ---------- shared helpers ----------

function captureImageData(srcImage, w, h, filter = '') {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  if (filter) ctx.filter = filter;
  ctx.drawImage(srcImage, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function imageDataToBlob(imgData, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.putImageData(imgData, 0, 0);
  return canvasToBlob(c);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))),
      'image/png',
      0.95
    )
  );
}

// Quantize each RGB channel to `levels` discrete steps, in-place.
function posterize(imgData, levels) {
  const lv = Math.max(2, Math.round(levels));
  const step = 255 / (lv - 1);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.round(d[i] / step) * step;
    d[i + 1] = Math.round(d[i + 1] / step) * step;
    d[i + 2] = Math.round(d[i + 2] / step) * step;
  }
}

// 3×3 median filter — edge-preserving smoothing that's cheaper than a real
// bilateral filter. Each output pixel = median of its 3×3 RGB neighborhood.
// O(9·N) — about 0.3 s on 1Mpx in modern Chrome.
function medianFilter3(imgData, w, h) {
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;
  const buf = new Uint8Array(9);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const base = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        let i = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            buf[i++] = src[((y + dy) * w + (x + dx)) * 4 + c];
          }
        }
        // Insertion sort over 9 values — small N, no allocs.
        for (let k = 1; k < 9; k++) {
          const v = buf[k];
          let j = k - 1;
          while (j >= 0 && buf[j] > v) {
            buf[j + 1] = buf[j];
            j--;
          }
          buf[j + 1] = v;
        }
        dst[base + c] = buf[4];
      }
    }
  }
}

// Sobel edge magnitude on grayscale conversion of imgData.
function sobelEdges(imgData, w, h) {
  const d = imgData.data;
  const n = w * h;
  const gray = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    gray[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
  }
  const out = new Uint8Array(n);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const tl = gray[i - w - 1];
      const t = gray[i - w];
      const tr = gray[i - w + 1];
      const l = gray[i - 1];
      const r = gray[i + 1];
      const bl = gray[i + w - 1];
      const b = gray[i + w];
      const br = gray[i + w + 1];
      const gx = -tl - 2 * l - bl + tr + 2 * r + br;
      const gy = -tl - 2 * t - tr + bl + 2 * b + br;
      const mag = Math.sqrt(gx * gx + gy * gy);
      out[i] = mag > 255 ? 255 : mag;
    }
  }
  return out;
}

// Lerp helper for intensity scaling.
const mix = (lo, hi, t) => lo + (hi - lo) * Math.max(0, Math.min(1, t));

// Real 5×5 bilateral filter — edge-preserving smoother than the 3×3 median.
// For each pixel, neighbors are weighted by both spatial distance (Gaussian)
// and color similarity, so smooth regions get aggressively flattened while
// edges stay crisp. Produces noticeably more "painted" / cel-shaded output
// than median for cartoon/anime/ghibli styles.
//
// O(25 · 3 · N) — about 1–3 s on a 1 Mpx image. Worth it.
function bilateralFilter5(imgData, w, h, sigmaColor = 28) {
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;
  // Precomputed 5×5 Gaussian spatial weights (sigma ≈ 1.5).
  const spatial = [
    0.012, 0.025, 0.031, 0.025, 0.012,
    0.025, 0.057, 0.075, 0.057, 0.025,
    0.031, 0.075, 0.094, 0.075, 0.031,
    0.025, 0.057, 0.075, 0.057, 0.025,
    0.012, 0.025, 0.031, 0.025, 0.012,
  ];
  // Precompute a small color-distance LUT for the exponential — diff² in [0..65025]
  // is bucketed to 256 entries.
  const colDenom = 2 * sigmaColor * sigmaColor;
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.exp((-(i * i) * 3) / colDenom);
  }
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const cp = (y * w + x) * 4;
      const cr = src[cp];
      const cg = src[cp + 1];
      const cb = src[cp + 2];
      let sR = 0;
      let sG = 0;
      let sB = 0;
      let sW = 0;
      let ki = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const np = ((y + dy) * w + (x + dx)) * 4;
          const nr = src[np];
          const ng = src[np + 1];
          const nb = src[np + 2];
          // Average channel distance — cheap proxy for true RGB Euclidean.
          const d =
            (Math.abs(nr - cr) + Math.abs(ng - cg) + Math.abs(nb - cb)) / 3;
          const wt = spatial[ki++] * lut[d | 0];
          sR += nr * wt;
          sG += ng * wt;
          sB += nb * wt;
          sW += wt;
        }
      }
      const inv = 1 / sW;
      dst[cp] = sR * inv;
      dst[cp + 1] = sG * inv;
      dst[cp + 2] = sB * inv;
    }
  }
}

// 3×3 max filter on a uint8 buffer (Sobel edges). Each output pixel is the
// max of its 3×3 neighborhood — turns single-pixel edges into 2–3 px strokes
// so Cartoon / Pop-art outlines read as bold ink, not hairlines.
function dilateEdges(edges, w, h, radius = 1) {
  const out = new Uint8Array(w * h);
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      let m = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const v = edges[(y + dy) * w + (x + dx)];
          if (v > m) m = v;
        }
      }
      out[y * w + x] = m;
    }
  }
  return out;
}

// K-means color quantization — extract an adaptive palette of `k` colors
// from the image itself. Way better than a hardcoded LUT because each
// preset gets colors that actually match the photo (skin tones from skin
// pixels, sky tones from sky pixels, etc.) — making the painted result
// recognizable instead of mismatched.
//
// For speed, we subsample ~10k pixels uniformly at random for the
// clustering loop, then snap all pixels to the resulting centroids.
// Cost: ~10k samples × k centroids × 12 iters + 1 final pass over all
// pixels. About 60–120 ms on 1 Mpx.
function kmeansPalette(imgData, k = 8, maxIter = 12) {
  const d = imgData.data;
  const n = d.length / 4;
  const sampleN = Math.min(n, 10000);

  // Sample uniformly with a deterministic stride so results are stable
  // across re-runs on the same image.
  const stride = Math.max(1, Math.floor(n / sampleN));
  const samples = new Uint8ClampedArray(sampleN * 3);
  for (let i = 0, s = 0; i < sampleN && s < n; i++, s += stride) {
    const p = s * 4;
    samples[i * 3] = d[p];
    samples[i * 3 + 1] = d[p + 1];
    samples[i * 3 + 2] = d[p + 2];
  }

  // Init centroids by even-spaced picks from the sorted-by-luminance samples,
  // so we always cover the dynamic range instead of clustering near random
  // similar colors.
  const lumIndex = new Uint16Array(sampleN);
  for (let i = 0; i < sampleN; i++) lumIndex[i] = i;
  lumIndex.sort((a, b) => {
    const la =
      0.299 * samples[a * 3] +
      0.587 * samples[a * 3 + 1] +
      0.114 * samples[a * 3 + 2];
    const lb =
      0.299 * samples[b * 3] +
      0.587 * samples[b * 3 + 1] +
      0.114 * samples[b * 3 + 2];
    return la - lb;
  });
  const centroids = new Float32Array(k * 3);
  for (let c = 0; c < k; c++) {
    const idx = lumIndex[Math.floor(((c + 0.5) / k) * sampleN)];
    centroids[c * 3] = samples[idx * 3];
    centroids[c * 3 + 1] = samples[idx * 3 + 1];
    centroids[c * 3 + 2] = samples[idx * 3 + 2];
  }

  const labels = new Uint8Array(sampleN);
  const sums = new Float64Array(k * 3);
  const counts = new Uint32Array(k);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assignment step.
    for (let i = 0; i < sampleN; i++) {
      const r = samples[i * 3];
      const g = samples[i * 3 + 1];
      const b = samples[i * 3 + 2];
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const dr = r - centroids[c * 3];
        const dg = g - centroids[c * 3 + 1];
        const db = b - centroids[c * 3 + 2];
        const dist = dr * dr + dg * dg + db * db;
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      labels[i] = best;
    }
    // Update step.
    sums.fill(0);
    counts.fill(0);
    for (let i = 0; i < sampleN; i++) {
      const lbl = labels[i];
      sums[lbl * 3] += samples[i * 3];
      sums[lbl * 3 + 1] += samples[i * 3 + 1];
      sums[lbl * 3 + 2] += samples[i * 3 + 2];
      counts[lbl]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c * 3] = sums[c * 3] / counts[c];
        centroids[c * 3 + 1] = sums[c * 3 + 1] / counts[c];
        centroids[c * 3 + 2] = sums[c * 3 + 2] / counts[c];
      }
    }
  }

  const palette = new Uint8Array(k * 3);
  for (let c = 0; c < k * 3; c++) palette[c] = Math.round(centroids[c]);
  return palette;
}

// Shift a palette's hue toward a target (degrees) and scale saturation, in
// HSL space. Lets us run k-means for image-faithful colors then nudge the
// whole palette toward a style-specific feel (warm pastels for Ghibli,
// vivid for Anime).
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const dc = max - min;
    s = l > 0.5 ? dc / (2 - max - min) : dc / (max + min);
    switch (max) {
      case r: h = ((g - b) / dc + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / dc + 2); break;
      default: h = ((r - g) / dc + 4);
    }
    h *= 60;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  const toRgb = (t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [
    Math.round(toRgb(hk + 1 / 3) * 255),
    Math.round(toRgb(hk) * 255),
    Math.round(toRgb(hk - 1 / 3) * 255),
  ];
}
function shiftPalette(palette, opts = {}) {
  const { hueShift = 0, satMul = 1, lightMul = 1 } = opts;
  for (let i = 0; i < palette.length; i += 3) {
    let [h, s, l] = rgbToHsl(palette[i], palette[i + 1], palette[i + 2]);
    h = (h + hueShift) % 360;
    if (h < 0) h += 360;
    s = Math.max(0, Math.min(1, s * satMul));
    l = Math.max(0, Math.min(1, l * lightMul));
    const [r, g, b] = hslToRgb(h, s, l);
    palette[i] = r;
    palette[i + 1] = g;
    palette[i + 2] = b;
  }
}

// Snap each pixel's color to the nearest entry in a fixed RGB palette. The
// palette should be a flat Uint8 array [r0,g0,b0, r1,g1,b1, …]. Produces a
// visibly "painted" surface — like screen-printing on a limited ink set —
// instead of the slightly muddy result of uniform posterization.
function snapToPalette(imgData, palette) {
  const d = imgData.data;
  const k = palette.length / 3;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    let best = 0;
    let bestDist = Infinity;
    for (let p = 0; p < k; p++) {
      const pr = palette[p * 3];
      const pg = palette[p * 3 + 1];
      const pb = palette[p * 3 + 2];
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = p;
      }
    }
    d[i] = palette[best * 3];
    d[i + 1] = palette[best * 3 + 1];
    d[i + 2] = palette[best * 3 + 2];
  }
}

// Curated per-style palettes. Each is a flat Uint8Array of RGB triples,
// chosen by hand to evoke each style's signature palette.
const PALETTES = {
  // Warm pastels — sky blues, soft greens, warm skin tones, cream, brown.
  ghibli: new Uint8Array([
    240, 235, 215,   // cream highlight
    222, 199, 161,   // sand
    194, 158, 121,   // warm skin
    155, 120,  85,   // pale brown
    105,  70,  45,   // dark wood
     56,  40,  30,   // shadow
    180, 215, 220,   // sky pastel
    130, 180, 195,   // teal blue
     92, 130, 100,   // moss green
    175, 200, 145,   // grass
    230, 175, 145,   // peach
    205, 110,  95,   // warm red
  ]),
  // Vivid cel-shade palette — pure saturated colors with a few shadow tones.
  anime: new Uint8Array([
    255, 248, 240,   // highlight
    230, 195, 175,   // skin midtone
    188, 138, 110,   // skin shadow
     90,  60,  50,   // hair shadow
     35,  30,  35,   // outline-ish dark
    255, 230,  90,   // bright yellow
    245, 130, 130,   // pink
    220,  60,  75,   // red
    100, 180, 230,   // sky
     50, 105, 180,   // deep blue
     90, 195, 130,   // green
    175, 130, 220,   // violet
    255, 175,  80,   // orange
    245, 245, 245,   // white
    115, 115, 115,   // grey
      0,   0,   0,   // pure black (for cel shadow seams)
  ]),
  // Cartoon flat palette — fewer entries, comic-book primaries.
  cartoon: new Uint8Array([
    250, 240, 225,   // paper white
    245, 200, 110,   // skin
    180, 100,  60,   // skin shadow
     50,  35,  30,   // dark hair / outline
    230,  70,  60,   // red
     60, 150, 220,   // blue
    230, 200,  70,   // yellow
     80, 175,  90,   // green
  ]),
};

// Auto-levels: percentile-based contrast stretch. Stretches whatever range
// [lowP..highP] of luminance the image actually uses to [0..255], so a
// low-contrast / hazy input gets normalized before stylization. Mutates in
// place. Defaults clip 2% on each end — robust to specular highlights and
// shadow clipping without becoming aggressive on already-balanced photos.
export function autoLevels(imgData, lowP = 0.02, highP = 0.98) {
  const d = imgData.data;
  const n = d.length / 4;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
    hist[lum]++;
  }
  const lowTarget = n * lowP;
  const highTarget = n * highP;
  let cum = 0;
  let lo = 0;
  let hi = 255;
  for (let i = 0; i < 256; i++) {
    cum += hist[i];
    if (cum >= lowTarget) {
      lo = i;
      break;
    }
  }
  cum = 0;
  for (let i = 0; i < 256; i++) {
    cum += hist[i];
    if (cum >= highTarget) {
      hi = i;
      break;
    }
  }
  if (hi - lo < 10) return; // already saturated / unusable range
  const scale = 255 / (hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.max(0, Math.min(255, (d[i] - lo) * scale));
    d[i + 1] = Math.max(0, Math.min(255, (d[i + 1] - lo) * scale));
    d[i + 2] = Math.max(0, Math.min(255, (d[i + 2] - lo) * scale));
  }
}

// Final S-curve contrast boost — applied after stylization so the result reads
// punchier on screen. Amount in [0..1]: 0 = no-op, 1 = strong S-curve.
export function boostContrast(imgData, amount = 0.3) {
  if (amount <= 0) return;
  const d = imgData.data;
  // Sigmoid-ish curve centered at 128. Higher `amount` → steeper midtone.
  const a = 1 + amount * 1.5;
  const b = 128 * (1 - a);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.max(0, Math.min(255, d[i] * a + b));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] * a + b));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] * a + b));
  }
}

// ---------- existing styles (now with median pre-smoothing + intensity) ----------

/**
 * Cartoon: auto-levels → bilateral filter → snap to cartoon palette →
 * dilated Sobel outlines drawn as thick black strokes. Reads as a real
 * cel-shaded panel — flat ink colors, thick outlines, no photographic
 * mid-tones.
 */
export async function bakeCartoon(srcImage, w, h, intensity = 1) {
  const blurPx = mix(0.5, 2, intensity);
  const sat = mix(140, 200, intensity);
  const data = captureImageData(
    srcImage,
    w,
    h,
    `blur(${blurPx}px) saturate(${sat}%)`
  );
  autoLevels(data);
  // Real bilateral smoothing — flattens regions, keeps edges crisp.
  bilateralFilter5(data, w, h, mix(35, 22, intensity));
  // Compute outlines *before* palette snap so they trace photographic edges.
  const edges = sobelEdges(data, w, h);
  // Adaptive palette from the actual image colors, then boost saturation a
  // bit for the comic-book feel. K-means picks 6 colors that match the
  // image's actual subject + background, so the result is recognizable.
  const palette = kmeansPalette(data, mix(8, 5, intensity), 12);
  shiftPalette(palette, { satMul: mix(1.15, 1.45, intensity) });
  snapToPalette(data, palette);
  // Dilate the edge buffer by 1–2 px so outlines are bold strokes, not hairs.
  const dilatedEdges = dilateEdges(edges, w, h, intensity > 0.5 ? 2 : 1);
  const edgeThresh = mix(65, 28, intensity);
  const d = data.data;
  for (let i = 0; i < w * h; i++) {
    if (dilatedEdges[i] > edgeThresh) {
      const p = i * 4;
      d[p] = 10;
      d[p + 1] = 8;
      d[p + 2] = 8;
    }
  }
  boostContrast(data, mix(0.1, 0.2, intensity));
  return imageDataToBlob(data, w, h);
}

/**
 * Anime: auto-levels → median → smooth → posterize → saturate. No outlines —
 * the distinct difference from Cartoon. Reads as smooth cel-shading with
 * vibrant flat colors.
 */
export async function bakeAnime(srcImage, w, h, intensity = 1) {
  const blurPx = mix(0.5, 1.5, intensity);
  const sat = mix(180, 260, intensity);
  const contrast = mix(115, 140, intensity);
  const data = captureImageData(
    srcImage,
    w,
    h,
    `blur(${blurPx}px) saturate(${sat}%) contrast(${contrast}%)`
  );
  autoLevels(data);
  // Bilateral smooth gives the cel-shaded "painted not photographed" surface.
  bilateralFilter5(data, w, h, mix(38, 25, intensity));
  // Adaptive vivid palette: k-means colors with a strong saturation boost so
  // they read as anime cel paint instead of muted photo midtones.
  const palette = kmeansPalette(data, mix(12, 7, intensity), 14);
  shiftPalette(palette, { satMul: mix(1.4, 1.85, intensity) });
  snapToPalette(data, palette);
  boostContrast(data, mix(0.2, 0.35, intensity));
  return imageDataToBlob(data, w, h);
}

/**
 * Ghibli: auto-levels for contrast restore → warm pastel tone via canvas
 * filter → mild bloom via soft-light (gentler than screen — no highlight
 * blowout) → posterize lightly + final S-curve so it reads as a hand-painted
 * cel, not a washed-out photo.
 */
export async function bakeGhibli(srcImage, w, h, intensity = 1) {
  // Step 1: warm pastel canvas via CSS filter on the raw source.
  const sepia = mix(20, 45, intensity);
  const hue = mix(10, 22, intensity);
  const baseSat = mix(95, 110, intensity);
  const baseContrast = mix(98, 110, intensity);

  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = w;
  baseCanvas.height = h;
  const baseCtx = baseCanvas.getContext('2d');
  if (!baseCtx) throw new Error('Canvas context unavailable');
  baseCtx.filter = `brightness(102%) contrast(${baseContrast}%) saturate(${baseSat}%) hue-rotate(${hue}deg) sepia(${sepia}%)`;
  baseCtx.drawImage(srcImage, 0, 0, w, h);

  // Step 2: gentle bloom via soft-light (preserves highlights, adds glow).
  const bright = document.createElement('canvas');
  bright.width = w;
  bright.height = h;
  const brightCtx = bright.getContext('2d');
  if (!brightCtx) throw new Error('Canvas context unavailable');
  const bloomRadius = Math.max(
    3,
    Math.round((Math.min(w, h) / 80) * mix(0.4, 1.0, intensity))
  );
  brightCtx.filter = `brightness(130%) contrast(140%) saturate(105%) blur(${bloomRadius}px)`;
  brightCtx.drawImage(srcImage, 0, 0, w, h);

  baseCtx.filter = 'none';
  baseCtx.globalCompositeOperation = 'soft-light';
  baseCtx.globalAlpha = mix(0.4, 0.7, intensity);
  baseCtx.drawImage(bright, 0, 0);
  baseCtx.globalCompositeOperation = 'source-over';
  baseCtx.globalAlpha = 1;

  // Step 3: pixel pass — bilateral + k-means + warm hue/sat tweaks. K-means
  // keeps colors from the actual image (skin tones from skin, sky from sky)
  // and the warm shift moves them into Ghibli's signature warm-pastel range.
  const data = baseCtx.getImageData(0, 0, w, h);
  autoLevels(data, 0.03, 0.97);
  bilateralFilter5(data, w, h, mix(40, 28, intensity));
  const palette = kmeansPalette(data, mix(14, 9, intensity), 14);
  shiftPalette(palette, {
    hueShift: mix(6, 18, intensity), // warm-shift toward orange/yellow
    satMul: mix(0.85, 0.7, intensity), // slightly desaturated for pastel feel
    lightMul: mix(1.04, 1.1, intensity), // brighten slightly for airy look
  });
  snapToPalette(data, palette);
  boostContrast(data, mix(0.08, 0.18, intensity));
  baseCtx.putImageData(data, 0, 0);

  return canvasToBlob(baseCanvas);
}

/**
 * Sketch: grayscale × color-dodge(blur(invert(grayscale))), then darken &
 * S-curve so lines are visible even on bright photos. Previously the
 * dodge-result was so light the subject vanished into the paper — fixed
 * with a post-pass that drops the lightest tones and boosts midtone
 * contrast.
 */
export async function bakeSketch(srcImage, w, h, intensity = 1) {
  const gray = document.createElement('canvas');
  gray.width = w;
  gray.height = h;
  const gctx = gray.getContext('2d');
  if (!gctx) throw new Error('Canvas context unavailable');
  // Lower brightness on the grayscale base so the dodge doesn't blow out
  // mid-tones to pure white.
  gctx.filter = 'grayscale(100%) brightness(92%) contrast(115%)';
  gctx.drawImage(srcImage, 0, 0, w, h);

  const inv = document.createElement('canvas');
  inv.width = w;
  inv.height = h;
  const ictx = inv.getContext('2d');
  if (!ictx) throw new Error('Canvas context unavailable');
  const baseBlur = Math.min(w, h) / 80;
  const blurPx = Math.max(4, Math.round(baseBlur * mix(0.5, 1.6, intensity)));
  ictx.filter = `grayscale(100%) invert(100%) blur(${blurPx}px)`;
  ictx.drawImage(srcImage, 0, 0, w, h);

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d');
  if (!octx) throw new Error('Canvas context unavailable');
  octx.drawImage(gray, 0, 0);
  octx.globalCompositeOperation = 'color-dodge';
  octx.drawImage(inv, 0, 0);
  octx.globalCompositeOperation = 'source-over';

  // Post-pass: darken lights and steepen midtones so the sketch lines pop
  // instead of dissolving into the page.
  const data = octx.getImageData(0, 0, w, h);
  const darkenAmt = Math.round(mix(15, 45, intensity)); // 15..45 of 255
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.max(0, d[i] - darkenAmt);
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
  }
  boostContrast(data, mix(0.3, 0.55, intensity));
  octx.putImageData(data, 0, 0);

  return canvasToBlob(out);
}

// ---------- new styles ----------

/**
 * Watercolor: heavy smoothing + soft posterize + subtle dark edges that mimic
 * pigment bleeding into outlines.
 */
export async function bakeWatercolor(srcImage, w, h, intensity = 1) {
  const blurPx = mix(2, 5, intensity);
  const sat = mix(95, 130, intensity);
  const data = captureImageData(
    srcImage,
    w,
    h,
    `blur(${blurPx}px) saturate(${sat}%) brightness(105%)`
  );
  autoLevels(data);
  medianFilter3(data, w, h);
  posterize(data, mix(14, 8, intensity));
  const edges = sobelEdges(data, w, h);
  const edgeThresh = mix(110, 70, intensity);
  const darken = Math.round(mix(40, 80, intensity));
  const d = data.data;
  for (let i = 0; i < w * h; i++) {
    if (edges[i] > edgeThresh) {
      const p = i * 4;
      d[p] = Math.max(0, d[p] - darken);
      d[p + 1] = Math.max(0, d[p + 1] - darken);
      d[p + 2] = Math.max(0, d[p + 2] - darken);
    }
  }
  boostContrast(data, mix(0.15, 0.3, intensity));
  return imageDataToBlob(data, w, h);
}

/**
 * Oil paint: pre-posterize → 3×3 median (which on a posterized image collapses
 * neighbors into chunky color regions, the brushstroke effect) → light
 * saturate + contrast.
 */
export async function bakeOilPaint(srcImage, w, h, intensity = 1) {
  const blurPx = mix(0.5, 2, intensity);
  const data = captureImageData(
    srcImage,
    w,
    h,
    `blur(${blurPx}px) saturate(150%) contrast(125%)`
  );
  autoLevels(data);
  posterize(data, mix(10, 5, intensity));
  // Median repeatedly for stronger brushstroke chunking at high intensity.
  medianFilter3(data, w, h);
  if (intensity > 0.5) medianFilter3(data, w, h);
  if (intensity > 0.8) medianFilter3(data, w, h);
  boostContrast(data, mix(0.15, 0.3, intensity));
  return imageDataToBlob(data, w, h);
}

/**
 * Pop art: aggressive posterize + boosted saturation + contrast. Comic-book /
 * Warhol flat-color look.
 */
export async function bakePopArt(srcImage, w, h, intensity = 1) {
  const sat = mix(200, 300, intensity);
  const contrast = mix(150, 220, intensity);
  const data = captureImageData(
    srcImage,
    w,
    h,
    `saturate(${sat}%) contrast(${contrast}%) brightness(108%)`
  );
  autoLevels(data);
  medianFilter3(data, w, h);
  posterize(data, mix(5, 3, intensity));
  // Strong dark edges for the comic-book outline.
  const edges = sobelEdges(data, w, h);
  const edgeThresh = mix(70, 35, intensity);
  const d = data.data;
  for (let i = 0; i < w * h; i++) {
    if (edges[i] > edgeThresh) {
      const p = i * 4;
      d[p] = 0;
      d[p + 1] = 0;
      d[p + 2] = 0;
    }
  }
  boostContrast(data, mix(0.2, 0.4, intensity));
  return imageDataToBlob(data, w, h);
}

/**
 * Pixel art: downsample to low-res, upsample with nearest-neighbor, posterize
 * to small palette. Block size scales with intensity.
 */
export async function bakePixelArt(srcImage, w, h, intensity = 1) {
  const pixelSize = Math.max(3, Math.round(mix(4, 18, intensity)));
  const lowW = Math.max(8, Math.floor(w / pixelSize));
  const lowH = Math.max(8, Math.floor(h / pixelSize));

  const low = document.createElement('canvas');
  low.width = lowW;
  low.height = lowH;
  const lctx = low.getContext('2d');
  if (!lctx) throw new Error('Canvas context unavailable');
  lctx.imageSmoothingEnabled = true;
  lctx.drawImage(srcImage, 0, 0, lowW, lowH);

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d');
  if (!octx) throw new Error('Canvas context unavailable');
  // CRUCIAL — without this, the upsample is smooth, not blocky.
  octx.imageSmoothingEnabled = false;
  octx.drawImage(low, 0, 0, w, h);

  const data = octx.getImageData(0, 0, w, h);
  autoLevels(data);
  posterize(data, mix(12, 6, intensity));
  boostContrast(data, mix(0.15, 0.3, intensity));
  octx.putImageData(data, 0, 0);

  return canvasToBlob(out);
}

// ---------- registry + dispatcher ----------

const BAKERS = {
  ghibli: bakeGhibli,
  anime: bakeAnime,
  cartoon: bakeCartoon,
  sketch: bakeSketch,
  watercolor: bakeWatercolor,
  oilpaint: bakeOilPaint,
  popart: bakePopArt,
  pixelart: bakePixelArt,
};

/**
 * Resolve and run a baker by preset id. `intensity` is in [0..1] (default 1).
 */
export async function bakeStyle(presetId, srcImage, w, h, intensity = 1) {
  const fn = BAKERS[presetId];
  if (!fn) throw new Error(`Unknown style preset: ${presetId}`);
  return fn(srcImage, w, h, intensity);
}
