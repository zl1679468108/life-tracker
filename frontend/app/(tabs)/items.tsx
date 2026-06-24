import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, RefreshControl, TextInput, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useItemStore } from '../../stores/itemStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useLocationStore } from '../../stores/locationStore';
import { LifeItem } from '../../types';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { FAB, EmptyState, Chip, Skeleton } from '../../components/ui';
import { SwipeableRow } from '../../components/SwipeableRow';
import { SafeScreen } from '../../components/SafeScreen';
import { showAlert } from '../../lib/alert';
import { useTranslation } from '../../lib/i18n';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ItemsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useTranslation();
  const ALL_CATEGORY = 'ALL';
  const categoryFilters = [
    { id: ALL_CATEGORY, label: t('common.all') },
    { id: 'electronics', label: '电子产品' },
    { id: 'books', label: '书籍' },
    { id: 'daily', label: '日用品' },
    { id: 'clothes', label: '衣物' },
    { id: 'other', label: '其他' }
  ];
  const { items, loading, fetchItems, deleteItem } = useItemStore();
  const { categories: customCategories, fetchCategories } = useCategoryStore();
  const { locations: customLocations, fetchLocations } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'time' | 'name' | 'category'>('time');
  const [showSortModal, setShowSortModal] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const allCategoriesForIcon = [
    ...customCategories.filter((c) => c.type === 'item').map((c) => ({ id: c.id, name: c.name, icon: c.icon || 'tag' })),
  ];

  useEffect(() => {
    fetchItems().then(() => {
      // 默认选中全部（如果这是用户的需求，即进入页面即全选）
      // setSelectedIds(new Set(items.map(i => i.id)));
    });
    fetchCategories('item');
    fetchLocations();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, [fetchItems]);

  const getCategoryIcon = (categoryId?: string): string => {
    if (!categoryId) return 'package-variant';
    const cat = allCategoriesForIcon.find((c) => c.id === categoryId);
    return cat?.icon || 'package-variant';
  };

  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId) return '';
    const cat = allCategoriesForIcon.find((c) => c.id === categoryId);
    return cat?.name || categoryId;
  };

  const getLocationName = (locationId?: string): string => {
    if (!locationId) return '';
    const loc = customLocations.find((l) => l.id === locationId);
    return loc?.name || locationId;
  };

  const filtered = items.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      i.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    // 如果选中“全部”，则匹配所有；否则按分类名称匹配（目前代码逻辑是按分类名，后续可优化为按 ID）
    const selectedFilter = categoryFilters.find(f => f.id === selectedCategory);
    const matchesCategory = selectedCategory === ALL_CATEGORY || getCategoryName(i.category_id) === selectedFilter?.label;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'category') return (a.category_id || '').localeCompare(b.category_id || '');
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleDeleteItem = (item: LifeItem) => {
    showAlert(
      '确认删除',
      `删除物品"${item.name}"？此操作不可撤销`,
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => deleteItem(item.id) },
      ]
    );
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const batchDelete = () => {
    if (selectedIds.size === 0) return;
    showAlert('确认删除', `删除 ${selectedIds.size} 件物品？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive', onPress: async () => {
          for (const id of selectedIds) await deleteItem(id);
          setSelectedIds(new Set());
          setBatchMode(false);
        }
      },
    ]);
  };

  const renderItem = useCallback(({ item }: { item: LifeItem }) => {
    const icon = getCategoryIcon(item.category_id);
    const isSelected = selectedIds.has(item.id);
    return (
      <SwipeableRow onDelete={() => handleDeleteItem(item)}>
        <TouchableOpacity
          style={[
            styles.itemCard,
            { backgroundColor: colors.white },
            batchMode && isSelected && { borderColor: colors.primary, borderWidth: 2 }
          ]}
          onPress={() => batchMode ? toggleSelectItem(item.id) : router.push(`/item/${item.id}`)}
          activeOpacity={0.98}
        >
          {batchMode && (
            <View style={[
              styles.checkbox,
              { borderColor: colors.gray[300] },
              isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}>
              {isSelected && <MaterialCommunityIcons name="check" size={14} color={colors.white} />}
            </View>
          )}
          <View style={[styles.itemIcon, { backgroundColor: colors.primaryLight }]}>
            <MaterialCommunityIcons name={icon as any} size={24} color={colors.primary} />
          </View>
          <View style={styles.itemDetails}>
            <Text style={[styles.itemName, { color: colors.gray[800] }]}>{item.name}</Text>
            {item.description && (
              <Text style={[styles.itemDesc, { color: colors.gray[500] }]} numberOfLines={2}>{item.description}</Text>
            )}
            <View style={styles.itemTags}>
              {item.location_id && (
                <View style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
                  <MaterialCommunityIcons name="map-marker" size={12} color={colors.primary} />
                  <Text style={[styles.tagText, { color: colors.primary }]}>{getLocationName(item.location_id)}</Text>
                </View>
              )}
              {item.category_id && (
                <View style={[styles.tag, { backgroundColor: colors.secondaryLight }]}>
                  <MaterialCommunityIcons name="tag" size={12} color={colors.secondary} />
                  <Text style={[styles.tagText, { color: colors.secondary }]}>{getCategoryName(item.category_id)}</Text>
                </View>
              )}
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[300]} style={{ marginTop: 4 }} />
        </TouchableOpacity>
      </SwipeableRow>
    );
  }, [batchMode, selectedIds, colors, customCategories, customLocations]);

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.gray[900] }]}>物品</Text>
          <View style={styles.headerActions}>
            <Text style={[styles.count, { color: colors.gray[500] }]}>共 {items.length} 件</Text>
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.gray[100] }]} onPress={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }} activeOpacity={0.7}>
              <MaterialCommunityIcons name={batchMode ? 'close' : 'checkbox-marked-outline'} size={18} color={colors.gray[600]} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.gray[100] }]} onPress={() => setShowSortModal(true)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="sort" size={18} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[
          styles.searchBox,
          { backgroundColor: colors.gray[100] },
          isSearchFocused && { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary }
        ]}>
          <MaterialCommunityIcons name="magnify" size={20} color={isSearchFocused ? colors.primary : colors.gray[400]} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.gray[800] }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜索物品名称..."
            placeholderTextColor={colors.gray[400]}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.chipsContainer}>
        {categoryFilters.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.label}
            selected={selectedCategory === cat.id}
            onPress={() => setSelectedCategory(cat.id)}
          />
        ))}
      </View>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonList}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.white }]}>
          <Skeleton width={52} height={52} borderRadius={14} />
          <View style={styles.skeletonContent}>
            <Skeleton width="60%" height={15} />
            <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
            <View style={styles.skeletonTags}>
              <Skeleton width={60} height={20} borderRadius={6} />
              <Skeleton width={70} height={20} borderRadius={6} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
        {loading ? (
          renderSkeleton()
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.list}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="package-variant"
                title="暂无物品"
                description="点击下方按钮添加第一个物品"
                actionLabel="添加物品"
                onAction={() => router.push('/item/create')}
              />
            }
          />
        )}
        {batchMode && (
          <View style={[styles.batchBar, { backgroundColor: colors.white }]}>
            <TouchableOpacity onPress={() => {
              if (selectedIds.size === filtered.length) setSelectedIds(new Set());
              else setSelectedIds(new Set(filtered.map((i) => i.id)));
            }}>
              <Text style={[styles.batchBtnText, { color: colors.gray[700] }]}>全选</Text>
            </TouchableOpacity>
            <Text style={[styles.batchCount, { color: colors.primary }]}>{selectedIds.size}</Text>
            <Text style={[styles.batchLabel, { color: colors.gray[500] }]}>已选择</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={[styles.batchDeleteBtn, { backgroundColor: colors.dangerLight }]} onPress={batchDelete}>
              <Text style={[styles.batchDeleteText, { color: colors.danger }]}>删除</Text>
            </TouchableOpacity>
          </View>
        )}
        {!batchMode && <FAB onPress={() => router.push('/item/create')} />}
      </View>

      {showSortModal && (
        <TouchableOpacity style={styles.sortOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.sortModal, { backgroundColor: colors.white }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sortHandle, { backgroundColor: colors.gray[200] }]} />
            <Text style={[styles.sortTitle, { color: colors.gray[900] }]}>排序方式</Text>
            {([
              { key: 'time' as const, label: '添加时间', icon: 'clock-outline' },
              { key: 'name' as const, label: '名称', icon: 'sort-alphabetical-ascending' },
              { key: 'category' as const, label: '分类', icon: 'tag-outline' },
            ]).map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.sortOption,
                  sortBy === opt.key && { backgroundColor: colors.primaryLight }
                ]}
                onPress={() => { setSortBy(opt.key); setShowSortModal(false); }}
              >
                <MaterialCommunityIcons name={opt.icon as any} size={20} color={sortBy === opt.key ? colors.primary : colors.gray[400]} />
                <Text style={[
                  styles.sortOptionText,
                  { color: colors.gray[800] },
                  sortBy === opt.key && { color: colors.primary }
                ]}>{opt.label}</Text>
                {sortBy === opt.key && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['7xl'],
    fontWeight: fontWeight.bold,
  },
  count: {
    fontSize: fontSize.base,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.lg,
    padding: 0,
  },
  chipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  list: {
    paddingBottom: 120,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  itemIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
  },
  itemTags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  skeletonList: {
    padding: spacing.lg,
  },
  skeletonCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  skeletonTags: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  batchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  batchBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  batchCount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  batchLabel: {
    fontSize: fontSize.base,
  },
  batchDeleteBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  batchDeleteText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  sortOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sortModal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    paddingBottom: 40,
  },
  sortHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  sortTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.xl,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  sortOptionText: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
});
