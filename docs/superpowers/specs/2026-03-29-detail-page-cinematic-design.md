# Detail Page Cinematic Dark Design — Spec

**Date:** 2026-03-29
**Scope:** Public detail pages — Overview tab sub-sections, Media tab, Annotations tab
**Pages affected:** CharacterPageClient, GamblePageClient, ArcPageClient, ChapterPageClient, OrganizationPageClient, EventPageClient, VolumePageClient

---

## Design Direction

**Cinematic Dark** — warm-tinted section cards with entity-color gradient border accents and atmospheric dark backgrounds. Matches Usogui's noir/thriller tone.

Entity colors used are the canonical values from `client/src/lib/entityColors.ts`:
- `character` `#f5a623` · `arc` `#ff6b35` · `gamble` `#e63946` · `annotation` `#d946ef`
- `event` `#ca8a04` · `guide` `#16a34a` · `organization` `#0284c7` · `quote` `#0d9488`
- `chapter` `#38bdf8` · `volume` `#8b5cf6` · `media` `#ec4899`

---

## Shared Cinematic Card Pattern

Every section card follows the same base treatment driven by its entity color. Extract a `getCinematicCardStyles(entityColor)` helper in `mantine-theme.ts`:

- **Background:** `linear-gradient(135deg, {entityColor}0d 0%, #0d0d0d 55%, #0a0a0a 100%)`
- **Border:** `1px solid {entityColor}22`
- **Top accent line:** 1px via `::before` pseudo — `linear-gradient(90deg, {entityColor}, {entityColor}60 40%, transparent 80%)`
- **Section header:** pill badge label (small bg fill + border at low opacity, uppercase, 0.22em letter-spacing) replacing the old icon-box + plain text + horizontal divider combo
- **Divider after pill:** `linear-gradient(to right, {entityColor}18, transparent)` 1px line, flex-1

---

## Overview Tab — Inventory by Entity

### Character (`#f5a623`)

**Main column:**
| Section | Label | Color | Notes |
|---------|-------|-------|-------|
| Description card | "Description" | character | Always shown |
| Backstory card | "Backstory" | character | Conditional |
| CharacterRelationships | renders own header | character | Component wrapper card gets cinematic treatment |
| Organizations card | "Organizations" | organization | Conditional; uses CharacterOrganizationMemberships inside. Each org row shows entity display image as a 40×40 rounded thumbnail; falls back to initials in org color when no `imageFileName` |

**Sidebar:**
| Section | Color | Notes |
|---------|-------|-------|
| Details card | character | Rows: Debut (chapter link → arc color), Organization (→ org color), Gambles, Arcs |
| Story Arcs list | arc `#ff6b35` | RelatedContentSection |
| Gambles list | gamble `#e63946` | RelatedContentSection |
| Quotes list | quote `#0d9488` | RelatedContentSection |

---

### Gamble (`#e63946`)

**Main column:**
| Section | Label | Color | Notes |
|---------|-------|-------|-------|
| About This Gamble | "About This Gamble" | gamble | Always shown |
| Rules | "Rules" | gamble | Always shown |
| Win Condition | "Win Condition" | gamble | Conditional. Inner content box currently uses `manga-panel-border` + bg tint — keep that treatment but apply cinematic card to outer wrapper |
| Explanation & Analysis | "Explanation & Analysis" | gamble | Conditional |
| Participants / Factions | "Participants" | gamble | Conditional. Layout is data-driven by `supportedGambler` field: **2 factions with `supportedGambler`** → VS layout (side-by-side with VS divider); **3+ factions with `supportedGambler`** → equal-width column grid (1fr each); **factions without `supportedGambler`** → always rendered full-width below main sides as a muted grey "Third Party" block (neutral border `#282828`, grey dot, dark bg, no entity tinting). Faction header bands use entity-color tinting for main sides — keep that internal structure, apply cinematic card to outer wrapper only. |

**Sidebar:**
| Section | Color | Notes |
|---------|-------|-------|
| Details card | gamble | Rows: Start chapter, Arc link (→ arc color), Players count |
| Participants list | character `#f5a623` | Shown when no factions |
| Factions list | gamble | Shown when factions exist |

---

### Arc (`#ff6b35`)

**Main column:**
| Section | Label | Color | Notes |
|---------|-------|-------|-------|
| About This Arc | "About This Arc" | arc | Always shown |
| Chapter Navigation | "Chapters" | arc | Replaces Start/End buttons with a navigable chapter list. Each row: chapter number (entity color) + optional Start/End badge on first/last + chapter title + `→` arrow. Long arcs collapse middle rows with a `··· N more chapters` placeholder row |

**Sidebar:**
| Section | Color | Notes |
|---------|-------|-------|
| Details card | arc | Rows: Chapters range, Gambles count, Sub-arcs count (conditional) |
| Gambles list | gamble `#e63946` | RelatedContentSection |
| Sub-arcs list | arc | Conditional; RelatedContentSection |

---

### Chapter (`#38bdf8`)

**Main column:**
| Section | Label | Color | Notes |
|---------|-------|-------|-------|
| Chapter Summary | "Chapter Summary" | chapter | Always shown |
| Featured Characters | "Featured Characters" | character `#f5a623` | Conditional. Chip-style avatar grid — keep chip layout, apply cinematic card to wrapper |

**Sidebar:**
| Section | Color | Notes |
|---------|-------|-------|
| Details card | chapter | Rows: Chapter #, Volume link (→ volume `#8b5cf6`), Arc link (→ arc `#ff6b35`), Events count |
| Events list | event `#ca8a04` | RelatedContentSection |
| Quotes list | quote `#0d9488` | RelatedContentSection |

---

### Organization (`#0284c7`)

**Main column:**
| Section | Label | Color | Notes |
|---------|-------|-------|-------|
| Organization Overview | "Organization Overview" | organization | Always shown |

**Sidebar:**
| Section | Color | Notes |
|---------|-------|-------|
| Details card | organization | Rows: Members count (→ character color), Gambles count (→ gamble color) |
| Members list | character `#f5a623` | RelatedContentSection |
| Gambles list | gamble `#e63946` | RelatedContentSection |

---

### Event (`#ca8a04`)

**Main column:**
| Section | Label | Color | Notes |
|---------|-------|-------|-------|
| Description | "Description" | event | Always shown |
| Related Gamble | "Related Gamble" | gamble `#e63946` | Conditional. Inner Paper shows Rules + Win Condition sub-content — apply cinematic card to outer wrapper, keep inner Paper treatment |

**Sidebar:**
| Section | Color | Notes |
|---------|-------|-------|
| Details card | event | Rows: Chapter, Arc link (→ arc color), Type, Status, Edit button (conditional) |
| Featured Characters | character `#f5a623` | Conditional; chip-style avatar grid |
| Tags | event | Conditional; badge chip group |
| Gambles in this Arc | gamble `#e63946` | Conditional; badge chip group |

**Note on chip/badge sections (Tags, Gambles in Arc):** The chip group layout is functional and compact. Apply only the cinematic card wrapper; do not change chip internals.

---

### Volume (`#8b5cf6`)

**Main column:**
| Section | Label | Color | Notes |
|---------|-------|-------|-------|
| Volume Summary | "Volume Summary" | volume | Always shown |
| Chapter Navigation | "Chapters" | volume | Same chapter list treatment as Arc — navigable rows with Start/End badges on first/last |

**Sidebar:**
| Section | Color | Notes |
|---------|-------|-------|
| Details card | volume | Rows: Chapter Range, Chapter Count, Arc Count |
| Chapters list | chapter `#38bdf8` | RelatedContentSection |
| Arcs list | arc `#ff6b35` | RelatedContentSection |

---

## Details Sidebar Card — Shared Row Pattern

**Current:** Mini icon boxes + key label + value.

**New:**
- Cinematic card wrapper (same shared pattern above)
- Remove mini icon boxes → replace with 5px colored dot per row
- Row dividers: `{entityColor}` at ~8% opacity instead of flat `#161616`
- Key text: muted tone keyed to entity color's dark range (e.g. character → `#6a5030`)
- Value text: entity color for numeric/chapter values; linked entity's own color for cross-entity links (Volume → `#8b5cf6`, Arc → `#ff6b35`, Org → `#0284c7`, etc.)

---

## RelatedContentSection — Cinematic Treatment

Each RelatedContentSection sidebar card gets its **own** entity-color cinematic wrapper (not the parent page's entity color):
- Arc lists → arc `#ff6b35` gradient bg + border
- Gamble lists → gamble `#e63946` gradient bg + border
- Quote lists → quote `#0d9488` gradient bg + border
- Character/Member lists → character `#f5a623` gradient bg + border
- Event lists → event `#ca8a04` gradient bg + border
- Chapter lists → chapter `#38bdf8` gradient bg + border
- Volume lists → volume `#8b5cf6` gradient bg + border

Item text: lightened tint of entity color. Arrow `→` right-aligned, darker tint. "More" row: darker tint, smaller font.

---

## Media Tab

**Current:** Plain dark grid inside basic card with title + View All button.

**New:**
- Outer card: cinematic dark with `media` color (`#ec4899`) — bg `linear-gradient(135deg, #1a0520, #0d0d0d 55%, #0a0a0a)`, border `#ec489922`, 1px top gradient line
- Header: section pill label + item count + View All link — no Title component
- Image thumbs: bg `linear-gradient(135deg, #1a0520, #0d0d0d)`, border `#ec489920`
- Video thumbs: bg `linear-gradient(135deg, #1a0800, #0d0d0d)`, border `#ff660020`
- Type badge overlay (top-right corner): `IMG` in media pink, `VID` in orange — semi-transparent dark bg

---

## Annotations Tab

### AnnotationSection wrapper

- Cinematic dark card: bg `linear-gradient(135deg, #150520, #0d0d0d 55%, #0a0a0a)`, border `#d946ef25`, 1px top gradient line
- Header: annotation pill label (`#d946ef`) replacing Title + MessageSquare icon combo
- "Add" button: annotation color `#d946ef`

### AnnotationCard

**Current:** `border-left: 3px solid violet` on flat dark card.

**New:**
- Card bg: `linear-gradient(135deg, #150520, #0d0d0d 55%, #0a0a0a)`, border `#d946ef25`
- Top 1px gradient accent: `linear-gradient(90deg, #d946ef, #d946ef60 40%, transparent 80%)`
- Left 2px vertical accent: `linear-gradient(180deg, #d946ef, #d946ef40)` via `::after`
- Title text: light fuchsia tint (`#e8c0f8`)
- Preview/content text: muted purple-grey (`#9070b0`)
- Meta row: darker purple-grey (`#6040a0`)
- Spoiler badge: event/ochre `#ca8a04`
- Expanded content box: card-within-card at slightly darker bg

---

## Implementation Notes

- Extract `getCinematicCardStyles(entityColor)` in `mantine-theme.ts` — called with the section's own entity color (not always the page entity color, e.g. a gamble list inside a character page uses gamble color).
- All entity color values come from `entityColors.ts` via `getEntityThemeColor()` — no hardcoded hex in components.
- Do not modify the internal layout of: Participants/Factions VS layout, chip-style Featured Characters grid, Tags badge group, Gambles-in-Arc badge group. Cinematic treatment = wrapper card only for those.
- `AnnotationCard` is standalone — changes propagate automatically to all pages.
- `MediaGallery` grid is internal — the cinematic wrapper is applied in each page's `Tabs.Panel`, not inside `MediaGallery`.
- Responsive: `detail-editorial-grid` className already handles mobile collapse. No grid changes needed.

---

## Out of Scope

- Timeline tab (separate component, not requested)
- Admin panel
- List/index pages
- New features or data changes
- Chapters tab on Volume page (full chapter grid, not overview sub-section)
- Events/Quotes tabs on Chapter page
