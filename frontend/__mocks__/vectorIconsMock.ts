const React = require('react');
const { View } = require('react-native');
const MaterialCommunityIcons = (props) => React.createElement(View, { testID: `icon-${props.name}` });
module.exports = { MaterialCommunityIcons };
