'use client'

import {
  Box,
  Card,
  Text,
  Grid,
  Badge,
  Avatar,
  Stack,
  Skeleton,
  Alert,
  Group,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors } from '../lib/mantine-theme'
import { Quote, Dices, User, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useFavoritesData } from '../hooks/useFavoritesData'

export function FavoritesSection() {
  const theme = useMantineTheme()
  const { data: favoritesData, loading, error } = useFavoritesData()

  const accent = theme.other?.usogui?.red || theme.colors.red[5]
  const surface = theme.other?.usogui?.black || '#0a0a0a'

  const withAlpha = (color: string, alpha: number, fallback: string) => {
    try {
      return rgba(color, alpha)
    } catch (error) {
      return fallback
    }
  }

  const borderColor = withAlpha(accent, 0.22, 'rgba(225, 29, 72, 0.22)')
  const softSurface = withAlpha(surface, 0.92, surface)
  const subtleText = withAlpha('#ffffff', 0.7, 'rgba(255, 255, 255, 0.7)')

  if (error) {
    return (
      <Alert variant="light" style={{ color: getEntityThemeColor(theme, 'gamble'), marginBottom: '1.5rem' }}>
        Unable to load favorites data. Please check your connection and try again.
      </Alert>
    )
  }

  if (loading) {
    return (
      <Box>
        <Skeleton height={40} width={300} style={{ marginBottom: '1.5rem' }} />
        <Grid gutter="xl">
          {[1, 2, 3].map((i) => (
            <Grid.Col span={{ base: 12, md: 4 }} key={i}>
              <Card style={{ backgroundColor: softSurface, border: `1px solid ${borderColor}` }}>
                <Stack gap="sm">
                  <Skeleton height={24} width="80%" />
                  <Skeleton height={60} />
                  <Skeleton height={24} width="40%" />
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Box>
    )
  }

  if (!favoritesData) {
    return null
  }

  const { favoriteQuotes, favoriteGambles, favoriteCharacterMedia } = favoritesData

  const renderCounter = (count: number) => (
    <Text size="xs" style={{ color: subtleText }}>
      {count} user{count !== 1 ? 's' : ''}
    </Text>
  )

  return (
    <Box style={{ marginBottom: '3rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Box style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Group justify="center" gap="xs" style={{ marginBottom: '0.75rem' }}>
            <TrendingUp className="w-6 h-6" color={theme.other?.usogui?.purple || accent} />
            <Text fw={700} size="xl">
              Community Favorites
            </Text>
          </Group>
          <Text size="md" style={{ color: subtleText }}>
            The most beloved content from our community
          </Text>
        </Box>

        <Grid gutter="xl">
          {favoriteCharacterMedia.length > 0 && (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: softSurface,
                  border: `1px solid ${borderColor}`
                }}
              >
                <Box style={{ flexGrow: 1 }}>
                  <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <Group justify="center" gap="xs" style={{ marginBottom: '0.5rem' }}>
                      <User className="w-6 h-6" color={theme.other?.usogui?.character || theme.colors.blue?.[6] || accent} />
                      <Text fw={700} size="xl">Popular Profile Pics</Text>
                    </Group>
                  </Box>
                  <Stack gap="md">
                    {favoriteCharacterMedia.map((item, index) => (
                      <motion.div
                        key={item.media.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card
                          withBorder
                          padding="md"
                          style={{
                            backgroundColor: withAlpha(surface, 0.86, surface),
                            border: `1px solid ${borderColor}`,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          component={Link}
                          href={`/characters/${item.media.character.id}`}
                        >
                          <Stack align="center" gap="sm">
                            <Avatar
                              src={item.media.url}
                              alt={item.media.character.name}
                              size={80}
                              radius="xl"
                              style={{
                                border: `2px solid ${theme.other?.usogui?.character || theme.colors.blue?.[6] || accent}`,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                              }}
                            />
                            <Box style={{ textAlign: 'center' }}>
                              <Text fw={700} size="md" style={{ marginBottom: '0.25rem' }}>
                                {item.media.character.name}
                              </Text>
                              {item.media.description && (
                                <Text
                                  size="xs"
                                  style={{
                                    color: subtleText,
                                    marginBottom: '0.5rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical'
                                  }}
                                >
                                  {item.media.description}
                                </Text>
                              )}
                              <Group justify="center" gap="xs">
                                <Badge variant="light" size="sm" style={{ color: getEntityThemeColor(theme, 'gamble') }}>
                                  Ch. {item.media.chapterNumber || 'N/A'}
                                </Badge>
                                <Text size="xs" style={{ color: subtleText }}>
                                  {item.userCount} user{item.userCount !== 1 ? 's' : ''}
                                </Text>
                              </Group>
                            </Box>
                          </Stack>
                        </Card>
                      </motion.div>
                    ))}
                  </Stack>
                </Box>
              </Card>
            </Grid.Col>
          )}

          {favoriteQuotes.length > 0 && (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: softSurface,
                  border: `1px solid ${borderColor}`
                }}
              >
                <Box style={{ flexGrow: 1 }}>
                  <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <Group justify="center" gap="xs" style={{ marginBottom: '0.5rem' }}>
                      <Quote className="w-6 h-6" color={theme.other?.usogui?.quote || theme.colors.green?.[5] || '#4ade80'} />
                      <Text fw={700} size="xl">Top Quotes</Text>
                    </Group>
                  </Box>
                  <Stack gap="sm">
                    {favoriteQuotes.map((item, index) => (
                      <motion.div
                        key={item.quote.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card
                          withBorder
                          padding="sm"
                          style={{
                            backgroundColor: withAlpha(surface, 0.86, surface),
                            border: `1px solid ${borderColor}`
                          }}
                        >
                          <Text
                            size="md"
                            style={{
                              fontStyle: 'italic',
                              marginBottom: '0.5rem',
                              color: '#ffffff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              textAlign: 'center',
                              fontSize: '1rem',
                              lineHeight: '1.4'
                            }}
                          >
                            "{item.quote.text}"
                          </Text>
                          <Group justify="center" align="center" gap="md">
                            <Link href={`/characters/${item.quote.character.id}`} style={{ textDecoration: 'none' }}>
                              <Badge variant="light" size="md" style={{ color: getEntityThemeColor(theme, 'gamble'), cursor: 'pointer' }}>
                                {item.quote.character.name}
                              </Badge>
                            </Link>
                            {renderCounter(item.userCount)}
                          </Group>
                        </Card>
                      </motion.div>
                    ))}
                  </Stack>
                </Box>
              </Card>
            </Grid.Col>
          )}

          {favoriteGambles.length > 0 && (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: softSurface,
                  border: `1px solid ${borderColor}`
                }}
              >
                <Box style={{ flexGrow: 1 }}>
                  <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <Group justify="center" gap="xs" style={{ marginBottom: '0.5rem' }}>
                      <Dices className="w-6 h-6" color={theme.other?.usogui?.gamble || accent} />
                      <Text fw={700} size="xl">Top Gambles</Text>
                    </Group>
                  </Box>
                  <Stack gap="sm">
                    {favoriteGambles.map((item, index) => (
                      <motion.div
                        key={item.gamble.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card
                          withBorder
                          padding="sm"
                          style={{
                            backgroundColor: withAlpha(surface, 0.86, surface),
                            border: `1px solid ${borderColor}`
                          }}
                        >
                          <Text fw={700} size="md" style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '1.1rem' }}>
                            {item.gamble.name}
                          </Text>
                          <Text
                            size="md"
                            style={{
                              color: subtleText,
                              marginBottom: '0.75rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              textAlign: 'center',
                              lineHeight: '1.4'
                            }}
                          >
                            {item.gamble.rules}
                          </Text>
                          <Group justify="center" align="center" gap="md">
                            <Link href={`/gambles/${item.gamble.id}`} style={{ textDecoration: 'none' }}>
                              <Badge variant="light" size="md" style={{ color: getEntityThemeColor(theme, 'gamble'), cursor: 'pointer' }}>
                                View Details
                              </Badge>
                            </Link>
                            {renderCounter(item.userCount)}
                          </Group>
                        </Card>
                      </motion.div>
                    ))}
                  </Stack>
                </Box>
              </Card>
            </Grid.Col>
          )}
        </Grid>

        {favoriteQuotes.length === 0 && favoriteGambles.length === 0 && favoriteCharacterMedia.length === 0 && (
          <Box style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Text size="md" style={{ color: subtleText }}>
              No favorites data available yet. Be the first to set your favorites!
            </Text>
          </Box>
        )}
      </motion.div>
    </Box>
  )
}
