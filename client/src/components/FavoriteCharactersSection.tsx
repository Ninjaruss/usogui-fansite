'use client'

import {
  Box,
  Text,
  Grid,
  Badge,
  Group,
  Avatar,
  Image,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { getEntityThemeColor } from '../lib/mantine-theme'
import { Crown, Trophy, Heart, User } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { FavoriteCharacterStats } from '../hooks/useFavoritesData'

interface Props {
  data: FavoriteCharacterStats
}

export function FavoriteCharactersSection({ data }: Props) {
  const theme = useMantineTheme()
  const accent = theme.other?.usogui?.red || theme.colors.red[5]
  const surface = theme.other?.usogui?.black || '#0a0a0a'
  const characterColor = theme.other?.usogui?.character || theme.colors.blue?.[6] || accent

  const withAlpha = (color: string, alpha: number, fallback: string) => {
    try {
      return rgba(color, alpha)
    } catch {
      return fallback
    }
  }

  const borderColor = withAlpha(characterColor, 0.14, 'rgba(59, 130, 246, 0.14)')
  const softSurface = withAlpha(surface, 0.92, surface)
  const subtleText = withAlpha('#ffffff', 0.45, 'rgba(255, 255, 255, 0.45)')

  const { mostFavorited, mostPrimary, mostLoyal } = data
  const hasAnyData = mostFavorited.length > 0 || mostPrimary.length > 0 || mostLoyal.length > 0

  const renderCharacterImage = (
    entityImageUrl: string | null | undefined,
    name: string,
    size: number,
  ) => {
    if (entityImageUrl) {
      return (
        <Image
          src={entityImageUrl}
          alt={name}
          w={size}
          h={size}
          radius="sm"
          fit="cover"
          style={{ border: `1px solid ${borderColor}`, flexShrink: 0 }}
        />
      )
    }
    return (
      <Avatar
        size={size}
        radius="sm"
        color="blue"
        style={{ border: `1px solid ${borderColor}`, flexShrink: 0 }}
      >
        <User size={Math.round(size * 0.4)} />
      </Avatar>
    )
  }

  const renderCategory = (
    items: Array<{ character: { id: number; name: string; entityImageUrl?: string | null }; [key: string]: any }>,
    getLabel: (item: any) => string,
    title: string,
    icon: React.ReactNode,
    delay: number,
  ) => (
    <Grid.Col span={{ base: 12, sm: 4 }}>
      <Box
        style={{
          backgroundColor: softSurface,
          border: `1px solid ${borderColor}`,
          borderRadius: '0.625rem',
          padding: '0.875rem 0.75rem 0.625rem',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        {/* Top accent bar */}
        <Box aria-hidden style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: withAlpha(characterColor, 0.45, 'rgba(59,130,246,0.45)'),
          borderRadius: '0.625rem 0.625rem 0 0',
        }} />

        {/* Category heading */}
        <Group justify="center" gap={5} style={{ marginBottom: '0.625rem' }}>
          {icon}
          <Text style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: subtleText,
          }}>
            {title}
          </Text>
        </Group>

        {items.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
          >
            {/* Winner row */}
            <Link
              href={`/characters/${items[0].character.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Group
                gap={10}
                wrap="nowrap"
                style={{
                  padding: '0.5rem',
                  background: withAlpha(characterColor, 0.06, 'rgba(59,130,246,0.06)'),
                  border: `1px solid ${withAlpha(characterColor, 0.15, 'rgba(59,130,246,0.15)')}`,
                  borderRadius: '0.4375rem',
                  marginBottom: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                {renderCharacterImage(items[0].character.entityImageUrl, items[0].character.name, 44)}
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    fw={700}
                    style={{
                      fontSize: '0.75rem',
                      color: '#fff',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {items[0].character.name}
                  </Text>
                  <Text style={{ fontSize: '0.625rem', color: subtleText, marginTop: 2 }}>
                    {getLabel(items[0])}
                  </Text>
                </Box>
                <Badge
                  variant="light"
                  size="xs"
                  style={{
                    color: getEntityThemeColor(theme, 'character'),
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  #1
                </Badge>
              </Group>
            </Link>

            {/* Runner-up row */}
            {items[1] && (
              <Link
                href={`/characters/${items[1].character.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Group
                  gap={8}
                  wrap="nowrap"
                  style={{
                    padding: '0.3125rem 0.5rem',
                    borderRadius: '0.375rem',
                    opacity: 0.55,
                    cursor: 'pointer',
                  }}
                >
                  {renderCharacterImage(items[1].character.entityImageUrl, items[1].character.name, 30)}
                  <Text
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.7)',
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {items[1].character.name}
                  </Text>
                  <Text style={{ fontSize: '0.625rem', color: subtleText, whiteSpace: 'nowrap' }}>
                    {getLabel(items[1])}
                  </Text>
                </Group>
              </Link>
            )}
          </motion.div>
        ) : (
          <Text size="sm" style={{ color: subtleText, textAlign: 'center', padding: '0.5rem 0' }}>
            Not enough data yet
          </Text>
        )}
      </Box>
    </Grid.Col>
  )

  if (!hasAnyData) {
    return (
      <Box style={{ textAlign: 'center', padding: '1rem 0', marginBottom: '1rem' }}>
        <Text size="sm" style={{ color: subtleText }}>
          No character favorites yet. Set your favorites in your profile!
        </Text>
      </Box>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    >
      <Grid gutter="md">
        {renderCategory(
          mostFavorited,
          (item) => `${item.totalCount} fan${item.totalCount !== 1 ? 's' : ''}`,
          'Most Favorited',
          <Trophy size={16} color={characterColor} />,
          0.1,
        )}
        {renderCategory(
          mostPrimary,
          (item) => `${item.primaryCount} #1 pick${item.primaryCount !== 1 ? 's' : ''}`,
          'Fan Favorite #1',
          <Crown size={16} color={characterColor} />,
          0.2,
        )}
        {renderCategory(
          mostLoyal,
          (item) => `${Math.round(item.loyaltyRatio * 100)}% chose as #1`,
          'Most Loyal',
          <Heart size={16} color={characterColor} />,
          0.3,
        )}
      </Grid>
    </motion.div>
  )
}
