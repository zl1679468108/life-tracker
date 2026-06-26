const { View } = require('react-native');
module.exports = {
  Screen: View,
  SharedElement: View,
  NavigationContainer: ({ children }) => View,
  disableScreens: jest.fn,
};
