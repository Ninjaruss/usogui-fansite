# Detail Page Sub-Components — Bold Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a new component language (accent-bar section headers, icon-row detail cards, entity chips, pull-quote cards, type-badged event cards, faction display) across all 7 detail page PageClient files.

**Architecture:** All changes are inline JSX within each `*PageClient.tsx` file — no new shared components. Patterns are applied per-page using existing helpers (`getEntityThemeColor`, `getAlphaColor`, `getCardStyles`) and existing Lucide React imports.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI v7, Lucide React, existing `mantine-theme.ts` utilities

**Spec:** `docs/superpowers/specs/2026-03-15-detail-page-subcomponents-design.md`

---

## Shared Pattern Reference

These JSX snippets are used in every task below. Read this section once before implementing any task.

### Pattern 1 — Section Card Header

Every affected `<Card>` gets `padding={0}`. The accent bar is the first child of the Card. All content goes inside an inner `<Box>`.

```tsx
// CARD WRAPPER (all affected cards)
<Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, accentColor)}>
  {/* Part A — top accent bar */}
  <Box style={{
    height: 3,
    borderRadius: '6px 6px 0 0',
    background: `linear-gradient(90deg, ${accentColor}, transparent 70%)`,
  }} />
  {/* Part B — card body */}
  <Box p="lg">   {/* use p="md" for smaller cards */}
    {/* Header row */}
    <Group gap={10} mb={14} align="center">
      <Box style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: getAlphaColor(accentColor, 0.15),
        border: `1px solid ${getAlphaColor(accentColor, 0.30)}`,
      }}>
        <IconHere size={16} color={accentColor} />
      </Box>
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: accentColor, opacity: 0.85 }}>
        SECTION TITLE
      </Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(accentColor, 0.20)}, transparent)` }} />
    </Group>
    {/* ...card content... */}
  </Box>
</Card>
```

For Quote Cards, use `radius="xl"` and `borderRadius: '12px 12px 0 0'` on the accent bar.

### Pattern 1 — Details Header (no icon badge)

```tsx
<Group gap={10} mb={14} align="center">
  <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: accentColor, opacity: 0.85 }}>
    DETAILS
  </Text>
  <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(accentColor, 0.20)}, transparent)` }} />
</Group>
```

### Pattern 2 — Details Row

```tsx
<Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
  <Box style={{
    width: 24, height: 24, borderRadius: 5, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: getAlphaColor(accentColor, 0.10),
    border: `1px solid ${getAlphaColor(accentColor, 0.20)}`,
  }}>
    <IconHere size={14} color={accentColor} />
  </Box>
  <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Label</Text>
  <Text style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>Value</Text>
</Box>
// Last row omits borderBottom
```

### Pattern 3 — Character Chip

```tsx
<Box
  component={Link}
  href={`/characters/${char.id}`}
  style={{
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#131313', border: '1px solid #222',
    borderRadius: 8, padding: '6px 10px',
    textDecoration: 'none', cursor: 'pointer',
    transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`,
  }}
  onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor }}
  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#222' }}
>
  {/* Avatar */}
  {char.imageFileName && (char.firstAppearanceChapter ?? 0) <= (user?.userProgress ?? 0) ? (
    <Box style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
      <img
        src={`/api/media/character/${char.imageFileName}`}
        alt={char.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
      />
    </Box>
  ) : (
    <Box style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: getAlphaColor(accentColor, 0.20),
      border: `1px solid ${getAlphaColor(accentColor, 0.40)}`,
      fontSize: 10, fontWeight: 700, color: accentColor,
    }}>
      {char.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
    </Box>
  )}
  <Box>
    <Text style={{ fontSize: 13, fontWeight: 600, color: '#ddd' }}>{char.name}</Text>
    {role && <Text style={{ fontSize: 10, color: '#555' }}>{role}</Text>}
  </Box>
</Box>
```

---

## Chunk 1: Shared Context + CharacterPageClient + ArcPageClient

### Task 1: CharacterPageClient

**Files:**
- Modify: `client/src/app/characters/[id]/CharacterPageClient.tsx`

**Changes required:**
1. Add new Lucide imports: `Scroll` (for Backstory), already has `User` — verify `User` is imported
2. Description card: remove `borderLeft`, add accent bar, new section header with `User` icon
3. Backstory card: remove `borderLeft` from style (it doesn't have it currently, just add accent bar), add section header with `Scroll` icon
4. Organizations card: add accent bar, replace plain `<Text fontSize: 9>` label with section header (`Users` icon, title "ORGANIZATIONS")
5. Details sidebar card: full replacement with Pattern 2 using `getCardStyles`
6. RelatedContentSection wrapper cards (3): fix `background: '#111'` to `getCardStyles(theme, entityColors.arc/gamble/quote)`

- [ ] **Step 1: Add missing imports**

In `CharacterPageClient.tsx`, find the Lucide import line:
```tsx
import { User, Calendar, Image as ImageIcon, MessageSquare } from 'lucide-react'
```
Change to:
```tsx
import { User, Scroll, Users, BookOpen, Crown, Building2, Bookmark, Calendar, Image as ImageIcon, MessageSquare } from 'lucide-react'
```

Find the `mantine-theme` import line (around line 24). Add `getAlphaColor` if not already present:
```tsx
import { getEntityThemeColor, getAlphaColor, getCardStyles, textColors, backgroundStyles } from '../../../lib/mantine-theme'
```
(Only add `getAlphaColor` — keep all existing imports from that line.)

- [ ] **Step 2: Update Description card**

Find the Description card (starts around line 218). Replace the entire `<Card>` with:

```tsx
<Card
  withBorder
  radius="lg"
  shadow="lg"
  padding={0}
  style={getCardStyles(theme, entityColors.character)}
>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.character}, transparent 70%)` }} />
  <Box p="lg">
    <Group gap={10} mb={14} align="center">
      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.15), border: `1px solid ${getAlphaColor(entityColors.character, 0.30)}` }}>
        <User size={16} color={entityColors.character} />
      </Box>
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.character, opacity: 0.85 }}>
        Description
      </Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.character, 0.20)}, transparent)` }} />
    </Group>
    {character.description ? (
      <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
        <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
          <EnhancedSpoilerMarkdown
            content={character.description}
            enableEntityEmbeds
            compactEntityCards={false}
          />
        </Box>
      </TimelineSpoilerWrapper>
    ) : (
      <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic' }}>
        No description available yet.
      </Text>
    )}
  </Box>
</Card>
```

- [ ] **Step 3: Update Backstory card**

Find the Backstory card (around line 258). Replace with:

```tsx
{character.backstory && (
  <Card
    withBorder
    radius="lg"
    shadow="lg"
    padding={0}
    style={getCardStyles(theme, entityColors.character)}
  >
    <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.character}, transparent 70%)` }} />
    <Box p="lg">
      <Group gap={10} mb={14} align="center">
        <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.15), border: `1px solid ${getAlphaColor(entityColors.character, 0.30)}` }}>
          <Scroll size={16} color={entityColors.character} />
        </Box>
        <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.character, opacity: 0.85 }}>
          Backstory
        </Text>
        <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.character, 0.20)}, transparent)` }} />
      </Group>
      <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
        <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
          <EnhancedSpoilerMarkdown
            content={character.backstory}
            enableEntityEmbeds
            compactEntityCards={false}
          />
        </Box>
      </TimelineSpoilerWrapper>
    </Box>
  </Card>
)}
```

- [ ] **Step 4: Update Organizations card**

Find the Organizations card (around line 289). Replace with:

```tsx
{character.organizations && character.organizations.length > 0 && (
  <Card
    withBorder
    radius="lg"
    shadow="lg"
    padding={0}
    style={getCardStyles(theme, entityColors.organization)}
  >
    <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.organization}, transparent 70%)` }} />
    <Box p="md">
      <Group gap={10} mb={14} align="center">
        <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.organization, 0.15), border: `1px solid ${getAlphaColor(entityColors.organization, 0.30)}` }}>
          <Users size={16} color={entityColors.organization} />
        </Box>
        <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.organization, opacity: 0.85 }}>
          Organizations
        </Text>
        <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.organization, 0.20)}, transparent)` }} />
      </Group>
      <CharacterOrganizationMemberships
        characterId={character.id}
        characterName={character.name}
      />
    </Box>
  </Card>
)}
```

Note: `Users` (plural, from lucide-react) is distinct from Mantine's `User` — both are imported in Step 1.

- [ ] **Step 5: Update Details sidebar card**

Find the Details sidebar card (around line 314, starts with `background: '#111'`). Replace the entire Card with:

```tsx
<Card
  withBorder
  radius="lg"
  shadow="md"
  padding={0}
  style={getCardStyles(theme, entityColors.character)}
>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.character}, transparent 70%)` }} />
  <Box p="md">
    <Group gap={10} mb={14} align="center">
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.character, opacity: 0.85 }}>
        Details
      </Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.character, 0.20)}, transparent)` }} />
    </Group>
    {character.firstAppearanceChapter != null && (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.10), border: `1px solid ${getAlphaColor(entityColors.character, 0.20)}` }}>
          <BookOpen size={14} color={entityColors.character} />
        </Box>
        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Debut</Text>
        <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>Ch. {character.firstAppearanceChapter}</Text>
      </Box>
    )}
    {character.organizations && character.organizations.length > 0 && (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.10), border: `1px solid ${getAlphaColor(entityColors.character, 0.20)}` }}>
          <Building2 size={14} color={entityColors.character} />
        </Box>
        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Organization</Text>
        <Text
          component={Link}
          href={`/organizations/${character.organizations[0].id}`}
          style={{ fontSize: 12, fontWeight: 700, color: entityColors.organization, textDecoration: 'none' }}
        >
          {character.organizations[0].name}
        </Text>
      </Box>
    )}
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.10), border: `1px solid ${getAlphaColor(entityColors.character, 0.20)}` }}>
        <Crown size={14} color={entityColors.character} />
      </Box>
      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Gambles</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{gambles.length}</Text>
    </Box>
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.10), border: `1px solid ${getAlphaColor(entityColors.character, 0.20)}` }}>
        <Bookmark size={14} color={entityColors.character} />
      </Box>
      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Arcs</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{arcs.length}</Text>
    </Box>
  </Box>
</Card>
```

All Lucide icons are already added in Step 1. No additional import changes needed here.

- [ ] **Step 6: Fix RelatedContentSection wrapper cards**

Find the three sidebar wrapper cards (around lines 376, 399, 423). Each currently has:
```tsx
style={{ background: '#111', border: '1px solid #1a1a1a' }}
```

Replace each wrapper card's style with the appropriate entity color:
- Story Arcs wrapper: `style={getCardStyles(theme, entityColors.arc)}`
- Gambles wrapper: `style={getCardStyles(theme, entityColors.gamble)}`
- Quotes wrapper: `style={getCardStyles(theme, entityColors.quote)}`

Keep `withBorder`, `radius="lg"`, `shadow="md"`, `p="md"` as-is on these wrappers. No accent bar needed here — these are list container cards, not content section cards.

Add `quote` to the `entityColors` object:
```tsx
const entityColors = {
  character: getEntityThemeColor(theme, 'character'),
  arc: getEntityThemeColor(theme, 'arc'),
  gamble: getEntityThemeColor(theme, 'gamble'),
  guide: getEntityThemeColor(theme, 'guide'),
  quote: getEntityThemeColor(theme, 'quote'),
  media: getEntityThemeColor(theme, 'media'),
  organization: getEntityThemeColor(theme, 'organization')
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | grep -E "error|warning|✓|Failed" | head -30
```

Expected: no TypeScript errors relating to CharacterPageClient. If errors appear, fix them before proceeding.

- [ ] **Step 8: Commit**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/app/characters/[id]/CharacterPageClient.tsx && git commit -m "feat: apply bold redesign patterns to CharacterPageClient"
```

---

### Task 2: ArcPageClient

**Files:**
- Modify: `client/src/app/arcs/[id]/ArcPageClient.tsx`

**Changes required:**
1. Arc description card: remove floating `<BookOpen size={24}>` icon, remove `borderLeft`, add accent bar + section header (`BookOpen` icon, "ABOUT THIS ARC")
2. Chapter Navigation card: remove floating `<BookOpen size={24}>` icon, add accent bar + section header (`ArrowRight` icon, "CHAPTER NAVIGATION")
3. Details sidebar card: full replacement with Pattern 2
4. Media tab card: add accent bar + section header (`Image` icon, "MEDIA GALLERY") replacing `<ImageIcon> + <Title>`

- [ ] **Step 1: Add `ArrowRight` to Lucide import**

Find:
```tsx
import { ArrowUp, BookOpen, Calendar, Image as ImageIcon, MessageSquare } from 'lucide-react'
```
Change to:
```tsx
import { ArrowUp, BookOpen, ArrowRight, Crown, GitBranch, Calendar, Image as ImageIcon, MessageSquare } from 'lucide-react'
```

- [ ] **Step 2: Update Arc description card**

Find the Arc description card (around line 246). Remove the standalone `<Group>` containing `<BookOpen size={24}>` (the floating icon group, ~lines 251–253). Remove `borderLeft: 3px solid entityColors.arc` from the card style. Convert card to `padding={0}`, add accent bar, replace the eyebrow `<Group>` with new section header:

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.arc)}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.arc}, transparent 70%)` }} />
  <Box p="lg">
    <Group gap={10} mb={14} align="center">
      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.arc, 0.15), border: `1px solid ${getAlphaColor(entityColors.arc, 0.30)}` }}>
        <BookOpen size={16} color={entityColors.arc} />
      </Box>
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.arc, opacity: 0.85 }}>
        About This Arc
      </Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.arc, 0.20)}, transparent)` }} />
    </Group>
    <TimelineSpoilerWrapper chapterNumber={initialArc.startChapter}>
      <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
        <EnhancedSpoilerMarkdown
          content={initialArc.description}
          className="arc-description"
          enableEntityEmbeds
          compactEntityCards={false}
        />
      </Box>
    </TimelineSpoilerWrapper>
  </Box>
</Card>
```

- [ ] **Step 3: Update Chapter Navigation card**

Find the Chapter Navigation card (around line 278). Remove the floating `<Group>` with `<BookOpen size={20}>`. Convert to `padding={0}`, add accent bar, replace eyebrow with new section header using `ArrowRight` icon:

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(entityColors.arc, 0.4)}` }}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.arc}, transparent 70%)` }} />
  <Box p="md">
    <Group gap={10} mb={14} align="center">
      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.arc, 0.15), border: `1px solid ${getAlphaColor(entityColors.arc, 0.30)}` }}>
        <ArrowRight size={16} color={entityColors.arc} />
      </Box>
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.arc, opacity: 0.85 }}>
        Chapter Navigation
      </Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.arc, 0.20)}, transparent)` }} />
    </Group>
    <Group gap={theme.spacing.md} wrap="wrap">
      {/* keep existing Start/End chapter buttons unchanged */}
    </Group>
  </Box>
</Card>
```

- [ ] **Step 4: Update Details sidebar card**

Find the Details card in aside column (around line 343, currently uses `getCardStyles(theme, entityColors.arc)` already — good). Convert to `padding={0}`, add accent bar and icon rows:

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.arc)}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.arc}, transparent 70%)` }} />
  <Box p="md">
    <Group gap={10} mb={14} align="center">
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.arc, opacity: 0.85 }}>Details</Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.arc, 0.20)}, transparent)` }} />
    </Group>
    {initialArc.startChapter != null && initialArc.endChapter != null && (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.arc, 0.10), border: `1px solid ${getAlphaColor(entityColors.arc, 0.20)}` }}>
          <BookOpen size={14} color={entityColors.arc} />
        </Box>
        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Chapters</Text>
        <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>{initialArc.startChapter}–{initialArc.endChapter}</Text>
      </Box>
    )}
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: initialArc.children?.length ? '1px solid #161616' : 'none' }}>
      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.arc, 0.10), border: `1px solid ${getAlphaColor(entityColors.arc, 0.20)}` }}>
        <Crown size={14} color={entityColors.arc} />
      </Box>
      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Gambles</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>{initialGambles.length}</Text>
    </Box>
    {initialArc.children != null && initialArc.children.length > 0 && (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.arc, 0.10), border: `1px solid ${getAlphaColor(entityColors.arc, 0.20)}` }}>
          <GitBranch size={14} color={entityColors.arc} />
        </Box>
        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Sub-arcs</Text>
        <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>{initialArc.children.length}</Text>
      </Box>
    )}
  </Box>
</Card>
```

All required icons are already added in Step 1. No additional import changes needed here.

- [ ] **Step 5: Update Media tab card**

Find the Media tab `<Card>` (around line 432). Replace the `<Group>` header containing `<ImageIcon size={20}>` and `<Title order={4}>` with the new section header pattern, keeping "View All" button right-aligned:

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(getEntityThemeColor(theme, 'media'), 0.4)}` }}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${getEntityThemeColor(theme, 'media')}, transparent 70%)` }} />
  <Box p="md">
    <Group justify="space-between" align="center" mb={14}>
      <Group gap={10} align="center">
        <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(getEntityThemeColor(theme, 'media'), 0.15), border: `1px solid ${getAlphaColor(getEntityThemeColor(theme, 'media'), 0.30)}` }}>
          <ImageIcon size={16} color={getEntityThemeColor(theme, 'media')} />
        </Box>
        <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: getEntityThemeColor(theme, 'media'), opacity: 0.85 }}>
          Media Gallery
        </Text>
      </Group>
      <Button component={Link} href={`/media?ownerType=arc&ownerId=${initialArc.id}`} variant="outline" c={getEntityThemeColor(theme, 'media')} size="sm" radius="xl">
        View All
      </Button>
    </Group>
    <MediaGallery ownerType="arc" ownerId={initialArc.id} purpose="gallery" limit={8} showTitle={false} compactMode showFilters={false} initialMediaId={mediaId} />
  </Box>
</Card>
```

Note: Media tab card does NOT use the trailing gradient line in the header (the "View All" button fills the right side instead).

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | grep -E "error|warning|✓|Failed" | head -30
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/app/arcs/[id]/ArcPageClient.tsx && git commit -m "feat: apply bold redesign patterns to ArcPageClient"
```

---

## Chunk 2: GamblePageClient + VolumePageClient

### Task 3: GamblePageClient

**Files:**
- Modify: `client/src/app/gambles/[id]/GamblePageClient.tsx`

**Changes required:**
1. Gamble description card: remove floating `<Crown size={24}>`, remove `borderLeft`, add accent bar + section header (`Crown` icon, "ABOUT THIS GAMBLE")
2. Rules card: remove floating `<BookOpen size={24}>`, add accent bar + section header (`BookOpen` icon, "RULES")
3. Win Condition card: remove floating `<Trophy size={24}>`, add accent bar + section header (`Trophy` icon, "WIN CONDITION")
4. Explanation & Analysis card: remove floating `<Lightbulb size={24}>`, add accent bar + section header (`Lightbulb` icon, "EXPLANATION & ANALYSIS")
5. Participants/Factions card: remove floating `<Users size={20}>`, add accent bar + section header (`Users` icon, "PARTICIPANTS")
6. Faction display: apply Pattern 6 (per-faction cards with header band + member rows with initials avatars)
7. Details sidebar card: full replacement (currently raw `Box` with `#111`) with Pattern 2
8. Media tab card: same Media header pattern as ArcPageClient

- [ ] **Step 1: Add missing imports**

Find current Lucide import: `import { Crown, Users, Trophy, Calendar, BookOpen, Image as ImageIcon, MessageSquare, Lightbulb } from 'lucide-react'`

Add `Map` (for Arc row in Details sidebar). Full import:
```tsx
import { Crown, Users, Trophy, Calendar, BookOpen, Map, Image as ImageIcon, MessageSquare, Lightbulb } from 'lucide-react'
```

Find the `mantine-theme` import (around line 44). `getCardStyles` is NOT currently imported — add it:
```tsx
import { getEntityThemeColor, getAlphaColor, getCardStyles, textColors, backgroundStyles, ... } from '../../../lib/mantine-theme'
```
(Keep all existing imports from that line; only add `getCardStyles`.)

- [ ] **Step 2: Update Gamble description card**

Find the Gamble description card (~line 300). Remove the standalone `<Group>` containing `<Crown size={24} color={gambleColor} />` (floating icon). Remove `borderLeft: 3px solid ${gambleColor}` from style. Convert to `padding={0}`, add accent bar, new section header:

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={{ background: backgroundStyles.card, border: `1px solid ${getAlphaColor(gambleColor, 0.4)}` }}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${gambleColor}, transparent 70%)` }} />
  <Box p="lg">
    <Group gap={10} mb={14} align="center">
      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.15), border: `1px solid ${getAlphaColor(gambleColor, 0.30)}` }}>
        <Crown size={16} color={gambleColor} />
      </Box>
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: gambleColor, opacity: 0.85 }}>About This Gamble</Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(gambleColor, 0.20)}, transparent)` }} />
    </Group>
    {/* keep existing description content unchanged */}
  </Box>
</Card>
```

- [ ] **Step 3: Update Rules, Win Condition, Explanation cards**

Apply the same Pattern 1 treatment (accent bar + section header, `padding={0}`, inner `<Box p="lg">`) to:
- **Rules card** (~line 334): icon `BookOpen`, title "Rules"
- **Win Condition card** (~line 359): icon `Trophy`, title "Win Condition". Keep the `manga-panel-border` Box for the content.
- **Explanation & Analysis card** (~line 398): icon `Lightbulb`, title "Explanation & Analysis"

For each: remove the floating icon `<Group>` and the eyebrow `<Group>` pattern. Add accent bar as first child. Add section header as first child of inner Box.

- [ ] **Step 4: Update Participants/Factions card + apply Pattern 6**

Find the Participants/Factions card (~line 425). Remove floating `<Users size={20}>` and eyebrow Group. Add accent bar + section header (`Users` icon, "Participants"). Then apply Pattern 6 faction display:

**For 2-faction layout**, replace the existing `<Group align="stretch" gap={0} wrap="nowrap">` with:

```tsx
<Box style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
  {initialGamble.factions
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((faction, idx) => {
      const factionAccent = idx === 0 ? gambleColor : characterColor
      const factionName = faction.name || (faction.supportedGambler ? `${faction.supportedGambler.name}'s Side` : 'Faction')
      return (
        <React.Fragment key={faction.id}>
          <Box style={{ flex: 1, minWidth: 0, border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
            {/* Faction header band */}
            <Box style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: getAlphaColor(factionAccent, 0.10), borderBottom: `1px solid ${getAlphaColor(factionAccent, 0.20)}` }}>
              <Box style={{ width: 8, height: 8, borderRadius: '50%', background: factionAccent, flexShrink: 0 }} />
              <Text style={{ fontSize: 13, fontWeight: 700, color: '#ddd' }}>{factionName}</Text>
              {faction.supportedGambler && faction.name && (
                <Badge variant="light" size="sm" radius="md" style={{ background: getAlphaColor(gambleColor, 0.2), border: `1px solid ${getAlphaColor(gambleColor, 0.4)}` }} c={textColors.gamble}>
                  Supporting {faction.supportedGambler.name}
                </Badge>
              )}
            </Box>
            {/* Faction member rows */}
            <Box style={{ padding: '10px 12px', background: '#0e0e0e' }}>
              {faction.members
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((member, mIdx) => (
                  <Link key={member.id} href={`/characters/${member.character.id}`} style={{ textDecoration: 'none' }}>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: mIdx < faction.members.length - 1 ? '1px solid #161616' : 'none', cursor: 'pointer' }}>
                      {/* Avatar — initials only (imageFileName unavailable for faction members) */}
                      <Box style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(factionAccent, 0.20), border: `1px solid ${getAlphaColor(factionAccent, 0.40)}`, fontSize: 9, fontWeight: 700, color: factionAccent }}>
                        {member.character.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </Box>
                      <Text style={{ fontSize: 12, fontWeight: 600, color: '#ddd' }}>{member.character.name}</Text>
                      {member.role && (
                        <Box style={{ marginLeft: 'auto', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#555', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                          {member.role}
                        </Box>
                      )}
                    </Box>
                  </Link>
                ))}
            </Box>
          </Box>
          {/* VS divider between factions */}
          {idx === 0 && (
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 6px', gap: 4, flexShrink: 0 }}>
              <Box style={{ flex: 1, width: 1, minHeight: 30, background: 'linear-gradient(to bottom, transparent, #333 40%, #333 60%, transparent)' }} />
              <Text style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 800, color: '#e11d48', textShadow: '0 0 14px rgba(225,29,72,0.5)', letterSpacing: '0.05em' }}>VS</Text>
              <Box style={{ flex: 1, width: 1, minHeight: 30, background: 'linear-gradient(to bottom, transparent, #333 40%, #333 60%, transparent)' }} />
            </Box>
          )}
        </React.Fragment>
      )
    })}
</Box>
```

**For 3+ faction layout**, replace the existing `<Grid>` content similarly — same per-faction card structure inside `<Grid.Col>` — no VS divider. In 3+ faction layout, use `gambleColor` as the `factionAccent` for **all** factions (not `characterColor` for any of them).

- [ ] **Step 5: Update Details sidebar card**

Find the raw `<Box style={{ background: '#111', ... }}>` Details card (~line 628). Replace entirely with Pattern 2 `<Card>`:

```tsx
<Card withBorder radius="lg" shadow="md" padding={0} style={getCardStyles(theme, gambleColor)}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${gambleColor}, transparent 70%)` }} />
  <Box p="md">
    <Group gap={10} mb={14} align="center">
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: gambleColor, opacity: 0.85 }}>Details</Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(gambleColor, 0.20)}, transparent)` }} />
    </Group>
    {(initialGamble.chapter != null || initialGamble.chapterId != null) && (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.10), border: `1px solid ${getAlphaColor(gambleColor, 0.20)}` }}>
          <BookOpen size={14} color={gambleColor} />
        </Box>
        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Start</Text>
        <Text style={{ fontSize: 12, fontWeight: 700, color: gambleColor }}>Ch. {initialGamble.chapter?.number ?? initialGamble.chapterId}</Text>
      </Box>
    )}
    {gambleArc != null && (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.10), border: `1px solid ${getAlphaColor(gambleColor, 0.20)}` }}>
          <Map size={14} color={gambleColor} />
        </Box>
        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Arc</Text>
        <Text component={Link} href={`/arcs/${gambleArc.id}`} style={{ fontSize: 12, fontWeight: 700, color: arcColor, textDecoration: 'none' }}>{gambleArc.name}</Text>
      </Box>
    )}
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(gambleColor, 0.10), border: `1px solid ${getAlphaColor(gambleColor, 0.20)}` }}>
        <Users size={14} color={gambleColor} />
      </Box>
      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Players</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: gambleColor }}>{initialGamble.participants?.length ?? 0}</Text>
    </Box>
  </Box>
</Card>
```

- [ ] **Step 6: Update Media tab card** (same pattern as ArcPageClient Task 2 Step 5 — `ownerType="gamble"`, `ownerId={initialGamble.id}`)

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | grep -E "error|warning|✓|Failed" | head -30
```

- [ ] **Step 8: Commit**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/app/gambles/[id]/GamblePageClient.tsx && git commit -m "feat: apply bold redesign patterns to GamblePageClient"
```

---

### Task 4: VolumePageClient

**Files:**
- Modify: `client/src/app/volumes/[id]/VolumePageClient.tsx`

**Changes required:**
1. Volume Summary card: remove `marginTop: 24` from old eyebrow Group; add accent bar + section header (`Book` icon, "VOLUME SUMMARY")
2. Chapter Navigation card: same treatment (`ArrowRight` icon, "CHAPTER NAVIGATION")
3. Details sidebar card: already uses `getCardStyles` — add accent bar + icon rows
4. Chapters tab card: add accent bar + section header (`BookOpen` icon, "CHAPTERS IN THIS VOLUME")

- [ ] **Step 1: Add missing Lucide imports**

Find: `import { Book, Hash, BookOpen } from 'lucide-react'`
Change to: `import { Book, Hash, BookOpen, ArrowRight, Bookmark } from 'lucide-react'`

- [ ] **Step 2: Update Volume Summary card**

Convert to `padding={0}`, remove `marginTop: 24` from old eyebrow Group, add accent bar + section header with `Book` icon:

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={{ ...getCardStyles(theme, entityColors.volume), borderLeft: undefined }}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.volume}, transparent 70%)` }} />
  <Box p="lg">
    <Group gap={10} mb={14} align="center">
      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.15), border: `1px solid ${getAlphaColor(entityColors.volume, 0.30)}` }}>
        <Book size={16} color={entityColors.volume} />
      </Box>
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.volume, opacity: 0.85 }}>Volume Summary</Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.volume, 0.20)}, transparent)` }} />
    </Group>
    {/* keep existing description/placeholder content unchanged */}
  </Box>
</Card>
```

Note: The original Volume Summary card has an explicit `borderLeft: \`3px solid ${entityColors.volume}\`` that overrides `getCardStyles`. Remove this explicit override — the `borderLeft: undefined` spread in the JSX above handles this.

- [ ] **Step 3: Update Chapter Navigation card** (`ArrowRight` icon, "CHAPTER NAVIGATION")

Same pattern as Step 2. Remove `marginTop: 24` from old eyebrow. Convert to `padding={0}`, add accent bar, section header with `ArrowRight`.

- [ ] **Step 4: Update Details sidebar card**

Currently uses `getCardStyles(theme, entityColors.volume)` with `<Stack gap p="md">` — add accent bar and convert rows to icon rows:

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.volume)}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.volume}, transparent 70%)` }} />
  <Box p="md">
    <Group gap={10} mb={14} align="center">
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.volume, opacity: 0.85 }}>Details</Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.volume, 0.20)}, transparent)` }} />
    </Group>
    {initialVolume.startChapter != null && initialVolume.endChapter != null && (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.10), border: `1px solid ${getAlphaColor(entityColors.volume, 0.20)}` }}>
          <BookOpen size={14} color={entityColors.volume} />
        </Box>
        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Chapter Range</Text>
        <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>Ch. {initialVolume.startChapter}–{initialVolume.endChapter}</Text>
      </Box>
    )}
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.10), border: `1px solid ${getAlphaColor(entityColors.volume, 0.20)}` }}>
        <Book size={14} color={entityColors.volume} />
      </Box>
      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Chapter Count</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>{initialChapters?.length ?? 0}</Text>
    </Box>
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.10), border: `1px solid ${getAlphaColor(entityColors.volume, 0.20)}` }}>
        <Bookmark size={14} color={entityColors.volume} />
      </Box>
      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Arc Count</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>{initialArcs?.length ?? 0}</Text>
    </Box>
  </Box>
</Card>
```

- [ ] **Step 5: Update Chapters tab card** (`BookOpen` icon, "CHAPTERS IN THIS VOLUME")

Find Chapters tab `<Card>` (~line 293). Convert to `padding={0}`, add accent bar, replace the old `<Group justify="space-between">` eyebrow (which includes a chapter count `<Badge>`) with a Pattern 1 section header. Move the chapter count badge to the right side of the header row (in place of the trailing gradient line) using `<Group justify="space-between">` on the header instead of the trailing gradient Box:

```tsx
<Group justify="space-between" align="center" mb={14}>
  <Group gap={10} align="center">
    <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.volume, 0.15), border: `1px solid ${getAlphaColor(entityColors.volume, 0.30)}` }}>
      <BookOpen size={16} color={entityColors.volume} />
    </Box>
    <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.volume, opacity: 0.85 }}>Chapters in This Volume</Text>
  </Group>
  {/* keep existing chapter count badge here */}
</Group>
```

Keep the `<Grid>` chapter card listing unchanged.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | grep -E "error|warning|✓|Failed" | head -30
```

- [ ] **Step 7: Commit**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/app/volumes/[id]/VolumePageClient.tsx && git commit -m "feat: apply bold redesign patterns to VolumePageClient"
```

---

## Chunk 3: ChapterPageClient

### Task 5: ChapterPageClient

**Files:**
- Modify: `client/src/app/chapters/[id]/ChapterPageClient.tsx`

**Changes required:**
1. Extend local `Event` interface with `type`
2. Chapter Summary card: remove `marginTop: 24`, add accent bar + section header (`FileText` icon, "CHAPTER SUMMARY")
3. Featured Characters card: remove `marginTop: 24`, add accent bar + section header (`Users` icon, "FEATURED CHARACTERS"); replace `<Badge>` chips with Pattern 3 character chips
4. Details sidebar card: replace raw `Box` (`#0d1117`) with Pattern 2 `<Card>`
5. Events tab card: add accent bar + section header; replace `<Paper>` items with Pattern 5 event cards
6. Quotes tab card: add accent bar + section header; replace plain Paper items with Pattern 4 quote cards

- [ ] **Step 1: Extend Event interface**

Find the local `interface Event` in `ChapterPageClient.tsx`:
```tsx
interface Event {
  id: number
  title: string
  description: string
}
```
Change to:
```tsx
interface Event {
  id: number
  title: string
  description: string
  type?: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution'
}
```

- [ ] **Step 2: Add missing Lucide imports**

Find current import: `import { BookOpen, MessageSquareQuote, CalendarSearch, MessageSquare } from 'lucide-react'`

Change to:
```tsx
import { BookOpen, Book, FileText, Users, MessageSquareQuote, CalendarSearch, MessageSquare, Map } from 'lucide-react'
```
Note: `Building2`, `Crown`, `Tag`, `Check`, and `Bookmark` are NOT needed in ChapterPageClient — do not include them.

- [ ] **Step 3: Update Chapter Summary card**

Find (~line 195). Convert to `padding={0}`, remove `marginTop: 24` from old eyebrow Group, remove `borderLeft: 3px solid ${entityColors.chapter}` from the card style, add accent bar + section header (`FileText` icon, "CHAPTER SUMMARY"):

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={{ ...getCardStyles(theme, entityColors.chapter) }}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.chapter}, transparent 70%)` }} />
  <Box p="lg">
    <Group gap={10} mb={14} align="center">
      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.chapter, 0.15), border: `1px solid ${getAlphaColor(entityColors.chapter, 0.30)}` }}>
        <FileText size={16} color={entityColors.chapter} />
      </Box>
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.chapter, opacity: 0.85 }}>Chapter Summary</Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.chapter, 0.20)}, transparent)` }} />
    </Group>
    {/* keep existing description/placeholder content unchanged */}
  </Box>
</Card>
```

The original card had `borderLeft: 3px solid entityColors.chapter` — that is removed (replaced by top accent bar).

- [ ] **Step 4: Update Featured Characters card**

Find (~line 227). Convert to `padding={0}`, remove `marginTop: 24`, add accent bar + section header (`Users` icon, "FEATURED CHARACTERS"). Then replace the `<Group gap wrap>` of `<Badge>` chips with Pattern 3 chips using `<Stack gap="xs">` of Character Chip elements:

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.character)}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.character}, transparent 70%)` }} />
  <Box p="md">
    <Group gap={10} mb={14} align="center">
      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.15), border: `1px solid ${getAlphaColor(entityColors.character, 0.30)}` }}>
        <Users size={16} color={entityColors.character} />
      </Box>
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.character, opacity: 0.85 }}>Featured Characters</Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.character, 0.20)}, transparent)` }} />
    </Group>
    <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {initialCharacters.map((character) => (
        <Box
          key={character.id}
          component={Link}
          href={`/characters/${character.id}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#131313', border: '1px solid #222', borderRadius: 8, padding: '6px 10px', textDecoration: 'none', cursor: 'pointer', transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = entityColors.character }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#222' }}
        >
          <Box style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.20), border: `1px solid ${getAlphaColor(entityColors.character, 0.40)}`, fontSize: 10, fontWeight: 700, color: entityColors.character }}>
            {character.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
          </Box>
          <Text style={{ fontSize: 13, fontWeight: 600, color: '#ddd' }}>{character.name}</Text>
        </Box>
      ))}
    </Box>
  </Box>
</Card>
```

Note: `Character` interface in ChapterPageClient only has `id` and `name` — no `imageFileName`, so always initials fallback. No spoiler check needed here.

- [ ] **Step 5: Update Details sidebar card**

Find the raw `<Box style={{ background: '#0d1117', border: '1px solid #1a1a2e', ... }}>` (~line 267). Replace entirely with Pattern 2 `<Card>`:

```tsx
<Card withBorder radius="lg" shadow="md" padding={0} style={getCardStyles(theme, entityColors.chapter)}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.chapter}, transparent 70%)` }} />
  <Box p="md">
    <Group gap={10} mb={14} align="center">
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.chapter, opacity: 0.85 }}>Details</Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.chapter, 0.20)}, transparent)` }} />
    </Group>
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.chapter, 0.10), border: `1px solid ${getAlphaColor(entityColors.chapter, 0.20)}` }}>
        <BookOpen size={14} color={entityColors.chapter} />
      </Box>
      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Chapter</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.chapter }}>#{initialChapter.number}</Text>
    </Box>
    {initialChapter.volume != null && (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.chapter, 0.10), border: `1px solid ${getAlphaColor(entityColors.chapter, 0.20)}` }}>
          <Book size={14} color={entityColors.volume} />
        </Box>
        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Volume</Text>
        <Text component={Link} href={`/volumes/${initialChapter.volume.id}`} style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume, textDecoration: 'none' }}>
          Vol. {initialChapter.volume.number}{initialChapter.volume.title ? `: ${initialChapter.volume.title}` : ''}
        </Text>
      </Box>
    )}
    {initialArc != null && (
      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
        <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.chapter, 0.10), border: `1px solid ${getAlphaColor(entityColors.chapter, 0.20)}` }}>
          <Map size={14} color={entityColors.arc} />
        </Box>
        <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Arc</Text>
        <Text component={Link} href={`/arcs/${initialArc.id}`} style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc, textDecoration: 'none' }}>{initialArc.name}</Text>
      </Box>
    )}
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.chapter, 0.10), border: `1px solid ${getAlphaColor(entityColors.chapter, 0.20)}` }}>
        <CalendarSearch size={14} color={entityColors.chapter} />
      </Box>
      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Events</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.chapter }}>{initialEvents?.length ?? 0}</Text>
    </Box>
  </Box>
</Card>
```

- [ ] **Step 6: Update Events tab — Pattern 5 event cards**

Define a type color map at the top of the component function (after `entityColors`):
```tsx
const eventTypeColor: Record<string, string> = {
  gamble: '#e11d48',
  reveal: '#f59e0b',
  decision: '#3b82f6',
  shift: '#a855f7',
  resolution: '#22c55e',
}
```

Find the Events tab `<Card>` (~line 355). Convert to `padding={0}`, remove `marginTop: 24` from the old eyebrow `<Group>`, add accent bar + section header (`CalendarSearch` icon, "CHAPTER EVENTS"). Replace the inner `<Stack>` of `<Paper>` items with Pattern 5 event cards:

```tsx
<Stack gap={6}>
  {Array.isArray(initialEvents) && initialEvents.map((event) => {
    const typeColor = event.type ? (eventTypeColor[event.type] ?? entityColors.event) : entityColors.event
    return (
      <Box
        key={event.id}
        component={Link}
        href={`/events/${event.id}`}
        style={{ background: backgroundStyles.card, border: '1px solid #1e1e1e', borderLeft: `3px solid ${typeColor}`, borderRadius: '0 10px 10px 0', padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', cursor: 'pointer', transition: 'background 150ms ease' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#131313' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = backgroundStyles.card }}
      >
        {event.type && (
          <Box style={{ background: getAlphaColor(typeColor, 0.15), border: `1px solid ${getAlphaColor(typeColor, 0.30)}`, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: typeColor, flexShrink: 0, marginTop: 2, whiteSpace: 'nowrap' }}>
            {event.type}
          </Box>
        )}
        <Box>
          <Text style={{ fontSize: 14, fontWeight: 600, color: '#ddd' }}>{event.title}</Text>
          <Text style={{ fontSize: 12, color: '#666', marginTop: 3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {event.description}
          </Text>
        </Box>
      </Box>
    )
  })}
</Stack>
```

Note: `backgroundStyles.card` is available via the existing import from `mantine-theme`.

- [ ] **Step 7: Update Quotes tab — Pattern 4 quote cards**

Find the Quotes tab `<Card>` (~line 401). Convert to `padding={0}`, remove `marginTop: 24` from the old eyebrow `<Group>`, add accent bar + section header (`MessageSquareQuote` icon, "MEMORABLE QUOTES"). Replace inner `<Stack>` of `<Paper>` items with Pattern 4 quote cards:

```tsx
<Stack gap={theme.spacing.sm}>
  {Array.isArray(initialQuotes) && initialQuotes.map((quote) => (
    <Card key={quote.id} radius="xl" padding={0} style={getCardStyles(theme, entityColors.quote)}>
      <Box style={{ height: 3, borderRadius: '12px 12px 0 0', background: `linear-gradient(90deg, ${entityColors.quote}, transparent 70%)` }} />
      <Box p="md" style={{ position: 'relative' }}>
        <Box style={{ position: 'absolute', top: 8, left: 14, fontSize: 60, lineHeight: 1, color: entityColors.quote, opacity: 0.12, fontFamily: 'Georgia, serif', pointerEvents: 'none', userSelect: 'none' }}>
          "
        </Box>
        <Text style={{ position: 'relative', fontStyle: 'italic', fontSize: 14, lineHeight: 1.65, paddingLeft: 10, borderLeft: `2px solid ${getAlphaColor(entityColors.quote, 0.40)}` }}>
          {quote.text}
        </Text>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          {quote.character && (
            <Box style={{ borderRadius: 20, padding: '3px 10px', background: getAlphaColor(entityColors.quote, 0.12), border: `1px solid ${getAlphaColor(entityColors.quote, 0.25)}`, fontSize: 12, fontWeight: 600, color: entityColors.quote }}>
              — {quote.character.name}
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  ))}
</Stack>
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | grep -E "error|warning|✓|Failed" | head -30
```

- [ ] **Step 9: Commit**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/app/chapters/[id]/ChapterPageClient.tsx && git commit -m "feat: apply bold redesign patterns to ChapterPageClient"
```

---

## Chunk 4: EventPageClient + OrganizationPageClient

### Task 6: EventPageClient

**Files:**
- Modify: `client/src/app/events/[id]/EventPageClient.tsx`

**Changes required:**
1. Event Description card: remove `borderLeft`, add accent bar + section header (`CalendarSearch` icon, "DESCRIPTION")
2. Related Gamble card: add accent bar + section header (`Crown` icon, "RELATED GAMBLE")
3. Details sidebar card: already uses `getCardStyles` — add accent bar, convert to icon rows
4. Featured Characters card: add accent bar + section header (`Users` icon, "FEATURED CHARACTERS"); replace `<Badge>` chips with Pattern 3
5. Tags card: add accent bar + section header (`Tag` icon, "TAGS")
6. Gambles in this Arc card: add accent bar + section header (`Crown` icon, "GAMBLES IN THIS ARC")
7. Media tab card: add accent bar + section header (`Image` icon, "MEDIA GALLERY")

- [ ] **Step 1: Add missing Lucide imports**

Find: `import { CalendarSearch, Image as ImageIcon, Edit } from 'lucide-react'`
Change to:
```tsx
import { CalendarSearch, Image as ImageIcon, Edit, Crown, Users, Tag, Map, Check, BookOpen } from 'lucide-react'
```

- [ ] **Step 2: Update Event Description card**

Find (~line 149). Remove `borderLeft: 3px solid entityColors.event`. Convert to `<Card padding={0}>` with accent bar as first child, then `<Box p="lg">` wrapping all content. Add section header (`CalendarSearch` icon, "DESCRIPTION"). Remove `marginTop: 8` from old eyebrow Group.

- [ ] **Step 3: Update Related Gamble card**

Find (~line 173). Convert to `padding={0}`, add accent bar + section header (`Crown` icon, "RELATED GAMBLE"). The `justify="space-between"` header group with the "View Gamble" button becomes:

The Related Gamble card uses an outer `<Group justify="space-between">` to keep "View Gamble" button right-aligned. The Pattern 1 header row (including trailing gradient line) is on the left. The trailing gradient line is still included — the button replaces it on the right:

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.gamble)}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.gamble}, transparent 70%)` }} />
  <Box p="lg">
    <Group justify="space-between" align="center" mb={14}>
      <Group gap={10} align="center">
        <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.gamble, 0.15), border: `1px solid ${getAlphaColor(entityColors.gamble, 0.30)}` }}>
          <Crown size={16} color={entityColors.gamble} />
        </Box>
        <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.gamble, opacity: 0.85 }}>Related Gamble</Text>
      </Group>
      <Button component={Link} href={`/gambles/${initialEvent.gamble.id}`} variant="outline" c={entityColors.gamble} size="sm" radius="xl" style={{ fontWeight: 600, border: `2px solid ${entityColors.gamble}` }}>
        View Gamble
      </Button>
    </Group>
    {/* ...gamble Paper content unchanged... */}
  </Box>
</Card>
```

- [ ] **Step 4: Update Details sidebar card**

Currently uses `getCardStyles(theme, entityColors.event)` with `<Stack>` layout. Convert to `padding={0}`, add accent bar, add icon rows. Remove `marginTop: 4` and `marginBottom: 8` from old eyebrow Group.

Details rows for Event:
- Chapter: `BookOpen` icon
- Arc: `Map` icon (link to arc)
- Type: `Tag` icon
- Status: `Check` icon

- [ ] **Step 5: Update Featured Characters card**

Find (~line 297). Convert to `padding={0}`, remove `marginTop: 4`, add accent bar + section header (`Users`, "FEATURED CHARACTERS"). Replace `<Badge>` chips with Pattern 3 chips (initials only — `Character` interface has only `id` and `name`):

```tsx
<Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
  {initialEvent.characters.map((character) => (
    <Box
      key={character.id}
      component={Link}
      href={`/characters/${character.id}`}
      style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#131313', border: '1px solid #222', borderRadius: 8, padding: '6px 10px', textDecoration: 'none', cursor: 'pointer', transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = entityColors.character }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#222' }}
    >
      <Box style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.character, 0.20), border: `1px solid ${getAlphaColor(entityColors.character, 0.40)}`, fontSize: 10, fontWeight: 700, color: entityColors.character }}>
        {character.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
      </Box>
      <Text style={{ fontSize: 13, fontWeight: 600, color: '#ddd' }}>{character.name}</Text>
    </Box>
  ))}
</Box>
```

- [ ] **Step 6: Update Tags card and Gambles in this Arc card**

Find Tags card (~line 334). Convert to `padding={0}`, remove `marginTop: 4`, add accent bar + section header (`Tag` icon, "TAGS"). Keep existing `<Badge>` chips for tags (these are content tags, not entity chips).

Find Gambles in this Arc card (~line 362). Convert to `padding={0}`, remove `marginTop: 4`, add accent bar + section header (`Crown` icon, "GAMBLES IN THIS ARC"). Keep existing `<Badge>` chips for the gamble links.

- [ ] **Step 7: Update Media tab card**

Find (~line 412). Same Media header pattern as ArcPageClient Task 2 Step 5 — `ownerType="event"`, `ownerId={initialEvent.id}`. No `initialMediaId` prop here (EventPageClient doesn't have it).

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | grep -E "error|warning|✓|Failed" | head -30
```

- [ ] **Step 9: Commit**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/app/events/[id]/EventPageClient.tsx && git commit -m "feat: apply bold redesign patterns to EventPageClient"
```

---

### Task 7: OrganizationPageClient

**Files:**
- Modify: `client/src/app/organizations/[id]/OrganizationPageClient.tsx`

**Changes required:**
1. Organization Overview card (description present): remove `borderLeft`, `marginTop: 24`, add accent bar + section header (`Shield` icon, "ORGANIZATION OVERVIEW")
2. Organization Overview card (no description): same header treatment
3. Details sidebar card: replace raw `Box` (`#111`) with Pattern 2 `<Card>`
4. Media tab card: add accent bar + section header (`Image` icon, "MEDIA GALLERY")

- [ ] **Step 1: Add missing imports**

Find the Lucide import: `import { Users, Shield, Image as ImageIcon } from 'lucide-react'`
Change to:
```tsx
import { Users, Shield, Image as ImageIcon, Crown } from 'lucide-react'
```

Find the `mantine-theme` import (around line 17). Add `getAlphaColor` if not already present:
```tsx
import { getEntityThemeColor, getAlphaColor, getCardStyles, textColors, backgroundStyles, ... } from '../../../lib/mantine-theme'
```
(Only add `getAlphaColor` — keep all existing imports.)

- [ ] **Step 2: Update Organization Overview card (both variants)**

Find the description card (~line 147) and the no-description placeholder card (~line 172). Both have identical structure — same eyebrow Group with `marginTop: 24`. For both:
- Remove `borderLeft: 3px solid entityColors.organization`
- Convert to `padding={0}`
- Add accent bar (`borderRadius: '6px 6px 0 0'`)
- Replace eyebrow `<Group marginTop: 24>` with Pattern 1 section header (`Shield` icon, "ORGANIZATION OVERVIEW")
- Wrap content in inner `<Box p="lg">`

The two variants can share the same card structure — the only difference is the content inside:

```tsx
<Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.organization)}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.organization}, transparent 70%)` }} />
  <Box p="lg">
    <Group gap={10} mb={14} align="center">
      <Box style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.organization, 0.15), border: `1px solid ${getAlphaColor(entityColors.organization, 0.30)}` }}>
        <Shield size={16} color={entityColors.organization} />
      </Box>
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.organization, opacity: 0.85 }}>Organization Overview</Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.organization, 0.20)}, transparent)` }} />
    </Group>
    {initialOrganization.description ? (
      <TimelineSpoilerWrapper chapterNumber={1}>
        <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
          <EnhancedSpoilerMarkdown content={initialOrganization.description} enableEntityEmbeds compactEntityCards={false} />
        </Box>
      </TimelineSpoilerWrapper>
    ) : (
      <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
        No description available for this organization yet. Check back later for updates!
      </Text>
    )}
  </Box>
</Card>
```

This replaces both the `{initialOrganization.description && (...)}` card and the `{!initialOrganization.description && (...)}` card with a single unified card.

- [ ] **Step 3: Update Details sidebar card**

Find the raw `<Card radius="lg" shadow="md" style={{ background: '#111', border: '1px solid #1a1a1a' }}>` (~line 196). Replace with Pattern 2. IMPORTANT: use `<Card padding={0}>` so the accent bar renders flush, with content inside an inner `<Box p="md">`:

```tsx
<Card withBorder radius="lg" shadow="md" padding={0} style={getCardStyles(theme, entityColors.organization)}>
  <Box style={{ height: 3, borderRadius: '6px 6px 0 0', background: `linear-gradient(90deg, ${entityColors.organization}, transparent 70%)` }} />
  <Box p="md">
    <Group gap={10} mb={14} align="center">
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.organization, opacity: 0.85 }}>Details</Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.organization, 0.20)}, transparent)` }} />
    </Group>
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #161616' }}>
      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.organization, 0.10), border: `1px solid ${getAlphaColor(entityColors.organization, 0.20)}` }}>
        <Users size={14} color={entityColors.character} />
      </Box>
      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Members</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{initialMembers?.length ?? 0}</Text>
    </Box>
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <Box style={{ width: 24, height: 24, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAlphaColor(entityColors.organization, 0.10), border: `1px solid ${getAlphaColor(entityColors.organization, 0.20)}` }}>
        <Crown size={14} color={entityColors.gamble} />
      </Box>
      <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Gambles</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.gamble }}>{initialGambles?.length ?? 0}</Text>
    </Box>
  </Box>
</Card>
```

- [ ] **Step 4: Update Media tab card**

Find (~line 251). Same Media header pattern — `ownerType="organization"`, `ownerId={initialOrganization.id}`. This Media tab has `showFilters` and `allowMultipleTypes` — keep those props unchanged.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | grep -E "error|warning|✓|Failed" | head -30
```

- [ ] **Step 6: Run lint**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn lint 2>&1 | grep -E "error|warning" | head -20
```

- [ ] **Step 7: Commit**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/app/organizations/[id]/OrganizationPageClient.tsx && git commit -m "feat: apply bold redesign patterns to OrganizationPageClient"
```
