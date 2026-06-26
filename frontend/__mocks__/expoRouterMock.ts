const React = require('react');
const { View } = require('react-native');

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  dismiss: jest.fn(),
  navigate: jest.fn(),
};

const mockLocalSearchParams = {};
const mockNavigation = { setOptions: jest.fn() };

module.exports = {
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockLocalSearchParams,
  useNavigation: () => mockNavigation,
  useFocusEffect: (fn) => { fn(); return () => {}; },
  Link: ({ children, href }) => React.createElement(View, { 'data-href': href }, children),
  Slot: View,
  Tabs: { Screen: View, Tabs: View },
  Redirect: View,
  RedirectStub: View,
  useRouterStub: () => mockRouter,
};
