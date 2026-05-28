# Fix: Merge-layer second image now renders

**Date:** 2026-05-28
**Kind:** Bug fix
**Area:** Editor canvas

## Summary

Uploading a base image worked, but adding a "second image" (merge layer) only showed the success toast — the layer was invisible. Two structural issues in the canvas JSX combined to hide it: the first image's inline `transform` created a stacking context that competed with the second image's `position: absolute`, and the two images had mismatched bounding boxes (first sized to its own aspect via flex, second stretched to fill the much larger parent).

The canvas was restructured so both images live inside a shared `relative inline-block isolate` wrapper sized by the first image, and the second image now uses `absolute inset-0 w-full h-full z-10` so it occupies the exact same rectangle as the base. `isolate` (`isolation: isolate`) scopes future `mix-blend-mode` blending to the two images only, instead of bleeding into the page checker background.

## Files changed

- [client/src/pages/Editor.jsx](../client/src/pages/Editor.jsx) — canvas JSX around the `imageRef` / `secondImageRef` images (≈ 15 lines restructured)

## Behavior

- Loading a second image immediately overlays it on the first at 60% opacity (the default).
- Opacity slider, blend-mode dropdown, and Remove button in the Merge layer card all act on the visible overlay in real time.
- HUD overlays (active-control chip, zoom chip, ActionFlash) remain at the outer parent and continue to cover the full canvas including the checker margin.
- Export pipeline untouched; downloaded PNG matches the on-screen composite.

## Verification

1. Open `/editor`, upload a base photo.
2. Click "Add 2nd image" and upload a regular JPG/PNG.
3. Confirm the second image appears as a 60%-opacity overlay matching the first image's box.
4. Move the Opacity slider — overlay fades in/out smoothly.
5. Switch Blend mode through `multiply`, `screen`, `overlay` — each shifts the composite without bleeding to the page background.
6. Click Remove on the merge layer — second image clears, first stays.
7. Download PNG — exported file matches the preview.

---

← Back to project spec: [markdown.md](../markdown.md)
