import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useThemeColors';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import type { LifeItem } from '../../types';

interface ExpiryWarningProps {
  items: LifeItem[];
  onPressItem?: (item: LifeItem) => void;
}

export function ExpiryWarning({ items, onPressItem }: ExpiryWarningProps) {
  const colors = useColors();

  if (items.length === 0) return null;

  // 按剩余天数排序
  const sortedItems = [...items].sort((a, b) => {
    const daysA = getDaysUntilExpiry(a.expiry_date);
    const daysB = getDaysUntilExpiry(b.expiry_date);
    return daysA - daysB;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={20}
          color={colors.warning}
        />
        <Text style={[styles.title, { color: colors.gray[800] }]}>
          即将过期 ({items.length})
        </Text>
      </View>

      {sortedItems.slice(0, 5).map((item) => {
        const daysLeft = getDaysUntilExpiry(item.expiry_date);
        const isExpired = daysLeft < 0;
        const isUrgent = daysLeft <= 3 && !isExpired;

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemCard,
              { backgroundColor: colors.white },
              isExpired && { borderLeftColor: colors.danger, backgroundColor: colors.dangerLight },
              isUrgent && { borderLeftColor: colors.danger },
            ]}
            onPress={() => onPressItem?.(item)}
            activeOpacity={0.7}
          >
            <View style={styles.itemInfo}>
              <Text
                style={[
                  styles.itemName,
                  { color: colors.gray[800] },
                  isExpired && { color: colors.danger },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.expiryDate,
                  { color: colors.gray[500] },
                  isExpired && { color: colors.danger },
                ]}
              >
                {formatExpiryDate(item.expiry_date)}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                isExpired
                  ? { backgroundColor: colors.dangerLight }
                  : { backgroundColor: colors.warningLight },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isExpired
                    ? { color: colors.danger }
                    : { color: colors.warning },
                ]}
              >
                {isExpired ? `已过期${Math.abs(daysLeft)}天` : `剩余${daysLeft}天`}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getDaysUntilExpiry(expiryDate?: string): number {
  if (!expiryDate) return 999;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatExpiryDate(expiryDate?: string): string {
  if (!expiryDate) return '';
  const date = new Date(expiryDate);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
    marginLeft: spacing.xs,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: fontSize.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.lg,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
});
