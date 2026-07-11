import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Easing,
  ViewStyle,
} from 'react-native';
import { appDesign, borderRadius, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 面板样式覆盖（会与默认 sheet 样式合并） */
  sheetStyle?: ViewStyle;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * 底部弹出面板。
 * 背景遮罩 fade 渐显，面板从下往上 slide 滑出，两者独立动画。
 */
export function BottomSheet({ visible, onClose, children, sheetStyle }: BottomSheetProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  const [shouldRender, setShouldRender] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (shouldRender) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setShouldRender(false));
    }
  }, [visible]);

  if (!shouldRender) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: palette.scrim, opacity: fadeAnim },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              transform: [{ translateY }],
            },
            sheetStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    paddingBottom: 40,
    borderWidth: 1,
    maxHeight: '70%',
  },
});
