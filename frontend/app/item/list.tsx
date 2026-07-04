import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, TextInput, RefreshControl, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useItemStore } from '../../stores/itemStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useLocationStore } from '../../stores/locationStore';
import { LifeItem } from '../../types';
import { appDesign, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { FAB, PageLoadable, CachedImage, EmptyState, Select } from '../../components/ui';
import { SwipeableRow } from '../../components/SwipeableRow';
import { showAlert } from '../../lib/alert';
import { useTranslation } from '../../lib/i18n';
import { useDebounce } from '../../lib/hooks';

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
const getDayDiff = (dateValue?: string) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((startOfDay(date) - startOfDay(new Date())) / DAY_MS);
};

interface ItemListHeaderProps {
  palette: any;
  countLabel: string;
  batchMode: boolean;
  searchActive: boolean;
  searchQuery: string;
  isSearchFocused: boolean;
  categoryFilters: { value: string; label: string }[];
  selectedCategory: string;
  locationFilters: { value: string; label: string }[];
  selectedLocation: string;
  statusFilters: { value: string; label: string }[];
  selectedStatus: string;
  activeFilterCount: number;
  allCategory: string;
  onToggleBatch: () => void;
  onToggleSearch: () => void;
  onSearchQueryChange: (text: string) => void;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
  onSortOpen: () => void;
  onFocusChange: (focused: boolean) => void;
  onSearchClear: () => void;
}

const ItemListHeader = React.forwardRef<TextInput, ItemListHeaderProps>(function ItemListHeader({
  palette, countLabel, batchMode, searchActive, searchQuery, isSearchFocused,
  categoryFilters, selectedCategory, locationFilters, selectedLocation,
  statusFilters, selectedStatus, activeFilterCount, allCategory,
  onToggleBatch, onToggleSearch, onSearchQueryChange,
  onCategoryChange, onLocationChange, onStatusChange,
  onClearFilters, onSortOpen, onFocusChange, onSearchClear,
}, ref) {
  return (
    <View style={{ backgroundColor: palette.bg }}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarActions}>
          <Text style={[styles.toolbarCount, { color: palette.textMuted }]}>{countLabel}</Text>
          <TouchableOpacity
            style={[styles.iconBtn, batchMode && { backgroundColor: `${palette.orange}14` }]}
            onPress={onToggleBatch}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={batchMode ? 'close' : 'checkbox-marked-outline'} size={20} color={batchMode ? palette.orange : palette.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, searchActive && { backgroundColor: `${palette.orange}14` }]}
            onPress={onToggleSearch}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={searchActive ? 'close' : 'magnify'} size={20} color={searchActive ? palette.orange : palette.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onSortOpen} activeOpacity={0.7}>
            <MaterialCommunityIcons name="sort-variant" size={20} color={palette.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {searchActive && (
        <View style={[styles.searchBox, { backgroundColor: palette.surface, borderColor: palette.border }, isSearchFocused && { borderColor: palette.orange }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={isSearchFocused ? palette.orange : palette.textMuted} />
          <TextInput
            ref={ref}
            style={[styles.searchInput, { color: palette.text }]}
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            placeholder="搜索物品..."
            placeholderTextColor={palette.textMuted}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={onSearchClear}>
              <MaterialCommunityIcons name="close-circle-outline" size={18} color={palette.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.filterBar}>
        <Select
          label="分类"
          value={selectedCategory}
          options={categoryFilters}
          defaultValue={allCategory}
          onChange={onCategoryChange}
          style={styles.filterSelect}
        />
        <Select
          label="位置"
          value={selectedLocation}
          options={locationFilters}
          defaultValue="ALL"
          onChange={onLocationChange}
          style={styles.filterSelect}
        />
        <Select
          label="状态"
          value={selectedStatus}
          options={statusFilters}
          defaultValue="all"
          onChange={(v) => onStatusChange(v)}
          style={styles.filterSelect}
        />
      </View>
      {activeFilterCount > 0 && (
        <View style={styles.filterSummary}>
          <Text style={[styles.filterSummaryText, { color: palette.textMuted }]}>已启用 {activeFilterCount} 个筛选</Text>
          <TouchableOpacity onPress={onClearFilters} activeOpacity={0.75}>
            <Text style={[styles.clearFilterText, { color: palette.orange }]}>清除</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default function ItemListScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { t } = useTranslation();
  const ALL_CATEGORY = 'ALL';

  const { items, loading, error: itemsError, fetchItems, deleteItem } = useItemStore();
  const { categories: customCategories, fetchCategories } = useCategoryStore();
  const { locations: customLocations, fetchLocations } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'expired' | 'expiring' | 'valued' | 'noValue'>('all');
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
    { value: ALL_CATEGORY, label: '全部' },
    ...itemCategories.map((category) => ({ value: category.id, label: category.name })),
  ];
  const locationFilters = [
    { value: 'ALL', label: '全部' },
    ...customLocations.map((location) => ({ value: location.id, label: location.name })),
  ];
  const statusFilters: { value: typeof selectedStatus; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'expired', label: '已过期' },
    { value: 'expiring', label: '7天内到期' },
    { value: 'valued', label: '有价值' },
    { value: 'noValue', label: '未估值' },
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
    const icon = cat?.icon || 'package-variant';
    // Avoid meaningless icons that render as "?" visually
    const badIcons = new Set([
      'help-circle', 'help-circle-outline', 'help', 'help-box',
      'question', 'question-mark', 'question-mark-circle',
      'comment-question', 'comment-question-outline',
      'alert', 'alert-circle', 'alert-circle-outline',
      'alert-decagram', 'alert-octagon', 'alert-rhombus',
      'frequently-asked-questions', 'progress-question',
      '', '?', '？', 'unknown', 'none', 'null', 'undefined',
    ]);
    if (badIcons.has(icon.trim().toLowerCase())) return 'package-variant';
    // Also guard against icon names that are not valid MaterialCommunityIcons names
    // by testing the first character is a letter
    if (!/^[a-z]/.test(icon.trim().toLowerCase())) return 'package-variant';
    return icon;
  };

  const getCategoryColor = (categoryId?: string): string => {
    if (!categoryId) return palette.orange;
    const cat = itemCategories.find((c) => c.id === categoryId);
    return cat?.color || palette.orange;
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
    const query = debouncedSearch.trim().toLowerCase();
    const categoryName = getCategoryName(i.category_id).toLowerCase();
    const locationName = getLocationName(i.location_id).toLowerCase();
    const matchesSearch = !query ||
      i.name.toLowerCase().includes(query) ||
      Boolean(i.description?.toLowerCase().includes(query)) ||
      Boolean(i.barcode?.toLowerCase().includes(query)) ||
      categoryName.includes(query) ||
      locationName.includes(query);
    const matchesCategory = selectedCategory === ALL_CATEGORY || i.category_id === selectedCategory;
    const matchesLocation = selectedLocation === 'ALL' || i.location_id === selectedLocation;
    const dayDiff = getDayDiff(i.expiry_date);
    const hasValue = typeof i.current_value === 'number' || typeof i.purchase_price === 'number';
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'expired' && dayDiff !== null && dayDiff < 0) ||
      (selectedStatus === 'expiring' && dayDiff !== null && dayDiff >= 0 && dayDiff <= 7) ||
      (selectedStatus === 'valued' && hasValue) ||
      (selectedStatus === 'noValue' && !hasValue);
    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'category') return getCategoryName(a.category_id).localeCompare(getCategoryName(b.category_id), 'zh-CN');
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const countLabel = batchMode ? `已选 ${selectedIds.size} / ${filtered.length}` : `共 ${filtered.length} 件`;
  const activeFilterCount = [
    debouncedSearch.trim(),
    selectedCategory !== ALL_CATEGORY,
    selectedLocation !== 'ALL',
    selectedStatus !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(ALL_CATEGORY);
    setSelectedLocation('ALL');
    setSelectedStatus('all');
  };

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
    const categoryColor = getCategoryColor(item.category_id);
    const isSelected = selectedIds.has(item.id);
    const expiryDiff = getDayDiff(item.expiry_date);
    const hasValue = typeof item.current_value === 'number';
    const valueText = hasValue
      ? ((item.currency || 'CNY') === 'CNY' ? `¥${item.current_value}` : `${item.current_value} ${item.currency}`)
      : '';
    return (
      <SwipeableRow onDelete={() => handleDeleteItem(item)}>
        <TouchableOpacity
          style={[
            styles.itemCard,
            { backgroundColor: palette.surface },
            batchMode && isSelected && { borderColor: palette.orange, borderWidth: 2 },
          ]}
          onPress={() => (batchMode ? toggleSelectItem(item.id) : router.push(`/item/${item.id}`))}
          activeOpacity={0.95}
        >
          <View style={styles.iconContainer}>
            {item.images && item.images.length > 0 ? (
              <CachedImage uri={item.images[0]} size={44} borderRadius={22} />
            ) : (
              <View style={[styles.itemIcon, { backgroundColor: `${categoryColor}16` }]}>
                <MaterialCommunityIcons name={icon as any} size={22} color={categoryColor} />
              </View>
            )}
          </View>
          <View style={styles.itemDetails}>
            <View style={styles.itemHead}>
              <Text style={[styles.itemName, { color: palette.text }]} numberOfLines={1}>{item.name}</Text>
              {hasValue && (
                <Text style={[styles.valueBadge, { color: palette.success }]} numberOfLines={1}>
                  {valueText}
                </Text>
              )}
            </View>
            {item.description && (
              <Text style={[styles.itemDesc, { color: palette.textMuted }]} numberOfLines={1}>{item.description}</Text>
            )}
            <View style={styles.itemMetaRow}>
              <Text
                style={[styles.tag, { color: categoryColor }]}
                numberOfLines={1}
              >
                {getCategoryName(item.category_id)}
              </Text>
              {item.location_id && (
                <View style={styles.metaChip}>
                  <MaterialCommunityIcons name="map-marker-outline" size={11} color={palette.textMuted} />
                  <Text style={[styles.metaChipText, { color: palette.textMuted }]} numberOfLines={1}>
                    {getLocationName(item.location_id)}
                  </Text>
                </View>
              )}
              {expiryDiff !== null && (
                <View style={styles.metaChip}>
                  <MaterialCommunityIcons
                    name={expiryDiff < 0 ? 'alert-circle-outline' : expiryDiff <= 7 ? 'clock-alert-outline' : 'calendar-outline'}
                    size={11}
                    color={expiryDiff < 0 ? palette.danger : expiryDiff <= 7 ? palette.warning : palette.textMuted}
                  />
                  <Text
                    style={[
                      styles.metaChipText,
                      { color: expiryDiff < 0 ? palette.danger : expiryDiff <= 7 ? palette.warning : palette.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {expiryDiff < 0 ? `过期 ${Math.abs(expiryDiff)} 天` : expiryDiff === 0 ? '今天到期' : `${expiryDiff} 天后到期`}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {batchMode && (
            <View style={[styles.checkIndicator, { borderColor: isSelected ? palette.orange : palette.borderStrong }, isSelected && { backgroundColor: palette.orange }]}>
              {isSelected && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
            </View>
          )}
        </TouchableOpacity>
      </SwipeableRow>
    );
  }, [batchMode, selectedIds, palette, customCategories, customLocations, router]);

  const renderEmpty = () => (
    <EmptyState
      icon="package-variant"
      title={activeFilterCount === 0 ? '暂无物品' : '没有匹配的物品'}
      description={activeFilterCount === 0 ? '点击下方按钮添加第一个物品' : '调整筛选条件或清空搜索后再看看'}
      actionLabel="添加物品"
      onAction={() => router.push('/item/create')}
      style={styles.inlineEmpty}
    />
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.bg }]}>
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <ItemListHeader
          ref={searchInputRef}
          palette={palette}
          countLabel={countLabel}
          batchMode={batchMode}
          searchActive={searchActive}
          searchQuery={searchQuery}
          isSearchFocused={isSearchFocused}
          categoryFilters={categoryFilters}
          selectedCategory={selectedCategory}
          locationFilters={locationFilters}
          selectedLocation={selectedLocation}
          statusFilters={statusFilters}
          selectedStatus={selectedStatus}
          activeFilterCount={activeFilterCount}
          allCategory={ALL_CATEGORY}
          onToggleBatch={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }}
          onToggleSearch={() => {
            setSearchActive((active) => {
              const next = !active;
              if (!next) setSearchQuery('');
              setTimeout(() => { if (next) searchInputRef.current?.focus(); }, 0);
              return next;
            });
          }}
          onSearchQueryChange={setSearchQuery}
          onCategoryChange={setSelectedCategory}
          onLocationChange={setSelectedLocation}
          onStatusChange={(v) => setSelectedStatus(v as typeof selectedStatus)}
          onClearFilters={clearFilters}
          onSortOpen={() => setShowSortModal(true)}
          onFocusChange={(focused) => setIsSearchFocused(focused)}
          onSearchClear={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
        />
        <View style={styles.listWrapper}>
          <PageLoadable
            loading={loading}
            error={itemsError}
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
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={styles.list}
              removeClippedSubviews
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              windowSize={5}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.orange]} tintColor={palette.orange} />}
            />
          </PageLoadable>
        </View>
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
  listWrapper: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: 0,
    zIndex: 10,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toolbarCount: {
    fontSize: fontSize.sm,
    marginRight: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: fontSize.base,
  },
  searchBox: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    padding: 0,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterSelect: {
    flex: 1,
  },
  filterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterSummaryText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.medium,
  },
  clearFilterText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.bold,
  },
  list: {
    paddingBottom: 160,
  },
  inlineEmpty: {
    minHeight: 420,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    position: 'relative',
    ...shadows.sm,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.sm,
    justifyContent: 'center',
    gap: 1,
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semiBold,
    lineHeight: 22,
  },
  valueBadge: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    lineHeight: 18,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 1,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaChipText: {
    fontSize: fontSize.xs,
    lineHeight: 14,
    fontWeight: fontWeight.regular,
    maxWidth: 90,
  },
  itemDesc: {
    fontSize: fontSize.sm,
    lineHeight: 16,
  },
  tag: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 14,
    maxWidth: 100,
  },
  checkIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    marginRight: spacing.sm,
    marginTop: 2,
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
