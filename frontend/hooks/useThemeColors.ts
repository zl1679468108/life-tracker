import { useThemeStore, useTheme } from '../stores/themeStore';
import { lightColors, darkColors } from '../constants/theme';

/**
 * 获取当前主题颜色
 * 在组件中使用，会根据主题自动更新
 */
export const useColors = () => {
  const { isDark } = useTheme();
  return isDark ? darkColors : lightColors;
};

/**
 * 获取当前主题阴影（深色模式下减弱阴影）
 */
export const useShadows = () => {
  const { isDark } = useTheme();
  if (isDark) {
    return {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 2,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
      },
    };
  }
  return {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
  };
};
