/**
 * Manga/Gambling-themed decorative CSS helpers
 * All decorative elements are pure CSS (gradients, SVG, clip-paths) with zero JS overhead
 */

import type { EntityAccentKey } from './mantine-theme'

/**
 * Entity-to-playing-card-suit mapping
 * Thematic associations for Usogui's gambling theme
 */
export const entitySuit: Record<EntityAccentKey, 'spade' | 'heart' | 'diamond' | 'club'> = {
  gamble: 'spade',     // Cunning, death — primary manga theme
  character: 'heart',  // Humanity, connections
  arc: 'diamond',      // Value, story worth
  event: 'club',       // Power, conflict
  volume: 'diamond',
  chapter: 'spade',
  guide: 'heart',
  media: 'club',
  quote: 'heart',
  organization: 'club',
  annotation: 'diamond'
}

/**
 * SVG path data for playing card suits
 */
export const suitPaths = {
  spade: 'M12 2C12 2 4 10 4 15C4 18 6 20 9 20C10.5 20 11.5 19 12 18C12.5 19 13.5 20 15 20C18 20 20 18 20 15C20 10 12 2 12 2ZM10 20L12 24L14 20',
  heart: 'M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z',
  diamond: 'M12 2L22 12L12 22L2 12L12 2Z',
  club: 'M12 2C9.24 2 7 4.24 7 7C7 8.5 7.6 9.8 8.6 10.7C6.5 11.4 5 13.3 5 15.5C5 18.5 7.5 21 10.5 21C11.5 21 12 20.5 12 20.5C12 20.5 12.5 21 13.5 21C16.5 21 19 18.5 19 15.5C19 13.3 17.5 11.4 15.4 10.7C16.4 9.8 17 8.5 17 7C17 4.24 14.76 2 12 2ZM10 21L12 24L14 21'
}

/**
 * CSS background pattern generators
 */
export const mangaPatterns = {
  /**
   * Halftone dot pattern overlay
   * Creates a Ben-Day dot effect common in manga/comics
   */
  halftone: (color = 'rgba(255,255,255,0.04)', size = 3, spacing = 12) =>
    `radial-gradient(circle at ${size}px ${size}px, ${color} ${size}px, transparent 0)`,

  halftoneBackground: (color = 'rgba(255,255,255,0.04)', spacing = 12) => ({
    backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
    backgroundSize: `${spacing}px ${spacing}px`
  }),

  /**
   * Speed lines radiating effect
   * Thin diagonal lines like manga action scenes
   */
  speedLines: (color = 'rgba(255,255,255,0.03)', angle = 45) =>
    `repeating-linear-gradient(${angle}deg, transparent, transparent 10px, ${color} 10px, ${color} 11px)`,

  /**
   * Diagonal stripe pattern
   * Subtle manga-style hatching
   */
  diagonalStripes: (color = 'rgba(255,255,255,0.03)', width = 1, gap = 8) =>
    `repeating-linear-gradient(45deg, transparent, transparent ${gap}px, ${color} ${gap}px, ${color} ${gap + width}px)`,

  /**
   * Cross-hatch pattern
   * Double-direction hatching for denser texture
   */
  crossHatch: (color = 'rgba(255,255,255,0.02)', width = 1, gap = 10) =>
    `repeating-linear-gradient(45deg, transparent, transparent ${gap}px, ${color} ${gap}px, ${color} ${gap + width}px), ` +
    `repeating-linear-gradient(-45deg, transparent, transparent ${gap}px, ${color} ${gap}px, ${color} ${gap + width}px)`,

  /**
   * Panel frame border effect
   * Returns style object for a manga panel-style border
   */
  panelBorder: (accentColor: string, thickness = 3) => ({
    border: `${thickness}px solid ${accentColor}`,
    boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px ${accentColor}40`,
    position: 'relative' as const
  }),

  /**
   * Gradient overlay for hero sections with manga feel
   */
  heroGradient: (entityColor: string) =>
    `linear-gradient(180deg, ${entityColor}18 0%, ${entityColor}08 40%, transparent 100%)`
}

/**
 * Clip-path presets for manga panel framing
 */
export const clipPaths = {
  /** Diagonal bottom edge — creates a dynamic panel break */
  diagonalBottom: 'polygon(0 0, 100% 0, 100% 88%, 0 100%)',
  /** Slight diagonal both sides */
  dynamicPanel: 'polygon(0 0, 100% 2%, 100% 98%, 0 100%)',
  /** No clip */
  none: 'none'
}

/**
 * Inline SVG suit icon as a data URI (for use in CSS backgrounds)
 */
export const suitDataUri = (suit: keyof typeof suitPaths, color: string, size = 24) => {
  const path = suitPaths[suit]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}"><path d="${path}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * Style object for a suit watermark background
 */
export const suitWatermarkStyle = (
  suit: keyof typeof suitPaths,
  color: string,
  options?: { position?: 'top-right' | 'bottom-left' | 'center'; opacity?: number; size?: number }
) => {
  const { position = 'top-right', opacity = 0.04, size = 120 } = options ?? {}
  const positionMap = {
    'top-right': 'right 20px top 20px',
    'bottom-left': 'left 20px bottom 20px',
    'center': 'center center'
  }

  return {
    backgroundImage: suitDataUri(suit, color, size),
    backgroundRepeat: 'no-repeat',
    backgroundPosition: positionMap[position],
    backgroundSize: `${size}px ${size}px`,
    opacity
  }
}
