'use client'

import React from 'react'
import { Box, Group, Progress, Text, rem } from '@mantine/core'
import { CheckCircle } from 'lucide-react'

export interface FormStep {
  label: string
  completed: boolean
  required: boolean
}

interface FormProgressIndicatorProps {
  steps: FormStep[]
  accentColor: string
}

export function FormProgressIndicator({ steps, accentColor }: FormProgressIndicatorProps) {
  const requiredSteps = steps.filter(s => s.required)
  const completedRequired = requiredSteps.filter(s => s.completed).length
  const totalRequired = requiredSteps.length
  const progress = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0
  const isComplete = completedRequired === totalRequired

  return (
    <Box
      mb="lg"
      p="md"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: rem(8),
        border: `1px solid ${accentColor}22`
      }}
    >
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          {isComplete && <CheckCircle size={16} color={accentColor} />}
          <Text size="sm" fw={500} c={isComplete ? accentColor : 'dimmed'}>
            {isComplete ? 'Ready to submit' : 'Form Progress'}
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          {completedRequired}/{totalRequired} required
        </Text>
      </Group>
      <Progress
        value={progress}
        color={accentColor}
        size="sm"
        radius="xl"
        styles={{
          root: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        }}
      />
    </Box>
  )
}

export default FormProgressIndicator
