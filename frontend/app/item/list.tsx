import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, TextInput, RefreshControl, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useItemStore } from '../../stores/itemStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useLocationStore } from '../../stores/locationStore';
import { LifeItem } from '../../types';
import { appDesign, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { FAB, Chip, PageLoadable, CachedImage } from '../../components/ui';
import { SwipeableRow } from '../../components/SwipeableRow';
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

export default function ItemListScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { t } = useTranslation();
  const ALL_CATEGORY = 'ALL';

  const { items, loading, error: itemsError, fetchItems, deleteItem, clearError: clearItemsError } = useItemStore();
  const { categories: customCategories, fetchCategories } = useCategoryStore();
  const { locations: customLocations, fetchLocations } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'time' | 'name' | 'category'>('time');
  const [showSortModal, setShowSortModal] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const itemCategories = customCategories.filter((c) => c.type === 'item');
  const categoryFilters = [
    { id: ALL_CATEGORY, label: t('common.all') },
    ...itemCategories.map((category) => ({ id: category.id, label: category.name })),
  ];

  const allCategoriesForIcon = itemCategories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon || 'tag',
  }));

  useEffect(() => {
    fetchItems();
    fetchCategories('item');
    fetchLocations();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchItems(),
      fetchCategories('item', true),
      fetchLocations(true),
    ]);
    setRefreshing(false);
  }, [fetchItems, fetchCategories, fetchLocations]);

  const getCategoryIcon = (categoryId?: string): string => {
    if (!categoryId) return 'package-variant';
    const cat = allCategoriesForIcon.find((c) => c.id === categoryId);
    return cat?.icon || 'package-variant';
  };

  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId) return '未分类';
    const cat = allCategoriesForIcon.find((c) => c.id === categoryId);
    return cat?.name || '未分类';
  };

  const getLocationName = (locationId?: string): string => {
    if (!locationId) return '未设置位置';
    const loc = customLocations.find((l) => l.id === locationId);
    return loc?.name || '未设置位置';
  };

  const filtered = items.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      i.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory = selectedCategory === ALL_CATEGORY || i.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'category') return getCategoryName(a.category_id).localeCompare(getCategoryName(b.category_id), 'zh-CN');
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const countLabel = batchMode ? `已选 ${selectedIds.size} / ${filtered.length}` : `共 ${filtered.length} 件`;

  const handleDeleteItem = (item: LifeItem) => {
    showAlert('确认删除', `删除物品"${item.name}"？此操作不可撤销`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteItem(item.id) },
    ]);
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
        },
      },
    ]);
  };

  const renderItem = useCallback(({ item }: { item: LifeItem }) => {
    const icon = getCategoryIcon(item.category_id);
    const isSelected = selectedIds.has(item.id);
    const createdDate = new Date(item.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    return (
      <SwipeableRow onDelete={() => handleDeleteItem(item)}>
        <TouchableOpacity
          style={[
            styles.itemCard,
            { backgroundColor: palette.surface, borderColor: palette.border },
            batchMode && isSelected && { borderColor: palette.orange, borderWidth: 2 },
          ]}
          onPress={() => (batchMode ? toggleSelectItem(item.id) : router.push(`/item/${item.id}`))}
          activeOpacity={0.98}
        >
          {batchMode && (
            <View style={[styles.checkbox, { borderColor: palette.borderStrong }, isSelected && { backgroundColor: palette.orange, borderColor: palette.orange }]}>
              {isSelected && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
            </View>
          )}
          {item.images && item.images.length > 0 ? (
            <CachedImage uri={item.images[0]} size={52} borderRadius={14} />
          ) : (
            <View style={[styles.itemIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
              <MaterialCommunityIcons name={icon as any} size={24} color={palette.orange} />
            </View>
          )}
          <View style={styles.itemDetails}>
            <View style={styles.itemHead}>
              <Text style={[styles.itemName, { color: palette.text }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.itemDate, { color: palette.textMuted }]}>{createdDate}</Text>
            </View>
            {item.description && (
              <Text style={[styles.itemDesc, { color: palette.textMuted }]} numberOfLines={2}>{item.description}</Text>
            )}
            <View style={styles.itemTags}>
              {item.location_id && (
                <View style={[styles.tag, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                  <MaterialCommunityIcons name="map-marker-outline" size={12} color={palette.orange} />
                  <Text style={[styles.tagText, { color: palette.orange }]}>{getLocationName(item.location_id)}</Text>
                </View>
              )}
              {item.category_id && (
                <View style={[styles.tag, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                  <MaterialCommunityIcons name="tag-outline" size={12} color={palette.violet} />
                  <Text style={[styles.tagText, { color: palette.violet }]}>{getCategoryName(item.category_id)}</Text>
                </View>
              )}
              {typeof item.current_value === 'number' && (
                <View style={[styles.tag, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                  <MaterialCommunityIcons name="cash-multiple" size={12} color={palette.success} />
                  <Text style={[styles.tagText, { color: palette.success }]}>
                    {(item.currency || 'CNY') === 'CNY' ? `¥${item.current_value}` : `${item.current_value} ${item.currency}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} style={{ marginTop: 4 }} />
        </TouchableOpacity>
      </SwipeableRow>
    );
  }, [batchMode, selectedIds, palette, customCategories, customLocations, router]);

  const renderHeader = () => (
    <View>
      <View style={[styles.header, { backgroundColor: palette.bg }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>通用列表布局</Text>
            <Text style={[styles.title, { color: palette.text }]}>物品</Text>
          </View>
          <View style={styles.headerActions}>
            <Text style={[styles.count, { color: palette.textMuted }]}>{countLabel}</Text>
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]} onPress={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }} activeOpacity={0.7}>
              <MaterialCommunityIcons name={batchMode ? 'close' : 'checkbox-marked-outline'} size={18} color={palette.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }, searchActive && { borderColor: palette.orange }]}
              onPress={() => {
                setSearchActive((active) => {
                  const next = !active;
                  if (!next) setSearchQuery('');
                  setTimeout(() => {
                    if (next) searchInputRef.current?.focus();
                  }, 0);
                  return next;
                });
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="搜索物品"
            >
              <MaterialCommunityIcons name={searchActive ? 'close' : 'magnify'} size={18} color={searchActive ? palette.orange : palette.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]} onPress={() => setShowSortModal(true)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="sort" size={18} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        {searchActive && (
          <View style={[styles.searchBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }, isSearchFocused && { borderColor: palette.orange }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={isSearchFocused ? palette.orange : palette.textMuted} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: palette.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="搜索物品名称..."
              placeholderTextColor={palette.textMuted}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}>
                <MaterialCommunityIcons name="close-circle-outline" size={18} color={palette.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <View style={styles.chipsContainer}>
        {categoryFilters.map((cat) => (
          <Chip key={cat.id} label={cat.label} selected={selectedCategory === cat.id} onPress={() => setSelectedCategory(cat.id)} />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.bg }]}>
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <PageLoadable
          loading={loading}
          error={itemsError}
          empty={!loading && filtered.length === 0}
          emptyIcon="package-variant"
          emptyTitle="暂无物品"
          emptyMessage="点击下方按钮添加第一个物品"
          onEmptyAction={() => router.push('/item/create')}
          emptyActionLabel="添加物品"
          onRetry={fetchItems}
  
        >
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.list}
            removeClippedSubviews
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.orange]} tintColor={palette.orange} />}
          />
        </PageLoadable>
        {batchMode && (
          <View style={[styles.batchBar, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <TouchableOpacity onPress={() => {
              if (selectedIds.size === filtered.length) setSelectedIds(new Set());
              else setSelectedIds(new Set(filtered.map((i) => i.id)));
            }}>
              <Text style={[styles.batchBtnText, { color: palette.textSecondary }]}>全选</Text>
            </TouchableOpacity>
            <Text style={[styles.batchCount, { color: palette.orange }]}>{selectedIds.size}</Text>
            <Text style={[styles.batchLabel, { color: palette.textMuted }]}>已选择</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={[styles.batchDeleteBtn, { backgroundColor: palette.surfaceSoft }]} onPress={batchDelete}>
              <Text style={[styles.batchDeleteText, { color: palette.danger }]}>删除</Text>
            </TouchableOpacity>
          </View>
        )}
        {!batchMode && <FAB onPress={() => router.push('/item/create')} />}

        {showSortModal && (
          <TouchableOpacity style={[styles.sortOverlay, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={() => setShowSortModal(false)}>
            <TouchableOpacity activeOpacity={1} style={[styles.sortModal, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={(e) => e.stopPropagation()}>
              <View style={[styles.sortHandle, { backgroundColor: palette.borderStrong }]} />
              <Text style={[styles.sortTitle, { color: palette.text }]}>排序方式</Text>
              {([
                { key: 'time' as const, label: '添加时间', icon: 'clock-outline' },
                { key: 'name' as const, label: '名称', icon: 'sort-alphabetical-ascending' },
                { key: 'category' as const, label: '分类', icon: 'tag-outline' },
              ]).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sortOption, sortBy === opt.key && { backgroundColor: palette.surfaceSoft }]}
                  onPress={() => { setSortBy(opt.key); setShowSortModal(false); }}
                >
                  <MaterialCommunityIcons name={opt.icon as any} size={20} color={sortBy === opt.key ? palette.orange : palette.textMuted} />
                  <Text style={[styles.sortOptionText, { color: palette.text }, sortBy === opt.key && { color: palette.orange }]}>
                    {opt.label}
                  </Text>
                  {sortBy === opt.key && <MaterialCommunityIcons name="check" size={20} color={palette.orange} />}
                </TouchableOpacity>
              ))}
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
    marginBottom: 2,
  },
  title: {
    fontSize: fontSize['7xl'],
    fontWeight: fontWeight.bold,
  },
  count: {
    fontSize: fontSize.base,
  },
  searchBox: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
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
    minHeight: 84,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  itemIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  itemDate: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  itemDesc: {
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
  },
  itemTags: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 1,
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
    borderWidth: 1,
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
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sortModal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    borderWidth: 1,
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
