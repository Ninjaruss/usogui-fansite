# Detail Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 8 entity detail pages with a dark editorial layout — cinematic hero with right-anchored portrait, 3-stat row, and a 2-column overview grid (narrative main + contextual aside).

**Architecture:** Two shared components (`DetailPageHeader`, `RelatedContentSection`) absorb the structural changes; each of the 8 `*PageClient.tsx` files is then updated to pass the new props and adopt the editorial grid in the Overview tab. Non-overview tabs (Timeline, Media, Annotations) remain full-width and untouched.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI, Tailwind CSS 4, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-15-detail-page-redesign-design.md`

---

## File Map

| File | Change |
|------|--------|
| `client/src/components/layouts/DetailPageHeader.tsx` | Full rewrite — cinematic hero layout, new props |
| `client/src/components/layouts/RelatedContentSection.tsx` | Add `variant="compact"` path |
| `client/src/app/characters/[id]/CharacterPageClient.tsx` | New header props + editorial grid |
| `client/src/app/gambles/[id]/GamblePageClient.tsx` | New header props + editorial grid |
| `client/src/app/arcs/[id]/ArcPageClient.tsx` | New header props + editorial grid |
| `client/src/app/organizations/[id]/OrganizationPageClient.tsx` | New header props + editorial grid |
| `client/src/app/volumes/[id]/VolumePageClient.tsx` | New header props + editorial grid |
| `client/src/app/chapters/[id]/ChapterPageClient.tsx` | New header props + editorial grid |
| `client/src/app/guides/[id]/GuidePageClient.tsx` | New header props + editorial grid |
| `client/src/app/events/[id]/EventPageClient.tsx` | New header props + editorial grid |

---

## Chunk 1: Shared Components

### Task 1: Rewrite `DetailPageHeader`

**Files:**
- Modify: `client/src/components/layouts/DetailPageHeader.tsx`

The current component renders a centered portrait + name + children. The new design is a cinematic 280px hero: dark atmospheric background, portrait filling the right 42% (bottom-anchored, faded left), entity-color left strip, and structured content (eyebrow → name → stats row → tags) on the left.

- [ ] **Step 1: Replace the props interface**

Open `client/src/components/layouts/DetailPageHeader.tsx`. Replace the existing `DetailPageHeaderProps` interface with:

```ts
interface StatItem {
  value: string | number
  label: string
}

interface TagItem {
  label: string
  variant: 'accent' | 'neutral'
}

interface DetailPageHeaderProps {
  /** Entity type key — drives theming */
  entityType: EntityAccentKey
  /** Entity ID for MediaThumbnail */
  entityId: number
  /** Large serif name */
  entityName: string
  /** Up to 3 key stats shown below the name */
  stats?: StatItem[]
  /** Chips shown below stats */
  tags?: TagItem[]
  /** Whether to render the portrait area */
  showImage?: boolean
  /** Spoiler gate chapter for the portrait */
  spoilerChapter?: number | null
  /** Called when portrait spoiler is dismissed */
  onSpoilerRevealed?: () => void
  /** Any per-page additions rendered at the bottom of the content column */
  children?: React.ReactNode
}
```

Remove the old `imageWidth` and `imageHeight` props — the portrait now fills its container.

- [ ] **Step 2: Rewrite the component body**

Replace the entire component function with:

```tsx
export function DetailPageHeader({
  entityType,
  entityId,
  entityName,
  stats,
  tags,
  showImage = true,
  spoilerChapter,
  onSpoilerRevealed,
  children,
}: DetailPageHeaderProps) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)

  return (
    <Box
      style={{
        position: 'relative',
        height: 280,
        overflow: 'hidden',
        borderRadius: 10,
        background: '#080c14',
      }}
    >
      {/* Atmospheric background */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 80% at 70% 50%, ${accentColor}12 0%, transparent 60%), linear-gradient(135deg, #0a0f1e 0%, #080c14 100%)`,
        }}
      />

      {/* Dot texture */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      {/* Left-edge entity color strip */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}10 100%)`,
          zIndex: 4,
        }}
      />

      {/* Portrait area — right 42% */}
      {showImage ? (
        <Box
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '42%',
            overflow: 'hidden',
          }}
        >
          <MediaThumbnail
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
            allowCycling={false}
            maxWidth="100%"
            maxHeight="100%"
            spoilerChapter={spoilerChapter ?? undefined}
            onSpoilerRevealed={onSpoilerRevealed}
          />
          {/* Left-edge fade blending portrait into content */}
          <Box
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '55%',
              background: 'linear-gradient(90deg, #080c14 0%, rgba(8,12,20,0.6) 50%, transparent 100%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
          {/* Bottom fade */}
          <Box
            aria-hidden
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              background: 'linear-gradient(0deg, #080c14, transparent)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
        </Box>
      ) : (
        /* No-image fallback: entity-tinted glow on right side */
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '42%',
            background: `linear-gradient(160deg, ${accentColor}18 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Content column — left 65%, bottom-anchored */}
      <Box
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          top: 0,
          width: '65%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '28px 32px',
          zIndex: 3,
        }}
      >
        {/* Eyebrow label */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Box
            aria-hidden
            style={{ width: 18, height: 2, background: accentColor, flexShrink: 0 }}
          />
          <Text
            style={{
              fontSize: 10,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: accentColor,
              fontWeight: 700,
            }}
          >
            {entityType}
          </Text>
        </Box>

        {/* Entity name */}
        <Title
          order={1}
          style={{
            fontSize: 'clamp(28px, 4vw, 46px)',
            fontFamily: 'var(--font-opti-goudy-text)',
            fontWeight: 900,
            letterSpacing: -1,
            color: '#fff',
            lineHeight: 1,
            marginBottom: 14,
            textShadow: '0 2px 24px rgba(0,0,0,0.9)',
          }}
        >
          {entityName}
        </Title>

        {/* Stats row */}
        {stats && stats.length > 0 && (
          <Box style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            {stats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && (
                  <Box
                    aria-hidden
                    style={{
                      width: 1,
                      background: '#222',
                      alignSelf: 'stretch',
                      marginLeft: 20,
                    }}
                  />
                )}
                <Box
                  style={{
                    paddingLeft: i > 0 ? 20 : 0,
                    paddingRight: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Text
                    style={{ fontSize: 20, fontWeight: 800, color: accentColor, lineHeight: 1 }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: '#555',
                    }}
                  >
                    {stat.label}
                  </Text>
                </Box>
              </React.Fragment>
            ))}
          </Box>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <Box style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: children ? 12 : 0 }}>
            {tags.map((tag) => (
              <Box
                key={tag.label}
                style={{
                  padding: '3px 9px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  ...(tag.variant === 'accent'
                    ? {
                        background: `${accentColor}1f`,
                        border: `1px solid ${accentColor}38`,
                        color: accentColor,
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#666',
                      }),
                }}
              >
                {tag.label}
              </Box>
            ))}
          </Box>
        )}

        {children}
      </Box>
    </Box>
  )
}
```

- [ ] **Step 3: Update imports — remove unused, keep needed**

Ensure the import block at the top of the file is:
```ts
'use client'

import React from 'react'
import { Box, Title, Text, useMantineTheme } from '@mantine/core'
import {
  getEntityThemeColor,
  type EntityAccentKey
} from '../../lib/mantine-theme'
import MediaThumbnail from '../MediaThumbnail'
```

Remove imports for `Card`, `Stack`, `backgroundStyles`, `getCardStyles`, `mangaPatterns`, `SpeedLines` — none are used in the new layout.

- [ ] **Step 4: Verify build**

```bash
cd client && yarn build 2>&1 | tail -30
```

Expected: TypeScript errors at the 8 `*PageClient.tsx` call sites that pass the removed `imageWidth`/`imageHeight` props — this is expected and will be resolved in Chunks 2–4. The component file itself should have no errors.

- [ ] **Step 5: Commit**

```bash
cd client && git add src/components/layouts/DetailPageHeader.tsx
git commit -m "feat: rewrite DetailPageHeader with cinematic editorial hero"
```

---

### Task 2: Add compact variant to `RelatedContentSection`

**Files:**
- Modify: `client/src/components/layouts/RelatedContentSection.tsx`

Add a `variant="compact"` path that renders a flat linked list `[dot] [name] [›]` instead of the existing card-based preview. The existing `renderItem` / card behavior is the default and untouched.

- [ ] **Step 1: Extend the props interface and update imports**

In `RelatedContentSection.tsx`, first update the Mantine import line to add `Box` and `Text`:

```ts
import { Box, Button, Card, Group, Stack, Text, Title, useMantineTheme } from '@mantine/core'
```

Then update `RelatedContentSectionProps<T>` to:
1. Make `renderItem` optional (not needed for compact variant)
2. Add three new optional fields

```ts
interface RelatedContentSectionProps<T> {
  entityType: EntityAccentKey
  icon?: React.ReactNode
  title: string
  items: T[]
  previewCount?: number
  viewAllHref?: string
  /** Required for 'cards' variant; unused for 'compact' */
  renderItem?: (item: T, index: number) => React.ReactNode
  getKey: (item: T) => string | number
  titleColorKey?: keyof typeof textColors
  /** 'cards' (default) uses renderItem. 'compact' renders a flat linked list. */
  variant?: 'cards' | 'compact'
  /** Required when variant="compact": returns the display label for an item */
  getLabel?: (item: T) => string
  /** Required when variant="compact": returns the href for an item */
  getHref?: (item: T) => string
  /** Dot color for compact rows (defaults to accentColor) */
  itemDotColor?: string
}
```

Update the destructuring in the function signature to include:
```ts
variant = 'cards',
getLabel,
getHref,
itemDotColor,
```

- [ ] **Step 2: Add the compact render path**

After the `if (items.length === 0) return null` guard and before the existing `return (...)`, add:

```tsx
  if (variant === 'compact') {
    const dotColor = itemDotColor ?? accentColor
    return (
      <Box>
        <Text
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#555',
            marginBottom: 10,
          }}
        >
          {title}
        </Text>
        {displayItems.map((item) => (
          <Box
            key={getKey(item)}
            component={Link}
            href={getHref!(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 0',
              borderBottom: '1px solid #181818',
              textDecoration: 'none',
            }}
          >
            <Box
              aria-hidden
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: dotColor,
                flexShrink: 0,
              }}
            />
            <Text style={{ fontSize: 13, color: '#777', flex: 1 }}>
              {getLabel!(item)}
            </Text>
            <Text style={{ fontSize: 12, color: '#333' }}>›</Text>
          </Box>
        ))}
        {viewAllHref && items.length > (previewCount ?? 4) && (
          <Box pt={8}>
            <Text
              component={Link}
              href={viewAllHref}
              style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}
            >
              View all {items.length} →
            </Text>
          </Box>
        )}
      </Box>
    )
  }
```

Ensure `Link` is imported from `next/link` (it already is).

- [ ] **Step 3: Verify build**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: no errors. The existing card variant still works — no call sites changed yet.

- [ ] **Step 4: Commit**

```bash
cd client && git add src/components/layouts/RelatedContentSection.tsx
git commit -m "feat: add compact variant to RelatedContentSection"
```

---

## Chunk 2: CharacterPageClient and GamblePageClient

> **Variable name map** — each PageClient destructures its entity prop with an `initial` prefix. Use these names in all JSX:
>
> | File | Entity variable | Other variables |
> |------|----------------|-----------------|
> | `CharacterPageClient` | `character` | `gambles`, `arcs`, `events`, `guides`, `quotes` |
> | `GamblePageClient` | `initialGamble` | `gambleArc` (derived), `entityColor` |
> | `ArcPageClient` | `initialArc` | `gambles` prop, `characters` prop |
> | `OrganizationPageClient` | `organization` | `initialMembers`, `initialGambles` |
> | `VolumePageClient` | `initialVolume` | `initialChapters`, `initialArcs` |
> | `ChapterPageClient` | `initialChapter` | `initialEvents`, `initialArc` (separate prop) |
> | `GuidePageClient` | `guide` | varies |
> | `EventPageClient` | `initialEvent` | varies |

### Task 3: Update `CharacterPageClient`

**Files:**
- Modify: `client/src/app/characters/[id]/CharacterPageClient.tsx`

This is the reference implementation. The pattern established here repeats across all other clients.

Changes:
1. Pass `stats` and `tags` to `DetailPageHeader` instead of badge children
2. Wrap the Overview tab content in a 2-col editorial grid
3. Move related content (arcs, gambles, quotes, guides) to compact lists in the aside column
4. Add a Details aside card with key-value stats

- [ ] **Step 1: Update `DetailPageHeader` call — replace children with structured props**

Find the `<DetailPageHeader>` block (around line 165). Replace the entire block including its children with:

```tsx
<DetailPageHeader
  entityType="character"
  entityId={character.id}
  entityName={character.name}
  stats={[
    { value: gambles.length, label: 'Gambles' },
    ...(character.firstAppearanceChapter != null
      ? [{ value: `Ch. ${character.firstAppearanceChapter}`, label: 'Debut' }]
      : []),
    { value: arcs.length, label: 'Arcs' },
  ].slice(0, 3)}
  tags={[
    ...(character.organizations?.map((o) => ({
      label: o.name,
      variant: 'accent' as const,
    })) ?? []),
  ]}
  spoilerChapter={character.firstAppearanceChapter}
/>
```

- [ ] **Step 2: Replace the Overview tab content with the editorial grid**

Find `<Tabs.Panel value="overview" pt={theme.spacing.md}>`. Replace its inner `<Stack gap={theme.spacing.lg}>` with a two-column grid. The grid structure is:

```tsx
<Tabs.Panel value="overview" pt={theme.spacing.md}>
  <Box
    style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 260px',
      gap: 12,
      alignItems: 'start',
    }}
    className="detail-editorial-grid"
  >
    {/* ── Main column ── */}
    <Stack gap={theme.spacing.md}>
      {/* Description */}
      <Card
        withBorder
        radius="lg"
        shadow="lg"
        style={{
          ...getCardStyles(theme, entityColors.character),
          borderLeft: `3px solid ${entityColors.character}`,
        }}
      >
        <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
          <Text
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#555',
            }}
          >
            Description
          </Text>
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
        </Stack>
      </Card>

      {/* Backstory */}
      {character.backstory && (
        <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.character)}>
          <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
            <Text
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#555',
              }}
            >
              Backstory
            </Text>
            <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
              <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
                <EnhancedSpoilerMarkdown
                  content={character.backstory}
                  enableEntityEmbeds
                  compactEntityCards={false}
                />
              </Box>
            </TimelineSpoilerWrapper>
          </Stack>
        </Card>
      )}

      {/* Relationships */}
      <CharacterRelationships characterId={character.id} characterName={character.name} />

      {/* Organization memberships */}
      {character.organizations && character.organizations.length > 0 && (
        <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.organization)}>
          <Stack gap={theme.spacing.md} p={theme.spacing.md}>
            <Text
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#555',
              }}
            >
              Organizations
            </Text>
            <CharacterOrganizationMemberships
              characterId={character.id}
              characterName={character.name}
            />
          </Stack>
        </Card>
      )}
    </Stack>

    {/* ── Aside column ── */}
    <Stack gap={theme.spacing.sm}>
      {/* Details card */}
      <Card
        withBorder
        radius="lg"
        shadow="md"
        style={{ background: '#111', border: '1px solid #1a1a1a' }}
        p="md"
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#555',
            marginBottom: 10,
          }}
        >
          Details
        </Text>
        <Stack gap={0}>
          {character.firstAppearanceChapter != null && (
            <Group
              justify="space-between"
              style={{ padding: '7px 0', borderBottom: '1px solid #191919' }}
            >
              <Text style={{ fontSize: 13, color: '#444' }}>Debut</Text>
              <Text style={{ fontSize: 13, color: entityColors.character, fontWeight: 600 }}>
                Ch. {character.firstAppearanceChapter}
              </Text>
            </Group>
          )}
          {character.organizations && character.organizations.length > 0 && (
            <Group
              justify="space-between"
              style={{ padding: '7px 0', borderBottom: '1px solid #191919' }}
            >
              <Text style={{ fontSize: 13, color: '#444' }}>Organization</Text>
              <Text style={{ fontSize: 13, color: '#999', fontWeight: 600 }}>
                {character.organizations[0].name}
              </Text>
            </Group>
          )}
          <Group
            justify="space-between"
            style={{ padding: '7px 0', borderBottom: '1px solid #191919' }}
          >
            <Text style={{ fontSize: 13, color: '#444' }}>Gambles</Text>
            <Text style={{ fontSize: 13, color: entityColors.character, fontWeight: 600 }}>
              {gambles.length}
            </Text>
          </Group>
          <Group justify="space-between" style={{ padding: '7px 0' }}>
            <Text style={{ fontSize: 13, color: '#444' }}>Arcs</Text>
            <Text style={{ fontSize: 13, color: entityColors.character, fontWeight: 600 }}>
              {arcs.length}
            </Text>
          </Group>
        </Stack>
      </Card>

      {/* Story Arcs compact */}
      {arcs.length > 0 && (
        <Card
          withBorder
          radius="lg"
          shadow="md"
          style={{ background: '#111', border: '1px solid #1a1a1a' }}
          p="md"
        >
          <RelatedContentSection
            entityType="arc"

            title="Story Arcs"
            items={arcs}
            previewCount={4}
            viewAllHref={`/arcs?character=${character.name}`}
            getKey={(arc) => arc.id}
            variant="compact"
            getLabel={(arc) => arc.name}
            getHref={(arc) => `/arcs/${arc.id}`}
            itemDotColor={entityColors.arc}
          />
        </Card>
      )}

      {/* Gambles compact */}
      {gambles.length > 0 && (
        <Card
          withBorder
          radius="lg"
          shadow="md"
          style={{ background: '#111', border: '1px solid #1a1a1a' }}
          p="md"
        >
          <RelatedContentSection
            entityType="gamble"

            title="Gambles"
            items={gambles}
            previewCount={4}
            viewAllHref={`/gambles?character=${character.name}`}
            getKey={(g) => g.id}
            variant="compact"
            getLabel={(g) => g.name}
            getHref={(g) => `/gambles/${g.id}`}
            itemDotColor={entityColors.gamble}
          />
        </Card>
      )}

      {/* Quotes compact */}
      {quotes.length > 0 && (
        <Card
          withBorder
          radius="lg"
          shadow="md"
          style={{ background: '#111', border: '1px solid #1a1a1a' }}
          p="md"
        >
          <RelatedContentSection
            entityType="quote"

            title="Quotes"
            items={quotes}
            previewCount={3}
            getKey={(q) => q.id}
            variant="compact"
            getLabel={(q) => (q as any).text?.slice(0, 50) + '…' || 'Quote'}
            getHref={(q) => `/quotes/${(q as any).id}`}
            itemDotColor={entityColors.quote}
          />
        </Card>
      )}

      {/* Guides compact */}
      {guides.length > 0 && (
        <Card
          withBorder
          radius="lg"
          shadow="md"
          style={{ background: '#111', border: '1px solid #1a1a1a' }}
          p="md"
        >
          <RelatedContentSection
            entityType="guide"

            title="Community Guides"
            items={guides}
            previewCount={3}
            viewAllHref={`/guides?character=${character.name}`}
            getKey={(g) => g.id}
            variant="compact"
            getLabel={(g) => g.title}
            getHref={(g) => `/guides/${g.id}`}
            itemDotColor={entityColors.guide}
          />
        </Card>
      )}
    </Stack>
  </Box>
</Tabs.Panel>
```

- [ ] **Step 3: Add mobile collapse CSS**

In `client/src/app/globals.css`, add:

```css
@media (max-width: 768px) {
  /* Overview grid collapses: main column then aside column, both full width */
  .detail-editorial-grid {
    grid-template-columns: 1fr !important;
  }

  /* Hero portrait hidden on mobile — background gradient fills instead */
  .detail-hero-portrait {
    display: none !important;
  }
}
```

Then in `DetailPageHeader.tsx`, add `className="detail-hero-portrait"` to the portrait area `<Box>`:
```tsx
<Box
  className="detail-hero-portrait"
  style={{
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '42%',
    overflow: 'hidden',
  }}
>
```

- [ ] **Step 4: Remove now-unused imports**

Remove any imports that are no longer used after this refactor. The stat-badge loop and org badge Group/Badge blocks were removed. Check for unused: `Crown`, `Building2`, `fontSize`, `spacing`, `getAlphaColor` — remove any that no longer appear in the file.

- [ ] **Step 5: Verify build and lint**

```bash
cd client && yarn build 2>&1 | tail -30
cd client && yarn lint 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd client && git add src/app/characters/[id]/CharacterPageClient.tsx src/app/globals.css
git commit -m "feat: apply editorial grid to CharacterPageClient"
```

---

### Task 4: Update `GamblePageClient`

**Files:**
- Modify: `client/src/app/gambles/[id]/GamblePageClient.tsx`

Read the full file first. The gamble page has a unique structure: participants are shown either as two factions (with a "VS" divider) or a flat list. The main column keeps description + rules + win condition + explanation. The aside gets participants/factions and the arc link.

- [ ] **Step 1: Read the file to understand its current structure**

```bash
# Read it before editing
```

Open `client/src/app/gambles/[id]/GamblePageClient.tsx` and note:
- Where `DetailPageHeader` is called and what children it passes
- What the Overview tab's top-level structure is (Stack or other)
- What related content sections exist

- [ ] **Step 2: Update `DetailPageHeader` call**

**Important:** In `GamblePageClient`, arc data is not on `gamble.arc`. It is fetched separately and stored in a local `gambleArc` variable (derived by scanning a `arcs` state array). Use `gambleArc` — not `gamble.arc`.

Replace the existing `<DetailPageHeader>` block with:

```tsx
<DetailPageHeader
  entityType="gamble"
  entityId={initialGamble.id}
  entityName={initialGamble.name}
  stats={[
    {
      value: initialGamble.factions?.length
        ? initialGamble.factions.reduce((n, f) => n + f.members.length, 0)
        : (initialGamble.participants?.length ?? 0),
      label: 'Players',
    },
    ...(gambleArc ? [{ value: gambleArc.name, label: 'Arc' }] : []),
    ...(initialGamble.chapterId != null ? [{ value: `Ch. ${initialGamble.chapterId}`, label: 'Start' }] : []),
  ].slice(0, 3)}
  tags={[]}
/>
```

- [ ] **Step 3: Wrap the Overview tab content in editorial grid**

Wrap the Overview tab's top-level `<Stack>` in a two-column grid. The full structure:

```tsx
<Box
  style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 12, alignItems: 'start' }}
  className="detail-editorial-grid"
>
  {/* ── Main column ── */}
  <Stack gap={theme.spacing.md}>
    {/* Description */}
    <Card withBorder radius="lg" shadow="lg" style={{ ...getCardStyles(theme, entityColor), borderLeft: `3px solid ${entityColor}` }}>
      <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
        <Text style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#555' }}>
          Description
        </Text>
        {initialGamble.description ? (
          <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
            <EnhancedSpoilerMarkdown content={initialGamble.description} enableEntityEmbeds compactEntityCards={false} />
          </Box>
        ) : (
          <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic' }}>No description available.</Text>
        )}
      </Stack>
    </Card>

    {/* Rules */}
    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
      <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
        <Text style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#555' }}>Rules</Text>
        <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
          <EnhancedSpoilerMarkdown content={initialGamble.rules} enableEntityEmbeds compactEntityCards={false} />
        </Box>
      </Stack>
    </Card>

    {/* Win Condition */}
    {initialGamble.winCondition && (
      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
        <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
          <Text style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#555' }}>Win Condition</Text>
          <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
            <EnhancedSpoilerMarkdown content={initialGamble.winCondition} enableEntityEmbeds compactEntityCards={false} />
          </Box>
        </Stack>
      </Card>
    )}

    {/* Explanation */}
    {initialGamble.explanation && (
      <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
        <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
          <Text style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#555' }}>Analysis</Text>
          <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
            <EnhancedSpoilerMarkdown content={initialGamble.explanation} enableEntityEmbeds compactEntityCards={false} />
          </Box>
        </Stack>
      </Card>
    )}
  </Stack>

  {/* ── Aside column ── */}
  <Stack gap={theme.spacing.sm}>
    {/* Details */}
    <Card withBorder radius="lg" shadow="md" style={{ background: '#111', border: '1px solid #1a1a1a' }} p="md">
      <Text style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: 10 }}>
        Details
      </Text>
      <Stack gap={0}>
        {initialGamble.chapterId != null && (
          <Group justify="space-between" style={{ padding: '7px 0', borderBottom: '1px solid #191919' }}>
            <Text style={{ fontSize: 13, color: '#444' }}>Start</Text>
            <Text style={{ fontSize: 13, color: entityColor, fontWeight: 600 }}>Ch. {initialGamble.chapterId}</Text>
          </Group>
        )}
        {gambleArc && (
          <Group justify="space-between" style={{ padding: '7px 0', borderBottom: '1px solid #191919' }}>
            <Text style={{ fontSize: 13, color: '#444' }}>Arc</Text>
            <Text component={Link} href={`/arcs/${gambleArc.id}`} style={{ fontSize: 13, color: entityColor, fontWeight: 600, textDecoration: 'none' }}>
              {gambleArc.name}
            </Text>
          </Group>
        )}
        {initialGamble.outcome && (
          <Group justify="space-between" style={{ padding: '7px 0' }}>
            <Text style={{ fontSize: 13, color: '#444' }}>Outcome</Text>
            <Text style={{ fontSize: 13, color: '#999', fontWeight: 600 }}>{initialGamble.outcome}</Text>
          </Group>
        )}
      </Stack>
    </Card>

    {/* Participants / Factions — move the existing faction/participant rendering here */}
    {/* Wrap existing faction JSX in a Card with background: '#111', border: '1px solid #1a1a1a' */}
  </Stack>
</Box>
```

Move the existing faction/participant JSX (currently inside the main Stack) into the aside Participants card position shown above.

- [ ] **Step 4: Verify build and lint**

```bash
cd client && yarn build 2>&1 | tail -30
cd client && yarn lint 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
cd client && git add src/app/gambles/[id]/GamblePageClient.tsx
git commit -m "feat: apply editorial grid to GamblePageClient"
```

---

## Chunk 3: Arc, Organization, Volume PageClients

### Task 5: Update `ArcPageClient`

**Files:**
- Modify: `client/src/app/arcs/[id]/ArcPageClient.tsx`

- [ ] **Step 1: Read the current file to understand its structure**

Open `client/src/app/arcs/[id]/ArcPageClient.tsx`. Note the existing `DetailPageHeader` usage and Overview tab structure.

- [ ] **Step 2: Update `DetailPageHeader` call**

```tsx
<DetailPageHeader
  entityType="arc"
  entityId={initialArc.id}
  entityName={initialArc.name}
  stats={[
    { value: gambles.length, label: 'Gambles' },
    ...(initialArc.startChapter != null && initialArc.endChapter != null
      ? [{ value: `Ch. ${initialArc.startChapter}–${initialArc.endChapter}`, label: 'Chapters' }]
      : initialArc.startChapter != null
      ? [{ value: `Ch. ${initialArc.startChapter}+`, label: 'Chapters' }]
      : []),
    ...(initialArc.children?.length ? [{ value: initialArc.children.length, label: 'Sub-arcs' }] : []),
  ].slice(0, 3)}
  tags={[]}
/>
```

- [ ] **Step 3: Wrap Overview tab in editorial grid**

```
Main column:
  - Description card (accent left border)
  - Sub-arcs list (if any)

Aside column:
  - Details card (chapter range, sub-arc count if any)
  - Gambles compact list
  - Characters compact list (if available)
```

The Details aside card for Arc:
```tsx
<Stack gap={0}>
  {initialArc.startChapter != null && (
    <Group justify="space-between" style={{ padding: '7px 0', borderBottom: '1px solid #191919' }}>
      <Text style={{ fontSize: 13, color: '#444' }}>Start</Text>
      <Text style={{ fontSize: 13, color: entityColor, fontWeight: 600 }}>Ch. {initialArc.startChapter}</Text>
    </Group>
  )}
  {initialArc.endChapter != null && (
    <Group justify="space-between" style={{ padding: '7px 0', borderBottom: '1px solid #191919' }}>
      <Text style={{ fontSize: 13, color: '#444' }}>End</Text>
      <Text style={{ fontSize: 13, color: entityColor, fontWeight: 600 }}>Ch. {initialArc.endChapter}</Text>
    </Group>
  )}
  {initialArc.children?.length > 0 && (
    <Group justify="space-between" style={{ padding: '7px 0' }}>
      <Text style={{ fontSize: 13, color: '#444' }}>Sub-arcs</Text>
      <Text style={{ fontSize: 13, color: entityColor, fontWeight: 600 }}>{initialArc.children.length}</Text>
    </Group>
  )}
</Stack>
```

- [ ] **Step 4: Verify build + commit**

```bash
cd client && yarn build 2>&1 | tail -20
git add src/app/arcs/[id]/ArcPageClient.tsx
git commit -m "feat: apply editorial grid to ArcPageClient"
```

---

### Task 6: Update `OrganizationPageClient`

**Files:**
- Modify: `client/src/app/organizations/[id]/OrganizationPageClient.tsx`

- [ ] **Step 1: Read the current file**

Open `client/src/app/organizations/[id]/OrganizationPageClient.tsx`.

- [ ] **Step 2: Update `DetailPageHeader` call**

**Important field notes for OrganizationPageClient:**
- Members come from the `initialMembers` prop (array of member objects with a `.character` field) — use `initialMembers.length`
- There is no `firstAppearanceChapter` on the `Organization` type — omit that stat
- Gambles come from `initialGambles` prop (currently destructured as `_initialGambles` because unused) — rename it to `initialGambles` before using

```tsx
<DetailPageHeader
  entityType="organization"
  entityId={organization.id}
  entityName={organization.name}
  stats={[
    { value: initialMembers.length, label: 'Members' },
    ...(initialGambles?.length ? [{ value: initialGambles.length, label: 'Gambles' }] : []),
  ].slice(0, 3)}
  tags={[]}
/>
```

Rename the destructured `_initialGambles` prop to `initialGambles` at the top of the file before using it in the stats.

- [ ] **Step 3: Wrap Overview tab in editorial grid**

```
Main column:
  - Description card (accent left border)
  - Members section (existing component or list)

Aside column:
  - Details card (debut chapter, type if present)
  - Gambles compact (if any)
```

- [ ] **Step 4: Verify build + commit**

```bash
cd client && yarn build 2>&1 | tail -20
git add src/app/organizations/[id]/OrganizationPageClient.tsx
git commit -m "feat: apply editorial grid to OrganizationPageClient"
```

---

### Task 7: Update `VolumePageClient`

**Files:**
- Modify: `client/src/app/volumes/[id]/VolumePageClient.tsx`

- [ ] **Step 1: Read the current file**

Open `client/src/app/volumes/[id]/VolumePageClient.tsx`.

- [ ] **Step 2: Update `DetailPageHeader` call**

**Important:** Chapters come from the `initialChapters` prop — use `initialChapters.length`. The Volume type has `startChapter` and `endChapter` as non-nullable numbers; no conditional needed.

```tsx
<DetailPageHeader
  entityType="volume"
  entityId={initialVolume.id}
  entityName={initialVolume.title ?? `Volume ${initialVolume.number}`}
  stats={[
    { value: initialChapters.length, label: 'Chapters' },
    { value: `Ch. ${initialVolume.startChapter}–${initialVolume.endChapter}`, label: 'Range' },
  ].slice(0, 3)}
  tags={[]}
/>
```

Adjust field names to match the actual Volume type in the file if they differ from above.

- [ ] **Step 3: Wrap Overview tab in editorial grid**

The volume page's main content is the chapter list. Structure:

```
Main column:
  - Chapters list card

Aside column:
  - Details card (chapter range)
  - Arcs mentioned (if data available)
```

- [ ] **Step 4: Verify build + commit**

```bash
cd client && yarn build 2>&1 | tail -20
git add src/app/volumes/[id]/VolumePageClient.tsx
git commit -m "feat: apply editorial grid to VolumePageClient"
```

---

## Chunk 4: Chapter, Guide, Event PageClients

### Task 8: Update `ChapterPageClient`

**Files:**
- Modify: `client/src/app/chapters/[id]/ChapterPageClient.tsx`

- [ ] **Step 1: Read the current file**

Open `client/src/app/chapters/[id]/ChapterPageClient.tsx`.

- [ ] **Step 2: Update `DetailPageHeader` call**

**Important:** Events come from the `initialEvents` prop (separate from `chapter`) — use `initialEvents.length`, not `chapter.events`.

```tsx
<DetailPageHeader
  entityType="chapter"
  entityId={initialChapter.id}
  entityName={initialChapter.title ?? `Chapter ${initialChapter.number}`}
  stats={[
    ...(initialEvents.length ? [{ value: initialEvents.length, label: 'Events' }] : []),
    ...(initialChapter.volume ? [{ value: `Vol. ${initialChapter.volume.number}`, label: 'Volume' }] : []),
    ...(initialArc ? [{ value: initialArc.name, label: 'Arc' }] : []),
  ].slice(0, 3)}
  tags={[]}
/>
```

- [ ] **Step 3: Wrap Overview tab in editorial grid**

```
Main column:
  - Summary / description card (accent left border)
  - Events list (if any)

Aside column:
  - Details card (volume, arc, number)
  - Quotes compact (if any)
```

- [ ] **Step 4: Verify build + commit**

```bash
cd client && yarn build 2>&1 | tail -20
git add src/app/chapters/[id]/ChapterPageClient.tsx
git commit -m "feat: apply editorial grid to ChapterPageClient"
```

---

### Task 9: Update `GuidePageClient`

**Files:**
- Modify: `client/src/app/guides/[id]/GuidePageClient.tsx`

The guide page is different — the main content is the full guide text (not a description/backstory pair), and the aside holds author info, tags, and related entities.

- [ ] **Step 1: Read the current file**

Open `client/src/app/guides/[id]/GuidePageClient.tsx`.

- [ ] **Step 2: Update `DetailPageHeader` call**

```tsx
<DetailPageHeader
  entityType="guide"
  entityId={guide.id}
  entityName={guide.title}
  stats={[
    { value: guide.viewCount ?? 0, label: 'Views' },
    { value: guide.likeCount ?? 0, label: 'Likes' },
    {
      value: new Date(guide.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      label: 'Posted',
    },
  ]}
  tags={
    guide.tags?.map((t: any) => ({ label: t.name ?? t, variant: 'neutral' as const })) ?? []
  }
/>
```

Adjust field names to match the actual Guide type in the file.

- [ ] **Step 3: Wrap content in editorial grid**

```
Main column:
  - Guide content card (full markdown)

Aside column:
  - Author card (avatar, name, role badge)
  - Tags card (if any)
  - Related entities compact (arc, characters, gambles if present)
```

The author aside card (adjust field names as needed):
```tsx
<Card withBorder radius="lg" shadow="md" style={{ background: '#111', border: '1px solid #1a1a1a' }} p="md">
  <Text style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: 10 }}>Author</Text>
  <Group gap={8}>
    {/* Author avatar + name — use existing author display component or render directly */}
    <Text style={{ fontSize: 13, color: '#999' }}>{guide.author?.username ?? 'Unknown'}</Text>
  </Group>
</Card>
```

- [ ] **Step 4: Verify build + commit**

```bash
cd client && yarn build 2>&1 | tail -20
git add src/app/guides/[id]/GuidePageClient.tsx
git commit -m "feat: apply editorial grid to GuidePageClient"
```

---

### Task 10: Update `EventPageClient`

**Files:**
- Modify: `client/src/app/events/[id]/EventPageClient.tsx`

- [ ] **Step 1: Read the current file**

Open `client/src/app/events/[id]/EventPageClient.tsx`.

- [ ] **Step 2: Update `DetailPageHeader` call**

```tsx
<DetailPageHeader
  entityType="event"
  entityId={initialEvent.id}
  entityName={initialEvent.name}
  stats={[
    // Note: Event type uses chapterNumber (flat field), not event.chapter.number
    ...(initialEvent.chapterNumber != null ? [{ value: `Ch. ${initialEvent.chapterNumber}`, label: 'Chapter' }] : []),
    ...(initialEvent.arc ? [{ value: initialEvent.arc.name, label: 'Arc' }] : []),
    // Gamble count omitted per spec — only add if event.gambles is confirmed in page data
  ].slice(0, 3)}
  tags={[]}
/>
```

- [ ] **Step 3: Wrap Overview tab in editorial grid**

```
Main column:
  - Description card (accent left border)

Aside column:
  - Details card (chapter, arc)
  - Related Gambles compact (if available in page data)
  - Characters involved compact (if available)
```

- [ ] **Step 4: Verify build + commit**

```bash
cd client && yarn build 2>&1 | tail -20
git add src/app/events/[id]/EventPageClient.tsx
git commit -m "feat: apply editorial grid to EventPageClient"
```

---

### Task 11: Final build verification

- [ ] **Step 1: Full production build**

```bash
cd client && yarn build 2>&1
```

Expected: Build completes with 0 errors and 0 TypeScript errors. Any warnings about unused imports should have been resolved in each task's cleanup step.

- [ ] **Step 2: Lint pass**

```bash
cd client && yarn lint 2>&1
```

Expected: 0 errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete detail page editorial redesign

All 8 entity detail pages updated with cinematic hero, stats row, and 2-col editorial grid. DetailPageHeader and RelatedContentSection updated as shared components.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
