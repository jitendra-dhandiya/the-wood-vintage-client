import { createTheme, responsiveFontSizes } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    luxury: {
      gold: string;
      darkGold: string;
      cream: string;
      charcoal: string;
      midnight: string;
    };
  }
  interface PaletteOptions {
    luxury?: {
      gold?: string;
      darkGold?: string;
      cream?: string;
      charcoal?: string;
      midnight?: string;
    };
  }
}

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3B2314',
      light: '#5A3D2B',
      dark: '#24140A',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#A0693A',
      light: '#C9925C',
      dark: '#7E5029',
      contrastText: '#ffffff',
    },
    background: {
      default: '#FFFCF5',
      paper: '#ffffff',
    },
    text: {
      primary: '#3B2314',
      secondary: '#6B5646',
    },
    error: { main: '#B3261E' },
    warning: { main: '#f57c00' },
    success: { main: '#2e7d32' },
    luxury: {
      gold: '#A0693A',
      darkGold: '#7E5029',
      cream: '#F6EEDF',
      charcoal: '#4A2F1D',
      midnight: '#2A190E',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 600 },
    h4: { fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 600 },
    h5: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600 },
    h6: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600 },
    subtitle1: { fontWeight: 500, letterSpacing: '0.02em' },
    subtitle2: { fontWeight: 500 },
    body1: { lineHeight: 1.7, letterSpacing: '0.01em' },
    body2: { lineHeight: 1.6 },
    button: { fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const },
    overline: { letterSpacing: '0.15em', fontWeight: 600 },
  },
  shape: { borderRadius: 2 },
  shadows: [
    'none',
    '0 1px 3px rgba(59,35,20,0.10)',
    '0 2px 6px rgba(59,35,20,0.14)',
    '0 4px 12px rgba(0,0,0,0.10)',
    '0 6px 16px rgba(0,0,0,0.12)',
    '0 8px 24px rgba(0,0,0,0.14)',
    '0 12px 32px rgba(0,0,0,0.16)',
    '0 16px 48px rgba(0,0,0,0.18)',
    '0 20px 64px rgba(0,0,0,0.20)',
    '0 24px 80px rgba(0,0,0,0.22)',
    '0 28px 96px rgba(0,0,0,0.24)',
    '0 32px 112px rgba(0,0,0,0.26)',
    '0 36px 128px rgba(0,0,0,0.28)',
    '0 40px 144px rgba(0,0,0,0.30)',
    '0 44px 160px rgba(0,0,0,0.32)',
    '0 48px 176px rgba(0,0,0,0.34)',
    '0 52px 192px rgba(0,0,0,0.36)',
    '0 56px 208px rgba(0,0,0,0.38)',
    '0 60px 224px rgba(0,0,0,0.40)',
    '0 64px 240px rgba(0,0,0,0.42)',
    '0 68px 256px rgba(0,0,0,0.44)',
    '0 72px 272px rgba(0,0,0,0.46)',
    '0 76px 288px rgba(0,0,0,0.48)',
    '0 80px 304px rgba(0,0,0,0.50)',
    '0 84px 320px rgba(0,0,0,0.52)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 1,
          padding: '12px 28px',
          fontSize: '0.75rem',
          letterSpacing: '0.12em',
          fontWeight: 600,
          transition: 'all 0.3s ease',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transform: 'translateY(-1px)' },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px', backgroundColor: 'rgba(59,35,20,0.05)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 4, boxShadow: '0 2px 8px rgba(59,35,20,0.14)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.06em' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': { borderColor: '#3B2314' },
            '&.Mui-focused fieldset': { borderColor: '#3B2314', borderWidth: 1.5 },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none', borderBottom: '1px solid rgba(59,35,20,0.10)' },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(59,35,20,0.14)' },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { fontSize: '0.9rem' },
      },
    },
  },
});

const theme = responsiveFontSizes(baseTheme);
export default theme;
