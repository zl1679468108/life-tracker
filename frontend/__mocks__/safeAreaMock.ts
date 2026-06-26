const React = require('react');
const { View } = require('react-native');
module.exports = {
  SafeAreaProvider: (props) => React.createElement(View, null, props.children),
  SafeAreaConsumer: (props) => React.createElement(View, null, props.children({ inset: { top: 0, right: 0, bottom: 0, left: 0 } })),
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
};
