'use client';
import { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import EmotionRegistry from './EmotionRegistry';
import theme from '../themes';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </EmotionRegistry>
  );
}
