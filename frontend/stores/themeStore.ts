import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { colors as lightColors, darkColors } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = 'theme_mode';

export const useThemeStore = create<ThemeState>((set) => ({
  themeMode: 'system',
  
  setThemeMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      set({ themeMode: mode });
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  },
  
  initTheme: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
        set({ themeMode: savedMode as ThemeMode });
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
    }
  },
}));

// Hook to get the actual theme (resolving 'system' to 'light' or 'dark')
// Uses selector to only subscribe to themeMode changes
export const useTheme = () => {
  const themeMode = useThemeStore((s) => s.themeMode);
  const systemColorScheme = useRNColorScheme();
  
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  
  return {
    isDark,
    themeMode,
    colorScheme: isDark ? 'dark' : 'light',
  };
};

// Hook to get current colors. Uses selector on isDark to stabilize color object reference.
// Only returns a new object when theme actually changes, avoiding unnecessary re-renders
// for the 50+ components that call useColors().
export const useColors = () => {
  const themeMode = useThemeStore((s) => s.themeMode);
  const systemColorScheme = useRNColorScheme();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  return isDark ? darkColors : lightColors;
};
