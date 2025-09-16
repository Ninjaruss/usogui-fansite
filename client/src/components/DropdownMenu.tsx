import React from 'react'
import { Menu, MenuItem, Box, Divider } from '@mui/material'
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
    <MenuItem
      key={item.href}
      component={Link}
      href={item.href}
      onMouseEnter={handlers.onDropdownEnter}
      onMouseLeave={handlers.onDropdownEnter}
      sx={{
        pl: isCategorized ? 3 : 2,
        backgroundColor: isActivePath(item.href) ? 'action.selected' : 'transparent',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
    >
      <Box sx={{ mr: 1, display: 'flex' }}>{item.icon}</Box>
      {item.label}
    </MenuItem>
  )

  const renderCategorizedItems = (categories: MenuCategory[]) => {
    const items: React.ReactNode[] = []

    categories.forEach((category, index, array) => {
      items.push(
        <MenuItem
          key={`header-${category.name}`}
          disabled
          onMouseEnter={handlers.onDropdownEnter}
          onMouseLeave={handlers.onDropdownEnter}
          sx={{
            fontWeight: 'bold',
            opacity: '1 !important',
            color: `${category.color || '#2196f3'} !important`,
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            '&.Mui-disabled': {
              color: `${category.color || '#2196f3'} !important`,
              opacity: '1 !important'
            }
          }}
        >
          {category.name}
        </MenuItem>
      )

      category.items.forEach((item) => {
        items.push(renderMenuItem(item))
      })

      if (index < array.length - 1) {
        items.push(
          <Divider
            key={`divider-${category.name}`}
            sx={{
              my: 0.5,
              pointerEvents: 'none'
            }}
            onMouseEnter={handlers.onDropdownEnter}
            onMouseLeave={handlers.onDropdownEnter}
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
      anchorEl={state.anchorEl}
      open={state.isOpen}
      onClose={handlers.onClose}
      onClick={handlers.onClose}
      onMouseEnter={handlers.onDropdownEnter}
      onMouseLeave={handlers.onDropdownLeave}
      autoFocus={false}
      disableAutoFocusItem={true}
      MenuListProps={{
        onMouseEnter: handlers.onDropdownEnter,
        onMouseLeave: handlers.onDropdownLeave,
        disablePadding: false,
        autoFocus: false,
        autoFocusItem: false
      }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      sx={{
        '& .MuiPaper-root': {
          marginTop: '4px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          padding: '4px'
        }
      }}
    >
      {isCategorized
        ? renderCategorizedItems(items as MenuCategory[])
        : renderSimpleItems(items as MenuItemData[])
      }
    </Menu>
  )
}