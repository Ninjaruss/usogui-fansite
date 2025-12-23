'use client'

import React from 'react'
import { Badge, Group, Tooltip, Box, Text, useMantineTheme, rem, rgba } from '@mantine/core'
import { Crown } from 'lucide-react'
import { UserBadge, BadgeType } from '../types'
import CustomRoleDisplay from './CustomRoleDisplay'

interface BadgeDisplayProps {
  userBadge: UserBadge
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

interface UserRoleDisplayProps {
  userRole: 'admin' | 'moderator' | 'user'
  customRole?: string | null
  userBadges?: UserBadge[]
  size?: 'small' | 'medium'
  spacing?: number
}

const sizeMap: Record<'sm' | 'md' | 'lg', 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md'
}

export function UserRoleDisplay({
  userRole,
  customRole,
  userBadges = [],
  size = 'medium',
  spacing = 1
}: UserRoleDisplayProps) {
  const theme = useMantineTheme()
  const administrativeColor = userRole === 'admin' ? '#d32f2f' : '#f57c00'

  return (
    <Group
      gap={spacing * 4}
      justify="center"
      align="center"
      wrap="wrap"
      style={{
        alignItems: 'flex-start'
      }}
    >
      {(userRole === 'admin' || userRole === 'moderator') && (
        <Badge
          leftSection={<Crown size={size === 'small' ? 12 : 14} color="#ffffff" />}
          size={size === 'small' ? 'xs' : 'sm'}
          radius="md"
          styles={{
            root: {
              backgroundColor: administrativeColor,
              color: '#ffffff',
              fontWeight: 600
            }
          }}
        >
          {userRole === 'admin' ? 'Admin' : 'Moderator'}
        </Badge>
      )}

      {customRole && (
        <CustomRoleDisplay customRole={customRole} size={size === 'small' ? 'small' : 'medium'} showIcon />
      )}

      {userBadges.map((userBadge) => (
        <BadgeDisplay
          key={userBadge.id}
          userBadge={userBadge}
          size={size === 'small' ? 'sm' : 'md'}
          showTooltip
        />
      ))}
    </Group>
  )
}

export default function BadgeDisplay({
  userBadge,
  size = 'md',
  showTooltip = true,
  className = ''
}: BadgeDisplayProps) {
  const theme = useMantineTheme()
  const { badge } = userBadge

  const accentColor = theme.other?.usogui?.red ?? theme.colors.red[6] ?? '#e11d48'
  const badgeColor = badge.color || accentColor
  const badgeBackgroundColor = badge.backgroundColor

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

  const getDisplayName = () => {
    if (badge.type === BadgeType.SUPPORTER && userBadge.year) {
      return `${badge.name} ${userBadge.year}`
    }
    return badge.name
  }

  const getTooltipContent = () => {
    const isExpired = Boolean(userBadge.expiresAt && new Date(userBadge.expiresAt) < new Date())
    const isActive = userBadge.isActive

    return (
      <Box ta="center">
        <TextStrong>{getDisplayName()}</TextStrong>
        <Box mb={4}>{badge.description}</Box>
        {!isActive && <StatusText color="#f44336">REMOVED</StatusText>}
        {isExpired && <StatusText color="#ff9800">EXPIRED</StatusText>}
        <MetaText> Awarded: {formatDate(userBadge.awardedAt)} </MetaText>
        {userBadge.expiresAt && (
          <MetaText>
            {isExpired ? 'Expired' : 'Expires'}: {formatDate(userBadge.expiresAt)}
          </MetaText>
        )}
        {userBadge.revokedAt && (
          <MetaText color="#f44336">Removed: {formatDate(userBadge.revokedAt)}</MetaText>
        )}
        {userBadge.reason && <MetaText italic>Reason: {userBadge.reason}</MetaText>}
        {userBadge.revokedReason && (
          <MetaText italic color="#f44336">
            Removal reason: {userBadge.revokedReason}
          </MetaText>
        )}
      </Box>
    )
  }

  const textSize = size === 'sm' ? '0.6875rem' : size === 'md' ? '0.75rem' : '0.8125rem'

  const badgeElement = (
    <Badge
      size={sizeMap[size]}
      radius="md"
      variant="outline"
      className={className}
      styles={{
        root: {
          borderColor: badgeColor,
          color: badgeColor,
          backgroundColor: badgeBackgroundColor ? `${badgeBackgroundColor}33` : 'transparent',
          fontWeight: 600,
          fontSize: textSize,
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          transition: 'transform 150ms ease, background-color 150ms ease',
          '&:hover': {
            backgroundColor: badgeBackgroundColor
              ? `${badgeBackgroundColor}44`
              : rgba(badgeColor, 0.07),
            transform: 'scale(1.02)'
          }
        }
      }}
    >
      {getDisplayName()}
    </Badge>
  )

  if (!showTooltip) {
    return badgeElement
  }

  return (
    <Tooltip
      label={getTooltipContent()}
      withArrow
      position="top"
      withinPortal
      styles={{
        tooltip: {
          maxWidth: rem(300),
          backgroundColor: `${theme.colors.dark?.[9] ?? '#000000'}E6`,
          color: '#ffffff',
          fontSize: '0.875rem',
          padding: '8px 12px',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }
      }}
    >
      {badgeElement}
    </Tooltip>
  )
}

const TextStrong: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={{ fontWeight: 700, marginBottom: 4, wordWrap: 'break-word' }}>{children}</Text>
)

const StatusText: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <Text style={{ fontSize: '0.875rem', color, fontWeight: 700, marginBottom: 4, wordWrap: 'break-word' }}>{children}</Text>
)

const MetaText: React.FC<{ children: React.ReactNode; italic?: boolean; color?: string }> = ({
  children,
  italic,
  color
}) => (
  <Text
    style={{
      fontSize: '0.875rem',
      opacity: 0.8,
      fontStyle: italic ? 'italic' : 'normal',
      color: color ?? 'inherit',
      marginBottom: 4,
      wordWrap: 'break-word',
      whiteSpace: 'normal'
    }}
  >
    {children}
  </Text>
)
