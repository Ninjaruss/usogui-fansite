import React from 'react'
import { Alert, Button, Container, Stack } from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors } from '../../../lib/mantine-theme'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { api } from '../../../lib/api'
import UserProfileClient from './UserProfileClient'

interface PageProps {
  params: Promise<{ id: string }>
}

interface PublicUser {
  id: number
  username: string
  role: string
  customRole?: string | null
  userProgress: number
  profilePictureType?: 'discord' | 'character_media' | null
  selectedCharacterMediaId?: number | null
  selectedCharacterMedia?: {
    id: number
    url: string
    fileName?: string
    description?: string
    ownerType?: string
    ownerId?: number
    chapterNumber?: number
    character?: {
      id: number
      name: string
    }
  } | null
  discordId?: string | null
  discordAvatar?: string | null
  favoriteQuoteId?: number
  favoriteGambleId?: number
  profileImageId?: string
  createdAt: string
  guidesCount?: number
  totalViews?: number
  userStats?: {
    guidesWritten: number
    mediaSubmitted: number
    likesReceived: number
  }
  favoriteQuote?: any
  favoriteGamble?: any
}

async function getUserData(id: string): Promise<PublicUser | null> {
  try {
    if (!id || isNaN(Number(id))) {
      throw new Error('Invalid user ID')
    }
    const userId = Number(id)
    if (userId <= 0) {
      throw new Error('Invalid user ID')
    }
    return await api.getPublicUserProfile(userId)
  } catch (error: unknown) {
    console.error('Error fetching user data:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const user = await getUserData(id)

  if (!user) {
    return {
      title: 'User Not Found - Usogui Fansite',
      description: 'The requested user could not be found.'
    }
  }

  const readingProgress = Math.min(Math.round((user.userProgress / 539) * 100), 100)

  return {
    title: `${user.username} - User Profile | Usogui Fansite`,
    description: `View ${user.username}'s profile on Usogui Fansite. Reading progress: Chapter ${user.userProgress} (${readingProgress}%). ${user.userStats?.guidesWritten ? `Author of ${user.userStats.guidesWritten} guides.` : ''}`,
    keywords: `Usogui, ${user.username}, user profile, reading progress, guides${user.customRole ? `, ${user.customRole}` : ''}`,
    openGraph: {
      title: `${user.username} - Usogui Fansite`,
      description: `${user.username} is on Chapter ${user.userProgress} of Usogui (${readingProgress}% complete).`,
      type: 'profile'
    },
    twitter: {
      card: 'summary',
      title: `${user.username} - Usogui Fansite`,
      description: `View ${user.username}'s reading progress and contributions to the Usogui community.`
    }
  }
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getUserData(id)

  if (!user) {
    return (
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Alert color="red" radius="md">
            User not found
          </Alert>
          <Button
            component={Link}
            href="/users"
            variant="subtle"
            color="gray"
            leftSection={<ArrowLeft size={18} />}
          >
            Back to Users
          </Button>
        </Stack>
      </Container>
    )
  }

  return <UserProfileClient initialUser={user} />
}

export const dynamic = 'force-dynamic'