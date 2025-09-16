'use client';

import React, { useState, useEffect } from 'react';
import { UserBadge } from '../types';
import BadgeDisplay from './BadgeDisplay';

interface UserBadgesProps {
  userId: number;
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
  className?: string;
}

export default function UserBadges({
  userId,
  size = 'sm',
  maxDisplay = 5,
  className = ''
}: UserBadgesProps) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/badges`);
        if (!response.ok) {
          throw new Error('Failed to fetch badges');
        }
        const data = await response.json();
        // Handle different response formats - sometimes data is wrapped in a data property
        const badgesArray = Array.isArray(data) ? data : (data.data || []);
        setBadges(badgesArray);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load badges');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  if (loading) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full bg-gray-300 animate-pulse ${
              size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'
            }`}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return null; // Silently fail for badges
  }

  // Ensure badges is an array and has content
  if (!Array.isArray(badges) || badges.length === 0) {
    return null;
  }

  // Sort badges by display order and awarded date
  const sortedBadges = badges.sort((a, b) => {
    if (a.badge.displayOrder !== b.badge.displayOrder) {
      return a.badge.displayOrder - b.badge.displayOrder;
    }
    return new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime();
  });

  const visibleBadges = sortedBadges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {visibleBadges.map((userBadge) => (
        <BadgeDisplay
          key={userBadge.id}
          userBadge={userBadge}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            inline-flex items-center justify-center rounded-full bg-gray-600 text-gray-300
            ${size === 'sm' ? 'w-6 h-6 text-xs' : size === 'md' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'}
          `}
          title={`+${remainingCount} more badge${remainingCount > 1 ? 's' : ''}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}