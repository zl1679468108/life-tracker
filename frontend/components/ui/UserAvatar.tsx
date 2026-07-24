import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { fontWeight } from '../../constants/theme';
import { avatarColor, avatarInitial } from '../../lib/avatar';

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
}

/** 用户头像：有图显示图，否则显示哈希色首字 */
export function UserAvatar({ name, avatarUrl, size = 40 }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const ac = avatarColor(name);

  if (avatarUrl && !hasError) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${ac}18`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: size * 0.4,
          lineHeight: size * 0.48,
          fontWeight: fontWeight.bold,
          color: ac,
        }}
      >
        {avatarInitial(name)}
      </Text>
    </View>
  );
}
