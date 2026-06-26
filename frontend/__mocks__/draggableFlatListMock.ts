const React = require('react');
const { View } = require('react-native');
module.exports = {
  DraggableFlatList: (props) => {
    const data = props.data || [];
    const items = data.map((item, i) =>
      React.createElement(View, { key: item.id || i }, props.renderItem({ item, index: i, drag: jest.fn(), isActive: false }))
    );
    return React.createElement(View, null, items.length ? items : props.ListEmptyComponent);
  },
  ScaleDecorator: (props) => React.createElement(View, null, props.children),
};
