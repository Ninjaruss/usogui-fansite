'use client'

import React from 'react'
import { Box, Group, Text, Title, rem } from '@mantine/core'
import { motion } from 'motion/react'

interface SubmitPageHeaderProps {
  label: string
  title: string
  description: string
  icon: React.ReactNode
  accentColor: string
}

export function SubmitPageHeader({
  label,
  title,
  description,
  icon,
  accentColor
}: SubmitPageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <Box
        mb="xl"
        style={{
          borderBottom: `1px solid ${accentColor}25`,
          paddingBottom: rem(24),
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top accent line */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: rem(2),
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
            opacity: 0.85
          }}
        />

        <Group gap="md" align="flex-start" mt="md">
          {/* Icon with radial glow */}
          <Box
            style={{
              position: 'relative',
              width: rem(52),
              height: rem(52),
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: rem(12),
                backgroundColor: `${accentColor}14`,
                border: `1px solid ${accentColor}30`
              }}
            />
            <Box style={{ position: 'relative', color: accentColor }}>
              {icon}
            </Box>
          </Box>

          <Box style={{ flex: 1 }}>
            <Group gap="sm" mb={rem(4)} align="center">
              <Text
                size="xs"
                style={{
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase' as const,
                  color: accentColor,
                  fontWeight: 600
                }}
              >
                {label}
              </Text>
            </Group>

            <Title
              order={1}
              style={{
                fontFamily: 'var(--font-opti-goudy-text)',
                fontSize: rem(34),
                fontWeight: 400,
                lineHeight: 1.1
              }}
            >
              {title}
            </Title>

            <Text size="sm" c="dimmed" mt="xs" style={{ maxWidth: rem(540) }}>
              {description}
            </Text>
          </Box>
        </Group>
      </Box>
    </motion.div>
  )
}

export default SubmitPageHeader
