'use client'

import { Box, Card, Grid, Badge, Avatar, Group, Text, useMantineTheme } from '@mantine/core'
import { TrendingUp, Eye, Users, BookOpen, Dices, CalendarSearch } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'

interface TrendingItem {
  id: number
  title?: string
  name?: string
  description?: string
  rules?: string
  viewCount: number
  recentViewCount: number
  author?: { id: number; username: string }
  createdAt?: string
}

interface TrendingSectionProps {
  title: string
  items: TrendingItem[]
  type: 'guides' | 'characters' | 'events' | 'gambles'
  maxItems?: number
}

export function TrendingSection({ title, items, type, maxItems = 3 }: TrendingSectionProps) {
  const theme = useMantineTheme()

  const accent = theme.other?.usogui?.red || theme.colors.red[5]
  const surface = theme.other?.usogui?.black || '#0a0a0a'

  const withAlpha = (color: string, alpha: number, fallback: string) => {
    try {
      return theme.fn?.rgba?.(color, alpha) ?? fallback
    } catch (error) {
      return fallback
    }
  }

  const borderColor = withAlpha(accent, 0.22, 'rgba(225, 29, 72, 0.22)')
  const hoverShadow = `0 18px 30px -12px ${withAlpha(accent, 0.4, 'rgba(225, 29, 72, 0.4)')}`
  const muted = withAlpha('#ffffff', 0.65, 'rgba(255, 255, 255, 0.65)')

  const getTypeConfig = () => {
    switch (type) {
      case 'guides':
        return {
          icon: <BookOpen className="w-5 h-5" />,
          color: theme.other?.usogui?.guide || theme.colors.green?.[5] || accent,
          href: '/guides'
        }
      case 'characters':
        return {
          icon: <Users className="w-5 h-5" />,
          color: theme.other?.usogui?.character || theme.colors.blue?.[6] || accent,
          href: '/characters'
        }
      case 'events':
        return {
          icon: <CalendarSearch className="w-5 h-5" />,
          color: theme.other?.usogui?.event || theme.colors.orange?.[6] || accent,
          href: '/events'
        }
      case 'gambles':
        return {
          icon: <Dices className="w-5 h-5" />,
          color: theme.other?.usogui?.gamble || theme.colors.red?.[6] || accent,
          href: '/gambles'
        }
      default:
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          color: accent,
          href: '/'
        }
    }
  }

  const typeConfig = getTypeConfig()
  const displayItems = items.slice(0, maxItems)

  if (displayItems.length === 0) {
    return null
  }

  return (
    <Box>
      <Group align="center" gap="xs" style={{ marginBottom: '0.75rem' }}>
        <Box style={{ color: typeConfig.color }}>{typeConfig.icon}</Box>
        <Text fw={600} size="lg" style={{ flex: 1 }}>
          {title}
        </Text>
        <Link
          href={typeConfig.href}
          style={{
            color: withAlpha(typeConfig.color, 0.9, typeConfig.color),
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          View all →
        </Link>
      </Group>

      <Grid gutter="lg">
        {displayItems.map((item, index) => (
          <Grid.Col span={{ base: 12, md: 4 }} key={item.id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                component={Link}
                href={`${typeConfig.href}/${item.id}`}
                padding="lg"
                style={{
                  height: '100%',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: withAlpha(surface, 0.94, surface),
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'translateY(-4px)'
                  event.currentTarget.style.boxShadow = hoverShadow
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'translateY(0)'
                  event.currentTarget.style.boxShadow = 'none'
                }}
              >
                <Group justify="space-between" align="flex-start" style={{ marginBottom: '0.75rem' }}>
                  <Text
                    size="sm"
                    fw={600}
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.title || item.name}
                  </Text>
                  <Badge
                    leftSection={<TrendingUp className="w-3 h-3" />}
                    variant="light"
                    size="sm"
                    style={{ backgroundColor: withAlpha(accent, 0.18, accent), color: '#ffffff' }}
                  >
                    {item.recentViewCount}
                  </Badge>
                </Group>

                <Text
                  size="sm"
                  style={{
                    color: muted,
                    marginBottom: '1.1rem',
                    flexGrow: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {item.description || item.rules || 'No description available'}
                </Text>

                <Group justify="space-between" gap="xs">
                  <Group gap="xs">
                    <Eye className="w-4 h-4" color={theme.colors.gray?.[5] || '#9ca3af'} />
                    <Text size="xs" style={{ color: muted }}>
                      {item.viewCount.toLocaleString()} views
                    </Text>
                  </Group>

                  {type === 'guides' && item.author && (
                    <Group gap="xs">
                      <Avatar size={18} radius="xl">
                        {item.author.username[0].toUpperCase()}
                      </Avatar>
                      <Text size="xs" style={{ color: muted }}>
                        {item.author.username}
                      </Text>
                    </Group>
                  )}
                </Group>
              </Card>
            </motion.div>
          </Grid.Col>
        ))}
      </Grid>
    </Box>
  )
}
