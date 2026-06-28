// 浅色主题
export const lightColors = {
  primary: '#F36F3C',
  primaryHover: '#E45F2F',
  primaryLight: '#FFF0E9',
  primaryGradient: ['#F36F3C', '#F9735F'] as const,

  secondary: '#7C5CFC',
  secondaryLight: '#F0EDFF',

  success: '#10A66E',
  successLight: '#ECFDF5',

  warning: '#D89400',
  warningLight: '#FFFBEB',

  danger: '#E84A5F',
  dangerLight: '#FEF2F2',

  gray: {
    50: '#F6F8FC',
    100: '#EEF2F8',
    200: '#DDE5F0',
    300: '#B9C6D8',
    400: '#9AA7B8',
    500: '#68758A',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F1724',
  },

  white: '#FFFFFF',
  black: '#000000',
};

// 深色主题
export const darkColors = {
  primary: '#FF8754',
  primaryHover: '#FF6B35',
  primaryLight: '#351F18',
  primaryGradient: ['#FF8754', '#FF6B7A'] as const,

  secondary: '#8B68F5',
  secondaryLight: '#211B3D',

  success: '#32D296',
  successLight: '#0D351F',

  warning: '#FBB329',
  warningLight: '#2D2006',

  danger: '#FF6B7A',
  dangerLight: '#461B20',

  gray: {
    50: '#08111F',
    100: '#0D1626',
    200: '#121D2F',
    300: '#172235',
    400: '#596579',
    500: '#8C98AA',
    600: '#D5DCE7',
    700: '#E5EAF2',
    800: '#F4F7FB',
    900: '#FFFFFF',
  },

  white: '#0D1626',
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
  '2xl': 24,
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

export const appDesign = {
  dark: {
    bg: '#08111F',
    bgElevated: '#0B1424',
    surface: '#0D1626',
    surfaceSoft: '#121D2F',
    surfaceHover: '#172235',
    border: '#243043',
    borderStrong: '#33425A',
    text: '#FFFFFF',
    textSecondary: '#D5DCE7',
    textMuted: '#8C98AA',
    textDisabled: '#596579',
    orange: '#FF8754',
    violet: '#8B68F5',
    success: '#32D296',
    warning: '#FBB329',
    danger: '#FF6B7A',
    scrim: 'rgba(0,0,0,0.48)',
  },
  light: {
    bg: '#F6F8FC',
    bgElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSoft: '#EEF2F8',
    surfaceHover: '#E6ECF5',
    border: '#DDE5F0',
    borderStrong: '#B9C6D8',
    text: '#0F1724',
    textSecondary: '#334155',
    textMuted: '#68758A',
    textDisabled: '#9AA7B8',
    orange: '#F36F3C',
    violet: '#7C5CFC',
    success: '#10A66E',
    warning: '#D89400',
    danger: '#E84A5F',
    scrim: 'rgba(15,23,36,0.36)',
  },
};
