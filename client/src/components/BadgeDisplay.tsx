'use client';

import React from 'react';
import { Tooltip, Chip, Box } from '@mui/material';
import { Crown } from 'lucide-react';
import { UserBadge, BadgeType } from '../types';
import CustomRoleDisplay from './CustomRoleDisplay';

interface BadgeDisplayProps {
  userBadge: UserBadge;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

interface UserRoleDisplayProps {
  userRole: 'admin' | 'moderator' | 'user';
  customRole?: string | null;
  userBadges?: UserBadge[];
  size?: 'small' | 'medium';
  spacing?: number;
}

// Component to properly display user roles and custom roles with hierarchy
export function UserRoleDisplay({ 
  userRole, 
  customRole, 
  userBadges = [], 
  size = 'medium',
  spacing = 1 
}: UserRoleDisplayProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'flex-start', // Change to flex-start to handle multi-line content better
      justifyContent: 'center',
      gap: spacing, 
      flexWrap: 'wrap',
      // Ensure consistent alignment when items wrap
      '& > *': {
        flexShrink: 0, // Prevent items from shrinking
        alignSelf: 'center', // Center individual items vertically
      }
    }}>
      {/* Functional Roles First - Admin/Moderator with Crown */}
      {(userRole === 'admin' || userRole === 'moderator') && (
        <Chip
          icon={<Crown size={size === 'small' ? 12 : 14} />}
          label={userRole === 'admin' ? 'Admin' : 'Moderator'}
          size={size}
          sx={{
            backgroundColor: userRole === 'admin' ? '#d32f2f' : '#f57c00',
            color: 'white',
            fontWeight: 600,
            '& .MuiChip-icon': {
              color: 'white',
            },
          }}
        />
      )}
      
      {/* Custom Cosmetic Role Second - Only for Active Supporters */}
      {customRole && (
        <CustomRoleDisplay 
          customRole={customRole} 
          size={size}
          showIcon={true}
        />
      )}
      
      {/* Regular Badges Third */}
      {userBadges.map((userBadge) => (
        <BadgeDisplay
          key={userBadge.id}
          userBadge={userBadge}
          size={size === 'small' ? 'sm' : 'md'}
          showTooltip={true}
        />
      ))}
    </Box>
  );
}

export default function BadgeDisplay({
  userBadge,
  size = 'md',
  showTooltip = true,
  className = ''
}: BadgeDisplayProps) {
  const { badge } = userBadge;

  const getChipSize = () => {
    switch (size) {
      case 'sm': return 'small';
      case 'md': return 'medium';
      case 'lg': return 'medium'; // Material-UI doesn't have 'large', use medium
      default: return 'small';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDisplayName = () => {
    if (badge.type === BadgeType.SUPPORTER && userBadge.year) {
      return `${badge.name} ${userBadge.year}`;
    }
    return badge.name;
  };

  const getTooltipContent = () => {
    const isExpired = userBadge.expiresAt && new Date(userBadge.expiresAt) < new Date();
    const isActive = userBadge.isActive;
    
    const content = (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {getDisplayName()}
        </div>
        <div style={{ marginBottom: '4px' }}>
          {badge.description}
        </div>
        
        {/* Status indicators */}
        {!isActive && (
          <div style={{ fontSize: '0.875rem', color: '#f44336', fontWeight: 'bold' }}>
            REMOVED
          </div>
        )}
        {isExpired && (
          <div style={{ fontSize: '0.875rem', color: '#ff9800', fontWeight: 'bold' }}>
            EXPIRED
          </div>
        )}
        
        <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
          Awarded: {formatDate(userBadge.awardedAt)}
        </div>
        {userBadge.expiresAt && (
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            {isExpired ? 'Expired' : 'Expires'}: {formatDate(userBadge.expiresAt)}
          </div>
        )}
        {userBadge.revokedAt && (
          <div style={{ fontSize: '0.875rem', opacity: 0.8, color: '#f44336' }}>
            Removed: {formatDate(userBadge.revokedAt)}
          </div>
        )}
        {userBadge.reason && (
          <div style={{ fontSize: '0.875rem', opacity: 0.8, fontStyle: 'italic' }}>
            Reason: {userBadge.reason}
          </div>
        )}
        {userBadge.revokedReason && (
          <div style={{ fontSize: '0.875rem', opacity: 0.8, fontStyle: 'italic', color: '#f44336' }}>
            Removal reason: {userBadge.revokedReason}
          </div>
        )}
      </div>
    );
    return content;
  };

  const badgeElement = (
    <Chip
      label={getDisplayName()}
      size={getChipSize()}
      variant="outlined"
      className={className}
      sx={{
        borderColor: badge.color,
        color: badge.color,
        backgroundColor: badge.backgroundColor ? `${badge.backgroundColor}33` : 'transparent',
        fontWeight: 600,
        fontSize: size === 'sm' ? '0.6875rem' : size === 'md' ? '0.75rem' : '0.8125rem',
        '&:hover': {
          backgroundColor: badge.backgroundColor ? `${badge.backgroundColor}44` : `${badge.color}11`,
          borderColor: badge.color,
          transform: 'scale(1.02)'
        },
        '& .MuiChip-label': {
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          fontWeight: 600
        }
      }}
    />
  );

  if (showTooltip) {
    return (
      <Tooltip
        title={getTooltipContent()}
        arrow
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              maxWidth: 300,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              fontSize: '0.875rem',
              padding: '8px 12px'
            }
          }
        }}
      >
        {badgeElement}
      </Tooltip>
    );
  }

  return badgeElement;
}