import { MotionValue, useTransform, useMotionTemplate } from 'motion/react'

export interface AnimationConfig {
  floatIntensity?: number
  parallaxIntensity?: number
  scaleRange?: [number, number]
  rotationRange?: [number, number]
  delayOffset?: number
}

export interface VolumeAnimations {
  scale: MotionValue<number>
  x: MotionValue<number>
  rotateY: MotionValue<number>
  z: MotionValue<number>
}

export interface PopoutAnimations {
  scrollY: MotionValue<number>
  floatY: MotionValue<number>
  y: MotionValue<string>
  scale: MotionValue<number>
  z: MotionValue<number>
  rotateX: MotionValue<number>
}

export interface ShowcaseAnimationSet {
  volume: VolumeAnimations
  popout?: PopoutAnimations
}

export function useVolumeAnimations(
  scrollYProgress: MotionValue<number>,
  config: AnimationConfig,
  index: number,
  totalVolumes: number
): VolumeAnimations {
  const isFirst = index === 0
  const scrollStart = 0.2 + (index * 0.05)
  const scrollEnd = 0.8 + (index * 0.05)

  const scale = useTransform(
    scrollYProgress,
    [scrollStart, scrollEnd],
    config.scaleRange || [1, 1.05]
  )

  const x = useTransform(
    scrollYProgress,
    [scrollStart, scrollEnd],
    totalVolumes > 1 ? (isFirst ? [0, -3] : [0, 3]) : [0, 0]
  )

  const rotateY = useTransform(
    scrollYProgress,
    [scrollStart, scrollEnd],
    totalVolumes > 1
      ? (isFirst
          ? config.rotationRange || [-2, 0.5]
          : [(config.rotationRange?.[1] || 2) * -1, (config.rotationRange?.[0] || -0.5) * -1]
        )
      : [0, 0]
  )

  const z = useTransform(scrollYProgress, [scrollStart, scrollEnd], [0, 8])

  return { scale, x, rotateY, z }
}

export function usePopoutAnimations(
  scrollYProgress: MotionValue<number>,
  time: MotionValue<number>,
  config: AnimationConfig,
  index: number
): PopoutAnimations {
  const scrollStart = 0.2 + (index * 0.05) - 0.1
  const scrollEnd = 0.8 + (index * 0.05) + 0.1

  const scrollY = useTransform(
    scrollYProgress,
    [scrollStart, scrollEnd],
    [0, -(config.parallaxIntensity || 15)]
  )

  const floatY = useTransform(time, (t) =>
    Math.sin((t + index) * 0.8) * (config.floatIntensity || 2)
  )

  const y = useMotionTemplate`calc(${scrollY}px + ${floatY}px)`

  const scale = useTransform(
    scrollYProgress,
    [scrollStart, scrollEnd],
    [1, (config.scaleRange?.[1] || 1.05) + 0.03]
  )

  const z = useTransform(scrollYProgress, [scrollStart, scrollEnd], [0, 25])

  const rotateX = useTransform(scrollYProgress, [scrollStart, scrollEnd], [0, -3])

  return { scrollY, floatY, y, scale, z, rotateX }
}

export function useShowcaseAnimationSet(
  scrollYProgress: MotionValue<number>,
  time: MotionValue<number>,
  config: AnimationConfig,
  index: number,
  totalVolumes: number,
  hasPopout: boolean = false
): ShowcaseAnimationSet {
  const volume = useVolumeAnimations(scrollYProgress, config, index, totalVolumes)
  const popoutAnimations = usePopoutAnimations(scrollYProgress, time, config, index)
  const popout = hasPopout ? popoutAnimations : undefined

  return { volume, popout }
}

// Animation transition presets for different entrance effects
export const ENTRANCE_ANIMATIONS = {
  slideFromSides: {
    single: {
      initial: { opacity: 0, y: 50, scale: 0.8 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    dual: {
      left: {
        initial: { opacity: 0, x: -80, rotateY: 12, scale: 0.8 },
        animate: { opacity: 1, x: 0, rotateY: 0, scale: 1 },
        transition: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }
      },
      right: {
        initial: { opacity: 0, x: 80, rotateY: -12, scale: 0.8 },
        animate: { opacity: 1, x: 0, rotateY: 0, scale: 1 },
        transition: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }
      }
    }
  },
  fadeInScale: {
    single: {
      initial: { opacity: 0, scale: 0.6 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 1.5, ease: [0.175, 0.885, 0.32, 1.275] }
    },
    dual: {
      left: {
        initial: { opacity: 0, scale: 0.6, rotateY: 15 },
        animate: { opacity: 1, scale: 1, rotateY: 0 },
        transition: { duration: 1.5, ease: [0.175, 0.885, 0.32, 1.275] }
      },
      right: {
        initial: { opacity: 0, scale: 0.6, rotateY: -15 },
        animate: { opacity: 1, scale: 1, rotateY: 0 },
        transition: { duration: 1.5, ease: [0.175, 0.885, 0.32, 1.275] }
      }
    }
  },
  bounceIn: {
    single: {
      initial: { opacity: 0, y: -100, scale: 0.3 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: {
        duration: 1.8,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },
    dual: {
      left: {
        initial: { opacity: 0, x: -100, y: -50, scale: 0.3 },
        animate: { opacity: 1, x: 0, y: 0, scale: 1 },
        transition: {
          duration: 1.8,
          type: 'spring',
          stiffness: 100,
          damping: 15
        }
      },
      right: {
        initial: { opacity: 0, x: 100, y: -50, scale: 0.3 },
        animate: { opacity: 1, x: 0, y: 0, scale: 1 },
        transition: {
          duration: 1.8,
          type: 'spring',
          stiffness: 100,
          damping: 15,
          delay: 0.2
        }
      }
    }
  }
} as const

export function getEntranceAnimation(
  animationType: keyof typeof ENTRANCE_ANIMATIONS = 'slideFromSides',
  layout: 'single' | 'dual' = 'dual',
  index: number = 0,
  delay: number = 0
) {
  const animation = ENTRANCE_ANIMATIONS[animationType]

  if (layout === 'single') {
    return {
      ...animation.single,
      transition: {
        ...animation.single.transition,
        delay: delay
      }
    }
  }

  const isLeft = index === 0
  const side = isLeft ? 'left' : 'right'
  return {
    ...animation.dual[side],
    transition: {
      ...animation.dual[side].transition,
      delay: delay + (index * 0.2)
    }
  }
}

// Popout rotation patterns
export const POPOUT_ROTATION_PATTERNS = {
  gentle: {
    amplitude: [-0.5, 0.5, -0.5],
    duration: 8,
    ease: 'easeInOut' as const
  },
  standard: {
    amplitude: [-1, 1, -1],
    duration: 6,
    ease: 'easeInOut' as const
  },
  dramatic: {
    amplitude: [-2, 2, -2],
    duration: 4,
    ease: 'easeInOut' as const
  }
} as const

export function getPopoutRotation(
  pattern: keyof typeof POPOUT_ROTATION_PATTERNS = 'standard',
  isFirst: boolean = true,
  index: number = 0
) {
  const config = POPOUT_ROTATION_PATTERNS[pattern]
  const baseAmplitude = [...config.amplitude]
  const amplitude = isFirst ? baseAmplitude : baseAmplitude.map(val => val * -1)

  return {
    animate: { rotateY: amplitude },
    transition: {
      duration: config.duration + (index * 1),
      repeat: Infinity,
      ease: config.ease,
      delay: index * 2
    }
  }
}
