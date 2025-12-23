/**
 * Shared timeline constants for consistent event type colors, icons, and labels
 * across CharacterTimeline, GambleTimeline, and ArcTimeline components.
 */

import { Calendar, Dice1, Users, Eye, ArrowUpDown, CheckCircle2 } from 'lucide-react'
import type { MantineTheme } from '@mantine/core'

/**
 * Event type color keys mapped to Mantine theme colors.
 * Used for Badge color prop and other Mantine components.
 */
export const EVENT_COLOR_KEYS: Record<string, keyof MantineTheme['colors']> = {
  gamble: 'red',
  decision: 'yellow',
  reveal: 'blue',
  shift: 'violet',
  resolution: 'green'
}

/**
 * Event type colors as hex values for direct styling.
 * WCAG AA compliant (4.5:1+ contrast on dark backgrounds).
 * Synced with mantine-theme.ts entity colors.
 */
export const EVENT_COLOR_HEX: Record<string, string> = {
  gamble: '#ff5555',     // 4.5:1 contrast - vibrant red
  decision: '#f39c12',   // 5.2:1 contrast - amber
  reveal: '#4dabf7',     // 4.7:1 contrast - bright blue
  shift: '#a855f7',      // 4.5:1 contrast - saturated purple
  resolution: '#51cf66'  // 4.9:1 contrast - bright green
}

/**
 * Default color when event type is unknown or null.
 */
export const DEFAULT_EVENT_COLOR_KEY: keyof MantineTheme['colors'] = 'gray'
export const DEFAULT_EVENT_COLOR_HEX = '#6b7280'

/**
 * Event type icons - consistent across all timeline components.
 */
export const EVENT_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  gamble: Dice1,
  decision: Users,
  reveal: Eye,
  shift: ArrowUpDown,
  resolution: CheckCircle2
}

/**
 * Default icon for unknown event types.
 */
export const DEFAULT_EVENT_ICON = Calendar

/**
 * Human-readable labels for event types.
 */
export const EVENT_LABEL_MAP: Record<string, string> = {
  gamble: 'Gamble',
  decision: 'Decision',
  reveal: 'Reveal',
  shift: 'Shift',
  resolution: 'Resolution'
}

/**
 * Phase colors for GambleTimeline phases.
 * Maps to Mantine theme color keys.
 */
export const PHASE_COLOR_KEYS: Record<string, keyof MantineTheme['colors']> = {
  setup: 'blue',
  gamble: 'orange',
  reveals: 'grape',
  resolution: 'green'
}

// Helper functions

/**
 * Get the Mantine color key for an event type.
 */
export function getEventColorKey(type?: string | null): keyof MantineTheme['colors'] {
  if (!type) return DEFAULT_EVENT_COLOR_KEY
  return EVENT_COLOR_KEYS[type] ?? DEFAULT_EVENT_COLOR_KEY
}

/**
 * Get the hex color for an event type.
 */
export function getEventColorHex(type?: string | null): string {
  if (!type) return DEFAULT_EVENT_COLOR_HEX
  return EVENT_COLOR_HEX[type] ?? DEFAULT_EVENT_COLOR_HEX
}

/**
 * Get the hex color from Mantine theme for an event type.
 */
export function getEventThemeColor(theme: MantineTheme, type?: string | null): string {
  const key = getEventColorKey(type)
  const palette = theme.colors[key]
  return palette ? palette[5] : theme.colors.gray[5]
}

/**
 * Get the icon component for an event type.
 */
export function getEventIcon(type?: string | null): React.ComponentType<{ size?: number }> {
  if (!type) return DEFAULT_EVENT_ICON
  return EVENT_ICON_MAP[type] ?? DEFAULT_EVENT_ICON
}

/**
 * Get the human-readable label for an event type.
 */
export function getEventLabel(type?: string | null): string {
  if (!type) return 'Event'
  return EVENT_LABEL_MAP[type] ?? 'Event'
}

/**
 * Get the phase color from Mantine theme.
 */
export function getPhaseColor(theme: MantineTheme, phase: string): string {
  const key = PHASE_COLOR_KEYS[phase] ?? 'red'
  const palette = theme.colors[key]
  return palette ? palette[5] : theme.colors.red[5]
}
