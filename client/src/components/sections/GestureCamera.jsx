import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2, AlertTriangle } from 'lucide-react';
import {
  loadHandLandmarker,
  classifyGesture,
  classifyTwoHandedGesture,
  GESTURE_EMOJI,
  HAND_CONNECTIONS,
} from '../../lib/gestures';

const GESTURE_LABEL = {
  pinch: 'Pinch',
  point: 'Point',
  two_fingers: 'Peace',
  three_fingers: 'Three',
  four_fingers: 'Four',
  thumbs_up: 'Thumbs up',
  shaka: 'Shaka',
  rock_n_roll: 'Rock',
  two_hand_zoom: 'Zoom',
  palm: 'Open palm',
  fist: 'Fist',
  unknown: 'Unknown',
  none: 'No hand',
};

const GESTURE_COLOR = {
  pinch: 'text-neon-cyan',
  point: 'text-amber-300',
  two_fingers: 'text-neon-pink',
  three_fingers: 'text-violet-300',
  four_fingers: 'text-fuchsia-300',
  thumbs_up: 'text-orange-300',
  shaka: 'text-teal-300',
  rock_n_roll: 'text-yellow-300',
  two_hand_zoom: 'text-sky-300',
  palm: 'text-emerald-300',
  fist: 'text-rose-300',
  unknown: 'text-slate-400',
  none: 'text-slate-500',
};

const CONTINUOUS = new Set(['pinch', 'point', 'two_hand_zoom']);

const TARGET_INTERVAL_MS = 33; // ~30 FPS

export default function GestureCamera({
  onGesture,
  onError,
  activeAdjustment,
  activeValue,
  activeUnit = '',
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const landmarkerRef = useRef(null);
  const lastDetectAtRef = useRef(0);
  const onGestureRef = useRef(onGesture);

  const [status, setStatus] = useState('idle'); // idle | loading | running | error
  const [errorMsg, setErrorMsg] = useState('');
  const [gestureName, setGestureName] = useState('none');

  useEffect(() => {
    onGestureRef.current = onGesture;
  }, [onGesture]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        /* ignore */
      }
      videoRef.current.srcObject = null;
    }
    lastDetectAtRef.current = 0;
    setStatus('idle');
    setGestureName('none');
    console.info('[gestures] stopped');
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  const loop = useCallback(() => {
    const tick = () => {
      if (!streamRef.current) return; // stopped
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !canvas || !landmarker) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      try {
        const now = performance.now();
        if (
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          now - lastDetectAtRef.current >= TARGET_INTERVAL_MS
        ) {
          lastDetectAtRef.current = now;
          const result = landmarker.detectForVideo(video, now);
          const hands = result?.landmarks ?? [];
          const handednesses = result?.handednesses ?? [];

          // Classify each hand + attach handedness ("Left" / "Right") from MediaPipe.
          const perHand = hands.map((h, i) => ({
            ...classifyGesture(h),
            side: handednesses[i]?.[0]?.categoryName ?? 'Unknown',
          }));

          // First detected per side wins (defensive against duplicate labels).
          let rightHand = null;
          let leftHand = null;
          for (const g of perHand) {
            if (g.side === 'Right' && !rightHand) rightHand = g;
            else if (g.side === 'Left' && !leftHand) leftHand = g;
          }

          // Two-hand zoom only when BOTH hands are at rest — so a one-hand pinch
          // or peace never gets clobbered by zoom while the other hand is up.
          const REST = new Set(['palm', 'fist', 'unknown', 'none']);
          let twoHand = null;
          if (hands.length >= 2 && perHand.every((g) => REST.has(g.name))) {
            twoHand = classifyTwoHandedGesture(hands);
          }

          drawOverlay(canvas, hands, perHand, twoHand);

          // Chip name: twoHand → right → left → none, so it always reflects
          // the most actionable gesture currently in play.
          const primary =
            twoHand?.name === 'two_hand_zoom'
              ? twoHand
              : rightHand ?? leftHand ?? { name: 'none' };
          setGestureName((prev) => (prev === primary.name ? prev : primary.name));

          onGestureRef.current?.({ left: leftHand, right: rightHand, twoHand });
        }
      } catch (err) {
        console.error('[gestures] tick error', err);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    if (status === 'running' || status === 'loading') return;
    console.info('[gestures] enable requested');
    setStatus('loading');
    setErrorMsg('');
    let pendingStream = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Camera API not available. Use Chrome or Edge over http://localhost.'
        );
      }

      console.info('[gestures] requesting camera + loading model in parallel…');
      const [landmarker, stream] = await Promise.all([
        loadHandLandmarker(),
        navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        }),
      ]);
      pendingStream = stream;
      console.info('[gestures] got stream and landmarker, attaching to <video>');

      const video = videoRef.current;
      if (!video) throw new Error('Video element not mounted.');

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      // Wait until the video knows its dimensions before starting detection.
      if (video.readyState < 1) {
        await new Promise((resolve, reject) => {
          const cleanup = () => {
            video.removeEventListener('loadedmetadata', onMeta);
            video.removeEventListener('error', onErr);
          };
          const onMeta = () => {
            cleanup();
            resolve();
          };
          const onErr = () => {
            cleanup();
            reject(new Error('Video failed to load metadata.'));
          };
          video.addEventListener('loadedmetadata', onMeta, { once: true });
          video.addEventListener('error', onErr, { once: true });
        });
      }

      await video.play();
      console.info(
        `[gestures] video playing (${video.videoWidth}x${video.videoHeight})`
      );

      landmarkerRef.current = landmarker;
      streamRef.current = stream;
      pendingStream = null;

      lastDetectAtRef.current = 0;
      setStatus('running');
      loop();
    } catch (err) {
      console.error('[gestures] start failed', err);
      // If only the stream succeeded but we threw afterwards, release it.
      if (pendingStream) {
        pendingStream.getTracks().forEach((t) => t.stop());
      }
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in the address-bar icon and click Try again.'
          : err?.name === 'NotFoundError'
          ? 'No camera was found. Plug one in and try again.'
          : err?.name === 'NotReadableError'
          ? 'Another app is using the camera. Close it (Zoom, Meet, OBS…) and try again.'
          : err?.name === 'OverconstrainedError'
          ? 'Camera does not support the requested resolution.'
          : err?.message ?? 'Could not start camera.';
      setErrorMsg(msg);
      setStatus('error');
      onError?.(msg);
    }
  }, [status, loop, onError]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold">Camera gestures</h3>
        {status !== 'running' ? (
          <button
            type="button"
            onClick={start}
            disabled={status === 'loading'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-grad-neon text-white shadow-glow-cyan disabled:opacity-60"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Loading…
              </>
            ) : (
              <>
                <Camera size={14} /> Enable
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg glass text-rose-300 hover:bg-rose-500/20"
          >
            <CameraOff size={14} /> Stop
          </button>
        )}
      </div>

      <div className="relative rounded-xl overflow-hidden bg-bg-950 border border-white/10 aspect-[4/3]">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
        />

        {status !== 'running' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-bg-950/85">
            {status === 'loading' ? (
              <>
                <Loader2 size={28} className="animate-spin text-neon-cyan mb-2" />
                <p className="text-sm text-slate-300">Warming up hand tracking…</p>
              </>
            ) : status === 'error' ? (
              <>
                <AlertTriangle size={28} className="text-rose-400 mb-2" />
                <p className="text-sm text-rose-200 max-w-xs">{errorMsg}</p>
                <button
                  type="button"
                  onClick={start}
                  className="mt-3 text-xs px-3 py-1.5 rounded-lg glass hover:bg-white/10"
                >
                  Try again
                </button>
              </>
            ) : (
              <>
                <Camera size={28} className="text-slate-400 mb-2" />
                <p className="text-sm text-slate-400">
                  Enable camera to control filters with your hand.
                </p>
              </>
            )}
          </div>
        )}

        {status === 'running' && (
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full glass-strong text-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className={GESTURE_COLOR[gestureName] ?? 'text-slate-300'}>
              {GESTURE_LABEL[gestureName] ?? gestureName}
            </span>
            {gestureName === 'two_hand_zoom' ? (
              <span className="text-slate-300">
                · <span className="text-white font-mono">both hands</span>
              </span>
            ) : (
              CONTINUOUS.has(gestureName) && activeAdjustment && (
                <span className="text-slate-300">
                  ·{' '}
                  <span className="text-white font-mono">
                    {activeAdjustment} {activeValue}
                    {activeUnit}
                  </span>
                </span>
              )
            )}
          </div>
        )}
        {status === 'running' && activeAdjustment && (
          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full glass-strong text-[10px] uppercase tracking-wider text-slate-300">
            Active: <span className="text-neon-cyan font-semibold">{activeAdjustment}</span>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
        <div className="mb-2 text-[11px] text-slate-300">
          <span className="text-neon-cyan font-semibold">Right hand</span> ➜ main image ·{' '}
          <span className="text-neon-pink font-semibold">Left hand</span> ➜ merge layer
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span><span className="text-neon-cyan">Pinch 🤏</span> — set active</span>
          <span><span className="text-amber-300">Point ☝️</span> — set active</span>
          <span><span className="text-neon-pink">Peace ✌️</span> — next slider</span>
          <span><span className="text-violet-300">Three 🖖</span> — rotate 90°</span>
          <span><span className="text-fuchsia-300">Four ✋</span> — flip H</span>
          <span><span className="text-yellow-300">Rock 🤘</span> — flip V</span>
          <span><span className="text-orange-300">Thumbs 👍</span> — preset</span>
          <span><span className="text-teal-300">Shaka 🤙</span> — remove BG</span>
          <span><span className="text-rose-300">Fist ✊</span> (1s) — reset</span>
          <span><span className="text-emerald-300">Palm 🖐️</span> — pause</span>
          <span className="col-span-2"><span className="text-sky-300">Both hands 🔍</span> — zoom in / out</span>
        </div>
      </div>
    </div>
  );
}

function drawOverlay(canvas, hands, perHand, twoHandResult) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (!hands?.length) return;

  // Skeleton + landmark dots, colored by hand side so L vs R is readable at a glance.
  for (let i = 0; i < hands.length; i++) {
    const hand = hands[i];
    const side = perHand[i]?.side;
    const skeletonColor =
      side === 'Right'
        ? 'rgba(34, 211, 238, 0.9)' // cyan
        : side === 'Left'
        ? 'rgba(236, 72, 153, 0.9)' // pink
        : 'rgba(168, 85, 247, 0.9)'; // purple fallback
    ctx.strokeStyle = skeletonColor;
    ctx.lineWidth = 3;
    for (const [a, b] of HAND_CONNECTIONS) {
      const p1 = hand[a];
      const p2 = hand[b];
      if (!p1 || !p2) continue;
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(168, 85, 247, 0.95)';
    for (const p of hand) {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Per-hand emoji + L/R glyph, floating above the wrist (landmark 0).
  // Canvas is CSS-mirrored to match user-facing video, so we counter-mirror
  // the text glyph rendering so emojis/letters are not flipped.
  ctx.save();
  ctx.scale(-1, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < hands.length; i++) {
    const hand = hands[i];
    const wrist = hand[0];
    if (!wrist) continue;
    const emoji = GESTURE_EMOJI[perHand[i]?.name] ?? '👋';
    const side = perHand[i]?.side;
    const sideLabel = side === 'Right' ? 'R' : side === 'Left' ? 'L' : '?';
    const sideColor = side === 'Right' ? '#22d3ee' : side === 'Left' ? '#ec4899' : '#a855f7';
    const x = -wrist.x * w; // mirror compensation
    const y = wrist.y * h - 36;

    // Soft shadow disc behind the emoji for visibility on bright frames.
    ctx.fillStyle = 'rgba(5, 6, 15, 0.65)';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();

    // Emoji
    ctx.font = 'bold 38px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(emoji, x, y);

    // L/R badge — small, top-right of the disc, colored by side.
    ctx.font = 'bold 14px "Inter",system-ui,sans-serif';
    ctx.fillStyle = 'rgba(5, 6, 15, 0.85)';
    ctx.beginPath();
    ctx.arc(x + 22, y - 18, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = sideColor;
    ctx.fillText(sideLabel, x + 22, y - 18);
  }
  ctx.restore();

  // Two-handed: dashed line + zoom % at midpoint.
  if (hands.length >= 2 && twoHandResult?.name === 'two_hand_zoom') {
    const a = hands[0][0];
    const b = hands[1][0];
    if (a && b) {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
      ctx.setLineDash([]);

      const mx = ((a.x + b.x) / 2) * w;
      const my = ((a.y + b.y) / 2) * h;
      const d = twoHandResult.payload?.distance ?? 0;
      const zoomPct = Math.round(Math.min(3, Math.max(0.5, 0.5 + (d - 0.1) * 5)) * 100);

      ctx.save();
      ctx.scale(-1, 1);
      ctx.font = 'bold 18px "Inter",system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = `🔍 ${zoomPct}%`;
      const labelW = ctx.measureText(label).width + 18;
      ctx.fillStyle = 'rgba(5, 6, 15, 0.75)';
      ctx.fillRect(-mx - labelW / 2, my - 14, labelW, 28);
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(label, -mx, my);
      ctx.restore();
    }
  }
}
