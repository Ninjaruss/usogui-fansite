'use client'

import React, { useState, useEffect } from 'react'
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  LinearProgress,
  Slide,
  IconButton,
  Tooltip,
  Alert,
  Chip
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { BookOpen, Edit3, Check, X, User } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import Link from 'next/link'
import { useProgress } from '../providers/ProgressProvider'
import { useAuth } from '../providers/AuthProvider'
import { motion, AnimatePresence } from 'motion/react'
import api from '../lib/api'

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

const MAX_CHAPTER = 539

export const FloatingProgressIndicator: React.FC = () => {
  const theme = useTheme()
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

  useEffect(() => {
    setTempProgress(userProgress)
  }, [userProgress])

  // Fetch chapter title for current user progress
  useEffect(() => {
    const fetchCurrentChapterTitle = async () => {
      if (userProgress && userProgress > 0) {
        try {
          const chapter = await api.getChapterByNumber(userProgress)
          setCurrentChapterTitle(chapter.title)
        } catch (error) {
          console.error('Failed to fetch current chapter title:', error)
          setCurrentChapterTitle(null)
        }
      }
    }

    fetchCurrentChapterTitle()
  }, [userProgress])

  // Fetch chapter title when tempProgress changes
  useEffect(() => {
    const fetchChapterTitle = async () => {
      if (tempProgress && tempProgress > 0) {
        try {
          const chapter = await api.getChapterByNumber(tempProgress)
          setChapterTitle(chapter.title)
        } catch (error) {
          console.error('Failed to fetch chapter title:', error)
          setChapterTitle(null)
        }
      }
    }

    fetchChapterTitle()
  }, [tempProgress])

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

  const handleProgressChange = (newProgress: number) => {
    if (newProgress >= 1 && newProgress <= MAX_CHAPTER) {
      setTempProgress(newProgress)
      setError('')
    }
  }

  const handleSave = async () => {
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
      }, 1500)
    } catch (error) {
      setError('Failed to update progress. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (!open) return
    
    if (event.key === 'Enter' && !isUpdating) {
      handleSave()
    } else if (event.key === 'Escape') {
      handleClose()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      handleProgressChange(tempProgress - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      handleProgressChange(tempProgress + 1)
    }
  }

  const getVolumeInfo = (chapter: number) => {
    // Approximate volume groupings for Usogui (49 volumes, ~11 chapters each)
    const volume = Math.ceil(chapter / 11)
    const chapterInVolume = ((chapter - 1) % 11) + 1
    return { volume: Math.min(volume, 49), chapterInVolume }
  }

  useEffect(() => {
    const handleGlobalKeyPress = (event: KeyboardEvent) => {
      if (open) {
        handleKeyPress(event as any)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyPress)
    return () => window.removeEventListener('keydown', handleGlobalKeyPress)
  }, [open, tempProgress, isUpdating, handleKeyPress])

  if (progressLoading) {
    return null
  }

  const volumeInfo = getVolumeInfo(tempProgress)

  return (
    <>
      {/* Floating Action Button */}
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
        <Tooltip
          title={
            currentChapterTitle
              ? `Reading Progress: Chapter ${userProgress} - ${currentChapterTitle} (${progressPercentage}%)`
              : `Reading Progress: Chapter ${userProgress} (${progressPercentage}%)`
          }
          placement="left"
        >
          <Fab
            color="primary"
            onClick={handleOpen}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.usogui.guide} 0%, ${theme.palette.usogui.character} 50%, ${theme.palette.primary.main} 100%)`,
              boxShadow: `0 4px 12px rgba(225, 29, 72, 0.3)`,
              border: `1px solid rgba(225, 29, 72, 0.2)`,
              '&:hover': {
                boxShadow: `0 8px 24px rgba(225, 29, 72, 0.4)`,
                transform: 'scale(1.05)',
                border: `1px solid ${theme.palette.primary.main}`
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -6,
                  minWidth: userProgress > 999 ? 32 : userProgress > 99 ? 28 : userProgress > 9 ? 24 : 22,
                  height: 18,
                  px: 0.5,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${theme.palette.usogui.arc} 0%, ${theme.palette.primary.main} 100%)`,
                  border: `2px solid ${theme.palette.usogui.black}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: userProgress > 999 ? '9px' : userProgress > 99 ? '10px' : userProgress > 9 ? '11px' : '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {userProgress}
              </Box>
            </Box>
          </Fab>
        </Tooltip>
      </motion.div>

      {/* Success Animation */}
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
            <Chip
              label="Progress Updated!"
              color="success"
              variant="filled"
              icon={<Check size={16} />}
              sx={{
                fontSize: '0.875rem',
                fontWeight: 'bold',
                boxShadow: 4
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Progress Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(33, 33, 33, 0.95) 0%, rgba(66, 66, 66, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BookOpen size={24} />
            <Typography variant="h6">Reading Progress</Typography>
            {user && (
              <Chip
                label={`${user.username}`}
                size="small"
                color="primary"
                variant="outlined"
                icon={<User size={14} />}
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3 }}>
          {/* Current Progress Display */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
              Chapter {tempProgress}
            </Typography>
            {chapterTitle && (
              <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>
                {chapterTitle}
              </Typography>
            )}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Volume {volumeInfo.volume}, Chapter {volumeInfo.chapterInVolume}
            </Typography>
            
            {/* Visual Progress Bar */}
            <Box sx={{ position: 'relative', mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={Math.round((tempProgress / MAX_CHAPTER) * 100)}
                sx={{
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${theme.palette.usogui.guide} 0%, ${theme.palette.usogui.character} 50%, ${theme.palette.usogui.arc} 80%, ${theme.palette.primary.main} 100%)`
                  }
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: -20,
                  fontWeight: 'bold',
                  color: 'text.secondary'
                }}
              >
                {Math.round((tempProgress / MAX_CHAPTER) * 100)}% ({MAX_CHAPTER - tempProgress} remaining)
              </Typography>
            </Box>
          </Box>

          {/* Quick Navigation Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleProgressChange(tempProgress - 10)}
              disabled={tempProgress <= 10}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              -10
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleProgressChange(tempProgress - 1)}
              disabled={tempProgress <= 1}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              -1
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleProgressChange(tempProgress + 1)}
              disabled={tempProgress >= MAX_CHAPTER}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              +1
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleProgressChange(tempProgress + 10)}
              disabled={tempProgress >= MAX_CHAPTER - 9}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              +10
            </Button>
          </Box>

          {/* Chapter Input with Slider */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Jump to chapter:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">1</Typography>
              <Box sx={{ flex: 1 }}>
                <input
                  type="range"
                  min="1"
                  max={MAX_CHAPTER}
                  value={tempProgress}
                  onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                  disabled={isUpdating}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: `linear-gradient(to right, ${theme.palette.primary.main} 0%, ${theme.palette.primary.main} ${(tempProgress / MAX_CHAPTER) * 100}%, ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} ${(tempProgress / MAX_CHAPTER) * 100}%, ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} 100%)`,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </Box>
              <Typography variant="body2">{MAX_CHAPTER}</Typography>
            </Box>
          </Box>

          {/* Direct Input Field */}
          <TextField
            fullWidth
            label="Or enter chapter number"
            type="number"
            value={tempProgress}
            onChange={(e) => handleProgressChange(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1, max: MAX_CHAPTER }}
            disabled={isUpdating}
            size="small"
            sx={{ mb: 2 }}
            helperText="Use arrow keys for fine control"
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!user && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your progress is saved locally. Sign in to sync across devices.
            </Alert>
          )}

          {tempProgress !== userProgress && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You have unsaved changes. Click "Update Progress" to save.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            component={Link}
            href={`/chapters/${tempProgress}`}
            variant="outlined"
            startIcon={<BookOpen size={16} />}
            onClick={handleClose}
            fullWidth
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            Read Chapter {tempProgress}
          </Button>
          
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isUpdating || tempProgress === userProgress}
            startIcon={isUpdating ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}><Check size={16} /></motion.div> : <Check size={16} />}
            fullWidth
            sx={{ 
              order: { xs: 1, sm: 2 },
              background: tempProgress !== userProgress ? `linear-gradient(135deg, ${theme.palette.usogui.guide} 0%, ${theme.palette.primary.main} 100%)` : undefined,
              '&:hover': tempProgress !== userProgress ? {
                background: `linear-gradient(135deg, ${theme.palette.usogui.guide} 0%, ${theme.palette.primary.dark} 100%)`
              } : undefined
            }}
          >
            {isUpdating ? 'Updating...' : tempProgress !== userProgress ? 'Update Progress' : 'Progress Saved'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}