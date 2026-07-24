import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { colors as lightColors, darkColors, appDesign } from '../constants/theme';

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

/** appDesign 语义色板类型（浅/深结构一致） */
export type AppPalette = typeof appDesign.light;

/**
 * 统一获取当前主题下的 appDesign 语义色板。
 * 替代各页面重复的：
 * `colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light`
 */
export const usePalette = (): AppPalette => {
  const { isDark } = useTheme();
  return isDark ? appDesign.dark : appDesign.light;
};

/** 一次取 colors + palette + isDark，减少页面样板代码 */
export const useAppTheme = () => {
  const colors = useColors();
  const { isDark, themeMode, colorScheme } = useTheme();
  const palette = isDark ? appDesign.dark : appDesign.light;
  return { colors, palette, isDark, themeMode, colorScheme };
};
