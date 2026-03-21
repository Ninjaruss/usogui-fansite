import { MantineThemeOverride, createTheme, rem, MantineTheme } from '@mantine/core'
import selectClasses from './mantine-select.module.css'
import { ENTITY_COLORS } from './entityColors'

// Entity-specific Mantine color palettes — 10-step ramps with approved accent at index 5
export const colors = {
  gamble: [
    '#fdf2f3', '#fbd9db', '#f7b4b8', '#f28f94', '#eb6b71',
    '#e63946', // index 5 — approved accent
    '#c72636', '#a81e2c', '#861622', '#550e16'
  ] as const,
  arc: [
    '#fff4f0', '#ffddd1', '#ffbfa8', '#ff9f7a', '#ff844d',
    '#ff6b35', // index 5 — approved accent
    '#e5531d', '#c43e10', '#9e2f08', '#601a02'
  ] as const,
  annotation: [
    '#fdf4ff', '#fae8ff', '#f5d0fe', '#f0abfc', '#e879f9',
    '#d946ef', // index 5 — approved accent
    '#a21caf', '#86198f', '#701a75', '#4a044e'
  ] as const,
  event: [
    '#fef9e8', '#fcefc2', '#f9e08a', '#f4cc4e', '#e0ab18',
    '#ca8a04', // index 5 — approved accent
    '#a86f03', '#865602', '#623d01', '#362000'
  ] as const,
  guide: [
    '#f0fdf4', '#d1fae5', '#a7f3c7', '#6ee6a0', '#34c470',
    '#16a34a', // index 5 — approved accent
    '#0f8239', '#0a612a', '#07421c', '#03210e'
  ] as const,
  organization: [
    '#f0f9fe', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8',
    '#0284c7', // index 5 — approved accent
    '#0166a1', '#0153a0', '#053566', '#001a2e'
  ] as const,
  quote: [
    '#f0fdfb', '#ccf7f2', '#96ece3', '#56ddd0', '#27c4b6',
    '#0d9488', // index 5 — approved accent
    '#097569', '#075c52', '#053f38', '#02211d'
  ] as const,
  chapter: [
    '#f0faff', '#ddf3fe', '#b8e8fd', '#79d4fb', '#52c8f9',
    '#38bdf8', // index 5 — approved accent
    '#119ad4', '#0878ab', '#065a80', '#032e41'
  ] as const,
  character: [
    '#fef9f0', '#fdefd1', '#fbd99a', '#f8c05e', '#f6b036',
    '#f5a623', // index 5 — approved accent
    '#d4860d', '#a86607', '#7c4904', '#3f2301'
  ] as const,
  volume: [
    '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc',
    '#8b5cf6', // index 5 — approved accent
    '#7c3aed', '#6d28d9', '#5b21b6', '#3c0d6b'
  ] as const,
  media: [
    '#fdf2f8', '#fce7f3', '#fbcfe8', '#f8b4d6', '#f472b6',
    '#ec4899', // index 5 — approved accent
    '#db2777', '#be185d', '#9d174d', '#500724'
  ] as const,
} as const

export const mantineTheme: MantineThemeOverride = {
  colors: {
    ...colors,
    // Custom Usogui colors for Mantine (as MantineColorsTuple)
    red: [
      '#fef2f2',
      '#fecaca',
      '#fca5a5',
      '#f87171',
      '#ef4444',
      '#e11d48', // Main Usogui red
      '#dc2626',
      '#b91c1c',
      '#991b1b',
      '#7f1d1d'
    ] as const,
    purple: [
      '#faf5ff',
      '#e9d5ff',
      '#d8b4fe',
      '#c084fc',
      '#a855f7',
      '#7c3aed', // Main Usogui purple
      '#6d28d9',
      '#5b21b6',
      '#4c1d95',
      '#3c1361'
    ] as const,
    black: [
      '#0a0a0a', // Usogui black
      '#171717',
      '#262626',
      '#404040',
      '#525252',
      '#737373',
      '#a3a3a3',
      '#d4d4d4',
      '#e5e5e5',
      '#f5f5f5'
    ] as const
  },
  primaryColor: 'red',
  primaryShade: { light: 5, dark: 5 },
  autoContrast: true,

  // Ensure proper CSS variable generation for dark theme
  white: '#ffffff',
  black: '#0a0a0a',

  fontFamily: '"Noto Sans", system-ui, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: {
    fontFamily: '"OPTI Goudy Text", serif',
    fontWeight: '400',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.2' },
      h2: { fontSize: rem(28), lineHeight: '1.25' },
      h3: { fontSize: rem(24), lineHeight: '1.3' },
      h4: { fontSize: rem(20), lineHeight: '1.35' },
      h5: { fontSize: rem(18), lineHeight: '1.4' },
      h6: { fontSize: rem(16), lineHeight: '1.5' }
    }
  },

  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
    xxl: rem(48)
  },

  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(6),
    lg: rem(8),
    xl: rem(12)
  },

  breakpoints: {
    xs: rem(0),
    sm: rem(600),
    md: rem(900),
    lg: rem(1200),
    xl: rem(1536)
  },

  components: {
    Card: {
      styles: (theme: MantineTheme) => ({
        root: {
          backgroundColor: '#0a0a0a',
          border: `1px solid rgba(225, 29, 72, 0.2)`,
          backdropFilter: 'blur(10px)',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          color: '#ffffff',
          '&:hover': {
            borderColor: '#e11d48',
            boxShadow: theme.shadows.lg,
            transform: 'translateY(-2px)'
          }
        }
      }),
    },

    Button: {
      defaultProps: {
        radius: 'sm'
      },
      styles: (theme: MantineTheme) => ({
        root: {
          fontWeight: 600,
          fontFamily: theme.fontFamily,
          textTransform: 'none'
        }
      }),
    },

    Container: {
      styles: () => ({
        root: {
          backgroundColor: 'transparent',
          color: '#ffffff'
        }
      }),
    },

    Modal: {
      styles: (theme: any) => ({
        content: {
          backgroundColor: '#0a0a0a',
          border: `1px solid rgba(225, 29, 72, 0.2)`,
          backdropFilter: 'blur(10px)',
          color: '#ffffff'
        },
        header: {
          backgroundColor: 'transparent',
          borderBottom: `1px solid rgba(225, 29, 72, 0.2)`,
          color: '#ffffff'
        },
        title: {
          color: '#ffffff'
        },
        body: {
          color: '#ffffff'
        }
      }),
    },

    Menu: {
      styles: (theme: MantineTheme) => ({
        dropdown: {
          backgroundColor: '#0a0a0a',
          border: `1px solid rgba(225, 29, 72, 0.2)`,
          backdropFilter: 'blur(10px)',
          padding: theme.spacing.xs
        },
        item: {
          color: '#ffffff',
          padding: `${theme.spacing.xs} ${rem(10)}`,
          margin: `${rem(2)} 0`,
          borderRadius: theme.radius.sm,
          transition: outlineStyles.transition,
          '&:hover': {
            backgroundColor: 'rgba(225, 29, 72, 0.08)',
            boxShadow: `inset 0 0 0 1px ${outlineStyles.colors.hover}`,
            outline: 'none'
          },
          '&:focus': {
            backgroundColor: 'rgba(225, 29, 72, 0.08)',
            boxShadow: `inset 0 0 0 1px ${outlineStyles.colors.hover}`,
            outline: 'none'
          }
        }
      }),
    },

    TextInput: {
      styles: () => ({
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: `1px solid rgba(255, 255, 255, 0.15)`,
          color: '#ffffff',
          transition: 'border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(225, 29, 72, 0.4)'
          },
          '&:focus': {
            borderColor: '#e11d48',
            boxShadow: `0 0 0 ${rem(2)} rgba(225, 29, 72, 0.2)`
          },
          '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.65)' // Increased from 0.5 for better visibility
          }
        },
        label: {
          color: 'rgba(255, 255, 255, 0.75)', // 4.6:1 contrast - WCAG AA compliant
          fontWeight: 500
        }
      }),
    },

    Textarea: {
      styles: () => ({
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: `1px solid rgba(255, 255, 255, 0.15)`,
          color: '#ffffff',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          '&:focus': {
            borderColor: '#e11d48',
            boxShadow: `0 0 0 ${rem(2)} rgba(225, 29, 72, 0.2)`
          },
          '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.75)' // 4.6:1 contrast - WCAG AA compliant
          }
        },
        label: {
          color: 'rgba(255, 255, 255, 0.75)', // 4.6:1 contrast - WCAG AA compliant
          fontWeight: 500
        }
      }),
    },

    Select: {
      classNames: {
        input: selectClasses.input,
        option: selectClasses.option
      },
      styles: () => ({
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: `1px solid rgba(255, 255, 255, 0.15)`,
          color: '#ffffff',
          transition: 'border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease'
        },
        label: {
          color: 'rgba(255, 255, 255, 0.75)', // 4.6:1 contrast - WCAG AA compliant
          fontWeight: 500
        },
        dropdown: {
          backgroundColor: '#0a0a0a',
          border: `1px solid rgba(255, 255, 255, 0.15)`,
          color: '#ffffff'
        },
        option: {
          color: '#ffffff',
          backgroundColor: 'transparent',
          padding: `${rem(8)} ${rem(12)}`
        }
      }),
    },

    Tabs: {
      styles: (theme: MantineTheme) => ({
        panel: {
          color: '#ffffff'
        },
        tab: {
          color: 'rgba(255, 255, 255, 0.7)',
          borderRadius: rem(6),
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          padding: `${rem(12)} ${rem(20)}`,
          backgroundColor: 'transparent',
          border: '2px solid transparent',
          position: 'relative',

          // Hover state
          '&:hover': {
            backgroundColor: 'var(--tab-hover-bg, rgba(225, 29, 72, 0.08))',
            color: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'var(--tab-hover-outline, rgba(225, 29, 72, 0.4))',
            transform: 'translateY(-1px)',
          },

          // Focus state
          '&:focus': {
            backgroundColor: 'transparent',
            borderColor: 'var(--tab-focus-outline, rgba(225, 29, 72, 0.6))',
            outline: 'none'
          },

          // Active state for Mantine v8
          '&[dataActive="true"]': {
            color: '#ffffff',
            backgroundColor: 'var(--tab-active-bg, rgba(225, 29, 72, 0.12))',
            borderColor: 'var(--tab-active-outline, rgba(225, 29, 72, 0.8))',
            fontWeight: 600,
          },

          // Active hover state
          '&[dataActive="true"]:hover': {
            backgroundColor: 'var(--tab-active-hover-bg, rgba(225, 29, 72, 0.15))',
            borderColor: 'var(--tab-active-outline, rgba(225, 29, 72, 0.8))',
            transform: 'translateY(-1px)'
          },

          // Disabled state - clear visual feedback
          '&[dataDisabled]': {
            color: 'rgba(255, 255, 255, 0.35)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            cursor: 'not-allowed',
            opacity: 0.6,
            transform: 'none',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              transform: 'none'
            }
          }
        },
        tabsList: {
          borderColor: 'var(--tab-border, rgba(225, 29, 72, 0.2))',
          gap: rem(4)
        }
      }),
    },

    Badge: {
      styles: () => ({
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }),
    },

    Alert: {
      styles: () => ({
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: `1px solid rgba(255, 255, 255, 0.15)`,
          color: '#ffffff'
        },
        message: {
          color: '#ffffff'
        },
        title: {
          color: '#ffffff'
        }
      }),
    },

    Paper: {
      styles: () => ({
        root: {
          backgroundColor: '#0a0a0a',
          border: `1px solid rgba(225, 29, 72, 0.2)`,
          color: '#ffffff'
        }
      }),
    },

    Title: {
      styles: () => ({
        root: {
          color: '#ffffff'
        }
      }),
    },

    Text: {
      styles: (theme: MantineTheme) => ({
        root: {
          color: '#ffffff',
          // Improve dimmed text contrast for accessibility
          '&[dataDimmed]': {
            color: 'rgba(255, 255, 255, 0.75)', // 4.6:1 contrast ratio
          }
        }
      }),
    },

    Loader: {
      defaultProps: {
        color: 'red'
      }
    },

    Notification: {
      styles: () => ({
        root: {
          backgroundColor: '#0a0a0a',
          border: `1px solid rgba(225, 29, 72, 0.2)`,
          color: '#ffffff'
        },
        title: {
          color: '#ffffff'
        },
        description: {
          color: 'rgba(255, 255, 255, 0.75)' // 4.6:1 contrast - WCAG AA compliant
        }
      }),
    }
  },

  // Enhanced theme options with better organization
  other: {
    usogui: {
      red: '#e11d48',
      purple: '#7c3aed',
      black: '#0a0a0a',
      white: '#ffffff',
      // Entity accent colors — all unique, imported from entityColors.ts
      gamble:       ENTITY_COLORS.gamble,
      character:    ENTITY_COLORS.character,
      arc:          ENTITY_COLORS.arc,
      volume:       ENTITY_COLORS.volume,
      event:        ENTITY_COLORS.event,
      guide:        ENTITY_COLORS.guide,
      media:        ENTITY_COLORS.media,
      quote:        ENTITY_COLORS.quote,
      organization: ENTITY_COLORS.organization,
      chapter:      ENTITY_COLORS.chapter,
      annotation:   ENTITY_COLORS.annotation,
    },
    transitions: {
      durationShortest: 150,
      durationShort: 200,
      durationStandard: 250,
      durationEntering: 200,
      durationLeavingScreen: 150,
      easingStandard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easingDecelerate: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easingAccelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      easingSharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    layout: {
      headerHeight: 64,
      sidebarWidth: 280,
      contentMaxWidth: 1200,
      cardPadding: 24
    },
    effects: {
      backdropBlur: 'blur(10px)',
      cardHoverTransform: 'translateY(-2px)',
      borderRadiusLarge: '12px'
    }
  }
}

export const theme = createTheme(mantineTheme)

const entityAccentFallback = '#e11d48'

export type EntityAccentKey =
  | 'character'
  | 'organization'
  | 'arc'
  | 'volume'
  | 'chapter'
  | 'event'
  | 'guide'
  | 'media'
  | 'quote'
  | 'gamble'
  | 'annotation'

export const getEntityAccent = (type: EntityAccentKey, theme?: MantineTheme): string => {
  const palette = theme?.other?.usogui ?? mantineTheme.other?.usogui
  if (!palette) {
    return entityAccentFallback
  }

  switch (type) {
    case 'character':
      return palette.character
    case 'organization':
      return palette.organization
    case 'arc':
      return palette.arc
    case 'volume':
      return palette.volume
    case 'chapter':
      return palette.chapter
    case 'event':
      return palette.event
    case 'guide':
      return palette.guide
    case 'media':
      return palette.media
    case 'quote':
      return palette.quote
    case 'gamble':
      return palette.gamble
    case 'annotation':
      return palette.annotation
    default:
      return entityAccentFallback
  }
}

// Theme utility functions for consistent color usage
export const getThemeColor = (theme: MantineTheme, colorKey: string, shade: number = 5): string => {
  if (theme.colors[colorKey]) {
    return theme.colors[colorKey][shade]
  }
  return theme.other?.usogui?.[colorKey] || theme.colors.red[shade]
}

export const getEntityThemeColor = (theme: MantineTheme, entityType: EntityAccentKey): string => {
  const entityColors = theme.other?.usogui
  if (!entityColors) return theme.colors.red[5]

  switch (entityType) {
    case 'gamble': return entityColors.gamble
    case 'character': return entityColors.character
    case 'arc': return entityColors.arc
    case 'organization': return entityColors.organization
    case 'volume': return entityColors.volume
    case 'chapter': return entityColors.chapter
    case 'event': return entityColors.event
    case 'guide': return entityColors.guide
    case 'media': return entityColors.media
    case 'quote': return entityColors.quote
    case 'annotation': return entityColors.annotation
    default: return entityColors.red
  }
}

export const getAlphaColor = (color: string, alpha: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Enhanced color palette for better accessibility and consistency
export const semanticColors = {
  success: '#388e3c',
  warning: '#f57c00',
  error: '#d32f2f',
  info: '#1976d2',
  neutral: '#6b7280'
} as const
// Centralized outline utilities for consistent highlight system
export const outlineStyles = {
  // Base accent color for outlines
  accentColor: '#e11d48', // rgba(225, 29, 72, 1)
  
  // Opacity levels for different interaction states
  opacity: {
    hover: 0.4,     // Subtle hover indication
    focus: 0.6,     // Clear focus indication for accessibility
    active: 0.8,    // Strong active/selected state
    disabled: 0.2   // Muted disabled state
  },
  
  // Pre-computed outline colors for performance
  colors: {
    hover: 'rgba(225, 29, 72, 0.4)',
    focus: 'rgba(225, 29, 72, 0.6)', 
    active: 'rgba(225, 29, 72, 0.8)',
    disabled: 'rgba(225, 29, 72, 0.2)'
  },
  
  // Consistent transition timing
  transition: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Helper functions to generate consistent outline styles
  getOutlineStyle: (state: 'hover' | 'focus' | 'active' | 'disabled' = 'hover') => ({
    boxShadow: `inset 0 0 0 1px ${outlineStyles.colors[state]}`,
    transition: outlineStyles.transition
  }),
  
  getHoverFocusStyle: () => ({
    '&:hover': {
      boxShadow: `inset 0 0 0 1px ${outlineStyles.colors.hover}`,
      outline: 'none'
    },
    '&:focus': {
      boxShadow: `inset 0 0 0 1px ${outlineStyles.colors.hover}`,
      outline: 'none'
    },
    '&:focus-visible': {
      boxShadow: `inset 0 0 0 1px ${outlineStyles.colors.hover}`,
      outline: 'none'
    }
  }),
  
  getActiveStyle: () => ({
    boxShadow: `inset 0 0 0 1px ${outlineStyles.colors.active}`
  })
} as const
// Utility to set tab accent colors based on entity type
export const setTabAccentColors = (entityType: EntityAccentKey, element?: HTMLElement) => {
  const target = element || document.documentElement
  const accentColorMap: Record<EntityAccentKey, string> = {
    character: textColors.character,
    organization: textColors.organization,
    arc: textColors.arc,
    volume: textColors.volume,
    chapter: textColors.chapter,
    event: textColors.event,
    guide: textColors.guide,
    media: textColors.media,
    quote: textColors.quote,
    gamble: textColors.gamble,
    annotation: textColors.annotation
  }
  const accentColor = accentColorMap[entityType] ?? (mantineTheme.other?.usogui?.red ?? '#e11d48')
  
  // Convert hex to rgba values
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.substring(1, 3), 16)
    const g = parseInt(hex.substring(3, 5), 16)
    const b = parseInt(hex.substring(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  
  // Set CSS custom properties for tab styling
  const hoverBg = hexToRgba(accentColor, 0.08)
  const hoverOutline = hexToRgba(accentColor, 0.4)
  const focusOutline = hexToRgba(accentColor, 0.6)
  const activeBg = hexToRgba(accentColor, 0.12)
  const activeOutline = hexToRgba(accentColor, 0.8)
  const activeHoverBg = hexToRgba(accentColor, 0.15)
  const border = hexToRgba(accentColor, 0.2)
  
  target.style.setProperty('--tab-hover-bg', hoverBg)
  target.style.setProperty('--tab-hover-outline', hoverOutline)
  target.style.setProperty('--tab-focus-outline', focusOutline)
  target.style.setProperty('--tab-active-bg', activeBg)
  target.style.setProperty('--tab-active-outline', activeOutline)
  target.style.setProperty('--tab-active-hover-bg', activeHoverBg)
  target.style.setProperty('--tab-border', border)
}

// Consistent spacing and sizing utilities
export const spacing = {
  xs: rem(4),
  sm: rem(8),
  md: rem(16),
  lg: rem(24),
  xl: rem(32),
  xxl: rem(48),
  xxxl: rem(64)
} as const

export const fontSize = {
  xs: rem(12),
  sm: rem(14),
  md: rem(16),
  lg: rem(18),
  xl: rem(20),
  xxl: rem(24)
} as const

// WCAG AA compliant text colors (4.5:1 ratio minimum for normal text)
export const textColors = {
  // Primary text colors - tested against #0a0a0a background
  primary: '#ffffff',                    // 21:1 contrast ratio
  secondary: 'rgba(255, 255, 255, 0.85)', // 5.1:1 contrast ratio
  tertiary: 'rgba(255, 255, 255, 0.75)',  // 4.6:1 contrast ratio
  disabled: 'rgba(255, 255, 255, 0.5)',   // 3.1:1 contrast (acceptable for disabled)

  // Semantic text colors with WCAG AA compliance
  success: '#4caf50',    // 4.9:1 contrast ratio
  warning: '#ffb74d',    // 5.8:1 contrast ratio (improved from #ff9800)
  error: '#f48fb1',      // 4.7:1 contrast ratio (improved from #f44336)
  info: '#64b5f6',       // 5.1:1 contrast ratio (improved from #2196f3)

  // Entity-specific text colors — all unique, imported from entityColors.ts
  gamble:       ENTITY_COLORS.gamble,
  character:    ENTITY_COLORS.character,
  arc:          ENTITY_COLORS.arc,
  volume:       ENTITY_COLORS.volume,
  chapter:      ENTITY_COLORS.chapter,
  event:        ENTITY_COLORS.event,
  guide:        ENTITY_COLORS.guide,
  media:        ENTITY_COLORS.media,
  quote:        ENTITY_COLORS.quote,
  organization: ENTITY_COLORS.organization,
  annotation:   ENTITY_COLORS.annotation,
} as const

// Header color utilities for consistent styling
export const headerColors = {
  h1: '#ffffff',                    // Main page titles - pure white
  h2: 'rgba(255, 255, 255, 0.95)', // Section headers - near white
  h3: 'rgba(255, 255, 255, 0.9)',  // Subsection headers
  h4: 'rgba(255, 255, 255, 0.85)', // Card titles
  h5: 'rgba(255, 255, 255, 0.8)',  // Small headers
  h6: 'rgba(255, 255, 255, 0.75)'  // Minimal headers
} as const

// Mantine-compatible color prop values
export const mantineTextColors = {
  primary: undefined,        // Uses theme default (white)
  secondary: 'dimmed',       // Mantine's dimmed color
  accent: 'red.5',          // Theme red
  success: 'green.6',       // Good contrast green
  warning: 'orange.6',      // Good contrast orange
  error: 'red.6',           // Error red
  info: 'blue.6'            // Info blue
} as const

// Consistent background utilities for all pages and components
export const backgroundStyles = {
  // Main page background - dark grey for large containers
  page: (theme: MantineTheme) => theme.colors.dark?.[8] ?? '#1e1f22',

  // Large container backgrounds - dark grey (headers, main content areas)
  container: (theme: MantineTheme) => theme.colors.dark?.[7] ?? '#2b2d31',

  // Card/section backgrounds - black for cards and sections
  card: '#0a0a0a',

  // Hero section backgrounds - entity-specific with subtle gradients over dark grey
  hero: (theme: MantineTheme, entityColor: string) =>
    `linear-gradient(135deg, ${entityColor}15, ${entityColor}08), ${theme.colors.dark?.[7] ?? '#2b2d31'}`,

  // Hover modal/overlay backgrounds - black
  modal: '#0a0a0a',

  // Search input and form backgrounds
  input: 'rgba(255, 255, 255, 0.06)',

  // Loading and empty state backgrounds - dark grey
  neutral: (theme: MantineTheme) => theme.colors.dark?.[8] ?? '#1e1f22'
} as const

// Consistent border styles
export const borderStyles = {
  // Standard card borders
  card: (theme: MantineTheme) => `1px solid ${theme.colors.dark?.[4] ?? '#4e5058'}`,

  // Entity-specific borders for hero sections and accents
  entityBorder: (entityColor: string) => `1px solid ${entityColor}25`,

  // Hover/focus state borders
  hover: (entityColor: string) => `2px solid ${entityColor}`,

  // Input borders
  input: '1px solid rgba(255, 255, 255, 0.15)',
  inputFocus: (entityColor: string) => `1px solid ${entityColor}`
} as const

// Card styles generator for consistent appearance
export const getCardStyles = (theme: MantineTheme, entityColor?: string) => ({
  background: backgroundStyles.card,
  border: entityColor
    ? `1px solid ${getAlphaColor(entityColor, 0.4)}`
    : borderStyles.card(theme),
  borderRadius: theme.radius.lg,
  transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`,
  backdropFilter: theme.other?.effects?.backdropBlur || 'blur(10px)',
  '&:hover': {
    transform: theme.other?.effects?.cardHoverTransform || 'translateY(-2px)',
    boxShadow: theme.shadows.lg
  }
})

// Hero section styles generator
export const getHeroStyles = (theme: MantineTheme, entityColor: string) => ({
  background: backgroundStyles.hero(theme, entityColor),
  borderRadius: theme.radius.lg,
  border: borderStyles.entityBorder(entityColor),
  marginBottom: spacing.lg
})

// Playing card styles for consistent grid items
export const getPlayingCardStyles = (theme: MantineTheme, entityColor: string) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  textDecoration: 'none',
  backgroundColor: backgroundStyles.card,
  border: borderStyles.card(theme),
  width: '100%',
  height: '100%',
  borderRadius: theme.radius.lg,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
    borderColor: entityColor
  }
})
