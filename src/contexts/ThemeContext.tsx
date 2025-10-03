import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../theme/colors';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  colors: typeof Colors.light;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark mode

  // Determine the actual color scheme based on theme setting
  const colorScheme: ColorScheme = theme === 'system'
    ? (systemColorScheme || 'dark')
    : theme as ColorScheme;

  const colors = Colors[colorScheme];

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
