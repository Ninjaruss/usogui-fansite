# Detail Header: Blurred Background Layer + Dot Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two visual issues on entity detail page headers — rectangular artwork no longer floats on a dark background (replaced by a blurred full-bleed version of the same image), and navigation dots are larger and easier to tap.

**Architecture:** Two files change. `MediaThumbnail.tsx` gains a `showBlurredBackground` prop that renders a decorative blurred `img` layer as the first child of its outer container, and its hero-mode dot strip gets larger dots wrapped in padded hit-target boxes. `DetailPageHeader.tsx` opts into the new prop and adjusts `objectPosition` + fade width. No new API calls, no new components, no new files.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI (`Box`, `Text`, `rem`), inline styles. Package manager: `yarn` (never `npm`).

---

## File Map

| File | What changes |
|---|---|
| `client/src/components/MediaThumbnail.tsx` | Add `showBlurredBackground?: boolean` prop; render blurred decorative layer; update hero dot pill + dot sizes + hit-target wrappers |
| `client/src/components/layouts/DetailPageHeader.tsx` | Pass `showBlurredBackground`, change `objectPosition`, narrow fade overlay |

---

## Task 1: Add `showBlurredBackground` prop to `MediaThumbnail`

**Files:**
- Modify: `client/src/components/MediaThumbnail.tsx`

### Context for this task

`MediaThumbnailProps` is defined at lines 35–58. The outer render container is the `Box` at line ~1150 (the one with `ref={containerRef as React.Ref<HTMLDivElement>}`). `containerStyles` (line 302) already has `position: 'relative'` and `overflow: 'hidden'`, so a `position: absolute, inset: 0` child will fill it correctly and `transform: scale(1.08)` will be clipped by the container — no additional wrapper needed.

`resolvedMediaInfo` is state `Record<string, any>` keyed by `media.url` (line 250). `analyzeMediaUrl` is a sync function imported from `../lib/media-utils`. The pattern to compute media info for the current thumbnail (mirroring `renderMediaContent`) is:

```ts
const currentMediaInfo = resolvedMediaInfo[currentThumbnail.url] || analyzeMediaUrl(currentThumbnail.url)
```

`currentThumbnail` comes from state and may be `null` during loading.

- [ ] **Step 1: Add `showBlurredBackground` to the props interface**

In `client/src/components/MediaThumbnail.tsx`, find `interface MediaThumbnailProps` (line ~35). Add after the `objectFit` line:

```ts
  /** When true, renders a blurred, darkened copy of the current image behind the main image for a full-bleed background effect. */
  showBlurredBackground?: boolean
```

- [ ] **Step 2: Destructure the new prop**

Find the destructuring of `MediaThumbnailProps` props (the `function MediaThumbnail({` line, around line 60). Add `showBlurredBackground = false` to the destructured list alongside the existing props.

- [ ] **Step 3: Compute `currentMediaInfo` for the blurred layer**

Just before the `return (` statement of the main `MediaThumbnail` component (search for the comment `// Main render` or locate the outer `return (` that contains the `Box` with `containerRef`), add:

```ts
const currentMediaInfo = currentThumbnail
  ? (resolvedMediaInfo[currentThumbnail.url] || analyzeMediaUrl(currentThumbnail.url))
  : null
const showBlurLayer =
  showBlurredBackground &&
  !!currentThumbnail &&
  currentThumbnail.type === 'image' &&
  !!currentMediaInfo?.isDirectImage
const blurImageUrl = currentMediaInfo?.directImageUrl || currentThumbnail?.url
```

- [ ] **Step 4: Insert the blurred background layer into the outer container Box**

Find the outer `Box` with `ref={containerRef as React.Ref<HTMLDivElement>}` (line ~1150). It currently looks like:

```tsx
<Box
  component={containerComponent}
  ref={containerRef as React.Ref<HTMLDivElement>}
  className={className}
  style={{
    ...containerStyles,
    ...(canExpand ? { cursor: 'zoom-in' } : {})
  }}
  onClick={canExpand ? () => setIsModalOpen(true) : undefined}
>
  <MediaSpoilerWrapper ...>
```

Add the blurred layer as the **first child**, before `<MediaSpoilerWrapper`:

```tsx
{showBlurLayer && (
  <Box
    aria-hidden
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={blurImageUrl}
      alt=""
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scale(1.08)',
        filter: 'blur(20px) brightness(0.3) saturate(0.6)',
        display: 'block',
      }}
    />
  </Box>
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build
```

Expected: build succeeds with no TypeScript errors. Fix any type errors before continuing.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/MediaThumbnail.tsx
git commit -m "feat(MediaThumbnail): add showBlurredBackground prop for blurred full-bleed bg layer"
```

---

## Task 2: Improve hero dot strip sizing and hit targets

**Files:**
- Modify: `client/src/components/MediaThumbnail.tsx` (hero dot strip block, `controlsPosition === 'right'` branch, lines ~1165–1201)

### Context for this task

The `controlsPosition === 'right'` branch renders a pill-shaped container with individual dot `Box` elements and a count text. Each dot `Box` is currently the clickable element. The change wraps each dot in an outer `Box` with `padding: rem(4)` to expand the hit target without changing the visual dot size. The outer pill container's styles also change.

The current code in the `controlsPosition === 'right'` branch looks like:

```tsx
<Box
  style={{
    position: 'absolute',
    bottom: rem(10),
    right: rem(10),
    display: 'flex',
    gap: rem(5),
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: rem(12),
    paddingInline: rem(8),
    paddingBlock: rem(5),
    zIndex: 30,
  }}
>
  {allEntityMedia.map((_, idx) => (
    <Box
      key={idx}
      onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); setCurrentThumbnail(allEntityMedia[idx]) }}
      style={{
        width: idx === currentIndex ? rem(10) : rem(7),
        height: idx === currentIndex ? rem(10) : rem(7),
        borderRadius: '50%',
        backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.35)',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        flexShrink: 0,
      }}
    />
  ))}
  <Box style={{ width: 1, height: rem(14), backgroundColor: 'rgba(255,255,255,0.15)', marginInline: rem(2), flexShrink: 0 }} />
  <Text style={{ fontSize: rem(9), color: 'rgba(255,255,255,0.5)', lineHeight: 1, whiteSpace: 'nowrap' }}>
    {currentIndex + 1} / {allEntityMedia.length}
  </Text>
</Box>
```

- [ ] **Step 1: Replace the hero dot strip block**

Replace the entire `controlsPosition === 'right'` branch (the outer `<Box>` with `position: absolute, bottom: rem(10), right: rem(10)` through its closing `</Box>`) with:

```tsx
<Box
  style={{
    position: 'absolute',
    bottom: rem(10),
    right: rem(10),
    display: 'flex',
    gap: rem(2),
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: rem(20),
    border: '1px solid rgba(255,255,255,0.08)',
    paddingInline: rem(10),
    paddingBlock: rem(7),
    zIndex: 30,
  }}
>
  {allEntityMedia.map((_, idx) => (
    <Box
      key={idx}
      onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); setCurrentThumbnail(allEntityMedia[idx]) }}
      style={{
        padding: rem(4),
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Box
        style={{
          width: idx === currentIndex ? rem(14) : rem(9),
          height: idx === currentIndex ? rem(14) : rem(9),
          borderRadius: '50%',
          backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.45)',
          transition: 'all 0.22s ease',
          flexShrink: 0,
          boxShadow: idx === currentIndex ? '0 0 0 3px rgba(255,255,255,0.15)' : 'none',
        }}
      />
    </Box>
  ))}
  <Box style={{ width: 1, height: rem(14), backgroundColor: 'rgba(255,255,255,0.15)', marginInline: rem(2), flexShrink: 0 }} />
  <Text style={{ fontSize: rem(11), color: 'rgba(255,255,255,0.65)', lineHeight: 1, whiteSpace: 'nowrap' }}>
    {currentIndex + 1} / {allEntityMedia.length}
  </Text>
</Box>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/MediaThumbnail.tsx
git commit -m "feat(MediaThumbnail): larger hero dot strip with padded hit targets"
```

---

## Task 3: Update `DetailPageHeader` to use new props

**Files:**
- Modify: `client/src/components/layouts/DetailPageHeader.tsx`

### Context for this task

The `MediaThumbnail` usage in `DetailPageHeader.tsx` is at lines ~113–126:

```tsx
<MediaThumbnail
  entityType={entityType}
  entityId={entityId}
  entityName={entityName}
  allowCycling={true}
  allowFullView={true}
  maxWidth="100%"
  maxHeight="100%"
  spoilerChapter={spoilerChapter ?? undefined}
  onSpoilerRevealed={onSpoilerRevealed}
  objectFit="contain"
  objectPosition="right top"
  controlsPosition="right"
/>
```

The left-edge fade overlay (line ~128–141) currently has `width: '70%'`.

- [ ] **Step 1: Update the `MediaThumbnail` call**

Change `objectPosition="right top"` → `objectPosition="center top"` and add `showBlurredBackground={true}`:

```tsx
<MediaThumbnail
  entityType={entityType}
  entityId={entityId}
  entityName={entityName}
  allowCycling={true}
  allowFullView={true}
  maxWidth="100%"
  maxHeight="100%"
  spoilerChapter={spoilerChapter ?? undefined}
  onSpoilerRevealed={onSpoilerRevealed}
  objectFit="contain"
  objectPosition="center top"
  controlsPosition="right"
  showBlurredBackground={true}
/>
```

- [ ] **Step 2: Narrow the left-edge fade overlay**

Find the `Box` with `className="detail-hero-portrait-fade"` (line ~128). Change `width: '70%'` → `width: '60%'`:

```tsx
<Box
  aria-hidden
  className="detail-hero-portrait-fade"
  style={{
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '60%',
    background: 'linear-gradient(90deg, #080c14 0%, rgba(8,12,20,0.75) 55%, transparent 100%)',
    zIndex: 2,
    pointerEvents: 'none',
  }}
/>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layouts/DetailPageHeader.tsx
git commit -m "feat(DetailPageHeader): use blurred bg layer, center image, narrow fade overlay"
```

---

## Task 4: Visual verification

**Files:** None — read-only verification pass.

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn dev
```

- [ ] **Step 2: Navigate to a character detail page with multiple images**

Open `http://localhost:3000/characters/[id]` for an entity that has 2+ media items. Verify:
- The header background is no longer dark/empty on the right — the blurred image fills it
- The sharp portrait is centered (not right-anchored) within the portrait zone
- The blurred layer is visibly dark enough that it reads as texture, not a competing image
- The left-edge text column content is still readable

- [ ] **Step 3: Verify dot strip**

While on the same page, verify:
- Dots are visibly larger
- The pill has a darker, bordered appearance
- Clicking each dot cycles correctly
- The count text is readable

- [ ] **Step 4: Navigate to a character with only one image**

Verify no dot strip appears (unchanged behavior — existing guard handles this).

- [ ] **Step 5: Navigate to a character with no images**

Verify the header falls back to the entity-tinted glow (unchanged `showImage={false}` path).
