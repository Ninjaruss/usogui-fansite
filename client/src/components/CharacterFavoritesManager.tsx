'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  Text,
  Stack,
  Group,
  ActionIcon,
  TextInput,
  Button,
  Loader,
  Badge,
  useMantineTheme,
  rgba,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { Star, X, Plus, Search } from 'lucide-react'
import { api } from '../lib/api'

interface FavoriteCharacterItem {
  id: number
  characterId: number
  userId: number
  isPrimary: boolean
  sortOrder: number
  createdAt: string
  character: {
    id: number
    name: string
    alternateNames?: string[] | null
    firstAppearanceChapter?: number | null
  }
}

interface PendingFavorite {
  characterId: number
  name: string
  isPrimary: boolean
  sortOrder: number
}

interface CharacterSearchResult {
  id: number
  name: string
}

export default function CharacterFavoritesManager() {
  const theme = useMantineTheme()
  const accent = theme.other?.usogui?.red || theme.colors.red[5]
  const characterColor = theme.other?.usogui?.character || theme.colors.blue?.[6] || accent
  const surface = theme.other?.usogui?.black || '#0a0a0a'

  const withAlpha = (color: string, alpha: number, fallback: string) => {
    try {
      return rgba(color, alpha)
    } catch {
      return fallback
    }
  }

  const borderColor = withAlpha(characterColor, 0.22, 'rgba(59, 130, 246, 0.22)')
  const subtleText = withAlpha('#ffffff', 0.6, 'rgba(255, 255, 255, 0.6)')

  const [pendingFavorites, setPendingFavorites] = useState<PendingFavorite[]>([])
  const [savedFavorites, setSavedFavorites] = useState<PendingFavorite[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CharacterSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const [debouncedSearch] = useDebouncedValue(searchQuery, 300)

  const isDirty = JSON.stringify(pendingFavorites) !== JSON.stringify(savedFavorites)

  // Load initial favorites
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const rawData = await api.getMyFavoriteCharacters()
        const data = Array.isArray(rawData) ? rawData : ((rawData as any)?.data ?? [])
        const mapped: PendingFavorite[] = data.map((item: FavoriteCharacterItem) => ({
          characterId: item.characterId,
          name: item.character.name,
          isPrimary: item.isPrimary,
          sortOrder: item.sortOrder,
        }))
        setPendingFavorites(mapped)
        setSavedFavorites(mapped)
      } catch (err) {
        console.error('Failed to load favorite characters:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Debounced character search
  useEffect(() => {
    if (!debouncedSearch.trim() || !searchOpen) {
      setSearchResults([])
      return
    }

    const search = async () => {
      try {
        setSearching(true)
        const result = await api.getCharacters({ name: debouncedSearch, limit: 8 })
        const alreadyAdded = new Set(pendingFavorites.map((f) => f.characterId))
        setSearchResults(
          (result.data || [])
            .filter((c: CharacterSearchResult) => !alreadyAdded.has(c.id))
            .map((c: CharacterSearchResult) => ({ id: c.id, name: c.name }))
        )
      } catch (err) {
        console.error('Character search failed:', err)
      } finally {
        setSearching(false)
      }
    }

    search()
  }, [debouncedSearch, searchOpen, pendingFavorites])

  const addCharacter = useCallback((character: CharacterSearchResult) => {
    if (pendingFavorites.length >= 5) return

    const nextOrder = pendingFavorites.length + 1
    const isFirstAndPrimary = pendingFavorites.length === 0

    setPendingFavorites((prev) => [
      ...prev,
      {
        characterId: character.id,
        name: character.name,
        isPrimary: isFirstAndPrimary,
        sortOrder: nextOrder,
      },
    ])

    setSearchQuery('')
    setSearchResults([])
    setSearchOpen(false)
  }, [pendingFavorites])

  const removeCharacter = useCallback((characterId: number) => {
    setPendingFavorites((prev) => {
      const filtered = prev.filter((f) => f.characterId !== characterId)
      // Re-number sortOrder
      const renumbered = filtered.map((f, i) => ({ ...f, sortOrder: i + 1 }))
      // If the removed one was primary and there are remaining entries, assign primary to first
      const wasPrimary = prev.find((f) => f.characterId === characterId)?.isPrimary
      if (wasPrimary && renumbered.length > 0 && !renumbered.some((f) => f.isPrimary)) {
        renumbered[0] = { ...renumbered[0], isPrimary: true }
      }
      return renumbered
    })
  }, [])

  const setPrimary = useCallback((characterId: number) => {
    setPendingFavorites((prev) =>
      prev.map((f) => ({ ...f, isPrimary: f.characterId === characterId }))
    )
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      const rawSaved = await api.setFavoriteCharacters(
        pendingFavorites.map((f) => ({
          characterId: f.characterId,
          isPrimary: f.isPrimary,
          sortOrder: f.sortOrder,
        }))
      )
      const saved = Array.isArray(rawSaved) ? rawSaved : ((rawSaved as any)?.data ?? [])
      const mapped: PendingFavorite[] = saved.map((item: FavoriteCharacterItem) => ({
        characterId: item.characterId,
        name: item.character.name,
        isPrimary: item.isPrimary,
        sortOrder: item.sortOrder,
      }))
      setSavedFavorites(mapped)
      setPendingFavorites(mapped)
      notifications.show({
        title: 'Saved',
        message: 'Your favorite characters have been updated.',
        color: 'green',
      })
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err?.message || 'Failed to save favorite characters.',
        color: 'red',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Group justify="center" py="md">
        <Loader size="sm" />
      </Group>
    )
  }

  return (
    <Stack gap="md">
      <Text size="sm" style={{ color: subtleText }}>
        Add up to 5 favorite characters. Star one as your primary favorite.
      </Text>

      {/* Current favorites list */}
      <Stack gap="xs">
        {pendingFavorites.map((fav) => (
          <Card
            key={fav.characterId}
            withBorder
            padding="sm"
            className="hoverable-card"
            style={{
              backgroundColor: withAlpha(surface, 0.85, surface),
              border: `1px solid ${borderColor}`,
            }}
          >
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ActionIcon
                  variant={fav.isPrimary ? 'filled' : 'subtle'}
                  color={fav.isPrimary ? 'yellow' : 'gray'}
                  size="sm"
                  onClick={() => setPrimary(fav.characterId)}
                  title={fav.isPrimary ? 'Primary favorite' : 'Set as primary'}
                  style={fav.isPrimary ? { filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.6))' } : undefined}
                >
                  <Star size={14} fill={fav.isPrimary ? 'currentColor' : 'none'} />
                </ActionIcon>
                <Text
                  size="sm"
                  fw={fav.isPrimary ? 700 : 400}
                  style={fav.isPrimary ? { fontFamily: 'var(--font-opti-goudy-text)' } : undefined}
                >
                  {fav.name}
                </Text>
                {fav.isPrimary && (
                  <Badge size="xs" color="yellow" variant="light">
                    Primary
                  </Badge>
                )}
              </Group>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => removeCharacter(fav.characterId)}
                title="Remove"
              >
                <X size={14} />
              </ActionIcon>
            </Group>
          </Card>
        ))}

        {/* Empty slots */}
        {pendingFavorites.length < 5 && (
          <Box>
            {!searchOpen ? (
              <Button
                variant="subtle"
                size="xs"
                leftSection={<Plus size={14} />}
                onClick={() => setSearchOpen(true)}
                style={{ color: characterColor }}
              >
                Add character ({pendingFavorites.length}/5)
              </Button>
            ) : (
              <Card
                withBorder
                padding="sm"
                style={{
                  backgroundColor: withAlpha(surface, 0.6, surface),
                  border: `1px solid ${borderColor}`,
                }}
              >
                <Stack gap="xs">
                  <Group>
                    <TextInput
                      placeholder="Search characters..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftSection={<Search size={14} />}
                      rightSection={searching ? <Loader size="xs" /> : null}
                      size="xs"
                      style={{ flex: 1 }}
                      autoFocus
                    />
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => {
                        setSearchOpen(false)
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                    >
                      <X size={14} />
                    </ActionIcon>
                  </Group>

                  {searchResults.length > 0 && (
                    <Stack gap={4}>
                      {searchResults.map((character) => (
                        <Button
                          key={character.id}
                          variant="subtle"
                          size="xs"
                          justify="start"
                          onClick={() => addCharacter(character)}
                          style={{ color: '#fff', transition: 'background 150ms ease' }}
                          styles={{
                            root: {
                              '&:hover': { backgroundColor: 'rgba(77,171,247,0.08)' }
                            }
                          }}
                        >
                          {character.name}
                        </Button>
                      ))}
                    </Stack>
                  )}

                  {debouncedSearch.trim() && !searching && searchResults.length === 0 && (
                    <Text size="xs" style={{ color: subtleText }}>
                      No characters found
                    </Text>
                  )}
                </Stack>
              </Card>
            )}
          </Box>
        )}
      </Stack>

      {/* Save button */}
      {isDirty && (
        <Button
          size="sm"
          loading={saving}
          onClick={handleSave}
          style={{ backgroundColor: characterColor, alignSelf: 'flex-start' }}
        >
          Save Changes
        </Button>
      )}
    </Stack>
  )
}
