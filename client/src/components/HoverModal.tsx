'use client'

import React, { useEffect } from 'react'
import { ActionIcon, Box, Paper, Stack, rem } from '@mantine/core'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { backgroundStyles } from '../lib/mantine-theme'

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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
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
                backgroundColor: backgroundStyles.modal,
                border: `2px solid ${accentColor}`,
                backdropFilter: 'blur(10px)',
                width: rem(width),
                maxWidth: '90vw',
                position: 'relative'
              }}
            >
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
              <Stack gap="sm">
                {children}
              </Stack>
            </Paper>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default HoverModal
