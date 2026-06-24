import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../stores/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, []);

  return <>{children}</>;
};
