# Detail Page Sub-Components — Bold Redesign

**Date:** 2026-03-15
**Scope:** 8 detail page `*PageClient.tsx` files (see Pages Affected)
**Status:** Approved

---

## Goal

Introduce a cohesive new component language across all detail page sub-components. The current pages have inconsistencies (hardcoded `#111` colors, mixed label styles) and visually flat sub-components. The new design elevates each pattern to feel purpose-built for a manga database.

---

## New Component Patterns

### 1. Section Card Header

**Entirely replaces** the current eyebrow-label + gradient line pattern. The old pattern (short leading line → uppercase label → short trailing line, with `marginTop: 24` compensation) is removed everywhere. When replacing, also remove any `marginTop: 24` on the old eyebrow `Group` wrapper.

**Card structure requirement:** The outer `<Card>` must use `padding={0}` so the accent bar renders flush to all three top edges. All inner content goes inside a `<Box p="md">` (or `p="lg"` for content-heavy cards) below the bar.

**Structure (two-part):**

**Part A — Top accent bar** (first child of `<Card>`, outside the inner `<Box>`):
```
height: 3px
borderRadius: '6px 6px 0 0'   ← matches Card's lg border-radius to avoid corner clip
background: linear-gradient(90deg, accentColor, transparent 70%)
```

**Part B — Header row** (first child inside the inner `<Box>`, `display: flex`, `align-items: center`, `gap: 10px`, `marginBottom: 14px`):
- Icon badge: `28×28px`, `border-radius: 6px`, background: `getAlphaColor(accentColor, 0.15)`, border: `1px solid getAlphaColor(accentColor, 0.30)`, containing a `size={16}` Lucide icon `color={accentColor}`
- Section title: `font-size: 0.65rem`, `font-weight: 800`, `letter-spacing: 0.18em`, `text-transform: uppercase`, `color: accentColor`, `opacity: 0.85`
- Trailing gradient line: `flex: 1`, `height: 1px`, `background: linear-gradient(to right, getAlphaColor(accentColor, 0.20), transparent)`

**`borderLeft` on description cards:** The existing `borderLeft: 3px solid accentColor` on any leading description/summary card is **removed** when the top accent bar is added. Both are never used simultaneously.

**Color helper:** Use `getEntityThemeColor(theme, entityType)` for all accent color resolution — **not** `getEntityAccent`.

**"Details" header (special case):** The icon badge slot is omitted entirely. The header row contains only the title text + trailing gradient line. No badge, no icon.

**Icon mapping per section type:**
| Section | Icon |
|---|---|
| Character description / about | `User` |
| Backstory | `Scroll` |
| Arc description | `BookOpen` |
| Gamble overview | `Crown` |
| Rules | `BookOpen` |
| Win Condition | `Trophy` |
| Explanation & Analysis | `Lightbulb` |
| Participants / Members / Organizations | `Users` |
| Chapter Navigation | `ArrowRight` |
| Volume Summary | `Book` |
| Chapter Summary | `FileText` |
| Event Description | `CalendarSearch` |
| Organization Overview | `Shield` |
| Related Gamble | `Crown` |
| Tags | `Tag` |
| Gambles in this Arc | `Crown` |
| Featured Characters | `Users` |
| Media Gallery | `Image` |
| Chapter Events | `CalendarSearch` |
| Memorable Quotes | `MessageSquareQuote` |
| Details | *(no icon badge — title + line only)* |

**Applies to:** All `<Card>` sections inside Overview and tab panels across all affected PageClient files, including aside cards (Tags, Featured Characters, Gambles in this Arc in EventPageClient).

---

### 2. Details Sidebar Card

Replaces inconsistent sidebar detail cards (raw `Box` with `#111`, `#0d1117`, `#1a1a1a` backgrounds; or `Card` without `getCardStyles`).

**Structure:**
- `<Card padding={0}>` using `getCardStyles(theme, entityColor)` — **no hardcoded colors**
- Top accent bar (Part A — `borderRadius: '6px 6px 0 0'`)
- Inner `<Box p="md">`:
  - "DETAILS" header row (Part B, no icon badge)
  - Rows: `display: flex`, `align-items: center`, `gap: 10px`, `padding: 8px 0`, `borderBottom: 1px solid #161616` (last row: no border)
    - Icon badge: `24×24px`, `border-radius: 5px`, `background: getAlphaColor(accentColor, 0.10)`, `border: 1px solid getAlphaColor(accentColor, 0.20)`, Lucide icon `size={14}` in `accentColor`
    - Label: `font-size: 11px`, `color: #555`, `flex: 1`
    - Value: `font-size: 12px`, `font-weight: 700`
      - Numeric / chapter values: `color: entityAccentColor`
      - Text links to other entities: `color: thatEntityTypeAccentColor`, rendered as `<Text component={Link}>` with `textDecoration: 'none'`
      - Plain text values (Type, Status): `color: #999`

**Icon mapping per row (all verified against installed lucide-react):**
| Row | Icon |
|---|---|
| Debut chapter | `BookOpen` |
| Chapter / chapter range | `BookOpen` |
| Gamble start chapter | `BookOpen` |
| Volume | `Book` |
| Arc | `Map` |
| Organization | `Building2` |
| Gambles count | `Crown` |
| Arcs count | `Bookmark` |
| Players / Members count | `Users` |
| Sub-arcs count | `GitBranch` |
| Events count | `CalendarSearch` |
| Type | `Tag` |
| Status | `Check` |

**Applies to:** Characters, Arcs, Gambles, Volumes, Chapters, Events, Organizations.

---

### 3. Character / Entity Chips

Replaces plain `<Badge>` chips used in participants, featured characters, and faction member lists.

**Structure:**
- Container: `background: #131313`, `border: 1px solid #222`, `border-radius: 8px`, `padding: 6px 10px`, `display: flex`, `align-items: center`, `gap: 8px`, rendered as `<Link>` to the character's detail page
- Avatar circle: `28×28px`, `border-radius: 50%`
  - **Show entity image** when: `character.imageFileName` is present AND `(character.firstAppearanceChapter ?? 0) <= (user?.userProgress ?? 0)`. Image URL: `/api/media/character/{imageFileName}`. Rendered as `<img>` with `object-fit: cover`, `border-radius: 50%`.
  - **Initials fallback** (all other cases — missing field, spoiler gate, unauthenticated): first letter(s) of name (up to 2 chars), `font-size: 10px`, `font-weight: 700`, `color: accentColor`, `background: getAlphaColor(accentColor, 0.20)`, `border: 1px solid getAlphaColor(accentColor, 0.40)`.
- Name: `font-size: 13px`, `font-weight: 600`, `color: #ddd`
- Role label (optional, shown when `role` is non-null): `font-size: 10px`, `color: #555`
- Hover state on container: `borderColor` shifts to entity accent color

**Data note:** `GambleFactionMember.character` lacks `imageFileName` and `firstAppearanceChapter` — will always render initials. Intentional; no data change required.

**Applies to:** Featured Characters sections (Chapter, Event pages); faction member lists (Gamble page).

---

### 4. Quote Cards

**Structure:**
- `<Card radius="xl" padding={0}>` with `getCardStyles(theme, entityColor)` — `radius="xl"` = `12px` in this theme (`theme.radius.xl`), not `lg` (= 8px)
- Top accent bar (Part A — `borderRadius: '12px 12px 0 0'` to match `xl` radius)
- Inner `<Box p="md" style={{ position: 'relative' }}>`:
  - Large decorative `"` character: `position: absolute`, `top: 8px`, `left: 14px`, `font-size: 60px`, `line-height: 1`, `color: accentColor`, `opacity: 0.12`, `font-family: Georgia, serif`, `pointer-events: none`, `user-select: none`
  - Quote text: `position: relative` (above the `"` glyph), `font-style: italic`, `font-size: 14px`, `line-height: 1.65`, `padding-left: 10px`, `border-left: 2px solid getAlphaColor(accentColor, 0.40)`
  - Footer row (`display: flex`, `align-items: center`, `gap: 8px`, `margin-top: 12px`):
    - Author chip: `border-radius: 20px`, `padding: 3px 10px`, `background: getAlphaColor(accentColor, 0.12)`, `border: 1px solid getAlphaColor(accentColor, 0.25)`, `font-size: 12px`, `font-weight: 600`, `color: accentColor`. Text: `— {quote.character.name}` (the `character` field on the `Quote` interface)
    - Page number (when `quote.pageNumber` is set): `font-size: 11px`, `color: #444`. Text: `p.{quote.pageNumber}`

**Applies to:** Chapters page Quotes tab (`Tabs.Panel value="quotes"`).

---

### 5. Event Cards

**Required interface change:** In `ChapterPageClient.tsx`, add `type?: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution'` to the local `Event` interface (matches the global type in `types/index.ts`).

**Structure:**
- Outer element: `background: backgroundStyles.card` (or `getCardStyles(theme).background`), `border: 1px solid #1e1e1e`, `border-left: 3px solid typeColor`, `border-radius: 0 10px 10px 0`, `padding: 12px 14px`, `display: flex`, `gap: 12px`, `align-items: flex-start`, rendered as `<Link>` to `/events/{event.id}`
- Hover: `background: #131313`
- Type badge: `border-radius: 4px`, `padding: 2px 6px`, `font-size: 10px`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.05em`, `background: getAlphaColor(typeColor, 0.15)`, `border: 1px solid getAlphaColor(typeColor, 0.30)`, `color: typeColor`, `flex-shrink: 0`, `margin-top: 2px`
- Title: `font-size: 14px`, `font-weight: 600`, `color: #ddd`
- Description: `font-size: 12px`, `color: #666`, `lineClamp: 2`

**`typeColor` mapping:**
```ts
const eventTypeColor: Record<string, string> = {
  gamble: '#e11d48',
  reveal: '#f59e0b',
  decision: '#3b82f6',
  shift: '#a855f7',
  resolution: '#22c55e',
}
const typeColor = event.type ? (eventTypeColor[event.type] ?? getEntityThemeColor(theme, 'event')) : getEntityThemeColor(theme, 'event')
```

**Applies to:** Chapters page Events tab (`Tabs.Panel value="events"`).

---

### 6. Gamble Faction Display

**Per-faction card structure** (`flex: 1`, `min-width: 0`, `border: 1px solid #1e1e1e`, `border-radius: 12px`, `overflow: hidden`):
- Header band: `padding: 10px 14px`, `display: flex`, `align-items: center`, `gap: 8px`, `background: getAlphaColor(factionAccentColor, 0.10)`, `border-bottom: 1px solid getAlphaColor(factionAccentColor, 0.20)`
  - Faction dot: `8×8px` circle, `background: factionAccentColor`
  - Faction name: `font-size: 13px`, `font-weight: 700`, `color: #ddd`
- Body: `padding: 10px 12px`, `background: #0e0e0e`
  - Member row: `display: flex`, `align-items: center`, `gap: 8px`, `padding: 6px 0`, `border-bottom: 1px solid #161616` (last: none)
  - Avatar (22×22px, `font-size: 9px`) — always initials (no image data available for faction members)
  - Member name: `font-size: 12px`, `font-weight: 600`, `color: #ddd`
  - Role pill: `margin-left: auto`, `background: #1a1a1a`, `border: 1px solid #252525`, `border-radius: 20px`, `padding: 2px 8px`, `font-size: 10px`, `color: #555`, `text-transform: capitalize`

**Faction accent colors:** For 2-faction layout: `gambleColor` for `displayOrder: 0`, `characterColor` for `displayOrder: 1`. For 3+ layout: `gambleColor` for all factions.

**2-faction layout:** `display: flex`, `align-items: stretch`, faction cards with VS divider between:
- VS divider: two vertical gradient lines (`flex: 1`, `width: 1px`, min-height: 30px, gradient transparent→`#333`→transparent) flanking `"VS"` text (`font-size: 1.1rem`, `font-weight: 800`, `color: #e11d48`, `text-shadow: 0 0 14px rgba(225,29,72,0.5)`, `font-family: Georgia, serif`)

**3+ faction layout:** `<Grid gutter="md">` with `<Grid.Col span={{ base: 12, md: 6 }}>` per faction. No VS divider.

**Applies to:** Gamble page Overview tab Participants section.

---

### 7. Media Tab Panel Header

Standardizes the Media tab `<Card>` header across all pages with a Media tab.

**Current inconsistencies:**
- Characters, Arcs, Gambles, Organizations: `<ImageIcon size={20}> + <Title order={4}>` pattern
- Events: eyebrow gradient pattern

**New:** All use the Section Card Header pattern (Pattern 1) with the `Image` Lucide icon. The `<Card padding={0}>` wrapper uses `getCardStyles(theme, mediaColor)` where `mediaColor = getEntityThemeColor(theme, 'media')`. "View All" button is right-aligned using `justify-content: space-between` on the header's parent `<Group>`.

**Applies to:** Characters, Arcs, Gambles, Events, Organizations (all pages with a `Tabs.Panel value="media"`).

---

## Consistency Fixes

1. **All Details cards** → `<Card padding={0}>` + `getCardStyles(theme, entityColor)`. Eliminate all hardcoded background values: `#111`, `#0d1117`, `#1a1a1a`, raw `Box` wrappers used as cards.
2. **`RelatedContentSection` wrapper `<Card>` elements** in CharacterPageClient sidebar (Story Arcs, Gambles, Quotes cards) → `getCardStyles(theme, entityColor)` instead of `background: '#111'`.
3. **CharacterPageClient section labels** — the three `fontSize: 9, color: '#555'` plain `<Text>` labels (Description, Backstory, Organizations cards) → Pattern 1 section card header.
4. **CharacterPageClient Organizations card** — add Pattern 1 header with `Users` icon, title `"ORGANIZATIONS"`.
5. **`marginTop: 24` removal** — when replacing any old eyebrow `Group`, remove its `marginTop: 24`. Pattern 1 header row uses `marginBottom: 14px`; card body `<Box p="md">` provides top spacing.
6. **Redundant floating icons** — remove standalone `<BookOpen size={24}>` in ArcPageClient description card (lines ~251–253) and `<Crown size={24}>` in GamblePageClient description card. The icon moves into the section header badge.
7. **EventPageClient aside cards** — the Tags card and "Gambles in This Arc" card currently use the eyebrow gradient pattern with their own `marginBottom`/`marginTop` values. Both receive Pattern 1 header treatment (`Tag` icon for Tags, `Crown` icon for Gambles in Arc).
8. **Color helper** — consistently use `getEntityThemeColor(theme, entityType)` everywhere. Do not use `getEntityAccent`.

---

## Pages Affected

| Page | Changes |
|---|---|
| `CharacterPageClient` | Pattern 1 on all section cards (Description, Backstory, Organizations); Pattern 2 Details card + RelatedContentSection wrapper cards; Pattern 3 for Organizations chip display; fix `fontSize: 9` plain labels |
| `ArcPageClient` | Pattern 1 on all section cards; Pattern 2 Details card; remove floating `<BookOpen size={24}>` |
| `GamblePageClient` | Pattern 1 on all section cards; Pattern 2 Details card (fix raw `Box`); Pattern 3 for faction member chips; Pattern 6 faction display |
| `VolumePageClient` | Pattern 1 on all section cards; Pattern 2 Details card |
| `ChapterPageClient` | Pattern 1 on all section cards; Pattern 2 Details card (fix raw `Box` + `#0d1117`); Pattern 3 for featured character chips; Pattern 4 Quote cards; Pattern 5 Event cards (+ `type` union on `Event` interface) |
| `EventPageClient` | Pattern 1 on all section cards including Tags and Gambles in Arc aside cards; Pattern 2 Details card; Pattern 3 for featured character chips; Pattern 7 Media tab header |
| `OrganizationPageClient` | Pattern 1 on section card; Pattern 2 Details card (fix raw `Box`); Pattern 7 Media tab header |

`GuidePageClient` — **not in scope**. No Media tab, different content paradigm.

---

## Out of Scope

- `DetailPageHeader` (hero), tab list styling, `AnnotationSection`, `MediaGallery`, timeline components, `RelatedContentSection` list items, user profile page, `GuidePageClient`

---

## Implementation Notes

- All changes are **inline JSX** within each `*PageClient.tsx` — no new shared component files required
- `getEntityThemeColor(theme, entityType)` available in all files via existing import
- `getAlphaColor(color, alpha)` available via existing import from `../../../lib/mantine-theme`
- Character image URL: `/api/media/character/{imageFileName}` — same pattern used in `DetailPageHeader`
- Spoiler check: `(character.firstAppearanceChapter ?? 0) <= (user?.userProgress ?? 0)` — evaluates `false` (initials fallback) when either field is absent
- `quote.character` holds the speaker (not `quote.author`)
- Quote Cards: `radius="xl"` = 12px; accent bar uses `borderRadius: '12px 12px 0 0'`
- All other cards: `radius="lg"` = 8px (default from `getCardStyles`); accent bar uses `borderRadius: '6px 6px 0 0'`
- No new API calls introduced
