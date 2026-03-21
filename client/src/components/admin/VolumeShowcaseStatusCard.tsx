'use client'

import React, { useEffect, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'

interface VolumeShowcaseStatusCardProps {
  volumeNumber: number
}

type ShowcaseState = 'not-ready' | 'incomplete' | 'ready' | 'loading'

interface ChecklistItemProps {
  label: string
  present: boolean
}

function ChecklistItem({ label, present }: ChecklistItemProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {present ? (
        <CheckCircle size={15} color="#10b981" />
      ) : (
        <XCircle size={15} color="rgba(239,68,68,0.6)" />
      )}
      <Typography
        variant="caption"
        sx={{ color: present ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)' }}
      >
        {label} — {present ? 'uploaded' : <em>missing</em>}
      </Typography>
    </Box>
  )
}

const STATE_CONFIG = {
  loading: {
    border: 'rgba(99,102,241,0.35)',
    bg: 'rgba(99,102,241,0.08)',
    icon: null,
    titleColor: 'rgba(255,255,255,0.5)',
    title: 'Checking status…',
    message: '',
  },
  'not-ready': {
    border: 'rgba(239,68,68,0.35)',
    bg: 'rgba(239,68,68,0.08)',
    icon: <XCircle size={28} color="#ef4444" />,
    titleColor: '#ef4444',
    title: 'Not in Showcase',
    message: 'Both images are required for this volume to appear in the homepage showcase.',
  },
  incomplete: {
    border: 'rgba(234,179,8,0.4)',
    bg: 'rgba(234,179,8,0.07)',
    icon: <AlertTriangle size={28} color="#eab308" />,
    titleColor: '#eab308',
    title: 'Incomplete — Not in Showcase',
    message: 'Upload the missing image to enable showcase.',
  },
  ready: {
    border: 'rgba(16,185,129,0.4)',
    bg: 'rgba(16,185,129,0.07)',
    icon: <CheckCircle size={28} color="#10b981" />,
    titleColor: '#10b981',
    title: 'Showcase Ready',
    message: 'This volume will appear in the homepage showcase automatically.',
  },
}

export function VolumeShowcaseStatusCard({ volumeNumber }: VolumeShowcaseStatusCardProps) {
  const [hasBackground, setHasBackground] = useState(false)
  const [hasPopout, setHasPopout] = useState(false)
  const [state, setState] = useState<ShowcaseState>('loading')

  useEffect(() => {
    let cancelled = false

    async function fetchStatus() {
      try {
        const [bg, pop] = await Promise.all([
          api.getVolumeShowcaseMedia(volumeNumber, 'background'),
          api.getVolumeShowcaseMedia(volumeNumber, 'popout'),
        ])
        if (cancelled) return
        const hasBg = bg !== null
        const hasPop = pop !== null
        setHasBackground(hasBg)
        setHasPopout(hasPop)
        if (hasBg && hasPop) setState('ready')
        else if (hasBg || hasPop) setState('incomplete')
        else setState('not-ready')
      } catch {
        // silently retain last known state on fetch errors
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [volumeNumber])

  const config = STATE_CONFIG[state]

  return (
    <Box
      sx={{
        p: '16px 20px',
        background: config.bg,
        border: `2px solid ${config.border}`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        mb: 3,
      }}
    >
      {config.icon && (
        <Box sx={{ flexShrink: 0, mt: '2px' }}>{config.icon}</Box>
      )}
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body1"
          sx={{ color: config.titleColor, fontWeight: 700, mb: 0.5 }}
        >
          {config.title}
        </Typography>
        {config.message && (
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.55)', mb: 1.5 }}
          >
            {config.message}
          </Typography>
        )}
        {state !== 'loading' && (
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <ChecklistItem label="Background Image" present={hasBackground} />
            <ChecklistItem label="Popout Image" present={hasPopout} />
          </Box>
        )}
      </Box>
    </Box>
  )
}
