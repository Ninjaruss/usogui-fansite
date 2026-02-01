import React from 'react'
import { Menu, MenuItemLink, useSidebarState, usePermissions } from 'react-admin'
import { Typography, Divider, Badge } from '@mui/material'
import {
  Users,
  User,
  BookOpen,
  Crown,
  Zap,
  FileText,
  Image,
  Quote,
  Tag,
  Shield,
  Link2,
  Building2,
  MessageSquare
} from 'lucide-react'
import { usePendingCounts } from '../../hooks/usePendingCounts'

const SectionHeader = ({ children }: { children: React.ReactNode }) => {
  const [open] = useSidebarState()

  if (!open) return null

  return (
    <Typography
      variant="overline"
      sx={{
        px: 2,
        pt: 2,
        pb: 0.5,
        display: 'block',
        color: 'text.secondary',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.08em'
      }}
    >
      {children}
    </Typography>
  )
}

export const AdminMenu = () => {
  const { permissions } = usePermissions()
  const { counts } = usePendingCounts()

  return (
    <Menu>
      {/* Core Content Section */}
      <SectionHeader>Core Content</SectionHeader>
      <MenuItemLink
        to="/characters"
        primaryText="Characters"
        leftIcon={<User size={20} />}
      />
      <MenuItemLink
        to="/arcs"
        primaryText="Arcs"
        leftIcon={<BookOpen size={20} />}
      />
      <MenuItemLink
        to="/gambles"
        primaryText="Gambles"
        leftIcon={<Crown size={20} />}
      />
      <MenuItemLink
        to="/events"
        primaryText="Events"
        leftIcon={<Zap size={20} />}
      />

      <Divider sx={{ my: 1 }} />

      {/* Community Submissions Section */}
      <SectionHeader>Community Submissions</SectionHeader>
      <MenuItemLink
        to="/guides"
        primaryText="Guides"
        leftIcon={
          <Badge
            badgeContent={counts.guides}
            color="warning"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                minWidth: '16px',
                height: '16px',
                padding: '0 4px'
              }
            }}
          >
            <FileText size={20} />
          </Badge>
        }
      />
      <MenuItemLink
        to="/media"
        primaryText="Media"
        leftIcon={
          <Badge
            badgeContent={counts.media}
            color="warning"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                minWidth: '16px',
                height: '16px',
                padding: '0 4px'
              }
            }}
          >
            <Image size={20} />
          </Badge>
        }
      />
      <MenuItemLink
        to="/annotations"
        primaryText="Annotations"
        leftIcon={
          <Badge
            badgeContent={counts.annotations}
            color="warning"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                minWidth: '16px',
                height: '16px',
                padding: '0 4px'
              }
            }}
          >
            <MessageSquare size={20} />
          </Badge>
        }
      />

      <Divider sx={{ my: 1 }} />

      {/* Reference Data Section */}
      <SectionHeader>Reference Data</SectionHeader>
      <MenuItemLink
        to="/organizations"
        primaryText="Organizations"
        leftIcon={<Shield size={20} />}
      />
      <MenuItemLink
        to="/quotes"
        primaryText="Quotes"
        leftIcon={<Quote size={20} />}
      />
      <MenuItemLink
        to="/tags"
        primaryText="Tags"
        leftIcon={<Tag size={20} />}
      />

      <Divider sx={{ my: 1 }} />

      {/* Relationships Section */}
      <SectionHeader>Relationships</SectionHeader>
      <MenuItemLink
        to="/character-relationships"
        primaryText="Character Relations"
        leftIcon={<Link2 size={20} />}
      />
      <MenuItemLink
        to="/character-organizations"
        primaryText="Org Memberships"
        leftIcon={<Building2 size={20} />}
      />

      <Divider sx={{ my: 1 }} />

      {/* User Management Section - Admin Only */}
      {permissions === 'admin' && (
        <>
          <SectionHeader>User Management</SectionHeader>
          <MenuItemLink
            to="/users"
            primaryText="Users"
            leftIcon={<Users size={20} />}
          />
        </>
      )}
    </Menu>
  )
}
