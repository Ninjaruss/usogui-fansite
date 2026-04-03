# Community Favorites Section — Visual Redesign

**Date:** 2026-04-03
**Files:** `client/src/components/FavoritesSection.tsx`, `client/src/components/FavoriteCharactersSection.tsx`

## Goal

Reduce vertical height and visual noise of the Community Favorites section on the homepage by ~40–50% while keeping all data visible and improving scannability.

## Current Problems

- `FavoriteCharactersSection` uses large center-stacked avatars (80px winner, 54px runner-up) with generous padding — each card is tall and sparse
- `FavoritesSection` content columns (Profile Pics, Quotes, Gambles) use padded nested sub-cards with borders, adding ~200px of unnecessary height
- Two separate full section headers in close succession ("Fan Favorite Characters" + section description, then "Community Favorites" heading above it all) create heavy top-weight
- Overall the section dominates too much vertical space on the homepage

## Design

### Section Header

Keep the existing "Community Favorites" heading + ♦ icon + subtitle. No change here.

### FavoriteCharactersSection — Podium Card Layout

Replace the current large stacked winner/runner-up layout with a horizontal podium card per category:

**Each podium card:**
- Thin 2px top accent bar in character theme color
- Small uppercase category label + icon (e.g., "🏆 Most Favorited")
- **Winner row**: 44px image/avatar (left) + name + stat (center) + `#1` badge pill (right), inside a subtle tinted background row with hover state
- **Runner-up row**: 30px image/avatar + name + stat, at 55% opacity — same horizontal pattern, no background fill
- Card border uses character theme color at low opacity

Remove the current large sub-section heading ("Fan Favorite Characters" title + Heart icon + description text). Replace with a quiet uppercase section divider label ("Fan Favorite Characters") between the main heading and the character grid.

### FavoritesSection Content Cards — Slim List Items

Replace the three content column cards (Popular Profile Pics, Top Quotes, Top Gambles) with slim list-item layouts:

**Card wrapper:** keeps `community-card-elevated` class and 2px top accent bar, but internal items use no nested `<Card>` components.

**Profile Pic items:**
- 34px circular avatar (left) + character name + chapter meta (center) + user count (right)
- Items separated by 1px `rgba(255,255,255,0.05)` divider
- #2 and #3 items at progressively lower opacity (0.55, 0.35)

**Quote items:**
- 2-line clamped italic quote text
- Below: character name (left) + user count (right) in muted text
- No nested card border

**Gamble items:**
- Gamble name (bold, with ♠ prefix) + 1-line clamped rule description + user count (right-aligned)
- No nested card border

### Spacing Changes

- Remove `gutter="xl"` from both grids → use `gutter="md"` (10px)
- Remove `marginBottom: '3rem'` from `FavoriteCharactersSection` wrapper → reduce to `1.5rem`
- Add a single `<Box aria-hidden>` divider line between character cards and content cards (same style as existing page dividers)
- Add a quiet `subsection-label` text element ("Fan Favorite Characters" and "Popular Content") as visual separators

## What Does NOT Change

- Data shape and API calls — no changes to `useFavoritesData` hook or backend
- Routing/links — all character/quote/gamble links preserved
- Animation — keep existing `motion/react` stagger animations
- Loading skeleton and error states
- The `community-card-elevated` CSS class (keep top accent bar + hover shadow)
- Empty state ("No favorites data yet") message

## Files to Edit

1. `client/src/components/FavoriteCharactersSection.tsx` — replace winner/runner-up layout inside `renderCategory`
2. `client/src/components/FavoritesSection.tsx` — replace nested sub-card lists with slim list items, adjust grid gutter and spacing
