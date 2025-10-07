import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  colors: typeof Colors.light;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = '@checommunicator:preferred-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedTheme) => {
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemeState(storedTheme);
        }
      })
      .catch((error) => {
        console.error('Failed to load theme preference', error);
      });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, theme).catch((error) => {
      console.error('Failed to persist theme preference', error);
    });
  }, [theme]);

  // Determine the actual color scheme based on theme setting
  const colorScheme: ColorScheme = useMemo(() => {
    if (theme === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return theme;
  }, [systemColorScheme, theme]);

  const colors = Colors[colorScheme];

  const setTheme = useCallback((value: Theme) => {
    setThemeState(value);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => {
      const nextTheme: Theme = prevTheme === 'dark' ? 'light' : 'dark';
      return nextTheme;
    });
  }, []);

  const value = useMemo<ThemeContextType>(() => ({
    theme,
    colorScheme,
    colors,
    isDarkMode: colorScheme === 'dark',
    setTheme,
    toggleTheme,
  }), [theme, colorScheme, colors, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
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
