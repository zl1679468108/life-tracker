const React = require('react');
const { View } = require('react-native');
const Reanimated = View;
Reanimated.default = Reanimated;
module.exports = Object.assign(Reanimated, {
  useReducedMotion: () => false,
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: (fn) => fn(),
  withTiming: (v) => v,
  withSpring: (v) => v,
  cancelAnimation: jest.fn,
  Extrapolation: { EXTEND: 'extend' },
  Block: View,
  Color: View,
  Children: View,
});
