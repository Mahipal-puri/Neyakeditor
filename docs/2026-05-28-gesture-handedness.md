# Feature: Per-hand gesture routing — right hand → main image, left hand → merge layer

**Date:** 2026-05-28
**Kind:** Feature
**Area:** Gesture camera + editor

## Summary

The camera now reads MediaPipe's `handednesses` alongside `landmarks` and routes per-hand gestures to different targets. The right hand drives the main image (existing behaviour, unchanged). The left hand drives the second / merge layer with a parallel gesture set: pinch / point control opacity, peace cycles the blend mode, thumbs resets opacity to 60% and blend to `normal`, and a 1-second fist clears the layer. Two-hand zoom still works but only fires when both hands are at rest (palm, fist, unknown, none) so a single-hand pinch never gets overridden by zoom.

The camera overlay was updated to make the routing visible: each hand's skeleton is coloured by side (cyan for right, pink for left), and a small `R` / `L` badge sits next to the per-hand emoji at the wrist. The help text under the camera card was prefixed with "**Right hand** ➜ main image · **Left hand** ➜ merge layer".

## Files changed

- [client/src/components/sections/GestureCamera.jsx](../client/src/components/sections/GestureCamera.jsx) — `tick()` now extracts handedness and emits `{ left, right, twoHand }`; `drawOverlay()` colours skeletons by side and draws L/R badges; help-text header added.
- [client/src/pages/Editor.jsx](../client/src/pages/Editor.jsx) — `handleGesture` refactored to consume the new payload shape; new debounce refs `lastBlendCycleRef`, `lastLayerResetRef`, `leftFistHoldRef` for the left-hand branch.

No change to `client/src/lib/gestures.js` — the per-hand classifier is unchanged.

## Behavior

- One right hand visible → all existing main-image gestures (pinch slider, peace cycles slider, three fingers rotate, four fingers flip H, rock 'n' roll flip V, thumbs preset, shaka remove-bg, fist held 1 s resets).
- One left hand visible → merge-layer gestures only (pinch / point opacity, peace cycles blend, thumbs resets layer, fist 1 s clears the layer).
- Both hands at rest → two-hand zoom (distance maps to 50% – 300%).
- Either hand mid-gesture while the other is up → zoom suppressed, each hand drives its own image independently.
- Three / four / rock 'n' roll / shaka on the left hand are intentional no-ops (those actions have no second-image analogue).

If MediaPipe labels handedness swapped on a given camera, the one-line fix lives in `GestureCamera.jsx` `tick()` — invert the side mapping. Out of scope here.

## Verification

1. Open `/editor`, upload a base image and a merge image.
2. Enable the camera.
3. Right hand only → cyan skeleton + **R** badge; pinch moves the active slider.
4. Left hand only → pink skeleton + **L** badge; pinch moves merge-layer opacity from 0% → 100%; peace ✌️ cycles blend modes with toast confirmation; thumbs 👍 resets opacity to 60% and blend to `normal`; closed fist for ~1 s clears the merge layer.
5. Both hands together — both palms or both fists fires zoom (dashed line + percentage); either hand pinching/peace suppresses zoom and each drives its own image.

---

← Back to project spec: [markdown.md](../markdown.md)
