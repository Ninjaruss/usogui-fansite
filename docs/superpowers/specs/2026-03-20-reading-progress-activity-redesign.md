# Reading Progress & Activity Section Redesign

**Date:** 2026-03-20
**Scope:** Frontend only — `client/src/`
**Approach:** Shared visual components, separate data layers per context

---

## Problem

1. **Reading progress is inconsistent** across pages: the profile page uses a custom milestone-tick bar (`ProfileProgressReport`), while the user detail page uses a plain Mantine `Progress` bar. The milestone labels on the profile page are nearly invisible (`#333`/`#1e1e1e` on `#0d0d0d`).

2. **Activity section is missing** from the user detail page (`/users/[id]`). It only exists on the profile page as `ProfileFieldLog`.

3. **Activity section design is unclear**: the type badges are very dark and barely readable; there are no links to content; the 5-item cap has no "show more" option.

---

## Decisions

| Question | Decision |
|---|---|
| Reading progress: unified or distinct per page? | Unified — same component on both pages |
| Reading progress visual style | Design B: progress dot + arc pills |
| Activity on user detail page | Add it — public/approved actions only |
| Activity visual style | Design A: colored left-border timeline cards |
| Activity on own profile | Keep full status visibility (pending/approved/rejected) |

---

## Components

### 1. New: `ReadingProgressBar` (shared)

**File:** `client/src/components/ReadingProgressBar.tsx`

**Purpose:** Purely presentational. Renders reading progress with the new visual design.

**Props:**
```ts
interface ReadingProgressBarProps {
  userProgress: number
  markerLabel?: string // "you" on profile page; omit on public user detail page
}
```

**Visual:**
- Header row: "Chapter X of 539" (left) · "XX%" in rose (right)
- 6px gradient bar (rose → purple) with a glowing rose dot at the user's exact percentage position
- The glowing dot is **always rendered** regardless of `markerLabel`. When `markerLabel` is provided, a small text label (e.g. "you") appears above the dot. When omitted, the dot renders without any label.
- Arc pills row below the bar, derived from `PROFILE_ARC_MILESTONES`:
  - Completed arcs (before user's chapter): rose-tinted background, `✓` suffix
  - Current arc (user is within its range): purple highlight, `← now` suffix
  - Upcoming arcs: intentionally dim grey (`#333` text on `#111` bg) to de-emphasise unread content
- Below pills: "Currently in: [Arc Name]" in a subtle muted color

**Replaces:**
- `ProfileProgressReport.tsx` — merged into `ReadingProgressBar` (the file is deleted, not merely updated; `ProfilePageClient.tsx` imports `ReadingProgressBar` directly)
- Inline reading progress block in `UserProfileClient.tsx` (lines 371–399)

---

### 2. Restyled: `ProfileFieldLog` (profile page activity)

**File:** `client/src/app/profile/ProfileFieldLog.tsx` — restyle only, no prop changes.

**Visual changes:**
- Remove dark type badges
- Each event rendered as a left-border card:
  - 2px colored left border (green=guide, blue=media, purple=annotation, amber=event, orange=progress)
  - Subtle card background `#0f0f0f` with `border-radius: 3px`, `padding: 7px 10px`
  - Title (`#e5e5e5`, 13px, semibold) + detail (`#888`, 11px) stacked
  - Timestamp (monospace, `#555`, 10px) right-aligned

**Wording:** Unchanged — full status visibility is correct on your own profile:
- "Guide submitted / approved / rejected"
- "Media submitted / approved / rejected"
- "Annotation added / approved / rejected"
- "Reading progress — Chapter X reached"

**Behaviour changes:**
- The existing hard `.slice(0, 5)` inside `useMemo` is replaced by a `visibleCount` state (starts at 8) inside the component. The full sorted events array is computed; only `events.slice(0, visibleCount)` is rendered.
- A "Show more" button below the list increments `visibleCount` by 8. The button is hidden when all events are visible.
- No prop changes, no extra data fetches — all event data is already derived from the existing props.

---

### 3. New: `PublicActivityTimeline` (user detail page)

**File:** `client/src/components/PublicActivityTimeline.tsx`

**Purpose:** Shows a public-facing activity timeline for any user's profile. Approved content only — no pending or rejected statuses surfaced.

**Data source:** `api.getPublicUserSubmissions(userId)` already returns all approved submission types including guides, media, events, and annotations in a single array. No separate guide fetch is needed.

**Props:**
```ts
interface PublicActivityTimelineProps {
  submissions: any[]  // from api.getPublicUserSubmissions — approved-only, all types including guides
}
```

**Content mapping:**
| Submission type | Label shown |
|---|---|
| guide | "Guide published" |
| media | "Media contributed" |
| annotation | "Annotation added" |
| event | "Event contributed" |

Detail text: title, filename, or chapter context if available. No reading progress entry (already shown via `ReadingProgressBar`).

**Visual:** Same left-border timeline design as the restyled `ProfileFieldLog`. Identical colors per type.

**Behaviour:**
- `visibleCount` state starts at 8 (aligned with `ProfileFieldLog`)
- "Show more" button increments by 8
- Empty state: "No public contributions yet."
- Loading/error: when `submissions` is `[]` due to a fetch error (caught upstream in `UserProfileClient`), the empty state is displayed — this is acceptable behaviour

---

## Layout Changes — `UserProfileClient.tsx`

**Current right column** (lines 371–399): a `<Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', ... }}>` containing the inline reading progress block.

**New right column:** Replace that outer `<Box>` entirely with a bare `<Stack gap="md">`. Each child component (`ReadingProgressBar`, `PublicActivityTimeline`) carries its own card styling — do **not** wrap them in an outer card box.

```
[ Favorites ]  [ ReadingProgressBar  ]  ← each has own card styling
               [ PublicActivityTimeline ]
```

**Specific change:** Lines 371–399 (the right column `<Box>`) replaced by:
```tsx
<Stack gap="md">
  <ReadingProgressBar userProgress={user.userProgress} />
  <PublicActivityTimeline submissions={submissions} />
</Stack>
```

**No changes to:**
- Header block, stat strip, dossier metadata
- Contributions section (filter + list)
- Guides section
- Data fetching logic

---

## File Change Summary

| File | Change |
|---|---|
| `client/src/components/ReadingProgressBar.tsx` | **New** — shared visual component |
| `client/src/components/PublicActivityTimeline.tsx` | **New** — public activity feed |
| `client/src/app/profile/ProfileProgressReport.tsx` | **Delete** — merged into `ReadingProgressBar` |
| `client/src/app/profile/ProfileFieldLog.tsx` | **Restyle** — left-border timeline, `visibleCount` state, show more |
| `client/src/app/users/[id]/UserProfileClient.tsx` | **Update** — use `ReadingProgressBar`, add `PublicActivityTimeline`, replace right column `<Box>` with `<Stack>` |
| `client/src/app/profile/ProfilePageClient.tsx` | **Update** — import `ReadingProgressBar` instead of `ProfileProgressReport` |

---

## Non-Goals

- No backend changes
- No changes to data fetching logic or API endpoints
- No changes to admin panel
- No changes to the Contributions or Guides sections in `UserProfileClient.tsx`
