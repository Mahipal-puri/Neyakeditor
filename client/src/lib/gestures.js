import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Both the WASM bundle and the hand-landmarker model are served from the
// dev server (and baked into dist/ at build time) by the `mediapipeWasm`
// Vite plugin in vite.config.js. This guarantees the SDK/WASM versions
// match and removes the cold-start Google CDN download.
const WASM_URL = '/mediapipe-wasm';
const MODEL_URL = '/mediapipe-model/hand_landmarker.task';

// Landmark indices (MediaPipe Hands)
export const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
};

let _loader = null;

function tryCreate(vision, delegate) {
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    numHands: 2,
    runningMode: 'VIDEO',
  });
}

export async function loadHandLandmarker() {
  if (_loader) return _loader;
  _loader = (async () => {
    console.info('[gestures] loading WASM fileset…');
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    try {
      console.info('[gestures] creating landmarker (GPU)…');
      const lm = await tryCreate(vision, 'GPU');
      console.info('[gestures] landmarker ready (GPU)');
      return lm;
    } catch (err) {
      console.warn('[gestures] GPU delegate failed, falling back to CPU', err);
      const lm = await tryCreate(vision, 'CPU');
      console.info('[gestures] landmarker ready (CPU)');
      return lm;
    }
  })();
  // Allow retry after failure
  _loader.catch((err) => {
    console.error('[gestures] landmarker init failed', err);
    _loader = null;
  });
  return _loader;
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function fingerExtended(landmarks, tip, pip) {
  return landmarks[tip].y < landmarks[pip].y - 0.02;
}

function thumbExtended(landmarks) {
  const tipToWrist = dist(landmarks[LM.THUMB_TIP], landmarks[LM.WRIST]);
  const ipToWrist = dist(landmarks[LM.THUMB_IP], landmarks[LM.WRIST]);
  return tipToWrist > ipToWrist * 1.1;
}

export function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return { name: 'none' };

  const thumb = thumbExtended(landmarks);
  const index = fingerExtended(landmarks, LM.INDEX_TIP, LM.INDEX_PIP);
  const middle = fingerExtended(landmarks, LM.MIDDLE_TIP, LM.MIDDLE_PIP);
  const ring = fingerExtended(landmarks, LM.RING_TIP, LM.RING_PIP);
  const pinky = fingerExtended(landmarks, LM.PINKY_TIP, LM.PINKY_PIP);

  const pinchDistance = dist(landmarks[LM.THUMB_TIP], landmarks[LM.INDEX_TIP]);
  const isPinching = pinchDistance < 0.06 && !middle && !ring && !pinky;

  if (isPinching) {
    const t = Math.min(1, Math.max(0, (pinchDistance - 0.02) / 0.16));
    return { name: 'pinch', payload: { t, pinchDistance } };
  }
  // Thumbs up: only thumb extended
  if (thumb && !index && !middle && !ring && !pinky) {
    return { name: 'thumbs_up' };
  }
  // Shaka (call me): thumb + pinky extended, others curled
  if (thumb && !index && !middle && !ring && pinky) {
    return { name: 'shaka' };
  }
  // Rock 'n' roll: index + pinky extended, middle + ring curled (thumb either)
  if (index && !middle && !ring && pinky) {
    return { name: 'rock_n_roll' };
  }
  // Four fingers: index + middle + ring + pinky, thumb tucked
  if (!thumb && index && middle && ring && pinky) {
    return { name: 'four_fingers' };
  }
  // Three fingers: index + middle + ring up, pinky down
  if (index && middle && ring && !pinky) {
    return { name: 'three_fingers' };
  }
  if (index && middle && !ring && !pinky) return { name: 'two_fingers' };
  if (index && !middle && !ring && !pinky) {
    const x = Math.min(1, Math.max(0, landmarks[LM.INDEX_TIP].x));
    return { name: 'point', payload: { x } };
  }
  if (thumb && index && middle && ring && pinky) return { name: 'palm' };
  if (!index && !middle && !ring && !pinky) return { name: 'fist' };
  return { name: 'unknown' };
}

/**
 * Two-handed gesture detection.
 * Returns `{ name: 'two_hand_zoom', payload: { distance } }` when 2+ hands
 * are present, else `{ name: 'none' }`. The caller maps the distance to
 * whatever continuous control they want (zoom, in our case).
 */
export function classifyTwoHandedGesture(hands) {
  if (!hands || hands.length < 2) return { name: 'none' };
  const center = (h) => {
    const w = h[LM.WRIST];
    const i = h[LM.INDEX_MCP];
    const p = h[LM.PINKY_MCP];
    return { x: (w.x + i.x + p.x) / 3, y: (w.y + i.y + p.y) / 3 };
  };
  const c0 = center(hands[0]);
  const c1 = center(hands[1]);
  const dx = c0.x - c1.x;
  const dy = c0.y - c1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return { name: 'two_hand_zoom', payload: { distance, c0, c1 } };
}

/**
 * Emoji used to label each detected gesture in the camera overlay.
 * Kept in this module so a future custom-gesture pack can extend it.
 */
export const GESTURE_EMOJI = {
  pinch: '🤏',
  point: '☝️',
  two_fingers: '✌️',
  three_fingers: '🖖',
  four_fingers: '✋',
  thumbs_up: '👍',
  shaka: '🤙',
  rock_n_roll: '🤘',
  palm: '🖐️',
  fist: '✊',
  two_hand_zoom: '🔍',
};

export const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];
