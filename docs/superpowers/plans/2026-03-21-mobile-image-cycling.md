# Mobile Image Cycling Controls — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On mobile (`max-width: 768px`), replace the cramped ‹ and › arrows + invisible frosted-pill dots with a single › arrow on the right edge and a full-width dot strip pinned at the bottom of the portrait, while leaving the desktop layout completely unchanged.

**Architecture:** Single-file change to `MediaThumbnail.tsx`. Add `useMediaQuery` to detect mobile viewport. Split the existing `showControls` render block into two inline branches — mobile and desktop — with no new components or props.

**Tech Stack:** Next.js 15, React 19, Mantine UI (`useMediaQuery` from `@mantine/hooks`, `ActionIcon`, `Box`, `rem` already in use), Lucide icons (`ChevronRight` already imported).

**Spec:** `docs/superpowers/specs/2026-03-21-mobile-image-cycling-design.md`

---

## File Map

| Action | File | Lines affected |
|--------|------|----------------|
| Modify | `client/src/components/MediaThumbnail.tsx` | Line 14 (add import), ~line 216 (add hook call), lines 1153–1226 (replace controls block) |

No other files change.

---

### Task 1: Add `useMediaQuery` import and hook call

**Files:**
- Modify: `client/src/components/MediaThumbnail.tsx`

**Context:** `useMediaQuery` is not yet imported in this file. It lives in `@mantine/hooks`, which is already a project dependency (used in `MediaGallery.tsx`). The hook returns `false` on SSR and the real viewport match after hydration.

- [ ] **Step 1: Add the import**

In `client/src/components/MediaThumbnail.tsx`, after line 14 (`} from '@mantine/core'`), add:

```tsx
import { useMediaQuery } from '@mantine/hooks'
```

The import block should then read:

```tsx
import {
  ActionIcon,
  Alert,
  Box,
  Loader,
  Modal,
  Text,
  rem,
  useMantineTheme,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
```

- [ ] **Step 2: Add the hook call inside the component**

In `client/src/components/MediaThumbnail.tsx`, find the line (around line 233):

```tsx
export default function MediaThumbnail({
```

Inside the function body, near the other state/hook declarations at the top of the component, add one line after `const theme = useMantineTheme()`:

```tsx
const isMobile = useMediaQuery('(max-width: 768px)')
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: no TypeScript errors. (Build warnings about other files are fine; errors in `MediaThumbnail.tsx` are not.)

- [ ] **Step 4: Commit**

```bash
git add client/src/components/MediaThumbnail.tsx
git commit -m "feat(MediaThumbnail): add useMediaQuery for mobile controls"
```

---

### Task 2: Replace the controls render block with mobile/desktop branches

**Files:**
- Modify: `client/src/components/MediaThumbnail.tsx:1153–1226`

**Context:** The current block at lines 1153–1226 renders the same controls on all screen sizes. We replace it with a conditional: mobile gets a single › arrow + full-width dot strip; desktop keeps the existing ‹ › + frosted-pill dots exactly as today.

The existing block to replace is:

```tsx
        {showControls && (
          <>
            <ActionIcon
              variant="light"
              size="sm"
              radius="xl"
              onClick={(e) => { e.stopPropagation(); handlePrevious() }}
              aria-label="Previous image"
              style={{
                position: 'absolute',
                left: rem(8),
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: `${theme.colors.dark?.[7] ?? theme.colors.gray?.[0]}CC`,
                color: '#ffffff',
                zIndex: 30
              }}
            >
              <ChevronLeft size={20} />
            </ActionIcon>

            <ActionIcon
              variant="light"
              size="sm"
              radius="xl"
              onClick={(e) => { e.stopPropagation(); handleNext() }}
              aria-label="Next image"
              style={{
                position: 'absolute',
                right: rem(8),
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: `${theme.colors.dark?.[7] ?? theme.colors.gray?.[0]}CC`,
                color: '#ffffff',
                zIndex: 30
              }}
            >
              <ChevronRight size={20} />
            </ActionIcon>

            {/* Dot indicators — bottom center */}
            <Box
              style={{
                position: 'absolute',
                bottom: rem(10),
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: rem(5),
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.52)',
                borderRadius: rem(12),
                paddingInline: rem(8),
                paddingBlock: rem(5),
                zIndex: 30,
                pointerEvents: 'none',
              }}
            >
              {allEntityMedia.map((_, idx) => (
                <Box
                  key={idx}
                  style={{
                    width: idx === currentIndex ? rem(8) : rem(5),
                    height: idx === currentIndex ? rem(8) : rem(5),
                    borderRadius: '50%',
                    backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.35)',
                    transition: 'all 0.22s ease',
                    flexShrink: 0,
                  }}
                />
              ))}
            </Box>
          </>
        )}
```

- [ ] **Step 1: Replace with the mobile/desktop split**

Replace the entire block above with:

```tsx
        {showControls && (
          isMobile ? (
            <>
              {/* Mobile: single › arrow on right edge */}
              <ActionIcon
                variant="light"
                size="md"
                radius="xl"
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                aria-label="Next image"
                style={{
                  position: 'absolute',
                  right: rem(8),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.58)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  zIndex: 30,
                }}
              >
                <ChevronRight size={18} />
              </ActionIcon>

              {/* Mobile: full-width dot strip pinned at bottom */}
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: rem(18),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: rem(5),
                  backgroundColor: 'rgba(0,0,0,0.72)',
                  zIndex: 30,
                  pointerEvents: 'none',
                }}
              >
                {allEntityMedia.map((_, idx) => (
                  <Box
                    key={idx}
                    style={{
                      width: idx === currentIndex ? rem(6) : rem(5),
                      height: idx === currentIndex ? rem(6) : rem(5),
                      borderRadius: '50%',
                      backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.35)',
                      transition: 'all 0.22s ease',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </Box>
            </>
          ) : (
            <>
              {/* Desktop: both ‹ › arrows */}
              <ActionIcon
                variant="light"
                size="sm"
                radius="xl"
                onClick={(e) => { e.stopPropagation(); handlePrevious() }}
                aria-label="Previous image"
                style={{
                  position: 'absolute',
                  left: rem(8),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: `${theme.colors.dark?.[7] ?? theme.colors.gray?.[0]}CC`,
                  color: '#ffffff',
                  zIndex: 30
                }}
              >
                <ChevronLeft size={20} />
              </ActionIcon>

              <ActionIcon
                variant="light"
                size="sm"
                radius="xl"
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                aria-label="Next image"
                style={{
                  position: 'absolute',
                  right: rem(8),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: `${theme.colors.dark?.[7] ?? theme.colors.gray?.[0]}CC`,
                  color: '#ffffff',
                  zIndex: 30
                }}
              >
                <ChevronRight size={20} />
              </ActionIcon>

              {/* Desktop: frosted-pill dot indicator — bottom center */}
              <Box
                style={{
                  position: 'absolute',
                  bottom: rem(10),
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: rem(5),
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.52)',
                  borderRadius: rem(12),
                  paddingInline: rem(8),
                  paddingBlock: rem(5),
                  zIndex: 30,
                  pointerEvents: 'none',
                }}
              >
                {allEntityMedia.map((_, idx) => (
                  <Box
                    key={idx}
                    style={{
                      width: idx === currentIndex ? rem(8) : rem(5),
                      height: idx === currentIndex ? rem(8) : rem(5),
                      borderRadius: '50%',
                      backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.35)',
                      transition: 'all 0.22s ease',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </Box>
            </>
          )
        )}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: build succeeds with no errors in `MediaThumbnail.tsx`.

- [ ] **Step 3: Manual verification — mobile**

Start the dev server (`cd client && yarn dev`) and open a character or arc detail page in a browser. Open DevTools → toggle device toolbar → set width to 375px (iPhone SE). Verify:
- Only a single › arrow appears on the right side of the portrait, vertically centred
- A dark strip is visible at the very bottom of the portrait with dot indicators
- Tapping › advances to the next image and wraps back to the first after the last
- The active dot updates correctly
- No ‹ arrow is visible
- Tapping the portrait (away from ›) opens the fullscreen modal when multiple images exist

- [ ] **Step 4: Manual verification — desktop**

Set DevTools width back to ≥ 769px. Verify:
- Both ‹ and › arrows are visible at the left and right edges of the portrait
- The frosted-pill dot indicator is at the bottom centre of the portrait
- Behaviour is identical to before this change

- [ ] **Step 5: Commit**

```bash
git add client/src/components/MediaThumbnail.tsx
git commit -m "feat(MediaThumbnail): mobile-only cycling controls with › arrow and dot strip"
```
