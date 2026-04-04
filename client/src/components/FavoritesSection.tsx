'use client'

import React from 'react'
import {
  Box,
  Card,
  Text,
  Grid,
  Avatar,
  Stack,
  Skeleton,
  Alert,
  Group,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { Quote, Dices, User } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useFavoritesData } from '../hooks/useFavoritesData'
import { FavoriteCharactersSection } from './FavoriteCharactersSection'

export function FavoritesSection() {
  const theme = useMantineTheme()
  const { data: favoritesData, loading, error } = useFavoritesData()

  const accent = theme.other?.usogui?.red || theme.colors.red[5]
  const surface = theme.other?.usogui?.black || '#0a0a0a'

  const withAlpha = (color: string, alpha: number, fallback: string) => {
    try {
      return rgba(color, alpha)
    } catch {
      return fallback
    }
  }

  const borderColor = withAlpha(accent, 0.22, 'rgba(225, 29, 72, 0.22)')
  const softSurface = withAlpha(surface, 0.92, surface)
  const subtleText = withAlpha('#ffffff', 0.45, 'rgba(255, 255, 255, 0.45)')

  if (error) {
    return (
      <Alert variant="light" style={{ color: 'rgba(225,29,72,0.8)', marginBottom: '1.5rem' }}>
        Unable to load favorites data. Please check your connection and try again.
      </Alert>
    )
  }

  if (loading) {
    return (
      <Box>
        <Skeleton height={40} width={300} style={{ marginBottom: '1.5rem' }} />
        <Grid gutter="md">
          {[1, 2, 3].map((i) => (
            <Grid.Col span={{ base: 12, sm: 4 }} key={i}>
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

  const { favoriteQuotes, favoriteGambles, favoriteCharacterMedia, favoriteCharacters } = favoritesData

  return (
    <Box style={{ marginBottom: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        {/* Section heading */}
        <Box style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <Group justify="center" gap="xs" style={{ marginBottom: '0.5rem' }}>
            <span aria-hidden="true" style={{ fontSize: '1.3rem', color: theme.other?.usogui?.purple || accent, opacity: 0.8, lineHeight: 1 }}>♦</span>
            <Text fw={700} style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: 1.2 }}>
              Community Favorites
            </Text>
          </Group>
          <Text size="sm" style={{ color: subtleText }}>
            The most beloved content from our community
          </Text>
        </Box>

        {/* Fan Favorite Characters sub-label */}
        {favoriteCharacters && (
          <>
            <Text style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)',
              textAlign: 'center',
              marginBottom: '0.75rem',
            }}>
              Fan Favorite Characters
            </Text>
            <FavoriteCharactersSection data={favoriteCharacters} />
          </>
        )}

        {/* Thin divider between character section and content section */}
        {favoriteCharacters && (favoriteQuotes.length > 0 || favoriteGambles.length > 0 || favoriteCharacterMedia.length > 0) && (
          <Box aria-hidden style={{
            height: 1,
            margin: '1.25rem 0 1rem',
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)',
          }} />
        )}

        {/* Popular Content sub-label */}
        {(favoriteQuotes.length > 0 || favoriteGambles.length > 0 || favoriteCharacterMedia.length > 0) && (
          <Text style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)',
            textAlign: 'center',
            marginBottom: '0.75rem',
          }}>
            Popular Content
          </Text>
        )}

        <Grid gutter="md">
          {/* Popular Profile Pics */}
          {favoriteCharacterMedia.length > 0 && (
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Card
                className="community-card-elevated"
                style={{
                  height: '100%',
                  backgroundColor: softSurface,
                  border: `1px solid ${borderColor}`,
                  '--card-accent': 'rgba(77,171,247,0.5)',
                  '--card-shadow': 'rgba(77,171,247,0.10)',
                  padding: '0.875rem 0.75rem',
                } as React.CSSProperties}
              >
                <Group gap={6} style={{ marginBottom: '0.75rem' }}>
                  <User size={18} color={theme.other?.usogui?.character || theme.colors.blue?.[6] || accent} />
                  <Text fw={700} size="sm">Popular Profile Pics</Text>
                </Group>

                {favoriteCharacterMedia.map((item, index) => (
                  <motion.div
                    key={item.media.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                  >
                    <Box
                      style={{
                        borderBottom: index === favoriteCharacterMedia.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        paddingTop: index === 0 ? 0 : '0.4375rem',
                        paddingBottom: index === favoriteCharacterMedia.length - 1 ? 0 : '0.4375rem',
                        opacity: index === 0 ? 1 : index === 1 ? 0.55 : 0.3,
                      }}
                    >
                      <Link href={`/characters/${item.media.character.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Group gap={9} wrap="nowrap">
                          <Avatar
                            src={item.media.url}
                            alt={item.media.character.name}
                            size={index === 0 ? 34 : index === 1 ? 28 : 24}
                            radius="xl"
                            style={{ border: `1px solid ${withAlpha(theme.other?.usogui?.character || theme.colors.blue?.[6] || accent, 0.3, 'rgba(59,130,246,0.3)')}`, flexShrink: 0 }}
                          />
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600} style={{ fontSize: '0.6875rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.media.character.name}
                            </Text>
                            <Text style={{ fontSize: '0.625rem', color: subtleText }}>
                              Ch. {item.media.chapterNumber || 'N/A'}
                            </Text>
                          </Box>
                          <Text style={{ fontSize: '0.625rem', color: subtleText, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {item.userCount} user{item.userCount !== 1 ? 's' : ''}
                          </Text>
                        </Group>
                      </Link>
                    </Box>
                  </motion.div>
                ))}
              </Card>
            </Grid.Col>
          )}

          {/* Top Quotes */}
          {favoriteQuotes.length > 0 && (
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Card
                className="community-card-elevated"
                style={{
                  height: '100%',
                  backgroundColor: softSurface,
                  border: `1px solid ${borderColor}`,
                  '--card-accent': 'rgba(81,207,102,0.5)',
                  '--card-shadow': 'rgba(81,207,102,0.10)',
                  padding: '0.875rem 0.75rem',
                } as React.CSSProperties}
              >
                <Group gap={6} style={{ marginBottom: '0.75rem' }}>
                  <Quote size={18} color={theme.other?.usogui?.quote || theme.colors.green?.[5] || '#4ade80'} />
                  <Text fw={700} size="sm">Top Quotes</Text>
                </Group>

                {favoriteQuotes.map((item, index) => (
                  <motion.div
                    key={item.quote.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                  >
                    <Box
                      style={{
                        borderBottom: index === favoriteQuotes.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        paddingTop: index === 0 ? 0 : '0.4375rem',
                        paddingBottom: index === favoriteQuotes.length - 1 ? 0 : '0.4375rem',
                        opacity: index === 0 ? 1 : index === 1 ? 0.55 : 0.3,
                      }}
                    >
                      <Text
                        style={{
                          fontStyle: 'italic',
                          fontSize: '0.6875rem',
                          color: 'rgba(255,255,255,0.8)',
                          lineHeight: 1.5,
                          marginBottom: '0.25rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontFamily: 'var(--font-opti-goudy-text)',
                        }}
                      >
                        "{item.quote.text}"
                      </Text>
                      <Group justify="space-between" align="center">
                        <Link href={`/characters/${item.quote.character.id}`} style={{ textDecoration: 'none' }}>
                          <Text style={{ fontSize: '0.625rem', color: subtleText, cursor: 'pointer' }}>
                            — {item.quote.character.name}
                          </Text>
                        </Link>
                        <Text style={{ fontSize: '0.625rem', color: subtleText }}>
                          {item.userCount} user{item.userCount !== 1 ? 's' : ''}
                        </Text>
                      </Group>
                    </Box>
                  </motion.div>
                ))}
              </Card>
            </Grid.Col>
          )}

          {/* Top Gambles */}
          {favoriteGambles.length > 0 && (
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Card
                className="community-card-elevated"
                style={{
                  height: '100%',
                  backgroundColor: softSurface,
                  border: `1px solid ${borderColor}`,
                  '--card-accent': 'rgba(255,85,85,0.5)',
                  '--card-shadow': 'rgba(255,85,85,0.10)',
                  padding: '0.875rem 0.75rem',
                } as React.CSSProperties}
              >
                <Group gap={6} style={{ marginBottom: '0.75rem' }}>
                  <Dices size={18} color={theme.other?.usogui?.gamble || accent} />
                  <Text fw={700} size="sm">Top Gambles</Text>
                </Group>

                {favoriteGambles.map((item, index) => (
                  <motion.div
                    key={item.gamble.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                  >
                    <Box
                      style={{
                        borderBottom: index === favoriteGambles.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        paddingTop: index === 0 ? 0 : '0.4375rem',
                        paddingBottom: index === favoriteGambles.length - 1 ? 0 : '0.4375rem',
                        opacity: index === 0 ? 1 : index === 1 ? 0.55 : 0.3,
                      }}
                    >
                      <Link href={`/gambles/${item.gamble.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Group justify="space-between" align="flex-start" gap={6} wrap="nowrap">
                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text fw={700} style={{
                              fontSize: '0.6875rem',
                              color: '#fff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginBottom: 2,
                            }}>
                              <span aria-hidden style={{ color: 'rgba(225,29,72,0.45)', marginRight: '0.25em' }}>♠</span>
                              {item.gamble.name}
                            </Text>
                            {item.gamble.rules && (
                              <Text style={{
                                fontSize: '0.625rem',
                                color: subtleText,
                                lineHeight: 1.4,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                              }}>
                                {item.gamble.rules}
                              </Text>
                            )}
                          </Box>
                          <Text style={{ fontSize: '0.625rem', color: subtleText, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {item.userCount} user{item.userCount !== 1 ? 's' : ''}
                          </Text>
                        </Group>
                      </Link>
                    </Box>
                  </motion.div>
                ))}
              </Card>
            </Grid.Col>
          )}
        </Grid>

        {favoriteQuotes.length === 0 && favoriteGambles.length === 0 && favoriteCharacterMedia.length === 0 && !favoriteCharacters && (
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
