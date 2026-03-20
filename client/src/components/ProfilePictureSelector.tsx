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

function FluxerTab(props: any) {
  return <Box p="md"><Text c="dimmed" size="sm">Fluxer tab — coming soon</Text></Box>;
}

function ExclusiveTab({ isSupporter }: { isSupporter: boolean }) {
  return <Box p="md"><Text c="dimmed" size="sm">Exclusive tab — coming soon</Text></Box>;
}
