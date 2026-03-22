# Detail Page Hero Header — Image Integration Fix

**Date:** 2026-03-22
**Scope:** `MediaThumbnail.tsx`, `DetailPageHeader.tsx`

---

## Problem

Entity detail page headers display a full-bleed portrait image as a background via `MediaThumbnail`. Two issues cause misaligned, poorly-fitted images across all entity types:

1. **Wrong object-position** — `objectPosition: 'center center'` center-crops portrait images inside the landscape header, cutting off faces and key subjects at the top.
2. **Border-radius leak** — `MediaThumbnail` always applies `borderRadius: rem(8)` and a gray `backgroundColor` to its container via inline `containerStyles`. In full-bleed hero use, these create a visible inner rounding gap and opaque background that fights the outer header's clipping.
3. **Cycling controls mispositioned** — Desktop left arrow sits at `left: 8px`, hidden behind the dark content overlay covering the left 65% of the header. The desktop dot indicator is centered on the full header width, overlapping the title text.

---

## Approach

Extend `MediaThumbnail` with two new props. `DetailPageHeader` passes both when rendering the hero portrait.

No new CSS files, no hook extraction, no restructuring of DetailPageHeader's layout.

---

## Changes

### 1. `MediaThumbnail.tsx` — `objectPosition` prop

Add `objectPosition?: string` prop (default: `'center center'`).

Pass this value to the `object-position` CSS property on every image render path:
- Direct images (`ImageWithRetry` with `fill`)
- YouTube thumbnail images
- Fallback/unknown image path

External `<img>` elements receive it via inline style. `Next/Image` components receive it via the `style` prop.

No existing call sites are affected (default preserves current behaviour).

### 2. `MediaThumbnail.tsx` — Auto-strip hero container styles

In the `containerStyles` `useMemo`, when `maxWidth === '100%'` AND `maxHeight === '100%'`:
- Set `borderRadius: 0` (instead of `rem(8)`)
- Set `backgroundColor: 'transparent'` (instead of the gray fallback)

This uses the signal `DetailPageHeader` already sends. No new prop required.

### 3. `MediaThumbnail.tsx` — `controlsPosition` prop

Add `controlsPosition?: 'center' | 'right'` prop (default: `'center'`).

**`'center'` (default):** Current behaviour unchanged — left arrow at `left: 8px`, right arrow at `right: 8px`, dot indicator at `bottom: 10px, left: 50%, transform: translateX(-50%)`.

**`'right'`:** Controls shift into the visible portrait zone (right ~38% of the container):
- Left arrow: hidden (replaced by right arrow only, or both moved right — see below)
- Right arrow: `right: rem(8)` (unchanged position, but now the primary control)
- Left arrow: repositioned to `right: rem(52)` so both arrows are accessible on the right side
- Dot indicator: `bottom: rem(10), right: rem(8)` — right-aligned, no longer centered on full width
- Mobile: no change (right-edge arrow and bottom dot strip already work in the portrait zone)

### 4. `DetailPageHeader.tsx` — Pass new props

Pass to `MediaThumbnail`:
```tsx
objectPosition="top center"
controlsPosition="right"
```

No other changes to `DetailPageHeader`.

---

## Non-goals

- No changes to entity pages (character, arc, gamble, etc.) — all use `DetailPageHeader`
- No changes to non-hero uses of `MediaThumbnail` (cards, sidebars, galleries)
- No CSS file changes
- No hook extraction or API changes

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/MediaThumbnail.tsx` | Add `objectPosition`, `controlsPosition` props; auto-strip hero container styles |
| `client/src/components/layouts/DetailPageHeader.tsx` | Pass `objectPosition="top center"` and `controlsPosition="right"` |
