const React = require('react');
const { View } = require('react-native');
module.exports = {
  GestureHandlerRootView: (props) => React.createElement(View, null, props.children),
  Pressable: (props) => React.createElement(View, props, props.children),
  TouchableOpacity: View,
  TouchableWithoutFeedback: View,
  DrawerLayout: View,
};
