'use client'

import { Box } from '@mantine/core'
import { motion, useScroll, useTransform, useMotionValue, useMotionTemplate } from 'motion/react'
import Image from 'next/image'
import React, { useRef } from 'react'

export function VolumeCoverSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const time = useMotionValue(0)

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

  const volume37Scale = useTransform(scrollYProgress, [0.2, 0.8], [1, 1.02])
  const volume38Scale = useTransform(scrollYProgress, [0.25, 0.85], [1, 1.02])
  const volume37X = useTransform(scrollYProgress, [0.2, 0.8], [0, -3])
  const volume38X = useTransform(scrollYProgress, [0.25, 0.85], [0, 3])
  const volume37RotateY = useTransform(scrollYProgress, [0.2, 0.8], [-2, -0.5])
  const volume38RotateY = useTransform(scrollYProgress, [0.25, 0.85], [2, 0.5])
  const volume37Z = useTransform(scrollYProgress, [0.2, 0.8], [0, 8])
  const volume38Z = useTransform(scrollYProgress, [0.25, 0.85], [0, 8])

  const popout37ScrollY = useTransform(scrollYProgress, [0.1, 0.9], [0, -15])
  const popout38ScrollY = useTransform(scrollYProgress, [0.15, 0.95], [0, -15])

  const popout37FloatY = useTransform(time, (t) => Math.sin(t * 0.8) * 2)
  const popout38FloatY = useTransform(time, (t) => Math.sin((t + 1) * 0.7) * 2.5)

  const popout37Y = useMotionTemplate`calc(${popout37ScrollY}px + ${popout37FloatY}px)`
  const popout38Y = useMotionTemplate`calc(${popout38ScrollY}px + ${popout38FloatY}px)`
  const popout37Scale = useTransform(scrollYProgress, [0.1, 0.9], [1, 1.08])
  const popout38Scale = useTransform(scrollYProgress, [0.15, 0.95], [1, 1.08])
  const popout37Z = useTransform(scrollYProgress, [0.1, 0.9], [0, 25])
  const popout38Z = useTransform(scrollYProgress, [0.15, 0.95], [0, 25])
  const popout37RotateX = useTransform(scrollYProgress, [0.1, 0.9], [0, -3])
  const popout38RotateX = useTransform(scrollYProgress, [0.15, 0.95], [0, -3])

  return (
    <Box
      ref={containerRef}
      style={{
        position: 'relative',
        height: 'clamp(450px, 55vw, 550px)',
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
          justifyContent: 'center',
          alignItems: 'flex-end',
          height: '80%',
          gap: '0.5rem',
          paddingInline: 'clamp(0.75rem, 2vw, 2rem)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -80, rotateY: 12, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            zIndex: 1,
            flex: '0 0 auto',
            scale: volume37Scale,
            x: volume37X,
            rotateY: volume37RotateY,
            z: volume37Z
          }}
        >
          <Box
            style={{
              position: 'relative',
              width: 'clamp(180px, 28vw, 300px)',
              height: 'clamp(260px, 45vw, 440px)',
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.3s ease-out'
            }}
          >
            <Image
              src="/assets/Usogui_Volume_37_background.png"
              alt="Usogui Volume 37"
              fill
              priority
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(12px 12px 24px rgba(0, 0, 0, 0.4))',
                zIndex: 1
              }}
            />

            <motion.div
              className="popout-37"
              initial={{ opacity: 0, y: 0, z: 0, scale: 1, rotateX: 0 }}
              animate={{ opacity: 0.9, y: 0, z: 0, scale: 1, rotateX: 0 }}
              transition={{ duration: 1.5, delay: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                pointerEvents: 'none',
                transformStyle: 'preserve-3d'
              }}
            >
              <motion.div
                animate={{ rotateY: [-0.5, 0.5, -0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: '100%',
                  height: '100%',
                  y: popout37Y,
                  scale: popout37Scale,
                  z: popout37Z,
                  rotateX: popout37RotateX
                }}
              >
                <Image
                  src="/assets/Usogui_Volume_37_popout.png"
                  alt="Volume 37 Character"
                  fill
                  style={{
                    filter: 'drop-shadow(8px 12px 24px rgba(0, 0, 0, 0.7)) drop-shadow(4px 6px 12px rgba(0, 0, 0, 0.4))',
                    objectFit: 'contain'
                  }}
                />
              </motion.div>
            </motion.div>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 80, rotateY: -12, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            zIndex: 1,
            flex: '0 0 auto',
            scale: volume38Scale,
            x: volume38X,
            rotateY: volume38RotateY,
            z: volume38Z
          }}
        >
          <Box
            style={{
              position: 'relative',
              width: 'clamp(180px, 28vw, 300px)',
              height: 'clamp(260px, 45vw, 440px)',
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.3s ease-out'
            }}
          >
            <Image
              src="/assets/Usogui_Volume_38_background.png"
              alt="Usogui Volume 38"
              fill
              priority
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(12px 12px 24px rgba(0, 0, 0, 0.4))',
                zIndex: 1
              }}
            />

            <motion.div
              className="popout-38"
              initial={{ opacity: 0, y: 0, z: 0, scale: 1, rotateX: 0 }}
              animate={{ opacity: 0.9, y: 0, z: 0, scale: 1, rotateX: 0 }}
              transition={{ duration: 1.5, delay: 1.0, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                pointerEvents: 'none',
                transformStyle: 'preserve-3d'
              }}
            >
              <motion.div
                animate={{ rotateY: [0.5, -0.5, 0.5] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                style={{
                  width: '100%',
                  height: '100%',
                  y: popout38Y,
                  scale: popout38Scale,
                  z: popout38Z,
                  rotateX: popout38RotateX
                }}
              >
                <Image
                  src="/assets/Usogui_Volume_38_popout.png"
                  alt="Volume 38 Character"
                  fill
                  style={{
                    filter: 'drop-shadow(8px 12px 24px rgba(0, 0, 0, 0.7)) drop-shadow(4px 6px 12px rgba(0, 0, 0, 0.4))',
                    objectFit: 'contain'
                  }}
                />
              </motion.div>
            </motion.div>
          </Box>
        </motion.div>
      </Box>
    </Box>
  )
}
