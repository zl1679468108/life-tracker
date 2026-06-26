import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTemplateStore } from '../../stores/templateStore';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../hooks/useThemeColors';
import { TemplateCard, EmptyState, Button } from '../../components/ui';
import { showAlert } from '../../lib/alert';

type TabType = 'all' | 'item' | 'todo';

export default function TemplatesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { templates, fetchTemplates, deleteTemplate, useTemplate, loading } = useTemplateStore();
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
    <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
      <View style={[styles.tabBar, { backgroundColor: colors.white }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.gray[500] },
                activeTab === tab.key && { color: colors.primary, fontWeight: fontWeight.semiBold },
              ]}
            >
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ backgroundColor: colors.gray[50] }}
        contentContainerStyle={[styles.content, { backgroundColor: colors.gray[50] }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {filteredTemplates.length === 0 ? (
          <EmptyState
            icon="file-document-outline"
            title="暂无模板"
            description="从物品或待办详情页点击「保存为模板」创建"
          />
        ) : (
          filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={() => handleUse(template)}
              onDelete={() => handleDelete(template.id)}
            />
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabText: {
    fontSize: fontSize.base,
  },
  content: {
    padding: spacing.lg,
  },
});
