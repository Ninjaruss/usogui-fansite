'use client'

import React, { useState } from 'react'
import { Avatar } from '@mui/material'
import { User } from 'lucide-react'

interface UserProfileImageProps {
  user: {
    id: number
    username: string
    profilePictureType?: 'discord' | 'character_media' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
      ownerType?: string
      ownerId?: number
    } | null
    discordAvatar?: string | null
  }
  size?: number
  showFallback?: boolean
  className?: string
}

export default function UserProfileImage({
  user,
  size = 60,
  showFallback = true,
  className
}: UserProfileImageProps) {
  const [error, setError] = useState(false)

  // Discord avatar
  if (user.profilePictureType === 'discord' && user.discordAvatar) {
    return (
      <Avatar
        src={`https://cdn.discordapp.com/avatars/${user.id}/${user.discordAvatar}.png?size=256`}
        alt={`${user.username}'s Discord avatar`}
        className={className}
        sx={{
          width: size,
          height: size,
        }}
        onError={() => setError(true)}
      >
        {(error || !user.discordAvatar) && showFallback && user.username[0]?.toUpperCase()}
      </Avatar>
    )
  }

  // Character media image
  if (user.profilePictureType === 'character_media' && user.selectedCharacterMedia && !error) {
    const media = user.selectedCharacterMedia
    const imageUrl = media.url?.startsWith('http') 
      ? media.url 
      : `${process.env.NEXT_PUBLIC_API_URL}/media/${media.fileName || media.url}`

    return (
      <Avatar
        src={imageUrl}
        alt={`${user.username}'s profile image`}
        className={className}
        sx={{
          width: size,
          height: size,
        }}
        onError={() => setError(true)}
      >
        {showFallback && user.username[0]?.toUpperCase()}
      </Avatar>
    )
  }

  // Fallback to first letter of username
  return (
    <Avatar
      className={className}
      sx={{
        width: size,
        height: size,
        bgcolor: 'primary.main',
        fontSize: `${size * 0.4}px`,
        fontWeight: 'bold'
      }}
    >
      {showFallback ? (
        user.username[0]?.toUpperCase() || <User size={size * 0.5} />
      ) : (
        <User size={size * 0.5} />
      )}
    </Avatar>
  )
}
