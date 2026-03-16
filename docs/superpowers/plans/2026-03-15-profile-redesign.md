# Profile Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `/profile` page with a dossier/case-file aesthetic, add activity feed + richer favorites + arc milestone progress, and split the 1,890-line monolith into 7 focused subcomponents.

**Architecture:** The existing `ProfilePageClient.tsx` is hollowed out into a thin orchestrator (~250 lines) that fetches all data and passes it as props to subcomponents. Each subcomponent owns exactly one section of the page. `CharacterFavoritesManager` is the only exception — it stays self-contained.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI (`@mantine/core`), Lucide React icons, `motion/react`, Tailwind CSS 4. Verification via `yarn build` + `yarn lint` (no frontend test framework exists).

**Spec:** `docs/superpowers/specs/2026-03-15-profile-redesign-design.md`

---

## Chunk 1: Foundation

### Task 1: Add arc milestone constants and fix AuthProvider type

**Files:**
- Modify: `client/src/lib/constants.ts`
- Modify: `client/src/providers/AuthProvider.tsx`

- [ ] **Step 1: Add `PROFILE_ARC_MILESTONES` to constants**

  Open `client/src/lib/constants.ts` and append after the existing `MAX_CHAPTER` export:

  ```typescript
  export interface ArcMilestone {
    name: string
    startChapter: number
  }

  // Usogui manga arc boundaries — verify against actual chapter ranges
  export const PROFILE_ARC_MILESTONES: ArcMilestone[] = [
    { name: 'Babel', startChapter: 1 },
    { name: 'Face Poker', startChapter: 18 },
    { name: 'Old Maid', startChapter: 48 },
    { name: "Liar's Dice", startChapter: 88 },
    { name: 'Chess', startChapter: 140 },
    { name: "Blind Man's Bluff", startChapter: 195 },
    { name: 'Mahjong', startChapter: 270 },
    { name: 'Final', startChapter: 360 },
  ]
  ```

- [ ] **Step 2: Export User interface and add `updatedAt` in AuthProvider**

  Open `client/src/providers/AuthProvider.tsx`. Find the `User` interface (the one defined in this file, not from `types/index.ts`). Add `export` and `updatedAt?: string`:

  ```typescript
  export interface User {
    // ... existing fields ...
    updatedAt?: string   // add this line
  }
  ```

  The `export` is required because `ProfileHeader` imports this type directly.

- [ ] **Step 3: Verify compilation**

  ```bash
  cd client && yarn build
  ```

  Expected: build succeeds with no type errors on these files.

- [ ] **Step 4: Commit**

  ```bash
  git add client/src/lib/constants.ts client/src/providers/AuthProvider.tsx
  git commit -m "feat: add arc milestone constants and updatedAt to AuthProvider User"
  ```

---

## Chunk 2: ProfileHeader

### Task 2: Create ProfileHeader component

**Files:**
- Create: `client/src/app/profile/ProfileHeader.tsx`

This component renders the full-width cinematic header card: gradient background, avatar (with edit badge), editable username, role/badges row, ghosted dossier metadata, and the stat strip.

Username editing state lives here (it's local UI state). The save action and profile picture selector open action are injected as props so API calls stay in the orchestrator.

- [ ] **Step 1: Create the file with types and scaffold**

  Create `client/src/app/profile/ProfileHeader.tsx`:

  ```typescript
  'use client'

  import React, { useState } from 'react'
  import {
    Box,
    Group,
    Stack,
    Text,
    Title,
    ActionIcon,
    TextInput,
  } from '@mantine/core'
  import { notifications } from '@mantine/notifications'
  import { Edit, Check, X, Settings } from 'lucide-react'
  import { outlineStyles } from '../../lib/mantine-theme'
  import UserProfileImage from '../../components/UserProfileImage'
  import UserBadges from '../../components/UserBadges'
  import { UserRoleDisplay } from '../../components/BadgeDisplay'
  import { MAX_CHAPTER } from '../../lib/constants'
  import type { User } from '../../providers/AuthProvider'

  interface ProfileStats {
    guides: number
    media: number
    annotations: number
  }

  interface ProfileHeaderProps {
    user: User
    stats: ProfileStats
    onOpenProfilePictureSelector: () => void
    onSaveUsername: (username: string) => Promise<void>
    onOpenSettings: () => void
  }

  export default function ProfileHeader({
    user,
    stats,
    onOpenProfilePictureSelector,
    onSaveUsername,
    onOpenSettings,
  }: ProfileHeaderProps) {
    const [editingUsername, setEditingUsername] = useState(false)
    const [usernameInput, setUsernameInput] = useState('')
    const [savingUsername, setSavingUsername] = useState(false)

    const readPercent = Math.min(
      Math.round(((user?.userProgress ?? 0) / MAX_CHAPTER) * 100),
      100
    )
    const caseRef = String(user?.id ?? 0).padStart(4, '0')
    const memberSince = user?.createdAt
      ? new Date(user.createdAt).toISOString().split('T')[0]
      : '—'

    const handleSaveUsername = async () => {
      const trimmed = usernameInput.trim()
      if (!trimmed || trimmed === user?.username) {
        setEditingUsername(false)
        return
      }
      if (trimmed.length < 3 || trimmed.length > 30) {
        notifications.show({ title: 'Invalid username', message: 'Username must be 3–30 characters', color: 'red' })
        return
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        notifications.show({ title: 'Invalid username', message: 'Letters, numbers, underscores, hyphens only', color: 'red' })
        return
      }
      setSavingUsername(true)
      try {
        await onSaveUsername(trimmed)
        setEditingUsername(false)
      } catch {
        // error notification handled by orchestrator
      } finally {
        setSavingUsername(false)
      }
    }

    return (
      <Box
        style={{
          background: `linear-gradient(180deg, #100508 0%, #0a0a0a 100%)`,
          borderBottom: '1px solid #1a1a1a',
          padding: '20px 24px 0',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <Box
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #e11d48 0%, rgba(124,58,237,0.5) 55%, transparent 100%)',
          }}
        />

        {/* Ghost micro-label */}
        <Text style={{ fontSize: '7px', letterSpacing: '0.2em', color: '#1e1e1e', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'monospace' }}>
          usogui database · classified
        </Text>

        {/* Main header row */}
        <Group justify="space-between" align="flex-end" gap="lg" wrap="wrap">
          <Group align="flex-end" gap="lg">
            {/* Avatar */}
            <Box
              style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
              onClick={onOpenProfilePictureSelector}
            >
              <UserProfileImage user={user} size={72} style={{ borderRadius: '4px', border: '1px solid #2a2a2a', boxShadow: '0 0 0 2px rgba(225,29,72,0.15)' }} />
              <Box
                style={{
                  position: 'absolute', bottom: '-4px', right: '-4px',
                  width: '20px', height: '20px',
                  background: outlineStyles.accentColor,
                  borderRadius: '50%',
                  border: '2px solid #0a0a0a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Edit size={10} color="white" />
              </Box>
            </Box>

            {/* Name + role */}
            <Stack gap={4} style={{ paddingBottom: '4px' }}>
              {editingUsername ? (
                <Group gap="xs">
                  <TextInput
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.currentTarget.value)}
                    size="md"
                    styles={{ input: { fontWeight: 900, fontSize: '1.6rem', fontFamily: 'var(--font-opti-goudy-text)' } }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveUsername()
                      if (e.key === 'Escape') setEditingUsername(false)
                    }}
                    disabled={savingUsername}
                    autoFocus
                  />
                  <ActionIcon variant="subtle" color="green" onClick={handleSaveUsername} loading={savingUsername} aria-label="Save username">
                    <Check size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="gray" onClick={() => setEditingUsername(false)} disabled={savingUsername} aria-label="Cancel">
                    <X size={16} />
                  </ActionIcon>
                </Group>
              ) : (
                <Group gap="xs" align="center">
                  <Title
                    order={1}
                    style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: '2rem', fontWeight: 900, letterSpacing: '0.01em', lineHeight: 1, color: '#f5f5f5' }}
                  >
                    {user?.username}
                  </Title>
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    onClick={() => { setUsernameInput(user?.username || ''); setEditingUsername(true) }}
                    aria-label="Edit username"
                    style={{ color: '#222', border: '1px solid #1a1a1a', marginTop: '4px' }}
                  >
                    <Edit size={10} />
                  </ActionIcon>
                </Group>
              )}
              <Group gap="xs" wrap="wrap">
                <UserRoleDisplay
                  userRole={user?.role as 'admin' | 'moderator' | 'user'}
                  customRole={user?.customRole || null}
                  size="medium"
                  spacing={2}
                />
                <UserBadges userId={user?.id} />
              </Group>
            </Stack>
          </Group>

          {/* Dossier metadata — ghosted */}
          <Stack gap={2} style={{ textAlign: 'right', paddingBottom: '6px' }}>
            <Text style={{ fontSize: '7px', color: '#1e1e1e', letterSpacing: '0.12em', fontFamily: 'monospace', lineHeight: 1.9 }}>
              #{caseRef}<br />
              active<br />
              {memberSince}
            </Text>
          </Stack>
        </Group>

        {/* Stat strip */}
        <Group gap={0} style={{ marginTop: '16px', borderTop: '1px solid #1a1a1a' }}>
          {[
            { value: stats.guides, label: 'Guides', accent: true },
            { value: stats.media, label: 'Media', accent: false },
            { value: stats.annotations, label: 'Annotations', accent: false },
            { value: `${readPercent}%`, label: 'Read', accent: false },
          ].map((stat, i, arr) => (
            <Box
              key={stat.label}
              style={{
                padding: '8px 16px 8px',
                borderRight: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none',
                paddingLeft: i === 0 ? 0 : '16px',
              }}
            >
              <Text style={{ fontSize: '15px', fontWeight: 800, color: stat.accent ? '#e11d48' : '#aaa', lineHeight: 1, marginBottom: '1px', display: 'block' }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: '10px', color: '#555' }}>{stat.label}</Text>
            </Box>
          ))}
          <Box style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <ActionIcon variant="subtle" onClick={onOpenSettings} aria-label="Settings" style={{ color: '#333' }}>
              <Settings size={16} />
            </ActionIcon>
          </Box>
        </Group>
      </Box>
    )
  }
  ```

- [ ] **Step 2: Run build to verify types**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error|Error|warning" | head -30
  ```

  Expected: no TypeScript errors in `ProfileHeader.tsx`.

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/app/profile/ProfileHeader.tsx
  git commit -m "feat: add ProfileHeader component with cinematic dossier design"
  ```

---

## Chunk 3: ProfileProgressReport and ProfileIntelPanel

### Task 3: Create ProfileProgressReport

**Files:**
- Create: `client/src/app/profile/ProfileProgressReport.tsx`

Renders the reading progress bar with gradient fill and arc milestone tick marks.

- [ ] **Step 1: Create the file**

  Create `client/src/app/profile/ProfileProgressReport.tsx`:

  ```typescript
  'use client'

  import React from 'react'
  import { Box, Text, Group } from '@mantine/core'
  import { MAX_CHAPTER, PROFILE_ARC_MILESTONES } from '../../lib/constants'

  interface ProfileProgressReportProps {
    userProgress: number
  }

  export default function ProfileProgressReport({ userProgress }: ProfileProgressReportProps) {
    const readPercent = Math.min(Math.round((userProgress / MAX_CHAPTER) * 100), 100)
    const youPercent = Math.min((userProgress / MAX_CHAPTER) * 100, 100)

    return (
      <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
        <Group gap={6} align="baseline" mb={14}>
          <Text style={{ fontSize: '11px', fontWeight: 600, color: '#d4d4d4', letterSpacing: '0.04em' }}>Reading Progress</Text>
          <Text style={{ fontSize: '6px', color: '#1e1e1e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>· chapter log</Text>
        </Group>

        <Group justify="space-between" mb={8}>
          <Text style={{ fontSize: '9px', color: '#555' }}>
            Chapter <span style={{ color: '#e5e5e5', fontWeight: 700 }}>{userProgress}</span> of {MAX_CHAPTER}
          </Text>
          <Text style={{ fontSize: '9px', color: '#e11d48', fontWeight: 700 }}>{readPercent}%</Text>
        </Group>

        {/* Progress bar + milestone ticks */}
        <Box style={{ position: 'relative', marginBottom: '24px' }}>
          {/* Track */}
          <Box style={{ height: '4px', background: '#111', borderRadius: '2px', overflow: 'visible', position: 'relative' }}>
            {/* Fill */}
            <Box
              style={{
                width: `${readPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #e11d48, #7c3aed)',
                borderRadius: '2px',
              }}
            />
          </Box>

          {/* Milestone ticks (rendered outside the track for overflow) */}
          {PROFILE_ARC_MILESTONES.map((arc, i) => {
            const pct = (arc.startChapter / MAX_CHAPTER) * 100
            // Current arc: user has passed this arc's start but not yet the next arc's start
            const nextArc = PROFILE_ARC_MILESTONES[i + 1]
            const isCurrentArc = userProgress >= arc.startChapter &&
              (!nextArc || userProgress < nextArc.startChapter)

            // Suppress this label if the NEXT milestone is too close (< 5% gap ahead)
            // — spec says omit the earlier label when two are too close, keeping the later one
            const next = PROFILE_ARC_MILESTONES[i + 1]
            const nextPct = next ? (next.startChapter / MAX_CHAPTER) * 100 : 999
            const showLabel = (nextPct - pct) >= 5

            const labelColor = isCurrentArc ? '#333' : '#1e1e1e'

            return (
              <Box
                key={arc.name}
                style={{ position: 'absolute', left: `${pct}%`, top: '-9px', transform: 'translateX(-50%)' }}
              >
                <Box style={{ width: '1px', height: '22px', background: userProgress >= arc.startChapter ? '#222' : '#1a1a1a', margin: '0 auto' }} />
                {showLabel && (
                  <Text style={{ fontSize: '6px', color: labelColor, whiteSpace: 'nowrap', marginTop: '2px', transform: 'translateX(-50%)', position: 'absolute', left: '50%' }}>
                    {arc.name}
                  </Text>
                )}
              </Box>
            )
          })}

          {/* "you" marker */}
          <Box style={{ position: 'absolute', left: `${youPercent}%`, top: '-9px', transform: 'translateX(-50%)' }}>
            <Box style={{ width: '1px', height: '22px', background: 'rgba(225,29,72,0.4)', margin: '0 auto' }} />
            <Text style={{ fontSize: '6px', color: 'rgba(225,29,72,0.6)', whiteSpace: 'nowrap', marginTop: '2px', transform: 'translateX(-50%)', position: 'absolute', left: '50%' }}>
              you
            </Text>
          </Box>
        </Box>
      </Box>
    )
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error TS" | head -20
  ```

  Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/app/profile/ProfileProgressReport.tsx
  git commit -m "feat: add ProfileProgressReport with arc milestone markers"
  ```

---

### Task 4: Create ProfileIntelPanel

**Files:**
- Create: `client/src/app/profile/ProfileIntelPanel.tsx`

Renders the Favorites section: `CharacterFavoritesManager` (self-contained), quote card, gamble row.

- [ ] **Step 1: Create the file**

  Create `client/src/app/profile/ProfileIntelPanel.tsx`:

  ```typescript
  'use client'

  import React from 'react'
  import { Box, Text, Group } from '@mantine/core'
  import CharacterFavoritesManager from '../../components/CharacterFavoritesManager'

  interface ProfileIntelPanelProps {
    quotes: any[]
    gambles: any[]
    favoriteQuoteId: string   // stringified number or ''
    favoriteGambleId: string  // stringified number or ''
    loading: boolean
    onOpenQuoteModal: () => void
    onOpenGambleModal: () => void
  }

  export default function ProfileIntelPanel({
    quotes,
    gambles,
    favoriteQuoteId,
    favoriteGambleId,
    loading,
    onOpenQuoteModal,
    onOpenGambleModal,
  }: ProfileIntelPanelProps) {
    const selectedQuote = favoriteQuoteId
      ? quotes.find(q => q.id === parseInt(favoriteQuoteId))
      : null

    const selectedGamble = favoriteGambleId
      ? gambles.find(g => g.id === parseInt(favoriteGambleId))
      : null

    const gambleRange =
      selectedGamble && selectedGamble.endChapter != null
        ? `Ch.${selectedGamble.startChapter}–${selectedGamble.endChapter}`
        : selectedGamble?.startChapter
        ? `Ch.${selectedGamble.startChapter}+`
        : null

    return (
      <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
        <Group gap={6} align="baseline" mb={10}>
          <Text style={{ fontSize: '11px', fontWeight: 600, color: '#d4d4d4', letterSpacing: '0.04em' }}>Favorites</Text>
          <Text style={{ fontSize: '6px', color: '#1e1e1e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>· intel</Text>
        </Group>

        {/* Characters — delegated to CharacterFavoritesManager */}
        <Text style={{ fontSize: '7px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Characters</Text>
        <Box mb={12}>
          <CharacterFavoritesManager />
        </Box>

        {/* Quote */}
        <Text style={{ fontSize: '7px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Quote</Text>
        {loading ? (
          <Box style={{ height: '48px', background: '#0f0f0f', borderRadius: '3px', marginBottom: '12px' }} />
        ) : selectedQuote ? (
          <Box
            onClick={onOpenQuoteModal}
            style={{
              borderLeft: '2px solid #7c3aed',
              padding: '8px 8px 8px 10px',
              background: '#0a0a0a',
              borderRadius: '0 3px 3px 0',
              marginBottom: '12px',
              cursor: 'pointer',
            }}
          >
            <Text style={{ fontSize: '10px', color: '#ccc', fontStyle: 'italic', lineHeight: 1.6, fontFamily: 'var(--font-opti-goudy-text)' }}>
              &ldquo;{selectedQuote.text?.length > 120 ? selectedQuote.text.substring(0, 120) + '...' : selectedQuote.text}&rdquo;
            </Text>
            {selectedQuote.character?.name && (
              <Text style={{ fontSize: '7px', color: '#2d2d2d', marginTop: '4px' }}>
                — {selectedQuote.character.name}{selectedQuote.chapter ? ` · Ch. ${selectedQuote.chapter}` : ''}
              </Text>
            )}
          </Box>
        ) : (
          <Box
            onClick={onOpenQuoteModal}
            style={{
              border: '1px dashed #1e1e1e', borderRadius: '3px', padding: '10px',
              marginBottom: '12px', cursor: 'pointer', textAlign: 'center',
            }}
          >
            <Text size="xs" c="dimmed">Select a favorite quote</Text>
          </Box>
        )}

        {/* Gamble */}
        <Text style={{ fontSize: '7px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Gamble</Text>
        <Box
          onClick={onOpenGambleModal}
          style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '3px',
            padding: '8px', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer',
          }}
        >
          <Box style={{ width: '6px', height: '6px', background: '#e11d48', borderRadius: '50%', flexShrink: 0 }} />
          <Text style={{ fontSize: '10px', color: selectedGamble ? '#ccc' : '#555', flex: 1 }}>
            {selectedGamble ? selectedGamble.name : 'Select a favorite gamble'}
          </Text>
          {gambleRange && (
            <Text style={{ fontSize: '7px', color: '#1e1e1e' }}>{gambleRange}</Text>
          )}
        </Box>
      </Box>
    )
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error TS" | head -20
  ```

  Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/app/profile/ProfileIntelPanel.tsx
  git commit -m "feat: add ProfileIntelPanel with character/quote/gamble favorites"
  ```

---

## Chunk 4: ProfileFieldLog

### Task 5: Create ProfileFieldLog (activity feed)

**Files:**
- Create: `client/src/app/profile/ProfileFieldLog.tsx`

Constructs a unified timeline from guides, submissions, and user progress. Renders the 5 most recent events.

- [ ] **Step 1: Create the file**

  Create `client/src/app/profile/ProfileFieldLog.tsx`:

  ```typescript
  'use client'

  import React, { useMemo } from 'react'
  import { Box, Text, Group } from '@mantine/core'

  type EventType = 'guide' | 'media' | 'annotation' | 'event' | 'progress'

  interface FeedEvent {
    type: EventType
    title: string
    detail: string
    date: Date
  }

  const TYPE_STYLES: Record<EventType, { bg: string; color: string; label: string }> = {
    guide:      { bg: 'rgba(34,197,94,0.08)',   color: '#3a7a4a', label: 'guide' },
    media:      { bg: 'rgba(59,130,246,0.08)',  color: '#3a4a6a', label: 'media' },
    annotation: { bg: 'rgba(124,58,237,0.08)',  color: '#5a4a7a', label: 'annotation' },
    event:      { bg: 'rgba(245,158,11,0.08)',  color: '#7a6020', label: 'event' },
    progress:   { bg: 'rgba(249,115,22,0.08)',  color: '#7a5030', label: 'progress' },
  }

  function timeAgo(date: Date): string {
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d`
    return `${Math.floor(days / 7)}w`
  }

  interface UserGuide {
    id: number
    title: string
    status: string
    createdAt: string
    updatedAt: string
  }

  interface SubmissionItem {
    id: number | string
    type: string
    title?: string
    status: string
    createdAt: string
  }

  interface FieldLogUser {
    userProgress?: number
    updatedAt?: string
  }

  interface ProfileFieldLogProps {
    guides: UserGuide[]
    submissions: SubmissionItem[]
    user: FieldLogUser
  }

  export default function ProfileFieldLog({ guides, submissions, user }: ProfileFieldLogProps) {
    const events = useMemo<FeedEvent[]>(() => {
      const items: FeedEvent[] = []

      // Guides — use updatedAt so status changes surface correctly
      for (const guide of guides) {
        const actionMap: Record<string, string> = {
          pending: 'Guide submitted',
          approved: 'Guide approved',
          rejected: 'Guide rejected',
        }
        items.push({
          type: 'guide',
          title: actionMap[guide.status] ?? 'Guide updated',
          detail: guide.title,
          date: new Date(guide.updatedAt || guide.createdAt),
        })
      }

      // Submissions (media, events, annotations)
      for (const sub of submissions) {
        const type = sub.type as EventType
        if (!TYPE_STYLES[type]) continue

        const titleMap: Record<string, Record<string, string>> = {
          media:      { pending: 'Media submitted', approved: 'Media approved', rejected: 'Media rejected' },
          event:      { pending: 'Event submitted', approved: 'Event approved', rejected: 'Event rejected' },
          annotation: { pending: 'Annotation added', approved: 'Annotation approved', rejected: 'Annotation rejected' },
        }
        items.push({
          type,
          title: titleMap[type]?.[sub.status] ?? `${type} updated`,
          detail: sub.title ?? '',
          date: new Date(sub.createdAt),
        })
      }

      // Reading progress — single entry if progress > 0
      if (user?.userProgress && user.userProgress > 0 && user.updatedAt) {
        items.push({
          type: 'progress',
          title: 'Reading progress',
          detail: `Chapter ${user.userProgress} reached`,
          date: new Date(user.updatedAt),
        })
      }

      // Sort descending, cap at 5
      return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)
    }, [guides, submissions, user])

    return (
      <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
        <Group gap={6} align="baseline" mb={10}>
          <Text style={{ fontSize: '11px', fontWeight: 600, color: '#d4d4d4', letterSpacing: '0.04em' }}>Activity</Text>
          <Text style={{ fontSize: '6px', color: '#1e1e1e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>· field log</Text>
        </Group>

        {events.length === 0 ? (
          <Text style={{ fontSize: '9px', color: '#333', fontStyle: 'italic' }}>No activity yet.</Text>
        ) : (
          <Box>
            {events.map((ev, i) => {
              const style = TYPE_STYLES[ev.type]
              return (
                <Group
                  key={i}
                  gap={10}
                  align="flex-start"
                  style={{
                    padding: '7px 0',
                    borderBottom: i < events.length - 1 ? '1px solid #0f0f0f' : 'none',
                  }}
                >
                  <Text style={{ fontSize: '8px', color: '#383838', whiteSpace: 'nowrap', paddingTop: '1px', minWidth: '28px', fontFamily: 'monospace' }}>
                    {timeAgo(ev.date)}
                  </Text>
                  <Box style={{ flex: 1 }}>
                    <Text style={{ fontSize: '9px', color: i === 0 ? '#ccc' : '#aaa' }}>{ev.title}</Text>
                    {ev.detail && (
                      <Text style={{ fontSize: '8px', color: '#3a3a3a', marginTop: '1px' }}>{ev.detail}</Text>
                    )}
                  </Box>
                  <Box
                    style={{
                      fontSize: '6px',
                      padding: '1px 5px',
                      background: style.bg,
                      color: style.color,
                      border: `1px solid ${style.bg.replace('0.08', '0.15')}`,
                      borderRadius: '2px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {style.label}
                  </Box>
                </Group>
              )
            })}
          </Box>
        )}
      </Box>
    )
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error TS" | head -20
  ```

  Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/app/profile/ProfileFieldLog.tsx
  git commit -m "feat: add ProfileFieldLog activity feed derived from submissions/progress"
  ```

---

## Chunk 5: ProfileContentTabs

### Task 6: Create ProfileContentTabs

**Files:**
- Create: `client/src/app/profile/ProfileContentTabs.tsx`

Extracts the full My Content section (tabs, filter bars, submission cards, show-more) from `ProfilePageClient.tsx`. Functionally identical to the current implementation, restyled.

- [ ] **Step 1: Create the file**

  Create `client/src/app/profile/ProfileContentTabs.tsx`:

  ```typescript
  'use client'

  import React, { useState, useCallback, useMemo } from 'react'
  import {
    Box, Text, Group, Stack, Tabs, Badge, Button,
    TextInput, SegmentedControl, ActionIcon, Alert, Menu,
  } from '@mantine/core'
  import { useDebouncedValue } from '@mantine/hooks'
  import { notifications } from '@mantine/notifications'
  import {
    FileText, FileImage, Calendar, MessageSquare,
    Search, X, Plus,
  } from 'lucide-react'
  import Link from 'next/link'
  import SubmissionCard from '../../components/SubmissionCard'
  import type { SubmissionItem } from '../../components/SubmissionCard'
  import { GuideStatus } from '../../types'

  interface UserGuide {
    id: number
    title: string
    description?: string
    status: GuideStatus
    createdAt: string
    updatedAt: string
    rejectionReason?: string
  }

  type ContentTab = 'guides' | 'media' | 'events' | 'annotations'

  interface ProfileContentTabsProps {
    userGuides: UserGuide[]
    submissions: any[]
    onDeleteGuide: (id: number) => Promise<void>
    onDeleteMedia: (id: string) => Promise<void>
    onDeleteEvent: (id: number) => Promise<void>
    onDeleteAnnotation: (id: number) => Promise<void>
  }

  const TAB_CONFIG = [
    { value: 'guides' as ContentTab,      label: 'Guides',      icon: FileText,      entityKey: 'guide',      submissionType: 'guide',      defaultVisible: 6 },
    { value: 'media' as ContentTab,       label: 'Media',       icon: FileImage,     entityKey: 'media',      submissionType: 'media',      defaultVisible: 10 },
    { value: 'events' as ContentTab,      label: 'Events',      icon: Calendar,      entityKey: 'event',      submissionType: 'event',      defaultVisible: 10 },
    { value: 'annotations' as ContentTab, label: 'Annotations', icon: MessageSquare, entityKey: 'annotation', submissionType: 'annotation',  defaultVisible: 10 },
  ]

  const STATUS_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ]

  export default function ProfileContentTabs({
    userGuides,
    submissions,
    onDeleteGuide,
    onDeleteMedia,
    onDeleteEvent,
    onDeleteAnnotation,
  }: ProfileContentTabsProps) {
    const [activeTab, setActiveTab] = useState<ContentTab>('guides')
    const [filters, setFilters] = useState<Record<ContentTab, { status: string; search: string; visible: number }>>({
      guides:      { status: 'all', search: '', visible: 6 },
      media:       { status: 'all', search: '', visible: 10 },
      events:      { status: 'all', search: '', visible: 10 },
      annotations: { status: 'all', search: '', visible: 10 },
    })
    const [debouncedSearch] = useDebouncedValue(filters[activeTab].search, 300)

    const updateFilter = useCallback((tab: ContentTab, key: 'status' | 'search' | 'visible', value: string | number) => {
      setFilters(prev => ({ ...prev, [tab]: { ...prev[tab], [key]: value } }))
    }, [])

    const handleStatusChange = useCallback((tab: ContentTab, status: string) => {
      const config = TAB_CONFIG.find(t => t.value === tab)
      setFilters(prev => ({ ...prev, [tab]: { ...prev[tab], status, visible: config?.defaultVisible ?? 10 } }))
    }, [])

    const getItems = useCallback((tab: ContentTab) => {
      if (tab === 'guides') return userGuides
      const config = TAB_CONFIG.find(t => t.value === tab)!
      // Use submissionType (singular) to match API response — e.g. 'event' not 'events'
      return submissions.filter(s => s.type === config.submissionType)
    }, [userGuides, submissions])

    const getFiltered = useCallback((tab: ContentTab) => {
      const { status, visible } = filters[tab]
      const search = debouncedSearch.toLowerCase()
      let items = getItems(tab)
      if (status !== 'all') items = items.filter(item => item.status === status)
      if (search) items = items.filter(item =>
        item.title?.toLowerCase().includes(search) || item.description?.toLowerCase().includes(search)
      )
      return { filtered: items, visible: items.slice(0, visible), hasMore: items.length > visible, remaining: items.length - visible }
    }, [filters, debouncedSearch, getItems])

    const counts = useMemo(() => TAB_CONFIG.reduce((acc, tab) => {
      acc[tab.value] = tab.value === 'guides'
        ? userGuides.length
        : submissions.filter(s => s.type === tab.submissionType).length
      return acc
    }, {} as Record<ContentTab, number>), [userGuides, submissions])

    const deleteHandlers: Record<ContentTab, (id: any) => Promise<void>> = {
      guides:      (id) => onDeleteGuide(id),
      media:       (id) => onDeleteMedia(id),
      events:      (id) => onDeleteEvent(id),
      annotations: (id) => onDeleteAnnotation(id),
    }

    return (
      <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
        {/* Header */}
        <Group justify="space-between" align="center" mb={10}>
          <Group gap={6} align="baseline">
            <Text style={{ fontSize: '11px', fontWeight: 600, color: '#d4d4d4', letterSpacing: '0.04em' }}>My Content</Text>
            <Text style={{ fontSize: '6px', color: '#1e1e1e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>· case files</Text>
          </Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button
                size="xs"
                variant="outline"
                leftSection={<Plus size={12} />}
                style={{ borderColor: 'rgba(225,29,72,0.3)', color: '#e11d48', fontSize: '9px', padding: '2px 8px', height: 'auto' }}
              >
                new
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item component={Link} href="/submit-guide" leftSection={<FileText size={14} />}>New Guide</Menu.Item>
              <Menu.Item component={Link} href="/submit-media" leftSection={<FileImage size={14} />}>New Media</Menu.Item>
              <Menu.Item component={Link} href="/submit-event" leftSection={<Calendar size={14} />}>New Event</Menu.Item>
              <Menu.Item component={Link} href="/submit-annotation" leftSection={<MessageSquare size={14} />}>New Annotation</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(v) => v && setActiveTab(v as ContentTab)}
          variant="outline"
          keepMounted={false}
          color="#e11d48"
        >
          <Tabs.List style={{ borderBottom: '1px solid #1a1a1a', marginBottom: '10px' }}>
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon
              const count = counts[tab.value]
              return (
                <Tabs.Tab
                  key={tab.value}
                  value={tab.value}
                  leftSection={<Icon size={14} />}
                  rightSection={count > 0 ? (
                    <Badge size="xs" circle style={{ background: 'rgba(225,29,72,0.12)', color: '#3a1a1a', border: '1px solid rgba(225,29,72,0.2)', fontSize: '7px' }}>
                      {count}
                    </Badge>
                  ) : null}
                  style={{ fontSize: '9px', color: activeTab === tab.value ? '#e11d48' : '#444' }}
                >
                  {tab.label}
                </Tabs.Tab>
              )
            })}
          </Tabs.List>

          {TAB_CONFIG.map(tab => {
            const Icon = tab.icon
            const { filtered, visible, hasMore, remaining } = getFiltered(tab.value)
            const total = getItems(tab.value).length
            const config = TAB_CONFIG.find(t => t.value === tab.value)!

            return (
              <Tabs.Panel key={tab.value} value={tab.value}>
                <Stack gap="md">
                  {/* Filter bar */}
                  <Group gap="sm" wrap="wrap" p="xs" style={{ background: 'var(--mantine-color-dark-7)', borderRadius: 'var(--mantine-radius-md)' }}>
                    <TextInput
                      placeholder={`Search ${tab.label.toLowerCase()}...`}
                      leftSection={<Search size={14} />}
                      value={filters[tab.value].search}
                      onChange={(e) => updateFilter(tab.value, 'search', e.target.value)}
                      rightSection={filters[tab.value].search ? (
                        <ActionIcon size="sm" variant="subtle" onClick={() => updateFilter(tab.value, 'search', '')}>
                          <X size={12} />
                        </ActionIcon>
                      ) : null}
                      radius="md"
                      size="xs"
                      style={{ flex: '1 1 160px', minWidth: '120px' }}
                    />
                    <SegmentedControl
                      size="xs"
                      radius="md"
                      value={filters[tab.value].status}
                      onChange={(v) => handleStatusChange(tab.value, v)}
                      data={STATUS_OPTIONS}
                    />
                  </Group>

                  {/* Content */}
                  {total === 0 ? (
                    <Alert icon={<Icon size={14} />} title={`No ${tab.label.toLowerCase()} yet`} variant="light">
                      No {tab.label.toLowerCase()} submitted yet.
                    </Alert>
                  ) : filtered.length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center" py="md">No {tab.label.toLowerCase()} match your filter.</Text>
                  ) : (
                    <>
                      <Stack gap="xs">
                        {visible.map((item: any) => (
                          <SubmissionCard
                            key={`${tab.value}-${item.id}`}
                            submission={tab.value === 'guides' ? {
                              id: item.id,
                              type: 'guide',
                              title: item.title,
                              description: item.description,
                              status: item.status,
                              rejectionReason: item.rejectionReason,
                              createdAt: item.createdAt,
                            } as SubmissionItem : item as SubmissionItem}
                            isOwnerView
                            onDelete={async (id) => {
                              try {
                                await deleteHandlers[tab.value](id)
                              } catch {
                                notifications.show({ title: 'Error', message: `Failed to delete ${tab.label.toLowerCase().slice(0, -1)}.`, color: 'red' })
                              }
                            }}
                          />
                        ))}
                      </Stack>
                      {hasMore && (
                        <Button
                          variant="subtle"
                          fullWidth
                          size="xs"
                          onClick={() => updateFilter(tab.value, 'visible', filters[tab.value].visible + config.defaultVisible)}
                        >
                          Show more ({remaining} remaining)
                        </Button>
                      )}
                    </>
                  )}
                </Stack>
              </Tabs.Panel>
            )
          })}
        </Tabs>
      </Box>
    )
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error TS" | head -20
  ```

  Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/app/profile/ProfileContentTabs.tsx
  git commit -m "feat: add ProfileContentTabs with unified guide/media/event/annotation management"
  ```

---

## Chunk 6: ProfileSettingsPanel

### Task 7: Create ProfileSettingsPanel

**Files:**
- Create: `client/src/app/profile/ProfileSettingsPanel.tsx`

Extracts the Settings tab content: linked accounts, custom role editor, account security (change email, change password).

- [ ] **Step 1: Create the file**

  Create `client/src/app/profile/ProfileSettingsPanel.tsx`:

  ```typescript
  'use client'

  import React, { useState } from 'react'
  import {
    Box, Text, Group, Stack, Button, TextInput, PasswordInput, Divider, Alert, useMantineTheme,
  } from '@mantine/core'
  import { notifications } from '@mantine/notifications'
  import { getEntityThemeColor } from '../../lib/mantine-theme'
  import { api } from '../../lib/api'


  interface SettingsPanelUser {
    id?: number
    email?: string
    fluxerId?: string
    fluxerUsername?: string
    customRole?: string
    role?: string
  }

  interface ProfileSettingsPanelProps {
    user: SettingsPanelUser
    hasActiveSupporterBadge: boolean
    customRole: string
    initialCustomRole: string
    savingCustomRole: boolean
    onCustomRoleChange: (role: string) => void
    onSaveCustomRole: () => Promise<void>
    onLinkFluxer: () => void
    onUnlinkFluxer: () => Promise<void>
    onRefreshUser: () => Promise<void>
  }

  function SectionCard({ children }: { children: React.ReactNode }) {
    return (
      <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
        {children}
      </Box>
    )
  }

  export default function ProfileSettingsPanel({
    user,
    hasActiveSupporterBadge,
    customRole,
    initialCustomRole,
    savingCustomRole,
    onCustomRoleChange,
    onSaveCustomRole,
    onLinkFluxer,
    onUnlinkFluxer,
    onRefreshUser,
  }: ProfileSettingsPanelProps) {
    const theme = useMantineTheme()
    const [unlinkingFluxer, setUnlinkingFluxer] = useState(false)
    const [changeEmailForm, setChangeEmailForm] = useState({ newEmail: '', currentPassword: '' })
    const [changingEmail, setChangingEmail] = useState(false)
    const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [changingPassword, setChangingPassword] = useState(false)

    const handleUnlinkFluxer = async () => {
      setUnlinkingFluxer(true)
      try {
        await onUnlinkFluxer()
        notifications.show({ title: 'Account Unlinked', message: 'Fluxer account has been unlinked', color: 'green' })
      } catch (err: any) {
        notifications.show({ title: 'Unlink Failed', message: err?.message || 'Failed to unlink', color: 'red' })
      } finally {
        setUnlinkingFluxer(false)
      }
    }

    const handleChangeEmail = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!changeEmailForm.newEmail) return
      setChangingEmail(true)
      try {
        await api.changeEmail(changeEmailForm.newEmail, changeEmailForm.currentPassword || undefined)
        setChangeEmailForm({ newEmail: '', currentPassword: '' })
        await onRefreshUser()
        notifications.show({ title: 'Email updated', message: 'A verification link has been sent to your new email.', color: 'green' })
      } catch (err: any) {
        notifications.show({ title: 'Failed to update email', message: err?.message || 'Check your password and try again.', color: 'red' })
      } finally {
        setChangingEmail(false)
      }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault()
      const { currentPassword, newPassword, confirmPassword } = changePasswordForm
      if (newPassword !== confirmPassword) {
        notifications.show({ title: 'Passwords do not match', message: 'New password and confirmation must be identical.', color: 'red' })
        return
      }
      const pwRules = [
        { ok: newPassword.length >= 8,   msg: 'Password must be at least 8 characters.' },
        { ok: newPassword.length <= 128,  msg: 'Password must not exceed 128 characters.' },
        { ok: /[A-Z]/.test(newPassword),  msg: 'Password must contain at least one uppercase letter.' },
        { ok: /[a-z]/.test(newPassword),  msg: 'Password must contain at least one lowercase letter.' },
        { ok: /\d/.test(newPassword),     msg: 'Password must contain at least one number.' },
      ]
      const failed = pwRules.find(r => !r.ok)
      if (failed) {
        notifications.show({ title: 'Invalid password', message: failed.msg, color: 'red' })
        return
      }
      setChangingPassword(true)
      try {
        await api.changePassword(newPassword, currentPassword || undefined)
        setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        notifications.show({ title: 'Password updated', message: 'Your password has been changed successfully.', color: 'green' })
      } catch (err: any) {
        notifications.show({ title: 'Failed to update password', message: err?.message || 'Check your current password.', color: 'red' })
      } finally {
        setChangingPassword(false)
      }
    }

    return (
      <Stack gap="lg">
        {/* Linked Accounts */}
        <SectionCard>
          <Text fw={600} size="sm" mb={4}>Linked Accounts</Text>
          <Text size="xs" c="dimmed" mb="md">Manage connected accounts.</Text>
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Box style={{ width: 32, height: 32, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Text size="xs" fw={700} c="white">Fx</Text>
              </Box>
              <Stack gap={2}>
                <Text size="sm" fw={500}>Fluxer</Text>
                <Text size="xs" c="dimmed">
                  {user?.fluxerId ? `@${user.fluxerUsername || user.fluxerId}` : 'Not linked'}
                </Text>
              </Stack>
            </Group>
            {user?.fluxerId ? (
              <Button size="xs" variant="light" color="red" onClick={handleUnlinkFluxer} loading={unlinkingFluxer}>
                Unlink
              </Button>
            ) : (
              <Button size="xs" variant="light" color="violet" onClick={onLinkFluxer}>
                Link Fluxer
              </Button>
            )}
          </Group>
        </SectionCard>

        {/* Custom Role */}
        <SectionCard>
          <Text fw={600} size="sm" mb="md">Custom Role</Text>
          {!hasActiveSupporterBadge ? (
            <Alert style={{ color: getEntityThemeColor(theme, 'character') }} variant="light">
              <Stack gap="xs">
                <Text size="sm" fw={500}>Custom roles are exclusive to active supporters!</Text>
                <Text size="sm">Support us on Ko-fi to unlock this feature.</Text>
                <Button component="a" href="https://ko-fi.com/ninjaruss" target="_blank" rel="noopener noreferrer" size="sm">
                  ☕ Support on Ko-fi
                </Button>
              </Stack>
            </Alert>
          ) : (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Customize how your role appears to other users</Text>
              <TextInput
                placeholder="e.g., 'Gambling Expert'"
                value={customRole}
                onChange={(e) => onCustomRoleChange(e.target.value)}
                maxLength={50}
              />
              <Group gap="xs">
                <Button
                  onClick={onSaveCustomRole}
                  loading={savingCustomRole}
                  disabled={savingCustomRole || customRole === initialCustomRole}
                  size="sm"
                  variant="filled"
                  style={{ backgroundColor: getEntityThemeColor(theme, 'character') }}
                >
                  Save Custom Role
                </Button>
                {customRole !== initialCustomRole && (
                  <Button onClick={() => onCustomRoleChange(initialCustomRole)} size="sm" variant="subtle" color="gray">
                    Cancel
                  </Button>
                )}
              </Group>
            </Stack>
          )}
        </SectionCard>

        {/* Account Security */}
        <SectionCard>
          <Text fw={600} size="sm" mb="md">Account Security</Text>

          {/* Change Email */}
          <Stack gap="xs" mb="lg">
            <Text fw={500} size="sm">Change Email</Text>
            <Text size="xs" c="dimmed">
              {user?.email ? <>Current: <strong>{user.email}</strong></> : 'No email address set.'}
            </Text>
            <form onSubmit={handleChangeEmail}>
              <Stack gap="xs">
                <TextInput label="New Email Address" type="email" placeholder="you@example.com" value={changeEmailForm.newEmail} onChange={(e) => setChangeEmailForm(p => ({ ...p, newEmail: e.currentTarget.value }))} required disabled={changingEmail} />
                {user?.email && (
                  <PasswordInput label="Current Password" placeholder="Confirm with your current password" value={changeEmailForm.currentPassword} onChange={(e) => setChangeEmailForm(p => ({ ...p, currentPassword: e.currentTarget.value }))} required disabled={changingEmail} />
                )}
                <Button type="submit" size="sm" loading={changingEmail} disabled={changingEmail || !changeEmailForm.newEmail || (!!user?.email && !changeEmailForm.currentPassword)} style={{ alignSelf: 'flex-start' }}>
                  Update Email
                </Button>
              </Stack>
            </form>
          </Stack>

          <Divider mb="lg" />

          {/* Change Password */}
          <Stack gap="xs">
            <Text fw={500} size="sm">{user?.email ? 'Change Password' : 'Set a Password'}</Text>
            {!user?.email && <Text size="xs" c="dimmed">Add a password to log in with email as well as Fluxer.</Text>}
            <form onSubmit={handleChangePassword}>
              <Stack gap="xs">
                {user?.email && (
                  <PasswordInput label="Current Password" placeholder="Your current password" value={changePasswordForm.currentPassword} onChange={(e) => setChangePasswordForm(p => ({ ...p, currentPassword: e.currentTarget.value }))} required disabled={changingPassword} />
                )}
                <PasswordInput label="New Password" placeholder="At least 8 characters, uppercase, lowercase, number" value={changePasswordForm.newPassword} onChange={(e) => setChangePasswordForm(p => ({ ...p, newPassword: e.currentTarget.value }))} required disabled={changingPassword} description="8–128 chars · uppercase · lowercase · number" />
                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Repeat your new password"
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) => setChangePasswordForm(p => ({ ...p, confirmPassword: e.currentTarget.value }))}
                  required
                  disabled={changingPassword}
                  error={changePasswordForm.confirmPassword && changePasswordForm.newPassword !== changePasswordForm.confirmPassword ? 'Passwords do not match' : undefined}
                />
                <Button type="submit" size="sm" loading={changingPassword} disabled={changingPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword || (!!user?.email && !changePasswordForm.currentPassword)} style={{ alignSelf: 'flex-start' }}>
                  {user?.email ? 'Change Password' : 'Set Password'}
                </Button>
              </Stack>
            </form>
          </Stack>
        </SectionCard>
      </Stack>
    )
  }
  ```

- [ ] **Step 2: Verify build**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error TS" | head -20
  ```

  Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/app/profile/ProfileSettingsPanel.tsx
  git commit -m "feat: add ProfileSettingsPanel with linked accounts, custom role, security"
  ```

---

## Chunk 7: Orchestrator + Wiring

### Task 8: Rewrite ProfilePageClient as thin orchestrator

**Files:**
- Modify: `client/src/app/profile/ProfilePageClient.tsx`

Replace the existing 1,890-line monolith with a thin orchestrator. It keeps all data fetching and state, but delegates rendering entirely to the subcomponents. Update `ProfileSkeleton` to match the new layout.

- [ ] **Step 1: Replace ProfilePageClient.tsx**

  Fully replace `client/src/app/profile/ProfilePageClient.tsx` with:

  ```typescript
  'use client'

  import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
  import { Box, Container, Skeleton, SimpleGrid, Stack, Tabs, Group, Text, Button, Alert, ActionIcon } from '@mantine/core'
  import { useDisclosure } from '@mantine/hooks'
  import { notifications } from '@mantine/notifications'
  import { motion } from 'motion/react'
  import { User as UserIcon, X } from 'lucide-react'
  import Link from 'next/link'

  import { useAuth } from '../../providers/AuthProvider'
  import { api } from '../../lib/api'
  import { GuideStatus } from '../../types'
  import { invalidatePagedCache } from '../../lib/cache-utils'
  import { outlineStyles } from '../../lib/mantine-theme'

  import QuoteSelectionPopup from '../../components/QuoteSelectionPopup'
  import GambleSelectionPopup from '../../components/GambleSelectionPopup'
  import ProfilePictureSelector from '../../components/ProfilePictureSelector'

  import ProfileHeader from './ProfileHeader'
  import ProfileIntelPanel from './ProfileIntelPanel'
  import ProfileFieldLog from './ProfileFieldLog'
  import ProfileProgressReport from './ProfileProgressReport'
  import ProfileContentTabs from './ProfileContentTabs'
  import ProfileSettingsPanel from './ProfileSettingsPanel'

  interface UserGuide {
    id: number
    title: string
    description?: string
    status: GuideStatus
    createdAt: string
    updatedAt: string
    rejectionReason?: string
  }

  // ─── Loading skeleton ─────────────────────────────────────────────────────────
  function ProfileSkeleton() {
    return (
      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '20px 24px' }}>
            <Skeleton height={8} width={160} mb={12} />
            <SimpleGrid cols={2}>
              <Stack gap="sm">
                <Skeleton circle height={72} width={72} />
                <Skeleton height={32} width={200} />
                <Skeleton height={20} width={150} />
              </Stack>
              <Skeleton height={60} />
            </SimpleGrid>
            <SimpleGrid cols={4} mt="md" spacing="xs">
              {[1,2,3,4].map(i => <Skeleton key={i} height={36} />)}
            </SimpleGrid>
          </Box>
          {/* Section grid */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Skeleton height={280} radius="sm" />
            <Skeleton height={280} radius="sm" />
          </SimpleGrid>
          <Skeleton height={80} radius="sm" />
          <Skeleton height={240} radius="sm" />
        </Stack>
      </Container>
    )
  }

  // ─── Main component ───────────────────────────────────────────────────────────
  export default function ProfilePageClient() {
    const { user, loading: authLoading, refreshUser, linkFluxer } = useAuth()

    const [profileData, setProfileData] = useState({ favoriteQuote: '', favoriteGamble: '', customRole: '' })
    const [userGuides, setUserGuides] = useState<UserGuide[]>([])
    const [quotes, setQuotes] = useState<any[]>([])
    const [gambles, setGambles] = useState<any[]>([])
    const [userBadges, setUserBadges] = useState<any[]>([])
    const [submissions, setSubmissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [savingCustomRole, setSavingCustomRole] = useState(false)
    const initialCustomRoleRef = useRef<string>('')

    const [profileTab, setProfileTab] = useState<'general' | 'settings'>('general')
    const [quoteModalOpened, { open: openQuoteModal, close: closeQuoteModal }] = useDisclosure(false)
    const [gambleModalOpened, { open: openGambleModal, close: closeGambleModal }] = useDisclosure(false)
    const [profilePictureSelectorOpened, { open: openProfilePictureSelector, close: closeProfilePictureSelector }] = useDisclosure(false)

    const isAuthenticated = !!user

    const hasActiveSupporterBadge = userBadges.some(ub => ub.badge?.type === 'active_supporter')

    const stats = useMemo(() => ({
      guides:      userGuides.length,
      media:       submissions.filter(s => s.type === 'media').length,
      annotations: submissions.filter(s => s.type === 'annotation').length,
    }), [userGuides, submissions])

    const loadProfileData = useCallback(async () => {
      try {
        setLoading(true)
        let favoriteQuoteId: number | null = null
        let favoriteGambleId: number | null = null

        try {
          const profileResp = await api.get('/users/profile')
          const data = (profileResp as any).data || profileResp
          const initialCustomRole = user?.customRole || data.customRole || ''
          initialCustomRoleRef.current = initialCustomRole
          setProfileData({
            favoriteQuote: data.favoriteQuoteId ? String(data.favoriteQuoteId) : '',
            favoriteGamble: data.favoriteGambleId ? String(data.favoriteGambleId) : '',
            customRole: initialCustomRole,
          })
          favoriteQuoteId = data.favoriteQuoteId ?? null
          favoriteGambleId = data.favoriteGambleId ?? null

          const [favQuoteResp, favGambleResp] = await Promise.all([
            favoriteQuoteId ? api.getQuote(favoriteQuoteId) : Promise.resolve(null),
            favoriteGambleId ? api.getGamble(favoriteGambleId) : Promise.resolve(null),
          ])
          const favQuote = favQuoteResp?.data ?? favQuoteResp
          const favGamble = favGambleResp?.data ?? favGambleResp
          if (favQuote) setQuotes(prev => prev.find(q => q.id === favQuote.id) ? prev : [...prev, favQuote])
          if (favGamble) setGambles(prev => prev.find(g => g.id === favGamble.id) ? prev : [...prev, favGamble])
        } catch (err) {
          console.error('Failed to fetch profile or favorites:', err)
        }

        const [guidesRes, quotesRes, gamblesRes, badgesRes, submissionsRes] = await Promise.allSettled([
          api.get('/guides/my-guides'),
          api.get('/quotes?limit=100'),
          api.get('/gambles?limit=100'),
          user?.id && typeof user.id === 'number' ? api.getUserBadges(user.id) : Promise.resolve([]),
          api.getUserSubmissions(),
        ])

        if (guidesRes.status === 'fulfilled') setUserGuides((guidesRes.value as any).data)
        if (quotesRes.status === 'fulfilled') {
          const fetched = (quotesRes.value as any).data || []
          setQuotes(prev => { const ids = new Set(prev.map(q => q.id)); return [...prev, ...fetched.filter((q: any) => !ids.has(q.id))] })
        }
        if (gamblesRes.status === 'fulfilled') {
          const fetched = (gamblesRes.value as any).data || []
          setGambles(prev => { const ids = new Set(prev.map(g => g.id)); return [...prev, ...fetched.filter((g: any) => !ids.has(g.id))] })
        }
        if (badgesRes.status === 'fulfilled') {
          const d = badgesRes.value as any
          setUserBadges(Array.isArray(d) ? d : d?.data || [])
        }
        if (submissionsRes.status === 'fulfilled') {
          const d = submissionsRes.value as any
          setSubmissions(Array.isArray(d) ? d : d?.data || [])
        }
      } catch (err) {
        console.error('Failed to load profile data:', err)
        notifications.show({ title: 'Error', message: 'Failed to load profile data', color: 'red' })
      } finally {
        setLoading(false)
      }
    }, [user, refreshUser])

    useEffect(() => {
      if (isAuthenticated && user) loadProfileData()
      else if (!authLoading && !isAuthenticated) setLoading(false)
    }, [isAuthenticated, user, authLoading, loadProfileData])

    const handleSaveUsername = useCallback(async (username: string) => {
      await api.patch('/users/profile', { username })
      await refreshUser()
      invalidatePagedCache('users')
      notifications.show({ title: 'Username updated', message: 'Your username has been changed successfully', color: 'green' })
    }, [refreshUser])

    const handleProfilePictureSelect = useCallback(async (type: string, mediaId?: number) => {
      closeProfilePictureSelector()
      try {
        const updateData: any = { profilePictureType: type }
        if (mediaId) updateData.selectedCharacterMediaId = mediaId
        await api.patch('/users/profile', updateData)
        await refreshUser()
        invalidatePagedCache('users')
        notifications.show({ title: 'Success', message: 'Profile picture updated successfully', color: 'green' })
      } catch {
        notifications.show({ title: 'Error', message: 'Failed to update profile picture', color: 'red' })
      }
    }, [closeProfilePictureSelector, refreshUser])

    const handleQuoteSelect = useCallback(async (quoteId: number | null) => {
      setProfileData(prev => ({ ...prev, favoriteQuote: quoteId ? String(quoteId) : '' }))
      closeQuoteModal()
      try {
        await api.patch('/users/profile', { favoriteQuoteId: quoteId })
        notifications.show({ title: 'Success', message: 'Favorite quote updated', color: 'green' })
      } catch {
        notifications.show({ title: 'Error', message: 'Failed to update favorite quote', color: 'red' })
      }
    }, [closeQuoteModal])

    const handleGambleSelect = useCallback(async (gambleId: number | null) => {
      setProfileData(prev => ({ ...prev, favoriteGamble: gambleId ? String(gambleId) : '' }))
      closeGambleModal()
      try {
        await api.patch('/users/profile', { favoriteGambleId: gambleId })
        notifications.show({ title: 'Success', message: 'Favorite gamble updated', color: 'green' })
      } catch {
        notifications.show({ title: 'Error', message: 'Failed to update favorite gamble', color: 'red' })
      }
    }, [closeGambleModal])

    const handleSaveCustomRole = useCallback(async () => {
      if (!hasActiveSupporterBadge) return
      setSavingCustomRole(true)
      try {
        await api.patch('/users/profile/custom-role', { customRole: profileData.customRole })
        await refreshUser()
        initialCustomRoleRef.current = profileData.customRole
        notifications.show({ title: 'Success', message: 'Custom role saved', color: 'green' })
      } catch {
        notifications.show({ title: 'Error', message: 'Failed to save custom role', color: 'red' })
      } finally {
        setSavingCustomRole(false)
      }
    }, [hasActiveSupporterBadge, refreshUser, profileData.customRole])

    const handleUnlinkFluxer = useCallback(async () => {
      await api.unlinkFluxer()
      await refreshUser()
    }, [refreshUser])

    const handleDeleteGuide = useCallback(async (id: number) => {
      await api.deleteGuide(id)
      setUserGuides(prev => prev.filter(g => g.id !== id))
      notifications.show({ title: 'Guide deleted', message: 'Your guide has been removed.', color: 'green' })
    }, [])

    const handleDeleteMedia = useCallback(async (id: string) => {
      await api.deleteMedia(id)
      setSubmissions(prev => prev.filter(s => !(s.type === 'media' && s.id === id)))
      notifications.show({ title: 'Media deleted', message: 'You can resubmit a new version.', color: 'green' })
    }, [])

    const handleDeleteEvent = useCallback(async (id: number) => {
      await api.deleteEvent(id)
      setSubmissions(prev => prev.filter(s => !(s.type === 'event' && s.id === id)))
      notifications.show({ title: 'Event deleted', message: 'Your event has been removed.', color: 'green' })
    }, [])

    const handleDeleteAnnotation = useCallback(async (id: number) => {
      await api.deleteAnnotation(id)
      setSubmissions(prev => prev.filter(s => !(s.type === 'annotation' && s.id === id)))
      notifications.show({ title: 'Annotation deleted', message: 'Your annotation has been removed.', color: 'green' })
    }, [])

    if (authLoading) return <ProfileSkeleton />

    if (!isAuthenticated) {
      return (
        <Container size="lg" py="xl">
          <Alert icon={<UserIcon size={16} />} title="Authentication Required" variant="light">
            <Stack gap="md">
              <Text>You need to be logged in to view your profile.</Text>
              <Button component={Link} href={`/login?returnUrl=${encodeURIComponent('/profile')}`} variant="filled">Log In</Button>
            </Stack>
          </Alert>
        </Container>
      )
    }

    if (loading) return <ProfileSkeleton />

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Container size="lg" py="xl">
          <Stack gap={0}>
            {/* Header */}
            <ProfileHeader
              user={user!}
              stats={stats}
              onOpenProfilePictureSelector={openProfilePictureSelector}
              onSaveUsername={handleSaveUsername}
              onOpenSettings={() => setProfileTab('settings')}
            />

            {/* Inline profile picture selector */}
            {profilePictureSelectorOpened && user?.id && typeof user.id === 'number' && (
              <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderTop: 'none', padding: '16px' }}>
                <Group justify="space-between" mb="sm">
                  <Text size="sm" fw={600}>Profile Picture Options</Text>
                  <ActionIcon variant="subtle" onClick={closeProfilePictureSelector} aria-label="Close">
                    <X size={16} />
                  </ActionIcon>
                </Group>
                <ProfilePictureSelector
                  currentUserId={user.id}
                  currentProfileType="default"
                  currentSelectedMediaId={null}
                  onSelect={handleProfilePictureSelect}
                />
              </Box>
            )}

            {/* Tab switcher (hidden visually, controlled by gear icon) */}
            <Tabs
              value={profileTab}
              onChange={(v) => v && setProfileTab(v as 'general' | 'settings')}
              variant="outline"
              keepMounted={false}
              color={outlineStyles.accentColor}
            >
              <Tabs.List style={{ display: 'none' }}>
                <Tabs.Tab value="general">General</Tabs.Tab>
                <Tabs.Tab value="settings">Settings</Tabs.Tab>
              </Tabs.List>

              {/* General tab */}
              <Tabs.Panel value="general">
                <Box style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}
                  className="profile-section-grid">
                  <ProfileIntelPanel
                    quotes={quotes}
                    gambles={gambles}
                    favoriteQuoteId={profileData.favoriteQuote}
                    favoriteGambleId={profileData.favoriteGamble}
                    loading={loading}
                    onOpenQuoteModal={openQuoteModal}
                    onOpenGambleModal={openGambleModal}
                  />
                  <ProfileFieldLog
                    guides={userGuides}
                    submissions={submissions}
                    user={user!}
                  />
                  <Box style={{ gridColumn: '1 / -1' }}>
                    <ProfileProgressReport userProgress={user?.userProgress ?? 0} />
                  </Box>
                  <Box style={{ gridColumn: '1 / -1' }}>
                    <ProfileContentTabs
                      userGuides={userGuides}
                      submissions={submissions}
                      onDeleteGuide={handleDeleteGuide}
                      onDeleteMedia={handleDeleteMedia}
                      onDeleteEvent={handleDeleteEvent}
                      onDeleteAnnotation={handleDeleteAnnotation}
                    />
                  </Box>
                </Box>
              </Tabs.Panel>

              {/* Settings tab */}
              <Tabs.Panel value="settings">
                <Box p="md">
                  <ProfileSettingsPanel
                    user={user!}
                    hasActiveSupporterBadge={hasActiveSupporterBadge}
                    customRole={profileData.customRole}
                    initialCustomRole={initialCustomRoleRef.current}
                    savingCustomRole={savingCustomRole}
                    onCustomRoleChange={(role) => setProfileData(prev => ({ ...prev, customRole: role }))}
                    onSaveCustomRole={handleSaveCustomRole}
                    onLinkFluxer={linkFluxer}
                    onUnlinkFluxer={handleUnlinkFluxer}
                    onRefreshUser={refreshUser}
                  />
                </Box>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Container>

        {/* Modals */}
        <QuoteSelectionPopup
          open={quoteModalOpened}
          onClose={closeQuoteModal}
          quotes={quotes}
          selectedQuoteId={profileData.favoriteQuote ? parseInt(profileData.favoriteQuote) : null}
          onSelectQuote={handleQuoteSelect}
          loading={loading}
        />
        <GambleSelectionPopup
          open={gambleModalOpened}
          onClose={closeGambleModal}
          gambles={gambles}
          selectedGambleId={profileData.favoriteGamble ? parseInt(profileData.favoriteGamble) : null}
          onSelectGamble={handleGambleSelect}
          loading={loading}
        />
      </motion.div>
    )
  }
  ```

- [ ] **Step 2: Add mobile responsive CSS for the profile section grid**

  In `client/src/app/globals.css` (or wherever mobile utility classes are defined), add:

  ```css
  @media (max-width: 640px) {
    .profile-section-grid {
      grid-template-columns: 1fr !important;
    }
  }
  ```

- [ ] **Step 3: Full build + lint**

  ```bash
  cd client && yarn build 2>&1 | tail -20
  ```

  Expected: build succeeds. If there are TypeScript errors, fix them before proceeding — do not ignore them.

  ```bash
  cd client && yarn lint 2>&1 | grep -v "^$" | head -30
  ```

  Expected: no new lint errors introduced.

- [ ] **Step 4: Visual check**

  Start the dev server and open http://localhost:3000/profile. Verify:
  - Header renders with cinematic gradient, stat strip, gear icon
  - Section grid shows Favorites (left) and Activity (right)
  - Reading progress bar and My Content render full-width below
  - Gear icon opens Settings tab
  - Username editing works (click pencil, type, Enter to save)
  - Avatar click opens profile picture selector inline
  - Quote/gamble modal popups work

- [ ] **Step 5: Commit**

  ```bash
  git add client/src/app/profile/ProfilePageClient.tsx client/src/app/globals.css
  git commit -m "feat: rewrite ProfilePageClient as thin orchestrator, complete profile redesign"
  ```

---

## Done

All subcomponents are in place and the orchestrator wires them together. The profile page now has:
- Dossier/case-file header with cinematic gradient and inline stat strip
- Favorites section with character manager, quote card, gamble row
- Activity feed derived from existing data
- Reading progress bar with arc milestone markers
- My Content tabs (guides / media / events / annotations) with filter/search
- Settings tab with linked accounts, custom role, account security
- Component split: 1,890 lines → 7 focused files
