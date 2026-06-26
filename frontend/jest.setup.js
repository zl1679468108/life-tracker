jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Simple string mocks
jest.mock('expo-linear-gradient', () => 'LinearGradient');
jest.mock('expo-image', () => 'ExpoImage');
jest.mock('expo-constants', () => ({ default: { platformToken: 'ios' } }));
jest.mock('expo-font', () => ({ isLoaded: () => true, loadAsync: jest.fn() }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn() }));
jest.mock('expo-status-bar', () => 'StatusBar');
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn() }));
jest.mock('expo-clipboard', () => ({ Clipboard: { setString: jest.fn() } }));
jest.mock('expo-device', () => ({ deviceName: 'test-device', platformId: 'IOS' }));
jest.mock('expo-linking', () => ({ createURL: (url) => url }));
jest.mock('expo-router/entry', () => undefined);
