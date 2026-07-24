import React, { useEffect, useState } from 'react';
import { StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTemplateStore } from '../../stores/templateStore';
import { spacing } from '../../constants/theme';
import { usePalette } from '../../stores/themeStore';
import { TemplateCard, EmptyState, AppScreen, SegmentedTabs, ListSkeleton } from '../../components/ui';
import { SwipeableRow } from '../../components/SwipeableRow';
import { showAlert } from '../../lib/alert';

type TabType = 'all' | 'item' | 'todo';

export default function TemplatesScreen() {
  const router = useRouter();
  const palette = usePalette();
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
    <AppScreen
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.orange]} tintColor={palette.orange} />}
    >
        <SegmentedTabs
          tabs={tabs}
          value={activeTab}
          onChange={setActiveTab}
        />

        {loading ? (
          <ListSkeleton count={3} avatarSize={40} />
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
    </AppScreen>
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
});
