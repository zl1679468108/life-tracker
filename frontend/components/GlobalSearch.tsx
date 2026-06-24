import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Modal, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../constants/theme';
import { useColors } from '../stores/themeStore';
import { useItemStore } from '../stores/itemStore';
import { useTodoStore } from '../stores/todoStore';

interface GlobalSearchProps {
  visible: boolean;
  onClose: () => void;
}

export function GlobalSearch({ visible, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const colors = useColors();
  const { items } = useItemStore();
  const { todos } = useTodoStore();
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<{ type: 'item' | 'todo'; data: any }[]>([]);

  useEffect(() => {
    if (!searchText.trim()) {
      setResults([]);
      return;
    }

    const query = searchText.toLowerCase();
    const matchedItems = items
      .filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(item => ({ type: 'item' as const, data: item }));

    const matchedTodos = todos
      .filter(todo =>
        todo.title.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(todo => ({ type: 'todo' as const, data: todo }));

    setResults([...matchedItems, ...matchedTodos]);
  }, [searchText, items, todos]);

  const handleResultPress = (type: 'item' | 'todo', id: string) => {
    onClose();
    setSearchText('');
    if (type === 'item') {
      router.push(`/item/${id}`);
    } else {
      router.push(`/todo/${id}`);
    }
  };

  const handleClose = () => {
    setSearchText('');
    setResults([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.white }]}>
          {/* 搜索框 */}
          <View style={[styles.searchBox, { backgroundColor: colors.gray[50], borderColor: colors.gray[200], paddingVertical: Platform.OS === 'web' ? spacing.md : spacing.sm }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.gray[400]} />
            <TextInput
              style={[styles.searchInput, { color: colors.gray[800] }]}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="搜索物品或待办..."
              placeholderTextColor={colors.gray[400]}
              autoFocus
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>

          {/* 搜索结果 */}
          <ScrollView style={styles.resultsList} contentContainerStyle={styles.resultsContent}>
            {searchText.trim() && results.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="search-off" size={48} color={colors.gray[300]} />
                <Text style={[styles.emptyText, { color: colors.gray[400] }]}>未找到相关结果</Text>
              </View>
            ) : (
              results.map((result, index) => (
                <TouchableOpacity
                  key={`${result.type}-${result.data.id}-${index}`}
                  style={[styles.resultItem, { backgroundColor: colors.gray[50] }]}
                  onPress={() => handleResultPress(result.type, result.data.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.resultIcon,
                    { backgroundColor: result.type === 'item' ? colors.primary : colors.success }
                  ]}>
                    <MaterialCommunityIcons
                      name={result.type === 'item' ? 'package-variant' : 'check-circle-outline'}
                      size={20}
                      color={colors.white}
                    />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultTitle, { color: colors.gray[800] }]} numberOfLines={1}>
                      {result.type === 'item' ? result.data.name : result.data.title}
                    </Text>
                    {result.data.description && (
                      <Text style={[styles.resultDesc, { color: colors.gray[500] }]} numberOfLines={1}>
                        {result.data.description}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.resultBadge, { backgroundColor: result.type === 'item' ? colors.primaryLight : colors.successLight }]}>
                    <Text style={[styles.resultBadgeText, { color: result.type === 'item' ? colors.primary : colors.success }]}>
                      {result.type === 'item' ? '物品' : '待办'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* 关闭按钮 */}
          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.gray[100] }]} onPress={handleClose}>
            <Text style={[styles.closeBtnText, { color: colors.gray[600] }]}>关闭</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modal: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '80%',
    ...shadows.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.xl,
    marginLeft: spacing.md,
    paddingVertical: 0,
  },
  resultsList: {
    maxHeight: 400,
  },
  resultsContent: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    fontSize: fontSize.base,
    marginTop: spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  resultTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
  resultDesc: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  resultBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semiBold,
  },
  closeBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  closeBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
});
