'use client';

import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { Star } from 'lucide-react';

interface CustomRoleDisplayProps {
  customRole: string | null;
  size?: 'small' | 'medium';
  showIcon?: boolean;
}

export default function CustomRoleDisplay({
  customRole,
  size = 'medium',
  showIcon = true
}: CustomRoleDisplayProps) {
  if (!customRole) {
    return null;
  }

  return (
    <Chip
      icon={showIcon ? <Star size={size === 'small' ? 12 : 14} /> : undefined}
      label={customRole}
      size={size}
      sx={{
        background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
        color: 'white',
        border: '1px solid rgba(156, 39, 176, 0.3)',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.8125rem',
        boxShadow: '0 2px 4px rgba(156, 39, 176, 0.2)',
        // Allow the chip to grow with content but set a reasonable max-width
        maxWidth: '300px',
        '& .MuiChip-icon': {
          color: 'white',
        },
        '& .MuiChip-label': {
          paddingLeft: showIcon ? '4px' : '12px',
          paddingRight: '12px',
          // Allow text to wrap if needed
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          lineHeight: 1.2,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '&:hover': {
          background: 'linear-gradient(135deg, #8e24aa 0%, #5e35b1 100%)',
          boxShadow: '0 4px 8px rgba(156, 39, 176, 0.3)',
          transform: 'translateY(-1px)',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    />
  );
}
