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
      main: '#1a1a1a',
      light: '#404040',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c9a84c',
      light: '#e2c97e',
      dark: '#a07c20',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
    error: { main: '#d32f2f' },
    warning: { main: '#f57c00' },
    success: { main: '#2e7d32' },
    luxury: {
      gold: '#c9a84c',
      darkGold: '#a07c20',
      cream: '#f8f4ef',
      charcoal: '#2c2c2c',
      midnight: '#0d0d0d',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontFamily: '"Playfair Display", serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Playfair Display", serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"Playfair Display", serif', fontWeight: 600 },
    h4: { fontFamily: '"Playfair Display", serif', fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
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
    '0 1px 3px rgba(0,0,0,0.06)',
    '0 2px 6px rgba(0,0,0,0.08)',
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
          '&:hover': { borderWidth: '1.5px', backgroundColor: 'rgba(0,0,0,0.04)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
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
            '&:hover fieldset': { borderColor: '#1a1a1a' },
            '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: 1.5 },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)' },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(0,0,0,0.08)' },
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
