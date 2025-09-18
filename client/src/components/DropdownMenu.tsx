import React from 'react'
import { Menu, Box, Divider } from '@mantine/core'
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

export interface DropdownMenuProps {
  state: DropdownState
  handlers: DropdownHandlers
  items: MenuItemData[] | MenuCategory[]
  isActivePath: (path: string) => boolean
  isCategorized?: boolean
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  state,
  handlers,
  items,
  isActivePath,
  isCategorized = false
}) => {
  const renderMenuItem = (item: MenuItemData) => (
    <Menu.Item
      key={item.href}
      component={Link}
      href={item.href}
      onMouseEnter={handlers.onDropdownEnter}
      onMouseLeave={handlers.onDropdownLeave}
      style={{
        paddingLeft: isCategorized ? 24 : 16,
        borderLeft: isActivePath(item.href) ? '3px solid #e11d48' : '3px solid transparent'
      }}
      leftSection={<Box style={{ display: 'flex' }}>{item.icon}</Box>}
    >
      {item.label}
    </Menu.Item>
  )

  const renderCategorizedItems = (categories: MenuCategory[]) => {
    const items: React.ReactNode[] = []

    categories.forEach((category, index, array) => {
      items.push(
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
        items.push(renderMenuItem(item))
      })

      if (index < array.length - 1) {
        items.push(
          <Menu.Divider
            key={`divider-${category.name}`}
            style={{
              pointerEvents: 'none'
            }}
          />
        )
      }
    })

    return items
  }

  const renderSimpleItems = (menuItems: MenuItemData[]) =>
    menuItems.map(renderMenuItem)

  return (
    <Menu
      opened={state.isOpen}
      onClose={handlers.onClose}
      position="bottom-start"
      offset={4}
      styles={{
        dropdown: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          padding: '4px'
        }
      }}
    >
      <Menu.Dropdown
        onMouseEnter={handlers.onDropdownEnter}
        onMouseLeave={handlers.onDropdownLeave}
        onClick={handlers.onClose}
      >
        {isCategorized
          ? renderCategorizedItems(items as MenuCategory[])
          : renderSimpleItems(items as MenuItemData[])
        }
      </Menu.Dropdown>
    </Menu>
  )
}
