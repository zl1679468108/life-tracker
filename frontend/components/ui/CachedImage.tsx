import React, { useState } from 'react';
import { View, StyleSheet, ImageStyle, ViewStyle, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';

interface CachedImageProps {
  uri?: string;
  style?: ImageStyle | ViewStyle;
  contentFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
  size?: number;
  borderRadius?: number;
  /** 加载中的占位图标 */
  loadingIcon?: string;
  /** 加载失败时的占位图标 */
  fallbackIcon?: string;
}

/**
 * 可缓存的图片组件，带 loading 动画和失败占位。
 * 使用 expo-image 做缓存管理。
 */
export function CachedImage({
  uri,
  style,
  contentFit = 'cover',
  size,
  borderRadius: br,
  loadingIcon = 'image',
  fallbackIcon = 'image-off',
}: CachedImageProps) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);

  // 修复了被冻结的 Blob URL（Web 端 picker 返回的 blob: URL 在会话刷新后会失效，但当前会话有效）
  if (!uri) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.gray[100], width: size, height: size }, style, br !== undefined && { borderRadius: br }]}>
        <MaterialCommunityIcons name={fallbackIcon as any} size={(size || 48) * 0.4} color={colors.gray[300]} />
      </View>
    );
  }

  if (failed) {
    return (
      <View style={[styles.placeholder, { backgroundColor: colors.gray[100], width: size, height: size }, style, br !== undefined && { borderRadius: br }]}>
        <MaterialCommunityIcons name={fallbackIcon as any} size={(size || 48) * 0.4} color={colors.gray[300]} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[{ width: size, height: size }, style] as any}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={200}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: borderRadius.md,
  },
});
