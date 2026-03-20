# Profile Picture Modal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inline `ProfilePictureSelector` card with a Mantine `Modal` featuring tabs, a two-panel character browser, and a live profile-header preview panel.

**Architecture:** `ProfilePictureSelector` becomes a self-contained modal component with all state local to it. `ProfilePageClient` removes the inline conditional box and instead renders the selector like the other popup modals (QuoteSelectionPopup, GambleSelectionPopup) at the bottom of its JSX. The `onSelect` callback signature is unchanged so no other files need editing.

**Tech Stack:** Next.js 15 / React 19 / TypeScript / Mantine UI (`Modal`, `Tabs`, `Avatar`, `TextInput`, `Badge`, `ActionIcon`) / existing `TimelineSpoilerWrapper` / existing `api.getApprovedMedia`

---

## File Map

| File | Change |
|------|--------|
| `client/src/components/ProfilePictureSelector.tsx` | Full rewrite — becomes a Modal |
| `client/src/app/profile/ProfilePageClient.tsx` | Remove inline selector box (~15 lines); add modal to modals section; pass correct props |

No other files change.

---

## Key Data Shapes (reference while implementing)

**Media object** (from `api.getApprovedMedia`):
```ts
{
  id: number
  url: string
  description?: string
  chapterNumber?: number
  character?: { id: number; name: string; firstAppearanceChapter?: number }
}
```

**New ProfilePictureSelector props:**
```ts
interface ProfilePictureSelectorProps {
  opened: boolean
  onClose: () => void
  currentUserId: number
  currentProfileType: string         // user.profilePictureType
  currentSelectedMediaId?: number | null
  user: User                         // full user object for preview panel
  onSelect: (type: string, mediaId?: number) => void
}
```

**Local state:**
```ts
activeTab: 'character_media' | 'fluxer' | 'exclusive_artwork'
selectedCharacterId: number | null   // keyed by character.id, not name
pendingSelection: { type: string; mediaId?: number } | null
pendingMedia: MediaObject | null     // full object for preview rendering
characterFilter: string
characterMedia: any[]
mediaLoading: boolean
userBadges: UserBadge[]
badgesLoading: boolean
```

---

## Task 1: Update ProfilePageClient

**Files:**
- Modify: `client/src/app/profile/ProfilePageClient.tsx`

- [ ] **Step 1: Remove the inline selector box**

In `ProfilePageClient.tsx`, delete lines 299–314 (the `{profilePictureSelectorOpened && ...}` conditional block that renders `ProfilePictureSelector` inline). The import of `ProfilePictureSelector` at line 19 stays — it will be used in the next step.

Also remove the `Group`, `ActionIcon`, `X`, `Text` imports if they are only used in that block. (Check — `X` is also used at line 8 import for the Settings close icon in ProfileHeader, so keep it.)

- [ ] **Step 2: Move ProfilePictureSelector to the modals section**

In the JSX at the bottom (after `</motion.div>`, where `QuoteSelectionPopup` and `GambleSelectionPopup` are rendered — around lines 386–401), add the new modal-based `ProfilePictureSelector`:

```tsx
<ProfilePictureSelector
  opened={profilePictureSelectorOpened}
  onClose={closeProfilePictureSelector}
  currentUserId={user?.id ?? 0}
  currentProfileType={user?.profilePictureType ?? 'fluxer'}
  currentSelectedMediaId={user?.selectedCharacterMediaId ?? null}
  user={user!}
  onSelect={handleProfilePictureSelect}
/>
```

Note: `handleProfilePictureSelect` already calls `closeProfilePictureSelector()` on line 188 — that's fine (the modal will already be closed or idempotent).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: no TypeScript errors (there will be errors from ProfilePictureSelector not yet accepting the new props — that's OK, fix in Task 2).

- [ ] **Step 4: Commit**

```bash
git add client/src/app/profile/ProfilePageClient.tsx
git commit -m "refactor: remove inline profile picture selector, wire to modal"
```

---

## Task 2: ProfilePictureSelector — Modal shell, state, and tabs

**Files:**
- Modify: `client/src/components/ProfilePictureSelector.tsx`

- [ ] **Step 1: Replace the entire file with the modal shell**

Replace the full contents of `client/src/components/ProfilePictureSelector.tsx` with:

```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Tabs,
  Box,
  Group,
  Text,
  Badge,
  Stack,
  Skeleton,
  Avatar,
  TextInput,
  ScrollArea,
  SimpleGrid,
  Button,
  Alert,
} from '@mantine/core';
import { api, API_BASE_URL } from '../lib/api';
import { getEntityThemeColor, outlineStyles } from '../lib/mantine-theme';
import { UserBadge, BadgeType } from '../types';
import TimelineSpoilerWrapper from './TimelineSpoilerWrapper';
import type { User } from '../providers/AuthProvider';

interface ProfilePictureSelectorProps {
  opened: boolean;
  onClose: () => void;
  currentUserId: number;
  currentProfileType: string;
  currentSelectedMediaId?: number | null;
  user: User;
  onSelect: (type: string, mediaId?: number) => void;
}

export default function ProfilePictureSelector({
  opened,
  onClose,
  currentUserId,
  currentProfileType,
  currentSelectedMediaId,
  user,
  onSelect,
}: ProfilePictureSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>('character_media');
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{ type: string; mediaId?: number } | null>(null);
  const [pendingMedia, setPendingMedia] = useState<any | null>(null);
  const [characterFilter, setCharacterFilter] = useState('');
  const [characterMedia, setCharacterMedia] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (opened) {
      setPendingSelection(null);
      setPendingMedia(null);
      setCharacterFilter('');
      setActiveTab('character_media');
    }
  }, [opened]);

  // Fetch badges on open
  useEffect(() => {
    if (!opened || !currentUserId) return;
    setBadgesLoading(true);
    fetch(`${API_BASE_URL}/users/${currentUserId}/badges`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setUserBadges(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => setUserBadges([]))
      .finally(() => setBadgesLoading(false));
  }, [opened, currentUserId]);

  const fetchCharacterMedia = useCallback(async () => {
    if (characterMedia.length > 0) return; // already loaded
    setMediaLoading(true);
    try {
      const response = await api.getApprovedMedia({ ownerType: 'character', purpose: 'entity_display', limit: 1000 });
      if (response?.data) setCharacterMedia(response.data);
    } catch {
      // silent fail
    } finally {
      setMediaLoading(false);
    }
  }, [characterMedia.length]);

  // Lazy-load character media when Characters tab first activates
  useEffect(() => {
    if (activeTab === 'character_media') fetchCharacterMedia();
  }, [activeTab, fetchCharacterMedia]);

  const hasActiveBadge = useCallback((type: BadgeType): boolean => {
    return userBadges.some(ub =>
      ub?.badge?.type === type &&
      ub?.isActive &&
      (!ub?.expiresAt || new Date(ub.expiresAt) > new Date())
    );
  }, [userBadges]);

  const isSupporter = hasActiveBadge(BadgeType.SUPPORTER) || hasActiveBadge(BadgeType.ACTIVE_SUPPORTER) || hasActiveBadge(BadgeType.SPONSOR);

  // Group media by character id, sorted by character name
  const characterGroups = React.useMemo(() => {
    const filtered = characterFilter
      ? characterMedia.filter(m => m.character?.name?.toLowerCase().includes(characterFilter.toLowerCase()))
      : characterMedia;

    const groups: Record<number, { id: number; name: string; medias: any[] }> = {};
    for (const m of filtered) {
      if (!m.character?.id) continue;
      if (!groups[m.character.id]) {
        groups[m.character.id] = { id: m.character.id, name: m.character.name, medias: [] };
      }
      groups[m.character.id].medias.push(m);
    }
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [characterMedia, characterFilter]);

  // Auto-select first character when groups load
  useEffect(() => {
    if (characterGroups.length > 0 && selectedCharacterId === null) {
      setSelectedCharacterId(characterGroups[0].id);
    }
  }, [characterGroups, selectedCharacterId]);

  const selectedGroup = characterGroups.find(g => g.id === selectedCharacterId) ?? null;

  const handleImageSelect = (media: any) => {
    setPendingSelection({ type: 'character_media', mediaId: media.id });
    setPendingMedia(media);
  };

  const handleFluxerSelect = () => {
    setPendingSelection({ type: 'fluxer' });
    setPendingMedia(null);
  };

  const handleConfirm = () => {
    if (!pendingSelection) return;
    onSelect(pendingSelection.type, pendingSelection.mediaId);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Profile Picture"
      size="xl"
      padding={0}
      radius="md"
      overlayProps={{ backgroundOpacity: 0.75, blur: 4 }}
      styles={{
        header: {
          background: 'linear-gradient(180deg, #17090d 0%, #111 100%)',
          borderBottom: '1px solid #1e1e1e',
          padding: '14px 20px',
        },
        title: { fontSize: '13px', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' },
        body: { padding: 0, display: 'flex', flexDirection: 'column' },
        content: { background: '#111', border: '1px solid #2a2a2a' },
      }}
    >
      <Tabs
        value={activeTab}
        onChange={v => v && setActiveTab(v)}
        styles={{
          root: { display: 'flex', flexDirection: 'column', flex: 1 },
          list: { background: '#111', borderBottom: '1px solid #1e1e1e', paddingLeft: 20 },
          tab: { fontSize: '12px', fontWeight: 600, color: '#666', letterSpacing: '.03em', paddingTop: 10, paddingBottom: 10 },
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="character_media">Characters</Tabs.Tab>
          <Tabs.Tab value="fluxer">Fluxer</Tabs.Tab>
          <Tabs.Tab
            value="exclusive_artwork"
            disabled={!isSupporter}
            rightSection={!isSupporter && (
              <Badge size="xs" variant="filled" color="yellow" style={{ marginLeft: 4 }}>SUPPORTER</Badge>
            )}
          >
            ✦ Exclusive
          </Tabs.Tab>
        </Tabs.List>

        {/* ── CHARACTERS TAB ── */}
        <Tabs.Panel value="character_media">
          <CharactersTab
            characterGroups={characterGroups}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={setSelectedCharacterId}
            selectedGroup={selectedGroup}
            pendingMediaId={pendingSelection?.type === 'character_media' ? pendingSelection.mediaId : undefined}
            onImageSelect={handleImageSelect}
            characterFilter={characterFilter}
            onFilterChange={setCharacterFilter}
            mediaLoading={mediaLoading}
            user={user}
            pendingMedia={pendingMedia}
            pendingType={pendingSelection?.type ?? null}
          />
        </Tabs.Panel>

        {/* ── FLUXER TAB ── */}
        <Tabs.Panel value="fluxer">
          <FluxerTab
            user={user}
            onSelect={handleFluxerSelect}
            isSelected={pendingSelection?.type === 'fluxer'}
            pendingMedia={null}
            pendingType={pendingSelection?.type ?? null}
          />
        </Tabs.Panel>

        {/* ── EXCLUSIVE TAB ── */}
        <Tabs.Panel value="exclusive_artwork">
          <ExclusiveTab isSupporter={isSupporter} />
        </Tabs.Panel>
      </Tabs>

      {/* ── FOOTER ── */}
      <Group
        justify="space-between"
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #1e1e1e',
          background: '#0d0d0d',
          flexShrink: 0,
        }}
      >
        <Text size="xs" c="dimmed">Click an image to preview · Confirm to save</Text>
        <Group gap="sm">
          <Button variant="subtle" color="gray" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!pendingSelection}
            onClick={handleConfirm}
            style={{ background: pendingSelection ? '#e11d48' : undefined }}
          >
            Confirm Selection
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}

// ─── Sub-components defined below ────────────────────────────────────────────

// Placeholder — filled in subsequent tasks
function CharactersTab(props: any) {
  return <Box p="md"><Text c="dimmed" size="sm">Characters tab — coming soon</Text></Box>;
}

function FluxerTab(props: any) {
  return <Box p="md"><Text c="dimmed" size="sm">Fluxer tab — coming soon</Text></Box>;
}

function ExclusiveTab({ isSupporter }: { isSupporter: boolean }) {
  return <Box p="md"><Text c="dimmed" size="sm">Exclusive tab — coming soon</Text></Box>;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -30
```

Expected: no errors. The `ProfilePictureSelector` now exports with the new props signature and `ProfilePageClient` usage should compile.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ProfilePictureSelector.tsx
git commit -m "feat: profile picture selector modal shell with tabs and state"
```

---

## Task 3: Characters Tab — Character List (left panel)

**Files:**
- Modify: `client/src/components/ProfilePictureSelector.tsx`

- [ ] **Step 1: Replace the `CharactersTab` placeholder with the full three-column layout**

Replace the `function CharactersTab(props: any)` placeholder with:

```tsx
interface CharactersTabProps {
  characterGroups: Array<{ id: number; name: string; medias: any[] }>;
  selectedCharacterId: number | null;
  onSelectCharacter: (id: number) => void;
  selectedGroup: { id: number; name: string; medias: any[] } | null;
  pendingMediaId: number | undefined;
  onImageSelect: (media: any) => void;
  characterFilter: string;
  onFilterChange: (v: string) => void;
  mediaLoading: boolean;
  user: User;
  pendingMedia: any | null;
  pendingType: string | null;
}

function CharactersTab({
  characterGroups,
  selectedCharacterId,
  onSelectCharacter,
  selectedGroup,
  pendingMediaId,
  onImageSelect,
  characterFilter,
  onFilterChange,
  mediaLoading,
  user,
  pendingMedia,
  pendingType,
}: CharactersTabProps) {
  return (
    <Box style={{ display: 'flex', height: 420, overflow: 'hidden' }}>
      {/* ── LEFT: Character list ── */}
      <Box
        style={{
          width: 180,
          flexShrink: 0,
          borderRight: '1px solid #1e1e1e',
          background: '#0d0d0d',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box style={{ padding: '10px 10px 8px', borderBottom: '1px solid #1e1e1e', flexShrink: 0 }}>
          <TextInput
            placeholder="Search characters…"
            value={characterFilter}
            onChange={e => onFilterChange(e.currentTarget.value)}
            size="xs"
            styles={{
              input: { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', fontSize: '11px' },
            }}
          />
        </Box>
        <ScrollArea style={{ flex: 1 }}>
          <Stack gap={2} p="xs">
            {mediaLoading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={40} radius="sm" />)
              : characterGroups.map(group => (
                  <CharacterListItem
                    key={group.id}
                    group={group}
                    isActive={selectedCharacterId === group.id}
                    onSelect={() => onSelectCharacter(group.id)}
                  />
                ))}
            {!mediaLoading && characterGroups.length === 0 && (
              <Text size="xs" c="dimmed" ta="center" p="md">No characters found</Text>
            )}
          </Stack>
        </ScrollArea>
      </Box>

      {/* ── CENTER + RIGHT: image grid + preview ── */}
      <Box style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ImageGridPanel
          group={selectedGroup}
          pendingMediaId={pendingMediaId}
          onImageSelect={onImageSelect}
          mediaLoading={mediaLoading}
        />
        <PreviewPanel
          user={user}
          pendingMedia={pendingMedia}
          pendingType={pendingType}
        />
      </Box>
    </Box>
  );
}

function CharacterListItem({
  group,
  isActive,
  onSelect,
}: {
  group: { id: number; name: string; medias: any[] };
  isActive: boolean;
  onSelect: () => void;
}) {
  const firstMedia = group.medias[0];
  return (
    <Box
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: isActive ? '6px 8px 6px 6px' : '6px 8px',
        borderRadius: 5,
        cursor: 'pointer',
        background: isActive ? 'rgba(225,29,72,0.08)' : 'transparent',
        borderLeft: isActive ? '2px solid #e11d48' : '2px solid transparent',
        transition: 'all .12s ease',
      }}
    >
      <Avatar
        src={firstMedia?.url}
        size={28}
        radius="sm"
        styles={{ root: { background: '#222', flexShrink: 0 } }}
      />
      <Text
        size="xs"
        fw={500}
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: isActive ? '#e11d48' : '#ccc',
        }}
      >
        {group.name}
      </Text>
      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
        {group.medias.length}
      </Text>
    </Box>
  );
}

// Placeholders for next tasks
function ImageGridPanel(props: any) {
  return <Box style={{ flex: 1, padding: 12 }}><Text c="dimmed" size="sm">Image grid — coming soon</Text></Box>;
}

function PreviewPanel(props: any) {
  return (
    <Box style={{ width: 200, flexShrink: 0, borderLeft: '1px solid #1e1e1e', background: '#0d0d0d', padding: 12 }}>
      <Text size="xs" c="dimmed">Preview — coming soon</Text>
    </Box>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ProfilePictureSelector.tsx
git commit -m "feat: character list panel with search and thumbnail rows"
```

---

## Task 4: Characters Tab — Image Grid (center panel)

**Files:**
- Modify: `client/src/components/ProfilePictureSelector.tsx`

- [ ] **Step 1: Replace the `ImageGridPanel` placeholder**

```tsx
function ImageGridPanel({
  group,
  pendingMediaId,
  onImageSelect,
  mediaLoading,
}: {
  group: { id: number; name: string; medias: any[] } | null;
  pendingMediaId: number | undefined;
  onImageSelect: (media: any) => void;
  mediaLoading: boolean;
}) {
  if (mediaLoading) {
    return (
      <Box style={{ flex: 1, padding: 12, overflow: 'auto' }}>
        <SimpleGrid cols={3} spacing="sm">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={120} radius="sm" />)}
        </SimpleGrid>
      </Box>
    );
  }

  if (!group) {
    return (
      <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text size="sm" c="dimmed">Select a character</Text>
      </Box>
    );
  }

  return (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box style={{ padding: '10px 14px 8px', borderBottom: '1px solid #1e1e1e', flexShrink: 0 }}>
        <Group justify="space-between">
          <Text size="sm" fw={700}>{group.name}</Text>
          <Text size="xs" c="dimmed">{group.medias.length} image{group.medias.length !== 1 ? 's' : ''}</Text>
        </Group>
      </Box>

      <ScrollArea style={{ flex: 1 }}>
        <SimpleGrid cols={3} spacing="sm" p="sm">
          {group.medias.map(media => (
            <ImageCard
              key={media.id}
              media={media}
              isSelected={pendingMediaId === media.id}
              onSelect={() => onImageSelect(media)}
            />
          ))}
        </SimpleGrid>
      </ScrollArea>
    </Box>
  );
}

function ImageCard({
  media,
  isSelected,
  onSelect,
}: {
  media: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const spoilerChapter = media.chapterNumber || media.character?.firstAppearanceChapter;

  return (
    <Box
      onClick={onSelect}
      style={{
        position: 'relative',
        borderRadius: 8,
        cursor: 'pointer',
        border: `2px solid ${isSelected ? '#e11d48' : 'transparent'}`,
        transition: 'border-color .15s ease',
        aspectRatio: '3/4',
        overflow: 'hidden',
        background: '#1a1a1a',
      }}
    >
      <TimelineSpoilerWrapper chapterNumber={spoilerChapter}>
        <Box
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${media.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </TimelineSpoilerWrapper>

      {/* Chapter badge */}
      {media.chapterNumber && (
        <Badge
          size="xs"
          variant="filled"
          style={{
            position: 'absolute',
            top: 6, right: 6,
            background: 'rgba(225,29,72,0.85)',
            color: '#fff',
            fontSize: '9px',
            fontWeight: 700,
            pointerEvents: 'none',
          }}
        >
          Ch.{media.chapterNumber}
        </Badge>
      )}

      {/* Selected overlay */}
      {isSelected && (
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(225,29,72,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
          }}
        >
          <Box
            style={{
              width: 24, height: 24,
              background: '#e11d48',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 900,
            }}
          >
            ✓
          </Box>
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ProfilePictureSelector.tsx
git commit -m "feat: image grid panel with spoiler handling and selection state"
```

---

## Task 5: Preview Panel (right column)

**Files:**
- Modify: `client/src/components/ProfilePictureSelector.tsx`

- [ ] **Step 1: Replace the `PreviewPanel` placeholder**

The preview shows a mini version of the real profile header. When `pendingType === 'character_media'` and `pendingMedia` is set, it renders the character image as the avatar. When `pendingType === 'fluxer'`, it shows the Fluxer avatar. Otherwise falls back to current selection or username initial.

```tsx
function PreviewPanel({
  user,
  pendingMedia,
  pendingType,
}: {
  user: User;
  pendingMedia: any | null;
  pendingType: string | null;
}) {
  const getPreviewAvatarUrl = (): string | null => {
    if (pendingType === 'character_media' && pendingMedia?.url) return pendingMedia.url;
    if (pendingType === 'fluxer' && user.fluxerAvatar) {
      return user.fluxerAvatar.startsWith('http')
        ? user.fluxerAvatar
        : `https://fluxerusercontent.com/avatars/${user.fluxerId}/${user.fluxerAvatar}.png?size=256`;
    }
    return null;
  };

  const avatarUrl = getPreviewAvatarUrl();
  const fallbackLetter = user.username?.[0]?.toUpperCase() ?? '';

  const selectionLabel = pendingType === 'character_media' && pendingMedia
    ? pendingMedia.character?.name ?? 'Unknown Character'
    : pendingType === 'fluxer'
    ? 'Fluxer Avatar'
    : null;

  const selectionSub = pendingType === 'character_media' && pendingMedia?.chapterNumber
    ? `Ch.${pendingMedia.chapterNumber} · Character Media`
    : pendingType === 'character_media' && pendingMedia
    ? 'Character Media'
    : null;

  return (
    <Box
      style={{
        width: 200,
        flexShrink: 0,
        borderLeft: '1px solid #1e1e1e',
        background: '#0d0d0d',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Label */}
      <Box style={{ padding: '10px 14px 8px', borderBottom: '1px solid #1e1e1e', flexShrink: 0 }}>
        <Text size="xs" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Live Preview
        </Text>
      </Box>

      <Box style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Mini profile header */}
        <Box style={{ background: 'linear-gradient(180deg, #100508 0%, #0a0a0a 100%)', border: '1px solid #1e1e1e', borderRadius: 8, overflow: 'hidden' }}>
          {/* Accent bar */}
          <Box style={{ height: 2, background: 'linear-gradient(90deg, #e11d48 0%, rgba(124,58,237,0.4) 55%, transparent 100%)' }} />
          {/* Avatar + name */}
          <Box style={{ padding: '10px 10px 6px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Avatar
              src={avatarUrl ?? undefined}
              size={40}
              radius="sm"
              styles={{ root: { background: '#e11d48', border: '1px solid #2a2a2a', flexShrink: 0 } }}
            >
              {fallbackLetter}
            </Avatar>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text
                size="xs"
                fw={900}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#f5f5f5' }}
              >
                {user.username}
              </Text>
              <Text size="xs" style={{ color: '#e11d48', fontSize: 9 }}>
                {user.role ?? 'Member'}
              </Text>
            </Box>
          </Box>
          {/* Stat strip */}
          <Box style={{ display: 'flex', borderTop: '1px solid #1e1e1e' }}>
            {[
              { label: 'Guides', val: '—' },
              { label: 'Media', val: '—' },
              { label: 'Read', val: '—' },
            ].map((s, i, arr) => (
              <Box
                key={s.label}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '5px 0',
                  borderRight: i < arr.length - 1 ? '1px solid #1e1e1e' : 'none',
                }}
              >
                <Text size="xs" fw={700} c="dimmed" style={{ display: 'block', lineHeight: 1, marginBottom: 1 }}>{s.val}</Text>
                <Text size="xs" c="dimmed" style={{ fontSize: 8 }}>{s.label}</Text>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Selection info card */}
        {selectionLabel ? (
          <Box
            style={{
              background: '#1a0a0e',
              border: '1px solid rgba(225,29,72,0.2)',
              borderRadius: 6,
              padding: '8px 10px',
            }}
          >
            <Text size="xs" fw={700} style={{ color: '#e11d48' }}>{selectionLabel}</Text>
            {selectionSub && <Text size="xs" c="dimmed" mt={2}>{selectionSub}</Text>}
          </Box>
        ) : (
          <Text size="xs" c="dimmed" ta="center">Nothing selected yet</Text>
        )}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ProfilePictureSelector.tsx
git commit -m "feat: live preview panel for profile picture modal"
```

---

## Task 6: Fluxer Tab

**Files:**
- Modify: `client/src/components/ProfilePictureSelector.tsx`

- [ ] **Step 1: Replace the `FluxerTab` placeholder**

`FluxerTab` uses an **explicit click** to set the pending selection — switching to the tab does NOT auto-select. The user must click the avatar to confirm they want Fluxer. This matches the spec's "clicking this tab sets pendingSelection" intent (tab-switch = navigate to the option, click = select it). The `PreviewPanel` component from Task 5 is reused here on the right side, identical to its use in `CharactersTab`.

```tsx
interface FluxerTabProps {
  user: User;
  onSelect: () => void;
  isSelected: boolean;
  pendingMedia: any | null;
  pendingType: string | null;
}

function FluxerTab({ user, onSelect, isSelected, pendingMedia, pendingType }: FluxerTabProps) {
  const hasFluxer = !!user.fluxerAvatar;
  const fluxerUrl = hasFluxer
    ? user.fluxerAvatar!.startsWith('http')
      ? user.fluxerAvatar!
      : `https://fluxerusercontent.com/avatars/${user.fluxerId}/${user.fluxerAvatar}.png?size=256`
    : null;

  return (
    <Box style={{ display: 'flex', height: 420 }}>
      {/* Main content area */}
      <Box
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        {hasFluxer ? (
          <Stack align="center" gap="lg">
            <Box
              onClick={onSelect}
              style={{
                cursor: 'pointer',
                border: `3px solid ${isSelected ? '#e11d48' : '#2a2a2a'}`,
                borderRadius: 12,
                padding: 4,
                transition: 'border-color .15s ease',
              }}
            >
              <Avatar src={fluxerUrl!} size={120} radius="md" />
            </Box>
            <Stack align="center" gap={4}>
              <Text fw={600} size="sm">{user.username}</Text>
              <Text size="xs" c="dimmed">Click avatar to use your Fluxer profile picture</Text>
            </Stack>
            {isSelected && (
              <Badge variant="filled" color="red" size="sm">Selected — confirm below to save</Badge>
            )}
          </Stack>
        ) : (
          <Alert variant="light" color="red" title="No Fluxer Account Linked">
            <Text size="sm">
              Link your Fluxer account in Settings to use your Fluxer avatar as your profile picture.
            </Text>
          </Alert>
        )}
      </Box>

      {/* Reuse the same PreviewPanel component as CharactersTab */}
      <PreviewPanel
        user={user}
        pendingMedia={pendingMedia}
        pendingType={pendingType}
      />
    </Box>
  );
}
```

Note: `user.fluxerUsername` may not exist on the `User` type — use `user.username` as the fallback (checked in Implementation Notes). Do not introduce a compile error here; just use `user.username`.

- [ ] **Step 2: Update the `FluxerTab` usage in the main JSX to pass `pendingMedia` and `pendingType`**

In the `<Tabs.Panel value="fluxer">` section of the main `ProfilePictureSelector` JSX, update the props passed to `FluxerTab`:

```tsx
<Tabs.Panel value="fluxer">
  <FluxerTab
    user={user}
    onSelect={handleFluxerSelect}
    isSelected={pendingSelection?.type === 'fluxer'}
    pendingMedia={pendingMedia}
    pendingType={pendingSelection?.type ?? null}
  />
</Tabs.Panel>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ProfilePictureSelector.tsx
git commit -m "feat: Fluxer tab with explicit click selection and live preview panel"
```

---

## Task 7: Exclusive Artwork Tab

**Files:**
- Modify: `client/src/components/ProfilePictureSelector.tsx`

- [ ] **Step 1: Replace `ExclusiveTab` placeholder**

```tsx
function ExclusiveTab({ isSupporter }: { isSupporter: boolean }) {
  if (!isSupporter) {
    return (
      <Box
        style={{
          height: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <Stack align="center" gap="lg" style={{ maxWidth: 320 }}>
          <Text size="xl" ta="center">✦</Text>
          <Text fw={700} size="lg" ta="center">Supporter Exclusive</Text>
          <Text size="sm" c="dimmed" ta="center">
            Exclusive artwork profile pictures are available to supporters.
            Support the database to unlock this feature and more!
          </Text>
          <Button
            component="a"
            href="https://ko-fi.com/ninjaruss"
            target="_blank"
            rel="noopener noreferrer"
            variant="filled"
            color="yellow"
            size="sm"
          >
            ☕ Support on Ko-fi
          </Button>
        </Stack>
      </Box>
    );
  }

  // Supporter: show "coming soon" — exclusive artwork media not yet in DB
  return (
    <Box
      style={{
        height: 420,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <Stack align="center" gap="md">
        <Badge variant="filled" color="yellow" size="lg">✦ SUPPORTER</Badge>
        <Text size="sm" c="dimmed" ta="center">
          Exclusive artwork will appear here when available. Thank you for your support!
        </Text>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ProfilePictureSelector.tsx
git commit -m "feat: exclusive artwork tab with supporter gate and Ko-fi CTA"
```

---

## Task 8: Final wiring, lint, and manual smoke test

**Files:**
- Modify: `client/src/components/ProfilePictureSelector.tsx` (any final fixes)

- [ ] **Step 1: Run lint on both modified files**

```bash
cd client && yarn lint 2>&1 | grep -E "(ProfilePictureSelector|ProfilePageClient)"
```

Fix any reported lint errors (unused imports, missing deps in hooks, etc.).

- [ ] **Step 2: Run full build**

```bash
cd client && yarn build 2>&1 | tail -30
```

Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 3: Manual smoke test**

Start dev server: `cd client && yarn dev`

1. Log in to the app
2. Go to `/profile`
3. Click the avatar — a modal should open with "Profile Picture" title
4. Characters tab: character list appears on the left, images on the right, preview panel on the right edge
5. Click a character in the list → images update in center
6. Click an image → preview avatar updates, "Confirm Selection" button becomes enabled
7. Click "Confirm Selection" → modal closes, profile avatar updates on the page
8. Re-open modal → click "Fluxer" tab → Fluxer avatar shown; then **click the avatar** to select it → preview updates, Confirm button enables
9. Click "Cancel" → modal closes, nothing changes
10. If not a supporter, "✦ Exclusive" tab should be disabled with SUPPORTER badge

- [ ] **Step 4: Commit final state**

```bash
git add client/src/components/ProfilePictureSelector.tsx
git commit -m "feat: complete profile picture modal with all tabs wired up"
```

---

## Implementation Notes

- **`user.fluxerUsername`** — check if this field exists on the `User` type in `AuthProvider.tsx`. If not, fall back to `user.fluxerAvatar` presence check only.
- **`selectedCharacterId` auto-select** — if the user already has `currentSelectedMediaId`, consider pre-selecting the matching character and marking that image as pending. This is a polish improvement: skip it if it adds complexity.
- **Spoiler handling** — `TimelineSpoilerWrapper` uses the reading progress from context automatically. No additional wiring needed.
- **`handleProfilePictureSelect` in ProfilePageClient** calls `closeProfilePictureSelector()` before the API call (line 188). This is intentional optimistic behavior — the modal closes immediately on confirm.
