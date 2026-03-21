# Entity Color Redesign — Semantic Palette

**Date:** 2026-03-21
**Status:** Approved
**Scope:** `client/src/lib/entityColors.ts` only — single source of truth, all consumers update automatically.

---

## Problem

The current entity color system distributes 11 colors evenly around the hue wheel at roughly 30° intervals. This produces good visual separation but carries no semantic meaning — the assignment is purely mathematical. Colors feel tonally mismatched for their entities (e.g., Character in cold indigo, Event in neon chartreuse).

---

## Goal

Replace the spectral distribution with a **semantically motivated** palette. Each entity's color should:

1. Feel intuitively correct for what the entity represents
2. Be visually distinct from all other entities
3. Work on dark backgrounds (the site's primary theme)
4. All entities carry equal visual weight — no hierarchy

---

## Approved Color Assignments

| Entity | Hex | Name | Semantic Rationale |
|---|---|---|---|
| `gamble` | `#e63946` | Crimson | Danger, blood, high stakes — red is the universal signal for risk, and gambles carry life-or-death weight |
| `arc` | `#ff6b35` | Flame Orange | Epic narrative fire, adventure, cinematic sweep — arcs are the big journeys |
| `character` | `#f5a623` | Amber Gold | Warmth, humanity, spotlight — gold frames the people who are the stars of the story |
| `event` | `#ca8a04` | Ochre | Momentous, historical, marked in time — events are notable plot moments, dark gold like a date circled on a calendar |
| `guide` | `#16a34a` | Forest Green | Helpful, educational, community-driven — green universally means go and safe |
| `quote` | `#0d9488` | Dark Teal | Voice, dialogue, spoken word — teal sits between blue and green, like turquoise ink |
| `organization` | `#0369a1` | Deep Ocean Blue | Cold, institutional, powerful — shadowy gambling organizations have corporate authority |
| `chapter` | `#38bdf8` | Sky Blue | Crisp, clean, readable — chapters are where you actually read, light blue feels like fresh pages |
| `volume` | `#6d28d9` | Deep Violet | Weighty tomes, gravitas, collected editions — physical manga volumes deserve a rich, heavy color |
| `annotation` | `#9333ea` | Bright Purple | Scholarly, analytical, curious — purple is the color of study and insight |
| `media` | `#db2777` | Hot Pink | Creative, visual, expressive — fan art and gallery content; pink/magenta is the color of creative passion |

---

## Changes Required

### `client/src/lib/entityColors.ts`

Replace all 11 hex values with the approved palette above. No structural changes — only the color values change. All downstream consumers (Mantine theme, MUI admin theme, `textColors`, etc.) import from this file and will update automatically.

---

## What Does Not Change

- The `ENTITY_COLORS` object structure and key names
- The `EntityColorKey` type
- The `getEntityColor` helper function
- Any downstream theme files — they already import from `entityColors.ts`
- Any component logic

---

## Out of Scope

- Adding new entity types
- Changing how colors are consumed by themes
- Dark/light mode variants per entity
- Accessibility contrast adjustments (WCAG) — noted as future consideration

