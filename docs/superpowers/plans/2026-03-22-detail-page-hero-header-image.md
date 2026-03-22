# Detail Page Hero Header Image Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix portrait image sizing, border-radius leak, and cycling control placement in the entity detail page hero header.

**Architecture:** Add two props to `MediaThumbnail` (`objectPosition`, `controlsPosition`). When `controlsPosition === 'right'`, the component strips its own border-radius/background and repositions controls to the right portrait zone. `DetailPageHeader` passes both props when rendering the hero portrait.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI, `motion/react`

---

## Files Modified

| File | Change |
|------|--------|
| `client/src/components/MediaThumbnail.tsx` | Add `objectPosition` + `controlsPosition` props; update image styles and control positions |
| `client/src/components/layouts/DetailPageHeader.tsx` | Pass `objectPosition="top center"` and `controlsPosition="right"` |

No new files. No CSS changes.

---

## Task 1 — Add `objectPosition` prop to `MediaThumbnail`

**Files:**
- Modify: `client/src/components/MediaThumbnail.tsx`

### Background

`MediaThumbnail` renders images via `renderMediaContent()`. Three paths render an `<img>` element and currently hardcode `objectPosition: 'center center'`. We need to replace those hardcoded values with a prop.

The fourth render path (platform placeholders — DeviantArt, Twitter etc. that show icon+text with no `<img>`) is unaffected.

- [ ] **Step 1.1: Add `objectPosition` to the props interface**

In `MediaThumbnail.tsx`, find the `MediaThumbnailProps` interface (around line 35). Add after `allowFullView`:

```ts
/** CSS object-position for image rendering. Defaults to 'center center'. */
objectPosition?: string
```

- [ ] **Step 1.2: Destructure `objectPosition` in the function signature**

Find the function signature `export default function MediaThumbnail({` (around line 217). Add after `allowFullView = false`:

```ts
objectPosition = 'center center',
```

- [ ] **Step 1.3: Replace hardcoded objectPosition in the direct-image render path**

In `renderMediaContent`, find the first `ImageWithRetry` call (direct image path, inside `if (mediaInfo.isDirectImage)`). Its `style` prop currently has:

```ts
objectPosition: 'center center',
```

Replace with:

```ts
objectPosition: objectPosition,
```

- [ ] **Step 1.4: Replace hardcoded objectPosition in the YouTube thumbnail render path**

Still inside `renderMediaContent`, find the second `ImageWithRetry` call (inside `if (mediaInfo.platform === 'youtube' && mediaInfo.thumbnailUrl)`). Its `style` prop has:

```ts
objectPosition: 'center center',
```

Replace with:

```ts
objectPosition: objectPosition,
```

- [ ] **Step 1.5: Replace hardcoded objectPosition in the fallback image render path**

Find the final `ImageWithRetry` at the bottom of `renderMediaContent` (the "Fallback for unknown image types" comment, around line 764). Its `style` prop has:

```ts
objectPosition: 'center center',
```

Replace with:

```ts
objectPosition: objectPosition,
```

- [ ] **Step 1.6: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.7: Commit**

```bash
cd client && git add src/components/MediaThumbnail.tsx
git commit --no-gpg-sign -m "feat(MediaThumbnail): add objectPosition prop"
```

---

## Task 2 — Add `controlsPosition` prop to `MediaThumbnail`

**Files:**
- Modify: `client/src/components/MediaThumbnail.tsx`

### Background

`controlsPosition` does three things when set to `'right'`:
1. Strips `borderRadius` and `backgroundColor` from the container (fixes the border-radius leak)
2. Moves the desktop left arrow from `left: 8px` to `right: 52px` (keeping both arrows on the right side)
3. Moves the desktop dot indicator from centered (`left: 50%`) to right-aligned (`right: 8px`)

Mobile controls are unchanged — the right-edge arrow and dot strip already sit in the portrait zone.

- [ ] **Step 2.1: Add `controlsPosition` to the props interface**

In `MediaThumbnailProps`, add after the `objectPosition` line you added in Task 1:

```ts
/** Controls placement. 'right' shifts arrows and dots to the right portrait zone (for hero headers). */
controlsPosition?: 'center' | 'right'
```

- [ ] **Step 2.2: Destructure `controlsPosition` in the function signature**

After `objectPosition = 'center center'` in the destructuring, add:

```ts
controlsPosition = 'center',
```

- [ ] **Step 2.3: Update `containerStyles` to strip hero styles**

Find the `containerStyles` useMemo (around line 293). It currently reads:

```ts
const containerStyles = useMemo<CSSProperties>(
  () => ({
    width: '100%',
    height: '100%',
    maxWidth: maxWidth,
    maxHeight: maxHeight,
    display: inline ? 'inline-block' : 'block',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: rem(8),
    backgroundColor: theme.colors.gray?.[0] ?? '#f8f9fa',
    isolation: 'isolate',
    contain: 'layout size style',
    boxSizing: 'border-box',
    margin: 0,
    padding: 0
  }),
  [inline, maxHeight, maxWidth, theme]
)
```

Replace with:

```ts
const containerStyles = useMemo<CSSProperties>(
  () => ({
    width: '100%',
    height: '100%',
    maxWidth: maxWidth,
    maxHeight: maxHeight,
    display: inline ? 'inline-block' : 'block',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: controlsPosition === 'right' ? 0 : rem(8),
    backgroundColor: controlsPosition === 'right' ? 'transparent' : (theme.colors.gray?.[0] ?? '#f8f9fa'),
    isolation: 'isolate',
    contain: 'layout size style',
    boxSizing: 'border-box',
    margin: 0,
    padding: 0
  }),
  [inline, maxHeight, maxWidth, theme, controlsPosition]
)
```

- [ ] **Step 2.4: Reposition the desktop left arrow when `controlsPosition === 'right'`**

In the desktop controls block (inside `!isMobile` branch, around line 1210), find the left arrow `ActionIcon` with `aria-label="Previous image"`. Its style currently has:

```ts
position: 'absolute',
left: rem(8),
top: '50%',
transform: 'translateY(-50%)',
```

Replace with:

```ts
position: 'absolute',
...(controlsPosition === 'right'
  ? { right: rem(52) }
  : { left: rem(8) }),
top: '50%',
transform: 'translateY(-50%)',
```

- [ ] **Step 2.5: Reposition the dot indicator when `controlsPosition === 'right'`**

Find the desktop dot indicator `Box` (below the two arrow `ActionIcon`s, around line 1255). Its style currently has:

```ts
position: 'absolute',
bottom: rem(10),
left: '50%',
transform: 'translateX(-50%)',
```

Replace with:

```ts
position: 'absolute',
bottom: rem(10),
...(controlsPosition === 'right'
  ? { right: rem(8) }
  : { left: '50%', transform: 'translateX(-50%)' }),
```

- [ ] **Step 2.6: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.7: Commit**

```bash
cd client && git add src/components/MediaThumbnail.tsx
git commit --no-gpg-sign -m "feat(MediaThumbnail): add controlsPosition prop, strip hero container styles"
```

---

## Task 3 — Wire up `DetailPageHeader`

**Files:**
- Modify: `client/src/components/layouts/DetailPageHeader.tsx`

### Background

`DetailPageHeader` renders `MediaThumbnail` inside a `Box` with `position: absolute; inset: 0` (full-bleed). It currently passes `maxWidth="100%"` and `maxHeight="100%"`. We add the two new props here.

- [ ] **Step 3.1: Pass the new props**

Find the `<MediaThumbnail` call inside `DetailPageHeader` (around line 113). It currently ends with:

```tsx
spoilerChapter={spoilerChapter ?? undefined}
onSpoilerRevealed={onSpoilerRevealed}
```

Add after those two lines, before the closing `/>`:

```tsx
objectPosition="top center"
controlsPosition="right"
```

- [ ] **Step 3.2: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.3: Visual verification**

Start the dev server:

```bash
cd client && yarn dev
```

Navigate to any entity detail page (e.g. `http://localhost:3000/characters/1`). Check:

1. Portrait image is anchored to the top — face/upper body visible, not center-cropped
2. No inner border-radius gap visible between the portrait and the outer header
3. No gray background flash from the MediaThumbnail container
4. If the entity has multiple images: both left and right cycling arrows appear on the right side of the header (not the left edge)
5. Dot indicator appears bottom-right of the portrait zone, not bottom-center of the full header

Repeat for one arc, one gamble to confirm across entity types.

- [ ] **Step 3.4: Commit**

```bash
cd client && git add src/components/layouts/DetailPageHeader.tsx
git commit --no-gpg-sign -m "feat(DetailPageHeader): pass objectPosition and controlsPosition to MediaThumbnail"
```
