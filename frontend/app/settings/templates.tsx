import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTemplateStore } from '../../stores/templateStore';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { TemplateCard, EmptyState, Skeleton } from '../../components/ui';
import { SwipeableRow } from '../../components/SwipeableRow';
import { showAlert } from '../../lib/alert';

type TabType = 'all' | 'item' | 'todo';

export default function TemplatesScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { templates, fetchTemplates, deleteTemplate } = useTemplateStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await fetchTemplates();
      setLoading(false);
    };
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTemplates(undefined, true);
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
          await fetchTemplates(undefined, true);
        },
      },
    ]);
  };

  const handleUse = (template: any) => {
    router.push({
      pathname: template.template_type === 'item' ? '/item/create' : '/todo/create',
      params: { templateId: template.id },
    });
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

        {loading ? (
          <View style={{ gap: spacing.md }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.skeletonCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <Skeleton width={40} height={40} borderRadius={borderRadius.md} />
                <View style={styles.skeletonContent}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
                </View>
              </View>
            ))}
          </View>
        ) : filteredTemplates.length === 0 ? (
          <EmptyState
            icon="file-document-outline"
            title="暂无模板"
            description="从物品或待办详情页点击「保存为模板」创建"
            actionLabel="添加物品"
            buttonVariant="secondary"
            onAction={() => router.push('/item/create')}
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
  filterTabs: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: 4,
    gap: spacing.xs,
    marginBottom: spacing.md,
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
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonContent: {
    flex: 1,
  },
});
