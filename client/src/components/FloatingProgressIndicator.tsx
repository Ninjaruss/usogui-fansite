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
  Paper,
  Progress,
  Slider,
  Stack,
  Text,
  Tooltip,
  rem,
  useMantineTheme,
  Loader
} from '@mantine/core'
import { getEntityThemeColor } from '../lib/mantine-theme'
import { BookOpen, Check, X, User, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { SuitWatermark } from './decorative/MangaPatterns'
import { useProgress } from '../providers/ProgressProvider'
import { useAuth } from '../providers/AuthProvider'
import api from '../lib/api'

const MAX_CHAPTER = 539
const CIRCUMFERENCE = 2 * Math.PI * 30
const successAnimationDuration = 1500

const defaultPalette = {
  red: '#e11d48',
  guide: '#388e3c',
  character: '#1976d2',
  arc: '#dc004e',
  black: '#0a0a0a',
  purple: '#7c3aed'
}

const sliderMarks = [
  { value: 0, label: '0' },
  { value: 100, label: '100' },
  { value: 200, label: '200' },
  { value: 300, label: '300' },
  { value: 400, label: '400' },
  { value: 539, label: '539' }
]

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
  const progressDashoffset = CIRCUMFERENCE * (1 - progressPercentage / 100)

  const solidRed = theme.colors.red[6]

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

  const isChanged = tempProgress !== userProgress

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 18 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          width: 74,
          height: 74,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Dashed outer orbit ring */}
        <div className="fpi-outer-ring" aria-hidden="true" />

        {/* Circular progress ring */}
        <svg
          width={64}
          height={64}
          style={{ position: 'absolute', top: 5, left: 5, transform: 'rotate(-90deg)' }}
        >
          {/* Glow layer behind progress stroke */}
          <circle
            cx={32}
            cy={32}
            r={28}
            fill="none"
            stroke={solidRed}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={progressDashoffset}
            opacity={0.12}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <circle
            cx={32}
            cy={32}
            r={28}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={3}
          />
          <circle
            cx={32}
            cy={32}
            r={28}
            fill="none"
            stroke={solidRed}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={progressDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        <Tooltip label={tooltipLabel} position="left" withinPortal>
          <ActionIcon
            aria-label="Open reading progress"
            className="fpi-button-glow"
            size={52}
            radius="xl"
            onClick={handleOpen}
            styles={{
              root: {
                backgroundColor: solidRed,
                color: '#ffffff',
                border: `1px solid ${theme.colors.red[5]}33`,
                transition: 'border-color 0.2s ease-in-out',
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
              <BookOpen size={22} />
              <Box
                style={{
                  position: 'absolute',
                  bottom: -5,
                  right: -8,
                  minWidth:
                    userProgress > 999 ? 32 : userProgress > 99 ? 28 : userProgress > 9 ? 24 : 22,
                  height: 18,
                  paddingLeft: 5,
                  paddingRight: 5,
                  borderRadius: 12,
                  backgroundColor: 'rgba(7,7,7,0.95)',
                  border: `1.5px solid ${solidRed}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize:
                    userProgress > 999 ? '9px' : userProgress > 99 ? '10px' : userProgress > 9 ? '11px' : '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-opti-goudy-text)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
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
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'fixed',
              bottom: 100,
              right: 24,
              zIndex: 1001
            }}
          >
            <Badge
              style={{ color: getEntityThemeColor(theme, 'guide') }}
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
        overlayProps={{ color: '#000000', opacity: 0.72, blur: 6 }}
        styles={{
          content: {
            backgroundColor: 'rgba(10, 7, 7, 0.97)',
            border: `1px solid ${theme.colors.red[7]}40`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 64px rgba(0,0,0,0.6), 0 0 40px ${theme.colors.red[9]}30`,
            marginTop: '80px',
            color: '#fff'
          },
          header: {
            backgroundColor: 'transparent',
            borderBottom: `1px solid ${theme.colors.red[8]}30`,
            marginBottom: theme.spacing.sm,
            paddingBottom: theme.spacing.sm
          },
          title: {
            width: '100%',
            color: '#fff'
          },
          close: {
            color: 'rgba(255,255,255,0.5)',
            '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' }
          },
          body: {
            padding: `0 ${theme.spacing.lg}`
          }
        }}
        title={
          <Group justify="space-between" gap="md">
            <Group gap="sm">
              <BookOpen size={22} color={theme.colors.red[4]} />
              <Text
                fw={600}
                size="lg"
                style={{
                  color: '#fff',
                  letterSpacing: '0.01em',
                  fontFamily: 'var(--font-opti-goudy-text)'
                }}
              >
                Reading Progress
              </Text>
            </Group>
            {user && (
              <Badge
                variant="light"
                radius="sm"
                leftSection={<User size={12} />}
                styles={{
                  root: {
                    backgroundColor: `${getEntityThemeColor(theme, 'gamble')}18`,
                    border: `1px solid ${getEntityThemeColor(theme, 'gamble')}35`,
                    color: getEntityThemeColor(theme, 'gamble')
                  }
                }}
              >
                {user.username}
              </Badge>
            )}
          </Group>
        }
      >
        <Stack gap="md" pb="xs">

          {/* Chapter info card */}
          <Paper
            radius="md"
            p="md"
            style={{
              backgroundColor: 'rgba(225, 29, 72, 0.10)',
              border: `1px solid ${theme.colors.red[7]}40`,
              borderTop: `3px solid ${theme.colors.red[5]}`,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Spade suit watermark */}
            <SuitWatermark suit="spade" color="#e11d48" size={80} opacity={0.06} position="center" />
            {/* Subtle radial glow behind chapter number */}
            <Box
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${theme.colors.red[9]}65 0%, transparent 70%)`,
                pointerEvents: 'none'
              }}
            />
            <Text
              fw={800}
              style={{
                fontSize: rem(52),
                lineHeight: 1,
                color: theme.colors.red[4],
                position: 'relative',
                fontFamily: 'var(--font-opti-goudy-text)',
                textShadow: `0 0 20px ${theme.colors.red[6]}60`
              }}
            >
              {tempProgress}
            </Text>
            {chapterTitle && (
              <Text
                size="sm"
                fw={500}
                lineClamp={2}
                mt={6}
                style={{ color: 'rgba(255,255,255,0.75)', position: 'relative' }}
              >
                {chapterTitle}
              </Text>
            )}
            <Group justify="center" gap="xs" mt="sm" style={{ position: 'relative' }}>
              <Badge
                variant="light"
                size="sm"
                radius="xs"
                styles={{
                  root: {
                    backgroundColor: `${theme.colors.red[6]}20`,
                    borderColor: `${theme.colors.red[6]}60`,
                    color: theme.colors.red[4]
                  }
                }}
              >
                Vol. {volumeInfo.volume} · Ch. {volumeInfo.chapterInVolume}/11
              </Badge>
              <Badge
                variant="light"
                size="sm"
                radius="xs"
                styles={{
                  root: {
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.55)'
                  }
                }}
              >
                {modalProgressPercentage}% complete
              </Badge>
            </Group>
            <Progress
              value={modalProgressPercentage}
              size={6}
              radius="xl"
              mt="sm"
              style={{ position: 'relative' }}
              styles={{
                root: { backgroundColor: 'rgba(255,255,255,0.08)' },
                section: {
                  background: `linear-gradient(90deg, ${theme.colors.red[9]}, ${theme.colors.red[5]}, ${theme.colors.red[3]})`
                }
              }}
            />
          </Paper>

          {/* Inline chapter selector */}
          <Stack gap="xs">
            <Group gap="sm" justify="center" align="flex-end">
              <ActionIcon
                variant="subtle"
                size="lg"
                radius="md"
                onClick={() => handleProgressChange(tempProgress - 1)}
                disabled={tempProgress <= 1 || isUpdating}
                aria-label="Previous chapter"
                styles={{
                  root: {
                    color: 'rgba(255,255,255,0.6)',
                    '&:hover:not(:disabled)': {
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#fff'
                    },
                    '&:disabled': { color: 'rgba(255,255,255,0.2)' }
                  }
                }}
              >
                <ChevronLeft size={20} />
              </ActionIcon>
              <NumberInput
                value={tempProgress}
                onChange={handleNumberInputChange}
                min={1}
                max={MAX_CHAPTER}
                disabled={isUpdating}
                hideControls
                radius="md"
                size="md"
                w={100}
                label="Chapter"
                styles={{
                  input: {
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: `1.5px solid rgba(255,255,255,0.14)`,
                    color: '#fff',
                    fontSize: rem(16),
                    textAlign: 'center',
                    fontWeight: 700,
                    '&:focus': {
                      borderColor: theme.colors.red[5],
                      boxShadow: `0 0 0 2px ${theme.colors.red[7]}40`
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      color: 'rgba(255,255,255,0.3)'
                    }
                  },
                  label: {
                    color: 'rgba(255,255,255,0.45)',
                    fontWeight: 500,
                    fontSize: rem(12),
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    display: 'block'
                  }
                }}
              />
              <ActionIcon
                variant="subtle"
                size="lg"
                radius="md"
                onClick={() => handleProgressChange(tempProgress + 1)}
                disabled={tempProgress >= MAX_CHAPTER || isUpdating}
                aria-label="Next chapter"
                styles={{
                  root: {
                    color: 'rgba(255,255,255,0.6)',
                    '&:hover:not(:disabled)': {
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#fff'
                    },
                    '&:disabled': { color: 'rgba(255,255,255,0.2)' }
                  }
                }}
              >
                <ChevronRight size={20} />
              </ActionIcon>
            </Group>

            <Slider
              value={tempProgress}
              onChange={handleProgressChange}
              min={1}
              max={MAX_CHAPTER}
              step={1}
              disabled={isUpdating}
              color="red"
              marks={sliderMarks}
              styles={{
                track: { backgroundColor: 'rgba(255,255,255,0.10)' },
                bar: {
                  background: `linear-gradient(90deg, ${theme.colors.red[8]}, ${theme.colors.red[5]})`
                },
                thumb: {
                  backgroundColor: theme.colors.red[4],
                  border: `2px solid ${theme.colors.red[6]}`,
                  boxShadow: `0 0 8px ${theme.colors.red[6]}60`
                },
                markLabel: {
                  fontSize: rem(10),
                  color: 'rgba(255,255,255,0.35)',
                  marginTop: 4
                },
                mark: {
                  borderColor: 'rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(255,255,255,0.15)'
                }
              }}
              mb="md"
            />
          </Stack>

          {error && (
            <Alert
              variant="light"
              icon={<X size={14} color={theme.colors.red[4]} />}
              radius="sm"
              py="xs"
              styles={{
                root: {
                  backgroundColor: `${theme.colors.red[9]}45`,
                  border: `1px solid ${theme.colors.red[7]}60`
                },
                message: { color: theme.colors.red[3] },
                icon: { color: theme.colors.red[4] }
              }}
            >
              {error}
            </Alert>
          )}

          {!user && !error && (
            <Text size="xs" ta="center" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Progress saved locally. Sign in to sync across devices.
            </Text>
          )}

          <Stack gap="sm">
            <Button
              component={Link}
              href={`/chapters/${tempProgress}`}
              variant="subtle"
              leftSection={<BookOpen size={14} />}
              onClick={handleClose}
              fullWidth
              size="sm"
              radius="md"
              styles={{
                root: {
                  color: 'rgba(255,255,255,0.60)',
                  border: `1px solid rgba(255,255,255,0.10)`,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.20)'
                  }
                }
              }}
            >
              Read Chapter {tempProgress}
            </Button>

            <motion.div whileHover={{ scale: isChanged && !isUpdating ? 1.02 : 1 }} whileTap={{ scale: isChanged && !isUpdating ? 0.98 : 1 }}>
              <Button
                variant="filled"
                onClick={handleSave}
                disabled={isUpdating || !isChanged}
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
                    fontWeight: 600,
                    backgroundColor: isChanged ? theme.colors.red[6] : 'rgba(255,255,255,0.07)',
                    color: isChanged ? '#fff' : 'rgba(255,255,255,0.30)',
                    border: isChanged ? `1px solid ${theme.colors.red[5]}60` : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: isChanged ? `0 4px 16px ${theme.colors.red[8]}50` : 'none',
                    transition: 'all 200ms ease',
                    '&:hover:not(:disabled)': {
                      backgroundColor: theme.colors.red[5],
                      boxShadow: `0 6px 20px ${theme.colors.red[7]}60`
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.30)',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }
                  }
                }}
              >
                {isUpdating
                  ? 'Updating...'
                  : isChanged
                    ? 'Update Progress'
                    : 'Progress Saved'}
              </Button>
            </motion.div>
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}
