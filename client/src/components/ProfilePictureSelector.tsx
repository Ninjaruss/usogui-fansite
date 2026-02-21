'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Grid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors } from '../lib/mantine-theme';
import { UserBadge, BadgeType } from '../types';
import { api } from '../lib/api';
import { API_BASE_URL } from '../lib/api';
import TimelineSpoilerWrapper from './TimelineSpoilerWrapper';

// Component to handle multiple media items per character
interface CharacterMediaCardProps {
  characterName: string;
  medias: any[];
  onMediaSelect: (mediaId: number) => void;
}

function CharacterMediaCard({ characterName, medias, onMediaSelect }: CharacterMediaCardProps) {
  const theme = useMantineTheme();

  return (
    <Card
      p="md"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.02)'
      }}
    >
      <Stack gap="md" align="center">
        {/* Character name header */}
        <Text size="lg" fw={700} ta="center" style={{ lineHeight: 1.2 }}>
          {characterName}
        </Text>

        {/* Media images grid */}
        <Box style={{ width: '100%' }}>
          <Grid gutter="sm">
            {medias.map((media: any) => (
              <Grid.Col key={media.id} span={medias.length === 1 ? 12 : 6}>
                <MediaImageCard
                  media={media}
                  onSelect={() => onMediaSelect(media.id)}
                />
              </Grid.Col>
            ))}
          </Grid>
        </Box>
      </Stack>
    </Card>
  );
}

// Individual media image component with spoiler detection
interface MediaImageCardProps {
  media: any;
  onSelect: () => void;
}

function MediaImageCard({ media, onSelect }: MediaImageCardProps) {
  const theme = useMantineTheme();
  const chapterNumber = media.chapterNumber;
  const characterFirstAppearance = media.character?.firstAppearanceChapter;

  // Use the more specific chapter number if available, fallback to character first appearance
  const spoilerChapter = chapterNumber || characterFirstAppearance;

  return (
    <Card
      p="sm"
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        height: '100%'
      }}
      styles={{
        root: {
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        }
      }}
    >
      <Stack gap="sm" align="center">
        <Box style={{ position: 'relative' }}>
          <TimelineSpoilerWrapper chapterNumber={spoilerChapter}>
            <Box
              style={{
                width: 120,
                height: 120,
                backgroundImage: `url(${media.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            />
          </TimelineSpoilerWrapper>
          {chapterNumber && (
            <Badge
              size="sm"
              variant="filled"
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: getEntityThemeColor(theme, 'arc'),
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              Ch.{chapterNumber}
            </Badge>
          )}
        </Box>

        <Stack gap={2} align="center" style={{ textAlign: 'center', width: '100%' }}>
          {media.description && (
            <Text
              size="xs"
              ta="center"
              style={{
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {media.description}
            </Text>
          )}
          {!media.description && chapterNumber && (
            <Text size="xs" c="dimmed" ta="center">
              Chapter {chapterNumber}
            </Text>
          )}
          {!media.description && !chapterNumber && characterFirstAppearance && (
            <Text size="xs" c="dimmed" ta="center">
              Ch.{characterFirstAppearance}
            </Text>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

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
  const theme = useMantineTheme();
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
        type: 'fluxer',
        label: 'Fluxer Avatar',
        description: 'Use your Fluxer profile picture',
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
    
    // If selecting fluxer, call onSelect immediately
    if (optionType === 'fluxer') {
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

  // Group filtered media by character and sort by character name
  const groupedFilteredMedia = filteredCharacterMedia.reduce((groups: { [key: string]: any[] }, media) => {
    const characterName = media.character?.name || 'Unknown Character';
    if (!groups[characterName]) {
      groups[characterName] = [];
    }
    groups[characterName].push(media);
    return groups;
  }, {});

  // Convert to array and sort by character name
  const sortedCharacterGroups = Object.entries(groupedFilteredMedia)
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

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
              <Group justify="space-between">
                <Box>
                  <Text fw={500} size="sm">
                    {option.label}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {option.description}
                  </Text>
                  {option.requiredBadge && option.disabled && (
                    <Text size="xs" c="red" mt={4}>
                      {option.disabledReason}
                    </Text>
                  )}
                </Box>
                {option.requiredBadge && !option.disabled && (
                  <Badge size="xs" variant="light" color="yellow">
                    Premium
                  </Badge>
                )}
              </Group>
            </Box>

            {/* Character media selection */}
            {(selectedOption === option.type && option.type === 'character_media') && (
              <Box mt="md" p="md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={500} size="sm">
                      Choose a Character Image
                    </Text>
                    <TextInput
                      placeholder="Search characters..."
                      value={characterFilter}
                      onChange={(e) => setCharacterFilter(e.target.value)}
                      size="xs"
                      style={{ flex: 1, maxWidth: 200 }}
                    />
                  </Group>

                  {mediaLoading ? (
                    <Stack gap="sm">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height={80} />
                      ))}
                    </Stack>
                  ) : (
                    <Box>
                      {sortedCharacterGroups.length > 0 ? (
                        <Grid>
                          {sortedCharacterGroups.map(([characterName, medias]) => (
                            <Grid.Col key={characterName} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                              <CharacterMediaCard
                                characterName={characterName}
                                medias={medias}
                                onMediaSelect={(mediaId) => handleMediaSelect(mediaId, option.type)}
                              />
                            </Grid.Col>
                          ))}
                        </Grid>
                      ) : (
                        <Text size="sm" c="dimmed" ta="center">
                          {characterFilter ? 'No character media found matching your search' : 'No character media available'}
                        </Text>
                      )}
                    </Box>
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        ))}

        <Alert variant="light" style={{ color: getEntityThemeColor(theme, 'character') }} icon="☕">
          <Stack gap="sm">
            <Text fw={500} size="md">
              Want to unlock more options?
            </Text>
            <Text size="sm">
              Support our fansite to get access to premium profile pictures and exclusive content!
            </Text>
            <Button
              component="a"
              href="https://ko-fi.com/ninjaruss"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="filled"
              style={{ color: getEntityThemeColor(theme, 'character') }}
            >
              ☕ Support on Ko-fi
            </Button>
          </Stack>
        </Alert>
      </Stack>
    </Card>
  );
}
