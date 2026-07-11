import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { useItemStore } from '../../stores/itemStore';
import { useTodoStore } from '../../stores/todoStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useLocationStore } from '../../stores/locationStore';
import { exportData, exportToJSON, importFromJSON, previewImportData } from '../../lib/export';
import { showAlert } from '../../lib/alert';
import type { ImportResult } from '../../types';

export default function DataManagementScreen() {
  const colors = useColors();
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<any>(null);

  const items = useItemStore((s) => s.items);
  const todos = useTodoStore((s) => s.todos);
  const categories = useCategoryStore((s) => s.categories);
  const locations = useLocationStore((s) => s.locations);

  const handleExportJSON = async () => {
    try {
      await exportData('json');
      showAlert('成功', '数据已导出为 JSON 文件');
    } catch (e) {
      showAlert('失败', '导出失败，请重试');
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportData('csv');
      showAlert('成功', '数据已导出为 CSV 文件');
    } catch (e) {
      showAlert('失败', '导出失败，请重试');
    }
  };

  const handleImport = () => {
    if (Platform.OS === 'web') {
      // Web 端使用文件选择器
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const content = ev.target?.result as string;
          await processImport(content);
        };
        reader.readAsText(file);
      };
      input.click();
    } else {
      showAlert('提示', '导入功能目前仅支持 Web 端');
    }
  };

  const processImport = async (content: string) => {
    // 先预览
    const preview = await previewImportData(content);
    if (!preview) {
      showAlert('错误', '无效的备份文件格式');
      return;
    }

    showAlert(
      '确认导入',
      `备份内容：\n• 物品 ${preview.items_count} 个（新建 ${preview.new_items}，跳过 ${preview.duplicate_items}）\n• 待办 ${preview.todos_count} 个（新建 ${preview.new_todos}，跳过 ${preview.duplicate_todos}）\n• 分类 ${preview.categories_count} 个（新建 ${preview.new_categories}，复用 ${preview.duplicate_categories}）\n• 位置 ${preview.locations_count} 个（新建 ${preview.new_locations}，复用 ${preview.duplicate_locations}）\n\n关联重映射：\n• 物品分类 ${preview.remapped_item_categories} 处\n• 物品位置 ${preview.remapped_item_locations} 处\n• 待办分类 ${preview.remapped_todo_categories} 处\n\n导入会跳过重复数据，不会覆盖现有数据。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认导入',
          onPress: async () => {
            setImporting(true);
            setImportProgress('开始导入...');
            try {
              const result = await importFromJSON(content, (step) => {
                setImportProgress(step);
              });
              setImportResult(result);
              showAlert(
                '导入完成',
                `成功导入：\n• ${result.imported_items} 个物品\n• ${result.imported_todos} 个待办\n• ${result.imported_categories} 个分类\n• ${result.imported_locations} 个位置\n\n跳过重复：\n• ${result.skipped_items || 0} 个物品\n• ${result.skipped_todos || 0} 个待办\n• ${result.skipped_categories || 0} 个分类\n• ${result.skipped_locations || 0} 个位置\n\n${result.errors.length > 0 ? `失败 ${result.errors.length} 条` : '无失败记录'}`
              );
            } catch (e) {
              showAlert('失败', `导入失败: ${(e as Error).message}`);
            }
            setImporting(false);
            setImportProgress('');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.content}>
      {/* 数据统计 */}
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <Text style={[styles.cardTitle, { color: colors.gray[800] }]}>数据统计</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name="package-variant" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.gray[800] }]}>{items.length}</Text>
            <Text style={[styles.statLabel, { color: colors.gray[500] }]}>物品</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.successLight }]}>
            <MaterialCommunityIcons name="checkbox-marked" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.gray[800] }]}>{todos.length}</Text>
            <Text style={[styles.statLabel, { color: colors.gray[500] }]}>待办</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.secondaryLight }]}>
            <MaterialCommunityIcons name="tag" size={24} color={colors.secondary} />
            <Text style={[styles.statValue, { color: colors.gray[800] }]}>{categories.length}</Text>
            <Text style={[styles.statLabel, { color: colors.gray[500] }]}>分类</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.warningLight }]}>
            <MaterialCommunityIcons name="map-marker" size={24} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.gray[800] }]}>{locations.length}</Text>
            <Text style={[styles.statLabel, { color: colors.gray[500] }]}>位置</Text>
          </View>
        </View>
      </View>

      {/* 导出数据 */}
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <Text style={[styles.cardTitle, { color: colors.gray[800] }]}>导出数据</Text>
        <Text style={[styles.cardDesc, { color: colors.gray[500] }]}>
          将所有数据导出为备份文件，可用于迁移或恢复
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.primary }]}
            onPress={handleExportJSON}
          >
            <MaterialCommunityIcons name="code-json" size={20} color={colors.white} />
            <Text style={[styles.exportBtnText, { color: colors.white }]}>导出 JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.success }]}
            onPress={handleExportCSV}
          >
            <MaterialCommunityIcons name="file-delimited" size={20} color={colors.white} />
            <Text style={[styles.exportBtnText, { color: colors.white }]}>导出 CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 导入数据 */}
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <Text style={[styles.cardTitle, { color: colors.gray[800] }]}>导入数据</Text>
        <Text style={[styles.cardDesc, { color: colors.gray[500] }]}>
          从备份文件恢复数据，将创建新记录不会覆盖现有数据
        </Text>
        <TouchableOpacity
          style={[styles.importBtn, { backgroundColor: colors.secondaryLight }]}
          onPress={handleImport}
          disabled={importing}
        >
          <MaterialCommunityIcons name="upload" size={20} color={colors.secondary} />
          <Text style={[styles.importBtnText, { color: colors.secondary }]}>
            {importing ? importProgress : '从文件导入'}
          </Text>
        </TouchableOpacity>
        {importResult && importResult.errors.length > 0 && (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {importResult.errors.length} 条数据导入失败
            </Text>
          </View>
        )}
      </View>

      {/* 提示 */}
      <View style={[styles.card, { backgroundColor: colors.warningLight, borderLeftWidth: 3, borderLeftColor: colors.warning }]}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={[{ fontSize: fontSize.base, fontWeight: fontWeight.semiBold, color: colors.gray[800] }]}>
              注意事项
            </Text>
            <Text style={[{ fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.xs }]}>
              • 导入会创建新数据，不会覆盖已有数据{'\n'}
              • 分类和位置名称重复时会复用并重映射关联{'\n'}
              • 物品和待办重复时会跳过并写入导入报告{'\n'}
              • 建议定期导出备份以防数据丢失
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.sm,
  },
  cardDesc: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  exportBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  importBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  errorBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
  },
});
