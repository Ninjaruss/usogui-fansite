'use client'

import React from 'react'
import { Box, Group, Stack, Text, rem } from '@mantine/core'

interface FormSectionProps {
  title: string
  description?: string
  icon?: React.ReactNode
  accentColor: string
  required?: boolean
  children: React.ReactNode
}

export function FormSection({
  title,
  description,
  icon,
  accentColor,
  required,
  children
}: FormSectionProps) {
  return (
    <Box
      style={{
        padding: rem(24),
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: rem(12),
        border: `1px solid ${accentColor}33`
      }}
    >
      <Stack gap="md">
        <Group gap="sm">
          {icon}
          <Text fw={600} c={accentColor}>
            {title}
            {required && (
              <Text component="span" c="red.5" ml={4}>
                *
              </Text>
            )}
          </Text>
        </Group>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
        {children}
      </Stack>
    </Box>
  )
}

export default FormSection
