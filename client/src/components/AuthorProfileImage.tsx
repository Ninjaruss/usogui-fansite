'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Avatar, useMantineTheme } from '@mantine/core'
import { User } from 'lucide-react'
import { api } from '../lib/api'

interface AuthorProfileImageProps {
  author: {
    id: number
    username: string
    role?: string
    profilePictureType?: 'fluxer' | 'character_media' | 'exclusive_artwork' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
    } | null
    fluxerId?: string | null
    fluxerAvatar?: string | null
  }
  size?: number
  showFallback?: boolean
  className?: string
}

interface FullUserProfile {
  id: number
  username: string
  role: string
  profilePictureType?: 'fluxer' | 'character_media' | null
  selectedCharacterMediaId?: number | null
  selectedCharacterMedia?: {
    id: number
    url: string
    fileName?: string
    description?: string
  } | null
  fluxerId?: string | null
  fluxerAvatar?: string | null
}

export default function AuthorProfileImage({
  author,
  size = 60,
  showFallback = true,
  className
}: AuthorProfileImageProps) {
  const theme = useMantineTheme()
  const [fullProfile, setFullProfile] = useState<FullUserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const hasProfileData = author.profilePictureType || author.fluxerAvatar || author.selectedCharacterMedia

  useEffect(() => {
    if (!hasProfileData && !loading && !fullProfile) {
      const fetchUserProfile = async () => {
        try {
          setLoading(true)
          const profile = await api.getPublicUserProfile(author.id)
          setFullProfile(profile)
        } catch (fetchError) {
          console.error(`Could not fetch profile for user ${author.id}:`, fetchError)
          setError(true)
        } finally {
          setLoading(false)
        }
      }

      fetchUserProfile()
    }
  }, [author.id, fullProfile, hasProfileData, loading])

  const userToRender = fullProfile || author
  const fallbackLetter = useMemo(() => userToRender.username?.[0]?.toUpperCase() ?? '', [userToRender.username])
  const fallbackBackground = theme.other?.usogui?.red ?? theme.colors.red?.[6] ?? '#e11d48'
  const fallbackIconSize = Math.round(size * 0.5)
  const commonStyles = {
    root: {
      backgroundColor: fallbackBackground,
      fontSize: `${size * 0.4}px`,
      fontWeight: 700
    }
  } as const

  const getFluxerUrl = () => {
    if (!userToRender.fluxerAvatar) return null
    return userToRender.fluxerAvatar.startsWith('http')
      ? userToRender.fluxerAvatar
      : `https://fluxerusercontent.com/avatars/${userToRender.fluxerId}/${userToRender.fluxerAvatar}.png?size=256`
  }

  if (userToRender.profilePictureType === 'fluxer' && !error) {
    const fluxerAvatarUrl = getFluxerUrl()
    if (fluxerAvatarUrl) {
      return (
        <Avatar
          src={fluxerAvatarUrl}
          alt={`${userToRender.username}'s Fluxer avatar`}
          className={className}
          size={size}
          radius="xl"
          onError={() => setError(true)}
          styles={commonStyles}
        >
          {(error || !userToRender.fluxerAvatar) && showFallback && fallbackLetter}
        </Avatar>
      )
    }
  }

  if (userToRender.profilePictureType === 'character_media' && userToRender.selectedCharacterMedia && !error) {
    const imageUrl = userToRender.selectedCharacterMedia.url
    return (
      <Avatar
        src={imageUrl}
        alt={`${userToRender.username}'s profile image`}
        className={className}
        size={size}
        radius="xl"
        onError={() => setError(true)}
        styles={commonStyles}
      >
        {showFallback && fallbackLetter}
      </Avatar>
    )
  }

  if (!userToRender.profilePictureType && !error) {
    const fluxerAvatarUrl = getFluxerUrl()
    if (fluxerAvatarUrl) {
      return (
        <Avatar
          src={fluxerAvatarUrl}
          alt={`${userToRender.username}'s Fluxer avatar`}
          className={className}
          size={size}
          radius="xl"
          onError={() => setError(true)}
          styles={commonStyles}
        >
          {(error || !userToRender.fluxerAvatar) && showFallback && fallbackLetter}
        </Avatar>
      )
    }
  }

  return (
    <Avatar className={className} size={size} radius="xl" styles={commonStyles}>
      {showFallback ? fallbackLetter || <User size={fallbackIconSize} /> : <User size={fallbackIconSize} />}
    </Avatar>
  )
}
