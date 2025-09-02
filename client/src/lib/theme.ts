import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e11d48', // Usogui Red
      dark: '#be185d',
      light: '#f43f5e'
    },
    secondary: {
      main: '#7c3aed', // Bright Purple for accents
      dark: '#6d28d9',
      light: '#8b5cf6'
    },
    error: {
      main: '#e11d48', // Use Usogui red for errors too
    },
    warning: {
      main: '#e11d48',
    },
    background: {
      default: '#0a0a0a', // Usogui Black
      paper: '#0a0a0a' // Usogui Black for cards instead of semi-transparent white
    },
    text: {
      primary: '#ffffff', // Pure White
      secondary: 'rgba(255, 255, 255, 0.7)'
    }
  },
  typography: {
    fontFamily: '"Noto Sans", system-ui, sans-serif',
    h1: {
      fontFamily: '"OPTI Goudy Text", serif',
      fontWeight: 400,
      letterSpacing: '0.02em'
    },
    h2: {
      fontFamily: '"OPTI Goudy Text", serif',
      fontWeight: 400,
      letterSpacing: '0.02em'
    },
    h3: {
      fontFamily: '"OPTI Goudy Text", serif',
      fontWeight: 400,
      letterSpacing: '0.02em'
    },
    h4: {
      fontFamily: '"OPTI Goudy Text", serif',
      fontWeight: 400,
      letterSpacing: '0.02em'
    },
    h5: {
      fontFamily: '"OPTI Goudy Text", serif',
      fontWeight: 400,
      letterSpacing: '0.02em'
    },
    h6: {
      fontFamily: '"OPTI Goudy Text", serif',
      fontWeight: 400,
      letterSpacing: '0.02em'
    },
    body1: {
      fontFamily: '"Noto Sans", system-ui, sans-serif',
      fontWeight: 400
    },
    body2: {
      fontFamily: '"Noto Sans", system-ui, sans-serif',
      fontWeight: 400
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a0a0a',
          border: '1px solid rgba(225, 29, 72, 0.2)',
          borderRadius: 8,
          boxShadow: '0 10px 15px -3px rgba(225, 29, 72, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: '#e11d48',
            boxShadow: '0 20px 25px -5px rgba(225, 29, 72, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(-2px)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: '"Noto Sans", system-ui, sans-serif'
        },
        contained: {
          backgroundColor: '#e11d48',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#be185d'
          }
        },
        outlined: {
          borderColor: '#e11d48',
          color: '#e11d48',
          '&:hover': {
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            borderColor: '#e11d48'
          }
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent'
        }
      }
    }
  }
})