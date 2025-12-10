'use client'

import { Box, Loader, Alert, Text } from '@mantine/core'
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'motion/react'
import Image from 'next/image'
import React, { useRef, useState, useCallback } from 'react'
import { AlertTriangle, Image as ImageIcon } from 'lucide-react'
import { useShowcaseAnimationSet, getEntranceAnimation, getPopoutRotation } from '../lib/showcase-animations'

import type { VolumeShowcaseItem, ShowcaseAnimations } from '../lib/showcase-config'

interface DynamicVolumeShowcaseProps {
  volumes: VolumeShowcaseItem[]
  layout?: 'single' | 'dual'
  animations?: ShowcaseAnimations
  height?: string
  className?: string
}

const defaultAnimations: ShowcaseAnimations = {
  floatIntensity: 2,
  parallaxIntensity: 15,
  scaleRange: [1, 1.05],
  rotationRange: [-2, 2],
  delayOffset: 0.2
}

interface ImageLoadingStates {
  [key: string]: {
    loading: boolean
    error: boolean
    retryCount: number
  }
}

function ImageWithRetry({
  src,
  alt,
  onLoad,
  onError,
  ...props
}: {
  src: string
  alt: string
  onLoad?: () => void
  onError?: () => void
  [key: string]: any
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleLoad = () => {
    setLoading(false)
    setError(false)
    onLoad?.()
  }

  const handleError = () => {
    console.error('Image failed to load:', src)

    if (retryCount < 2) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1)
        setError(false)
        setLoading(true)
      }, 1000 * (retryCount + 1))
    } else {
      setLoading(false)
      setError(true)
      onError?.()
    }
  }

  if (error) {
    return (
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          color: '#6c757d',
          borderRadius: '8px'
        }}
      >
        <ImageIcon size={24} style={{ marginBottom: '8px' }} />
        <Text size="xs" ta="center">Image unavailable</Text>
      </Box>
    )
  }

  return (
    <>
      {loading && (
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(248, 249, 250, 0.8)',
            zIndex: 1
          }}
        >
          <Loader size="sm" color="red" />
        </Box>
      )}
      <Image
        {...props}
        src={`${src}?retry=${retryCount}`}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        priority={false}
        loading="lazy"
      />
    </>
  )
}

export function DynamicVolumeShowcase({
  volumes,
  layout = volumes.length === 1 ? 'single' : 'dual',
  animations = defaultAnimations,
  height = 'clamp(450px, 55vw, 550px)',
  className
}: DynamicVolumeShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const time = useMotionValue(0)
  const [imageStates, setImageStates] = useState<ImageLoadingStates>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  React.useEffect(() => {
    const animate = () => {
      time.set(Date.now() / 1000)
      requestAnimationFrame(animate)
    }
    animate()
  }, [time])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  })

  const handleImageLoad = useCallback((imageKey: string) => {
    setImageStates(prev => ({
      ...prev,
      [imageKey]: { ...prev[imageKey], loading: false, error: false }
    }))
  }, [])

  const handleImageError = useCallback((imageKey: string) => {
    setImageStates(prev => ({
      ...prev,
      [imageKey]: {
        loading: false,
        error: true,
        retryCount: (prev[imageKey]?.retryCount || 0) + 1
      }
    }))
  }, [])

  const renderVolume = (volume: VolumeShowcaseItem, index: number, totalVolumes: number) => {
    const isFirst = index === 0
    const animConfig = { ...defaultAnimations, ...animations }
    const baseDelay = index * (animConfig.delayOffset || 0.2)

    // Create animation set using utility functions
    const animationSet = useShowcaseAnimationSet(
      scrollYProgress,
      time,
      animConfig,
      index,
      totalVolumes,
      !!volume.popoutImage
    )

    const entranceAnim = getEntranceAnimation('slideFromSides', layout, index, baseDelay)
    const popoutRotation = volume.popoutImage ? getPopoutRotation('standard', isFirst, index) : null

    return (
      <motion.div
        key={volume.id}
        initial={entranceAnim.initial}
        animate={entranceAnim.animate}
        transition={entranceAnim.transition}
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          zIndex: 1,
          flex: layout === 'single' ? '1' : '0 0 auto',
          scale: animationSet.volume.scale,
          x: animationSet.volume.x,
          rotateY: animationSet.volume.rotateY,
          z: animationSet.volume.z
        }}
      >
        <Box
          style={{
            position: 'relative',
            width: layout === 'single' ? 'clamp(250px, 35vw, 400px)' : 'clamp(180px, 28vw, 300px)',
            height: layout === 'single' ? 'clamp(360px, 50vw, 580px)' : 'clamp(260px, 45vw, 440px)',
            cursor: 'pointer',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.3s ease-out',
            margin: layout === 'single' ? '0 auto' : '0'
          }}
        >
          <ImageWithRetry
            src={volume.backgroundImage}
            alt={volume.title || `Volume ${volume.id}`}
            fill
            onLoad={() => handleImageLoad(`bg-${volume.id}`)}
            onError={() => handleImageError(`bg-${volume.id}`)}
            style={{
              objectFit: 'contain',
              filter: 'drop-shadow(12px 12px 24px rgba(0, 0, 0, 0.4))',
              zIndex: 1
            }}
          />

          {volume.popoutImage && (
            <motion.div
              initial={{ opacity: 0, y: 0, z: 0, scale: 1, rotateX: 0 }}
              animate={{ opacity: 0.9, y: 0, z: 0, scale: 1, rotateX: 0 }}
              transition={{
                duration: 1.5,
                delay: baseDelay + 0.6,
                ease: [0.175, 0.885, 0.32, 1.275]
              }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                pointerEvents: 'none',
                transformStyle: 'preserve-3d'
              }}
            >
              <motion.div
                animate={popoutRotation?.animate || {}}
                transition={popoutRotation?.transition || {}}
                style={{
                  width: '100%',
                  height: '100%',
                  y: animationSet.popout?.y,
                  scale: animationSet.popout?.scale,
                  z: animationSet.popout?.z,
                  rotateX: animationSet.popout?.rotateX
                }}
              >
                <ImageWithRetry
                  src={volume.popoutImage}
                  alt={`${volume.title || `Volume ${volume.id}`} Character`}
                  fill
                  onLoad={() => handleImageLoad(`popout-${volume.id}`)}
                  onError={() => handleImageError(`popout-${volume.id}`)}
                  style={{
                    filter: 'drop-shadow(8px 12px 24px rgba(0, 0, 0, 0.7)) drop-shadow(4px 6px 12px rgba(0, 0, 0, 0.4))',
                    objectFit: 'contain'
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </Box>
      </motion.div>
    )
  }

  // Validation
  React.useEffect(() => {
    if (!volumes || volumes.length === 0) {
      setGlobalError('No volumes provided for showcase')
      return
    }

    if (layout === 'dual' && volumes.length < 2) {
      setGlobalError('Dual layout requires at least 2 volumes')
      return
    }

    if (layout === 'single' && volumes.length > 1) {
      console.warn('Single layout with multiple volumes - only first volume will be displayed')
    }

    const invalidVolumes = volumes.filter(vol => !vol.backgroundImage)
    if (invalidVolumes.length > 0) {
      setGlobalError('Some volumes are missing background images')
      return
    }

    setGlobalError(null)
  }, [volumes, layout])

  if (globalError) {
    return (
      <Alert
        variant="light"
        radius="md"
        color="red"
        icon={<AlertTriangle size={16} />}
        style={{ margin: '2rem 0' }}
      >
        {globalError}
      </Alert>
    )
  }

  return (
    <Box
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        height: height,
        width: '100%',
        perspective: '1200px',
        marginBottom: 0,
        overflow: 'visible'
      }}
    >
      <Box
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: layout === 'single' ? 'center' : 'center',
          alignItems: 'flex-end',
          height: '80%',
          gap: layout === 'dual' ? '0.5rem' : '0',
          paddingInline: 'clamp(0.75rem, 2vw, 2rem)'
        }}
      >
        {volumes.slice(0, layout === 'single' ? 1 : 2).map((volume, index) =>
          renderVolume(volume, index, Math.min(volumes.length, layout === 'single' ? 1 : 2))
        )}
      </Box>
    </Box>
  )
}