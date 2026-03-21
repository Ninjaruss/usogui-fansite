# Media Gallery Lightbox Unification — Design Spec

**Date:** 2026-03-21
**Status:** Approved

## Problem

The codebase has two separate lightbox implementations:

1. `MediaLightbox.tsx` — full-screen modal used by `MediaGallery.tsx` (detail pages)
2. Inline `Modal` in `MediaPageContent.tsx` — 90%-width modal used by the media list page

These produce an inconsistent experience and both have UX issues:

- `MediaLightbox` has no visible close button; click-outside only works on the narrow black edges because the image container calls `stopPropagation` on the entire wrapper, not just the image
- `MediaPageContent`'s modal has a different visual style (metadata panel below image vs. gradient overlay), no counter, and a naive YouTube URL embed (`string.replace`)
- No-thumbnail cards (audio, non-YouTube video, external page links) lack hover affordance and have no consistent min-height

## Goals

- One unified lightbox component used everywhere
- Full-screen immersive style (black backdrop, image centred, gradient overlay metadata)
- Reliable close: visible X button + backdrop click; image click does nothing
- Entity name shown in lightbox metadata (e.g., "Baku Madarame" alongside the "character" badge)
- Improved no-thumbnail card state: accent-ringed icon, type label, "Click to open" hint

## Architecture

### 1. Shared type — `client/src/types/media.ts`

Export a single `MediaItem` interface that merges both existing definitions. The entity relation fields from `MediaPageContent` become optional. The `status`/`isApproved` fields from `MediaGallery`'s type are also included as optional:

```ts
export interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video' | 'audio'
  description: string
  fileName?: string
  isUploaded?: boolean
  ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
  ownerId: number
  chapterNumber?: number
  purpose: 'gallery' | 'entity_display'
  submittedBy: { id: number; username: string }
  createdAt: string
  status?: string
  isApproved?: boolean
  // Entity relations (populated by the media list page API response)
  character?: { id: number; name: string }
  arc?: { id: number; name: string }
  event?: { id: number; title: string }
  gamble?: { id: number; name: string }
  organization?: { id: number; name: string }
}
```

**Note:** `EntityDisplayMediaSection.tsx` (admin component) defines its own `interface MediaItem` with `id: string` — that is a completely separate type and is **not** touched by this change.

### 2. Updated `MediaLightbox.tsx`

**Import:** Change `import { MediaItem } from './MediaGallery'` to `import { MediaItem } from '../types/media'`.

**Close UX fix:**

The outer `Box` (`onClick={onClose}`, full viewport) remains the backdrop — clicking anywhere outside the image closes it. The current bug is that the inner content wrapper `Box` (the flex container) has `onClick={(e) => e.stopPropagation()}`, which blocks all clicks from reaching the backdrop.

Fix: remove the `onClick` from the flex wrapper `Box`. Instead, add `onClick={(e) => e.stopPropagation()}` directly to the `<img>` element and to the `<iframe>` and `<video>` elements. Each individual control (counter, arrows, external link, bottom bar) already calls `e.stopPropagation()` independently — those are unchanged.

**Visible X button:**

Add a circular `ActionIcon` using the existing frosted-glass `controlStyle`, positioned at `top: rem(14), right: rem(54)` (to sit left of the external-link button). The external-link button stays at `top: rem(14), right: rem(14)`.

```tsx
<ActionIcon
  variant="transparent"
  size="lg"
  onClick={(e) => { e.stopPropagation(); onClose() }}
  style={{ position: 'absolute', top: rem(14), right: rem(54), zIndex: 10, borderRadius: '50%', ...controlStyle }}
  aria-label="Close"
>
  <X size={16} />
</ActionIcon>
```

Import `X` from `lucide-react` (add to existing import).

**Entity name in metadata:**

Add a helper inside the component:

```ts
const getEntityName = (item: MediaItem): string | null => {
  if (item.character) return item.character.name
  if (item.arc) return item.arc.name
  if (item.event) return item.event.title
  if (item.gamble) return item.gamble.name
  if (item.organization) return item.organization.name
  // user-owned items: no entity name badge (submitter username already shown)
  return null
}
```

`ownerType === 'user'` items intentionally show no entity name badge — the submitter username already serves that role. This is a deliberate tradeoff: the current `MediaPageContent` modal shows the submitter username as the entity name for user-owned items, but in the lightbox context the submitter is already shown in the bottom bar.

In the bottom bar, after the type/ownerType badges and before the submitter line, add:

```tsx
{getEntityName(selectedMedia) && (
  <Badge
    variant="outline"
    size="sm"
    style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)' }}
  >
    {getEntityName(selectedMedia)}
  </Badge>
)}
```

Note: The current `MediaPageContent` modal rendered entity name as an `Anchor` link to the entity page. The lightbox replaces this with a non-linked `Badge`. This is a deliberate simplification — the lightbox is focused on media preview, not navigation.

**Video embed:** Already uses `getEnhancedEmbedUrl` — no change needed.

### 3. `MediaGallery.tsx`

- Remove the local `export interface MediaItem` definition
- Add `import { MediaItem } from '../types/media'`
- No other logic changes

### 4. `MediaPageContent.tsx`

**Type change:**
- Remove the local `interface MediaItem` definition
- Add `import { MediaItem } from '../../types/media'`

**Add import:**
```ts
import MediaLightbox from '../../components/MediaLightbox'
```

**Remove from Mantine imports:** `Modal`, `Image` (these were only used by the old inline lightbox).

**Remove the entire inline lightbox block** (~lines 891–1060): the `<Modal opened={viewerOpen} …>` and all its contents.

**Replace with:**
```tsx
<MediaLightbox
  opened={viewerOpen}
  media={media}
  currentIndex={currentIndex}
  onClose={handleCloseViewer}
  onPrevious={handlePrevious}
  onNext={handleNext}
/>
```

**Dead code to remove alongside the modal:**

| Item | Reason |
|------|--------|
| `selectedMedia` state + `setSelectedMedia` | `MediaLightbox` derives current item from `media[currentIndex]`; `selectedMedia` is never read after migration |
| `setSelectedMedia(media[newIndex])` calls inside `handlePrevious` / `handleNext` | Same reason |
| `imageDimensions` state + `setImageDimensions` | `getOptimalAspectRatio` (which reads `imageDimensions`) is defined but never called anywhere — this state is entirely dead |
| `loadedImages` state + `setLoadedImages` | Same — populated but never read |
| `handleImageLoad` function | Feeds `imageDimensions` and `loadedImages` which are both dead. **Also remove the `onLoad` prop from the card grid `<img>` element** (currently `onLoad={(e) => handleImageLoad(item.id, e)}` in the masonry grid). |
| `getOptimalAspectRatio` function | Reads `imageDimensions`, is never called — dead code |
| `touchStart` state + `handleTouchStart` + `handleTouchEnd` | `MediaLightbox` has identical built-in touch handling |
| Keyboard `useEffect` (lines 282–302) | `MediaLightbox` has identical built-in keyboard handling |

**`handleMediaClick` signature change:**

Current: `handleMediaClick(item: MediaItem, index: number)` — sets both `selectedMedia` and `currentIndex`.
After: Rename or simplify to only set `currentIndex` and open the viewer:

```ts
const handleMediaClick = useCallback((_item: MediaItem, index: number) => {
  setCurrentIndex(index)
  setViewerOpen(true)
}, [])
```

(Or remove the `item` parameter entirely and use only `index` if TypeScript permits given the call site uses `(item, index)` in the `.map()` — updating the call site to `() => handleMediaClick(item, index)` is fine, or just `() => { setCurrentIndex(index); setViewerOpen(true) }` inline.)

**`handleCloseViewer` — simplify:**

Current sets both `setViewerOpen(false)` and `setSelectedMedia(null)`. After removing `selectedMedia`, it only needs:
```ts
const handleCloseViewer = useCallback(() => setViewerOpen(false), [])
```

### 5. No-thumbnail card state

Both `MediaGallery.tsx` and `MediaPageContent.tsx` render a fallback when no thumbnail is available. The two files have different control-flow structures — apply the changes per-file as follows.

**`MediaGallery.tsx` — fallback branch (the `else` arm of the thumbnail ternary):**

Current: a plain grey `Box` with a `Stack` containing either `ImageOff + "Image unavailable"` (failed load) or a type icon + `"Click to view"`.

After:
```tsx
<Box
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: rem(120),
    backgroundColor: theme.colors.dark[6],
    flexDirection: 'column',
    gap: rem(8),
    transition: 'background 0.2s ease',
    background: isHovered
      ? `linear-gradient(135deg, ${rgba(palette.accent, 0.12)}, ${theme.colors.dark[6]})`
      : theme.colors.dark[6],
  }}
>
  <Stack align="center" gap="xs">
    {failedImageIds.has(mediaItem.id) ? (
      <>
        <Box style={{ background: rgba(theme.colors.dark[3], 0.2), border: `1px solid ${rgba(theme.colors.dark[3], 0.4)}`, borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ImageOff size={22} color={theme.colors.dark[3]} />
        </Box>
        <Text size="xs" c="dimmed">Image unavailable</Text>
        <Text size="xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Click to open</Text>
      </>
    ) : (
      <>
        <Box style={{ background: rgba(palette.accent, 0.15), border: `1px solid ${rgba(palette.accent, 0.35)}`, borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.accent }}>
          {getMediaTypeIcon(mediaItem.type)}
        </Box>
        <Text size="xs" c="white" style={{ opacity: 0.7 }} fw={500} tt="capitalize">{mediaItem.type}</Text>
        <Text size="xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Click to open</Text>
      </>
    )}
  </Stack>
</Box>
```

**`MediaPageContent.tsx` — fallback branch (the `else` arm of the outer thumbnail ternary, lines ~845–858):**

Current: a simple `Box` with just the type icon, height `rem(150)`.

After — same visual treatment as above, using `accentMedia` as the accent color:
```tsx
<Box
  style={{
    background: isHovered
      ? `linear-gradient(135deg, ${accentMedia}1a, ${theme.colors.dark[6]})`
      : theme.colors.dark[6],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: rem(120),
    flexDirection: 'column',
    gap: rem(8),
    transition: 'background 0.2s ease',
  }}
>
  <Stack align="center" gap="xs">
    <Box style={{ background: `${accentMedia}26`, border: `1px solid ${accentMedia}59`, borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentMedia }}>
      {getMediaTypeIcon(item.type)}
    </Box>
    <Text size="xs" c="white" style={{ opacity: 0.7 }} fw={500} tt="capitalize">{item.type}</Text>
    <Text size="xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Click to open</Text>
  </Stack>
</Box>
```

Note: `MediaPageContent` does not have a `failedImages` branch in the no-thumbnail arm (failed images are shown differently, inside the thumbnail-present branch). Only the "no thumbnail at all" case is updated here.

## What Is Not Changing

- Masonry grid layout, filter logic, infinite scroll, search — untouched
- `MediaThumbnail.tsx` (the entity display thumbnail component for detail pages) — separate concern, untouched
- All existing keyboard navigation and touch swipe in `MediaLightbox` — preserved as-is
- Admin media components — untouched. Note: `EntityDisplayMediaSection.tsx` has its own `interface MediaItem` with `id: string` — this is a completely separate admin type and is not part of this migration.

## Files Changed

| File | Change |
|------|--------|
| `client/src/types/media.ts` | **New** — shared MediaItem type |
| `client/src/components/MediaLightbox.tsx` | Fix close UX, add X button, add entity name helper, import shared type |
| `client/src/components/MediaGallery.tsx` | Import shared type, improve no-thumbnail card |
| `client/src/app/media/MediaPageContent.tsx` | Import shared type, remove inline modal + dead code, wire MediaLightbox, improve no-thumbnail card |
