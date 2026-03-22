# Detail Page Header — Portrait Zone Redesign

**Date:** 2026-03-22
**Status:** Approved
**Affects:** `client/src/components/layouts/DetailPageHeader.tsx`, `client/src/components/MediaThumbnail.tsx`

---

## Problem Statement

The detail page header has three distinct issues with the entity image display:

1. **Image display:** `objectFit: contain` with `objectPosition: center top` on a full-bleed container renders the image as a small contained box, especially for portrait-oriented images. The image feels undersized and disconnected from the header.

2. **Cycling controls:** The dot strip pill (`controlsPosition="right"`) is positioned in the bottom-right corner of the full-bleed container with no directional affordance. There are no prev/next arrows and the controls feel disconnected from the image.

3. **Lightbox dead zone:** The `onClick → open modal` handler is on the full-bleed `MediaThumbnail` container (`inset: 0`), but the content column covers the left 65% and `cursor: zoom-in` spans the entire header. The click zone does not match where the image is actually visible, creating a large ambiguous area to the right of the text column where users can't tell what clicking will do.

---

## Design Decisions

### 1. Portrait Zone — Explicit Bounded Area

The portrait image is moved from a full-bleed container to a **dedicated portrait zone** that occupies the right 58% of the header:

```
position: absolute
left: 42%
right: 0
top: 0
bottom: 0
overflow: hidden
```

This zone is the **single positional anchor** for all portrait-related elements: the image, the cycling controls, and the lightbox click handler. There is no longer a separate full-bleed click zone.

### 2. Image Rendering — Cover at 15%

Within the portrait zone, the image uses:

```
objectFit: cover
objectPosition: center 15%
```

- `cover` ensures the image fills the zone completely — large, cinematic, never a small box.
- `center 15%` positions the crop window slightly below the very top, which reliably frames the face/upper body for manga face-reaction panels (the most common image type).
- The full-bleed **blurred background layer** (`showBlurredBackground`) remains on `MediaThumbnail` and continues to span `inset: 0` on the header for atmospheric fill. This is independent of the portrait zone.

### 3. Lightbox Click Affordance

- `cursor: zoom-in` is scoped to the **portrait zone only**, not the full header.
- No icon overlay — the cursor change is sufficient affordance.
- Clicking anywhere within the portrait zone opens the lightbox modal.
- The dead zone is eliminated: the click target matches exactly where the image is visible.

### 4. Cycling Controls — Hover Chevrons + Centred Dots

**Prev/next navigation:**
- Two half-width transparent click zones cover the portrait zone (left half = prev, right half = next).
- On `portrait-zone:hover`, both zones fade in showing a circular chevron button (`‹` / `›`).
- Chevrons are 32×32px, dark frosted background, white icon — appear on hover, hidden otherwise.
- `e.stopPropagation()` on chevron clicks to prevent lightbox triggering.

**Dot strip:**
- Positioned at the bottom of the portrait zone, horizontally centred.
- Each dot has a `5px` padding hit target (larger than before).
- Dot strip is a child of the portrait zone so it stays aligned regardless of screen width.
- Count badge (`1 / N`) remains in the pill, separated by a vertical rule.

---

## Architecture

### `DetailPageHeader.tsx`

The `MediaThumbnail` component is restructured as follows:

```
DetailPageHeader
├── Atmospheric background (radial gradient + dot texture)          z-index: 0
├── MediaThumbnail [showBlurredBackground, inset: 0]                z-index: 1
│   └── Blurred bg layer only — full bleed, no click handler
├── Portrait zone wrapper [left: 42%, right: 0]                     z-index: 2
│   ├── MediaThumbnail image [cover, center 15%]
│   ├── Prev half-zone [cursor: pointer, hover chevron]
│   ├── Next half-zone [cursor: pointer, hover chevron]
│   ├── Dot strip [bottom: 10px, centred]
│   └── onClick → open lightbox [cursor: zoom-in]
├── Left-edge fade overlay [width: 65%, pointer-events: none]       z-index: 3
├── Bottom fade [pointer-events: none]                              z-index: 3
└── Content column [left: 0, width: 65%, pointer-events: none]     z-index: 5
    └── Inner box [pointer-events: auto] — text, stats, tags
```

**Key change:** The portrait zone wrapper in `DetailPageHeader` owns the click handler and cursor, not `MediaThumbnail`. `MediaThumbnail` receives `allowFullView={false}` and `controlsPosition="right"` is replaced by a new prop or the controls are lifted into `DetailPageHeader`.

### `MediaThumbnail.tsx` — Option A (preferred): lift controls

The cleanest implementation lifts the portrait zone, click handler, and cycling controls **out of `MediaThumbnail`** and into `DetailPageHeader` for the hero case. `MediaThumbnail` in hero mode renders only the image and blurred background layer. `DetailPageHeader` manages:

- The portrait zone bounding box
- The `onClick` → lightbox state
- The prev/next chevron zones
- The dot strip

This eliminates the `controlsPosition` prop complexity and makes the hero header fully self-contained.

### `MediaThumbnail.tsx` — Option B (lower risk): new props

If lifting controls is too invasive, add props to `MediaThumbnail`:

- `heroPortraitZone?: boolean` — when true, wraps image + controls in a bounded zone (`left: 42%; right: 0`) rather than `inset: 0`
- `objectPosition` already exists — pass `"center 15%"`
- Keep existing `controlsPosition="right"` for cycling controls scoped to the zone

Option A is preferred for clean separation. Option B is acceptable if the diff needs to stay small.

---

## Behaviour Details

| Scenario | Behaviour |
|---|---|
| Single image, no cycling | Portrait zone still renders, no dot strip, no chevrons |
| Multiple images | Dot strip shown, chevrons appear on zone hover |
| No image available | Portrait zone hidden, no-image fallback atmospheric bg on right side |
| Spoiler-gated image | Spoiler overlay covers portrait zone |
| Mobile | Chevron hit zones remain (touch targets), dot strip centred at bottom |

---

## Out of Scope

- Touch swipe gesture support (swipe left/right to cycle) — not included in this change
- Changes to the lightbox modal UI
- Changes to the `MediaThumbnail` component in non-hero contexts (card grids, inline, etc.)
- Per-image `objectPosition` overrides (admin-settable focal point)
