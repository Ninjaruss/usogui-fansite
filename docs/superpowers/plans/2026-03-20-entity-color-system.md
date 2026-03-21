# Entity Color System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every entity type a unique, visually distinct color by creating a single source of truth color file and propagating it through both the Mantine and MUI admin themes.

**Architecture:** A new `entityColors.ts` file exports `ENTITY_COLORS` (a const record of entity → hex) and a safe `getEntityColor` accessor. Both theme files (`mantine-theme.ts` and `theme.ts`) import from it, ensuring the three color stores (`theme.other.usogui`, `textColors`, `palette.usogui`) are always in sync.

**Tech Stack:** TypeScript, Mantine UI v8.3.1, MUI v6.5.0, Next.js 15 (App Router). All commands run from the `client/` directory. Use `yarn` (never npm).

---

## Approved Color Map (reference for all tasks)

| Entity | Hex | Color Name |
|---|---|---|
| `gamble` | `#ff3333` | Pure Red |
| `arc` | `#ff7a00` | Vivid Orange |
| `annotation` | `#ffd700` | Gold |
| `event` | `#99dd00` | Chartreuse |
| `guide` | `#22bb55` | Emerald |
| `organization` | `#00ccbb` | Teal |
| `quote` | `#00ccee` | Cyan |
| `chapter` | `#2299ff` | Royal Blue |
| `character` | `#8877ff` | Indigo |
| `volume` | `#dd44ff` | Violet |
| `media` | `#ff3399` | Hot Pink |

---

## Files

| File | Action |
|---|---|
| `client/src/lib/entityColors.ts` | **Create** — canonical color map + accessor |
| `client/src/lib/mantine-theme.ts` | **Modify** — `EntityAccentKey`, `colors` palettes, `theme.other.usogui`, `textColors`, `getEntityAccent`, `getEntityThemeColor`, `setTabAccentColors` |
| `client/src/lib/manga-decorations.ts` | **Modify** — add `annotation` to `entitySuit` |
| `client/src/lib/theme.ts` | **Modify** — add missing keys to TypeScript interfaces + runtime palette, update all entity hex values |

---

## Task 1: Create `entityColors.ts`

**Files:**
- Create: `client/src/lib/entityColors.ts`

- [ ] **Step 1: Create the file**

```typescript
// client/src/lib/entityColors.ts

/**
 * Single source of truth for entity accent colors.
 * All theme files (mantine-theme.ts, theme.ts) import from here.
 * To change an entity's color, edit only this file.
 */
export const ENTITY_COLORS = {
  gamble:       '#ff3333', // Pure Red      (0°)
  arc:          '#ff7a00', // Vivid Orange  (29°)
  annotation:   '#ffd700', // Gold          (51°)
  event:        '#99dd00', // Chartreuse    (88°)
  guide:        '#22bb55', // Emerald       (141°)
  organization: '#00ccbb', // Teal          (175°)
  quote:        '#00ccee', // Cyan          (191°)
  chapter:      '#2299ff', // Royal Blue    (214°)
  character:    '#8877ff', // Indigo        (245°)
  volume:       '#dd44ff', // Violet        (288°)
  media:        '#ff3399', // Hot Pink      (330°)
} as const

export type EntityColorKey = keyof typeof ENTITY_COLORS

/** Safe accessor with fallback to Usogui brand red */
export const getEntityColor = (type: EntityColorKey): string =>
  ENTITY_COLORS[type] ?? '#e11d48'
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -30
```

Expected: no errors related to `entityColors.ts`.

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/entityColors.ts
git commit -m "feat: add entityColors.ts — single source of truth for entity accent colors"
```

---

## Task 2: Add `annotation` to `EntityAccentKey`, `entitySuit`, and `setTabAccentColors`

Adding `annotation` to the `EntityAccentKey` union will cause two TypeScript compile errors in files that use `Record<EntityAccentKey, ...>`. Fix all three in one commit.

**Files:**
- Modify: `client/src/lib/mantine-theme.ts` (lines 557–568 and 697–708)
- Modify: `client/src/lib/manga-decorations.ts` (lines 12–23)

- [ ] **Step 1: Add `annotation` to `EntityAccentKey` in `mantine-theme.ts`**

Find this block (around line 557):

```typescript
export type EntityAccentKey =
  | 'character'
  | 'organization'
  | 'arc'
  | 'volume'
  | 'chapter'
  | 'event'
  | 'guide'
  | 'media'
  | 'quote'
  | 'gamble'
```

Replace with:

```typescript
export type EntityAccentKey =
  | 'character'
  | 'organization'
  | 'arc'
  | 'volume'
  | 'chapter'
  | 'event'
  | 'guide'
  | 'media'
  | 'quote'
  | 'gamble'
  | 'annotation'
```

- [ ] **Step 2: Add `annotation` to `setTabAccentColors` accentColorMap in `mantine-theme.ts`**

Find this block (around line 697):

```typescript
  const accentColorMap: Record<EntityAccentKey, string> = {
    character: textColors.character,
    organization: textColors.organization,
    arc: textColors.arc,
    volume: textColors.volume,
    chapter: textColors.chapter,
    event: textColors.event,
    guide: textColors.guide,
    media: textColors.media,
    quote: textColors.quote,
    gamble: textColors.gamble
  }
```

Replace with:

```typescript
  const accentColorMap: Record<EntityAccentKey, string> = {
    character: textColors.character,
    organization: textColors.organization,
    arc: textColors.arc,
    volume: textColors.volume,
    chapter: textColors.chapter,
    event: textColors.event,
    guide: textColors.guide,
    media: textColors.media,
    quote: textColors.quote,
    gamble: textColors.gamble,
    annotation: textColors.annotation
  }
```

- [ ] **Step 3: Add `annotation` to `entitySuit` in `manga-decorations.ts`**

Find this block (around line 12):

```typescript
export const entitySuit: Record<EntityAccentKey, 'spade' | 'heart' | 'diamond' | 'club'> = {
  gamble: 'spade',
  character: 'heart',
  arc: 'diamond',
  event: 'club',
  volume: 'diamond',
  chapter: 'spade',
  guide: 'heart',
  media: 'club',
  quote: 'heart',
  organization: 'club'
}
```

Replace with:

```typescript
export const entitySuit: Record<EntityAccentKey, 'spade' | 'heart' | 'diamond' | 'club'> = {
  gamble: 'spade',
  character: 'heart',
  arc: 'diamond',
  event: 'club',
  volume: 'diamond',
  chapter: 'spade',
  guide: 'heart',
  media: 'club',
  quote: 'heart',
  organization: 'club',
  annotation: 'diamond'
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -30
```

Expected: no errors about `EntityAccentKey` being incomplete.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/mantine-theme.ts client/src/lib/manga-decorations.ts
git commit -m "feat: add annotation to EntityAccentKey, setTabAccentColors, and entitySuit"
```

---

## Task 3: Update `textColors` entity values in `mantine-theme.ts`

**Files:**
- Modify: `client/src/lib/mantine-theme.ts` (lines 758–783)

- [ ] **Step 1: Add import at the top of `mantine-theme.ts`**

After the existing imports at the top of the file, add:

```typescript
import { ENTITY_COLORS } from './entityColors'
```

- [ ] **Step 2: Replace entity color values in `textColors`**

Find this block (around line 771):

```typescript
  // Entity-specific text colors - 5 color groups
  gamble: '#ff5555',     // Red group
  character: '#4dabf7',  // Blue group
  arc: '#f97316',        // Orange group
  volume: '#a855f7',     // Purple group
  chapter: '#4dabf7',    // Blue group (shared with character)
  event: '#f97316',      // Orange group (shared with arc)
  guide: '#51cf66',      // Green group
  media: '#a855f7',      // Purple group
  quote: '#51cf66',      // Green group (shared with guide)
  organization: '#a855f7', // Purple group (shared with media)
  annotation: '#ff922b'  // Orange group (distinct lighter orange)
```

Replace with:

```typescript
  // Entity-specific text colors — all unique, imported from entityColors.ts
  gamble:       ENTITY_COLORS.gamble,
  character:    ENTITY_COLORS.character,
  arc:          ENTITY_COLORS.arc,
  volume:       ENTITY_COLORS.volume,
  chapter:      ENTITY_COLORS.chapter,
  event:        ENTITY_COLORS.event,
  guide:        ENTITY_COLORS.guide,
  media:        ENTITY_COLORS.media,
  quote:        ENTITY_COLORS.quote,
  organization: ENTITY_COLORS.organization,
  annotation:   ENTITY_COLORS.annotation,
```

Note: `textColors` is declared `as const`. Replacing hardcoded strings with imported variable references means TypeScript will widen those keys from literal types (e.g. `'#4dabf7'`) to `string`. This is fine — `textColors` is used for runtime color values, not literal-type checking. Keep `as const` on the object; the string widening on entity keys is acceptable.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/mantine-theme.ts
git commit -m "feat: update textColors entity values from entityColors.ts"
```

---

## Task 4: Update `theme.other.usogui` and fix helper functions in `mantine-theme.ts`

**Files:**
- Modify: `client/src/lib/mantine-theme.ts` (lines 506–527, 569–598, 609–625)

- [ ] **Step 1: Replace entity values in `theme.other.usogui`**

Find this block (around line 511):

```typescript
      gamble: '#ff5555',     // Red group
      character: '#4dabf7',  // Blue group
      arc: '#f97316',        // Orange group
      volume: '#a855f7',     // Purple group
      event: '#f97316',      // Orange group (shared with arc)
      guide: '#51cf66',      // Green group
      media: '#a855f7',      // Purple group
      quote: '#51cf66',      // Green group (shared with guide)
      organization: '#a855f7', // Purple group (shared with media)
      chapter: '#4dabf7'     // Blue group (shared with character)
```

Replace with (keep the brand keys `red`, `purple`, `black`, `white` unchanged — only update the entity keys):

```typescript
      // Entity accent colors — all unique, imported from entityColors.ts
      gamble:       ENTITY_COLORS.gamble,
      character:    ENTITY_COLORS.character,
      arc:          ENTITY_COLORS.arc,
      volume:       ENTITY_COLORS.volume,
      event:        ENTITY_COLORS.event,
      guide:        ENTITY_COLORS.guide,
      media:        ENTITY_COLORS.media,
      quote:        ENTITY_COLORS.quote,
      organization: ENTITY_COLORS.organization,
      chapter:      ENTITY_COLORS.chapter,
      annotation:   ENTITY_COLORS.annotation,
```

- [ ] **Step 2: Fix the `organization` bug in `getEntityAccent`**

Find this case (around line 578):

```typescript
    case 'organization':
      return palette.purple
```

Replace with:

```typescript
    case 'organization':
      return palette.organization
```

- [ ] **Step 3: Add `annotation` case to `getEntityAccent`**

Find the end of the switch in `getEntityAccent` (the `default:` around line 596):

```typescript
    case 'gamble':
      return palette.gamble
    default:
      return entityAccentFallback
```

Replace with:

```typescript
    case 'gamble':
      return palette.gamble
    case 'annotation':
      return palette.annotation
    default:
      return entityAccentFallback
```

- [ ] **Step 4: Add `annotation` case to `getEntityThemeColor`**

Find the end of the switch in `getEntityThemeColor` (the `default:` around line 624):

```typescript
    case 'quote':
      return entityColors.quote
    default: return entityColors.red
```

Replace with:

```typescript
    case 'quote':
      return entityColors.quote
    case 'annotation':
      return entityColors.annotation
    default: return entityColors.red
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add client/src/lib/mantine-theme.ts
git commit -m "feat: update theme.other.usogui entity colors, fix organization bug, add annotation to helpers"
```

---

## Task 5: Replace/create Mantine color palettes in `mantine-theme.ts`

Mantine needs a 10-step array for each entity color. The approved hex sits at **index 5**. Three entities (`chapter`, `organization`, `annotation`) currently have no palette and must be created. All existing entity palettes must be regenerated with the new hex.

**Files:**
- Modify: `client/src/lib/mantine-theme.ts` (the `export const colors = { ... }` block, lines 5–102)

- [ ] **Step 1: Replace the entire `colors` object**

Find and replace the entire `export const colors = { ... } as const` block with:

```typescript
export const colors = {
  gamble: [
    '#fff5f5', '#ffe3e3', '#ffc9c9', '#ffa8a8', '#ff8787',
    '#ff3333', // index 5 — approved accent
    '#e50000', '#cc0000', '#a80000', '#7a0000'
  ] as const,
  arc: [
    '#fff4e6', '#ffe8cc', '#ffd8a8', '#ffc078', '#ffa94d',
    '#ff7a00', // index 5 — approved accent
    '#f76707', '#e8590c', '#d9480f', '#7d2504'
  ] as const,
  annotation: [
    '#fffde7', '#fff9c4', '#fff59d', '#fff176', '#ffee58',
    '#ffd700', // index 5 — approved accent
    '#f0c000', '#e0a800', '#c78c00', '#7d5a00'
  ] as const,
  event: [
    '#f4ffe0', '#e9ffb8', '#d8f88a', '#c5ee56', '#b0e21f',
    '#99dd00', // index 5 — approved accent
    '#84c400', '#6ea500', '#578500', '#2a4200'
  ] as const,
  guide: [
    '#f0fff4', '#d3f9d8', '#b2f2bb', '#8ce99a', '#69db7c',
    '#22bb55', // index 5 — approved accent
    '#1a9e47', '#138038', '#0d6130', '#053318'
  ] as const,
  organization: [
    '#e6fffd', '#ccfff9', '#99fff4', '#5cfced', '#2df0e3',
    '#00ccbb', // index 5 — approved accent
    '#00b0a0', '#009080', '#006d60', '#003530'
  ] as const,
  quote: [
    '#e3faff', '#c5f6fa', '#99e9f2', '#66d9e8', '#3bc9db',
    '#00ccee', // index 5 — approved accent
    '#00b3d0', '#0099b0', '#007a8e', '#003d47'
  ] as const,
  chapter: [
    '#e7f5ff', '#d0ebff', '#a5d8ff', '#74c0fc', '#4dabf7',
    '#2299ff', // index 5 — approved accent
    '#1c86e5', '#166dcc', '#1056ab', '#082856'
  ] as const,
  character: [
    '#f0edff', '#e0dcff', '#c5bcff', '#a99bff', '#9a88ff',
    '#8877ff', // index 5 — approved accent
    '#7060f5', '#5a4ae0', '#4436c0', '#201080'
  ] as const,
  volume: [
    '#fdf0ff', '#f9d9ff', '#f3b8ff', '#ed96ff', '#e666ff',
    '#dd44ff', // index 5 — approved accent
    '#cc22f0', '#b300d9', '#9200b0', '#4a006e'
  ] as const,
  media: [
    '#fff0f6', '#ffdeeb', '#fcc2d7', '#faa2c1', '#f783ac',
    '#ff3399', // index 5 — approved accent
    '#e0227f', '#c40068', '#a00054', '#5c0030'
  ] as const,
} as const
```

- [ ] **Step 2: Register new palettes in `mantineTheme.colors`**

In the `mantineTheme` object, the `colors` spread (`...colors`) already registers all palette keys. The three new ones (`chapter`, `organization`, `annotation`) will be picked up automatically by the spread — no additional change needed here. But verify the Mantine theme TypeScript types accept these keys. If you see a type error about unknown color names, add them to Mantine's `MantineColorsTuple` declaration or cast as needed.

- [ ] **Step 3: Verify TypeScript compiles and build succeeds**

```bash
cd client && yarn build 2>&1 | head -50
```

Expected: clean build, no type errors.

- [ ] **Step 4: Run lint**

```bash
cd client && yarn lint 2>&1 | head -30
```

Expected: no new lint errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/mantine-theme.ts
git commit -m "feat: regenerate all entity Mantine color palettes with approved distinct hex values"
```

---

## Task 6: Update `theme.ts` (MUI admin theme)

**Files:**
- Modify: `client/src/lib/theme.ts`

- [ ] **Step 1: Add import at the top of `theme.ts`**

After the existing import:

```typescript
import { createTheme } from '@mui/material/styles'
```

Add:

```typescript
import { ENTITY_COLORS } from './entityColors'
```

- [ ] **Step 2: Update the `Palette` interface to include all entities**

Find the `interface Palette` block (lines 4–17). Replace the `usogui` property with:

```typescript
  interface Palette {
    usogui: {
      red: string
      purple: string
      black: string
      white: string
      gamble: string
      character: string
      arc: string
      event: string
      guide: string
      media: string
      quote: string
      volume: string
      chapter: string
      organization: string
      annotation: string
    }
  }
```

- [ ] **Step 3: Update `PaletteOptions` interface to match**

Find the `interface PaletteOptions` block (lines 20–34). Replace the `usogui?` property with:

```typescript
  interface PaletteOptions {
    usogui?: {
      red?: string
      purple?: string
      black?: string
      white?: string
      gamble?: string
      character?: string
      arc?: string
      event?: string
      guide?: string
      media?: string
      quote?: string
      volume?: string
      chapter?: string
      organization?: string
      annotation?: string
    }
  }
```

- [ ] **Step 4: Update the runtime `palette.usogui` object**

Find this block (around line 70):

```typescript
    usogui: {
      red: '#e11d48',
      purple: '#7c3aed',
      black: '#0a0a0a',
      white: '#ffffff',
      gamble: '#d32f2f',
      character: '#1976d2',
      arc: '#dc004e',
      event: '#f57c00',
      guide: '#388e3c',
      media: '#7b1fa2',
      quote: '#00796b'
    }
```

Replace with (brand keys `red`, `purple`, `black`, `white` stay unchanged):

```typescript
    usogui: {
      red: '#e11d48',
      purple: '#7c3aed',
      black: '#0a0a0a',
      white: '#ffffff',
      gamble:       ENTITY_COLORS.gamble,
      character:    ENTITY_COLORS.character,
      arc:          ENTITY_COLORS.arc,
      event:        ENTITY_COLORS.event,
      guide:        ENTITY_COLORS.guide,
      media:        ENTITY_COLORS.media,
      quote:        ENTITY_COLORS.quote,
      volume:       ENTITY_COLORS.volume,
      chapter:      ENTITY_COLORS.chapter,
      organization: ENTITY_COLORS.organization,
      annotation:   ENTITY_COLORS.annotation,
    }
```

- [ ] **Step 5: Verify TypeScript compiles and build succeeds**

```bash
cd client && yarn build 2>&1 | head -50
```

Expected: clean build.

- [ ] **Step 6: Commit**

```bash
git add client/src/lib/theme.ts
git commit -m "feat: update MUI admin theme with all entity colors from entityColors.ts"
```

---

## Task 7: Visual verification

- [ ] **Step 1: Start the dev server**

```bash
cd client && yarn dev
```

- [ ] **Step 2: Check entity chips on list pages**

Open these pages and verify each entity type shows its correct color with no shared colors:
- `/characters` — should show indigo `#8877ff` chips
- `/arcs` — should show orange `#ff7a00`
- `/gambles` — should show red `#ff3333`
- `/volumes` — should show violet `#dd44ff`
- `/chapters` — should show royal blue `#2299ff`
- `/events` — should show chartreuse `#99dd00`
- `/organizations` — should show teal `#00ccbb`
- `/guides` — should show emerald `#22bb55`
- `/media` — should show hot pink `#ff3399`
- `/quotes` — should show cyan `#00ccee`
- Any annotation detail page — should show gold `#ffd700`

- [ ] **Step 3: Check detail page headers**

Open one entity detail page (e.g., a character page). Verify the left-edge color strip and radial gradient use the correct new color.

- [ ] **Step 4: Check admin dashboard**

Open `/admin`. Verify entity-related labels/badges use the updated colors.

- [ ] **Step 5: Final commit if any last-minute tweaks were made**

```bash
git add -p
git commit -m "fix: visual verification tweaks for entity color system"
```
