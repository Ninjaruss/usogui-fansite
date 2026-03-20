// client/src/components/ReadingProgressBar.tsx
'use client'

import { Box, Text, Group } from '@mantine/core'
import { MAX_CHAPTER, PROFILE_ARC_MILESTONES } from '../lib/constants'

interface ReadingProgressBarProps {
  userProgress: number
  markerLabel?: string // "you" on profile; omit on public user detail page (dot still shows)
}

export default function ReadingProgressBar({ userProgress, markerLabel }: ReadingProgressBarProps) {
  const readPercent = Math.min(Math.round((userProgress / MAX_CHAPTER) * 100), 100)
  const dotPercent = Math.min((userProgress / MAX_CHAPTER) * 100, 100)

  // Find the current arc index (last arc whose startChapter <= userProgress)
  const currentArcIndex = PROFILE_ARC_MILESTONES.reduce((acc, arc, i) => {
    if (userProgress >= arc.startChapter) return i
    return acc
  }, -1)

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
      <Group justify="space-between" mb={10}>
        <Text style={{ fontSize: '13px', color: '#aaa' }}>
          Chapter <span style={{ color: '#e5e5e5', fontWeight: 700 }}>{userProgress}</span> of {MAX_CHAPTER}
        </Text>
        <Text style={{ fontSize: '13px', color: '#e11d48', fontWeight: 700 }}>{readPercent}%</Text>
      </Group>

      {/* Progress bar with glowing dot */}
      <Box style={{ position: 'relative', marginBottom: markerLabel ? '24px' : '16px' }}>
        {/* Marker label above dot (only when markerLabel provided) */}
        {markerLabel && (
          <Box
            style={{
              position: 'absolute',
              left: `${dotPercent}%`,
              bottom: '100%',
              transform: 'translateX(-50%)',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            <Text style={{ fontSize: '9px', color: 'rgba(225,29,72,0.7)', fontFamily: 'monospace' }}>
              {markerLabel}
            </Text>
          </Box>
        )}

        {/* Track */}
        <Box style={{ height: '6px', background: '#111', borderRadius: '3px', position: 'relative' }}>
          {/* Gradient fill */}
          <Box
            style={{
              width: `${dotPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #e11d48, #7c3aed)',
              borderRadius: '3px',
            }}
          />
          {/* Glowing dot — always rendered */}
          <Box
            style={{
              position: 'absolute',
              left: `${dotPercent}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              background: '#e11d48',
              borderRadius: '50%',
              border: '2px solid #0d0d0d',
              boxShadow: '0 0 6px rgba(225,29,72,0.6)',
            }}
          />
        </Box>
      </Box>

      {/* Arc pills */}
      <Box style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
        {PROFILE_ARC_MILESTONES.map((arc, i) => {
          const isCompleted = currentArcIndex >= 0 && i < currentArcIndex
          const isCurrent = currentArcIndex >= 0 && i === currentArcIndex

          const bg = isCurrent
            ? 'rgba(124,58,237,0.15)'
            : isCompleted
            ? 'rgba(225,29,72,0.1)'
            : '#111'
          const border = isCurrent
            ? 'rgba(124,58,237,0.35)'
            : isCompleted
            ? 'rgba(225,29,72,0.2)'
            : '#1a1a1a'
          const color = isCurrent ? '#a78bfa' : isCompleted ? '#e11d48' : '#333'
          const label = isCurrent
            ? `${arc.name} ← now`
            : isCompleted
            ? `${arc.name} ✓`
            : arc.name

          return (
            <Box
              key={i}
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                background: bg,
                border: `1px solid ${border}`,
                color,
                borderRadius: '2px',
                fontWeight: isCurrent ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Box>
          )
        })}
      </Box>

      <Text style={{ fontSize: '10px', color: '#555' }}>
        {currentArcIndex >= 0 ? (
          <>Currently in: <span style={{ color: '#888' }}>{PROFILE_ARC_MILESTONES[currentArcIndex]?.name}</span></>
        ) : (
          <span style={{ color: '#555' }}>Not started</span>
        )}
      </Text>
    </Box>
  )
}
