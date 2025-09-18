import React, { useState } from 'react'
import { Button, Box, Menu } from '@mantine/core'
import Link from 'next/link'
import { DropdownHandlers, DropdownState } from '../hooks/useDropdown'

export interface MenuItemData {
  label: string
  href: string
  icon: React.ReactNode
}

export interface MenuCategory {
  name: string
  items: MenuItemData[]
  color?: string
}

export interface DropdownButtonProps {
  label: string
  state: DropdownState
  handlers: DropdownHandlers
  items?: MenuItemData[] | MenuCategory[]
  isActivePath?: (path: string) => boolean
  isCategorized?: boolean
  children?: React.ReactNode
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  label,
  state,
  handlers,
  items,
  isActivePath,
  isCategorized = false,
  children
}) => {
  const accentColor = '#e11d48'
  const hoverOutline = 'rgba(225, 29, 72, 0.55)'
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null)

  const renderMenuItem = (item: MenuItemData) => {
    const isActive = isActivePath?.(item.href) ?? false
    const isHighlighted = highlightedItem === item.href || isActive
    const outlineColor = isActive ? accentColor : hoverOutline

    return (
      <Menu.Item
        key={item.href}
        component={Link}
        href={item.href}
        onMouseEnter={() => {
          setHighlightedItem(item.href)
          handlers.onDropdownEnter()
        }}
        onMouseLeave={() => {
          setHighlightedItem((current) => (current === item.href ? null : current))
          handlers.onDropdownLeave()
        }}
        onFocus={() => setHighlightedItem(item.href)}
        onBlur={() => {
          setHighlightedItem((current) => (current === item.href ? null : current))
        }}
        style={{
          paddingLeft: isCategorized ? 24 : 16,
          borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
          color: '#f8fafc',
          borderRadius: 6,
          transition: 'box-shadow 0.2s ease, border-left-color 0.2s ease',
          backgroundColor: 'transparent',
          boxShadow: isHighlighted ? `inset 0 0 0 1px ${outlineColor}` : 'none'
        }}
        leftSection={<Box style={{ display: 'flex' }}>{item.icon}</Box>}
      >
        {item.label}
      </Menu.Item>
    )
  }

  const renderCategorizedItems = (categories: MenuCategory[]) => {
    const menuItems: React.ReactNode[] = []

    categories.forEach((category, index, array) => {
      menuItems.push(
        <Menu.Label
          key={`header-${category.name}`}
          style={{
            fontWeight: 'bold',
            color: category.color || '#2196f3',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {category.name}
        </Menu.Label>
      )

      category.items.forEach((item) => {
        menuItems.push(renderMenuItem(item))
      })

      if (index < array.length - 1) {
        menuItems.push(
          <Menu.Divider
            key={`divider-${category.name}`}
            style={{
              pointerEvents: 'none'
            }}
          />
        )
      }
    })

    return menuItems
  }

  const renderSimpleItems = (menuItems: MenuItemData[]) =>
    menuItems.map(renderMenuItem)

  return (
    <Box
      style={{ position: 'relative' }}
      onMouseEnter={handlers.onEnter}
      onMouseLeave={handlers.onLeave}
    >
      <Menu
        opened={state.isOpen}
        onClose={handlers.onClose}
        position="bottom-start"
        offset={0}
        withArrow={false}
        closeOnClickOutside={true}
        closeOnEscape={true}
        trapFocus={false}
        returnFocus={false}
        keepMounted
        zIndex={2000}
        styles={{
          dropdown: {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'var(--mantine-color-dark-7)',
            padding: '8px',
            borderRadius: '8px',
            minWidth: '200px',
            marginTop: '0px'
          }
        }}
      >
        <Menu.Target>
          <Button
            variant="subtle"
            color="gray"
            style={{
              backgroundColor: 'transparent',
              cursor: 'default',
              color: 'white',
              boxShadow: state.isOpen ? `inset 0 0 0 1px ${accentColor}` : 'none'
            }}
            styles={{
              root: {
                '&:hover': {
                  backgroundColor: 'transparent',
                  boxShadow: `inset 0 0 0 1px rgba(225, 29, 72, 0.55)`
                }
              }
            }}
          >
            {label}
          </Button>
        </Menu.Target>

        {items && (
          <Menu.Dropdown
            onMouseEnter={() => {
              handlers.onDropdownEnter()
            }}
            onMouseLeave={() => {
              handlers.onDropdownLeave()
            }}
            onClick={handlers.onClose}
            style={{
              marginTop: 0
            }}
          >
            {isCategorized
              ? renderCategorizedItems(items as MenuCategory[])
              : renderSimpleItems(items as MenuItemData[])
            }
          </Menu.Dropdown>
        )}
      </Menu>

      {/* Arrow indicator */}
      <Box
        style={{
          position: 'absolute',
          bottom: -2,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: state.isOpen ? '6px solid white' : 'none',
          borderBottom: state.isOpen ? 'none' : '6px solid rgba(255, 255, 255, 0.3)',
          opacity: state.isOpen ? 1 : 0.5,
          transition: 'all 0.2s ease-in-out',
          zIndex: 1001,
          pointerEvents: 'none'
        }}
      />

      {children}
    </Box>
  )
}
