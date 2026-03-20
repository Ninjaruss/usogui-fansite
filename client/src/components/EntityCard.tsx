'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Avatar,
  Badge,
  Box,
  Card,
  Group,
  HoverCard,
  Skeleton,
  Stack,
  Text,
  rem,
  rgba,
  useMantineTheme
} from '@mantine/core'
import {
  User,
  BookOpen,
  Dice6,
  FileText,
  Users,
  Hash,
  Volume2,
  Quote,
} from 'lucide-react'
import {
  fetchEntityData,
  getEntityTypeLabel,
  getDefaultDisplayText,
  getEntityUrl
} from '../lib/entityEmbedParser'
import { getEntityAccent, EntityAccentKey } from '../lib/mantine-theme'
import MediaThumbnail from './MediaThumbnail'
import { useProgress } from '../providers/ProgressProvider'
import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
import { shouldHideSpoiler } from '../lib/spoiler-utils'

interface EntityCardProps {
  type: 'character' | 'arc' | 'gamble' | 'guide' | 'organization' | 'chapter' | 'volume' | 'quote'
  id: number
  displayText?: string
  compact?: boolean
  showImage?: boolean
  inline?: boolean
}

type EntityAccentMap = Partial<Record<EntityCardProps['type'], EntityAccentKey>>

const ENTITY_ACCENT_MAP: EntityAccentMap = {
  character: 'character',
  arc: 'arc',
  gamble: 'gamble',
  guide: 'guide',
  organization: 'organization',
  quote: 'quote'
}

const ICON_MAP: Record<EntityCardProps['type'], React.ReactNode> = {
  character: <User size={18} />,
  arc: <BookOpen size={18} />,
  gamble: <Dice6 size={18} />,
  guide: <FileText size={18} />,
  organization: <Users size={18} />,
  chapter: <Hash size={18} />,
  volume: <Volume2 size={18} />,
  quote: <Quote size={18} />
}

const ICON_MAP_SM: Record<EntityCardProps['type'], React.ReactNode> = {
  character: <User size={14} />,
  arc: <BookOpen size={14} />,
  gamble: <Dice6 size={14} />,
  guide: <FileText size={14} />,
  organization: <Users size={14} />,
  chapter: <Hash size={14} />,
  volume: <Volume2 size={14} />,
  quote: <Quote size={14} />
}

const skeletonCircle = (size: number) => (
  <Skeleton width={size} height={size} circle radius={size / 2} />
)

const EntityCard: React.FC<EntityCardProps> = ({
  type,
  id,
  displayText,
  compact = false,
  showImage = true,
  inline = false
}) => {
  const theme = useMantineTheme()
  const { userProgress } = useProgress()
  const { settings: spoilerSettings } = useSpoilerSettings()
  // fetchEntityData returns the raw entity object (not wrapped in EntityEmbedData)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const entityData = await fetchEntityData(type, id)
        if (!isMounted) return
        if (!entityData) {
          setError(true)
        }
        setData(entityData || null)
      } catch (networkError) {
        if (isMounted) {
          setError(true)
          setData(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [type, id])

  const accentKey = ENTITY_ACCENT_MAP[type]
  const accentColor = accentKey ? getEntityAccent(accentKey, theme) : theme.colors.gray[5] || '#94a3b8'
  const linkHref = getEntityUrl(type, id)

  const renderTypeBadge = (label: string) => (
    <Badge
      size="sm"
      variant="outline"
      radius="md"
      styles={{
        root: {
          borderColor: accentColor,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.025em'
        }
      }}
    >
      {label}
    </Badge>
  )

  const renderMeta = () => {
    if (!data) return null

    if (type === 'character' && data.organization) {
      return data.organization
    }

    if (type === 'arc' && data.startChapter && data.endChapter) {
      return `Ch. ${data.startChapter}-${data.endChapter}`
    }

    if (type === 'gamble' && data.chapterNumber) {
      return `Ch. ${data.chapterNumber}`
    }

    if (type === 'chapter' && data.number) {
      return `#${data.number}`
    }

    if (type === 'volume' && data.number) {
      return `Vol. ${data.number}`
    }

    return null
  }

  const renderLoading = () => (
    <Group gap={compact ? 'xs' : 'sm'} wrap="nowrap">
      {skeletonCircle(compact ? 24 : 32)}
      <Box style={{ flex: 1 }}>
        <Skeleton height={compact ? 14 : 18} width="60%" mb={compact ? 0 : 6} />
        {!compact && <Skeleton height={12} width="40%" />}
      </Box>
    </Group>
  )

  const renderError = () => (
    <Group gap={compact ? 'xs' : 'sm'} wrap="nowrap">
      <Avatar
        size={compact ? 24 : 32}
        radius="xl"
        styles={{ root: { backgroundColor: theme.colors.red[6] ?? '#ef4444', color: '#ffffff' } }}
      >
        {ICON_MAP[type]}
      </Avatar>
      <Box style={{ flex: 1 }}>
        <Text size={compact ? 'xs' : 'sm'} fw={600} lineClamp={1} c="red.4">
          {displayText || `${getEntityTypeLabel(type)} not found`}
        </Text>
        {!compact && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            ID: {id}
          </Text>
        )}
      </Box>
    </Group>
  )

  const renderAvatar = () => (
    <Avatar size={compact ? 24 : 32} radius="xl" styles={{ root: { backgroundColor: accentColor, color: '#ffffff' } }}>
      {ICON_MAP[type]}
    </Avatar>
  )

  const renderDescription = () => {
    if (!data) return null

    let desc: string | undefined

    if (type === 'character') desc = data.description
    else if (type === 'arc') desc = data.description
    else if (type === 'gamble') desc = data.description || data.arc?.name
    else if (type === 'guide') desc = data.description
    else if (type === 'organization') desc = data.description
    else if (type === 'quote') desc = data.text
    else if (type === 'chapter') desc = data.summary || data.title
    else if (type === 'volume') desc = data.description

    if (!desc) return null

    return (
      <Text size="xs" c="dimmed" lineClamp={2} style={{ lineHeight: 1.4 }}>
        {desc}
      </Text>
    )
  }

  // --- Popover content for hover card ---
  const renderPopoverContent = () => {
    if (loading) {
      return (
        <Box style={{ display: 'flex', alignItems: 'stretch', minHeight: rem(80) }}>
          {/* Left image skeleton */}
          <Box style={{
            width: rem(70),
            background: 'rgba(255,255,255,0.04)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Skeleton height={rem(44)} width={rem(44)} radius="sm" />
          </Box>
          {/* Right content skeleton */}
          <Box style={{ padding: `${rem(12)} ${rem(14)}`, flex: 1 }}>
            <Skeleton height={rem(10)} width="40%" mb={rem(6)} radius="sm" />
            <Skeleton height={rem(14)} width="70%" mb={rem(8)} radius="sm" />
            <Skeleton height={rem(10)} width="90%" mb={rem(4)} radius="sm" />
            <Skeleton height={rem(10)} width="75%" mb={rem(10)} radius="sm" />
            <Group gap={rem(6)}>
              <Skeleton height={rem(18)} width={rem(50)} radius="xl" />
              <Skeleton height={rem(18)} width={rem(40)} radius="xl" />
            </Group>
          </Box>
        </Box>
      )
    }
    if (error || !data) return renderError()

    const finalDisplayText = displayText || getDefaultDisplayText(type, data)
    const meta = renderMeta()

    const hasImage = showImage && ['character', 'arc', 'volume'].includes(type)

    return (
      <Stack gap={0}>
        {hasImage ? (
          <Box style={{ width: '100%', height: rem(140), overflow: 'hidden', borderRadius: `${rem(11)} ${rem(11)} 0 0` }}>
            <MediaThumbnail
              entityType={type as 'character' | 'arc' | 'volume'}
              entityId={id}
              entityName={finalDisplayText}
              maxWidth={340}
              maxHeight={140}
            />
          </Box>
        ) : null}
        <Box style={{ padding: `${rem(10)} ${rem(12)} ${rem(12)}` }}>
          <Group gap="sm" wrap="nowrap" align="center" mb={4}>
            {!hasImage && (
              <Avatar size={36} radius="xl" styles={{ root: { backgroundColor: accentColor, color: '#ffffff' } }}>
                {ICON_MAP[type]}
              </Avatar>
            )}
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={700} lineClamp={1} style={{ color: accentColor }}>
                {finalDisplayText}
              </Text>
              <Group gap="xs" mt={2} align="center">
                {renderTypeBadge(getEntityTypeLabel(type))}
                {meta && (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {meta}
                  </Text>
                )}
              </Group>
            </Box>
          </Group>
          {renderDescription()}
        </Box>
      </Stack>
    )
  }

  // --- Inline chip mode (mention style) ---
  if (inline) {
    const chipDisplayText = loading
      ? '...'
      : error
        ? (displayText || 'Not found')
        : (displayText || (data ? getDefaultDisplayText(type, data) : `${getEntityTypeLabel(type)} #${id}`))

    const entityChapterNumber: number | undefined = !loading && data
      ? type === 'arc' ? data.startChapter
        : type === 'gamble' ? data.chapterNumber
        : type === 'chapter' ? data.number
        : type === 'volume' ? data.startChapter
        : undefined
      : undefined

    const isHoverSpoilered = shouldHideSpoiler(entityChapterNumber, userProgress, spoilerSettings)

    return (
      <HoverCard width={340} shadow="lg" openDelay={200} closeDelay={100} position="top" withinPortal disabled={isHoverSpoilered}>
        <HoverCard.Target>
          <span style={{ display: 'inline' }}>
            <Link
              href={linkHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: rem(7),
                padding: `${rem(3)} ${rem(10)} ${rem(3)} ${rem(4)}`,
                borderRadius: rem(6),
                backgroundColor: '#1a2535',
                border: `1px solid ${rgba(accentColor, 0.3)}`,
                color: accentColor,
                textDecoration: 'none',
                fontSize: rem(13),
                fontWeight: 500,
                lineHeight: 1.4,
                verticalAlign: 'middle',
                cursor: 'pointer',
                transition: 'filter 120ms ease',
                whiteSpace: 'nowrap',
                maxWidth: rem(240)
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.filter = 'brightness(1.1)'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.filter = 'brightness(1)'
              }}
            >
              {/* 20×20 avatar square: type icon */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: rem(20),
                height: rem(20),
                borderRadius: rem(3),
                backgroundColor: rgba(accentColor, 0.2),
                color: accentColor,
                flexShrink: 0,
                fontSize: rem(11)
              }}>
                {ICON_MAP_SM[type]}
              </span>
              <Text
                component="span"
                size="sm"
                fw={500}
                lineClamp={1}
                style={{ color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {chipDisplayText}
              </Text>
            </Link>
          </span>
        </HoverCard.Target>
        <HoverCard.Dropdown
          style={{
            backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a',
            border: `1px solid ${rgba(accentColor, 0.3)}`,
            borderRadius: rem(12),
            padding: 0,
            overflow: 'hidden'
          }}
        >
          {renderPopoverContent()}
        </HoverCard.Dropdown>
      </HoverCard>
    )
  }

  // --- Compact mode (non-inline) ---
  const renderContent = () => {
    if (loading) {
      return renderLoading()
    }

    if (error || !data) {
      return renderError()
    }

    const finalDisplayText = displayText || getDefaultDisplayText(type, data)
    const meta = renderMeta()

    return (
      <Group gap={compact ? 'xs' : 'sm'} wrap="nowrap" align="center" style={{ maxWidth: '100%' }}>
        {showImage && (
          <Box style={{ position: 'relative', flexShrink: 0 }}>
            {['character', 'arc', 'volume'].includes(type) ? (
              <Box style={{ width: compact ? rem(24) : rem(32), height: compact ? rem(24) : rem(32) }}>
                <MediaThumbnail
                  entityType={type as 'character' | 'arc' | 'volume'}
                  entityId={id}
                  entityName={finalDisplayText}
                  maxWidth={compact ? 24 : 32}
                  maxHeight={compact ? 24 : 32}
                  inline
                />
              </Box>
            ) : (
              renderAvatar()
            )}
          </Box>
        )}

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text
            size={compact ? 'sm' : 'md'}
            fw={600}
            lineClamp={1}
            component="span"
            style={{ color: accentColor }}
          >
            {finalDisplayText}
          </Text>

          {!compact && (
            <Group gap="xs" mt={4} align="center">
              {renderTypeBadge(getEntityTypeLabel(type))}
              {meta && (
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {meta}
                </Text>
              )}
            </Group>
          )}
        </Box>
      </Group>
    )
  }

  const interactiveStyles = {
    border: `1px solid ${rgba(accentColor, 0.25)}`,
    background: `linear-gradient(135deg, ${rgba(accentColor, 0.12)} 0%, transparent 100%)`,
    textDecoration: 'none',
    transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease'
  } as const

  if (compact) {
    return (
      <Box
        component={Link}
        href={linkHref}
        style={{
          ...interactiveStyles,
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 8px',
          borderRadius: rem(8),
          cursor: 'pointer',
          maxWidth: '100%',
          color: 'inherit'
        }}
        styles={{
          root: {
            '&:hover': {
              borderColor: rgba(accentColor, 0.6),
              transform: 'translateY(-1px)'
            },
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none !important',
              '&:hover': { transform: 'none' }
            }
          }
        }}
      >
        {renderContent()}
      </Box>
    )
  }

  return (
    <Card
      component={Link}
      href={linkHref}
      padding="md"
      radius="md"
      withBorder
      style={{
        ...interactiveStyles,
        borderRadius: rem(12),
        cursor: 'pointer'
      }}
      styles={{
        root: {
          '&:hover': {
            borderColor: rgba(accentColor, 0.6),
            boxShadow: `0 12px 24px ${rgba(accentColor, 0.18)}`,
            transform: 'translateY(-2px)'
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none !important',
            '&:hover': { transform: 'none', boxShadow: 'none' }
          }
        }
      }}
    >
      {renderContent()}
    </Card>
  )
}

export default EntityCard
