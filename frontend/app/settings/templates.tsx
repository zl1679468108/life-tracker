import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTemplateStore } from '../../stores/templateStore';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../hooks/useThemeColors';
import { TemplateCard, EmptyState } from '../../components/ui';
import { SwipeableRow } from '../../components/SwipeableRow';
import { showAlert } from '../../lib/alert';

type TabType = 'all' | 'item' | 'todo';

export default function TemplatesScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { templates, fetchTemplates, deleteTemplate, useTemplate } = useTemplateStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTemplates();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    showAlert('删除模板', '确认删除此模板？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteTemplate(id);
          await fetchTemplates();
        },
      },
    ]);
  };

  const handleUse = async (template: any) => {
    try {
      const newId = await useTemplate(template.id);
      // 跳转到创建的物品/待办详情页
      if (template.template_type === 'item') {
        router.push(`/item/${newId}`);
      } else {
        router.push(`/todo/${newId}`);
      }
    } catch (e) {
      // error handled in store
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (activeTab === 'all') return true;
    return t.template_type === activeTab;
  });

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: templates.length },
    { key: 'item', label: '物品', count: templates.filter((t) => t.template_type === 'item').length },
    { key: 'todo', label: '待办', count: templates.filter((t) => t.template_type === 'todo').length },
  ];

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <ScrollView
        style={{ backgroundColor: palette.bg }}
        contentContainerStyle={[styles.content, { backgroundColor: palette.bg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.orange]} tintColor={palette.orange} />}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: palette.text }]}>模板管理</Text>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}> 
              <Text style={[styles.summaryText, { color: palette.text }]} numberOfLines={1}>
                <Text style={styles.summaryValue}>{templates.length}</Text>
                <Text style={[styles.summaryLabel, { color: palette.textMuted }]}> 个模板</Text>
              </Text>
            </View>
          </View>
          <View style={[styles.filterTabs, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, activeTab === tab.key && { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.filterText, { color: palette.textMuted }, activeTab === tab.key && { color: palette.text }]}>
                  {tab.label}
                </Text>
                <Text style={[styles.filterCount, { color: activeTab === tab.key ? palette.orange : palette.textMuted }]}>
                  {tab.count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {filteredTemplates.length === 0 ? (
          <EmptyState
            icon="file-document-outline"
            title="暂无模板"
            description="从物品或待办详情页点击「保存为模板」创建"
            actionLabel="刷新模板"
            buttonVariant="secondary"
            onAction={onRefresh}
          />
        ) : (
          filteredTemplates.map((template) => (
            <SwipeableRow key={template.id} onDelete={() => handleDelete(template.id)}>
              <TemplateCard
                template={template}
                onUse={() => handleUse(template)}
              />
            </SwipeableRow>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
  },
  summaryBadge: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  summaryValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
  },
  filterTabs: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: 4,
    gap: spacing.xs,
  },
  filterTab: {
    flex: 1,
    minHeight: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.xs,
  },
  filterText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  filterCount: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
});
