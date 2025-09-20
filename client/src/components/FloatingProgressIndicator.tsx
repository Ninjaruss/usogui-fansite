'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Progress,
  Slider,
  Stack,
  Text,
  Tooltip,
  rem,
  useMantineTheme,
  Loader
} from '@mantine/core'
import { BookOpen, Edit3, Check, X, User } from 'lucide-react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useProgress } from '../providers/ProgressProvider'
import { useAuth } from '../providers/AuthProvider'
import api from '../lib/api'

const MAX_CHAPTER = 539
const successAnimationDuration = 1500

const defaultPalette = {
  red: '#e11d48',
  guide: '#388e3c',
  character: '#1976d2',
  arc: '#dc004e',
  black: '#0a0a0a',
  purple: '#7c3aed'
}

export const FloatingProgressIndicator: React.FC = () => {
  const theme = useMantineTheme()
  const palette = {
    red: theme.other?.usogui?.red ?? theme.colors.red?.[5] ?? defaultPalette.red,
    guide: theme.other?.usogui?.guide ?? theme.colors.green?.[6] ?? defaultPalette.guide,
    character: theme.other?.usogui?.character ?? theme.colors.blue?.[6] ?? defaultPalette.character,
    arc: theme.other?.usogui?.arc ?? theme.colors.pink?.[6] ?? defaultPalette.arc,
    black: theme.other?.usogui?.black ?? theme.colors.dark?.[9] ?? defaultPalette.black,
    purple: theme.other?.usogui?.purple ?? theme.colors.violet?.[6] ?? defaultPalette.purple
  }
  const transitionDuration = theme.other?.transitions?.durationShort ?? 200
  const transitionTimingFunction =
    theme.other?.transitions?.easingStandard ?? 'cubic-bezier(0.4, 0, 0.2, 1)'

  const { user } = useAuth()
  const { userProgress, updateProgress, loading: progressLoading } = useProgress()
  const [open, setOpen] = useState(false)
  const [tempProgress, setTempProgress] = useState(userProgress)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [chapterTitle, setChapterTitle] = useState<string | null>(null)
  const [currentChapterTitle, setCurrentChapterTitle] = useState<string | null>(null)

  const progressPercentage = Math.round((userProgress / MAX_CHAPTER) * 100)
  const modalProgressPercentage = Math.round((tempProgress / MAX_CHAPTER) * 100)

  const progressGradient = `linear-gradient(135deg, ${palette.guide} 0%, ${palette.character} 50%, ${palette.arc} 80%, ${palette.red} 100%)`
  const badgeGradient = `linear-gradient(135deg, ${palette.arc} 0%, ${palette.red} 100%)`

  useEffect(() => {
    setTempProgress(userProgress)
  }, [userProgress])

  const fetchChapterByNumber = useCallback(async (chapterNumber: number) => {
    try {
      const chapter = await api.getChapterByNumber(chapterNumber)
      return chapter.title as string
    } catch (fetchError) {
      console.error('Failed to fetch chapter title:', fetchError)
      return null
    }
  }, [])

  useEffect(() => {
    const run = async () => {
      if (userProgress && userProgress > 0) {
        const title = await fetchChapterByNumber(userProgress)
        setCurrentChapterTitle(title)
      }
    }

    run()
  }, [fetchChapterByNumber, userProgress])

  useEffect(() => {
    const run = async () => {
      if (tempProgress && tempProgress > 0) {
        const title = await fetchChapterByNumber(tempProgress)
        setChapterTitle(title)
      }
    }

    run()
  }, [fetchChapterByNumber, tempProgress])

  const handleOpen = () => {
    setOpen(true)
    setError('')
    setTempProgress(userProgress)
  }

  const handleClose = () => {
    setOpen(false)
    setTempProgress(userProgress)
    setError('')
  }

  const handleProgressChange = useCallback((newProgress: number) => {
    if (newProgress >= 1 && newProgress <= MAX_CHAPTER) {
      setTempProgress(newProgress)
      setError('')
    }
  }, [])

  const handleNumberInputChange = (value: number | string) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      handleProgressChange(value)
      return
    }

    if (value === '') {
      setTempProgress(1)
    }
  }

  const handleSave = useCallback(async () => {
    if (tempProgress === userProgress) {
      handleClose()
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      await updateProgress(tempProgress)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        handleClose()
      }, successAnimationDuration)
    } catch (saveError) {
      setError('Failed to update progress. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }, [handleClose, tempProgress, updateProgress, userProgress])

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!open || isUpdating) return

      if (event.key === 'Enter') {
        event.preventDefault()
        handleSave()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handleProgressChange(tempProgress - 1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleProgressChange(tempProgress + 1)
      }
    },
    [handleSave, handleClose, handleProgressChange, open, isUpdating, tempProgress]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  if (progressLoading) {
    return null
  }

  const getVolumeInfo = (chapter: number) => {
    const volume = Math.ceil(chapter / 11)
    const chapterInVolume = ((chapter - 1) % 11) + 1
    return { volume: Math.min(volume, 49), chapterInVolume }
  }

  const volumeInfo = getVolumeInfo(tempProgress)

  const tooltipLabel = currentChapterTitle
    ? `Reading Progress: Chapter ${userProgress} - ${currentChapterTitle} (${progressPercentage}%)`
    : `Reading Progress: Chapter ${userProgress} (${progressPercentage}%)`

  // Use dark mode by default (Mantine 7 uses CSS variables for theming)
  const isDark = true // Always use dark mode for this component
  
  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
      >
        <Tooltip label={tooltipLabel} position="left" withinPortal>
          <ActionIcon
            aria-label="Open reading progress"
            size={56}
            radius="xl"
            onClick={handleOpen}
            styles={{
              root: {
                backgroundImage: `linear-gradient(135deg, ${palette.guide} 0%, ${palette.character} 50%, ${palette.red} 100%)`,
                color: '#ffffff',
                boxShadow: `0 4px 12px ${theme.colors.red[5]}40`,
                border: `1px solid ${theme.colors.red[5]}33`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: `0 8px 24px ${theme.colors.red[5]}66`,
                  transform: 'scale(1.05)',
                  border: `1px solid ${palette.red}`
                }
              }
            }}
          >
            <Box
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BookOpen size={24} />
              <Box
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -6,
                  minWidth:
                    userProgress > 999 ? 32 : userProgress > 99 ? 28 : userProgress > 9 ? 24 : 22,
                  height: 18,
                  paddingLeft: 6,
                  paddingRight: 6,
                  borderRadius: 12,
                  backgroundImage: badgeGradient,
                  border: `2px solid ${theme.colors.dark[9]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize:
                    userProgress > 999 ? '9px' : userProgress > 99 ? '10px' : userProgress > 9 ? '11px' : '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
              >
                {userProgress}
              </Box>
            </Box>
          </ActionIcon>
        </Tooltip>
      </motion.div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: 100,
              right: 24,
              zIndex: 1001
            }}
          >
            <Badge
              color="green"
              size="lg"
              variant="filled"
              leftSection={<Check size={16} />}
              styles={{
                root: {
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  boxShadow: `0 4px 12px ${theme.colors.green[6]}73`
                }
              }}
            >
              Progress Updated!
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        opened={open}
        onClose={handleClose}
        size="md"
        radius="lg"
        centered
        transitionProps={{ transition: 'slide-up', duration: transitionDuration, timingFunction: transitionTimingFunction }}
        overlayProps={{ color: theme.colors.dark[9], opacity: 0.65, blur: 4 }}
        styles={{
          content: {
            backgroundColor: isDark
              ? 'rgba(16, 16, 16, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${theme.colors.red[5]}4d`,
            backdropFilter: 'blur(16px)',
            marginTop: '80px',
            color: isDark ? theme.white : theme.colors.dark[8]
          },
          header: {
            backgroundColor: 'transparent',
            borderBottom: `1px solid ${theme.colors.red[5]}33`,
            marginBottom: theme.spacing.sm,
            paddingBottom: theme.spacing.sm
          },
          title: {
            width: '100%',
            color: isDark ? theme.white : theme.colors.dark[8]
          },
          body: {
            padding: `0 ${theme.spacing.lg}`
          }
        }}
        title={
          <Group justify="space-between" gap="md">
            <Group gap="sm">
              <BookOpen size={24} color={theme.colors.red[5]} />
              <Text fw={600} size="lg" c={isDark ? undefined : 'dark.8'}>
                Reading Progress
              </Text>
            </Group>
            {user && (
              <Badge
                color="red"
                variant="light"
                radius="sm"
                leftSection={<User size={14} />}
              >
                {user.username}
              </Badge>
            )}
          </Group>
        }
      >
        <Stack gap="md" pb="xs">
          <Stack gap="xs" align="center">
            <Text component="p" size="lg" fw={700} c="red.5">
              Chapter {tempProgress}
            </Text>
            {chapterTitle && (
              <Text size="sm" fw={500} c={isDark ? 'gray.1' : 'dark.6'} ta="center" lineClamp={2}>
                {chapterTitle}
              </Text>
            )}
            <Text size="xs" c="dimmed">
              Volume {volumeInfo.volume}, Chapter {volumeInfo.chapterInVolume} • {modalProgressPercentage}%
            </Text>
            <Progress
              value={modalProgressPercentage}
              size={12}
              radius="xl"
              color="red"
              w="100%"
              style={{
                backgroundImage: progressGradient
              }}
            />
          </Stack>

          <NumberInput
            value={tempProgress}
            onChange={handleNumberInputChange}
            min={1}
            max={MAX_CHAPTER}
            disabled={isUpdating}
            hideControls
            radius="md"
            size="md"
            label="Enter chapter number"
            styles={{
              input: {
                backgroundColor: isDark
                  ? theme.colors.dark[7]
                  : theme.white,
                border: `2px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                color: isDark ? theme.white : theme.colors.dark[8],
                fontSize: rem(16),
                textAlign: 'center',
                '&:focus': {
                  borderColor: theme.colors.red[5],
                  boxShadow: `0 0 0 2px ${theme.colors.red[5]}33`
                }
              },
              label: {
                color: isDark ? theme.colors.gray[1] : theme.colors.dark[6],
                fontWeight: 500,
                fontSize: rem(13)
              }
            }}
          />

          <Group gap="xs" justify="center">
            <Button
              size="compact-sm"
              variant="outline"
              color="gray"
              onClick={() => handleProgressChange(tempProgress - 1)}
              disabled={tempProgress <= 1 || isUpdating}
            >
              Previous
            </Button>
            <Button
              size="compact-sm"
              variant="outline"
              color="gray"
              onClick={() => handleProgressChange(tempProgress + 1)}
              disabled={tempProgress >= MAX_CHAPTER || isUpdating}
            >
              Next
            </Button>
          </Group>

          {error && (
            <Alert
              color="red"
              variant="light"
              icon={<X size={14} />}
              radius="sm"
              py="xs"
              styles={{
                root: {
                  backgroundColor: isDark
                    ? `${theme.colors.red[9]}33`
                    : `${theme.colors.red[0]}80`,
                  border: `1px solid ${theme.colors.red[5]}66`
                }
              }}
            >
              {error}
            </Alert>
          )}

          {!user && !error && (
            <Text size="xs" c="dimmed" ta="center">
              Progress saved locally. Sign in to sync across devices.
            </Text>
          )}

          <Stack gap="sm">
            <Button
              component={Link}
              href={`/chapters/${tempProgress}`}
              variant="outline"
              color="gray"
              leftSection={<BookOpen size={14} />}
              onClick={handleClose}
              fullWidth
              size="sm"
              radius="md"
            >
              Read Chapter {tempProgress}
            </Button>

            <Button
              variant={tempProgress !== userProgress ? 'gradient' : 'filled'}
              gradient={{ from: palette.guide, to: palette.red }}
              color={tempProgress === userProgress ? 'gray' : undefined}
              onClick={handleSave}
              disabled={isUpdating || tempProgress === userProgress}
              leftSection={
                isUpdating ? (
                  <Loader size="xs" color="white" />
                ) : (
                  <Check size={14} />
                )
              }
              fullWidth
              size="sm"
              radius="md"
              styles={{
                root: {
                  fontWeight: 600
                }
              }}
            >
              {isUpdating
                ? 'Updating...'
                : tempProgress !== userProgress
                  ? 'Update Progress'
                  : 'Progress Saved'}
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}
