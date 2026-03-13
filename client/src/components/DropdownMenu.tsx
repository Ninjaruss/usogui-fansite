import React from 'react'
import { Menu, Divider } from '@mantine/core'
import Link from 'next/link'

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

export interface DropdownState {
  isOpen: boolean
}

export interface DropdownHandlers {
  setOpen: (opened: boolean) => void
  onDropdownEnter: () => void
  onDropdownLeave: () => void
  close: () => void
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
      leftSection={item.icon}
      style={{
        borderLeft: isActivePath(item.href) ? '3px solid #e11d48' : '3px solid transparent',
        boxShadow: isActivePath(item.href) ? 'inset 3px 0 8px rgba(225,29,72,0.15)' : 'none',
        borderRadius: '4px',
        transition: 'background-color 150ms ease, color 150ms ease'
      }}
    >
      {item.label}
    </Menu.Item>
  )

  const renderCategorizedItems = (categories: MenuCategory[]) => {
    const items: React.ReactNode[] = []

    categories.forEach((category, index, array) => {
      const categoryColor = category.color || '#4dabf7'
      items.push(
        <Menu.Label
          key={`header-${category.name}`}
          style={{
            fontFamily: 'var(--font-noto-sans)',
            fontWeight: 600,
            color: categoryColor,
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginTop: '8px',
            marginBottom: '2px',
            paddingTop: '5px',
            paddingBottom: '5px',
            paddingLeft: '12px',
            paddingRight: '8px',
            borderLeft: '3px solid currentColor',
            borderRadius: '0 3px 3px 0',
            backgroundColor: `${categoryColor}14`
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
      onChange={handlers.setOpen}
      position="bottom-start"
      offset={6}
      styles={{
        dropdown: {
          backgroundColor: 'rgba(10, 10, 12, 0.97)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderTop: '2px solid rgba(225, 29, 72, 0.4)',
          borderRadius: '6px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(225,29,72,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px) saturate(160%)',
          padding: '6px'
        }
      }}
    >
      <Menu.Dropdown
        onPointerEnter={handlers.onDropdownEnter}
        onPointerLeave={handlers.onDropdownLeave}
        onMouseEnter={handlers.onDropdownEnter}
        onMouseLeave={handlers.onDropdownLeave}
        onClick={handlers.close}
      >
        {isCategorized
          ? renderCategorizedItems(items as MenuCategory[])
          : renderSimpleItems(items as MenuItemData[])
        }
      </Menu.Dropdown>
    </Menu>
  )
}
