import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { darkTheme, lightTheme, Theme, ThemeMode } from '../theme/theme';

const THEME_STORAGE_KEY = '@estetica_theme_mode';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark'); // Default to dark as per requirements
  const [isReady, setIsReady] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode === 'light' || savedMode === 'dark') {
          setMode(savedMode);
        } else {
          // Fall back to system preference if no saved preference
          const systemScheme: ColorSchemeName = Appearance.getColorScheme();
          setMode(systemScheme === 'light' ? 'light' : 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadTheme();
  }, []);

  // Listen to system theme changes (optional, respects user override)
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only auto-switch if user hasn't explicitly set a preference
      AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedMode) => {
        if (!savedMode && colorScheme) {
          setMode(colorScheme === 'light' ? 'light' : 'dark');
        }
      });
    });

    return () => subscription.remove();
  }, []);

  const setThemeMode = async (newMode: ThemeMode) => {
    try {
      setMode(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleTheme = () => {
    setThemeMode(mode === 'light' ? 'dark' : 'light');
  };

  const theme = mode === 'light' ? lightTheme : darkTheme;
  const isDark = mode === 'dark';

  const value = useMemo(
    () => ({ theme, mode, isDark, toggleTheme, setThemeMode }),
    [theme, mode, isDark]
  );

  if (!isReady) {
    return null; // Or a splash screen
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
