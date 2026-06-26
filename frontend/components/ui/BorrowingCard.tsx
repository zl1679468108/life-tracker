import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useThemeColors';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import type { LifeBorrowing } from '../../types';

interface BorrowingCardProps {
  borrowing: LifeBorrowing;
  onPress?: () => void;
  onReturn?: () => void;
}

export function BorrowingCard({ borrowing, onPress, onReturn }: BorrowingCardProps) {
  const colors = useColors();

  const statusConfig = {
    borrowed: { label: '借出中', color: colors.warning, bgColor: colors.warningLight, icon: 'arrow-right-bold-circle' },
    returned: { label: '已归还', color: colors.success, bgColor: colors.successLight, icon: 'check-circle' },
    overdue: { label: '已逾期', color: colors.danger, bgColor: colors.dangerLight, icon: 'alert-circle' },
  };

  const status = statusConfig[borrowing.status];

  const getDaysInfo = () => {
    if (borrowing.status === 'returned') {
      if (borrowing.actual_return_date) {
        return `归还于 ${new Date(borrowing.actual_return_date).toLocaleDateString('zh-CN')}`;
      }
      return '已归还';
    }
    if (borrowing.expected_return_date) {
      const daysLeft = Math.ceil(
        (new Date(borrowing.expected_return_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft < 0) return `逾期 ${Math.abs(daysLeft)} 天`;
      if (daysLeft === 0) return '今天到期';
      return `剩余 ${daysLeft} 天`;
    }
    return '未设归还日期';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.white }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
          <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        {borrowing.status !== 'returned' && onReturn && (
          <TouchableOpacity
            style={[styles.returnBtn, { backgroundColor: colors.successLight }]}
            onPress={onReturn}
          >
            <MaterialCommunityIcons name="check" size={16} color={colors.success} />
            <Text style={[styles.returnBtnText, { color: colors.success }]}>归还</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.borrowerInfo}>
          <MaterialCommunityIcons name="account" size={18} color={colors.gray[500]} />
          <Text style={[styles.borrowerName, { color: colors.gray[800] }]}>
            {borrowing.borrower_name}
          </Text>
        </View>

        {borrowing.item_name && (
          <View style={styles.itemInfo}>
            <MaterialCommunityIcons name="package-variant" size={18} color={colors.gray[500]} />
            <Text style={[styles.itemName, { color: colors.gray[600] }]} numberOfLines={1}>
              {borrowing.item_name}
            </Text>
          </View>
        )}

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: colors.gray[400] }]}>借出</Text>
            <Text style={[styles.dateValue, { color: colors.gray[700] }]}>
              {new Date(borrowing.borrow_date).toLocaleDateString('zh-CN')}
            </Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: colors.gray[400] }]}>状态</Text>
            <Text style={[styles.dateValue, { color: borrowing.status === 'overdue' ? colors.danger : colors.gray[700] }]}>
              {getDaysInfo()}
            </Text>
          </View>
        </View>

        {borrowing.notes && (
          <Text style={[styles.notes, { color: colors.gray[500] }]} numberOfLines={2}>
            {borrowing.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.lg,
    gap: 4,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  returnBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  body: {},
  borrowerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  borrowerName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.base,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dateDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: spacing.md,
  },
  notes: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
