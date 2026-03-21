export interface VolumeShowcaseItem {
  id: number
  backgroundImage: string
  popoutImage?: string
  title?: string
  description?: string
}

export interface ShowcaseAnimations {
  floatIntensity?: number
  parallaxIntensity?: number
  scaleRange?: [number, number]
  rotationRange?: [number, number]
  delayOffset?: number
}

export const ANIMATION_PRESETS = {
  subtle: {
    floatIntensity: 1,
    parallaxIntensity: 8,
    scaleRange: [1, 1.02] as [number, number],
    rotationRange: [-1, 1] as [number, number],
    delayOffset: 0.1
  },
  standard: {
    floatIntensity: 2,
    parallaxIntensity: 15,
    scaleRange: [1, 1.05] as [number, number],
    rotationRange: [-2, 2] as [number, number],
    delayOffset: 0.2
  },
  dramatic: {
    floatIntensity: 3.5,
    parallaxIntensity: 25,
    scaleRange: [1, 1.08] as [number, number],
    rotationRange: [-4, 4] as [number, number],
    delayOffset: 0.3
  }
} as const