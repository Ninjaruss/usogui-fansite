'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Badge, Group, Button, Collapse, Box, Text } from '@mantine/core'
import { Users, BookOpen, CalendarSearch, FileText, Dices, Image, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { textColors } from '../lib/mantine-theme'

interface StatsData {
  totalCharacters?: number
  totalArcs?: number
  totalEvents?: number
  totalGuides?: number
  totalGambles?: number
  totalMedia?: number
  totalUsers?: number
}

interface StatsShowcaseProps {
  stats: StatsData
  loading?: boolean
}

interface StatItem {
  key: string
  value?: number
  label: string
  icon: ReactNode
  color: string
}

export function StatsShowcase({ stats, loading = false }: StatsShowcaseProps) {
  const [showAll, setShowAll] = useState(false)

  // Define primary stats (most important for users)
  const primaryStats: StatItem[] = [
    {
      key: 'totalGuides',
      value: stats.totalGuides,
      label: 'Guides',
      icon: <FileText className="w-4 h-4" />,
      color: textColors.guide
    },
    {
      key: 'totalEvents',
      value: stats.totalEvents,
      label: 'Events',
      icon: <CalendarSearch className="w-4 h-4" />,
      color: textColors.event
    },
    {
      key: 'totalCharacters',
      value: stats.totalCharacters,
      label: 'Characters',
      icon: <Users className="w-4 h-4" />,
      color: textColors.character
    }
  ]

  // Secondary stats (shown when expanded)
  const secondaryStats: StatItem[] = [
    {
      key: 'totalArcs',
      value: stats.totalArcs,
      label: 'Arcs',
      icon: <BookOpen className="w-4 h-4" />,
      color: textColors.arc
    },
    {
      key: 'totalGambles',
      value: stats.totalGambles,
      label: 'Gambles',
      icon: <Dices className="w-4 h-4" />,
      color: textColors.gamble
    },
    {
      key: 'totalMedia',
      value: stats.totalMedia,
      label: 'Media',
      icon: <Image className="w-4 h-4" />,
      color: textColors.media
    },
    {
      key: 'totalUsers',
      value: stats.totalUsers,
      label: 'Users',
      icon: <Shield className="w-4 h-4" />,
      color: textColors.info
    }
  ]

  const renderStatBadge = (stat: StatItem, index: number, delay: number = 0) => {
    if (!stat.value) return null

    return (
      <motion.div
        key={stat.key}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{
          duration: 0.3,
          delay: delay + index * 0.1,
          ease: "easeOut"
        }}
      >
        <Badge
          leftSection={<span style={{ color: stat.color }}>{stat.icon}</span>}
          variant="outline"
          style={{
            borderColor: stat.color,
            color: stat.color,
            fontSize: '0.875rem',
            minWidth: 'fit-content'
          }}
          size="lg"
        >
          {stat.value.toLocaleString()} {stat.label}
        </Badge>
      </motion.div>
    )
  }

  const hasSecondaryStats = secondaryStats.some(stat => stat.value)

  return (
    <Box style={{ marginBottom: '1rem' }}>
      {/* Primary Stats - Always Visible */}
      <Group
        justify="center"
        gap="md"
        style={{
          flexWrap: 'wrap',
          marginBottom: hasSecondaryStats ? '0.75rem' : '0'
        }}
      >
        {primaryStats.map((stat, index) =>
          renderStatBadge(stat, index, 0)
        )}
      </Group>

      {/* Secondary Stats - Expandable */}
      {hasSecondaryStats && (
        <>
          <Collapse in={showAll}>
            <Group
              justify="center"
              gap="md"
              style={{
                flexWrap: 'wrap',
                marginBottom: '0.5rem'
              }}
            >
              <AnimatePresence>
                {showAll && secondaryStats.map((stat, index) =>
                  renderStatBadge(stat, index, 0.2)
                )}
              </AnimatePresence>
            </Group>
          </Collapse>

          {/* Toggle Button */}
          <Group justify="center">
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              rightSection={
                showAll ?
                  <ChevronUp className="w-4 h-4" /> :
                  <ChevronDown className="w-4 h-4" />
              }
              style={{
                fontSize: '0.75rem',
                height: '28px',
                padding: '0 0.75rem'
              }}
            >
              {showAll ? 'Show Less' : `+${secondaryStats.filter(s => s.value).length} More`}
            </Button>
          </Group>
        </>
      )}
    </Box>
  )
}
