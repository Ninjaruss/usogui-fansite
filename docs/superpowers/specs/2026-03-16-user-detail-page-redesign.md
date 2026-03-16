# User Detail Page Redesign
**Date:** 2026-03-16
**Status:** Approved
**Scope:** `client/src/app/users/[id]/UserProfileClient.tsx`

## Goal
Make the public user detail page (`/users/[id]`) look nearly identical to the profile page (`/profile`) in visual style and layout. Approach: rewrite `UserProfileClient.tsx` to replicate the profile page's HTML/CSS structure inline (no shared component extraction). The profile page itself is not touched.

## Approach
Option B — self-contained rewrite of `UserProfileClient.tsx`. Styling is duplicated from the profile page rather than extracted into shared components. No risk of breaking the profile page.

---

## Outer structure

The root return must be restructured: `motion.div` wraps `Container` (opposite of the current `UserProfileClient.tsx` which has `Container` wrapping `motion.div`):

```tsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
  <Container size="lg" py="xl">
    <Stack gap={0}>
      {/* Section 1: Header */}
      {/* Section 2: 2-column grid */}
      {/* Section 3: Full-width content blocks */}
    </Stack>
  </Container>
</motion.div>
```

No `BreadcrumbNav`.

---

## Type changes

**`PublicUser.userStats`:**
```ts
userStats?: {
  guidesWritten: number
  mediaSubmitted: number
  likesReceived: number
  annotationsSubmitted: number
  eventsSubmitted?: number
}
```

**`userStats` React state** — update both the state type declaration and all `setUserStats` call sites to include `annotationsSubmitted`. The field should be populated from `user.userStats?.annotationsSubmitted ?? 0` in the `baseStats` object (same pattern as `mediaSubmitted`), and not recalculated from other fetched data (it falls back to base like `mediaSubmitted`).

---

## Section 1: Header

Replace the current rounded Mantine `Card` with a flat dark `Box` matching `ProfileHeader`'s exact style.

**Outer `Box`:**
- `background: 'linear-gradient(180deg, #100508 0%, #0a0a0a 100%)'`
- `borderBottom: '1px solid #1a1a1a'`
- `padding: '20px 24px 0'`
- `position: 'relative'`

**Top accent bar** — absolute-positioned child `Box`:
- `position: 'absolute'`, `top: 0`, `left: 0`, `right: 0`, `height: '2px'`
- `background: 'linear-gradient(90deg, #e11d48 0%, rgba(124,58,237,0.5) 55%, transparent 100%)'`

**Main row** — `<Group justify="space-between" align="flex-end" gap="lg" wrap="wrap">`:

Left side — `<Group align="flex-end" gap="lg">`:
- Avatar — `UserProfileImage` does not accept a `style` prop; wrap it in a `Box`:
  ```tsx
  <Box style={{ borderRadius: '4px', border: '1px solid #2a2a2a', boxShadow: '0 0 0 2px rgba(225,29,72,0.15)', flexShrink: 0 }}>
    <UserProfileImage user={user} size={72} style={{ borderRadius: '4px' }} />
  </Box>
  ```
  No edit overlay (read-only).
- Name/role `<Stack gap={4} style={{ paddingBottom: '4px' }}>`:
  - Username `Text`: `fontFamily: 'var(--font-opti-goudy-text)'`, `fontSize: '2rem'`, `fontWeight: 900`, `color: '#f5f5f5'`, `lineHeight: 1`
  - Below: `<UserRoleDisplay>` + `<UserBadges userId={user.id}>` in a `Group gap="xs" wrap="wrap"`

Right side — `<Stack gap={2} style={{ textAlign: 'right', paddingBottom: '6px' }}>`:
- `Text` in monospace, `color: '#555'`, `fontSize: '13px'`, `letterSpacing: '0.06em'`, `lineHeight: 1.9`
- Content: `#` + `String(user.id).padStart(4, '0')` then `<br />` then ISO join date (`new Date(user.createdAt).toISOString().split('T')[0]`), or `'—'` if `createdAt` absent

**Stat strip** — `<Group gap={0} style={{ marginTop: '16px', borderTop: '1px solid #1a1a1a' }}>`:

Four stats in order. Each is a `Box` with `padding: '8px 16px'`. First stat: `paddingLeft: 0` (left-aligns with avatar edge). All but the last: `borderRight: '1px solid #1a1a1a'`.

| # | Label | Value | Color |
|---|-------|-------|-------|
| 1 | Guides | `userStats?.guidesWritten ?? 0` | `#e11d48` (accent) |
| 2 | Media | `userStats?.mediaSubmitted ?? 0` | `#bbb` |
| 3 | Annotations | `userStats?.annotationsSubmitted ?? 0` | `#bbb` |
| 4 | Read | `` `${readPercent}%` `` | `#bbb` |

`readPercent = Math.min(Math.round((user.userProgress / MAX_CHAPTER) * 100), 100)`

Stat value: `fontSize: '22px'`, `fontWeight: 800`, `color: <per table>`, `lineHeight: 1`, `marginBottom: '2px'`, `display: 'block'`
Stat label: `fontSize: '14px'`, `color: '#888'`

**Loading state:** Stats 1–3 show `0` while `dataLoading` is true; they update when the fetch resolves. No skeleton in the strip.

---

## Section 2: 2-column grid

```tsx
<Box
  className="profile-section-grid"
  style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}
>
```
The `profile-section-grid` CSS class handles responsive collapse to 1 column.

### Dark box style (both panels)
```js
{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }
```

### Left panel — Favorites

`<Stack gap="md">` inside the dark box.

Panel heading: `<Text fw={700}>Favorites</Text>`

Three sub-sections with `<Divider my="sm" color="rgba(255,255,255,0.06)" />` between them. Each sub-section is always rendered:

**Favorite Quote:**
- Sub-heading: `<Text fw={600} size="sm">Favorite Quote</Text>`
- If `favoriteQuote` is set:
  - Quote box: `{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px', borderLeft: '4px solid {quoteColor}', padding: '12px' }`
  - Italic quote text with `lineClamp={4}`
  - `Group gap="xs"`: character name `Badge` (quoteColor), optional chapter `Badge` (characterColor if `favoriteQuote.chapterNumber` exists)
  - "View Quote" `Anchor` (Next.js `Link`) to `/quotes/{favoriteQuote.id}`
- If not set: `<Text size="sm" c="dimmed">No favorite quote set.</Text>`

**Favorite Gamble:**
- Sub-heading: `<Text fw={600} size="sm">Favorite Gamble</Text>`
- If `favoriteGamble` is set:
  - Centered gamble name `Badge`: `variant="gradient"`, `gradient={{ from: getAlphaColor(gambleColor, 0.8), to: gambleColor }}`, `size="lg"`
  - Truncated rules: `favoriteGamble.rules?.substring(0, 100)` + `'...'` if longer, `size="xs"`, `c="dimmed"`, `ta="center"`
  - "View Gamble" `Anchor` to `/gambles/{favoriteGamble.id}`
- If not set: `<Text size="sm" c="dimmed">No favorite gamble set.</Text>`

**Favorite Characters:**
- Sub-heading: `<Text fw={600} size="sm">Favorite Characters</Text>`
- If `user.favoriteCharacters?.length > 0` (sorted by `sortOrder`):
  - Each: `Card` as `Link` to `/characters/{fav.characterId}`, dark box styling, `Group gap="sm"`: `#1` star `Badge` (yellow, if `isPrimary`), character name `Text c={characterColor}`
- If empty: `<Text size="sm" c="dimmed">No favorite characters set.</Text>`

### Right panel — Reading Progress

`<Stack gap="md">` inside the dark box.

Panel heading: `<Text fw={700}>Reading Progress</Text>`

- Chapter/total row: `<Group justify="space-between">`
  - Left `<Stack gap={2}>`: `<Text size="xs" c="dimmed">Chapter</Text>` above chapter number (`fontFamily: 'var(--font-opti-goudy-text)'`, `fontSize: '1.5rem'`, `color: arcColor`, `lineHeight: 1`)
  - Right `<Stack gap={2} style={{ textAlign: 'right' }}>`: `<Text size="xs" c="dimmed">Total</Text>` above `MAX_CHAPTER` (same font, `color: 'rgba(255,255,255,0.5)'`)
- `<Progress value={readingProgress} color={arcColor} size="lg" radius="md" striped animated />`
- Percentage row: `<Group justify="space-between">`
  - `<Text size="xs" c="dimmed">0%</Text>`
  - `<Text size="sm" fw={600} c={arcColor}>{readPercent}%</Text>`
  - `<Text size="xs" c="dimmed">100%</Text>`

---

## Section 3: Full-width content

Stacked below the grid `Box`. Same dark box style. Each block only rendered when content exists.

### Contributions block (only if `submissions.length > 0`)

- Heading row `<Group gap="sm">`: `<Text fw={700}>Contributions</Text>` + count `Badge` showing `submissions.length` (total before filtering — static, does not change with filter)
- `<SegmentedControl>` filter: All / Guides / Media / Events / Annotations
  - Use `styles={{ indicator: { backgroundColor: guideColor } }}` (Mantine v7 `color` prop requires a theme string, not a hex value)
- Filtered submissions sliced to `contributionsVisible`, rendered via `<SubmissionCard>`
- Empty state (when filter returns zero results): `<Text c="dimmed" ta="center" py="xl">No {contributionFilter === 'all' ? 'contributions' : `${contributionFilter}s`} found.</Text>`
- "Show more" `Button` (adds +10 to `contributionsVisible`)

### Guides block (only if `guides.length > 0`)

- Heading row `<Group justify="space-between">`:
  - Left `<Group gap="sm">`: `<Text fw={700}>Guides</Text>` + count `Badge` showing `userStats?.guidesWritten ?? guides.length` (uses the true total from API when available, not the sliced array length)
  - Right: "View All Guides" outline `Button` linking to `/guides?author=${user.id}&authorName=${encodeURIComponent(user.username)}`
- `<SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">` of guide cards:
  - Title as `Anchor` (Link) to `/guides/{guide.id}`, `fw={600}`
  - Description `Text` with `lineClamp={2}`, `c="dimmed"`
  - Footer `Group justify="space-between"`: view count (Eye icon) + like count (Heart icon) on left; date on right
- "Show more" `Button` (adds +6 to `guidesVisible`)

---

## What is NOT changing

- Data fetching logic (all API calls, `useEffect`, state)
- `UserNotFound`, `loading.tsx`, `error.tsx`
- The profile page (`/profile`) and all its sub-components
- Backend — `annotationsSubmitted` is already returned by the public profile API

---

## Files changed

- `client/src/app/users/[id]/UserProfileClient.tsx` — full JSX/style rewrite
  - Restructure root: `motion.div` wraps `Container` (not the current inverse)
  - Add `annotationsSubmitted` to `PublicUser.userStats` type, React state type, and both `setUserStats` call sites
  - All other logic (fetching, state management) unchanged
