'use client'

import {
  Box,
  Card,
  Text,
  Grid,
  Badge,
  Stack,
  Group,
  Avatar,
  Image,
  Tooltip,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { getEntityThemeColor } from '../lib/mantine-theme'
import { Heart, Crown, Trophy, User } from 'lucide-react'
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

  const borderColor = withAlpha(characterColor, 0.22, 'rgba(59, 130, 246, 0.22)')
  const softSurface = withAlpha(surface, 0.92, surface)
  const subtleText = withAlpha('#ffffff', 0.7, 'rgba(255, 255, 255, 0.7)')

  const { mostFavorited, mostPrimary, mostLoyal } = data
  const hasAnyData = mostFavorited.length > 0 || mostPrimary.length > 0 || mostLoyal.length > 0

  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: softSurface,
    border: `1px solid ${borderColor}`,
  }

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
          style={{ border: `2px solid ${borderColor}`, flexShrink: 0 }}
        />
      )
    }
    return (
      <Avatar
        size={size}
        radius="sm"
        color="blue"
        style={{ border: `2px solid ${borderColor}`, flexShrink: 0 }}
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
    description: string,
    delay: number,
  ) => (
    <Grid.Col span={{ base: 12, md: 4 }}>
      <Card style={cardStyle}>
        <Box style={{ flexGrow: 1 }}>
          <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <Group justify="center" gap="xs" style={{ marginBottom: '0.5rem' }}>
              {icon}
              <Text fw={700} size="lg">{title}</Text>
            </Group>
            <Text size="xs" style={{ color: subtleText }}>{description}</Text>
          </Box>

          {items.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay }}
            >
              <Group align="flex-start" gap="md" wrap="nowrap">
                {/* Winner */}
                <Link
                  href={`/characters/${items[0].character.id}`}
                  style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}
                >
                  <Stack align="center" gap="xs">
                    {renderCharacterImage(items[0].character.entityImageUrl, items[0].character.name, 80)}
                    <Text fw={700} size="sm" ta="center" style={{ lineHeight: 1.2, color: '#fff' }}>
                      {items[0].character.name}
                    </Text>
                    <Badge variant="light" size="sm" style={{ color: getEntityThemeColor(theme, 'character') }}>
                      {getLabel(items[0])}
                    </Badge>
                  </Stack>
                </Link>

                {/* Runner-up */}
                {items[1] && (
                  <Link
                    href={`/characters/${items[1].character.id}`}
                    style={{ flex: 0.75, minWidth: 0, textDecoration: 'none', opacity: 0.55 }}
                  >
                    <Stack align="center" gap="xs">
                      {renderCharacterImage(items[1].character.entityImageUrl, items[1].character.name, 54)}
                      <Text fw={500} size="xs" ta="center" style={{ color: subtleText, lineHeight: 1.2 }}>
                        {items[1].character.name}
                      </Text>
                      <Badge variant="light" size="xs" style={{ color: subtleText }}>
                        {getLabel(items[1])}
                      </Badge>
                    </Stack>
                  </Link>
                )}
              </Group>
            </motion.div>
          ) : (
            <Card
              withBorder
              padding="sm"
              style={{
                backgroundColor: withAlpha(surface, 0.86, surface),
                border: `1px solid ${borderColor}`,
              }}
            >
              <Text size="sm" style={{ color: subtleText, textAlign: 'center' }}>
                Not enough data yet
              </Text>
            </Card>
          )}
        </Box>
      </Card>
    </Grid.Col>
  )

  return (
    <Box style={{ marginBottom: '3rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <Box style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Group justify="center" gap="xs" style={{ marginBottom: '0.75rem' }}>
            <Heart className="w-6 h-6" color={characterColor} />
            <Text fw={700} size="xl">
              Fan Favorite Characters
            </Text>
          </Group>
          <Text size="md" style={{ color: subtleText }}>
            Community-voted favorites across three categories
          </Text>
        </Box>

        <Grid gutter="xl">
          {renderCategory(
            mostFavorited,
            (item) => `${item.totalCount} fan${item.totalCount !== 1 ? 's' : ''}`,
            'Most Favorited',
            <Trophy className="w-5 h-5" color={characterColor} />,
            'Characters with the most fans',
            0.1,
          )}
          {renderCategory(
            mostPrimary,
            (item) => `${item.primaryCount} #1 pick${item.primaryCount !== 1 ? 's' : ''}`,
            'Fan Favorite #1',
            <Crown className="w-5 h-5" color={characterColor} />,
            "Most chosen as someone's #1",
            0.2,
          )}
          {renderCategory(
            mostLoyal,
            (item) => `${Math.round(item.loyaltyRatio * 100)}% chose as #1`,
            'Most Loyal Following',
            <Heart className="w-5 h-5" color={characterColor} />,
            'Highest % chosen as #1 (min. 3 fans)',
            0.3,
          )}
        </Grid>

        {!hasAnyData && (
          <Box style={{ textAlign: 'center', padding: '1rem 0' }}>
            <Text size="sm" style={{ color: subtleText }}>
              No character favorites yet. Set your favorites in your profile!
            </Text>
          </Box>
        )}
      </motion.div>
    </Box>
  )
}
