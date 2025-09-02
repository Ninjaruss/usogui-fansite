'use client'

import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { motion, useScroll, useTransform } from 'motion/react'
import Image from 'next/image'
import { useRef } from 'react'

export function VolumeCoverSection() {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })
  
  // Transform values based on scroll progress
  const volume37Scale = useTransform(scrollYProgress, [0.3, 0.7], [1, 1.03])
  const volume38Scale = useTransform(scrollYProgress, [0.4, 0.8], [1, 1.03])
  const volume37X = useTransform(scrollYProgress, [0.3, 0.7], [0, -5])
  const volume38X = useTransform(scrollYProgress, [0.4, 0.8], [0, 5])
  const volume37RotateY = useTransform(scrollYProgress, [0.3, 0.7], [-3, -1])
  const volume38RotateY = useTransform(scrollYProgress, [0.4, 0.8], [3, 1])
  const volume37Z = useTransform(scrollYProgress, [0.3, 0.7], [0, 10])
  const volume38Z = useTransform(scrollYProgress, [0.4, 0.8], [0, 10])
  
  // Popout floating animations based on scroll
  const popout37Y = useTransform(scrollYProgress, [0.2, 0.8], [0, -20])
  const popout38Y = useTransform(scrollYProgress, [0.3, 0.9], [0, -20])
  const popout37Scale = useTransform(scrollYProgress, [0.2, 0.8], [1, 1.1])
  const popout38Scale = useTransform(scrollYProgress, [0.3, 0.9], [1, 1.1])
  const popout37Z = useTransform(scrollYProgress, [0.2, 0.8], [0, 30])
  const popout38Z = useTransform(scrollYProgress, [0.3, 0.9], [0, 30])
  const popout37RotateX = useTransform(scrollYProgress, [0.2, 0.8], [0, -5])
  const popout38RotateX = useTransform(scrollYProgress, [0.3, 0.9], [0, -5])

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        height: { xs: '450px', md: '550px' },
        width: '100%',
        perspective: '1200px',
        mb: 6,
        overflow: 'visible'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          height: '80%',
          gap: { xs: 0, md: 0.5 },
          px: { xs: 1, md: 2 }
        }}
      >
        {/* Volume 37 */}
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
            sx={{
              position: 'relative',
              width: { xs: '180px', md: '260px', lg: '300px' },
              height: { xs: '260px', md: '380px', lg: '440px' },
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.3s ease-out'
            }}
          >
            <Image
              src="/assets/Usogui_Volume_37_background.png"
              alt="Usogui Volume 37"
              fill
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(12px 12px 24px rgba(0, 0, 0, 0.4))'
              }}
            />
            
            {/* Volume 37 Pop-out Character */}
            <motion.div
              className="popout-37"
              initial={{ opacity: 0, y: 30, z: -50, scale: 0.6, rotateX: 20 }}
              animate={{ opacity: 0.9, y: 0, z: 0, scale: 1, rotateX: 0 }}
              transition={{ duration: 1.5, delay: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                zIndex: 10,
                pointerEvents: 'none',
                transformStyle: 'preserve-3d'
              }}
            >
              <motion.div
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
                    filter: 'drop-shadow(6px 6px 16px rgba(0, 0, 0, 0.5))',
                    objectFit: 'contain'
                  }}
                />
              </motion.div>
            </motion.div>
          </Box>
        </motion.div>

        {/* Volume 38 */}
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
            sx={{
              position: 'relative',
              width: { xs: '180px', md: '260px', lg: '300px' },
              height: { xs: '260px', md: '380px', lg: '440px' },
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.3s ease-out'
            }}
          >
            <Image
              src="/assets/Usogui_Volume_38_background.png"
              alt="Usogui Volume 38"
              fill
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(12px 12px 24px rgba(0, 0, 0, 0.4))'
              }}
            />

            {/* Volume 38 Pop-out Character */}
            <motion.div
              className="popout-38"
              initial={{ opacity: 0, y: 30, z: -50, scale: 0.6, rotateX: 20 }}
              animate={{ opacity: 0.9, y: 0, z: 0, scale: 1, rotateX: 0 }}
              transition={{ duration: 1.5, delay: 1.0, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                zIndex: 10,
                pointerEvents: 'none',
                transformStyle: 'preserve-3d'
              }}
            >
              <motion.div
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
                    filter: 'drop-shadow(6px 6px 16px rgba(0, 0, 0, 0.5))',
                    objectFit: 'contain'
                  }}
                />
              </motion.div>
            </motion.div>
          </Box>
        </motion.div>

        {/* Enhanced floating particles effect */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 3 + (i * 0.5),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4
            }}
            style={{
              position: 'absolute',
              top: `${20 + (i * 10)}%`,
              left: `${15 + (i * 12)}%`,
              width: `${3 + (i % 3)}px`,
              height: `${3 + (i % 3)}px`,
              borderRadius: '50%',
              backgroundColor: [
                theme.palette.primary.main,
                theme.palette.secondary.main,
                theme.palette.warning.main,
                theme.palette.error.main,
                theme.palette.usogui.character,
                theme.palette.usogui.arc
              ][i % 6],
              zIndex: 0
            }}
          />
        ))}
      </Box>
    </Box>
  )
}