// Procedurally drawn 256x256 style references — one per preset. The arbitrary
// style transfer network keys on the reference's color statistics and texture,
// so even a synthesized swatch produces a recognizable stylistic nudge. These
// are seeded into localStorage on first load so the neural path runs by
// default; a user-uploaded reference (via the "+" button) overrides.

const SIZE = 256;

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  return { c, ctx: c.getContext('2d') };
}

function drawGhibli(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, SIZE);
  g.addColorStop(0, '#fde4c8');
  g.addColorStop(0.32, '#f7c0a8');
  g.addColorStop(0.55, '#b8d4e8');
  g.addColorStop(0.78, '#a8c89a');
  g.addColorStop(1, '#7fa078');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 10; i++) {
    const x = (i * 41 + 13) % SIZE;
    const y = 15 + ((i * 23) % 90);
    const r = 16 + ((i * 7) % 24);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#f5a8b8';
  for (let i = 0; i < 40; i++) {
    const x = (i * 73 + 17) % SIZE;
    const y = 120 + ((i * 19) % 110);
    ctx.beginPath();
    ctx.arc(x, y, 2.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawAnime(ctx) {
  ctx.fillStyle = '#fff5f0';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const palette = ['#ff3a8c', '#00d4ff', '#ffea00', '#1a1a2e', '#5e3aff', '#ffffff'];
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = palette[i % palette.length];
    const x = (i * 47 + 11) % SIZE;
    const y = (i * 31 + 19) % SIZE;
    const w = 45 + ((i * 17) % 75);
    const h = 45 + ((i * 23) % 75);
    ctx.fillRect(x, y, w, h);
  }
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo((i * 53) % SIZE, 0);
    ctx.lineTo((i * 53 + 90) % SIZE, SIZE);
    ctx.stroke();
  }
}

function drawCartoon(ctx) {
  const palette = ['#ff4136', '#ffdc00', '#0074d9', '#2ecc40', '#ffffff', '#ff851b'];
  const cell = SIZE / 4;
  let i = 0;
  for (let y = 0; y < SIZE; y += cell) {
    for (let x = 0; x < SIZE; x += cell) {
      ctx.fillStyle = palette[i % palette.length];
      ctx.fillRect(x, y, cell, cell);
      i++;
    }
  }
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 10;
  for (let y = 0; y <= SIZE; y += cell) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SIZE, y);
    ctx.stroke();
  }
  for (let x = 0; x <= SIZE; x += cell) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, SIZE);
    ctx.stroke();
  }
}

function drawSketch(ctx) {
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 0.7;
  ctx.globalAlpha = 0.45;
  for (let i = -SIZE; i < SIZE * 2; i += 3) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + SIZE, SIZE);
    ctx.stroke();
  }
  for (let i = -SIZE; i < SIZE * 2; i += 3) {
    ctx.beginPath();
    ctx.moveTo(i, SIZE);
    ctx.lineTo(i + SIZE, 0);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#1a1a1a';
  for (let i = 0; i < 8; i++) {
    const x = (i * 43 + 7) % SIZE;
    const y = (i * 67 + 11) % SIZE;
    const r = 28 + (i * 11) % 38;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWatercolor(ctx) {
  ctx.fillStyle = '#fdfaf2';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const palette = ['#f8b5c0', '#c2b8e8', '#a8e0c8', '#fde2a8', '#f5c8a0', '#b0d4e8'];
  for (let i = 0; i < 18; i++) {
    const color = palette[i % palette.length];
    const x = (i * 41 + 13) % SIZE;
    const y = (i * 53 + 7) % SIZE;
    const r = 30 + ((i * 7) % 40);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color + 'cc');
    grad.addColorStop(0.6, color + '55');
    grad.addColorStop(1, color + '00');
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function drawOilPaint(ctx) {
  ctx.fillStyle = '#c9a878';
  ctx.fillRect(0, 0, SIZE, SIZE);
  const palette = ['#8b4513', '#1e3a5f', '#2d5d2e', '#d4a373', '#f5e6c8', '#7a3b2e', '#a0522d'];
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = palette[i % palette.length];
    const x = (i * 31 + 11) % SIZE;
    const y = (i * 47 + 19) % SIZE;
    const w = 28 + ((i * 7) % 38);
    const h = 5 + ((i * 3) % 11);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(((i * 17) % 180) * Math.PI / 180);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

function drawPopArt(ctx) {
  ctx.fillStyle = '#ff1744';
  ctx.fillRect(0, 0, SIZE, SIZE / 2);
  ctx.fillStyle = '#ffea00';
  ctx.fillRect(0, SIZE / 2, SIZE, SIZE / 2);
  ctx.fillStyle = '#000';
  for (let y = 6; y < SIZE; y += 11) {
    for (let x = 6; x < SIZE; x += 11) {
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#0074d9';
  ctx.beginPath();
  ctx.arc(180, 80, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(70, 180, 28, 0, Math.PI * 2);
  ctx.fill();
}

function drawPixelArt(ctx) {
  const palette = [
    '#1a1a2e',
    '#0f3460',
    '#16537e',
    '#e94560',
    '#f9a826',
    '#a8e6cf',
    '#dcedc1',
    '#ffd3b6',
  ];
  const cell = SIZE / 16;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const i = (x * 37 + y * 13 + 5) % palette.length;
      ctx.fillStyle = palette[i];
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
}

const DRAWERS = {
  ghibli: drawGhibli,
  anime: drawAnime,
  cartoon: drawCartoon,
  sketch: drawSketch,
  watercolor: drawWatercolor,
  oilpaint: drawOilPaint,
  popart: drawPopArt,
  pixelart: drawPixelArt,
};

export function generateDefaultStyleRef(presetId) {
  const drawer = DRAWERS[presetId];
  if (!drawer) return null;
  const { c, ctx } = makeCanvas();
  drawer(ctx);
  return c.toDataURL('image/jpeg', 0.85);
}
