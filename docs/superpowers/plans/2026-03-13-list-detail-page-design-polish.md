# List & Detail Page Design Polish — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Comprehensive visual overhaul of all list and detail pages through targeted Dark & Dramatic redesigns of 7 shared files plus 8 call-site cleanup edits.

**Architecture:** Component-level redesign — all changes are self-contained within each component's internals or global CSS. No data logic, routing, or prop APIs change (one additive optional prop added to HoverModal). DetailPageHeader switches from two-column layout to cinematic centered layout; `children` at call sites must have their entity `<Title>` removed to prevent duplication.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI, Tailwind CSS 4. All commands run from `client/` directory using `yarn`.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `client/src/components/cards/PlayingCard.tsx` | Modify | Border glow, image overlays, suit watermark, name box |
| `client/src/app/globals.css` | Modify | Card hover intensification, tab glowing pill styles |
| `client/src/components/layouts/ListPageHero.tsx` | Modify | Deeper bg, scan-line overlay, icon glow, badge glow |
| `client/src/components/layouts/SearchToolbar.tsx` | Modify | Sticky state: darker bg, stronger border/glow |
| `client/src/components/layouts/PaginationBar.tsx` | Modify | Active page gradient glow, border-radius 4→6px |
| `client/src/components/HoverModal.tsx` | Modify | Add `entityLabel?` prop, top accent stripe, eyebrow label |
| `client/src/components/layouts/DetailPageHeader.tsx` | Modify | Two-column → cinematic centered layout |
| `client/src/app/characters/[id]/CharacterPageClient.tsx` | Modify | Remove entity `<Title>` from DetailPageHeader children |
| `client/src/app/gambles/[id]/GamblePageClient.tsx` | Modify | Remove Crown+Title `<Group>` from DetailPageHeader children |
| `client/src/app/arcs/[id]/ArcPageClient.tsx` | Modify | Remove entity `<Title>` from DetailPageHeader children |
| `client/src/app/volumes/[id]/VolumePageClient.tsx` | Modify | Remove entity `<Title>` from DetailPageHeader children |
| `client/src/app/chapters/[id]/ChapterPageClient.tsx` | Modify | Remove entity name `<Text>` from DetailPageHeader children |
| `client/src/app/events/[id]/EventPageClient.tsx` | Modify | Remove CalendarSearch+Title `<Group>` from DetailPageHeader children |
| `client/src/app/organizations/[id]/OrganizationPageClient.tsx` | Modify | Remove entity `<Title>` from DetailPageHeader children |
| `client/src/app/characters/CharactersPageContent.tsx` | Modify | Add `entityLabel="character"` to HoverModal |
| `client/src/app/gambles/GamblesPageContent.tsx` | Modify | Add `entityLabel="gamble"` to HoverModal |
| `client/src/app/arcs/ArcsPageContent.tsx` | Modify | Add `entityLabel="arc"` to HoverModal |
| `client/src/app/volumes/VolumesPageContent.tsx` | Modify | Add `entityLabel="volume"` to HoverModal |
| `client/src/app/quotes/QuotesPageContent.tsx` | Modify | Add `entityLabel="quote"` to HoverModal |
| `client/src/app/organizations/OrganizationsPageContent.tsx` | Modify | Add `entityLabel="organization"` to HoverModal |

---

## Chunk 1: PlayingCard + globals.css

### Task 1: PlayingCard — card border, glow, and name box

**Files:**
- Modify: `client/src/components/cards/PlayingCard.tsx`

- [ ] **Step 1: Update card outer box-shadow (line ~98)**

  Find the `style` prop on the `<Card>` component (around line 86–99). Change `boxShadow`:

  ```tsx
  // Before
  boxShadow: `inset 0 0 0 1px ${accentColor}18, 0 2px 10px rgba(0,0,0,0.4)`

  // After
  boxShadow: `inset 0 0 0 1px ${accentColor}35, 0 0 20px ${accentColor}40, 0 4px 20px rgba(0,0,0,0.6)`
  ```

- [ ] **Step 2: Update suit watermark opacity and add glow (lines ~127–142)**

  Find the suit watermark `<Box>`. Change `opacity` from `0.18` to `0.32` and add `filter`:

  ```tsx
  // Before
  style={{
    position: 'absolute',
    top: rem(6),
    right: rem(6),
    zIndex: 5,
    opacity: 0.18,
    width: rem(16),
    height: rem(16)
  }}

  // After
  style={{
    position: 'absolute',
    top: rem(6),
    right: rem(6),
    zIndex: 5,
    opacity: 0.32,
    width: rem(16),
    height: rem(16),
    filter: `drop-shadow(0 0 4px ${accentColor}80)`
  }}
  ```

- [ ] **Step 3: Add textShadow to eyebrow label (lines ~105–124)**

  Find the eyebrow label `<Box>`. Add `textShadow` to its `style`:

  ```tsx
  // Add to the existing style object:
  textShadow: `0 0 8px ${accentColor}60`,
  ```

- [ ] **Step 4: Add image area overlays (lines ~196–214)**

  Find the image area `<Box>` that wraps `<MediaThumbnail>`. After the `<MediaThumbnail>` component, add two overlay boxes:

  ```tsx
  <MediaThumbnail
    entityType={entityType}
    entityId={entityId}
    entityName={name}
    allowCycling={false}
    maxWidth={dims.maxWidth}
    maxHeight={dims.maxHeight}
    spoilerChapter={spoilerChapter ?? undefined}
    onSpoilerRevealed={onSpoilerRevealed}
    priority={imagePriority}
    initialMedia={initialMedia}
  />
  {/* Scan-line texture */}
  <Box aria-hidden style={{
    position: 'absolute', inset: 0,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
    pointerEvents: 'none', zIndex: 1,
  }} />
  {/* Radial top-center glow */}
  <Box aria-hidden style={{
    position: 'absolute', inset: 0,
    background: `radial-gradient(ellipse at 50% 30%, ${accentColor}07, transparent 65%)`,
    pointerEvents: 'none', zIndex: 1,
  }} />
  ```

- [ ] **Step 5: Replace bottom gradient overlay (lines ~217–229)**

  Find the "Bottom gradient overlay" `<Box>` (the one with `height: '55%'`). Replace it entirely with two layers:

  ```tsx
  {/* Layer 1: Deep black gradient */}
  <Box
    aria-hidden
    style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: '70%',
      background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
      pointerEvents: 'none',
      zIndex: 1,
    }}
  />
  {/* Layer 2: Accent tint */}
  <Box
    aria-hidden
    style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: '30%',
      background: `linear-gradient(0deg, ${accentColor}15 0%, transparent 100%)`,
      pointerEvents: 'none',
      zIndex: 2,
    }}
  />
  ```

- [ ] **Step 6: Update name box style (lines ~258–281)**

  Find the `<Text>` element for the entity name inside the bottom `<Box>`. Update its `style` prop:

  ```tsx
  // Before
  style={{
    ...
    background: 'linear-gradient(180deg, rgba(6,4,4,0.85) 0%, rgba(12,8,8,0.92) 100%)',
    border: `1px solid ${accentColor}55`,
    boxShadow: `0 0 10px ${accentColor}25, inset 0 1px 0 rgba(255,255,255,0.06)`,
    ...
  }}

  // After — change these three lines only:
  background: 'linear-gradient(180deg, rgba(4,2,2,0.92) 0%, rgba(8,5,5,0.97) 100%)',
  border: `1px solid ${accentColor}65`,
  boxShadow: `0 0 14px ${accentColor}28, inset 0 1px 0 rgba(255,255,255,0.07)`,
  ```

- [ ] **Step 7: Verify TypeScript compiles**

  ```bash
  cd client && yarn tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 8: Commit**

  ```bash
  cd client && git add src/components/cards/PlayingCard.tsx
  git commit -m "feat: PlayingCard Dark & Dramatic visual upgrade"
  ```

---

### Task 2: globals.css — card hover intensification

**Files:**
- Modify: `client/src/app/globals.css`

- [ ] **Step 1: Intensify base hover transform (line ~407)**

  Find `.hoverable-card:hover`. Change `transform` and `box-shadow`:

  ```css
  /* Before */
  .hoverable-card:hover {
    transform: perspective(700px) rotateY(3deg) translateY(-7px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(0, 0, 0, 0.20);
  }

  /* After */
  .hoverable-card:hover {
    transform: perspective(700px) rotateY(5deg) translateY(-10px);
    box-shadow: 0 20px 56px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0, 0, 0, 0.25);
  }
  ```

- [ ] **Step 2: Intensify entity-specific hover glows (lines ~412–490)**

  For each entity type, increase the ambient glow `0.38` → `0.50` and mid glow `0.20` → `0.28`, and add a third outer ambient layer. Replace the 10 entity hover rules:

  ```css
  .hoverable-card-character:hover {
    border-color: var(--color-character);
    box-shadow:
      0 0 28px rgba(77, 171, 247, 0.35),
      0 16px 52px rgba(77, 171, 247, 0.50),
      0 4px 16px rgba(77, 171, 247, 0.28),
      inset 0 0 0 1px rgba(77, 171, 247, 0.55);
  }

  .hoverable-card-gamble:hover {
    border-color: var(--color-gamble);
    box-shadow:
      0 0 28px rgba(255, 85, 85, 0.35),
      0 16px 52px rgba(255, 85, 85, 0.50),
      0 4px 16px rgba(255, 85, 85, 0.28),
      inset 0 0 0 1px rgba(255, 85, 85, 0.55);
  }

  .hoverable-card-arc:hover {
    border-color: var(--color-arc);
    box-shadow:
      0 0 28px rgba(249, 115, 22, 0.35),
      0 16px 52px rgba(249, 115, 22, 0.50),
      0 4px 16px rgba(249, 115, 22, 0.28),
      inset 0 0 0 1px rgba(249, 115, 22, 0.55);
  }

  .hoverable-card-event:hover {
    border-color: var(--color-event);
    box-shadow:
      0 0 28px rgba(243, 156, 18, 0.35),
      0 16px 52px rgba(243, 156, 18, 0.50),
      0 4px 16px rgba(243, 156, 18, 0.28),
      inset 0 0 0 1px rgba(243, 156, 18, 0.55);
  }

  .hoverable-card-guide:hover {
    border-color: var(--color-guide);
    box-shadow:
      0 0 28px rgba(81, 207, 102, 0.35),
      0 16px 52px rgba(81, 207, 102, 0.50),
      0 4px 16px rgba(81, 207, 102, 0.28),
      inset 0 0 0 1px rgba(81, 207, 102, 0.55);
  }

  .hoverable-card-media:hover {
    border-color: var(--color-media);
    box-shadow:
      0 0 28px rgba(168, 85, 247, 0.35),
      0 16px 52px rgba(168, 85, 247, 0.50),
      0 4px 16px rgba(168, 85, 247, 0.28),
      inset 0 0 0 1px rgba(168, 85, 247, 0.55);
  }

  .hoverable-card-quote:hover {
    border-color: var(--color-quote);
    box-shadow:
      0 0 28px rgba(32, 201, 151, 0.35),
      0 16px 52px rgba(32, 201, 151, 0.50),
      0 4px 16px rgba(32, 201, 151, 0.28),
      inset 0 0 0 1px rgba(32, 201, 151, 0.55);
  }

  .hoverable-card-volume:hover {
    border-color: var(--color-volume);
    box-shadow:
      0 0 28px rgba(255, 105, 180, 0.35),
      0 16px 52px rgba(255, 105, 180, 0.50),
      0 4px 16px rgba(255, 105, 180, 0.28),
      inset 0 0 0 1px rgba(255, 105, 180, 0.55);
  }

  .hoverable-card-chapter:hover {
    border-color: var(--color-chapter);
    box-shadow:
      0 0 28px rgba(56, 189, 248, 0.35),
      0 16px 52px rgba(56, 189, 248, 0.50),
      0 4px 16px rgba(56, 189, 248, 0.28),
      inset 0 0 0 1px rgba(56, 189, 248, 0.55);
  }

  .hoverable-card-organization:hover {
    border-color: var(--color-organization);
    box-shadow:
      0 0 28px rgba(192, 132, 252, 0.35),
      0 16px 52px rgba(192, 132, 252, 0.50),
      0 4px 16px rgba(192, 132, 252, 0.28),
      inset 0 0 0 1px rgba(192, 132, 252, 0.55);
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  cd client && git add src/app/globals.css
  git commit -m "feat: intensify card hover glows and tilt"
  ```

---

### Task 3: globals.css — glowing pill tab styles

**Files:**
- Modify: `client/src/app/globals.css`

- [ ] **Step 1: Add missing entity types to base tab selector (line ~226)**

  Find the base tab selector block. Extend it to include the 4 missing entity types. The block already contains `border-radius: 6px !important` — change that value to `7px`, do not add a new `border-radius` declaration:

  ```css
  /* Before: only has character, gamble, arc, guide */
  .character-tabs .mantine-Tabs-tab,
  .gamble-tabs .mantine-Tabs-tab,
  .arc-tabs .mantine-Tabs-tab,
  .guide-tabs .mantine-Tabs-tab {

  /* After: add 4 more entity types to selector list */
  .character-tabs .mantine-Tabs-tab,
  .gamble-tabs .mantine-Tabs-tab,
  .arc-tabs .mantine-Tabs-tab,
  .guide-tabs .mantine-Tabs-tab,
  .volume-tabs .mantine-Tabs-tab,
  .organization-tabs .mantine-Tabs-tab,
  .chapter-tabs .mantine-Tabs-tab,
  .event-tabs .mantine-Tabs-tab {
  ```

  Inside the block, change the existing `border-radius: 6px !important` to `border-radius: 7px !important`. Do NOT add a second `border-radius` rule.

- [ ] **Step 2: Extend hover selectors to all 8 entity types**

  The four existing `.X-tabs .mantine-Tabs-tab:hover` blocks each set a specific color. Add four new blocks for the missing types:

  ```css
  .volume-tabs .mantine-Tabs-tab:hover {
    background-color: rgba(255, 105, 180, 0.18) !important;
    color: rgba(255, 255, 255, 0.95) !important;
    transform: translateY(-1px) !important;
    border-radius: 7px !important;
  }

  .organization-tabs .mantine-Tabs-tab:hover {
    background-color: rgba(192, 132, 252, 0.18) !important;
    color: rgba(255, 255, 255, 0.95) !important;
    transform: translateY(-1px) !important;
    border-radius: 7px !important;
  }

  .chapter-tabs .mantine-Tabs-tab:hover {
    background-color: rgba(56, 189, 248, 0.18) !important;
    color: rgba(255, 255, 255, 0.95) !important;
    transform: translateY(-1px) !important;
    border-radius: 7px !important;
  }

  .event-tabs .mantine-Tabs-tab:hover {
    background-color: rgba(243, 156, 18, 0.18) !important;
    color: rgba(255, 255, 255, 0.95) !important;
    transform: translateY(-1px) !important;
    border-radius: 7px !important;
  }
  ```

  Also update the existing 4 hover blocks: change `0.25` → `0.18` and add `border-radius: 7px !important`:

  ```css
  /* e.g. character — same pattern for gamble, arc, guide */
  .character-tabs .mantine-Tabs-tab:hover {
    background-color: rgba(77, 171, 247, 0.18) !important;
    color: rgba(255, 255, 255, 0.95) !important;
    transform: translateY(-1px) !important;
    border-radius: 7px !important;
  }
  ```

- [ ] **Step 3: Replace active tab styles with glowing pill (lines ~264–306)**

  Replace the 4 existing active tab blocks (character, gamble, arc, guide) AND add 4 new ones (volume, organization, chapter, event). The pattern uses per-entity rgba values:

  ```css
  /* CHARACTER */
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

  /* GAMBLE */
  .gamble-tabs .mantine-Tabs-tab[data-active="true"],
  .gamble-tabs .mantine-Tabs-tab[data-active],
  .gamble-tabs .mantine-Tabs-tab[aria-selected="true"],
  .gamble-tabs [data-active="true"],
  .gamble-tabs [data-active],
  .gamble-tabs [aria-selected="true"] {
    background: linear-gradient(135deg, rgba(255, 85, 85, 0.45), rgba(255, 85, 85, 0.20)) !important;
    border: 1px solid rgba(255, 85, 85, 0.55) !important;
    border-radius: 7px !important;
    box-shadow: 0 0 16px rgba(255, 85, 85, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
  }

  /* ARC */
  .arc-tabs .mantine-Tabs-tab[data-active="true"],
  .arc-tabs .mantine-Tabs-tab[data-active],
  .arc-tabs .mantine-Tabs-tab[aria-selected="true"],
  .arc-tabs [data-active="true"],
  .arc-tabs [data-active],
  .arc-tabs [aria-selected="true"] {
    background: linear-gradient(135deg, rgba(249, 115, 22, 0.45), rgba(249, 115, 22, 0.20)) !important;
    border: 1px solid rgba(249, 115, 22, 0.55) !important;
    border-radius: 7px !important;
    box-shadow: 0 0 16px rgba(249, 115, 22, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
  }

  /* GUIDE */
  .guide-tabs .mantine-Tabs-tab[data-active="true"],
  .guide-tabs .mantine-Tabs-tab[data-active],
  .guide-tabs .mantine-Tabs-tab[aria-selected="true"],
  .guide-tabs [data-active="true"],
  .guide-tabs [data-active],
  .guide-tabs [aria-selected="true"] {
    background: linear-gradient(135deg, rgba(81, 207, 102, 0.45), rgba(81, 207, 102, 0.20)) !important;
    border: 1px solid rgba(81, 207, 102, 0.55) !important;
    border-radius: 7px !important;
    box-shadow: 0 0 16px rgba(81, 207, 102, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
  }

  /* VOLUME */
  .volume-tabs .mantine-Tabs-tab[data-active="true"],
  .volume-tabs .mantine-Tabs-tab[data-active],
  .volume-tabs .mantine-Tabs-tab[aria-selected="true"],
  .volume-tabs [data-active="true"],
  .volume-tabs [data-active],
  .volume-tabs [aria-selected="true"] {
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.45), rgba(255, 105, 180, 0.20)) !important;
    border: 1px solid rgba(255, 105, 180, 0.55) !important;
    border-radius: 7px !important;
    box-shadow: 0 0 16px rgba(255, 105, 180, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
  }

  /* ORGANIZATION */
  .organization-tabs .mantine-Tabs-tab[data-active="true"],
  .organization-tabs .mantine-Tabs-tab[data-active],
  .organization-tabs .mantine-Tabs-tab[aria-selected="true"],
  .organization-tabs [data-active="true"],
  .organization-tabs [data-active],
  .organization-tabs [aria-selected="true"] {
    background: linear-gradient(135deg, rgba(192, 132, 252, 0.45), rgba(192, 132, 252, 0.20)) !important;
    border: 1px solid rgba(192, 132, 252, 0.55) !important;
    border-radius: 7px !important;
    box-shadow: 0 0 16px rgba(192, 132, 252, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
  }

  /* CHAPTER */
  .chapter-tabs .mantine-Tabs-tab[data-active="true"],
  .chapter-tabs .mantine-Tabs-tab[data-active],
  .chapter-tabs .mantine-Tabs-tab[aria-selected="true"],
  .chapter-tabs [data-active="true"],
  .chapter-tabs [data-active],
  .chapter-tabs [aria-selected="true"] {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.45), rgba(56, 189, 248, 0.20)) !important;
    border: 1px solid rgba(56, 189, 248, 0.55) !important;
    border-radius: 7px !important;
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
  }

  /* EVENT */
  .event-tabs .mantine-Tabs-tab[data-active="true"],
  .event-tabs .mantine-Tabs-tab[data-active],
  .event-tabs .mantine-Tabs-tab[aria-selected="true"],
  .event-tabs [data-active="true"],
  .event-tabs [data-active],
  .event-tabs [aria-selected="true"] {
    background: linear-gradient(135deg, rgba(243, 156, 18, 0.45), rgba(243, 156, 18, 0.20)) !important;
    border: 1px solid rgba(243, 156, 18, 0.55) !important;
    border-radius: 7px !important;
    box-shadow: 0 0 16px rgba(243, 156, 18, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
    color: #ffffff !important;
  }
  ```

- [ ] **Step 4: Add tab list pill container block**

  Add this new block immediately before the base tab selector block:

  ```css
  /* Tab list pill container */
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

- [ ] **Step 5: Extend disabled state selectors to all 8 entity types (lines ~308–328)**

  Find the two disabled selector blocks. Extend each to include `volume`, `organization`, `chapter`, `event`:

  ```css
  .character-tabs .mantine-Tabs-tab[data-disabled],
  .gamble-tabs .mantine-Tabs-tab[data-disabled],
  .arc-tabs .mantine-Tabs-tab[data-disabled],
  .guide-tabs .mantine-Tabs-tab[data-disabled],
  .volume-tabs .mantine-Tabs-tab[data-disabled],
  .organization-tabs .mantine-Tabs-tab[data-disabled],
  .chapter-tabs .mantine-Tabs-tab[data-disabled],
  .event-tabs .mantine-Tabs-tab[data-disabled] {
    /* existing rules unchanged */
  }
  ```

  Do the same for the disabled-hover block.

- [ ] **Step 6: Commit**

  ```bash
  cd client && git add src/app/globals.css
  git commit -m "feat: glowing pill tab styles for all 8 entity types"
  ```

---

## Chunk 2: Supporting Components

### Task 4: ListPageHero — deeper bg, scan-lines, icon glow, badge glow

**Files:**
- Modify: `client/src/components/layouts/ListPageHero.tsx`

- [ ] **Step 1: Add scan-line texture overlay**

  Inside the root `<Box>` (after the existing decorative overlay `<Box>` elements), add:

  ```tsx
  {/* Scan-line texture */}
  <Box
    aria-hidden
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
      pointerEvents: 'none',
      zIndex: 0,
    }}
  />
  ```

- [ ] **Step 2: Intensify icon circle glow**

  Find the icon circle `<Box>` (around line 91–107). Update `boxShadow`:

  ```tsx
  // Before
  boxShadow: `0 8px 32px ${accentColor}60, 0 0 64px ${accentColor}20`

  // After
  boxShadow: `0 8px 40px ${accentColor}70, 0 0 80px ${accentColor}28, inset 0 1px 0 rgba(255,255,255,0.20)`
  ```

- [ ] **Step 3: Brighten diamond rule**

  Find the diamond rule `<Group>`. Update gradient stops and diamond color:

  ```tsx
  // Left line — before
  background: `linear-gradient(to right, transparent, ${accentColor}30)`
  // After
  background: `linear-gradient(to right, transparent, ${accentColor}50)`

  // Right line — before
  background: `linear-gradient(to left, transparent, ${accentColor}30)`
  // After
  background: `linear-gradient(to left, transparent, ${accentColor}50)`

  // Diamond character — before
  style={{ color: `${accentColor}90`, fontSize: '0.85rem' }}
  // After
  style={{ color: accentColor, fontSize: '0.85rem' }}
  ```

- [ ] **Step 4: Add box-shadow glow to count badge**

  Find the count `<Badge>`. Add `boxShadow` to its `style`:

  ```tsx
  // Add to existing style object:
  boxShadow: `0 0 16px ${accentColor}12`,
  ```

- [ ] **Step 5: Verify TypeScript**

  ```bash
  cd client && yarn tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 6: Commit**

  ```bash
  cd client && git add src/components/layouts/ListPageHero.tsx
  git commit -m "feat: ListPageHero deeper glow and scan-line overlay"
  ```

---

### Task 5: SearchToolbar — sticky state polish

**Files:**
- Modify: `client/src/components/layouts/SearchToolbar.tsx`

- [ ] **Step 1: Update stuck state styles (lines ~96–102)**

  Find the `isStuck` branch in the sticky `<Box>` style. Update three values:

  ```tsx
  // Before
  {
    backgroundColor: 'rgba(12, 8, 8, 0.94)',
    backdropFilter: 'blur(12px)',
    borderLeft: `3px solid ${accentColor}80`,
    boxShadow: `0 4px 16px rgba(0, 0, 0, 0.4), -4px 0 16px ${accentColor}15`
  }

  // After
  {
    backgroundColor: 'rgba(8, 8, 16, 0.97)',
    backdropFilter: 'blur(12px)',
    borderLeft: `3px solid ${accentColor}`,
    boxShadow: `0 4px 16px rgba(0, 0, 0, 0.5), -4px 0 24px ${accentColor}20`
  }
  ```

- [ ] **Step 2: Strengthen bottom separator gradient (lines ~112–125)**

  Find the gradient bottom line `<Box>`. Update the gradient:

  ```tsx
  // Before
  background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`

  // After
  background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)`
  ```

- [ ] **Step 3: Strengthen input focus box-shadow (lines ~163–166)**

  Find the TextInput `styles` object, specifically the `'&:focus'` rule:

  ```tsx
  // Before
  '&:focus': {
    borderColor: accentColor,
    boxShadow: `0 0 0 2px ${accentColor}20, 0 0 16px ${accentColor}18`
  }

  // After
  '&:focus': {
    borderColor: accentColor,
    boxShadow: `0 0 0 2px ${accentColor}20, 0 0 20px ${accentColor}22`
  }
  ```

- [ ] **Step 4: Verify TypeScript**

  ```bash
  cd client && yarn tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 5: Commit**

  ```bash
  cd client && git add src/components/layouts/SearchToolbar.tsx
  git commit -m "feat: SearchToolbar sticky state darker and more defined"
  ```

---

### Task 6: PaginationBar — active page glow

**Files:**
- Modify: `client/src/components/layouts/PaginationBar.tsx`

- [ ] **Step 1: Update Pagination styles (lines ~93–113)**

  Find the `<Pagination>` component's `styles` prop. Update the `control` object:

  ```tsx
  styles={{
    root: {
      '--pagination-accent': accentColor,
      '--pagination-accent-hover-bg': `${accentColor}20`,
      '--pagination-accent-hover-border': `${accentColor}40`
    } as React.CSSProperties,
    control: {
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      color: '#ffffff',
      transition: 'all 200ms ease',
      minWidth: rem(36),
      height: rem(36),
      borderRadius: '6px',
    },
    dots: {
      color: 'rgba(255, 255, 255, 0.3)'
    }
  }}
  ```

  Note: `borderRadius` changes from `'4px'` to `'6px'`. The `'&[data-active]'` selector for inline React styles won't work directly — instead, add a CSS class approach or override via a CSS module. Since `PaginationBar.module.css` already exists, add the active state there.

- [ ] **Step 2: Add active page styles to PaginationBar.module.css**

  Open `client/src/components/layouts/PaginationBar.module.css`. The file already has a `.control[data-active]` block — **replace that existing block entirely** with:

  ```css
  .control[data-active] {
    background: linear-gradient(135deg, var(--pagination-accent-start, rgba(77,171,247,0.50)), var(--pagination-accent-end, rgba(77,171,247,0.25))) !important;
    border: 1px solid var(--pagination-accent, rgba(77,171,247,0.70)) !important;
    box-shadow: 0 0 14px var(--pagination-glow, rgba(77,171,247,0.35)), inset 0 1px 0 rgba(255, 255, 255, 0.10) !important;
    color: #ffffff !important;
  }
  ```

  Then in `PaginationBar.tsx`, set the CSS variables on the `root` style object:

  ```tsx
  root: {
    '--pagination-accent': accentColor,
    '--pagination-accent-start': `${accentColor}50`,
    '--pagination-accent-end': `${accentColor}25`,
    '--pagination-glow': `${accentColor}35`,
    '--pagination-accent-hover-bg': `${accentColor}20`,
    '--pagination-accent-hover-border': `${accentColor}40`
  } as React.CSSProperties,
  ```

- [ ] **Step 3: Add textShadow to count label**

  Find the results info `<Text>` element (the one showing "1–12 of 48 CHARACTERS"). Add `textShadow` to its `style`:

  ```tsx
  style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', textShadow: `0 0 12px ${accentColor}30` }}
  ```

- [ ] **Step 4: Verify TypeScript**

  ```bash
  cd client && yarn tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 5: Commit**

  ```bash
  cd client && git add src/components/layouts/PaginationBar.tsx src/components/layouts/PaginationBar.module.css
  git commit -m "feat: PaginationBar active page glowing pill style"
  ```

---

### Task 7: HoverModal — entityLabel prop, accent stripe, eyebrow

**Files:**
- Modify: `client/src/components/HoverModal.tsx`
- Modify: `client/src/app/characters/CharactersPageContent.tsx`
- Modify: `client/src/app/gambles/GamblesPageContent.tsx`
- Modify: `client/src/app/arcs/ArcsPageContent.tsx`
- Modify: `client/src/app/volumes/VolumesPageContent.tsx`
- Modify: `client/src/app/quotes/QuotesPageContent.tsx`
- Modify: `client/src/app/organizations/OrganizationsPageContent.tsx`

- [ ] **Step 1: Add entityLabel prop and Text import**

  First, add `Text` to the Mantine imports — it is **not** currently imported in `HoverModal.tsx` and is required for the eyebrow label:

  ```tsx
  // Change this line (add Text):
  import { ActionIcon, Box, Paper, Stack, Text, rem } from '@mantine/core'
  ```

  Then find `interface HoverModalProps` and add:

  ```tsx
  /** Optional entity type label shown as eyebrow above content */
  entityLabel?: string
  ```

  Add `entityLabel` to the destructured props in the function signature.

- [ ] **Step 2: Add top accent stripe inside Paper**

  `Paper` has `p="md"` (16px padding). To make the stripe flush with the card edges, use negative margins. Add this as the very first child inside `Paper`, before the existing scan-line overlay `<Box>`:

  ```tsx
  {/* Top accent stripe — flush with card edges */}
  <Box aria-hidden style={{
    height: 3,
    background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}66 60%, transparent 100%)`,
    borderRadius: `${rem(8)} ${rem(8)} 0 0`,
    marginTop: rem(-16),
    marginLeft: rem(-16),
    marginRight: rem(-16),
    marginBottom: rem(8),
  }} />
  ```

- [ ] **Step 3: Add eyebrow entity label inside content Stack**

  Find the `<Box style={{ position: 'relative', zIndex: 1 }}>` that wraps the `<Stack>`. Inside the `<Stack>`, add the eyebrow as the first child:

  ```tsx
  <Stack gap="sm">
    {entityLabel && (
      <Text
        className="eyebrow-label"
        style={{ color: accentColor, fontSize: '0.6rem', letterSpacing: '0.22em' }}
      >
        {entityLabel.toUpperCase()}
      </Text>
    )}
    {children}
  </Stack>
  ```

- [ ] **Step 4: Strengthen outer glow, darken background, and remove unused import**

  Find the `<Paper>` element. Update `style`:

  ```tsx
  style={{
    backgroundColor: 'rgba(6,6,14,0.97)',
    border: `1px solid ${accentColor}CC`,
    backdropFilter: 'blur(10px)',
    width: rem(width),
    maxWidth: '90vw',
    position: 'relative',
    boxShadow: `0 24px 48px rgba(0,0,0,0.80), 0 0 0 1px ${accentColor}20, 0 0 32px ${accentColor}08, inset 0 0 0 1px ${accentColor}18`
  }}
  ```

  Because `backgroundColor` is now hardcoded, `backgroundStyles` is no longer used in this file. Remove it from the import:

  ```tsx
  // Before (example)
  import { backgroundStyles, ... } from '../../lib/mantine-theme'
  // After: remove backgroundStyles from that import line
  ```

- [ ] **Step 5: Verify TypeScript**

  ```bash
  cd client && yarn tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 6: Add entityLabel to all 6 HoverModal call sites**

  In each file, find the `<HoverModal` JSX tag and add `entityLabel`:

  - `CharactersPageContent.tsx` → `entityLabel="character"`
  - `GamblesPageContent.tsx` → `entityLabel="gamble"`
  - `ArcsPageContent.tsx` → `entityLabel="arc"`
  - `VolumesPageContent.tsx` → `entityLabel="volume"`
  - `QuotesPageContent.tsx` → `entityLabel="quote"`
  - `OrganizationsPageContent.tsx` → `entityLabel="organization"`

- [ ] **Step 7: Verify TypeScript and lint**

  ```bash
  cd client && yarn tsc --noEmit
  ```
  Expected: no errors

  ```bash
  cd client && yarn lint
  ```
  Expected: no errors (verify no unused import warnings on `backgroundStyles`)

- [ ] **Step 8: Commit**

  ```bash
  cd client && git add \
    src/components/HoverModal.tsx \
    src/app/characters/CharactersPageContent.tsx \
    src/app/gambles/GamblesPageContent.tsx \
    src/app/arcs/ArcsPageContent.tsx \
    src/app/volumes/VolumesPageContent.tsx \
    src/app/quotes/QuotesPageContent.tsx \
    src/app/organizations/OrganizationsPageContent.tsx
  git commit -m "feat: HoverModal accent stripe, eyebrow label, entityLabel prop"
  ```

---

## Chunk 3: DetailPageHeader + Call-site Cleanup

### Task 8: DetailPageHeader — cinematic centered layout

**Files:**
- Modify: `client/src/components/layouts/DetailPageHeader.tsx`

- [ ] **Step 1: Update imports and make children optional**

  `Stack` is already imported in `DetailPageHeader.tsx`. `Title` is **not** imported — add it unconditionally:

  ```tsx
  // Change the Mantine import line to include Title:
  import { Box, Card, Group, Stack, Title, Text, useMantineTheme } from '@mantine/core'
  ```

  Add `backgroundStyles` to the import from `mantine-theme`:

  ```tsx
  import {
    getEntityThemeColor,
    getCardStyles,
    backgroundStyles,
    type EntityAccentKey
  } from '../../lib/mantine-theme'
  ```

  In `DetailPageHeaderProps`, make `children` optional (it is currently required — `children: React.ReactNode`):

  ```tsx
  // Before
  children: React.ReactNode
  // After
  children?: React.ReactNode
  ```

- [ ] **Step 2: Replace the content layout**

  Find the `{/* Content */}` `<Box>` (around line 94). Replace it and everything inside with the cinematic layout:

  ```tsx
  {/* Cinematic atmospheric area */}
  <Box
    style={{
      position: 'relative',
      paddingTop: theme.spacing.xl,
      paddingBottom: 0,
      overflow: 'hidden',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
    {/* Entity tint gradient */}
    <Box aria-hidden style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(180deg, ${accentColor}10 0%, ${accentColor}02 100%)`,
      pointerEvents: 'none',
    }} />
    {/* Radial accent bloom */}
    <Box aria-hidden style={{
      position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
      width: '140%', height: '160%',
      background: `radial-gradient(ellipse at 50% 0%, ${accentColor}20, transparent 65%)`,
      pointerEvents: 'none',
    }} />
    {/* Scan-line texture */}
    <Box aria-hidden style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.14) 3px, rgba(0,0,0,0.14) 4px)',
      pointerEvents: 'none',
    }} />
    {/* Heavy bottom gradient fade */}
    <Box aria-hidden style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: '40%',
      background: `linear-gradient(transparent, ${backgroundStyles.page(theme)})`,
      pointerEvents: 'none',
      zIndex: 3,
    }} />

    {/* Eyebrow entity label */}
    <Box
      aria-hidden
      className="eyebrow-label"
      style={{
        position: 'relative', zIndex: 4,
        marginBottom: theme.spacing.xs,
        color: accentColor,
        background: `${accentColor}15`,
        border: `1px solid ${accentColor}40`,
        padding: '2px 10px',
        borderRadius: 2,
        fontSize: '0.55rem',
        letterSpacing: '0.22em',
        textShadow: `0 0 8px ${accentColor}60`,
      }}
    >
      {entityType.toUpperCase()}
    </Box>

    {/* Portrait image — centered */}
    {showImage && (
      <Box
        style={{
          position: 'relative', zIndex: 4,
          width: imageWidth,
          height: imageHeight,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          border: `2px solid ${accentColor}B3`,
          boxShadow: `0 0 40px ${accentColor}45, 0 12px 40px rgba(0,0,0,0.8)`,
          flexShrink: 0,
        }}
      >
        <ErrorBoundary>
          <MediaThumbnail
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
            maxWidth={imageWidth}
            maxHeight={imageHeight}
          />
        </ErrorBoundary>
      </Box>
    )}

    {/* Entity name — overlaid at bottom of atmospheric area */}
    <Box style={{ position: 'relative', zIndex: 5, marginTop: theme.spacing.md, paddingBottom: theme.spacing.xl, textAlign: 'center' }}>
      <Title
        order={1}
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#ffffff',
          fontFamily: 'var(--font-opti-goudy-text), serif',
          textShadow: `0 2px 20px rgba(0,0,0,0.95), 0 0 40px ${accentColor}20`,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}
      >
        {entityName}
      </Title>
    </Box>
  </Box>

  {/* Children area — badges, stats, quick actions */}
  {children && (
    <Box
      style={{
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        borderTop: `1px solid ${accentColor}15`,
        background: 'rgba(0,0,0,0.2)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Group justify="center" wrap="wrap" gap={theme.spacing.sm}>
        {children}
      </Group>
    </Box>
  )}
  ```

- [ ] **Step 3: Remove the old top accent stripe, content Box, and borderLeft styles**

  The old `<Box aria-hidden style={{ height: 4, background: ... }} />` (top accent stripe) should be kept — it's outside the content area. The old `<Box p={theme.spacing.lg} style={{ position: 'relative', zIndex: 1, borderLeft: ... }}>` and its entire content must be replaced with the new layout above.

- [ ] **Step 4: Verify TypeScript**

  ```bash
  cd client && yarn tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 5: Commit**

  ```bash
  cd client && git add src/components/layouts/DetailPageHeader.tsx
  git commit -m "feat: DetailPageHeader cinematic centered layout"
  ```

---

### Task 9: Detail page call-site cleanup — remove duplicate entity Title

**Files:**
- Modify: `client/src/app/characters/[id]/CharacterPageClient.tsx`
- Modify: `client/src/app/gambles/[id]/GamblePageClient.tsx`
- Modify: `client/src/app/arcs/[id]/ArcPageClient.tsx`
- Modify: `client/src/app/volumes/[id]/VolumePageClient.tsx`
- Modify: `client/src/app/chapters/[id]/ChapterPageClient.tsx`
- Modify: `client/src/app/events/[id]/EventPageClient.tsx`
- Modify: `client/src/app/organizations/[id]/OrganizationPageClient.tsx`

In each file: find the `<DetailPageHeader>` JSX and remove the `<Title order={1}>` element that renders the entity name. Keep all other children (badges, organization links, alternate names, quick actions).

**Important nuances per file:**

- **CharacterPageClient**: Remove the `<Title order={1} size="2.8rem" ...>{character.name}</Title>`. The surrounding `<Stack>` remains with alternate name badges.

- **GamblePageClient**: The Title is inside a `<Group>` with a `<Crown>` icon. Remove the entire `<Group>` containing Crown + Title (both exist purely to display the name with a decorative icon). The remaining Stack with badges continues normally.

- **ArcPageClient**: Remove the `<Title order={1}>` rendering the arc name. Check that any containing Stack/Group that held only the Title is also removed if it becomes empty.

- **VolumePageClient**: Title is inside a `<Group>` with `<Book size={28}>`. Remove the entire Group (icon + Title together).

- **ChapterPageClient**: This file uses a `<Text>` element (not `<Title>`) for the entity name. Find the `<Text>` element displaying the chapter name inside `DetailPageHeader` children and remove it. Do not look for a `<Title>`.

- **EventPageClient**: The entity name is inside a `<Group>` with a `<CalendarSearch>` icon and a `<Title order={1}>`. Remove the entire `<Group>` block (icon + Title together) — same pattern as GamblePageClient's Crown+Title Group. Do not leave the empty Group behind.

- **OrganizationPageClient**: Title is inside a `<Group>` with `<Shield size={28}>`. Remove the entire Group (icon + Title together).

- [ ] **Step 1: Remove Title from CharacterPageClient.tsx**

  Find lines ~170–185 (the `<Title order={1} size="2.8rem"...>{character.name}</Title>` inside the first `<Stack>` of DetailPageHeader children). Delete the `<Title>` element. If the `<Stack>` that contained it becomes empty or contains only the alternate names group, keep the Stack.

- [ ] **Step 2: Remove Title from GamblePageClient.tsx**

  Find lines ~252–269 (the `<Group>` containing `<Crown>` icon and `<Title order={1}>`). Remove the entire `<Group>` block (Crown + Title together). Verify the outer `<Stack gap={theme.spacing.sm}>` still has the remaining badge content.

- [ ] **Step 3: Remove Title from ArcPageClient.tsx**

  Find the `<Title order={1}>` rendering the arc name inside DetailPageHeader children. Remove it. Check if the containing Stack/Group becomes empty and clean it up if so.

- [ ] **Step 4: Remove entity name element from VolumePageClient.tsx**

  The Title is inside a `<Group>` with a `<Book size={28}>` icon. Remove the entire `<Group>` (icon + Title together) — the Group exists purely to display the name with an icon.

- [ ] **Step 5: Remove entity name element from ChapterPageClient.tsx**

  **Note:** ChapterPageClient uses a `<Text>` element (not `<Title>`) for the chapter name. Find and remove the `<Text>` element that displays the chapter name inside `DetailPageHeader` children. Do not look for `<Title>`.

- [ ] **Step 6: Remove entity name group from EventPageClient.tsx**

  Find the `<Group>` containing a `<CalendarSearch>` icon and `<Title order={1}>` (same pattern as GamblePageClient). Remove the entire `<Group>` block — both the icon and the Title together. Verify no empty Group remains.

- [ ] **Step 7: Remove Title from OrganizationPageClient.tsx**

  The Title is inside a `<Group>` with a `<Shield size={28}>` icon. Remove the entire `<Group>` (icon + Title together) — the Group exists purely to display the name with an icon.

- [ ] **Step 8: Verify TypeScript compiles cleanly**

  ```bash
  cd client && yarn tsc --noEmit
  ```
  Expected: no errors

- [ ] **Step 9: Run linter**

  ```bash
  cd client && yarn lint
  ```
  Expected: no errors (if unused imports appear after Title removal, remove them)

- [ ] **Step 10: Run production build to verify**

  ```bash
  cd client && yarn build
  ```
  Expected: build completes successfully with no TypeScript errors

- [ ] **Step 11: Commit**

  ```bash
  cd client && git add \
    src/app/characters/\[id\]/CharacterPageClient.tsx \
    src/app/gambles/\[id\]/GamblePageClient.tsx \
    src/app/arcs/\[id\]/ArcPageClient.tsx \
    src/app/volumes/\[id\]/VolumePageClient.tsx \
    src/app/chapters/\[id\]/ChapterPageClient.tsx \
    src/app/events/\[id\]/EventPageClient.tsx \
    src/app/organizations/\[id\]/OrganizationPageClient.tsx
  git commit -m "feat: remove duplicate entity name from DetailPageHeader children"
  ```

---

## Final Verification

- [ ] **Visual check — list pages**: Open `http://localhost:3000/characters`, `/gambles`, `/arcs`. Confirm cards have deeper glows, more dramatic hover tilt, and darker bottoms.
- [ ] **Visual check — detail pages**: Open `/characters/1`, `/gambles/1`. Confirm cinematic header with centered portrait, name overlaid, badges below. Entity name appears exactly once.
- [ ] **Visual check — tabs**: On a detail page, click through tabs. Confirm active tab shows gradient glow pill. Inactive tabs are dimmer.
- [ ] **Visual check — hover modal**: Hover over a card. Confirm accent stripe at top and entity label eyebrow.
- [ ] **Visual check — pagination**: Navigate to page 2. Confirm active page button glows.
- [ ] **Visual check — sticky toolbar**: Scroll down on a list page. Confirm sticky toolbar is darker with stronger left border.
