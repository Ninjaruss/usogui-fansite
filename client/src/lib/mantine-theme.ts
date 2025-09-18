import { MantineThemeOverride, createTheme } from '@mantine/core'

// Custom Usogui colors for Mantine (as MantineColorsTuple)
const usogui = {
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
  ] as const,
  // Entity-specific colors
  gamble: [
    '#fef2f2',
    '#fee2e2',
    '#fecaca',
    '#fca5a5',
    '#f87171',
    '#d32f2f', // Gamble red
    '#b91c1c',
    '#991b1b',
    '#7f1d1d',
    '#450a0a'
  ] as const,
  character: [
    '#eff6ff',
    '#dbeafe',
    '#bfdbfe',
    '#93c5fd',
    '#60a5fa',
    '#1976d2', // Character blue
    '#1e40af',
    '#1e3a8a',
    '#1e3a8a',
    '#172554'
  ] as const,
  arc: [
    '#fdf2f8',
    '#fce7f3',
    '#fbcfe8',
    '#f9a8d4',
    '#f472b6',
    '#dc004e', // Arc pink
    '#be185d',
    '#9d174d',
    '#831843',
    '#500724'
  ] as const,
  event: [
    '#fff7ed',
    '#ffedd5',
    '#fed7aa',
    '#fdba74',
    '#fb923c',
    '#f57c00', // Event orange
    '#ea580c',
    '#c2410c',
    '#9a3412',
    '#7c2d12'
  ] as const,
  guide: [
    '#f0fdf4',
    '#dcfce7',
    '#bbf7d0',
    '#86efac',
    '#4ade80',
    '#388e3c', // Guide green
    '#16a34a',
    '#15803d',
    '#166534',
    '#14532d'
  ] as const,
  media: [
    '#faf5ff',
    '#f3e8ff',
    '#e9d5ff',
    '#d8b4fe',
    '#c084fc',
    '#7b1fa2', // Media purple
    '#7c3aed',
    '#6d28d9',
    '#5b21b6',
    '#4c1d95'
  ] as const,
  quote: [
    '#f0fdfa',
    '#ccfbf1',
    '#99f6e4',
    '#5eead4',
    '#2dd4bf',
    '#00796b', // Quote teal
    '#0d9488',
    '#0f766e',
    '#115e59',
    '#134e4a'
  ] as const
}

export const mantineTheme: MantineThemeOverride = {
  // Add custom colors
  colors: usogui,

  // Primary color
  primaryColor: 'red',

  // Typography
  fontFamily: '"Noto Sans", system-ui, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: {
    fontFamily: '"OPTI Goudy Text", serif',
    fontWeight: '400',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.2' },
      h2: { fontSize: '1.75rem', lineHeight: '1.25' },
      h3: { fontSize: '1.5rem', lineHeight: '1.3' },
      h4: { fontSize: '1.25rem', lineHeight: '1.35' },
      h5: { fontSize: '1.125rem', lineHeight: '1.4' },
      h6: { fontSize: '1rem', lineHeight: '1.5' }
    }
  },

  // Default radius
  defaultRadius: 'md',

  // Component styles
  components: {
    Card: {
      defaultProps: {
        shadow: 'lg',
        radius: 'md',
        withBorder: true
      },
      styles: () => ({
        root: {
          backgroundColor: '#0a0a0a',
          border: '1px solid rgba(225, 29, 72, 0.2)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: '#e11d48',
            boxShadow: '0 20px 25px -5px rgba(225, 29, 72, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(-2px)'
          }
        }
      })
    },

    Button: {
      defaultProps: {
        radius: 'sm'
      },
      styles: () => ({
        root: {
          fontWeight: 600,
          fontFamily: '"Noto Sans", system-ui, sans-serif',
          textTransform: 'none'
        }
      })
    },

    Container: {
      styles: () => ({
        root: {
          backgroundColor: 'transparent'
        }
      })
    },

    Modal: {
      styles: () => ({
        content: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          border: '1px solid rgba(225, 29, 72, 0.3)',
          backdropFilter: 'blur(10px)'
        }
      })
    },

    Menu: {
      styles: () => ({
        dropdown: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          border: '1px solid rgba(225, 29, 72, 0.3)',
          backdropFilter: 'blur(10px)',
          padding: '6px'
        },
        item: {
          color: '#ffffff',
          padding: '6px 10px',
          margin: '2px 0',
          borderRadius: '6px',
          transition: 'background-color 120ms ease, box-shadow 120ms ease',
          '&:hover': {
            backgroundColor: 'rgba(225, 29, 72, 0.14)',
            boxShadow: 'inset 0 0 0 1px rgba(225, 29, 72, 0.35)'
          },
          '&:active': {
            backgroundColor: 'rgba(225, 29, 72, 0.22)',
            boxShadow: 'inset 0 0 0 1px rgba(225, 29, 72, 0.45)'
          }
        }
      })
    },

    TextInput: {
      styles: () => ({
        input: {
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          border: '1px solid rgba(225, 29, 72, 0.3)',
          color: '#ffffff',
          '&:focus': {
            borderColor: '#e11d48'
          }
        },
        label: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      })
    },

    Badge: {
      styles: () => ({
        root: {
          textTransform: 'none'
        }
      })
    }
  },

  // Other theme options
  other: {
    // Custom Usogui brand values
    usogui: {
      red: '#e11d48',
      purple: '#7c3aed',
      black: '#0a0a0a',
      white: '#ffffff',
      gamble: '#d32f2f',
      character: '#1976d2',
      arc: '#dc004e',
      event: '#f57c00',
      guide: '#388e3c',
      media: '#7b1fa2',
      quote: '#00796b'
    }
  }
}

export const theme = createTheme(mantineTheme)
