'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput
} from '@mantine/core';
import { UserBadge, BadgeType } from '../types';
import { api } from '../lib/api';
import { API_BASE_URL } from '../lib/api';

interface ProfilePictureOption {
  type: string;
  label: string;
  description: string;
  requiredBadge?: BadgeType;
  mediaId?: number;
  mediaUrl?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface ProfilePictureSelectorProps {
  currentUserId: number;
  currentProfileType: string;
  currentSelectedMediaId?: number | null;
  onSelect: (type: string, mediaId?: number) => void;
}

export default function ProfilePictureSelector({
  currentUserId,
  currentProfileType,
  onSelect
}: ProfilePictureSelectorProps) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [characterMedia, setCharacterMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [characterFilter, setCharacterFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user badges
  const badgesResponse = await fetch(`${API_BASE_URL}/users/${currentUserId}/badges`);
        if (badgesResponse.ok) {
          const badges = await badgesResponse.json();
          // Ensure we store an array (API might return null or an object in some cases)
          setUserBadges(Array.isArray(badges) ? badges : (badges?.data && Array.isArray(badges.data) ? badges.data : []));
        }
      } catch (error) {
        console.error('Failed to fetch profile picture data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  const fetchCharacterMedia = async () => {
    setMediaLoading(true);
    try {
      // Use the API client to get approved entity display media for characters
      const response = await api.getApprovedMedia({
        ownerType: 'character',
        purpose: 'entity_display',
        limit: 1000 // Get a large number to show all available
      });

      if (response?.data) {
        // Sort by character name - fix the property access
        const sortedMedia = response.data.sort((a: any, b: any) => {
          const nameA = a.character?.name || 'Unknown Character';
          const nameB = b.character?.name || 'Unknown Character';
          return nameA.localeCompare(nameB);
        });
        setCharacterMedia(sortedMedia);
      }
    } catch (error) {
      console.error('Failed to fetch character media:', error);
    } finally {
      setMediaLoading(false);
    }
  };

  const hasActiveBadge = (requiredBadge: BadgeType): boolean => {
    if (!Array.isArray(userBadges)) return false;
    return userBadges.some(userBadge =>
      userBadge?.badge?.type === requiredBadge &&
      userBadge?.isActive &&
      (!userBadge?.expiresAt || new Date(userBadge.expiresAt) > new Date())
    );
  };

  const getProfileOptions = (): ProfilePictureOption[] => {
    const options: ProfilePictureOption[] = [
      {
        type: 'discord',
        label: 'Discord Avatar',
        description: 'Use your Discord profile picture',
      },
      {
        type: 'character_media',
        label: 'Character Media',
        description: 'Choose from character images',
      },
    ];

    // Premium character media (for supporters)
    if (hasActiveBadge(BadgeType.SUPPORTER) || hasActiveBadge(BadgeType.ACTIVE_SUPPORTER) || hasActiveBadge(BadgeType.SPONSOR)) {
      options.push({
        type: 'premium_character_media',
        label: 'Premium Character Media',
        description: 'Exclusive high-quality character images',
        requiredBadge: BadgeType.SUPPORTER,
      });
    } else {
      options.push({
        type: 'premium_character_media',
        label: 'Premium Character Media',
        description: 'Exclusive high-quality character images (Supporters only)',
        requiredBadge: BadgeType.SUPPORTER,
        disabled: true,
        disabledReason: 'Requires Supporter badge',
      });
    }

    return options;
  };

  const handleOptionSelect = (optionType: string) => {
    setSelectedOption(selectedOption === optionType ? null : optionType);
    
    if (optionType === 'character_media' && characterMedia.length === 0) {
      fetchCharacterMedia();
    }
    
    // If selecting discord or premium (without media selection), call onSelect immediately
    if (optionType === 'discord') {
      onSelect(optionType);
    }
  };

  const handleMediaSelect = (mediaId: number, optionType: string) => {
    onSelect(optionType, mediaId);
    setSelectedOption(null); // Close the media selection
  };

  // Group media by character for better organization
  const groupedCharacterMedia = characterMedia.reduce((groups: { [key: string]: any[] }, media) => {
    const characterName = media.character?.name || 'Unknown Character';
    if (!groups[characterName]) {
      groups[characterName] = [];
    }
    groups[characterName].push(media);
    return groups;
  }, {});

  const filteredCharacterMedia = characterFilter
    ? characterMedia.filter(media => {
        const characterName = media.character?.name || 'Unknown Character';
        return characterName.toLowerCase().includes(characterFilter.toLowerCase());
      })
    : characterMedia;

  // Group filtered media by character
  const filteredGroupedMedia = filteredCharacterMedia.reduce((groups: { [key: string]: any[] }, media) => {
    const characterName = media.character?.name || 'Unknown Character';
    if (!groups[characterName]) {
      groups[characterName] = [];
    }
    groups[characterName].push(media);
    return groups;
  }, {});

  if (loading) {
    return (
      <Card shadow="sm" padding="md" radius="md">
        <Stack gap="md">
          <Skeleton height={24} width="40%" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={64} />
          ))}
        </Stack>
      </Card>
    );
  }

  const options = getProfileOptions();

  return (
    <Card shadow="sm" padding="md" radius="md">
      <Stack gap="md">
        {options.map((option) => (
          <Box key={option.type}>
            <Box
              p="md"
              style={{
                border: `1px solid ${
                  option.disabled
                    ? 'rgba(255, 255, 255, 0.15)'
                    : currentProfileType === option.type || selectedOption === option.type
                      ? '#e11d48'
                      : 'rgba(255, 255, 255, 0.15)'
                }`,
                backgroundColor: option.disabled
                  ? 'rgba(255, 255, 255, 0.03)'
                  : currentProfileType === option.type || selectedOption === option.type
                    ? 'rgba(225, 29, 72, 0.1)'
                    : 'transparent',
                borderRadius: '6px',
                cursor: option.disabled ? 'not-allowed' : 'pointer',
                opacity: option.disabled ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                if (!option.disabled) {
                  handleOptionSelect(option.type);
                }
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Group gap="sm">
                    <Text fw={500} size="md">
                      {option.label}
                    </Text>
                    {option.requiredBadge && (
                      <Badge
                        variant="light"
                        color={hasActiveBadge(option.requiredBadge) ? 'green' : 'gray'}
                        size="sm"
                      >
                        {option.requiredBadge === BadgeType.SUPPORTER && '💎 Supporter'}
                        {option.requiredBadge === BadgeType.ACTIVE_SUPPORTER && '⭐ Active'}
                        {option.requiredBadge === BadgeType.SPONSOR && '👑 Sponsor'}
                      </Badge>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed">
                    {option.description}
                  </Text>
                  {option.disabled && option.disabledReason && (
                    <Text size="sm" c="red">
                      {option.disabledReason}
                    </Text>
                  )}
                </Stack>

                <Group gap="sm">
                  {currentProfileType === option.type && (
                    <Text c="blue" fw={500}>
                      ✓
                    </Text>
                  )}
                  {(option.type === 'character_media' || option.type === 'premium_character_media') && (
                    <Text c="dimmed" size="sm">
                      {selectedOption === option.type ? '▼' : '▶'}
                    </Text>
                  )}
                </Group>
              </Group>
            </Box>

            {/* Character Media Selection */}
            {selectedOption === option.type && option.type === 'character_media' && (
              <Box mt="sm" p="md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '6px' }}>
                <Stack gap="md">
                  <TextInput
                    placeholder="Filter by character name..."
                    value={characterFilter}
                    onChange={(e) => setCharacterFilter(e.target.value)}
                    size="sm"
                  />
                  
                  {mediaLoading ? (
                    <Stack gap="sm">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} height={60} />
                      ))}
                    </Stack>
                  ) : (
                    <Stack gap="md" style={{ maxHeight: '400px', overflow: 'auto' }}>
                      {Object.keys(filteredGroupedMedia).length > 0 ? (
                        Object.entries(filteredGroupedMedia)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([characterName, mediaItems]) => (
                          <Box key={characterName}>
                            <Text fw={600} size="sm" mb="xs" c="blue">
                              {characterName}
                            </Text>
                            <Stack gap="xs">
                              {mediaItems.map((media) => (
                                <Box
                                  key={media.id}
                                  p="sm"
                                  ml="md"
                                  style={{
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: 'transparent'
                                  }}
                                  onMouseEnter={(e: any) => {
                                    e.currentTarget.style.borderColor = '#e11d48'
                                    e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.05)'
                                  }}
                                  onMouseLeave={(e: any) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                  onClick={() => handleMediaSelect(media.id, option.type)}
                                >
                                  <Group gap="md">
                                    {media.url && (
                                      <Box
                                        style={{
                                          width: '40px',
                                          height: '40px',
                                          borderRadius: '4px',
                                          backgroundImage: `url(${media.url})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                        }}
                                      />
                                    )}
                                    <Stack gap="xs" style={{ flex: 1 }}>
                                      <Text fw={500} size="sm">
                                        {media.title || media.description || 'Untitled Media'}
                                      </Text>
                                      {media.description && media.title && (
                                        <Text size="xs" c="dimmed" lineClamp={1}>
                                          {media.description}
                                        </Text>
                                      )}
                                    </Stack>
                                  </Group>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        ))
                      ) : (
                        <Text size="sm" c="dimmed" ta="center">
                          {characterFilter ? 'No character media found matching your search' : 'No character media available'}
                        </Text>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        ))}

        <Alert variant="light" color="blue" icon="☕">
          <Stack gap="sm">
            <Text fw={500} size="md">
              Want to unlock more options?
            </Text>
            <Text size="sm">
              Support our fansite to get access to premium profile pictures and exclusive content!
            </Text>
            <Button
              component="a"
              href="https://ko-fi.com/usogui"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="filled"
              color="blue"
            >
              ☕ Support on Ko-fi
            </Button>
          </Stack>
        </Alert>
      </Stack>
    </Card>
  );
}
