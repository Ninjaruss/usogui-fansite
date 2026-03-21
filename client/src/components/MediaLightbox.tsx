'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Modal,
  Text,
  rem,
  useMantineTheme
} from '@mantine/core'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react'
import {
  getEnhancedEmbedUrl
} from '../lib/video-utils'
import { MediaItem } from './MediaGallery'

interface MediaLightboxProps {
  opened: boolean
  media: MediaItem[]
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

export default function MediaLightbox({
  opened,
  media,
  currentIndex,
  onClose,
  onPrevious,
  onNext
}: MediaLightboxProps) {
  const theme = useMantineTheme()
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const selectedMedia = media[currentIndex] ?? null

  const palette = useMemo(() => {
    const accent = theme.other?.usogui?.red ?? theme.colors.red?.[5] ?? '#e11d48'
    const secondaryAccent = theme.other?.usogui?.purple ?? theme.colors.violet?.[6] ?? '#7c3aed'
    return { accent, secondaryAccent }
  }, [theme])

  // Reset video state when switching items
  useEffect(() => {
    setShouldLoadVideo(false)
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!opened) return
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': onPrevious(); break
        case 'ArrowRight': onNext(); break
        case 'Escape': onClose(); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [opened, onPrevious, onNext, onClose])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      diff > 0 ? onNext() : onPrevious()
    }
    setTouchStart(null)
  }

  if (!selectedMedia) return null

  // Inline styles for the frosted-glass control buttons (close, nav arrows, counter)
  const controlStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.65)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(4px)',
    color: 'rgba(255,255,255,0.9)'
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      overlayProps={{ opacity: 1, color: '#000' }}
      styles={{
        content: { background: '#000' },
        body: { height: '100%', padding: 0 }
      }}
    >
      <Box
        style={{ position: 'relative', width: '100%', height: '100dvh', background: '#000', overflow: 'hidden', cursor: 'pointer' }}
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Media content — stop propagation so clicking image doesn't close ── */}
        <Box
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          {selectedMedia.type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedMedia.url}
              alt={selectedMedia.description || 'Media preview'}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          ) : selectedMedia.type === 'video' ? (
            (() => {
              const embedUrl = getEnhancedEmbedUrl(selectedMedia.url)
              if (embedUrl) {
                return !shouldLoadVideo ? (
                  <Button
                    size="md"
                    leftSection={<Play size={18} />}
                    onClick={() => setShouldLoadVideo(true)}
                  >
                    Load Video
                  </Button>
                ) : (
                  <iframe
                    src={embedUrl}
                    title={selectedMedia.description || 'Video'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    style={{ width: '100%', height: '80dvh', border: 'none' }}
                  />
                )
              }
              return (
                <video controls style={{ maxWidth: '100%', maxHeight: '100dvh' }}>
                  <source src={selectedMedia.url} />
                  Your browser does not support the video tag.
                </video>
              )
            })()
          ) : (
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: rem(12), color: 'rgba(255,255,255,0.5)' }}>
              <ImageIcon size={40} />
              <Text size="sm">Media type not supported for preview</Text>
            </Box>
          )}
        </Box>

        {/* ── External link (top-right) ── */}
        <ActionIcon
          variant="transparent"
          component="a"
          href={selectedMedia.url}
          target="_blank"
          rel="noopener noreferrer"
          size="lg"
          style={{ position: 'absolute', top: rem(14), right: rem(14), zIndex: 10, borderRadius: '50%', ...controlStyle }}
          aria-label="Open original"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={16} />
        </ActionIcon>

        {/* ── Counter pill ── */}
        <Box
          style={{
            position: 'absolute', top: rem(14), left: rem(14), zIndex: 10,
            ...controlStyle,
            borderRadius: rem(12), padding: `${rem(3)} ${rem(10)}`,
            fontSize: rem(11), color: 'rgba(255,255,255,0.65)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {currentIndex + 1} / {media.length}
        </Box>

        {/* ── Previous arrow ── */}
        {currentIndex > 0 && (
          <ActionIcon
            variant="transparent"
            size="lg"
            onClick={(e) => { e.stopPropagation(); onPrevious() }}
            style={{
              position: 'absolute', top: '50%', left: rem(14),
              transform: 'translateY(-50%)', zIndex: 10, borderRadius: '50%', ...controlStyle
            }}
            aria-label="Previous"
          >
            <ChevronLeft size={22} />
          </ActionIcon>
        )}

        {/* ── Next arrow ── */}
        {currentIndex < media.length - 1 && (
          <ActionIcon
            variant="transparent"
            size="lg"
            onClick={(e) => { e.stopPropagation(); onNext() }}
            style={{
              position: 'absolute', top: '50%', right: rem(14),
              transform: 'translateY(-50%)', zIndex: 10, borderRadius: '50%', ...controlStyle
            }}
            aria-label="Next"
          >
            <ChevronRight size={22} />
          </ActionIcon>
        )}

        {/* ── Bottom overlay bar — stop propagation so clicking metadata doesn't close ── */}
        <Box
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.92) 100%)',
            padding: `${rem(48)} ${rem(18)} ${rem(16)}`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Description */}
          {selectedMedia.description && (
            <Text
              size="sm"
              fw={500}
              lineClamp={2}
              mb={10}
              style={{ color: 'rgba(255,255,255,0.92)', lineHeight: 1.4 }}
            >
              {selectedMedia.description}
            </Text>
          )}

          {/* Badges + submitter row */}
          <Box style={{ display: 'flex', gap: rem(6), alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge
              variant="filled"
              size="sm"
              style={{ backgroundColor: palette.accent, color: '#fff', textTransform: 'capitalize' }}
            >
              {selectedMedia.ownerType}
            </Badge>
            <Badge
              variant="outline"
              size="sm"
              style={{ borderColor: palette.accent, color: palette.accent, textTransform: 'capitalize' }}
            >
              {selectedMedia.type}
            </Badge>
            {selectedMedia.chapterNumber && (
              <Badge
                variant="outline"
                size="sm"
                style={{ borderColor: palette.secondaryAccent, color: palette.secondaryAccent }}
              >
                Ch. {selectedMedia.chapterNumber}
              </Badge>
            )}
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
              by{' '}
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedMedia.submittedBy.username}</span>
              {selectedMedia.createdAt && (
                <> · {new Date(selectedMedia.createdAt).toLocaleDateString()}</>
              )}
            </Text>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}
