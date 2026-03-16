'use client'

import React from 'react'
import { Box, Text, Group } from '@mantine/core'
import { MAX_CHAPTER, PROFILE_ARC_MILESTONES } from '../../lib/constants'

interface ProfileProgressReportProps {
  userProgress: number
}

export default function ProfileProgressReport({ userProgress }: ProfileProgressReportProps) {
  const readPercent = Math.min(Math.round((userProgress / MAX_CHAPTER) * 100), 100)
  const youPercent = Math.min((userProgress / MAX_CHAPTER) * 100, 100)

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
      <Group gap={6} align="baseline" mb={14}>
        <Text style={{ fontSize: '13px', fontWeight: 600, color: '#d4d4d4', letterSpacing: '0.04em' }}>Reading Progress</Text>
        <Text style={{ fontSize: '9px', color: '#1e1e1e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>· chapter log</Text>
      </Group>

      <Group justify="space-between" mb={8}>
        <Text style={{ fontSize: '12px', color: '#777' }}>
          Chapter <span style={{ color: '#e5e5e5', fontWeight: 700 }}>{userProgress}</span> of {MAX_CHAPTER}
        </Text>
        <Text style={{ fontSize: '12px', color: '#e11d48', fontWeight: 700 }}>{readPercent}%</Text>
      </Group>

      {/* Progress bar + milestone ticks */}
      <Box style={{ position: 'relative', marginBottom: '24px' }}>
        {/* Track */}
        <Box style={{ height: '4px', background: '#111', borderRadius: '2px', overflow: 'visible', position: 'relative' }}>
          {/* Fill */}
          <Box
            style={{
              width: `${readPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #e11d48, #7c3aed)',
              borderRadius: '2px',
            }}
          />
        </Box>

        {/* Milestone ticks (rendered outside the track for overflow) */}
        {PROFILE_ARC_MILESTONES.map((arc, i) => {
          const pct = (arc.startChapter / MAX_CHAPTER) * 100
          const nextArc = PROFILE_ARC_MILESTONES[i + 1]
          const isCurrentArc = userProgress >= arc.startChapter &&
            (!nextArc || userProgress < nextArc.startChapter)

          const next = PROFILE_ARC_MILESTONES[i + 1]
          const nextPct = next ? (next.startChapter / MAX_CHAPTER) * 100 : 999
          const showLabel = (nextPct - pct) >= 5

          const labelColor = isCurrentArc ? '#333' : '#1e1e1e'

          return (
            <Box
              key={arc.name}
              style={{ position: 'absolute', left: `${pct}%`, top: '-9px', transform: 'translateX(-50%)' }}
            >
              <Box style={{ width: '1px', height: '22px', background: userProgress >= arc.startChapter ? '#222' : '#1a1a1a', margin: '0 auto' }} />
              {showLabel && (
                <Text style={{ fontSize: '9px', color: labelColor, whiteSpace: 'nowrap', marginTop: '2px', transform: 'translateX(-50%)', position: 'absolute', left: '50%' }}>
                  {arc.name}
                </Text>
              )}
            </Box>
          )
        })}

        {/* "you" marker */}
        <Box style={{ position: 'absolute', left: `${youPercent}%`, top: '-9px', transform: 'translateX(-50%)' }}>
          <Box style={{ width: '1px', height: '22px', background: 'rgba(225,29,72,0.4)', margin: '0 auto' }} />
          <Text style={{ fontSize: '9px', color: 'rgba(225,29,72,0.6)', whiteSpace: 'nowrap', marginTop: '2px', transform: 'translateX(-50%)', position: 'absolute', left: '50%' }}>
            you
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
