'use client'

import React from 'react'
import { Box, Group, Pagination, Text, rem, useMantineTheme } from '@mantine/core'
import type { EntityAccentKey } from '../../lib/mantine-theme'
import { getEntityThemeColor } from '../../lib/mantine-theme'
import classes from './PaginationBar.module.css'

interface PaginationBarProps {
  /** Current page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total number of items */
  total: number
  /** Items per page */
  pageSize: number
  /** Handler for page changes */
  onPageChange: (page: number) => void
  /** Entity type for accent color */
  entityType: EntityAccentKey
  /** Entity name for display (e.g., "characters") */
  entityName: string
}

export function PaginationBar({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  entityType,
  entityName
}: PaginationBarProps) {
  const theme = useMantineTheme()
  const accentColor = getEntityThemeColor(theme, entityType)

  if (totalPages <= 1 && total <= pageSize) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, total)

  const handlePageChange = (page: number) => {
    onPageChange(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Box
      px="md"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: rem(48),
        gap: rem(12)
      }}
    >
      {/* Results info */}
      <Text size="sm" c="dimmed">
        Showing {start}–{end} of {total} {entityName}
      </Text>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <Pagination
          total={totalPages}
          value={currentPage}
          onChange={handlePageChange}
          radius="xl"
          size="md"
          classNames={{ control: classes.control }}
          styles={{
            root: {
              '--pagination-accent': accentColor,
              '--pagination-accent-hover-bg': `${accentColor}20`,
              '--pagination-accent-hover-border': `${accentColor}40`
            } as React.CSSProperties,
            control: {
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: '#ffffff',
              transition: 'all 200ms ease',
              minWidth: rem(36),
              height: rem(36)
            },
            dots: {
              color: 'rgba(255, 255, 255, 0.3)'
            }
          }}
        />
      )}

      {/* Page indicator */}
      {totalPages > 1 && (
        <Text size="xs" c="dimmed" style={{ opacity: 0.6 }}>
          Page {currentPage} of {totalPages}
        </Text>
      )}
    </Box>
  )
}

export default PaginationBar
