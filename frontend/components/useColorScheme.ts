import { useColorScheme as useColorSchemeCore } from 'react-native';

export const useColorScheme = () => {
  const coreScheme = useColorSchemeCore();
  if (coreScheme === null || coreScheme === undefined) { return 'light'; } return coreScheme;
};
