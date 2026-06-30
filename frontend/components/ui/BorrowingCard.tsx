import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../../stores/themeStore';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import type { LifeBorrowing } from '../../types';

interface BorrowingCardProps {
  borrowing: LifeBorrowing;
  onPress?: () => void;
  onReturn?: () => void;
}

export function BorrowingCard({ borrowing, onPress, onReturn }: BorrowingCardProps) {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  const statusConfig = {
    borrowed: { label: '借出中', color: palette.warning, bgColor: palette.surfaceSoft, icon: 'arrow-right-bold-circle' },
    returned: { label: '已归还', color: palette.success, bgColor: palette.surfaceSoft, icon: 'check-circle' },
    overdue: { label: '已逾期', color: palette.danger, bgColor: palette.surfaceSoft, icon: 'alert-circle' },
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
      style={[styles.container, { backgroundColor: palette.surface, borderColor: palette.border }]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
          <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        {borrowing.status !== 'returned' && onReturn && (
          <TouchableOpacity
            style={[styles.returnBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
            onPress={onReturn}
          >
            <MaterialCommunityIcons name="check" size={16} color={palette.success} />
            <Text style={[styles.returnBtnText, { color: palette.success }]}>归还</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>借用记录</Text>
        <View style={styles.borrowerInfo}>
          <MaterialCommunityIcons name="account" size={18} color={palette.textMuted} />
          <Text style={[styles.borrowerName, { color: palette.text }]}>
            {borrowing.borrower_name}
          </Text>
        </View>

        {borrowing.item_name && (
          <View style={styles.itemInfo}>
            <MaterialCommunityIcons name="package-variant" size={18} color={palette.textMuted} />
            <Text style={[styles.itemName, { color: palette.textSecondary }]} numberOfLines={1}>
              {borrowing.item_name}
            </Text>
          </View>
        )}

        <View style={[styles.summaryGrid, { borderTopColor: palette.border, borderBottomColor: palette.border }]}>
          <View style={styles.summaryCell}>
            <Text style={[styles.dateLabel, { color: palette.textMuted }]}>借出日期</Text>
            <Text style={[styles.summaryValue, { color: palette.text }]}>
              {new Date(borrowing.borrow_date).toLocaleDateString('zh-CN')}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: palette.border }]} />
          <View style={styles.summaryCell}>
            <Text style={[styles.dateLabel, { color: palette.textMuted }]}>归还进度</Text>
            <Text style={[styles.summaryValue, { color: borrowing.status === 'overdue' ? palette.danger : palette.text }]}>
              {getDaysInfo()}
            </Text>
          </View>
        </View>

        {borrowing.notes && (
          <Text style={[styles.notes, { color: palette.textMuted }]} numberOfLines={2}>
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
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderWidth: 1,
    gap: 2,
  },
  returnBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  body: {},
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.xs,
  },
  borrowerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  borrowerName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
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
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  summaryCell: {
    flex: 1,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    marginHorizontal: spacing.md,
  },
  notes: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
});
