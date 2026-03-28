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
  onToggleSettings: () => void
  isSettingsOpen: boolean
}

export default function ProfileHeader({
  user,
  stats,
  onOpenProfilePictureSelector,
  onSaveUsername,
  onToggleSettings,
  isSettingsOpen,
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
                userRole={user?.role as 'admin' | 'moderator' | 'editor' | 'user'}
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
          <Text style={{ fontSize: '13px', color: '#555', letterSpacing: '0.06em', fontFamily: 'monospace', lineHeight: 1.9 }}>
            #{caseRef}<br />
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
            <Text style={{ fontSize: '22px', fontWeight: 800, color: stat.accent ? '#e11d48' : '#bbb', lineHeight: 1, marginBottom: '2px', display: 'block' }}>
              {stat.value}
            </Text>
            <Text style={{ fontSize: '14px', color: '#888' }}>{stat.label}</Text>
          </Box>
        ))}
        <Box style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <ActionIcon
            size="lg"
            variant={isSettingsOpen ? 'filled' : 'default'}
            onClick={onToggleSettings}
            aria-label={isSettingsOpen ? 'Close settings' : 'Open settings'}
            title={isSettingsOpen ? 'Close settings' : 'Settings'}
            style={{
              width: 38,
              height: 38,
              color: isSettingsOpen ? '#fff' : '#ccc',
              background: isSettingsOpen ? outlineStyles.accentColor : '#1e1e1e',
              border: isSettingsOpen ? 'none' : '1px solid #3a3a3a',
              borderRadius: 8,
              transition: 'all 0.15s ease',
              boxShadow: isSettingsOpen ? `0 0 12px ${outlineStyles.accentColor}55` : 'none',
            }}
          >
            {isSettingsOpen ? <X size={18} /> : <Settings size={18} />}
          </ActionIcon>
        </Box>
      </Group>
    </Box>
  )
}
