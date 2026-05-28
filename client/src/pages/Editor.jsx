import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Upload,
  Download,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Scissors,
  Loader2,
  Wand2,
  Layers,
  LayoutTemplate,
  X,
} from 'lucide-react';
import { fetchTemplate } from '../lib/templatesApi';
import { bakeStyle } from '../lib/stylize';
import {
  loadNeuralModel,
  neuralReady,
  applyNeuralStyle,
  hasStyleReference,
  setStyleReference,
  clearStyleReference,
  loadStyleReferenceImage,
  fileToStyleDataUrl,
} from '../lib/neuralStyle';
import { generateDefaultStyleRef } from '../lib/defaultStyleRefs';
import GlassCard from '../components/ui/GlassCard';
import GradientText from '../components/ui/GradientText';
import NeonButton from '../components/ui/NeonButton';
import { useToast } from '../components/ui/Toaster';
import ActionFlash from '../components/ui/ActionFlash';
import GestureCamera from '../components/sections/GestureCamera';

const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
};

// AI style presets — each is one Replicate img2img call (when REPLICATE_STYLE_MODEL
// is configured) OR a real image-processing pipeline (Sobel edges, posterization,
// bloom — see lib/stylize.js) baked into the merge layer when it isn't. The
// fallback produces a stylized rendering of the photo's pixels, not a regenerated
// character — that requires the Replicate path.
const STYLE_PRESETS = [
  {
    id: 'ghibli',
    label: 'Ghibli',
    emoji: '🍃',
    prompt:
      'studio ghibli anime style, hand-drawn animation cel, soft watercolor background, dreamy pastel palette, miyazaki inspired',
  },
  {
    id: 'anime',
    label: 'Anime',
    emoji: '✨',
    prompt:
      'anime style portrait, vibrant saturated colors, manga aesthetic, cel-shaded, sharp lineart, japanese animation',
  },
  {
    id: 'cartoon',
    label: 'Cartoon',
    emoji: '🎨',
    prompt:
      'cartoon illustration, bold black outlines, flat saturated colors, comic book style, cel-shaded',
  },
  {
    id: 'sketch',
    label: 'Sketch',
    emoji: '✏️',
    prompt:
      'pencil sketch on paper, monochrome graphite drawing, detailed cross-hatch shading, hand drawn, paper texture',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    emoji: '💧',
    prompt:
      'watercolor painting, soft pigment bleeds, wet-on-wet brush strokes, paper texture, gentle muted palette',
  },
  {
    id: 'oilpaint',
    label: 'Oil paint',
    emoji: '🖌️',
    prompt:
      'oil painting, thick textured brush strokes, classical art, rich layered pigments, painterly impressionist style',
  },
  {
    id: 'popart',
    label: 'Pop art',
    emoji: '🌈',
    prompt:
      'pop art style, flat saturated primary colors, bold black outlines, comic book halftone, Warhol Lichtenstein inspired',
  },
  {
    id: 'pixelart',
    label: 'Pixel art',
    emoji: '👾',
    prompt:
      'pixel art, 16-bit retro game sprite, chunky pixels, limited palette, crisp blocky aesthetic',
  },
];

const PRESETS = [
  { name: 'Original', filters: DEFAULT_FILTERS },
  { name: 'Cinematic', filters: { ...DEFAULT_FILTERS, contrast: 115, saturate: 95, brightness: 96 } },
  { name: 'Anime', filters: { ...DEFAULT_FILTERS, saturate: 150, contrast: 115 } },
  { name: 'Vintage', filters: { ...DEFAULT_FILTERS, sepia: 45, contrast: 90, saturate: 80 } },
  { name: 'Cyberpunk', filters: { ...DEFAULT_FILTERS, hueRotate: 240, saturate: 145, contrast: 110 } },
  { name: 'Cartoon', filters: { ...DEFAULT_FILTERS, contrast: 130, saturate: 130, brightness: 105 } },
  { name: 'Dream', filters: { ...DEFAULT_FILTERS, blur: 1, brightness: 110, saturate: 110 } },
  { name: 'Neon', filters: { ...DEFAULT_FILTERS, hueRotate: 180, contrast: 110, saturate: 140 } },
  { name: 'Noir', filters: { ...DEFAULT_FILTERS, grayscale: 100, contrast: 110 } },
];

const SLIDERS = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, unit: '%' },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%' },
  { key: 'saturate', label: 'Saturation', min: 0, max: 200, unit: '%' },
  { key: 'hueRotate', label: 'Hue rotate', min: 0, max: 360, unit: '°' },
  { key: 'blur', label: 'Blur', min: 0, max: 12, unit: 'px' },
  { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, unit: '%' },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100, unit: '%' },
  { key: 'invert', label: 'Invert', min: 0, max: 100, unit: '%' },
];

const MAX_FILE_MB = 15;

// Subset of CSS `mix-blend-mode` values that also exist as canvas
// `globalCompositeOperation` values — so the export matches the preview.
const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
];

function buildFilterString(f) {
  return [
    `brightness(${f.brightness}%)`,
    `contrast(${f.contrast}%)`,
    `saturate(${f.saturate}%)`,
    `hue-rotate(${f.hueRotate}deg)`,
    `blur(${f.blur}px)`,
    `grayscale(${f.grayscale}%)`,
    `sepia(${f.sepia}%)`,
    `invert(${f.invert}%)`,
  ].join(' ');
}

// Map CSS `mix-blend-mode` value → canvas `globalCompositeOperation`.
// The values are 1:1 except "normal" → "source-over".
function toCompositeOp(blend) {
  return blend === 'normal' ? 'source-over' : blend;
}

export default function Editor() {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const [imgSrc, setImgSrc] = useState(null);
  const [imgMeta, setImgMeta] = useState(null); // { width, height, name }
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [rotation, setRotation] = useState(0); // degrees, 0/90/180/270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeAdjustment, setActiveAdjustment] = useState('brightness');
  const [removingBg, setRemovingBg] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Second-image / merge layer state.
  const [secondSrc, setSecondSrc] = useState(null);
  const [secondMeta, setSecondMeta] = useState(null);
  const [secondOpacity, setSecondOpacity] = useState(0.6);
  const [secondBlend, setSecondBlend] = useState('normal');
  const secondInputRef = useRef(null);
  const secondImageRef = useRef(null);

  // AI style state.
  const [stylizing, setStylizing] = useState(null); // active preset id while in flight
  // Per-style configured flags from GET /api/stylize, e.g. { ghibli: true, anime: false, ... }.
  // Treat the whole map as "any AI is wired" when computing the card subtitle.
  const [stylizeConfigured, setStylizeConfigured] = useState({});
  const anyStyleConfigured = Object.values(stylizeConfigured).some(Boolean);
  // Effect strength 0..100; passed to bakeStyle as intensity/100 for local
  // pipelines. The Replicate path doesn't use it (different models expose
  // different strength knobs; not worth a unified abstraction yet).
  const [styleIntensity, setStyleIntensity] = useState(100);

  // Neural style transfer (TFJS) state.
  // styleRefMap: { ghibli: bool, ... } — whether a style reference image is
  // cached in localStorage for that preset. If true, button uses neural path.
  const [styleRefMap, setStyleRefMap] = useState({});
  const [neuralModelLoaded, setNeuralModelLoaded] = useState(false);
  const styleRefInputRef = useRef(null);
  const pendingStyleRefIdRef = useRef(null);

  // Seed procedurally-drawn default style references for any preset that
  // doesn't already have one, then initialize styleRefMap. Defaults make the
  // neural transfer path the default routing for every button — a user upload
  // via the "+" icon still overrides per-preset.
  useEffect(() => {
    STYLE_PRESETS.forEach((p) => {
      if (!hasStyleReference(p.id)) {
        const url = generateDefaultStyleRef(p.id);
        if (url) setStyleReference(p.id, url);
      }
    });
    setStyleRefMap(
      Object.fromEntries(STYLE_PRESETS.map((p) => [p.id, hasStyleReference(p.id)]))
    );
    setNeuralModelLoaded(neuralReady());
  }, []);

  // Pre-warm the neural model in the background once the user uploads an
  // image — by the time they click a style button the ~11 MB download has
  // already finished (or is well underway), so the click runs inference only.
  useEffect(() => {
    if (!imgMeta || neuralModelLoaded) return;
    let cancelled = false;
    loadNeuralModel()
      .then(() => {
        if (!cancelled) setNeuralModelLoaded(true);
      })
      .catch(() => {
        /* ignore — actual click path will surface the error */
      });
    return () => {
      cancelled = true;
    };
  }, [imgMeta, neuralModelLoaded]);

  const openStyleRefPicker = (presetId) => {
    pendingStyleRefIdRef.current = presetId;
    styleRefInputRef.current?.click();
  };

  const onStyleRefFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const presetId = pendingStyleRefIdRef.current;
    pendingStyleRefIdRef.current = null;
    if (!file || !presetId) return;
    if (!file.type.startsWith('image/')) {
      toast('Style reference must be an image.', { type: 'warning' });
      return;
    }
    try {
      const dataUrl = await fileToStyleDataUrl(file);
      const ok = setStyleReference(presetId, dataUrl);
      if (!ok) throw new Error('Browser blocked the cache write (storage full?)');
      setStyleRefMap((prev) => ({ ...prev, [presetId]: true }));
      const preset = STYLE_PRESETS.find((p) => p.id === presetId);
      toast(`${preset?.label ?? presetId}: style reference saved.`, {
        type: 'success',
      });
    } catch (err) {
      toast(`Style reference failed: ${err.message}`, { type: 'warning' });
    }
  };

  const clearStyleRefFor = (presetId) => {
    clearStyleReference(presetId);
    setStyleRefMap((prev) => ({ ...prev, [presetId]: false }));
    const preset = STYLE_PRESETS.find((p) => p.id === presetId);
    toast(`${preset?.label ?? presetId}: style reference cleared.`);
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/stylize')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        // perStyle is the authoritative per-button map; `configured` only reflects
        // the generic fallback model.
        setStylizeConfigured(data?.perStyle ?? {});
      })
      .catch(() => {
        if (!cancelled) setStylizeConfigured({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const templateLoadedRef = useRef(false);
  const [flashAction, setFlashAction] = useState(null);
  const flashTimerRef = useRef(null);
  const flashCounterRef = useRef(0);
  const showFlash = useCallback((icon, label) => {
    flashCounterRef.current += 1;
    setFlashAction({ icon, label, id: flashCounterRef.current });
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashAction(null), 650);
  }, []);
  useEffect(() => () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  }, []);

  // Revoke object URL on unmount or new upload
  useEffect(() => {
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, [imgSrc]);

  const loadFile = useCallback(
    (file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast('That file isn’t an image. Try JPG, PNG, or WEBP.', { type: 'warning' });
        return;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast(`Image is over ${MAX_FILE_MB} MB — please pick a smaller file.`, { type: 'warning' });
        return;
      }
      const url = URL.createObjectURL(file);
      setImgSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      // wait for image load to capture dimensions
      const probe = new Image();
      probe.onload = () => {
        setImgMeta({ width: probe.naturalWidth, height: probe.naturalHeight, name: file.name });
      };
      probe.src = url;
      // reset edits
      setFilters(DEFAULT_FILTERS);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      toast(`${file.name} loaded — start editing!`, { type: 'success' });
    },
    [toast]
  );

  // If user arrived via /editor?template=ID, fetch the template via the API
  // (`/api/templates/:id`) and load it through the normal loadFile pipeline.
  // - imageUrl templates (Unsplash) → download bytes, wrap as File.
  // - gradient/stops templates (local) → paint to a 1024×1024 canvas.
  useEffect(() => {
    if (templateLoadedRef.current) return;
    const id = searchParams.get('template');
    if (!id) return;
    templateLoadedRef.current = true;

    let cancelled = false;
    (async () => {
      const template = await fetchTemplate(id);
      if (cancelled || !template) {
        if (!template) toast(`Template "${id}" not found.`, { type: 'warning' });
        return;
      }
      const safeName = template.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      try {
        if (template.imageUrl) {
          const r = await fetch(template.imageUrl);
          if (!r.ok) throw new Error(`Image fetch failed: ${r.status}`);
          const blob = await r.blob();
          const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
          const file = new File([blob], `${safeName}.${ext}`, { type: blob.type });
          loadFile(file);
        } else if (template.stops?.length) {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          template.stops.forEach((color, i) => {
            grad.addColorStop(
              template.stops.length === 1 ? 1 : i / (template.stops.length - 1),
              color
            );
          });
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const high = ctx.createRadialGradient(
            canvas.width * 0.3,
            canvas.height * 0.3,
            0,
            canvas.width * 0.3,
            canvas.height * 0.3,
            canvas.width * 0.7
          );
          high.addColorStop(0, 'rgba(255,255,255,0.18)');
          high.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = high;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await new Promise((resolve) => {
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], `${safeName}.png`, { type: 'image/png' });
                loadFile(file);
              }
              resolve();
            }, 'image/png');
          });
        } else {
          toast(`Template "${template.name}" has no preview source.`, { type: 'warning' });
        }
      } catch (err) {
        toast(`Couldn't load template: ${err.message}`, { type: 'warning' });
      } finally {
        if (!cancelled) {
          const next = new URLSearchParams(searchParams);
          next.delete('template');
          setSearchParams(next, { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, loadFile, toast]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    // reset input so same file can be re-selected later
    e.target.value = '';
  };

  const loadSecondImage = useCallback(
    (file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast('Second layer must be an image.', { type: 'warning' });
        return;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        toast(`Second image is over ${MAX_FILE_MB} MB.`, { type: 'warning' });
        return;
      }
      const url = URL.createObjectURL(file);
      setSecondSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      const probe = new Image();
      probe.onload = () => {
        setSecondMeta({
          width: probe.naturalWidth,
          height: probe.naturalHeight,
          name: file.name,
        });
      };
      probe.src = url;
      toast(`Merged "${file.name}" as second layer.`, { type: 'success' });
    },
    [toast]
  );

  const onSecondFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) loadSecondImage(file);
    e.target.value = '';
  };

  const clearSecondImage = () => {
    if (secondSrc) URL.revokeObjectURL(secondSrc);
    setSecondSrc(null);
    setSecondMeta(null);
    setSecondOpacity(0.6);
    setSecondBlend('normal');
  };

  // Revoke second-image URL on unmount.
  useEffect(() => {
    return () => {
      if (secondSrc) URL.revokeObjectURL(secondSrc);
    };
  }, [secondSrc]);

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: Number(value) }));
  };

  const applyPreset = (preset) => {
    setFilters(preset.filters);
    toast(`Applied "${preset.name}" preset.`);
  };

  const rotateCW = () => {
    setRotation((r) => (r + 90) % 360);
    showFlash(RotateCw, 'Rotated 90°');
  };
  const flipHorizontal = () => {
    setFlipH((v) => !v);
    showFlash(FlipHorizontal, 'Flipped H');
  };
  const flipVertical = () => {
    setFlipV((v) => !v);
    showFlash(FlipVertical, 'Flipped V');
  };

  const reset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    if (secondSrc) {
      URL.revokeObjectURL(secondSrc);
      setSecondSrc(null);
      setSecondMeta(null);
      setSecondOpacity(0.6);
      setSecondBlend('normal');
    }
    toast('Edits cleared.');
    showFlash(RotateCcw, 'Reset');
  }, [toast, showFlash, secondSrc]);

  // Gesture debounce / hold tracking — right hand (first image)
  const lastRotateRef = useRef(0);
  const lastFlipRef = useRef(0);
  const lastFlipVRef = useRef(0);
  const lastCycleRef = useRef(0);
  const lastPresetRef = useRef(0);
  const lastBgRef = useRef(0);
  const fistHoldStartRef = useRef(null);
  const presetIndexRef = useRef(0);

  // Left hand (second image / merge layer)
  const lastBlendCycleRef = useRef(0);
  const lastLayerResetRef = useRef(0);
  const leftFistHoldRef = useRef(null);

  // Stable refs to functions/state that handleGesture wants to call from
  // inside its RAF-driven loop without re-binding every render.
  const removeBackgroundRef = useRef(null);
  const removingBgRef = useRef(false);
  useEffect(() => {
    removingBgRef.current = removingBg;
  }, [removingBg]);

  const setActiveValue = useCallback(
    (t) => {
      // t in 0..1
      setFilters((f) => {
        const slider = SLIDERS.find((s) => s.key === activeAdjustment);
        if (!slider) return f;
        const clamped = Math.min(1, Math.max(0, t));
        const value = Math.round(slider.min + clamped * (slider.max - slider.min));
        if (f[slider.key] === value) return f;
        return { ...f, [slider.key]: value };
      });
    },
    [activeAdjustment]
  );

  const cycleActive = useCallback(() => {
    setActiveAdjustment((curr) => {
      const idx = SLIDERS.findIndex((s) => s.key === curr);
      const next = SLIDERS[(idx + 1) % SLIDERS.length];
      toast(`Adjusting ${next.label.toLowerCase()}`);
      showFlash(Sparkles, next.label);
      return next.key;
    });
  }, [toast, showFlash]);

  const cyclePreset = useCallback(() => {
    presetIndexRef.current = (presetIndexRef.current + 1) % PRESETS.length;
    const p = PRESETS[presetIndexRef.current];
    setFilters(p.filters);
    toast(`Preset: ${p.name}`);
    showFlash(Wand2, p.name);
  }, [toast, showFlash]);

  const handleGesture = useCallback(
    ({ left, right, twoHand }) => {
      // Pause all gesture-driven mutations while BG removal is in flight —
      // otherwise the result swap would clobber any sliders the user moved.
      if (removingBgRef.current) return;
      const now = performance.now();

      // ---- Two-hand zoom — only ever emitted upstream when both hands rest.
      if (twoHand?.name === 'two_hand_zoom' && twoHand.payload) {
        // distance 0.10..0.60 → zoom 0.5..3.0; only update on ≥ 0.01 delta.
        const z = Math.min(
          3,
          Math.max(0.5, 0.5 + (twoHand.payload.distance - 0.1) * 5)
        );
        setZoom((prev) => (Math.abs(prev - z) < 0.01 ? prev : z));
      }

      // ---- RIGHT hand → first image (existing behavior, just re-keyed off `right`).
      if (right) {
        const g = right;
        if (g.name === 'pinch' && g.payload) {
          setActiveValue(g.payload.t);
        } else if (g.name === 'point' && g.payload) {
          // Video is mirrored on screen; invert X so "right side of screen" = max.
          setActiveValue(1 - g.payload.x);
        } else if (g.name === 'rock_n_roll') {
          if (now - lastFlipVRef.current > 800) {
            lastFlipVRef.current = now;
            setFlipV((v) => !v);
            toast('Flipped V');
            showFlash(FlipVertical, 'Flipped V');
          }
        } else if (g.name === 'two_fingers') {
          if (now - lastCycleRef.current > 800) {
            lastCycleRef.current = now;
            cycleActive();
          }
        } else if (g.name === 'three_fingers') {
          if (now - lastRotateRef.current > 800) {
            lastRotateRef.current = now;
            setRotation((r) => (r + 90) % 360);
            toast('Rotated 90°');
            showFlash(RotateCw, 'Rotated 90°');
          }
        } else if (g.name === 'four_fingers') {
          if (now - lastFlipRef.current > 800) {
            lastFlipRef.current = now;
            setFlipH((v) => !v);
            toast('Flipped');
            showFlash(FlipHorizontal, 'Flipped');
          }
        } else if (g.name === 'thumbs_up') {
          if (now - lastPresetRef.current > 1000) {
            lastPresetRef.current = now;
            cyclePreset();
          }
        } else if (g.name === 'shaka') {
          // Long cooldown — the Replicate round-trip is 5-20s, don't queue
          // a second call from the next frame.
          if (now - lastBgRef.current > 3000) {
            lastBgRef.current = now;
            showFlash(Scissors, 'Removing background');
            removeBackgroundRef.current?.();
          }
        } else if (g.name === 'fist') {
          if (fistHoldStartRef.current == null) {
            fistHoldStartRef.current = now;
          } else if (now - fistHoldStartRef.current > 1000) {
            reset();
            showFlash(RotateCcw, 'Reset');
            fistHoldStartRef.current = null;
          }
        }
        if (g.name !== 'fist') {
          fistHoldStartRef.current = null;
        }
      } else {
        // No right hand visible — drop any in-progress fist hold.
        fistHoldStartRef.current = null;
      }

      // ---- LEFT hand → second image (merge layer).
      if (left) {
        const g = left;
        if (g.name === 'pinch' && g.payload) {
          // pinch.t (0..1) maps directly to opacity 0..1.
          setSecondOpacity(g.payload.t);
        } else if (g.name === 'point' && g.payload) {
          // Same mirror compensation as the right-hand point.
          setSecondOpacity(Math.min(1, Math.max(0, 1 - g.payload.x)));
        } else if (g.name === 'two_fingers') {
          if (now - lastBlendCycleRef.current > 800) {
            lastBlendCycleRef.current = now;
            setSecondBlend((curr) => {
              const idx = BLEND_MODES.indexOf(curr);
              const next = BLEND_MODES[(idx + 1) % BLEND_MODES.length];
              toast(`Layer blend: ${next}`);
              showFlash(Layers, next);
              return next;
            });
          }
        } else if (g.name === 'thumbs_up') {
          if (now - lastLayerResetRef.current > 1000) {
            lastLayerResetRef.current = now;
            setSecondOpacity(0.6);
            setSecondBlend('normal');
            toast('Layer reset');
            showFlash(Sparkles, 'Layer reset');
          }
        } else if (g.name === 'fist') {
          if (leftFistHoldRef.current == null) {
            leftFistHoldRef.current = now;
          } else if (now - leftFistHoldRef.current > 1000) {
            if (secondSrc) {
              clearSecondImage();
              toast('Layer cleared');
              showFlash(Trash2, 'Layer cleared');
            }
            leftFistHoldRef.current = null;
          }
        }
        // three_fingers / four_fingers / rock_n_roll / shaka on left are intentional no-ops —
        // rotate/flip/BG-remove only make sense for the base image.
        if (g.name !== 'fist') {
          leftFistHoldRef.current = null;
        }
      } else {
        leftFistHoldRef.current = null;
      }
    },
    [reset, setActiveValue, cycleActive, cyclePreset, toast, showFlash, secondSrc]
  );

  const clearImage = () => {
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    setImgSrc(null);
    setImgMeta(null);
    reset();
  };

  const download = async () => {
    if (!imgSrc || !imageRef.current || !imgMeta) return;
    setExporting(true);
    try {
      const swap = rotation === 90 || rotation === 270;
      const w = swap ? imgMeta.height : imgMeta.width;
      const h = swap ? imgMeta.width : imgMeta.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.save();
      ctx.filter = buildFilterString(filters);
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(
        imageRef.current,
        -imgMeta.width / 2,
        -imgMeta.height / 2,
        imgMeta.width,
        imgMeta.height
      );
      ctx.restore();

      // Bake the second-image layer on top (no filter/rotation/flip applied —
      // matches the preview's mix-blend overlay). Scale it to fit inside the
      // canvas while preserving aspect ratio (object-contain semantics).
      if (secondSrc && secondImageRef.current && secondMeta) {
        ctx.save();
        ctx.globalAlpha = secondOpacity;
        ctx.globalCompositeOperation = toCompositeOp(secondBlend);
        const scale = Math.min(w / secondMeta.width, h / secondMeta.height);
        const dw = secondMeta.width * scale;
        const dh = secondMeta.height * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(secondImageRef.current, dx, dy, dw, dh);
        ctx.restore();
      }

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png', 0.95)
      );
      if (!blob) throw new Error('Export failed');
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const baseName = (imgMeta.name || 'image').replace(/\.[^.]+$/, '');
      a.href = url;
      a.download = `${baseName}-neyak.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Exported PNG to your downloads.', { type: 'success' });
    } catch (err) {
      toast(`Export failed: ${err.message}`, { type: 'warning' });
    } finally {
      setExporting(false);
    }
  };

  const removeBackground = async () => {
    if (!imgSrc || !imageRef.current || !imgMeta || removingBg) return;
    setRemovingBg(true);
    try {
      // Bake current edits (filters + rotation + flips) into a PNG data URL.
      const swap = rotation === 90 || rotation === 270;
      const w = swap ? imgMeta.height : imgMeta.width;
      const h = swap ? imgMeta.width : imgMeta.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.filter = buildFilterString(filters);
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(
        imageRef.current,
        -imgMeta.width / 2,
        -imgMeta.height / 2,
        imgMeta.width,
        imgMeta.height
      );
      const dataUrl = canvas.toDataURL('image/png');

      toast('Removing background — usually takes 5–20 seconds…');
      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const newUrl = URL.createObjectURL(blob);

      // Swap in the new image and clear edits (they're already baked in).
      const oldUrl = imgSrc;
      const newName = (imgMeta.name || 'image').replace(/\.[^.]+$/, '') + '-nobg.png';
      const probe = new Image();
      probe.onload = () => {
        setImgMeta({
          width: probe.naturalWidth,
          height: probe.naturalHeight,
          name: newName,
        });
      };
      probe.src = newUrl;

      setImgSrc(newUrl);
      setFilters(DEFAULT_FILTERS);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      toast('Background removed!', { type: 'success' });
    } catch (err) {
      toast(`Background removal failed: ${err.message}`, { type: 'warning' });
    } finally {
      setRemovingBg(false);
    }
  };

  // Keep the gesture-callable ref pointing at the freshest closure.
  useEffect(() => {
    removeBackgroundRef.current = removeBackground;
  });

  const applyStyle = async (preset) => {
    if (!imgSrc || !imageRef.current || !imgMeta || stylizing || removingBg) return;
    setStylizing(preset.id);
    try {
      let blob;
      let displayOpacity;
      let displayBlend;
      let sourceTag;

      // Bakes current CSS filters + rotation + flips onto a data URL so any
      // remote AI sees what the user sees, not the un-edited original.
      const bakeCurrentEdits = (mime = 'image/jpeg', quality = 0.9) => {
        const swap = rotation === 90 || rotation === 270;
        const w = swap ? imgMeta.height : imgMeta.width;
        const h = swap ? imgMeta.width : imgMeta.height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');
        ctx.filter = buildFilterString(filters);
        ctx.translate(w / 2, h / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(
          imageRef.current,
          -imgMeta.width / 2,
          -imgMeta.height / 2,
          imgMeta.width,
          imgMeta.height
        );
        return canvas.toDataURL(mime, quality);
      };

      const ANIMEGAN_STYLES = new Set(['ghibli', 'anime', 'sketch']);

      if (stylizeConfigured[preset.id]) {
        // Replicate path: bake current edits (filters + rotation + flips) so the
        // AI sees what the user sees, then POST to /api/stylize with the preset prompt.
        const swap = rotation === 90 || rotation === 270;
        const w = swap ? imgMeta.height : imgMeta.width;
        const h = swap ? imgMeta.width : imgMeta.height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');
        ctx.filter = buildFilterString(filters);
        ctx.translate(w / 2, h / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.drawImage(
          imageRef.current,
          -imgMeta.width / 2,
          -imgMeta.height / 2,
          imgMeta.width,
          imgMeta.height
        );
        const dataUrl = canvas.toDataURL('image/png');

        toast(`Applying ${preset.label} via Replicate — usually 10–30 seconds…`);
        const res = await fetch('/api/stylize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: dataUrl,
            prompt: preset.prompt,
            style: preset.id,
          }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }
        blob = await res.blob();
        // The AI result is itself the styled image — show it opaque on top by default.
        displayOpacity = 1;
        displayBlend = 'normal';
        sourceTag = 'ai';
      } else if (ANIMEGAN_STYLES.has(preset.id)) {
        // AnimeGAN v2 via Hugging Face Space (free, no auth). The GAN is
        // specifically trained for photo→Ghibli/Anime/Sketch. Composition is
        // preserved (GAN, not diffusion) and output actually looks like anime
        // art, not just filtered pixels. Spaces can be cold; on failure we
        // fall through to neural style transfer.
        try {
          const dataUrl = bakeCurrentEdits('image/jpeg', 0.9);
          toast(
            `Painting ${preset.label} via AnimeGAN on Hugging Face — usually 10–30 s…`
          );
          const res = await fetch('/api/animegan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl, style: preset.id }),
          });
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || `HTTP ${res.status}`);
          }
          const candidate = await res.blob();
          if (candidate.size < 1024) {
            throw new Error('Upstream returned an empty response.');
          }
          blob = candidate;
          displayOpacity = 1;
          displayBlend = 'normal';
          sourceTag = 'animegan';
        } catch (err) {
          console.warn('[applyStyle] AnimeGAN failed, falling back', err);
          toast(
            `AnimeGAN unavailable (${(err.message || '').slice(0, 60)}). Falling back to neural style…`,
            { type: 'warning' }
          );
        }
      }

      if (!blob && styleRefMap[preset.id]) {
        // Neural style transfer (TFJS) — paints the photo in the style of the
        // reference image. Real ML, but the silhouette is kept; for face
        // redraw they still need Replicate/AnimeGAN.
        try {
          if (!neuralReady()) {
            toast(
              `Loading neural model (~11 MB, one-time)… ${preset.label} will run after.`
            );
            await loadNeuralModel();
            setNeuralModelLoaded(true);
          }
          const styleImg = await loadStyleReferenceImage(preset.id);
          if (!styleImg) throw new Error('Style reference image missing.');
          toast(`Painting ${preset.label} via neural style transfer…`);
          blob = await applyNeuralStyle(imageRef.current, styleImg, {
            cacheKey: preset.id,
          });
          displayOpacity = 1;
          displayBlend = 'normal';
          sourceTag = 'neural';
        } catch (err) {
          console.warn('[applyStyle] neural failed, falling back', err);
        }
      }

      if (!blob) {
        // Final fallback: classical CV pipeline (bilateral + palette +
        // outlines). Always succeeds — stylizes existing pixels rather than
        // redrawing the subject.
        blob = await bakeStyle(
          preset.id,
          imageRef.current,
          imgMeta.width,
          imgMeta.height,
          styleIntensity / 100
        );
        displayOpacity = 1;
        displayBlend = 'normal';
        sourceTag = 'filter';
        toast(
          `${preset.label} stylized locally at ${styleIntensity}% intensity — for character regeneration, set REPLICATE_STYLE_MODEL in .env.`
        );
      }

      const baseName = (imgMeta.name || 'image').replace(/\.[^.]+$/, '');
      const newName = `${baseName}-${preset.id}-${sourceTag}.png`;
      const newUrl = URL.createObjectURL(blob);

      const probe = new Image();
      probe.onload = () => {
        setSecondMeta({
          width: probe.naturalWidth,
          height: probe.naturalHeight,
          name: newName,
        });
      };
      probe.src = newUrl;

      // Replace any existing merge layer.
      if (secondSrc) URL.revokeObjectURL(secondSrc);
      setSecondSrc(newUrl);
      setSecondOpacity(displayOpacity);
      setSecondBlend(displayBlend);

      toast(`${preset.label} layered on as merge image.`, { type: 'success' });
    } catch (err) {
      toast(`${preset.label} failed: ${err.message}`, { type: 'warning' });
    } finally {
      setStylizing(null);
    }
  };

  const filterCss = useMemo(() => buildFilterString(filters), [filters]);
  const transformCss = useMemo(
    () =>
      `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${zoom})`,
    [rotation, flipH, flipV, zoom]
  );

  return (
    <>
      <header className="pt-32 pb-6 container-page">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-wider uppercase rounded-full glass text-neon-cyan border-neon-cyan/30">
              Editor · early preview
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold font-display leading-tight">
              Upload &amp; <GradientText>edit instantly</GradientText>
            </h1>
            <p className="mt-3 text-slate-300/90 max-w-xl">
              Drop any image, tweak with filters, rotate, flip, and export — all
              in your browser. Gesture control and AI tools arrive in beta.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <NeonButton size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Open file
            </NeonButton>
            {imgSrc && (
              <>
                <NeonButton
                  size="sm"
                  variant="ghost"
                  onClick={() => secondInputRef.current?.click()}
                  title="Merge a second image on top"
                >
                  <Layers size={16} /> {secondSrc ? 'Replace 2nd' : 'Add 2nd image'}
                </NeonButton>
                <NeonButton size="sm" variant="ghost" onClick={reset}>
                  <RotateCcw size={16} /> Reset edits
                </NeonButton>
                <NeonButton
                  size="sm"
                  variant="ghost"
                  onClick={removeBackground}
                  disabled={removingBg}
                  title="AI background removal via Replicate"
                >
                  {removingBg ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Removing…
                    </>
                  ) : (
                    <>
                      <Scissors size={16} /> Remove BG
                    </>
                  )}
                </NeonButton>
                <NeonButton size="sm" onClick={download} disabled={exporting}>
                  <Download size={16} /> {exporting ? 'Exporting…' : 'Download PNG'}
                </NeonButton>
              </>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onFileChange}
        />
        <input
          ref={secondInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onSecondFileChange}
        />
        <input
          ref={styleRefInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onStyleRefFileChange}
        />
      </header>

      <section className="container-page pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Canvas / drop area */}
          <div className="lg:col-span-8">
            <GlassCard hover={false} className="p-4 sm:p-6">
              {imgSrc ? (
                <div className="space-y-4">
                  <div className="relative w-full min-h-[320px] sm:min-h-[480px] checker rounded-xl overflow-hidden flex items-center justify-center p-4">
                    <div className="relative inline-block max-w-full max-h-[68vh] isolate">
                      <img
                        ref={imageRef}
                        src={imgSrc}
                        alt="Edited preview"
                        crossOrigin="anonymous"
                        className="block max-w-full max-h-[68vh] object-contain transition-all"
                        style={{
                          filter: filterCss,
                          transform: transformCss,
                        }}
                      />
                      {secondSrc && (
                        <img
                          ref={secondImageRef}
                          src={secondSrc}
                          alt="Second layer"
                          crossOrigin="anonymous"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                          style={{
                            opacity: secondOpacity,
                            mixBlendMode: secondBlend,
                          }}
                        />
                      )}
                    </div>
                    {/* Active-control HUD: always-visible chip showing which
                        slider gestures currently target, plus its live value. */}
                    {(() => {
                      const s = SLIDERS.find((x) => x.key === activeAdjustment);
                      if (!s) return null;
                      return (
                        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full glass-strong text-xs flex items-center gap-2 shadow-glow-cyan/40">
                          <span className="uppercase tracking-wider text-slate-400">Active</span>
                          <span className="text-neon-cyan font-semibold">{s.label}</span>
                          <span className="text-white font-mono">
                            {filters[s.key]}
                            {s.unit}
                          </span>
                        </div>
                      );
                    })()}
                    {zoom !== 1 && (
                      <button
                        type="button"
                        onClick={() => setZoom(1)}
                        title="Reset zoom"
                        className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full glass-strong text-xs flex items-center gap-1.5 hover:bg-white/15 transition-colors"
                      >
                        <span className="text-sky-300">🔍</span>
                        <span className="text-white font-mono">
                          {Math.round(zoom * 100)}%
                        </span>
                      </button>
                    )}
                    <ActionFlash action={flashAction} />
                  </div>

                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      <ToolButton onClick={rotateCW} label="Rotate 90°">
                        <RotateCw size={16} />
                      </ToolButton>
                      <ToolButton
                        onClick={flipHorizontal}
                        label="Flip horizontal"
                        active={flipH}
                      >
                        <FlipHorizontal size={16} />
                      </ToolButton>
                      <ToolButton
                        onClick={flipVertical}
                        label="Flip vertical"
                        active={flipV}
                      >
                        <FlipVertical size={16} />
                      </ToolButton>
                      <ToolButton onClick={clearImage} label="Remove image" danger>
                        <Trash2 size={16} />
                      </ToolButton>
                    </div>
                    <div className="text-xs text-slate-400">
                      {imgMeta?.width} × {imgMeta?.height} · {imgMeta?.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`relative min-h-[60vh] rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center px-6 cursor-pointer transition-all ${
                    isDragging
                      ? 'border-neon-cyan bg-neon-cyan/10 shadow-glow-cyan'
                      : 'border-white/15 hover:border-neon-cyan/60 hover:bg-white/5'
                  }`}
                >
                  <motion.div
                    animate={{ y: isDragging ? -6 : 0 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    className="w-16 h-16 rounded-2xl bg-grad-neon flex items-center justify-center shadow-glow mb-5"
                  >
                    <ImageIcon size={28} className="text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-display font-semibold">
                    Drop an image to start editing
                  </h2>
                  <p className="mt-2 text-sm text-slate-400 max-w-sm">
                    JPG, PNG, or WEBP up to {MAX_FILE_MB} MB. Files stay on your
                    device — nothing is uploaded.
                  </p>
                  <div className="mt-5 flex flex-col sm:flex-row gap-2 items-center">
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-grad-neon text-white text-sm font-semibold shadow-glow">
                      <Upload size={16} /> Choose file
                    </span>
                    <span className="text-xs text-slate-500">or</span>
                    <Link
                      to="/templates"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm font-semibold text-white border border-white/15 hover:bg-white/10 transition-colors"
                    >
                      <LayoutTemplate size={16} /> Browse templates
                    </Link>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Controls */}
          <aside className="lg:col-span-4 space-y-4">
            <GlassCard hover={false}>
              <GestureCamera
                onGesture={handleGesture}
                activeAdjustment={activeAdjustment}
                activeValue={filters[activeAdjustment]}
                activeUnit={SLIDERS.find((s) => s.key === activeAdjustment)?.unit ?? ''}
              />
            </GlassCard>

            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Adjustments</h3>
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Reset
                </button>
              </div>
              <div className="space-y-3">
                {SLIDERS.map((s) => (
                  <SliderRow
                    key={s.key}
                    label={s.label}
                    value={filters[s.key]}
                    min={s.min}
                    max={s.max}
                    unit={s.unit}
                    active={activeAdjustment === s.key}
                    onActivate={() => setActiveAdjustment(s.key)}
                    onChange={(v) => updateFilter(s.key, v)}
                  />
                ))}
              </div>
            </GlassCard>

            <GlassCard hover={false}>
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-neon-pink" /> Presets
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2 py-2 rounded-lg text-xs font-medium glass text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard hover={false}>
              <h3 className="font-display font-semibold mb-1 flex items-center gap-2">
                <Wand2 size={16} className="text-neon-purple" /> AI styles
              </h3>
              <p className="text-[11px] text-slate-400 mb-3 leading-snug">
                {anyStyleConfigured
                  ? `Replicate ready for ${
                      Object.entries(stylizeConfigured)
                        .filter(([, v]) => v)
                        .map(([k]) => k)
                        .join(', ')
                    } · 10–30 s · regenerates as a character.`
                  : 'Click + on a button to upload a style image — runs real neural style transfer in your browser. Otherwise uses local stylization.'}
              </p>
              <div className="mb-3">
                <SliderRow
                  label="Intensity (local only)"
                  value={styleIntensity}
                  min={10}
                  max={100}
                  unit="%"
                  active={false}
                  onActivate={() => {}}
                  onChange={(v) => setStyleIntensity(Number(v))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_PRESETS.map((preset) => {
                  const ai = stylizeConfigured[preset.id];
                  const hasRef = styleRefMap[preset.id];
                  const neural = !ai && hasRef;
                  const tooltip = ai
                    ? 'AI character regen via Replicate'
                    : neural
                    ? 'Neural style transfer (TFJS) using your uploaded style image'
                    : 'Local stylization · click + to enable neural transfer';
                  return (
                    <div key={preset.id} className="relative">
                      <button
                        type="button"
                        onClick={() => applyStyle(preset)}
                        disabled={!imgSrc || Boolean(stylizing) || removingBg}
                        title={tooltip}
                        className="relative w-full pl-6 pr-7 py-2 rounded-lg text-xs font-medium glass text-slate-200 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 justify-center"
                      >
                        {stylizing === preset.id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Applying…
                          </>
                        ) : (
                          <>
                            <span className="text-base leading-none">{preset.emoji}</span>
                            {preset.label}
                          </>
                        )}
                        {ai && (
                          <span className="absolute top-0.5 right-1 text-[8px] font-bold tracking-wider text-neon-cyan">
                            AI
                          </span>
                        )}
                        {neural && (
                          <span className="absolute top-0.5 right-1 text-[8px] font-bold tracking-wider text-neon-pink">
                            N
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openStyleRefPicker(preset.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (hasRef) clearStyleRefFor(preset.id);
                        }}
                        disabled={Boolean(stylizing)}
                        title={
                          hasRef
                            ? 'Replace style image (right-click to clear)'
                            : 'Upload a style image to enable neural transfer'
                        }
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded text-[10px] font-bold leading-none flex items-center justify-center transition-colors disabled:opacity-50 ${
                          hasRef
                            ? 'text-neon-pink hover:bg-white/10'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {hasRef ? '✓' : '+'}
                      </button>
                    </div>
                  );
                })}
              </div>
              {!imgSrc && (
                <p className="mt-2 text-[11px] text-slate-500">Load a base image first.</p>
              )}
            </GlassCard>

            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Layers size={16} className="text-neon-cyan" /> Merge layer
                </h3>
                {secondSrc && (
                  <button
                    type="button"
                    onClick={clearSecondImage}
                    className="text-[11px] text-rose-300 hover:text-rose-200 inline-flex items-center gap-1"
                  >
                    <X size={12} /> Remove
                  </button>
                )}
              </div>
              {secondSrc ? (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400 truncate">
                    {secondMeta?.name} · {secondMeta?.width}×{secondMeta?.height}
                  </div>
                  <SliderRow
                    label="Opacity"
                    value={Math.round(secondOpacity * 100)}
                    min={0}
                    max={100}
                    unit="%"
                    active={false}
                    onActivate={() => {}}
                    onChange={(v) => setSecondOpacity(Number(v) / 100)}
                  />
                  <label className="block">
                    <span className="block text-xs text-slate-300 mb-1.5">Blend mode</span>
                    <select
                      value={secondBlend}
                      onChange={(e) => setSecondBlend(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/40"
                    >
                      {BLEND_MODES.map((m) => (
                        <option key={m} value={m} className="bg-bg-900">
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <div className="text-sm text-slate-400">
                  <p>Layer a second image on top of the canvas — useful for compositing, double exposure, or logo overlays.</p>
                  <button
                    type="button"
                    onClick={() => secondInputRef.current?.click()}
                    disabled={!imgSrc}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-grad-neon text-white text-sm font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Layers size={14} /> Choose second image
                  </button>
                  {!imgSrc && (
                    <p className="mt-2 text-[11px] text-slate-500">
                      Load a base image first.
                    </p>
                  )}
                </div>
              )}
            </GlassCard>
          </aside>
        </div>
      </section>
    </>
  );
}

function SliderRow({ label, value, min, max, unit, active, onActivate, onChange }) {
  return (
    <div
      className={`rounded-lg p-2 -mx-2 transition-colors ${
        active ? 'bg-neon-cyan/10 ring-1 ring-neon-cyan/40' : ''
      }`}
    >
      <div className="flex justify-between items-center text-xs mb-1.5">
        <button
          type="button"
          onClick={onActivate}
          className={`text-left transition-colors ${
            active ? 'text-neon-cyan font-semibold' : 'text-slate-300 hover:text-white'
          }`}
        >
          {label}
          {active && (
            <span className="ml-2 px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded bg-neon-cyan/20 text-neon-cyan font-bold">
              Active
            </span>
          )}
        </button>
        <span className="text-slate-400 font-mono">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onActivate}
        className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-neon-cyan"
        aria-label={label}
      />
    </div>
  );
}

function ToolButton({ children, onClick, label, active, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
        danger
          ? 'glass text-rose-300 hover:bg-rose-500/20 hover:text-rose-200'
          : active
          ? 'bg-grad-neon text-white shadow-glow-cyan'
          : 'glass text-slate-200 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
