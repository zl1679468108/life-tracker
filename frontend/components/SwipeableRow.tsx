import React, { useRef } from 'react';
import { View, Animated, PanResponder, StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { useColors } from '../stores/themeStore';

const DELETE_WIDTH = 80;

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const isOpen = useRef(false);

  const animateTo = (toValue: number, speed: number = 25, bounciness: number = 5) => {
    return Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
      mass: 1,
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2;
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = lastOffset.current + gestureState.dx;
        const clamped = Math.max(-DELETE_WIDTH, Math.min(0, newValue));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, gestureState) => {
        const newValue = lastOffset.current + gestureState.dx;
        const velocity = gestureState.vx;
        let toValue = 0;

        if (isOpen.current) {
          if (velocity < -0.5 || newValue < -DELETE_WIDTH / 2) {
            toValue = -DELETE_WIDTH;
          } else {
            toValue = 0;
          }
        } else {
          if (velocity < -0.5 || newValue < -DELETE_WIDTH / 2) {
            toValue = -DELETE_WIDTH;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else {
            toValue = 0;
          }
        }

        isOpen.current = toValue !== 0;
        lastOffset.current = toValue;

        animateTo(toValue).start();
      },
      onPanResponderTerminate: () => {
        const toValue = isOpen.current ? -DELETE_WIDTH : 0;
        animateTo(toValue).start(() => {
          lastOffset.current = toValue;
        });
      },
    })
  ).current;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isOpen.current = false;
    lastOffset.current = 0;
    animateTo(0, 30, 8).start();
    onDelete();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.deleteBackground, { backgroundColor: colors.danger }]}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
          <MaterialCommunityIcons name="delete-outline" size={20} color={colors.white} />
          <Text style={styles.deleteText}>删除</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[
          styles.content,
          { backgroundColor: colors.white, transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  deleteText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: '#FFFFFF',
  },
  content: {
    borderRadius: borderRadius.lg,
  },
});
