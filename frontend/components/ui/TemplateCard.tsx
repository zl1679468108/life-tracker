import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useThemeColors';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import type { LifeTemplate } from '../../types';

interface TemplateCardProps {
  template: LifeTemplate;
  onPress?: () => void;
  onUse?: () => void;
  onDelete?: () => void;
}

export function TemplateCard({ template, onPress, onUse, onDelete }: TemplateCardProps) {
  const colors = useColors();

  const iconColor = template.color || colors.primary;
  const iconName = template.icon || (template.template_type === 'item' ? 'package-variant' : 'checkbox-marked');

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.white }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.gray[800] }]} numberOfLines={1}>
            {template.name}
          </Text>
          {template.description ? (
            <Text style={[styles.description, { color: colors.gray[500] }]} numberOfLines={2}>
              {template.description}
            </Text>
          ) : null}
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.gray[100] }]}>
        <View style={styles.typeBadge}>
          <MaterialCommunityIcons
            name={template.template_type === 'item' ? 'package-variant' : 'checkbox-marked'}
            size={14}
            color={colors.secondary}
          />
          <Text style={[styles.typeText, { color: colors.secondary }]}>
            {template.template_type === 'item' ? '物品' : '待办'}
          </Text>
        </View>
        <View style={styles.usageBadge}>
          <MaterialCommunityIcons name="play-circle-outline" size={14} color={colors.gray[400]} />
          <Text style={[styles.usageText, { color: colors.gray[400] }]}>
            使用 {template.usage_count} 次
          </Text>
        </View>
        {onUse && (
          <TouchableOpacity
            style={[styles.useBtn, { backgroundColor: colors.primaryLight }]}
            onPress={onUse}
          >
            <MaterialCommunityIcons name="plus-circle" size={16} color={colors.primary} />
            <Text style={[styles.useBtnText, { color: colors.primary }]}>使用</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  description: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  usageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  usageText: {
    fontSize: fontSize.xs,
  },
  useBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  useBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
});
