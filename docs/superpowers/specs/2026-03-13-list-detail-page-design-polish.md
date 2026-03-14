# List & Detail Page Design Polish

**Date:** 2026-03-13
**Approach:** Component-Level Redesign (Approach 2)
**Scope:** All 10 list pages + 8 detail pages via shared component upgrades

---

## Overview

A comprehensive visual overhaul of all list and detail pages through targeted redesigns of 7 shared files. No data logic or routing changes. Every improvement is self-contained within component internals or global CSS, with one minor exception: each detail page's `children` prop must have its name `<Title>` element removed (see Section 2).

**Design direction approved by user:**
- **Cards:** Dark & Dramatic (deep blacks, entity-color glows, heavy shadows)
- **Detail headers:** Cinematic (centered portrait, atmospheric background, name overlaid)
- **Tabs:** Glowing Pill (gradient fill + ambient glow on active tab)

---

## Files To Change

| File | Nature of change |
|------|-----------------|
| `client/src/components/cards/PlayingCard.tsx` | Visual — border, gradients, scan-line texture, name box |
| `client/src/components/layouts/DetailPageHeader.tsx` | Layout + visual — two-column → cinematic centered |
| `client/src/components/layouts/ListPageHero.tsx` | Visual — deeper bg, stronger icon glow, scan-line overlay |
| `client/src/components/layouts/SearchToolbar.tsx` | Visual — sticky state: darker bg, stronger border glow |
| `client/src/components/layouts/PaginationBar.tsx` | Visual — active page gets gradient glow to match tabs |
| `client/src/components/HoverModal.tsx` | Visual — top accent stripe, eyebrow label, separator rule |
| `client/src/app/globals.css` | CSS — tab glowing pill styles, card hover intensification |

**Detail page call-site cleanup (8 files):** Each detail page client file passes a `<Title>` rendering the entity name as the first element of `children` inside `DetailPageHeader`. Because the cinematic layout now renders the entity name from `entityName`, that `<Title>` must be removed from `children` in all 8 files to prevent duplication:

- `client/src/app/characters/[id]/CharacterPageClient.tsx`
- `client/src/app/gambles/[id]/GamblePageClient.tsx`
- `client/src/app/arcs/[id]/ArcPageClient.tsx`
- `client/src/app/guides/[id]/GuidePageClient.tsx`
- `client/src/app/volumes/[id]/VolumePageClient.tsx`
- `client/src/app/chapters/[id]/ChapterPageClient.tsx`
- `client/src/app/events/[id]/EventPageClient.tsx`
- `client/src/app/organizations/[id]/OrganizationPageClient.tsx`

---

## Section 1 — PlayingCard

**File:** `client/src/components/cards/PlayingCard.tsx`

### Changes

**Card border & outer glow**
- Border: `accentColor` at **35% alpha** (up from 18%)
- Box-shadow: add outer ambient glow `0 0 20px ${accentColor}40` alongside existing shadow
- Increase base box-shadow depth: `0 4px 20px rgba(0,0,0,0.6)` (up from `0 2px 10px`)

**Image area**

The existing bottom gradient (`linear-gradient(0deg, ${accentColor}24 0%, transparent 100%)`) is a full replacement, not an adjustment. Replace it entirely with a two-layer composite:
- Layer 1 (bottom): `linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)` at **70% height**
- Layer 2 (accent tint over Layer 1): `linear-gradient(0deg, ${accentColor}15 0%, transparent 100%)` at **30% height**, stacked above Layer 1 via a second absolutely-positioned `Box`

Additional overlays on the image area `Box`:
- Horizontal scan-line texture: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)`
- Subtle radial glow at top-center: `radial-gradient(ellipse at 50% 30%, ${accentColor}07, transparent 65%)`

**Suit watermark**
- Opacity: `0.18` → `0.32`
- Add `filter: drop-shadow(0 0 4px ${accentColor}50)` to the SVG element

**Eyebrow label**
- Keep background alpha at `${accentColor}20`; add `textShadow: \`0 0 8px ${accentColor}60\``

**Name box**
- Border: `${accentColor}55` → `${accentColor}65`
- Box-shadow: add `0 0 14px ${accentColor}28` (ambient glow) + `inset 0 1px 0 rgba(255,255,255,0.07)` to the existing shadow stack
- Background: deepen to `linear-gradient(180deg, rgba(4,2,2,0.92), rgba(8,5,5,0.97))`

---

## Section 2 — DetailPageHeader (Cinematic)

**File:** `client/src/components/layouts/DetailPageHeader.tsx`

### Layout Change

Remove the two-column `Group` layout. Replace with a single centered `Stack`:

```
[atmospheric background area — position: relative, overflow: hidden]
  ├── eyebrow entity-type label (centered, absolute top)
  ├── portrait image (centered, absolute/static with glow)
  ├── entity name Title (centered, bottom of atmospheric area)
  └── heavy bottom gradient fade into page bg
[children area — centered Group below atmospheric section]
  └── badges, stats, quick actions (Title removed from children — see call-site cleanup)
```

### Atmospheric Background Layer

- Dark base: `background: rgba(8, 8, 16, 1)` (the Card's background)
- Entity tint: `linear-gradient(180deg, ${accentColor}10 0%, ${accentColor}02 100%)` as an absolute overlay
- Radial accent bloom centered top: `radial-gradient(ellipse at 50% 0%, ${accentColor}20, transparent 65%)`
- Halftone dot pattern (existing `mangaPatterns.halftoneBackground` — keep)
- Speed lines (existing `SpeedLines` — keep)
- Suit watermark (existing `EntitySuitWatermark` — keep, increase size to `200`, opacity `0.09`)
- Horizontal scan-line texture: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.14) 3px, rgba(0,0,0,0.14) 4px)`
- Heavy bottom gradient fade: `linear-gradient(transparent, ${backgroundStyles.page(theme)})` over bottom 40% height — use `backgroundStyles.page(theme)` (already imported) to get the correct page background color for a seamless blend

### Portrait Image

- Centered horizontally (margin: `0 auto` or centered Stack)
- `imageWidth` default stays `200px`, `imageHeight` default stays `280px`
- Border: `2px solid ${accentColor}` at 70% alpha (`${accentColor}B3`)
- Box-shadow: `0 0 40px ${accentColor}45, 0 12px 40px rgba(0,0,0,0.8)`
- Remove the vignette radial-gradient overlay that was on the inner image Box — the atmospheric bg provides sufficient depth

### Entity Label Above Portrait

- Centered, rendered as an eyebrow-label above the portrait image
- `background: ${accentColor}15`, `border: 1px solid ${accentColor}40`
- `textShadow: 0 0 8px ${accentColor}60`

### Entity Name Overlay

- Centered, at bottom of the atmospheric area
- `fontSize: '2rem'`, serif font (`var(--font-opti-goudy-text), serif`), `fontWeight: 800`
- `textShadow: '0 2px 20px rgba(0,0,0,0.95), 0 0 40px ${accentColor}20'`
- Rendered as `<Title order={1}>` using `entityName` prop

### Children Area

- Rendered below the atmospheric section in a centered `Group` with `justify="center"` and `wrap="wrap"`
- `padding: theme.spacing.md theme.spacing.lg`
- `borderTop: \`1px solid ${accentColor}15\``
- `background: rgba(0,0,0,0.2)` tint
- **The `<Title>` element rendering the entity name must be removed from `children` in all 8 call-site files** (listed in Files To Change above). What remains in `children`: alternate name badges, chapter/first-appearance badges, organization badges, quick-action buttons, and stat groups.

### Props

No API changes. All existing props (`entityType`, `entityId`, `entityName`, `children`, `imageWidth`, `imageHeight`, `showImage`) remain identical.

---

## Section 3 — Tabs (globals.css)

**File:** `client/src/app/globals.css`

### Changes

Replace the current solid-fill active tab style with a glowing pill approach. The tab list container gets a dark pill wrapper.

**All selectors must include all 8 entity types:** `character`, `gamble`, `arc`, `guide`, `volume`, `organization`, `chapter`, `event`. Apply changes to all four existing selector groups (base tab, hover, active, disabled) — not only the new blocks below.

**Tab list container** — new block targeting `.mantine-Tabs-list`:
```css
.character-tabs .mantine-Tabs-list,
.gamble-tabs .mantine-Tabs-list,
.arc-tabs .mantine-Tabs-list,
.guide-tabs .mantine-Tabs-list,
.volume-tabs .mantine-Tabs-list,
.organization-tabs .mantine-Tabs-list,
.chapter-tabs .mantine-Tabs-list,
.event-tabs .mantine-Tabs-list {
  background: rgba(0, 0, 0, 0.45);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  gap: 2px;
}
```

**Base tab** — extend existing base selector to include missing entity types (`volume`, `organization`, `chapter`, `event`) and add `border-radius: 7px !important` to the base style.

**Active tab** — replace solid `background-color: var(--color-X)` with gradient + glow for all 8 entity types. Where possible, use the CSS custom properties set by `setTabAccentColors` (e.g., `var(--tab-active-bg)`, `var(--tab-active-outline)`) rather than hardcoded `rgba` values, to stay in sync with `mantine-theme.ts`. The example below uses hardcoded values for clarity — substitute CSS variables in the implementation. Pattern (repeat for all 8 entity types):
```css
/* example for character — repeat for all 8 entity types */
.character-tabs .mantine-Tabs-tab[data-active="true"],
.character-tabs .mantine-Tabs-tab[data-active],
.character-tabs .mantine-Tabs-tab[aria-selected="true"],
.character-tabs [data-active="true"],
.character-tabs [data-active],
.character-tabs [aria-selected="true"] {
  background: linear-gradient(135deg, rgba(77, 171, 247, 0.45), rgba(77, 171, 247, 0.20)) !important;
  border: 1px solid rgba(77, 171, 247, 0.55) !important;
  border-radius: 7px !important;
  box-shadow: 0 0 16px rgba(77, 171, 247, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
  color: #ffffff !important;
}
```

**Hover state** — update hover background alpha from `0.25` → `0.18` across all entity types, and add `border-radius: 7px !important` for shape consistency.

**Disabled state** — extend to include `volume`, `organization`, `chapter`, `event` in both the disabled and disabled-hover selector groups.

---

## Section 4 — ListPageHero

**File:** `client/src/components/layouts/ListPageHero.tsx`

### Changes

**Background**
- Deepen hero gradient: strengthen entity-color tint from `${accentColor}06` to `${accentColor}10` (top), fading to `${accentColor}02`
- Add horizontal scan-line overlay: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)` as an additional absolute `Box`

**Icon circle**
- `box-shadow`: strengthen outer glow stop from `${accentColor}60` → `${accentColor}70`; strengthen spread glow from `${accentColor}20` → `${accentColor}28`
- Add `inset 0 1px 0 rgba(255,255,255,0.20)` to shadow stack

**Diamond rule**
- Increase gradient stop opacity: `${accentColor}30` → `${accentColor}50`
- Diamond `♦` character color: `${accentColor}90` → `${accentColor}` (full opacity)

**Count badge**
- Verify `textShadow: \`0 0 12px ${accentColor}60\`` is present (already in code — confirm it's not removed)
- Add `boxShadow: \`0 0 16px ${accentColor}12\`` outer glow to the Badge `style`

---

## Section 5 — SearchToolbar (sticky state)

**File:** `client/src/components/layouts/SearchToolbar.tsx`

### Changes (stuck/sticky state only)

- Background: `rgba(12,8,8,0.94)` → `rgba(8,8,16,0.97)` (deeper, cooler dark)
- Left border: `${accentColor}80` → `${accentColor}` (full opacity — remove the `80` alpha suffix)
- Box-shadow left glow: existing `-4px 0 16px ${accentColor}15` → `-4px 0 24px ${accentColor}20` (increase both spread and alpha)
- Bottom gradient separator: increase accent stop from `${accentColor}40` → `${accentColor}55`

**Input focus state**
- Focus box-shadow: existing `0 0 16px ${accentColor}18` → `0 0 20px ${accentColor}22` (increase both spread and alpha for stronger focus feedback)

---

## Section 6 — PaginationBar

**File:** `client/src/components/layouts/PaginationBar.tsx`

### Changes

**Active page button** — update `styles` prop on `Pagination` component:
```tsx
control: {
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  color: '#ffffff',
  transition: 'all 200ms ease',
  minWidth: rem(36),
  height: rem(36),
  borderRadius: '6px',  // was 4px
  '&[data-active]': {
    background: `linear-gradient(135deg, ${accentColor}50, ${accentColor}25)`,
    border: `1px solid ${accentColor}70`,
    boxShadow: `0 0 14px ${accentColor}35, inset 0 1px 0 rgba(255,255,255,0.10)`,
    color: '#ffffff',
  }
}
```

**Count label**: add `textShadow: \`0 0 12px ${accentColor}30\`` to the results info `Text` element

---

## Section 7 — HoverModal

**File:** `client/src/components/HoverModal.tsx`

### Changes

**New prop** — add `entityLabel?: string` to `HoverModalProps` interface. All call sites (in each `*PageContent.tsx` that renders a `HoverModal`) should pass `entityLabel={entityType}`, where `entityType` is the same string already used to set the tab accent class (e.g., `"character"`, `"gamble"`, `"arc"`). This is additive and non-breaking.

**Top accent stripe** — render as the very first child inside `Paper`, before the scan-line overlay Box. To render flush with the Paper's top and side edges (avoiding the `p="md"` padding), use negative margins:
```tsx
<Box aria-hidden style={{
  height: 3,
  background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}66 60%, transparent 100%)`,
  borderRadius: `${rem(12)} ${rem(12)} 0 0`,
  marginTop: rem(-16),
  marginLeft: rem(-16),
  marginRight: rem(-16),
  marginBottom: rem(8),
}} />
```
(`rem(16)` matches Mantine's `p="md"` = 16px. `rem(12)` matches `radius="lg"` = 12px.)

**Eyebrow entity label** — render at top of the content Stack (inside `Box style={{ position: 'relative', zIndex: 1 }}`), using the new `entityLabel` prop:
```tsx
{entityLabel && (
  <Text
    className="eyebrow-label"
    style={{ color: accentColor, fontSize: '0.6rem', letterSpacing: '0.22em' }}
  >
    {entityLabel.toUpperCase()}
  </Text>
)}
```

**Outer glow** — update `boxShadow` on Paper:
- `0 24px 48px rgba(0,0,0,0.7)` → `0 24px 48px rgba(0,0,0,0.80)`
- `0 0 0 1px ${accentColor}30` → `0 0 0 1px ${accentColor}20`
- Add: `0 0 32px ${accentColor}08` (ambient outer glow)

**Background**: change the Paper's `backgroundColor` from `backgroundStyles.modal` to `rgba(6,6,14,0.97)`

---

## Implementation Notes

### Prop API Compatibility
- `PlayingCard`: no prop changes
- `DetailPageHeader`: no prop changes
- `ListPageHero`: no prop changes
- `SearchToolbar`: no prop changes
- `PaginationBar`: no prop changes
- `HoverModal`: add optional `entityLabel?: string` prop (additive, non-breaking)

### Detail Page Call-Site Cleanup
The 8 detail page client files each need one targeted removal: delete the `<Title order={1}>` element that renders the entity name inside the `DetailPageHeader` children. Everything else in `children` (alternate names, chapter/org badges, quick actions) stays intact. This is the only change needed in those files.

### globals.css Entity Type Coverage
The four selector groups in globals.css (base tab, hover, active, disabled) currently cover only `character`, `gamble`, `arc`, `guide`. All four groups must be extended to include `volume`, `organization`, `chapter`, `event`. The new pill-container block also needs all 8 entity types.

### Consistency Pattern
Every glow/shadow across all components follows the same formula:
- **Ambient glow**: `0 0 Xpx ${accentColor}YY` where YY = 25–45%
- **Depth shadow**: `0 Npx Mpx rgba(0,0,0,0.70–0.85)`
- **Inset highlight**: `inset 0 1px 0 rgba(255,255,255,0.06–0.10)`

### CSS Variable Approach
The `setTabAccentColors` function in `mantine-theme.ts` already sets `--tab-active-bg`, `--tab-active-outline` etc. on `document.documentElement`. The new glowing pill styles in globals.css should reference these variables where possible to stay in sync with the existing system.

---

## Out of Scope

- Data fetching, routing, or state management changes
- New pages or page structure changes
- Admin panel, auth pages, submit pages
- Mobile layout restructuring (responsive behavior preserved as-is)
- Accessibility beyond what already exists
- EntityCardGrid, CardGridSkeleton, EmptyState, BreadcrumbNav (no visual changes needed for this pass)

---

## Success Criteria

1. All 10 list pages render with enhanced PlayingCards and more dramatic ListPageHero
2. All 8 detail pages render with cinematic centered header (portrait + name overlay + badges below)
3. **Entity name appears exactly once** on each detail page — the cinematic overlay renders it; no duplicate `<Title>` remains in `children` across all 8 call-site files
4. Tabs on all 8 entity types display the glowing pill style
5. HoverModal shows flush top accent stripe and eyebrow entity label
6. PaginationBar active page matches tab glow treatment
7. SearchToolbar sticky state is visually darker and more defined
8. No TypeScript errors (`yarn build` passes in `client/`)
9. One additive prop change only (`HoverModal.entityLabel`); no breaking changes to any other component API
