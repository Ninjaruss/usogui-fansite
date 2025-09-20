'use client';

import React, { useState, useEffect } from 'react';
import { UserBadge, BadgeType } from '../types';
import BadgeDisplay from './BadgeDisplay';
import { API_BASE_URL } from '../lib/api';
import CustomRoleDisplay from './CustomRoleDisplay';
import UserProfileImage from './UserProfileImage';

interface SupporterData {
  user: {
    id: number;
    username: string;
    customRole: string | null;
    discordAvatar: string | null;
    profilePictureType: 'discord' | 'character_media' | 'premium_character_media' | 'animated_avatar' | 'custom_frame' | 'exclusive_artwork' | null;
    selectedCharacterMediaId: number | null;
    selectedCharacterMedia: any | null;
  };
  badge: {
    id: number;
    name: string;
    description: string | null;
    type: BadgeType;
    icon: string;
    color: string;
    backgroundColor: string | null;
    displayOrder: number;
    isActive: boolean;
    isManuallyAwardable: boolean;
    createdAt: string;
    updatedAt: string;
  };
  awardedAt: string;
  year: number | null;
}

export default function SupportersList() {
  const [supporters, setSupporters] = useState<SupporterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupporters = async () => {
      try {
  const response = await fetch(`${API_BASE_URL}/badges/supporters`);
        if (!response.ok) {
          throw new Error('Failed to fetch supporters');
        }
        const data = await response.json();
        setSupporters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load supporters');
      } finally {
        setLoading(false);
      }
    };

    fetchSupporters();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                </div>
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Our Supporters</h2>
        <p className="text-red-600 dark:text-red-400">Failed to load supporters: {error}</p>
      </div>
    );
  }

  if (supporters.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Our Supporters</h2>
        <p className="text-gray-400">
          No supporters yet. Be the first to support our fansite!
        </p>
      </div>
    );
  }

  // Group by badge type for better organization
  const groupedSupporters = supporters.reduce((acc, supporter) => {
    const badgeType = supporter.badge.type;
    if (!acc[badgeType]) {
      acc[badgeType] = [];
    }
    acc[badgeType].push(supporter);
    return acc;
  }, {} as Record<string, SupporterData[]>);

  // Sort groups by badge display order
  const sortedGroups = Object.entries(groupedSupporters).sort(([, a], [, b]) => {
    return a[0].badge.displayOrder - b[0].badge.displayOrder;
  });

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-white">Our Supporters</h2>
        <span className="text-red-500">❤️</span>
      </div>

      <p className="text-gray-400 mb-6">
        Thank you to all our amazing supporters who help keep this fansite running!
      </p>

      {sortedGroups.map(([badgeType, groupSupporters]) => {
        const sortedSupporters = groupSupporters.sort((a, b) =>
          new Date(a.awardedAt).getTime() - new Date(b.awardedAt).getTime()
        );

        return (
          <div key={badgeType} className="mb-8 last:mb-0">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span>{groupSupporters[0].badge.icon}</span>
              {badgeType === 'sponsor' && 'Sponsors'}
              {badgeType === 'supporter' && 'Supporters'}
              {badgeType === 'custom' && 'Special Contributors'}
              <span className="text-sm font-normal text-gray-500">
                ({groupSupporters.length})
              </span>
            </h3>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedSupporters.map((supporter) => (
                <div
                  key={`${supporter.user.id}-${supporter.badge.id}`}
                  className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg"
                >
                  <UserProfileImage
                    user={supporter.user}
                    size={48}
                    className="flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white mb-1">
                      {supporter.user.username}
                    </div>
                    {supporter.user.customRole && (
                      <div className="mb-1">
                        <CustomRoleDisplay
                          customRole={supporter.user.customRole}
                          size="small"
                        />
                      </div>
                    )}
                    <div className="text-sm text-gray-400">
                      Since {new Date(supporter.awardedAt).getFullYear()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <BadgeDisplay
                      userBadge={{
                        id: 0,
                        userId: supporter.user.id,
                        badgeId: supporter.badge.id,
                        awardedAt: supporter.awardedAt,
                        expiresAt: null,
                        year: supporter.year,
                        reason: null,
                        isActive: true,
                        badge: supporter.badge,
                      }}
                      size="md"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-8 pt-6 border-t border-gray-600">
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">
            Want to support us?
          </p>
          <a
            href="https://ko-fi.com/usogui" // Replace with your actual Ko-fi link
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            ☕ Support on Ko-fi
          </a>
        </div>
      </div>
    </div>
  );
}