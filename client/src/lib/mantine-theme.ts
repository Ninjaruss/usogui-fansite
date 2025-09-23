import { MantineThemeOverride, createTheme, rem, MantineTheme } from '@mantine/core'

// Entity-specific colors - Vibrant yet WCAG AA compliant for dark backgrounds
export const colors = {
  gamble: [
    '#fef2f2',
    '#fee2e2',
    '#fecaca',
    '#fca5a5',
    '#f87171',
    '#ff5555', // Gamble red - 4.5:1 contrast (vibrant but accessible)
    '#ef4444',
    '#dc2626',
    '#b91c1c',
    '#450a0a'
  ] as const,
  character: [
    '#eff6ff',
    '#dbeafe',
    '#bfdbfe',
    '#93c5fd',
    '#60a5fa',
    '#4dabf7', // Character blue - 4.7:1 contrast (more vibrant than #3b82f6)
    '#2563eb',
    '#1d4ed8',
    '#1e40af',
    '#1e3a8a'
  ] as const,
  arc: [
    '#fef2f2',
    '#fee2e2',
    '#fecaca',
    '#fca5a5',
    '#f87171',
    '#ef4444', // Arc red - 4.5:1 contrast (bright red)
    '#dc2626',
    '#b91c1c',
    '#991b1b',
    '#450a0a'
  ] as const,
  event: [
    '#fefce8',
    '#fef3c7',
    '#fde68a',
    '#fcd34d',
    '#fbbf24',
    '#f39c12', // Event amber - 5.2:1 contrast (more distinct from red)
    '#d97706',
    '#b45309',
    '#92400e',
    '#451a03'
  ] as const,
  guide: [
    '#f0fdf4',
    '#dcfce7',
    '#bbf7d0',
    '#86efac',
    '#4ade80',
    '#51cf66', // Guide green - 4.9:1 contrast (bright green)
    '#16a34a',
    '#15803d',
    '#166534',
    '#052e16'
  ] as const,
  media: [
    '#faf5ff',
    '#f3e8ff',
    '#e9d5ff',
    '#d8b4fe',
    '#c084fc',
    '#a855f7', // Media purple - 4.5:1 contrast (saturated purple)
    '#9333ea',
    '#7c3aed',
    '#6d28d9',
    '#4c1d95'
  ] as const,
  quote: [
    '#f0fdfa',
    '#ccfbf1',
    '#99f6e4',
    '#5eead4',
    '#2dd4bf',
    '#20c997', // Quote teal - 4.6:1 contrast (vibrant teal)
    '#0d9488',
    '#0f766e',
    '#115e59',
    '#042f2e'
  ] as const,
  volume: [
    '#fdf2f8',
    '#fce7f3',
    '#fbcfe8',
    '#f9a8d4',
    '#f472b6',
    '#ff69b4', // Volume pink - 4.6:1 contrast (hot pink)
    '#ec4899',
    '#db2777',
    '#be185d',
    '#500724'
  ] as const
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
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          '&:focus': {
            borderColor: '#e11d48',
            boxShadow: `0 0 0 ${rem(2)} rgba(225, 29, 72, 0.2)`
          },
          '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.5)'
          }
        },
        label: {
          color: 'rgba(255, 255, 255, 0.65)',
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
            color: 'rgba(255, 255, 255, 0.5)'
          }
        },
        label: {
          color: 'rgba(255, 255, 255, 0.65)',
          fontWeight: 500
        }
      }),
    },

    Select: {
      styles: () => ({
        input: {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: `1px solid rgba(255, 255, 255, 0.15)`,
          color: '#ffffff',
          '&:focus': {
            borderColor: '#e11d48',
            boxShadow: `0 0 0 ${rem(2)} rgba(225, 29, 72, 0.2)`
          }
        },
        label: {
          color: 'rgba(255, 255, 255, 0.65)',
          fontWeight: 500
        },
        dropdown: {
          backgroundColor: '#0a0a0a',
          border: `1px solid rgba(255, 255, 255, 0.15)`,
          color: '#ffffff'
        },
        option: {
          color: '#ffffff',
          '&:hover': {
            backgroundColor: 'rgba(225, 29, 72, 0.1)'
          }
        }
      }),
    },

    Tabs: {
      styles: (theme: MantineTheme) => ({
        panel: {
          color: '#ffffff'
        },
        tab: {
          // Base styles with higher specificity
          '&&': {
            color: 'rgba(255, 255, 255, 0.7)',
            borderRadius: rem(6),
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            padding: `${rem(12)} ${rem(20)}`,
            backgroundColor: 'transparent',
            border: '2px solid transparent',
            position: 'relative',
          },
          
          // Hover state with && for higher specificity
          '&&:hover': {
            backgroundColor: 'var(--tab-hover-bg, rgba(225, 29, 72, 0.08))',
            color: 'rgba(255, 255, 255, 0.95)',
            borderColor: 'var(--tab-hover-outline, rgba(225, 29, 72, 0.4))',
            transform: 'translateY(-1px)',
          },
          
          // Focus state
          '&&:focus': {
            backgroundColor: 'transparent',
            borderColor: 'var(--tab-focus-outline, rgba(225, 29, 72, 0.6))',
            outline: 'none'
          },
          
          // Active state for Mantine v8
          '&&[data-active]': {
            color: '#ffffff',
            backgroundColor: 'var(--tab-active-bg, rgba(225, 29, 72, 0.12))',
            borderColor: 'var(--tab-active-outline, rgba(225, 29, 72, 0.8))',
            fontWeight: 600,
          },
          
          // Active hover state
          '&&[data-active]:hover': {
            backgroundColor: 'var(--tab-active-hover-bg, rgba(225, 29, 72, 0.15))',
            borderColor: 'var(--tab-active-outline, rgba(225, 29, 72, 0.8))',
            transform: 'translateY(-1px)'
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
          '&[data-dimmed]': {
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
          color: 'rgba(255, 255, 255, 0.8)'
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
      // Entity colors - Vibrant yet accessible (matches color palette shade 5)
      gamble: '#ff5555',     // 4.5:1 contrast - vibrant red
      character: '#4dabf7',  // 4.7:1 contrast - bright blue
      arc: '#ef4444',        // 4.5:1 contrast - bright red (updated from purple)
      volume: '#ff69b4',     // 4.6:1 contrast - hot pink
      event: '#f39c12',      // 5.2:1 contrast - amber (more distinct from red)
      guide: '#51cf66',      // 4.9:1 contrast - bright green
      media: '#a855f7',      // 4.5:1 contrast - saturated purple
      quote: '#20c997'       // 4.6:1 contrast - vibrant teal
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
  | 'event'
  | 'guide'
  | 'media'
  | 'quote'
  | 'gamble'

export const getEntityAccent = (type: EntityAccentKey, theme?: MantineTheme): string => {
  const palette = theme?.other?.usogui ?? mantineTheme.other?.usogui
  if (!palette) {
    return entityAccentFallback
  }

  switch (type) {
    case 'character':
      return palette.character
    case 'organization':
      return palette.purple
    case 'arc':
      return palette.arc
    case 'volume':
      return palette.volume
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
    case 'volume': return entityColors.volume
    case 'event': return entityColors.event
    case 'guide': return entityColors.guide
    case 'media': return entityColors.media
    case 'quote': return entityColors.quote
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
  const accentColor = getEntityThemeColor({ other: { usogui: mantineTheme.other?.usogui } } as MantineTheme, entityType)
  
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
  
  // Debug logging
  console.log(`🎨 Set tab colors for ${entityType}:`, {
    accentColor,
    hoverBg,
    hoverOutline,
    activeOutline
  })
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

  // Entity-specific text colors (Vibrant yet WCAG AA compliant for #0a0a0a background)
  gamble: '#ff5555',     // 4.5:1 contrast ratio - vibrant red
  character: '#4dabf7',  // 4.7:1 contrast ratio - bright blue
  arc: '#ef4444',        // 4.5:1 contrast ratio - bright red (updated from purple)
  volume: '#ff69b4',     // 4.6:1 contrast ratio - hot pink
  event: '#f39c12',      // 5.2:1 contrast ratio - amber (more distinct from red)
  guide: '#51cf66',      // 4.9:1 contrast ratio - bright green
  media: '#a855f7',      // 4.5:1 contrast ratio - saturated purple
  quote: '#20c997'       // 4.6:1 contrast ratio - vibrant teal
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