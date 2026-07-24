import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserAvatar } from '../ui';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import type { AppPalette } from '../../stores/themeStore';

export type UserPickRowProps = {
  id: string;
  name: string;
  desc?: string;
  selected?: boolean;
  palette: AppPalette;
  onPress: () => void;
  pinned?: boolean;
  trailing?: React.ReactNode;
  /** 自定义左侧；默认头像 */
  leading?: React.ReactNode;
  showCheck?: boolean;
  testID?: string;
};

function UserPickRowInner({
  id,
  name,
  desc,
  selected = false,
  palette,
  onPress,
  pinned = false,
  trailing,
  leading,
  showCheck = true,
  testID,
}: UserPickRowProps) {
  return (
    <TouchableOpacity
      key={id}
      style={[styles.userRow, { borderColor: palette.border }, selected && { backgroundColor: palette.surfaceSoft }]}
      onPress={onPress}
      activeOpacity={0.82}
      testID={testID || `user-pick-row-${id}`}
      accessibilityLabel={`选择用户 ${name || '未知用户'}`}
      accessibilityRole="button"
    >
      {leading ?? <UserAvatar name={name} size={40} />}
      <View style={styles.userText}>
        <View style={styles.userNameRow}>
          <Text style={[styles.userName, { color: palette.text }]} numberOfLines={1}>
            {name || '未知用户'}
          </Text>
          {pinned && (
            <View style={[styles.pinnedBadge, { backgroundColor: `${palette.warning}16` }]}>
              <MaterialCommunityIcons name="star" size={12} color={palette.warning} />
              <Text style={[styles.pinnedBadgeText, { color: palette.warning }]}>置顶</Text>
            </View>
          )}
        </View>
        {!!desc && (
          <Text style={[styles.userDesc, { color: palette.textMuted }]} numberOfLines={1}>
            {desc}
          </Text>
        )}
      </View>
      {trailing}
      {showCheck && selected && (
        <MaterialCommunityIcons name="check-circle-outline" size={22} color={palette.orange} />
      )}
    </TouchableOpacity>
  );
}

export const UserPickRow = memo(UserPickRowInner);

const styles = StyleSheet.create({
  userRow: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  userText: {
    flex: 1,
    minWidth: 0,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  userDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 1,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
  },
  pinnedBadgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: fontWeight.bold,
  },
});
