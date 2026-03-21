# Entity Color System Design

**Date:** 2026-03-20
**Status:** Approved

## Problem

Multiple entity types in the Usogui fansite share the same color, making chips, badges, cards, and detail page headers visually indistinguishable:

| Shared Color | Entities |
|---|---|
| Blue `#4dabf7` | Character, Chapter |
| Orange `#f97316` | Arc, Event |
| Purple `#a855f7` | Volume, Media, Organization |
| Green `#51cf66` | Guide, Quote |

Additionally, entity colors are stored in three separate places — `theme.other.usogui` (Mantine), `textColors` (Mantine, read directly by components), and `palette.usogui` (MUI admin) — creating drift risk and making a single color update require touching multiple files.

## Goal

Every entity type gets a unique, visually distinct color. A single source of truth file (`entityColors.ts`) eliminates future theme divergence across all three color stores.

## Entities in Scope

11 entities (Tags and Badges excluded — they use utility/neutral styling):

Character, Arc, Volume, Chapter, Gamble, Event, Organization, Guide, Media, Quote, Annotation

## Approved Color Map

All 11 entities are changing to new hex values. The approved hex must sit at **palette index 5** (consistent with `primaryShade: { light: 5, dark: 5 }` in `mantine-theme.ts`).

| Entity | Hex | Description | Hue |
|---|---|---|---|
| Gamble | `#ff3333` | Pure Red | 0° |
| Arc | `#ff7a00` | Vivid Orange | 29° |
| Annotation | `#ffd700` | Gold | 51° |
| Event | `#99dd00` | Chartreuse | 88° |
| Guide | `#22bb55` | Emerald | 141° |
| Organization | `#00ccbb` | Teal | 175° |
| Quote | `#00ccee` | Cyan | 191° |
| Chapter | `#2299ff` | Royal Blue | 214° |
| Character | `#8877ff` | Indigo | 245° |
| Volume | `#dd44ff` | Violet | 288° |
| Media | `#ff3399` | Hot Pink | 330° |

Colors are distributed around the hue wheel for maximum perceptual distinctness, all vibrant enough to read clearly on the app's dark backgrounds (`#0a0f1e`, `#080c14`).

## Architecture

### Single Source of Truth (Approach B)

**New file: `client/src/lib/entityColors.ts`**

Exports:
- `ENTITY_COLORS` — a const record mapping `EntityAccentKey` to hex strings (all 11 entities)
- `getEntityColor(type: EntityAccentKey): string` — safe accessor with fallback

All three color stores in the Mantine and MUI theme files import from this file. Any future color change is one edit in one place.

---

### `client/src/lib/mantine-theme.ts` — Five locations to update

**1. `EntityAccentKey` type**

Verify `annotation` is present in the `EntityAccentKey` union type. Add it if missing.

**2. `colors` object (Mantine 10-step palettes)**

Every entity needs a full 10-step array with its approved hex at index 5. Three entities currently have no registered palette and must be **created**:
- `chapter` — missing, must be created
- `organization` — missing, must be created
- `annotation` — missing, must be created

All other entity palettes must be **regenerated** around their new index-5 hex value.

**3. `theme.other.usogui` accent values**

Update all existing entity hex values to import from `entityColors.ts`. Additionally, `annotation` is not currently a key in `theme.other.usogui` — it must be **added** as a new key (not just updated).

The non-entity brand keys (`red`, `purple`, `black`, `white`) that also live in `theme.other.usogui` are **out of scope and must not be changed or removed** — `getEntityThemeColor`'s default fallback depends on `theme.other.usogui.red` being present.

**4. `textColors` export**

`textColors` is a standalone export that some components import directly (e.g. `textColors.character`, `textColors.arc`). It does not read from `theme.other.usogui`. All entity keys in `textColors` must be updated to import from `entityColors.ts`. `textColors.annotation` already exists here and must be updated.

**5. Helper function fixes (three functions)**

- **`getEntityAccent()`** — The `organization` case currently returns `palette.purple` (brand purple `#7c3aed`) instead of `palette.organization`. Fix this to `palette.organization`.
- **`getEntityThemeColor()`** — Has no `annotation` case; falls through to `default` which returns red. Add an `annotation` case returning the correct palette/accent value.
- **`setTabAccentColors()`** — Builds a `Record<EntityAccentKey, string>` from `textColors`. Its `accentColorMap` does not include `annotation`. Adding `annotation` to `EntityAccentKey` will cause a TypeScript compile error here. Add `annotation: textColors.annotation` to the map.

---

### `client/src/lib/manga-decorations.ts`

`entitySuit` is declared as `Record<EntityAccentKey, 'spade' | 'heart' | 'diamond' | 'club'>` with 10 entries and no `annotation`. Adding `annotation` to `EntityAccentKey` will cause a TypeScript compile error here. Add an `annotation` entry (suit value: `'spade'` or whichever fits the manga context best — use `'diamond'` as a neutral fallback if unsure).

---

### `client/src/lib/theme.ts` (MUI admin) — Three locations to update

**1. TypeScript interface extensions**

`Palette` and `PaletteOptions` interface declarations are missing `volume`, `chapter`, `organization`, and `annotation`. All four must be added.

**2. Runtime `palette.usogui` object**

`volume`, `chapter`, `organization`, and `annotation` are missing from the runtime object. All four must be added, importing from `entityColors.ts`.

**3. All existing entity color entries**

Replace all existing hex values with imports from `entityColors.ts`.

---

### Component changes

No structural component changes are required. Components that call `getEntityAccent()` or `getEntityThemeColor()` will pick up new values automatically via the theme. Components that read `textColors` directly will pick up new values once `textColors` is updated — it is a module-level export, not a theme injection, so no component files need to be edited.

## Files Changed

| File | Change |
|---|---|
| `client/src/lib/entityColors.ts` | **New** — canonical color map + accessor |
| `client/src/lib/mantine-theme.ts` | Verify `EntityAccentKey` includes `annotation`; create 3 new palettes + regenerate 8; add `annotation` to `theme.other.usogui`; update all `textColors` entity values; fix `getEntityAccent` organization bug; add `annotation` to `getEntityThemeColor`; add `annotation` to `setTabAccentColors` accentColorMap |
| `client/src/lib/manga-decorations.ts` | Add `annotation` to `entitySuit` record |
| `client/src/lib/theme.ts` | Add `volume`/`chapter`/`organization`/`annotation` to TypeScript interfaces + runtime palette; update all entity hex values |

## Out of Scope

- Tags and Badges — no dedicated entity color needed
- Component layout or structure changes
- CSS custom property layer — over-engineering for current needs
- New color variants (hover, disabled states) — already handled by Mantine's 10-step palette generation
