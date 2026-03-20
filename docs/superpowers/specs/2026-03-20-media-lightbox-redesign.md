# Media Lightbox Redesign

**Date:** 2026-03-20
**Status:** Approved

## Overview

Redesign the media gallery lightbox to show images at full size with a clean immersive layout. Replace the current split design (image capped at 70vh + Paper metadata panel below) with a full-screen modal where the image fills the available height and metadata is overlaid as a gradient bar at the bottom. Extract all lightbox UI into a dedicated `MediaLightbox.tsx` component.

## Problem

The current lightbox in `MediaGallery.tsx`:
- Caps images at `maxHeight: 70vh`, cutting off tall images unnecessarily
- Has a separate `<Paper>` metadata panel below the image that competes for vertical space and feels visually disconnected
- The lightbox modal logic is embedded inline in a 906-line component, making it hard to reason about

## Design

### Layout

Full-screen black modal (`fullScreen` Mantine prop). The media content (image or video) fills the entire modal area using `object-fit: contain`. No height cap.

A gradient overlay bar is pinned to the bottom of the modal. It fades from transparent at the top to near-opaque black at the bottom. Its contents, top to bottom:
1. **Description** — white text, `fw: 500`, `lineClamp: 2`, only rendered if `selectedMedia.description` is non-empty
2. **Badges + submitter row** — ownerType badge (filled red), type badge (outlined red), chapter badge if present (outlined purple), then `by <username> · <date>` in dimmed text. External link icon button on the far right.

### Controls

- **Close button** — top-right, circular, `rgba(0,0,0,0.65)` background, subtle white border, backdrop blur
- **Counter pill** — top-left, shows `{currentIndex + 1} / {total}`, same frosted-glass style
- **Nav arrows** — centered vertically on left/right edges, circular, frosted-glass style with subtle white border. Only rendered when there is a previous/next item.

All existing behaviors are preserved: keyboard navigation (← → Esc), touch swipe, video embedding (YouTube iframe, Vimeo iframe, direct `<video>`), `shouldLoadVideo` lazy-load gate for embeds.

### Component Boundary

**New:** `client/src/components/MediaLightbox.tsx`

```ts
interface MediaLightboxProps {
  opened: boolean
  media: MediaItem[]        // full filtered list for navigation
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}
```

The component owns:
- All modal JSX (Mantine `Modal`, image/video rendering, overlay bar, controls)
- Keyboard event listener (scoped to `opened`)
- Touch swipe handlers
- `shouldLoadVideo` state (lazy embed gate)
- `imageZoomed` state (kept for future use, currently unused in new design)

**Modified:** `client/src/components/MediaGallery.tsx`

The gallery retains ownership of:
- `dialogOpen`, `selectedMedia`, `currentImageIndex` state
- `handleMediaClick`, `handleCloseDialog`, `handlePrevious`, `handleNext` handlers
- Data fetching, filtering, grid rendering

It passes these down to `<MediaLightbox>`.

`MediaItem` type is extracted to a shared location or re-exported from `MediaLightbox.tsx` so both components reference the same definition.

### Removed

- The `<Paper p="md" radius={0}>` block and all JSX inside it (was the old metadata panel)
- `<Box style={{ maxHeight: '70vh', overflow: 'hidden' }}>` wrapper around the media content
- `ZoomIn`, `Maximize2` icon imports that were unused in the current code

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/MediaLightbox.tsx` | **New** — lightbox component |
| `client/src/components/MediaGallery.tsx` | Remove inline modal JSX (~210 lines), import and render `<MediaLightbox>` |

## Non-Goals

- No changes to the gallery grid layout or thumbnail cards
- No changes to media data fetching or filtering logic
- No changes to the media page (`MediaPageContent.tsx`) or any other consumer
