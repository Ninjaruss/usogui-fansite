# Cinematic Dark Design — Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Cinematic Dark design to all public entity detail page section cards, the Media tab, and the Annotations tab across 7 entity pages plus shared components.

**Architecture:** Introduce a `CinematicCard` wrapper component and `CinematicSectionHeader` component in a new shared file, export `getCinematicCardStyles` from `mantine-theme.ts`, then apply them across all 7 entity page clients and 2 annotation components. RelatedContentSection compact variant gets its own cinematic wrapper internally, so calling pages stop double-wrapping it.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Mantine UI v7, inline styles (`style={}` prop pattern established in codebase)

---

## File Structure

### New
- `client/src/components/layouts/CinematicCard.tsx` — `CinematicCard` wrapper + `CinematicSectionHeader`

### Modified
- `client/src/lib/mantine-theme.ts` — add `getCinematicCardStyles` export
- `client/src/components/layouts/RelatedContentSection.tsx` — compact variant gets internal cinematic card wrapper
- `client/src/types/index.ts` — add `imageFileName` to `CharacterOrganization.organization`
- `client/src/components/CharacterOrganizationMemberships.tsx` — add 40×40 org image / initials fallback
- `client/src/components/annotations/AnnotationCard.tsx` — full cinematic redesign
- `client/src/components/annotations/AnnotationSection.tsx` — cinematic wrapper + pill header
- `client/src/app/arcs/[id]/page.tsx` — add chapter data fetch for chapter navigation list
- `client/src/app/arcs/[id]/ArcPageClient.tsx` — chapter list + cinematic sections
- `client/src/app/characters/[id]/CharacterPageClient.tsx` — cinematic sections
- `client/src/app/gambles/[id]/GamblePageClient.tsx` — cinematic sections + faction layout logic
- `client/src/app/chapters/[id]/ChapterPageClient.tsx` — cinematic sections
- `client/src/app/organizations/[id]/OrganizationPageClient.tsx` — cinematic sections
- `client/src/app/events/[id]/EventPageClient.tsx` — cinematic sections
- `client/src/app/volumes/[id]/VolumePageClient.tsx` — cinematic sections + chapter navigation list

---

## Color Reference

From `entityColors.ts` (never hardcode these in components):
- `character` `#f5a623` · `arc` `#ff6b35` · `gamble` `#e63946` · `annotation` `#d946ef`
- `event` `#ca8a04` · `organization` `#0284c7` · `quote` `#0d9488`
- `chapter` `#38bdf8` · `volume` `#8b5cf6` · `media` `#ec4899`

---

## Cinematic Card Pattern (reference for all tasks)

**Card wrapper styles** (returned by `getCinematicCardStyles(entityColor)`):
```ts
{
  background: `linear-gradient(135deg, ${entityColor}0d 0%, #0d0d0d 55%, #0a0a0a 100%)`,
  border: `1px solid ${entityColor}22`,
  borderRadius: 10,
  overflow: 'hidden' as const,
  position: 'relative' as const,
}
```

**Top 1px accent line** (sibling Box rendered first inside the card):
```tsx
<Box style={{ height: 1, background: `linear-gradient(90deg, ${entityColor}, ${entityColor}60 40%, transparent 80%)` }} />
```

**Pill section header** (replaces icon-box + uppercase text + horizontal divider):
```tsx
<Group gap={8} mb={14} align="center">
  <Box style={{
    fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase',
    borderRadius: 4, padding: '3px 8px',
    background: `${entityColor}18`, border: `1px solid ${entityColor}30`, color: entityColor,
    flexShrink: 0
  }}>
    {label}
  </Box>
  <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${entityColor}18, transparent)` }} />
</Group>
```

**Details card row** (replaces 24×24 icon-box rows):
```tsx
<Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColor}14` }}>
  <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColor, flexShrink: 0 }} />
  <Text style={{ fontSize: 11, color: `${entityColor}66`, flex: 1 }}>Key Label</Text>
  <Text style={{ fontSize: 12, fontWeight: 700, color: valueColor }}>Value</Text>
</Box>
```
Last row omits `borderBottom`. Value color: entity color for own-entity values; linked entity's own color for cross-entity links.

---

### Task 1: Add `getCinematicCardStyles` to `mantine-theme.ts`

**Files:**
- Modify: `client/src/lib/mantine-theme.ts`

- [ ] **Step 1: Add `getCinematicCardStyles` after `getCardStyles`**

In `client/src/lib/mantine-theme.ts`, after the `getCardStyles` function (line ~821), add:

```ts
// Cinematic dark card styles — warm entity-color tinted gradient background
// Used for all section cards on detail pages
export const getCinematicCardStyles = (entityColor: string): React.CSSProperties => ({
  background: `linear-gradient(135deg, ${entityColor}0d 0%, #0d0d0d 55%, #0a0a0a 100%)`,
  border: `1px solid ${entityColor}22`,
  borderRadius: 10,
  overflow: 'hidden',
  position: 'relative',
})
```

You also need to add `import type React from 'react'` or use `React.CSSProperties`. Since the file doesn't currently import React (it's a theme file), use the explicit object type instead:

```ts
export const getCinematicCardStyles = (entityColor: string) => ({
  background: `linear-gradient(135deg, ${entityColor}0d 0%, #0d0d0d 55%, #0a0a0a 100%)`,
  border: `1px solid ${entityColor}22`,
  borderRadius: 10,
  overflow: 'hidden' as const,
  position: 'relative' as const,
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```
Expected: no errors in `mantine-theme.ts`.

- [ ] **Step 3: Commit**

```bash
cd client && git add src/lib/mantine-theme.ts
git commit -m "feat: add getCinematicCardStyles helper to mantine-theme"
```

---

### Task 2: Create `CinematicCard.tsx` shared component

**Files:**
- Create: `client/src/components/layouts/CinematicCard.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import React from 'react'
import { Box, Group } from '@mantine/core'

interface CinematicCardProps {
  entityColor: string
  padding?: string | number
  children: React.ReactNode
  style?: React.CSSProperties
}

/**
 * Cinematic dark card wrapper — warm entity-color tinted background,
 * 1px top gradient accent line, correct border.
 * Use for all section cards on entity detail pages.
 */
export function CinematicCard({ entityColor, padding = 'lg', children, style }: CinematicCardProps) {
  return (
    <Box
      style={{
        background: `linear-gradient(135deg, ${entityColor}0d 0%, #0d0d0d 55%, #0a0a0a 100%)`,
        border: `1px solid ${entityColor}22`,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {/* 1px top accent gradient line */}
      <Box
        style={{
          height: 1,
          background: `linear-gradient(90deg, ${entityColor}, ${entityColor}60 40%, transparent 80%)`,
        }}
      />
      <Box p={padding}>{children}</Box>
    </Box>
  )
}

interface CinematicSectionHeaderProps {
  label: string
  entityColor: string
  /** Extra content to render between the pill and the divider line */
  extra?: React.ReactNode
}

/**
 * Pill badge section header with trailing gradient divider line.
 * Replaces the old icon-box + uppercase text + horizontal divider combo.
 */
export function CinematicSectionHeader({ label, entityColor, extra }: CinematicSectionHeaderProps) {
  return (
    <Group gap={8} mb={14} align="center">
      <Box
        style={{
          fontSize: '0.55rem',
          fontWeight: 900,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          borderRadius: 4,
          padding: '3px 8px',
          background: `${entityColor}18`,
          border: `1px solid ${entityColor}30`,
          color: entityColor,
          flexShrink: 0,
        }}
      >
        {label}
      </Box>
      {extra}
      <Box
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, ${entityColor}18, transparent)`,
        }}
      />
    </Group>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd client && git add src/components/layouts/CinematicCard.tsx
git commit -m "feat: add CinematicCard and CinematicSectionHeader shared components"
```

---

### Task 3: Update `RelatedContentSection` — compact variant cinematic wrapper

**Files:**
- Modify: `client/src/components/layouts/RelatedContentSection.tsx`

Currently the compact variant renders a plain `Box` with no card wrapper. Calling pages wrap it in `<Card withBorder ...>`. Move the card wrapper inside `RelatedContentSection` so calling pages no longer need to do it.

- [ ] **Step 1: Update imports**

In `client/src/components/layouts/RelatedContentSection.tsx`, update the import at the top to include `CinematicCard` and `CinematicSectionHeader`:

```tsx
import { CinematicCard, CinematicSectionHeader } from './CinematicCard'
```

Also add `getCinematicCardStyles` to the mantine-theme import if needed (not required since CinematicCard handles that).

- [ ] **Step 2: Replace compact variant rendering**

Find the `if (variant === 'compact')` block (lines ~67-126 of the current file). Replace the returned JSX with a `CinematicCard` wrapper:

```tsx
if (variant === 'compact') {
  const dotColor = itemDotColor ?? accentColor
  return (
    <CinematicCard entityColor={accentColor} padding="md">
      <CinematicSectionHeader label={title} entityColor={accentColor} />
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
            borderBottom: `1px solid ${accentColor}14`,
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
          <Text style={{ fontSize: 13, color: `${accentColor}88`, flex: 1 }}>
            {getLabel!(item)}
          </Text>
          <Text style={{ fontSize: 12, color: `${accentColor}44` }}>›</Text>
        </Box>
      ))}
      {viewAllHref && items.length > (previewCount ?? 4) && (
        <Box pt={8}>
          <Text
            component={Link}
            href={viewAllHref}
            style={{ fontSize: 12, color: `${accentColor}55`, textDecoration: 'none' }}
          >
            View all {items.length} →
          </Text>
        </Box>
      )}
    </CinematicCard>
  )
}
```

- [ ] **Step 3: Update cards variant to use cinematic card**

Find the `return (` for the cards variant (line ~128). Replace:
```tsx
return (
  <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, accentColor)}>
    <Stack gap={theme.spacing.md} p={theme.spacing.md}>
      <Group
        justify="space-between"
        align="center"
        pb={theme.spacing.sm}
        style={{ borderBottom: `1px solid ${accentColor}25` }}
      >
        <Group gap={theme.spacing.sm}>
          {icon}
          <Title order={4} c={titleColor}>{title}</Title>
        </Group>
        {viewAllHref && items.length > previewCount && (
          <Button ... >View All ({items.length})</Button>
        )}
      </Group>
      ...
    </Stack>
  </Card>
)
```

With:
```tsx
return (
  <CinematicCard entityColor={accentColor}>
    <Stack gap={theme.spacing.md}>
      <CinematicSectionHeader
        label={title}
        entityColor={accentColor}
        extra={
          viewAllHref && items.length > previewCount ? (
            <Box
              component={Link}
              href={viewAllHref}
              style={{
                fontSize: 11,
                color: `${accentColor}88`,
                textDecoration: 'none',
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              View All ({items.length}) →
            </Box>
          ) : undefined
        }
      />
      <Stack gap={theme.spacing.sm}>
        {displayItems.map((item, index) => (
          <React.Fragment key={getKey(item)}>
            {renderItem!(item, index)}
          </React.Fragment>
        ))}
      </Stack>
    </Stack>
  </CinematicCard>
)
```

Remove unused imports: `Card`, `Title`, `Button`, `getCardStyles` (keep `getEntityThemeColor`, `textColors`, `EntityAccentKey`).

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd client && git add src/components/layouts/RelatedContentSection.tsx
git commit -m "feat: cinematic card wrapper for RelatedContentSection compact and cards variants"
```

---

### Task 4: Update `AnnotationCard.tsx` — cinematic redesign

**Files:**
- Modify: `client/src/components/annotations/AnnotationCard.tsx`

The annotation color is `#d946ef` (fuchsia). The card gets:
- Cinematic bg: `linear-gradient(135deg, #150520, #0d0d0d 55%, #0a0a0a)`
  — Use `getCinematicCardStyles(annotationColor)` which gives `${annotationColor}0d` tint (matches spec intent)
- Border: `#d946ef25`
- Top 1px accent: auto from `CinematicCard`
- Left 2px vertical accent via inline pseudo (use absolute positioned Box)
- Title text: `#e8c0f8` (light fuchsia)
- Preview/content text: `#9070b0` (muted purple-grey)
- Meta row: `#6040a0` (darker purple-grey)
- Spoiler badge: `#ca8a04` (event/ochre color — already orange)
- Expanded content box: slightly darker nested bg

- [ ] **Step 1: Update imports**

Replace the imports section:
```tsx
'use client'

import React, { useState } from 'react'
import {
  Anchor,
  ActionIcon,
  Badge,
  Box,
  Collapse,
  Group,
  Stack,
  Text,
  Tooltip,
  useMantineTheme,
} from '@mantine/core'
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Edit,
  Trash2,
  BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { Annotation, AnnotationStatus } from '../../types'
import { getEntityThemeColor } from '../../lib/mantine-theme'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { CinematicCard, CinematicSectionHeader } from '../layouts/CinematicCard'
```

(Remove `Card`, `MessageSquare`, `textColors`, `getCardStyles` from imports — they are no longer needed in this component.)

- [ ] **Step 2: Replace the Card JSX**

Find the `return (` block (line ~79). Replace the `<Card ...>` wrapper and header with:

```tsx
const annotationColor = getEntityThemeColor(theme, 'annotation')

return (
  <Box
    style={{
      background: `linear-gradient(135deg, ${annotationColor}0d 0%, #0d0d0d 55%, #0a0a0a 100%)`,
      border: `1px solid ${annotationColor}25`,
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    {/* 1px top accent */}
    <Box style={{ height: 1, background: `linear-gradient(90deg, ${annotationColor}, ${annotationColor}60 40%, transparent 80%)` }} />
    {/* 2px left vertical accent */}
    <Box
      style={{
        position: 'absolute',
        left: 0,
        top: 1,
        bottom: 0,
        width: 2,
        background: `linear-gradient(180deg, ${annotationColor}, ${annotationColor}40)`,
      }}
    />
    <Box p="md" pl="lg">
      <Stack gap="xs">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Text fw={700} size="sm" style={{ color: '#e8c0f8' }} truncate>
            {annotation.title}
          </Text>

          <Group gap="xs" wrap="nowrap">
            {annotation.isSpoiler && (
              <Tooltip
                label={
                  isSpoilerHidden
                    ? `Spoiler for Chapter ${annotation.spoilerChapter}+`
                    : 'Contains spoilers'
                }
              >
                <Badge
                  size="xs"
                  variant="light"
                  color="orange"
                  leftSection={<AlertTriangle size={10} />}
                >
                  Spoiler
                </Badge>
              </Tooltip>
            )}

            {isOwner && annotation.status !== AnnotationStatus.APPROVED && (
              <Badge
                size="xs"
                variant="light"
                style={{
                  backgroundColor: `${getStatusColor(annotation.status)}20`,
                  color: getStatusColor(annotation.status),
                  border: `1px solid ${getStatusColor(annotation.status)}40`,
                }}
              >
                {annotation.status}
              </Badge>
            )}

            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </ActionIcon>
          </Group>
        </Group>

        {/* Collapsed preview */}
        {!expanded && canShowContent && (
          <Text size="xs" style={{ color: '#9070b0' }} lineClamp={2}>
            {annotation.content.substring(0, 150)}
            {annotation.content.length > 150 ? '...' : ''}
          </Text>
        )}

        {/* Spoiler warning when collapsed */}
        {!expanded && !canShowContent && (
          <Box
            p="xs"
            style={{
              backgroundColor: `${theme.colors.orange[9]}20`,
              borderRadius: theme.radius.sm,
            }}
          >
            <Group gap="xs">
              <AlertTriangle size={14} color={theme.colors.orange[5]} />
              <Text size="xs" style={{ color: theme.colors.orange[5] }}>
                This annotation contains spoilers for Chapter{' '}
                {annotation.spoilerChapter}+. Update your reading progress to view.
              </Text>
            </Group>
          </Box>
        )}

        {/* Expanded content */}
        <Collapse in={expanded}>
          <Stack gap="sm" pt="xs">
            {canShowContent ? (
              <Box
                p="sm"
                style={{
                  backgroundColor: '#0a0a0a',
                  border: `1px solid ${annotationColor}18`,
                  borderRadius: theme.radius.sm,
                }}
              >
                <EnhancedSpoilerMarkdown content={annotation.content} />
              </Box>
            ) : (
              <Box
                p="md"
                style={{
                  backgroundColor: `${theme.colors.orange[9]}20`,
                  borderRadius: theme.radius.sm,
                }}
              >
                <Stack gap="xs" align="center">
                  <AlertTriangle size={24} color={theme.colors.orange[5]} />
                  <Text size="sm" style={{ color: theme.colors.orange[5] }} ta="center">
                    This annotation contains spoilers for Chapter{' '}
                    {annotation.spoilerChapter}+
                  </Text>
                  <Text size="xs" style={{ color: '#9070b0' }} ta="center">
                    Update your reading progress to view this content.
                  </Text>
                </Stack>
              </Box>
            )}

            {/* Metadata */}
            <Group justify="space-between" wrap="wrap" gap="xs">
              <Group gap="xs">
                {annotation.sourceUrl && (
                  <Tooltip label="View source">
                    <Anchor
                      href={annotation.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      style={{ color: '#9070b0' }}
                    >
                      <Group gap={4}>
                        <ExternalLink size={12} />
                        <Text size="xs">Source</Text>
                      </Group>
                    </Anchor>
                  </Tooltip>
                )}

                {annotation.chapterReference && (
                  <Tooltip label="Chapter reference">
                    <Badge
                      size="xs"
                      variant="outline"
                      color="gray"
                      leftSection={<BookOpen size={10} />}
                    >
                      Ch. {annotation.chapterReference}
                    </Badge>
                  </Tooltip>
                )}
              </Group>

              <Group gap="xs">
                <Text size="xs" style={{ color: '#6040a0' }}>
                  by {annotation.author?.username || 'Unknown'} on{' '}
                  {formatDate(annotation.createdAt)}
                </Text>

                {isOwner && (
                  <Group gap={4}>
                    {onEdit && (
                      <Tooltip label="Edit annotation">
                        <ActionIcon
                          variant="subtle"
                          size="xs"
                          onClick={() => onEdit(annotation)}
                        >
                          <Edit size={12} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip label="Delete annotation">
                        <ActionIcon
                          variant="subtle"
                          size="xs"
                          color="red"
                          onClick={() => onDelete(annotation.id)}
                        >
                          <Trash2 size={12} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                )}
              </Group>
            </Group>

            {/* Rejection reason */}
            {isOwner &&
              annotation.status === AnnotationStatus.REJECTED &&
              annotation.rejectionReason && (
                <Box
                  p="xs"
                  style={{
                    backgroundColor: `${theme.colors.red[9]}20`,
                    borderRadius: theme.radius.sm,
                  }}
                >
                  <Text size="xs" style={{ color: theme.colors.red[4] }}>
                    <strong>Rejection reason:</strong>{' '}
                    {annotation.rejectionReason}
                  </Text>
                </Box>
              )}
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  </Box>
)
```

Note: `pl="lg"` gives left padding to offset the 2px vertical accent bar.

- [ ] **Step 3: Move `annotationColor` declaration to before the return**

The `annotationColor` declaration (`const annotationColor = getEntityThemeColor(theme, 'annotation')`) must go before the `isSpoilerHidden` logic, at the top of the component body.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd client && git add src/components/annotations/AnnotationCard.tsx
git commit -m "feat: cinematic dark redesign for AnnotationCard"
```

---

### Task 5: Update `AnnotationSection.tsx` — cinematic wrapper + pill header

**Files:**
- Modify: `client/src/components/annotations/AnnotationSection.tsx`

- [ ] **Step 1: Update imports**

Add `CinematicCard`, `CinematicSectionHeader` to imports. Remove `getCardStyles` usage (replaced by `CinematicCard`):

```tsx
import { CinematicCard, CinematicSectionHeader } from '../layouts/CinematicCard'
```

Change:
```tsx
import { textColors, getCardStyles, getEntityThemeColor } from '../../lib/mantine-theme'
```
To:
```tsx
import { getEntityThemeColor } from '../../lib/mantine-theme'
```

- [ ] **Step 2: Update entity color**

Find `const entityColor = theme.colors.violet[5]` (line ~56). Replace with:
```tsx
const entityColor = getEntityThemeColor(theme, 'annotation')
```

- [ ] **Step 3: Update loading skeleton card**

Find the loading return (line ~156):
```tsx
return (
  <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
    <Stack gap="md" p="md">
      ...
    </Stack>
  </Card>
)
```
Replace with:
```tsx
return (
  <CinematicCard entityColor={entityColor} padding="md">
    <Stack gap="md">
      <Group gap="sm">
        <Skeleton circle height={24} width={24} />
        <Skeleton height={20} width={150} />
      </Group>
      <Stack gap="sm">
        {[1, 2].map((i) => (
          <Skeleton key={i} height={80} />
        ))}
      </Stack>
    </Stack>
  </CinematicCard>
)
```

- [ ] **Step 4: Update main card and header**

Find the main `return (` (line ~181). Replace the outer `Card` and header `Group`:
```tsx
return (
  <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColor)}>
    <Stack gap="md" p="md">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <MessageSquare size={20} color={entityColor} />
          <Title order={4} c={textColors.primary}>
            Annotations
          </Title>
          {annotations.length > 0 && (
            <Badge size="sm" variant="light" color="violet">
              {annotations.length}
            </Badge>
          )}
        </Group>
        ...
      </Group>
```
With:
```tsx
return (
  <CinematicCard entityColor={entityColor} padding="md">
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between" align="center">
        <CinematicSectionHeader
          label={`Annotations${annotations.length > 0 ? ` (${annotations.length})` : ''}`}
          entityColor={entityColor}
        />
```

Note: `CinematicSectionHeader` goes inside the `Group justify="space-between"` alongside the action buttons, or restructure as:
```tsx
<Group justify="space-between" align="center" mb={0}>
  <Group gap={8} align="center" style={{ flex: 1 }}>
    <Box
      style={{
        fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase',
        borderRadius: 4, padding: '3px 8px',
        background: `${entityColor}18`, border: `1px solid ${entityColor}30`, color: entityColor,
        flexShrink: 0,
      }}
    >
      {annotations.length > 0 ? `Annotations (${annotations.length})` : 'Annotations'}
    </Box>
    <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${entityColor}18, transparent)` }} />
  </Group>

  <Group gap="sm" style={{ flexShrink: 0, marginLeft: 8 }}>
    {isAuthenticated && (
      <Button
        component={Link}
        href={`/submit-annotation?type=${ownerType}&id=${ownerId}`}
        size="xs"
        variant="light"
        style={{ background: `${entityColor}20`, color: entityColor, border: `1px solid ${entityColor}30` }}
        leftSection={<Plus size={14} />}
      >
        Add
      </Button>
    )}
    {annotations.length > 0 && (
      <Button
        variant="subtle"
        size="xs"
        style={{ color: `${entityColor}88` }}
        onClick={() => setExpanded(!expanded)}
        rightSection={expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      >
        {expanded ? 'Collapse' : 'Expand'}
      </Button>
    )}
  </Group>
</Group>
```

- [ ] **Step 5: Update empty state text**

Find `<Text size="sm" c={textColors.tertiary} ...>No annotations yet.`. Replace `c={textColors.tertiary}` with `style={{ color: \`${entityColor}55\` }}`.

- [ ] **Step 6: Close the outer element**

Ensure the last `</Card>` becomes `</CinematicCard>`. The Modal (edit modal) stays inside `CinematicCard` — no change needed there.

Remove unused imports: `MessageSquare`, `Title`, `Card`, `textColors`.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd client && git add src/components/annotations/AnnotationSection.tsx
git commit -m "feat: cinematic dark redesign for AnnotationSection"
```

---

### Task 6a: Update `CharacterOrganizationMemberships.tsx` — org image display

**Files:**
- Modify: `client/src/types/index.ts`
- Modify: `client/src/components/CharacterOrganizationMemberships.tsx`

The spec calls for 40×40 rounded org thumbnail or initials fallback. The backend `Organization` entity does **not** yet have `imageFileName` — this task adds the frontend type and rendering logic now, so images will appear once the backend column is added. Until then, all orgs show the initials fallback.

- [ ] **Step 1: Add `imageFileName` to type**

In `client/src/types/index.ts`, find `CharacterOrganization.organization` (line ~377) and add the field:
```ts
organization?: {
  id: number;
  name: string;
  description?: string;
  imageFileName?: string | null;
};
```

- [ ] **Step 2: Read `CharacterOrganizationMemberships.tsx`** to find where each org row is rendered (search for where `organization.name` is displayed in the org rows).

- [ ] **Step 3: Replace the org row identifier with image/initials**

Find the org row rendering (it will be a `Box` or similar with `organization.name`). Add a 40×40 thumbnail or initials avatar before the org name.

Replace whatever the current org identifier is with:
```tsx
{/* 40×40 org thumbnail — image if available, initials fallback */}
{membership.organization?.imageFileName ? (
  <Box
    component="img"
    src={`/api/media/image/${membership.organization.imageFileName}`}
    alt={membership.organization?.name}
    style={{
      width: 40,
      height: 40,
      borderRadius: 6,
      objectFit: 'cover',
      flexShrink: 0,
      border: `1px solid ${entityColor}30`,
    }}
  />
) : (
  <Box
    style={{
      width: 40,
      height: 40,
      borderRadius: 6,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `${entityColor}18`,
      border: `1px solid ${entityColor}30`,
      fontSize: 13,
      fontWeight: 800,
      color: entityColor,
      textTransform: 'uppercase',
    }}
  >
    {(membership.organization?.name ?? '?').slice(0, 2)}
  </Box>
)}
```

Note: The `entityColor` in this component is already `getEntityThemeColor(theme, 'organization')` (see line ~47). Use that for the initials fallback border/bg.

Note: The media URL pattern for org images is not yet established since the backend has no such column. Use `/api/media/image/${imageFileName}` as a placeholder — update when backend adds the field.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
cd client && git add src/types/index.ts src/components/CharacterOrganizationMemberships.tsx
git commit -m "feat: org image display in CharacterOrganizationMemberships (initials fallback until backend adds imageFileName)"
```

---

### Task 6: Update `CharacterPageClient.tsx`

**Files:**
- Modify: `client/src/app/characters/[id]/CharacterPageClient.tsx`

Changes:
1. Add `CinematicCard`, `CinematicSectionHeader` imports
2. Replace all section cards (Description, Backstory, Organizations) with `CinematicCard` + `CinematicSectionHeader`
3. Replace Details sidebar card — cinematic card + 5px dot rows (remove icon boxes)
4. Remove `Card` wrappers around compact `RelatedContentSection` (RelatedContentSection now provides its own)
5. Replace media tab `Card` wrapper with cinematic media card

- [ ] **Step 1: Add imports**

Add to existing imports:
```tsx
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
```

Remove `getCardStyles` from `mantine-theme` imports (it's no longer used in this file after the changes).

- [ ] **Step 2: Replace Description card**

Find:
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
      <Box style={{ width: 28, height: 28, borderRadius: 6, ... }}>
        <User size={16} color={entityColors.character} />
      </Box>
      <Text style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: entityColors.character, opacity: 0.85 }}>
        Description
      </Text>
      <Box style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${getAlphaColor(entityColors.character, 0.20)}, transparent)` }} />
    </Group>
    {/* content */}
  </Box>
</Card>
```
Replace with:
```tsx
<CinematicCard entityColor={entityColors.character}>
  <CinematicSectionHeader label="Description" entityColor={entityColors.character} />
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
    <Text size="sm" style={{ fontStyle: 'italic', color: `${entityColors.character}55` }}>
      No description available yet.
    </Text>
  )}
</CinematicCard>
```

- [ ] **Step 3: Replace Backstory card**

Same pattern as Description. Find the Backstory `Card` block and replace:
```tsx
{character.backstory && (
  <CinematicCard entityColor={entityColors.character}>
    <CinematicSectionHeader label="Backstory" entityColor={entityColors.character} />
    <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
      <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
        <EnhancedSpoilerMarkdown
          content={character.backstory}
          enableEntityEmbeds
          compactEntityCards={false}
        />
      </Box>
    </TimelineSpoilerWrapper>
  </CinematicCard>
)}
```

- [ ] **Step 4: Replace Organizations card**

Find the Organizations `Card` block (the one with `CharacterOrganizationMemberships`):
```tsx
{character.organizations && character.organizations.length > 0 && (
  <Card withBorder radius="lg" shadow="lg" padding={0} style={getCardStyles(theme, entityColors.organization)}>
    <Box style={{ height: 3, ... }} />
    <Box p="md">
      <Group gap={10} mb={14} ...>
        ...
      </Group>
      <CharacterOrganizationMemberships ... />
    </Box>
  </Card>
)}
```
Replace with:
```tsx
{character.organizations && character.organizations.length > 0 && (
  <CinematicCard entityColor={entityColors.organization} padding="md">
    <CinematicSectionHeader label="Organizations" entityColor={entityColors.organization} />
    <CharacterOrganizationMemberships
      characterId={character.id}
      characterName={character.name}
    />
  </CinematicCard>
)}
```

- [ ] **Step 5: Replace Details sidebar card (5px dots, new divider)**

Find the Details sidebar `Card` (the one with Debut, Organization, Gambles, Arcs rows). Replace with:

```tsx
<CinematicCard entityColor={entityColors.character} padding="md">
  <CinematicSectionHeader label="Details" entityColor={entityColors.character} />
  {character.firstAppearanceChapter != null && (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.character}14` }}>
      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.character, flexShrink: 0 }} />
      <Text style={{ fontSize: 11, color: `${entityColors.character}66`, flex: 1 }}>Debut</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>Ch. {character.firstAppearanceChapter}</Text>
    </Box>
  )}
  {character.organizations && character.organizations.length > 0 && (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.character}14` }}>
      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.character, flexShrink: 0 }} />
      <Text style={{ fontSize: 11, color: `${entityColors.character}66`, flex: 1 }}>Organization</Text>
      <Text
        component={Link}
        href={`/organizations/${character.organizations[0].id}`}
        style={{ fontSize: 12, fontWeight: 700, color: entityColors.organization, textDecoration: 'none' }}
      >
        {character.organizations[0].name}
      </Text>
    </Box>
  )}
  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.character}14` }}>
    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.character, flexShrink: 0 }} />
    <Text style={{ fontSize: 11, color: `${entityColors.character}66`, flex: 1 }}>Gambles</Text>
    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{gambles.length}</Text>
  </Box>
  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.character, flexShrink: 0 }} />
    <Text style={{ fontSize: 11, color: `${entityColors.character}66`, flex: 1 }}>Arcs</Text>
    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{arcs.length}</Text>
  </Box>
</CinematicCard>
```

- [ ] **Step 6: Remove Card wrappers around compact RelatedContentSections**

Find the Story Arcs, Gambles, Quotes compact sections in the sidebar. Remove the `<Card withBorder ...>` wrapper around each `<RelatedContentSection ... variant="compact" ... />`. The `RelatedContentSection` now provides its own card. Before:
```tsx
<Card withBorder radius="lg" shadow="md" style={getCardStyles(theme, entityColors.arc)} p="md">
  <RelatedContentSection entityType="arc" ... variant="compact" ... />
</Card>
```
After:
```tsx
<RelatedContentSection entityType="arc" ... variant="compact" ... />
```
Repeat for Gambles and Quotes.

- [ ] **Step 7: Replace media tab card**

Find the media tab `<Tabs.Panel value="media" ...>` content. Replace:
```tsx
<Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.media)}>
  <Stack gap="md" p="md">
    <Group justify="space-between" align="center">
      <Group gap="sm">
        <ImageIcon size={20} color={entityColors.media} />
        <Title order={4} c={textColors.media}>Media Gallery</Title>
      </Group>
      <Button component={Link} href={...} variant="outline" c={entityColors.media} size="sm" radius="xl">
        View All
      </Button>
    </Group>
    <MediaGallery ... />
  </Stack>
</Card>
```
With:
```tsx
<CinematicCard entityColor={entityColors.media} padding="md">
  <Group justify="space-between" align="center" mb={14}>
    <Box
      style={{
        fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase',
        borderRadius: 4, padding: '3px 8px',
        background: `${entityColors.media}18`, border: `1px solid ${entityColors.media}30`, color: entityColors.media,
      }}
    >
      Media Gallery
    </Box>
    <Box
      component={Link}
      href={`/media?ownerType=character&ownerId=${character.id}`}
      style={{ fontSize: 11, color: `${entityColors.media}88`, textDecoration: 'none' }}
    >
      View All →
    </Box>
  </Group>
  <MediaGallery
    ownerType="character"
    ownerId={character.id}
    purpose="gallery"
    limit={8}
    showTitle={false}
    compactMode
    showFilters={false}
    initialMediaId={mediaId}
  />
</CinematicCard>
```

- [ ] **Step 8: Remove unused imports**

Remove from the import list: `Title`, `Crown`, `BookOpen`, `Bookmark`, `Calendar`, `Building2` (if no longer used), `getCardStyles`.
Keep: `User`, `Scroll`, `Users`, `Image as ImageIcon`, `MessageSquare`, `Link` etc.

Verify no remaining references to removed items.

- [ ] **Step 9: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
cd client && git add src/app/characters/[id]/CharacterPageClient.tsx
git commit -m "feat: cinematic dark design for CharacterPageClient"
```

---

### Task 7: Update `GamblePageClient.tsx` — cinematic sections + faction layout

**Files:**
- Modify: `client/src/app/gambles/[id]/GamblePageClient.tsx`

Changes:
1. Add `CinematicCard`, `CinematicSectionHeader` imports
2. Replace all section cards with cinematic pattern
3. Refactor faction layout logic: `supportedGambler` presence → Main vs Third Party; count of main sides → VS vs grid
4. Replace Details sidebar card — cinematic + 5px dot rows
5. Replace media tab card

- [ ] **Step 1: Add imports**

```tsx
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
```

- [ ] **Step 2: Replace About This Gamble card**

```tsx
<CinematicCard entityColor={gambleColor}>
  <CinematicSectionHeader label="About This Gamble" entityColor={gambleColor} />
  {initialGamble.description ? (
    <TimelineSpoilerWrapper chapterNumber={initialGamble.chapter?.number ?? initialGamble.chapterId}>
      <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
        <EnhancedSpoilerMarkdown content={initialGamble.description} className="gamble-description" enableEntityEmbeds compactEntityCards={false} />
      </Box>
    </TimelineSpoilerWrapper>
  ) : (
    <Text size="sm" style={{ fontStyle: 'italic', textAlign: 'center', padding: '24px 0', color: `${gambleColor}55` }}>
      No description available for this gamble yet.
    </Text>
  )}
</CinematicCard>
```

- [ ] **Step 3: Replace Rules card**

```tsx
<CinematicCard entityColor={gambleColor}>
  <CinematicSectionHeader label="Rules" entityColor={gambleColor} />
  <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
    <EnhancedSpoilerMarkdown content={initialGamble.rules} className="gamble-rules" enableEntityEmbeds compactEntityCards={false} />
  </Box>
</CinematicCard>
```

- [ ] **Step 4: Replace Win Condition card**

Keep the inner `manga-panel-border` box — apply cinematic wrapper only around it:
```tsx
{initialGamble.winCondition && (
  <CinematicCard entityColor={gambleColor}>
    <CinematicSectionHeader label="Win Condition" entityColor={gambleColor} />
    <Box
      className="manga-panel-border"
      style={{
        position: 'relative',
        padding: '1rem 1.25rem',
        background: `${gambleColor}08`,
        border: `1px solid ${gambleColor}30`,
        borderRadius: '0.5rem',
        marginTop: 12,
        fontSize: 14,
        lineHeight: 1.6,
      }}
    >
      <EnhancedSpoilerMarkdown content={initialGamble.winCondition} className="gamble-win-condition" enableEntityEmbeds compactEntityCards={false} />
    </Box>
  </CinematicCard>
)}
```

- [ ] **Step 5: Replace Explanation & Analysis card**

```tsx
{initialGamble.explanation && (
  <CinematicCard entityColor={gambleColor}>
    <CinematicSectionHeader label="Explanation & Analysis" entityColor={gambleColor} />
    <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
      <EnhancedSpoilerMarkdown content={initialGamble.explanation} className="gamble-explanation" enableEntityEmbeds compactEntityCards={false} />
    </Box>
  </CinematicCard>
)}
```

- [ ] **Step 6: Replace Participants/Factions card with new layout logic**

The new faction rendering logic is driven by `supportedGambler` field:
- Main sides = factions WHERE `faction.supportedGambler != null`
- Third parties = factions WHERE `faction.supportedGambler == null`
- 2 main sides → VS layout; 3+ main sides → equal-column grid
- Third parties always render below main sides as full-width muted grey blocks

Replace the entire Participants/Factions card block:

```tsx
{initialGamble.factions && initialGamble.factions.length > 0 && (
  <CinematicCard entityColor={gambleColor}>
    <CinematicSectionHeader label="Participants" entityColor={gambleColor} />
    {(() => {
      const sorted = [...initialGamble.factions].sort((a, b) => a.displayOrder - b.displayOrder)
      const mainSides = sorted.filter(f => f.supportedGambler != null)
      const thirdParties = sorted.filter(f => f.supportedGambler == null)

      // Color palette for main sides (cycle through entity colors)
      const sideColors = [gambleColor, characterColor, arcColor]

      const renderMemberRow = (member: GambleFactionMember, factionAccent: string, isLast: boolean) => (
        <Link key={member.id} href={`/characters/${member.character.id}`} style={{ textDecoration: 'none' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: isLast ? 'none' : '1px solid #161616', cursor: 'pointer' }}>
            <Box style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${factionAccent}20`, border: `1px solid ${factionAccent}40`, fontSize: 9, fontWeight: 700, color: factionAccent }}>
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
      )

      const renderFactionBlock = (faction: GambleFaction, factionAccent: string) => {
        const factionName = faction.name || (faction.supportedGambler ? `${faction.supportedGambler.name}'s Side` : 'Faction')
        const membersSorted = [...faction.members].sort((a, b) => a.displayOrder - b.displayOrder)
        return (
          <Box style={{ flex: 1, minWidth: 0, border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
            <Box style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: `${factionAccent}10`, borderBottom: `1px solid ${factionAccent}20` }}>
              <Box style={{ width: 8, height: 8, borderRadius: '50%', background: factionAccent, flexShrink: 0 }} />
              <Text style={{ fontSize: 13, fontWeight: 700, color: '#ddd' }}>{factionName}</Text>
            </Box>
            <Box style={{ padding: '6px 0', background: '#0e0e0e', paddingLeft: 12, paddingRight: 12 }}>
              {membersSorted.map((member, mIdx) => renderMemberRow(member, factionAccent, mIdx === membersSorted.length - 1))}
            </Box>
          </Box>
        )
      }

      return (
        <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Main sides */}
          {mainSides.length === 2 ? (
            // VS layout
            <Box style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              {renderFactionBlock(mainSides[0], sideColors[0])}
              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 6px', gap: 4, flexShrink: 0 }}>
                <Box style={{ flex: 1, width: 1, minHeight: 30, background: 'linear-gradient(to bottom, transparent, #333 40%, #333 60%, transparent)' }} />
                <Text style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 800, color: '#e11d48', textShadow: '0 0 14px rgba(225,29,72,0.5)', letterSpacing: '0.05em' }}>VS</Text>
                <Box style={{ flex: 1, width: 1, minHeight: 30, background: 'linear-gradient(to bottom, transparent, #333 40%, #333 60%, transparent)' }} />
              </Box>
              {renderFactionBlock(mainSides[1], sideColors[1])}
            </Box>
          ) : mainSides.length >= 3 ? (
            // Equal-column grid
            <Box style={{ display: 'grid', gridTemplateColumns: mainSides.map(() => '1fr').join(' '), gap: 8 }}>
              {mainSides.map((faction, idx) => (
                <React.Fragment key={faction.id}>
                  {renderFactionBlock(faction, sideColors[idx % sideColors.length])}
                </React.Fragment>
              ))}
            </Box>
          ) : mainSides.length === 1 ? (
            // Single main side — full width
            renderFactionBlock(mainSides[0], sideColors[0])
          ) : null}

          {/* Third parties — full-width muted grey blocks */}
          {thirdParties.map((faction) => {
            const factionName = faction.name || 'Third Party'
            const membersSorted = [...faction.members].sort((a, b) => a.displayOrder - b.displayOrder)
            return (
              <Box key={faction.id} style={{ border: '1px solid #282828', borderRadius: 12, overflow: 'hidden' }}>
                <Box style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: '#181818', borderBottom: '1px solid #242424' }}>
                  <Box style={{ width: 8, height: 8, borderRadius: '50%', background: '#444', flexShrink: 0 }} />
                  <Text style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>{factionName}</Text>
                  <Box style={{ marginLeft: 'auto', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 3, padding: '1px 6px', fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Third Party
                  </Box>
                </Box>
                <Box style={{ padding: '6px 12px', background: '#0d0d0d' }}>
                  {membersSorted.map((member, mIdx) => (
                    <Link key={member.id} href={`/characters/${member.character.id}`} style={{ textDecoration: 'none' }}>
                      <Box style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: mIdx < membersSorted.length - 1 ? '1px solid #141414' : 'none' }}>
                        <Box style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#252525', border: '1px solid #2e2e2e', fontSize: 9, fontWeight: 700, color: '#777' }}>
                          {member.character.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </Box>
                        <Text style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>{member.character.name}</Text>
                        {member.role && (
                          <Box style={{ marginLeft: 'auto', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#444', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                            {member.role}
                          </Box>
                        )}
                      </Box>
                    </Link>
                  ))}
                </Box>
              </Box>
            )
          })}
        </Box>
      )
    })()}
  </CinematicCard>
)}
```

- [ ] **Step 7: Replace Details sidebar card**

```tsx
<CinematicCard entityColor={gambleColor} padding="md">
  <CinematicSectionHeader label="Details" entityColor={gambleColor} />
  {(initialGamble.chapter != null || initialGamble.chapterId != null) && (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${gambleColor}14` }}>
      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: gambleColor, flexShrink: 0 }} />
      <Text style={{ fontSize: 11, color: `${gambleColor}66`, flex: 1 }}>Start</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: gambleColor }}>Ch. {initialGamble.chapter?.number ?? initialGamble.chapterId}</Text>
    </Box>
  )}
  {gambleArc != null && (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${gambleColor}14` }}>
      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: gambleColor, flexShrink: 0 }} />
      <Text style={{ fontSize: 11, color: `${gambleColor}66`, flex: 1 }}>Arc</Text>
      <Text component={Link} href={`/arcs/${gambleArc.id}`} style={{ fontSize: 12, fontWeight: 700, color: arcColor, textDecoration: 'none' }}>{gambleArc.name}</Text>
    </Box>
  )}
  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: gambleColor, flexShrink: 0 }} />
    <Text style={{ fontSize: 11, color: `${gambleColor}66`, flex: 1 }}>Players</Text>
    <Text style={{ fontSize: 12, fontWeight: 700, color: gambleColor }}>{initialGamble.participants?.length ?? 0}</Text>
  </Box>
</CinematicCard>
```

- [ ] **Step 8: Wrap sidebar compact RelatedContentSections in nothing** (RelatedContentSection handles its own cinematic card now)

Find the Participants compact and Factions compact sidebar RelatedContentSections (lines ~546-569). They are already NOT wrapped in a Card, so no change needed for the wrapper. They will automatically get the cinematic treatment from the updated `RelatedContentSection`.

- [ ] **Step 9: Replace media tab card**

Same pattern as CharacterPageClient media tab but with `gamble` ownerType:
```tsx
<CinematicCard entityColor={gambleColor} padding="md">
  <Group justify="space-between" align="center" mb={14}>
    <Box style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', borderRadius: 4, padding: '3px 8px', background: `${gambleColor}18`, border: `1px solid ${gambleColor}30`, color: gambleColor }}>
      Media Gallery
    </Box>
    <Box component={Link} href={`/media?ownerType=gamble&ownerId=${initialGamble.id}`} style={{ fontSize: 11, color: `${gambleColor}88`, textDecoration: 'none' }}>
      View All →
    </Box>
  </Group>
  <MediaGallery
    ownerType="gamble"
    ownerId={initialGamble.id}
    purpose="gallery"
    limit={8}
    showTitle={false}
    compactMode
    showFilters={false}
    initialMediaId={mediaId}
  />
</CinematicCard>
```

- [ ] **Step 10: Remove unused imports**

Remove `Card`, `Grid` (replaced by inline grid), `getCardStyles`, `Crown`, `Trophy`, `Lightbulb`, `BookOpen`, `Map` (if no longer used).

- [ ] **Step 11: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```
Expected: no errors.

- [ ] **Step 12: Commit**

```bash
cd client && git add src/app/gambles/[id]/GamblePageClient.tsx
git commit -m "feat: cinematic dark design + faction layout logic for GamblePageClient"
```

---

### Task 8: Arc page — chapter list + cinematic sections

**Files:**
- Modify: `client/src/app/arcs/[id]/page.tsx`
- Modify: `client/src/app/arcs/[id]/ArcPageClient.tsx`

**Part A — server component: add chapter data**

- [ ] **Step 1: Fetch chapters in `arcs/[id]/page.tsx`**

In `getArcData`, add a chapter fetch alongside existing fetches. The `getChapters` API supports `limit` and `sort`:

```ts
const [arcData, eventsGroupedData, gamblesData, chaptersData] = await Promise.all([
  api.getArc(arcId),
  api.getEventsGroupedByArc(),
  api.getArcGambles(arcId),
  api.getChapters({ limit: 500, sort: 'number', order: 'ASC' })
])
```

Filter the chapters to the arc's range:
```ts
const arcChapters = (chaptersData.data || []).filter(
  (c: { number: number }) => c.number >= arcData.startChapter && c.number <= arcData.endChapter
)
```

Return `arcChapters` in the result object:
```ts
return {
  arc: arcData,
  events,
  gambles,
  chapters: arcChapters
}
```

Pass it to the client component:
```tsx
return <ArcPageClient initialArc={arc} initialEvents={events} initialGambles={gambles} initialChapters={chapters} />
```

**Part B — ArcPageClient: add prop + render chapter list**

- [ ] **Step 2: Add `initialChapters` prop to ArcPageClient**

Add `Chapter` interface and update props:
```ts
interface Chapter {
  id: number
  number: number
  title: string | null
  summary: string | null
}

interface ArcPageClientProps {
  initialArc: Arc
  initialEvents: Event[]
  initialGambles: Gamble[]
  initialChapters: Chapter[]
}
```

- [ ] **Step 3: Add imports to ArcPageClient**

```tsx
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
```

- [ ] **Step 4: Replace Arc Description card**

```tsx
<CinematicCard entityColor={entityColors.arc}>
  <CinematicSectionHeader label="About This Arc" entityColor={entityColors.arc} />
  <TimelineSpoilerWrapper chapterNumber={initialArc.startChapter}>
    <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
      <EnhancedSpoilerMarkdown content={initialArc.description} className="arc-description" enableEntityEmbeds compactEntityCards={false} />
    </Box>
  </TimelineSpoilerWrapper>
</CinematicCard>
```

- [ ] **Step 5: Replace Chapter Navigation with chapter list**

Find the Chapter Navigation `Card` block (the one with Start/End buttons). Replace the entire block:

```tsx
{initialChapters.length > 0 && (
  <CinematicCard entityColor={entityColors.arc} padding="md">
    <CinematicSectionHeader label="Chapters" entityColor={entityColors.arc} />
    {(() => {
      const COLLAPSE_THRESHOLD = 6
      const PREVIEW_HEAD = 3
      const PREVIEW_TAIL = 1
      const chapters = initialChapters
      const showCollapsed = chapters.length > COLLAPSE_THRESHOLD
      const visibleChapters = showCollapsed
        ? [...chapters.slice(0, PREVIEW_HEAD), null, ...chapters.slice(-PREVIEW_TAIL)]
        : chapters
      const hiddenCount = chapters.length - PREVIEW_HEAD - PREVIEW_TAIL

      return (
        <Box>
          {visibleChapters.map((ch, idx) => {
            if (ch === null) {
              return (
                <Box key="ellipsis" style={{ padding: '6px 0', fontSize: 11, color: `${entityColors.arc}44`, borderBottom: `1px solid ${entityColors.arc}10`, fontStyle: 'italic' }}>
                  ··· {hiddenCount} more chapters
                </Box>
              )
            }
            const isFirst = ch.number === initialArc.startChapter
            const isLast = ch.number === initialArc.endChapter
            const isLastVisible = idx === visibleChapters.length - 1
            return (
              <Box
                key={ch.id}
                component={Link}
                href={`/chapters/${ch.number}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: isLastVisible ? 'none' : `1px solid ${entityColors.arc}10`, textDecoration: 'none' }}
              >
                <Text style={{ fontSize: 11, fontWeight: 700, color: entityColors.arc, minWidth: 36, flexShrink: 0 }}>
                  Ch. {ch.number}
                </Text>
                {isFirst && (
                  <Box style={{ background: `${entityColors.arc}20`, border: `1px solid ${entityColors.arc}40`, borderRadius: 3, padding: '1px 5px', fontSize: 9, color: entityColors.arc, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                    Start
                  </Box>
                )}
                {isLast && (
                  <Box style={{ background: `${entityColors.arc}20`, border: `1px solid ${entityColors.arc}40`, borderRadius: 3, padding: '1px 5px', fontSize: 9, color: entityColors.arc, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                    End
                  </Box>
                )}
                <Text style={{ fontSize: 13, color: '#aaa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ch.title || `Chapter ${ch.number}`}
                </Text>
                <Text style={{ fontSize: 12, color: `${entityColors.arc}44` }}>→</Text>
              </Box>
            )
          })}
        </Box>
      )
    })()}
  </CinematicCard>
)}
```

- [ ] **Step 6: Replace Details sidebar card**

```tsx
<CinematicCard entityColor={entityColors.arc} padding="md">
  <CinematicSectionHeader label="Details" entityColor={entityColors.arc} />
  {(initialArc.startChapter != null && initialArc.endChapter != null) && (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.arc}14` }}>
      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.arc, flexShrink: 0 }} />
      <Text style={{ fontSize: 11, color: `${entityColors.arc}66`, flex: 1 }}>Chapters</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>Ch. {initialArc.startChapter}–{initialArc.endChapter}</Text>
    </Box>
  )}
  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.arc}14` }}>
    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.arc, flexShrink: 0 }} />
    <Text style={{ fontSize: 11, color: `${entityColors.arc}66`, flex: 1 }}>Gambles</Text>
    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>{initialGambles.length}</Text>
  </Box>
  {initialArc.children && initialArc.children.length > 0 && (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.arc, flexShrink: 0 }} />
      <Text style={{ fontSize: 11, color: `${entityColors.arc}66`, flex: 1 }}>Sub-arcs</Text>
      <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.arc }}>{initialArc.children.length}</Text>
    </Box>
  )}
</CinematicCard>
```

- [ ] **Step 7: Remove Card wrappers around compact RelatedContentSections**

Find the Gambles and Sub-arcs compact sections in the sidebar. Remove any `<Card withBorder ...>` wrapper around them.

- [ ] **Step 8: Replace media tab card**

Use the same pattern as CharacterPageClient media tab but with `ownerType="arc"` and `ownerId={initialArc.id}`.

- [ ] **Step 9: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
cd client && git add src/app/arcs/[id]/page.tsx src/app/arcs/[id]/ArcPageClient.tsx
git commit -m "feat: cinematic dark design + chapter navigation list for ArcPageClient"
```

---

### Task 9: Update `ChapterPageClient.tsx`

**Files:**
- Modify: `client/src/app/chapters/[id]/ChapterPageClient.tsx`

Changes: cinematic treatment for Chapter Summary, Featured Characters, Details card, sidebar compact sections, media tab. Read the file first to locate exact section structure, then apply the same `CinematicCard` + `CinematicSectionHeader` + 5px-dot Details card pattern.

- [ ] **Step 1: Read the current file**

```bash
cat client/src/app/chapters/[id]/ChapterPageClient.tsx
```

- [ ] **Step 2: Add imports**

```tsx
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
```

- [ ] **Step 3: Replace Chapter Summary card**

```tsx
<CinematicCard entityColor={entityColors.chapter}>
  <CinematicSectionHeader label="Chapter Summary" entityColor={entityColors.chapter} />
  {/* existing content */}
</CinematicCard>
```

- [ ] **Step 4: Replace Featured Characters card**

The chip-style grid layout inside stays unchanged. Only apply cinematic wrapper:
```tsx
{featuredCharacters.length > 0 && (
  <CinematicCard entityColor={entityColors.character}>
    <CinematicSectionHeader label="Featured Characters" entityColor={entityColors.character} />
    {/* existing chip grid */}
  </CinematicCard>
)}
```

- [ ] **Step 5: Replace Details sidebar card**

Use the cinematic + 5px dot pattern. Rows: Chapter #, Volume link (→ volume `#8b5cf6`), Arc link (→ arc `#ff6b35`), Events count.

```tsx
<CinematicCard entityColor={entityColors.chapter} padding="md">
  <CinematicSectionHeader label="Details" entityColor={entityColors.chapter} />
  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.chapter}14` }}>
    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.chapter, flexShrink: 0 }} />
    <Text style={{ fontSize: 11, color: `${entityColors.chapter}66`, flex: 1 }}>Chapter</Text>
    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.chapter }}>#{chapter.number}</Text>
  </Box>
  {/* Volume link row — value uses volume color */}
  {chapter.volume && (
    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.chapter}14` }}>
      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.chapter, flexShrink: 0 }} />
      <Text style={{ fontSize: 11, color: `${entityColors.chapter}66`, flex: 1 }}>Volume</Text>
      <Text component={Link} href={`/volumes/${chapter.volume.id}`} style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume, textDecoration: 'none' }}>Vol. {chapter.volume.number}</Text>
    </Box>
  )}
  {/* Arc link row */}
  {/* Events count row */}
  {/* ... adapt from existing data available in the component */}
</CinematicCard>
```

Note: Verify the exact prop names used in ChapterPageClient (e.g., `chapter.volume`, `chapter.arc`) by reading the file.

- [ ] **Step 6: Remove Card wrappers from compact RelatedContentSections**

Remove outer `<Card withBorder ...>` from Events and Quotes sidebar sections.

- [ ] **Step 7: Replace media tab card**

Same pattern as other pages with `ownerType="chapter"`.

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd client && yarn tsc --noEmit
```

- [ ] **Step 9: Commit**

```bash
cd client && git add src/app/chapters/[id]/ChapterPageClient.tsx
git commit -m "feat: cinematic dark design for ChapterPageClient"
```

---

### Task 10: Update `OrganizationPageClient.tsx`

**Files:**
- Modify: `client/src/app/organizations/[id]/OrganizationPageClient.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat client/src/app/organizations/[id]/OrganizationPageClient.tsx
```

- [ ] **Step 2: Add imports and apply same pattern**

```tsx
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
```

- [ ] **Step 3: Replace Organization Overview card**

```tsx
<CinematicCard entityColor={entityColors.organization}>
  <CinematicSectionHeader label="Organization Overview" entityColor={entityColors.organization} />
  {/* existing content */}
</CinematicCard>
```

- [ ] **Step 4: Replace Details sidebar card**

Rows: Members count (value → character color), Gambles count (value → gamble color).
```tsx
<CinematicCard entityColor={entityColors.organization} padding="md">
  <CinematicSectionHeader label="Details" entityColor={entityColors.organization} />
  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.organization}14` }}>
    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.organization, flexShrink: 0 }} />
    <Text style={{ fontSize: 11, color: `${entityColors.organization}66`, flex: 1 }}>Members</Text>
    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.character }}>{members.length}</Text>
  </Box>
  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.organization, flexShrink: 0 }} />
    <Text style={{ fontSize: 11, color: `${entityColors.organization}66`, flex: 1 }}>Gambles</Text>
    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.gamble }}>{gambles.length}</Text>
  </Box>
</CinematicCard>
```

Note: verify exact variable names (`members`, `gambles`) by reading the file.

- [ ] **Step 5: Remove Card wrappers from compact RelatedContentSections**

- [ ] **Step 6: Verify TypeScript compiles + commit**

```bash
cd client && yarn tsc --noEmit
git add src/app/organizations/[id]/OrganizationPageClient.tsx
git commit -m "feat: cinematic dark design for OrganizationPageClient"
```

---

### Task 11: Update `EventPageClient.tsx`

**Files:**
- Modify: `client/src/app/events/[id]/EventPageClient.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat client/src/app/events/[id]/EventPageClient.tsx
```

- [ ] **Step 2: Add imports and apply cinematic pattern**

```tsx
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
```

- [ ] **Step 3: Replace Description card**

```tsx
<CinematicCard entityColor={entityColors.event}>
  <CinematicSectionHeader label="Description" entityColor={entityColors.event} />
  {/* existing content */}
</CinematicCard>
```

- [ ] **Step 4: Replace Related Gamble card**

Per spec, keep the inner Paper treatment for Rules + Win Condition sub-content. Only apply cinematic card to the outer wrapper:
```tsx
{event.gamble && (
  <CinematicCard entityColor={entityColors.gamble}>
    <CinematicSectionHeader label="Related Gamble" entityColor={entityColors.gamble} />
    {/* existing inner Paper with Rules + Win Condition — keep unchanged */}
  </CinematicCard>
)}
```

- [ ] **Step 5: Replace Details sidebar card**

Rows: Chapter, Arc link (→ arc color), Type, Status, Edit button (conditional).
```tsx
<CinematicCard entityColor={entityColors.event} padding="md">
  <CinematicSectionHeader label="Details" entityColor={entityColors.event} />
  {/* rows using 5px dot pattern, value colors per spec */}
</CinematicCard>
```

- [ ] **Step 6: Featured Characters chip section**

Per spec: apply cinematic card wrapper only, do not change chip internals:
```tsx
{event.characters && event.characters.length > 0 && (
  <CinematicCard entityColor={entityColors.character} padding="md">
    <CinematicSectionHeader label="Featured Characters" entityColor={entityColors.character} />
    {/* existing chip grid — unchanged */}
  </CinematicCard>
)}
```

- [ ] **Step 7: Tags and Gambles-in-Arc chip sections**

Same pattern — cinematic wrapper only, chip internals unchanged:
```tsx
{event.tags && event.tags.length > 0 && (
  <CinematicCard entityColor={entityColors.event} padding="md">
    <CinematicSectionHeader label="Tags" entityColor={entityColors.event} />
    {/* existing badge chip group — unchanged */}
  </CinematicCard>
)}
```

- [ ] **Step 8: Remove Card wrappers from compact RelatedContentSections (if any)**

- [ ] **Step 9: Verify TypeScript compiles + commit**

```bash
cd client && yarn tsc --noEmit
git add src/app/events/[id]/EventPageClient.tsx
git commit -m "feat: cinematic dark design for EventPageClient"
```

---

### Task 12: Update `VolumePageClient.tsx` — cinematic sections + chapter navigation list

**Files:**
- Modify: `client/src/app/volumes/[id]/VolumePageClient.tsx`

Volume already has `initialChapters: Chapter[]` passed in — no server component changes needed.

- [ ] **Step 1: Add imports**

```tsx
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
```

- [ ] **Step 2: Replace Volume Summary card**

Read the current file to find the exact card. Replace with:
```tsx
<CinematicCard entityColor={entityColors.volume}>
  <CinematicSectionHeader label="Volume Summary" entityColor={entityColors.volume} />
  {/* existing content */}
</CinematicCard>
```

- [ ] **Step 3: Replace Chapter Navigation with chapter list**

Same collapse logic as the Arc page. Use `entityColors.volume` for the card and `entityColors.chapter` for the chapter number row accents:

```tsx
{initialChapters.length > 0 && (
  <CinematicCard entityColor={entityColors.volume} padding="md">
    <CinematicSectionHeader label="Chapters" entityColor={entityColors.volume} />
    {(() => {
      const COLLAPSE_THRESHOLD = 6
      const PREVIEW_HEAD = 3
      const PREVIEW_TAIL = 1
      const chapters = initialChapters
      const showCollapsed = chapters.length > COLLAPSE_THRESHOLD
      const visibleChapters = showCollapsed
        ? [...chapters.slice(0, PREVIEW_HEAD), null, ...chapters.slice(-PREVIEW_TAIL)]
        : chapters
      const hiddenCount = chapters.length - PREVIEW_HEAD - PREVIEW_TAIL

      return (
        <Box>
          {visibleChapters.map((ch, idx) => {
            if (ch === null) {
              return (
                <Box key="ellipsis" style={{ padding: '6px 0', fontSize: 11, color: `${entityColors.volume}44`, borderBottom: `1px solid ${entityColors.volume}10`, fontStyle: 'italic' }}>
                  ··· {hiddenCount} more chapters
                </Box>
              )
            }
            const isFirst = ch.number === initialVolume.startChapter
            const isLast = ch.number === initialVolume.endChapter
            const isLastVisible = idx === visibleChapters.length - 1
            return (
              <Box
                key={ch.id}
                component={Link}
                href={`/chapters/${ch.number}`}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: isLastVisible ? 'none' : `1px solid ${entityColors.volume}10`, textDecoration: 'none' }}
              >
                <Text style={{ fontSize: 11, fontWeight: 700, color: entityColors.chapter, minWidth: 36, flexShrink: 0 }}>
                  Ch. {ch.number}
                </Text>
                {isFirst && (
                  <Box style={{ background: `${entityColors.volume}20`, border: `1px solid ${entityColors.volume}40`, borderRadius: 3, padding: '1px 5px', fontSize: 9, color: entityColors.volume, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                    Start
                  </Box>
                )}
                {isLast && (
                  <Box style={{ background: `${entityColors.volume}20`, border: `1px solid ${entityColors.volume}40`, borderRadius: 3, padding: '1px 5px', fontSize: 9, color: entityColors.volume, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                    End
                  </Box>
                )}
                <Text style={{ fontSize: 13, color: '#aaa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ch.title || `Chapter ${ch.number}`}
                </Text>
                <Text style={{ fontSize: 12, color: `${entityColors.volume}44` }}>→</Text>
              </Box>
            )
          })}
        </Box>
      )
    })()}
  </CinematicCard>
)}
```

- [ ] **Step 4: Replace Details sidebar card**

Rows: Chapter Range, Chapter Count, Arc Count.
```tsx
<CinematicCard entityColor={entityColors.volume} padding="md">
  <CinematicSectionHeader label="Details" entityColor={entityColors.volume} />
  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.volume}14` }}>
    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.volume, flexShrink: 0 }} />
    <Text style={{ fontSize: 11, color: `${entityColors.volume}66`, flex: 1 }}>Chapter Range</Text>
    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>Ch. {initialVolume.startChapter}–{initialVolume.endChapter}</Text>
  </Box>
  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${entityColors.volume}14` }}>
    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.volume, flexShrink: 0 }} />
    <Text style={{ fontSize: 11, color: `${entityColors.volume}66`, flex: 1 }}>Chapters</Text>
    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>{initialChapters.length}</Text>
  </Box>
  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: entityColors.volume, flexShrink: 0 }} />
    <Text style={{ fontSize: 11, color: `${entityColors.volume}66`, flex: 1 }}>Arcs</Text>
    <Text style={{ fontSize: 12, fontWeight: 700, color: entityColors.volume }}>{initialArcs.length}</Text>
  </Box>
</CinematicCard>
```

- [ ] **Step 5: Remove Card wrappers from compact RelatedContentSections**

- [ ] **Step 6: Verify TypeScript compiles + commit**

```bash
cd client && yarn tsc --noEmit
git add src/app/volumes/[id]/VolumePageClient.tsx
git commit -m "feat: cinematic dark design + chapter navigation list for VolumePageClient"
```

---

## Post-Implementation Verification

- [ ] **Full TypeScript build**

```bash
cd client && yarn build
```
Expected: build completes with no type errors. (ESLint errors may appear as warnings but build should succeed.)

- [ ] **Lint**

```bash
cd client && yarn lint
```
Fix any lint errors before marking complete.

- [ ] **Visual sanity-check (manual)**

Navigate to each entity page locally and verify:
- Section cards have cinematic gradient backgrounds with entity-colored borders
- 1px top accent line visible
- Pill badge headers (no icon boxes, no horizontal dividers)
- Details card: 5px dots, muted key labels, entity-colored values
- Sidebar compact lists have own cinematic card (no double-wrapping)
- Gamble page: VS layout for 2 main sides, grid for 3+, third parties below
- Arc/Volume: chapter list with Start/End badges, collapse for long lists
- Annotations tab: fuchsia cinematic card, left 2px accent, pill header
- Media tab: media-pink cinematic wrapper

---

## Notes

- The Arc page chapter fetch (`limit: 500`) fetches all chapters up to 500 to filter by range. This works for current manga scale. A dedicated `/arcs/:id/chapters` backend endpoint would be cleaner for large-scale use.
- `CinematicCard` does not add `'use client'` — it has no hooks and works in both server and client component trees.
- `RelatedContentSection` compact variant after this change no longer needs a `Card` wrapper from the calling page. Calling pages that still have `<Card withBorder>` around compact `RelatedContentSection` will produce double-wrapping — audit and remove those wrappers in each page task.
- `AnnotationCard` and `AnnotationSection` changes propagate automatically to all 7 entity pages that render the Annotations tab.
