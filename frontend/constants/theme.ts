// 浅色主题
export const lightColors = {
  primary: '#FF6B35',
  primaryHover: '#E55A2B',
  primaryLight: '#FFF4ED',
  primaryGradient: ['#FF6B35', '#FF8F5E'] as const,

  secondary: '#7C5CFC',
  secondaryLight: '#F3F0FF',

  success: '#10B981',
  successLight: '#ECFDF5',

  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  danger: '#EF4444',
  dangerLight: '#FEF2F2',

  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  white: '#FFFFFF',
  black: '#000000',
};

// 深色主题
export const darkColors = {
  primary: '#FF8F5E',
  primaryHover: '#FF6B35',
  primaryLight: '#2D1B14',
  primaryGradient: ['#FF8F5E', '#FF6B35'] as const,

  secondary: '#9B7FFC',
  secondaryLight: '#1F1A3A',

  success: '#34D399',
  successLight: '#0D2818',

  warning: '#FBBF24',
  warningLight: '#2D2006',

  danger: '#F87171',
  dangerLight: '#2D1414',

  gray: {
    50: '#111827',
    100: '#1F2937',
    200: '#374151',
    300: '#4B5563',
    400: '#6B7280',
    500: '#9CA3AF',
    600: '#D1D5DB',
    700: '#E5E7EB',
    800: '#F3F4F6',
    900: '#F9FAFB',
  },

  white: '#000000',
  black: '#FFFFFF',
};

// 默认导出浅色主题（保持向后兼容）
export const colors = lightColors;

export const layout = {
  statusBar: 54,
  tabBar: 83,
  headerHeight: 56,
  screenWidth: 375,
  screenHeight: 812,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 11,
  md: 12,
  base: 13,
  lg: 14,
  xl: 15,
  '2xl': 16,
  '3xl': 17,
  '4xl': 18,
  '5xl': 20,
  '6xl': 22,
  '7xl': 24,
  '8xl': 28,
};

export const fontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const shadows = {
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

export const animation = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
};

// 默认图标
export const defaultCategoryIcon = 'tag';
export const defaultLocationIcon = 'map-marker';
