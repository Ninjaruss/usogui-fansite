'use client'

import React, { useEffect } from 'react'
import { ActionIcon, Box, Paper, Stack, Text, rem } from '@mantine/core'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface HoverModalPosition {
  x: number
  y: number
}

interface HoverModalProps {
  isOpen: boolean
  position: HoverModalPosition | null
  accentColor: string
  width?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClose?: () => void
  showCloseButton?: boolean
  /** Optional entity type label shown as eyebrow above content */
  entityLabel?: string
  children: React.ReactNode
}

export function HoverModal({
  isOpen,
  position,
  accentColor,
  width = 300,
  onMouseEnter,
  onMouseLeave,
  onClose,
  showCloseButton = false,
  entityLabel,
  children
}: HoverModalProps) {
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen || !onClose) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !position) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && position && (
        <>
          {/* Backdrop for touch devices - visual only, allows taps to pass through */}
          {showCloseButton && onClose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                pointerEvents: 'none'
              }}
              aria-label="Preview backdrop"
            />
          )}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              left: position.x - width / 2,
              top: position.y,
              zIndex: 1001,
              pointerEvents: 'auto'
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <Paper
              shadow="xl"
              radius="lg"
              p="md"
              style={{
                backgroundColor: 'rgba(6,6,14,0.97)',
                border: `1px solid ${accentColor}CC`,
                backdropFilter: 'blur(10px)',
                width: rem(width),
                maxWidth: '90vw',
                position: 'relative',
                boxShadow: `0 24px 48px rgba(0,0,0,0.80), 0 0 0 1px ${accentColor}20, 0 0 32px ${accentColor}08, inset 0 0 0 1px ${accentColor}18`
              }}
            >
              {/* Top accent stripe — flush with card edges */}
              <Box aria-hidden style={{
                height: 3,
                background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}66 60%, transparent 100%)`,
                borderRadius: `${rem(8)} ${rem(8)} 0 0`,
                marginTop: rem(-16),
                marginLeft: rem(-16),
                marginRight: rem(-16),
                marginBottom: rem(8),
              }} />

              {/* Horizontal scan-line texture */}
              <Box
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 3px,
                    rgba(255,255,255,0.012) 3px,
                    rgba(255,255,255,0.012) 4px
                  )`,
                  borderRadius: 'inherit',
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              />

              {/* Close button for touch devices */}
              {showCloseButton && onClose && (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                  aria-label="Close preview"
                  style={{
                    position: 'absolute',
                    top: rem(8),
                    right: rem(8),
                    zIndex: 10
                  }}
                >
                  <X size={16} />
                </ActionIcon>
              )}
              <Box style={{ position: 'relative', zIndex: 1 }}>
                <Stack gap="sm">
                  {entityLabel && (
                    <Text
                      className="eyebrow-label"
                      style={{ color: accentColor, fontSize: '0.6rem', letterSpacing: '0.22em' }}
                    >
                      {entityLabel.toUpperCase()}
                    </Text>
                  )}
                  {children}
                </Stack>
              </Box>
            </Paper>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default HoverModal
