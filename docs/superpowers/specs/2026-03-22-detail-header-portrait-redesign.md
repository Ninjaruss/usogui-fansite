# Detail Page Header — Portrait Zone Redesign

**Date:** 2026-03-22
**Status:** Approved
**Affects:** `client/src/components/layouts/DetailPageHeader.tsx`, `client/src/components/MediaThumbnail.tsx`

---

## Problem Statement

The detail page header has three distinct issues with the entity image display:

1. **Image display:** `objectFit: contain` with `objectPosition: center top` on a full-bleed container renders the image as a small contained box, especially for portrait-oriented images. The image feels undersized and disconnected from the header.

2. **Cycling controls:** The dot strip pill (`controlsPosition="right"`) is positioned in the bottom-right corner of the full-bleed container with no directional affordance. There are no prev/next arrows and the controls feel disconnected from the image.

3. **Lightbox dead zone:** The `onClick → open modal` handler is on the full-bleed `MediaThumbnail` container (`inset: 0`), but `cursor: zoom-in` spans the entire header. The click zone does not match where the image is actually visible, creating a large ambiguous dead zone to the right of the text column.

---

## Design Decisions

### 1. Portrait Zone — Explicit Bounded Area

The portrait image is moved from a full-bleed container to a **dedicated portrait zone** in `DetailPageHeader` that occupies the right 58% of the header:

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
- The full-bleed **blurred background layer** remains on a separate `MediaThumbnail` instance spanning `inset: 0` on the header for atmospheric fill. This instance renders **only** the blur layer — it must receive `allowFullView={false}` so it has no click handler or cursor change.

### 3. Lightbox Click Affordance

- `cursor: zoom-in` is scoped to the **portrait zone only**, not the full header.
- No icon overlay — the cursor change is sufficient affordance.
- Clicking anywhere within the portrait zone opens the lightbox modal.
- The dead zone is eliminated: the click target matches exactly where the image is visible.

### 4. Cycling Controls — Hover Chevrons + Centred Dots

**Prev/next navigation:**
- Two half-width transparent `div`s cover the portrait zone (left half = prev, right half = next).
- Chevrons fade in/out via React `useState(isPortraitHovered)` toggled by `onMouseEnter`/`onMouseLeave` on the portrait zone wrapper. This matches the existing pattern used throughout `DetailPageHeader` and `MediaThumbnail` (inline styles + React state, no CSS class hover selectors).
- Chevrons are 32×32px, dark frosted background (`rgba(0,0,0,0.58)`), white icon — visible when hovered, hidden otherwise (`opacity: 0` / `opacity: 1`).
- On mobile (touch devices), chevrons are **always visible** (`opacity: 1`, not conditioned on hover state) since `:hover` is unavailable on touch. Use `useMediaQuery('(max-width: 768px)')` to detect mobile — already available in `MediaThumbnail`.
- `e.stopPropagation()` on each chevron half-zone click to prevent lightbox triggering.

**Dot strip:**
- Positioned at the bottom of the portrait zone (`bottom: 10px`), horizontally centred (`left: 0; right: 0; display: flex; justify-content: center`).
- Each dot has a `5px` padding hit target.
- Dot strip is a child of the portrait zone so it stays aligned regardless of screen width.
- Count badge (`1 / N`) remains in the pill, separated by a vertical rule.
- The dot strip pill sits **above** any drop-shadow on the portrait zone — `z-index` must be set explicitly on the pill so it is not obscured by box shadows from other layers.

---

## Architecture — Option A (chosen)

Controls, click handler, and the portrait zone are **lifted out of `MediaThumbnail`** and implemented directly in `DetailPageHeader`. This is the chosen approach. Option B (new props on `MediaThumbnail`) is not used.

### Component structure

```
DetailPageHeader
├── Atmospheric background (radial gradient + dot texture)          z-index: 0
├── MediaThumbnail [blur-only instance]                             z-index: 1
│   props: showBlurredBackground=true, allowFullView=false,
│           allowCycling=false, style={position:absolute, inset:0}
│   Renders: blurred full-bleed bg image only. No click handler.
│            No cycling controls. No cursor change.
├── Portrait zone wrapper [left: 42%, right: 0, z-index: 2]
│   state: isHovered (bool), currentIndex (number), allMedia (MediaItem[])
│   ├── Main image (Next.js <Image> or <img>, fill, objectFit:cover, objectPosition:center 15%)
│   ├── Prev half-zone [left:0, width:50%, cursor:pointer]
│   │   onClick: cycle to previous image, e.stopPropagation()
│   │   child: chevron button, opacity toggled by isHovered (always 1 on mobile)
│   ├── Next half-zone [right:0, width:50%, cursor:pointer]
│   │   onClick: cycle to next image, e.stopPropagation()
│   │   child: chevron button, opacity toggled by isHovered (always 1 on mobile)
│   ├── Dot strip [bottom:10px, centred, z-index:15]
│   │   Each dot: clickable, 5px padding hit target
│   │   Active dot: larger (13px), white, box-shadow ring
│   │   Inactive dot: smaller (8px), rgba(255,255,255,0.38)
│   │   Count badge: "N / Total" separated by vertical rule
│   └── onClick (on zone wrapper): open lightbox modal, cursor: zoom-in
├── Lightbox modal                                                  (portal)
│   Managed by DetailPageHeader state (isModalOpen, currentIndex, allMedia)
│   Reuses the same modal UI pattern currently in MediaThumbnail
│   (prev/next in modal, dot indicators, description, chapter badge)
├── Left-edge fade overlay [width: 60%, pointer-events: none]       z-index: 3
├── Bottom fade [pointer-events: none]                              z-index: 3
└── Content column [left: 0, width: 65%, pointer-events: none]     z-index: 5
    └── Inner box [pointer-events: auto] — text, stats, tags
```

### Media data ownership

`DetailPageHeader` needs access to the entity's media list to drive the portrait zone and the lightbox. Two approaches are acceptable:

1. **Preferred:** Add an `initialMedia?: MediaItem[]` prop to `DetailPageHeader`. The parent page passes pre-fetched media (already done for `MediaThumbnail` via `initialMedia`). `DetailPageHeader` manages `currentIndex` and `allMedia` state directly.

2. **Fallback:** Fetch media inside `DetailPageHeader` using the same `api.getEntityDisplayMediaForCycling()` call currently in `MediaThumbnail`, scoped to the hero context only.

The blur-only `MediaThumbnail` instance still receives `entityType`, `entityId`, and its own `initialMedia` so its blur layer stays in sync with the currently displayed image.

### Spoiler overlay

`MediaSpoilerWrapper` is rendered inside the portrait zone wrapper in `DetailPageHeader`, wrapping the main image element. It covers the portrait zone bounds (matching the zone's `inset: 0`). The `onSpoilerRevealed` callback prop threads through as before.

### No-image fallback

When the entity has no available media (`allMedia.length === 0`):
- The portrait zone is **not rendered**.
- The existing fallback glow (`<Box>` with entity-tinted gradient, `right: 0, width: 42%`) is shown instead — this is the same code currently in `DetailPageHeader` for `!showImage`.
- The blur-only `MediaThumbnail` instance is also not rendered (no image to blur).

### `MediaThumbnail.tsx` changes

`MediaThumbnail` is **not** structurally changed for non-hero usage. The only changes are:
- **Export `MediaSpoilerWrapper`:** Currently `MediaSpoilerWrapper` is a module-private function in `MediaThumbnail.tsx`. It must be exported (`export function MediaSpoilerWrapper`) so `DetailPageHeader` can import and use it to wrap the portrait zone image. This is the only required structural change to `MediaThumbnail.tsx`.
- The `controlsPosition="right"` hero path in `MediaThumbnail` becomes unused and can be kept or removed. Do not remove it in this PR to avoid breaking other potential usages — mark with a `// TODO: remove when hero header is fully migrated` comment.
- `allowFullView` and `allowCycling` continue to work as before for all non-hero instances.

### Blur layer sync with current image

The blur-only `MediaThumbnail` instance receives `initialMedia` containing all entity media. To keep the blur background in sync with the currently displayed image as the user cycles, `DetailPageHeader` should pass the current image as a single-item `initialMedia` to the blur instance whenever `currentIndex` changes. Alternatively, a simpler approach: pass the full `initialMedia` array and let the blur instance's own `currentIndex` advance independently — the visual difference is imperceptible since the blur is heavily filtered (`blur(20px) brightness(0.3)`). The simpler approach is acceptable.

---

## Behaviour Details

| Scenario | Behaviour |
|---|---|
| Single image, no cycling | Portrait zone renders, no dot strip, no chevrons, click still opens lightbox |
| Multiple images | Dot strip shown, chevrons visible on hover (desktop) or always (mobile) |
| No image available | Portrait zone not rendered; existing right-side tinted glow fallback shown |
| Spoiler-gated image | `MediaSpoilerWrapper` covers portrait zone; chevrons and dots hidden until revealed |
| Mobile (touch) | Chevrons always visible at full opacity; dot strip centred at bottom |
| `showImage={false}` prop | Same as no image — portrait zone not rendered, fallback glow shown |

---

## Out of Scope

- Touch swipe gesture support (swipe left/right to cycle) — not included in this change
- Changes to the lightbox modal UI beyond moving it to `DetailPageHeader`
- Changes to `MediaThumbnail` in non-hero contexts (card grids, inline, etc.)
- Per-image `objectPosition` overrides (admin-settable focal point)
- Removing the `controlsPosition="right"` code path from `MediaThumbnail`
