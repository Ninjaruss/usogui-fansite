# Mobile Image Cycling Controls — Design Spec

**Date:** 2026-03-21
**Status:** Approved

## Problem

On mobile, the `DetailPageHeader` hero renders the entity portrait in the right 42% of a 280px-tall panel. The existing cycling controls (`MediaThumbnail` with `allowCycling={true}`) place:

- A ‹ arrow at `left: 8px` of the portrait — falls behind the left-side fade gradient and overlaps the text column, making it invisible/confusing on narrow screens.
- A › arrow at `right: 8px` — usable but small (`size="sm"`, 28px).
- Dot indicators at `bottom: 10px` inside a frosted pill — invisible against the bottom gradient fade.

Result: on mobile, users cannot clearly see or operate the image cycling controls.

## Goal

Make the cycling controls clear and tappable on mobile without changing the desktop layout.

## Scope

**One file changes:** `client/src/components/MediaThumbnail.tsx`

No changes to `DetailPageHeader`, page components, or any other callers. No new props.

## Design

### Mobile layout (`max-width: 768px`, when `showControls` is true)

| Element | Spec |
|---------|------|
| **Next arrow** | ChevronRight, `size="md"` (36px), positioned `right: 8px, top: 50%, translateY(-50%)`, `zIndex: 30`, backdrop `rgba(0,0,0,0.58)`, border `1px solid rgba(255,255,255,0.15)` |
| **Previous arrow** | Hidden. Cycling wraps: last image → first via existing `handleNext` wrap logic. |
| **Dot strip** | Full-width band pinned `bottom: 0` of the portrait container. Background `rgba(0,0,0,0.72)`. Height ~18px. Dots centered horizontally with `gap: 5px`. `zIndex: 30` (above both fade layers). `pointerEvents: none`. |
| **Active dot** | 6×6px white circle. Inactive: 5×5px `rgba(255,255,255,0.35)`. |

### Desktop layout (unchanged)

Both ‹ and › arrows at `left: 8px` / `right: 8px`, `size="sm"`, `top: 50%`. Frosted-pill dot indicator at `bottom: 10px, left: 50%` — exactly as today.

### Implementation approach

Use Mantine's `useMediaQuery('(max-width: 768px)')` (same hook already used in `MediaGallery`) inside `MediaThumbnail`. Split the existing `showControls` render block:

```tsx
const isMobile = useMediaQuery('(max-width: 768px)')

{showControls && (
  isMobile ? <MobileControls /> : <DesktopControls />
)}
```

Inline rather than extracted components — the logic is simple enough.

### Edge cases

| Case | Behaviour |
|------|-----------|
| 1 image | `showControls` is `false` (`allEntityMedia.length > 1` guard) — no controls rendered |
| Spoiler overlay | Spoiler wraps `mediaContent`; controls are siblings outside it — no interaction |
| Wrap-around | `handleNext` already wraps index 0 after last — single arrow works correctly |
| SSR / hydration | `useMediaQuery` returns `false` on server → desktop layout renders; mobile layout hydrates client-side. Same pattern as `MediaGallery`. Acceptable. |
| Expand button | Stays at `top: 8px, right: 8px` — separate from the › arrow at `top: 50%`, no overlap |

## Out of scope

- Layout changes to `DetailPageHeader` (stacking, thumbnail strips)
- Changes to any entity page components
- Swipe gesture support
- Desktop arrow/dot changes
