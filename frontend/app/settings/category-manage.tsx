import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCategoryStore } from '../../stores/categoryStore';
import { appDesign, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { showAlert } from '../../lib/alert';
import { ColorPicker, FormActions } from '../../components/ui';
import { SwipeableRow } from '../../components/SwipeableRow';
import { LifeCategory } from '../../types';
import { useTranslation } from '../../lib/i18n';

// 可选图标列表（MaterialCommunityIcons key）
const iconOptions = [
  'laptop', 'book-open-variant', 'shopping', 'tshirt-crew', 'food-apple',
  'car', 'home', 'gift', 'briefcase', 'palette',
  'music', 'camera', 'dumbbell', 'bike', 'headphones',
  'wallet', 'key-variant', 'medal', 'star', 'coffee',
  'flower', 'dog', 'baby-carriage', 'football', 'guitar',
  'tag', 'heart', 'diamond-stone', 'lightning-bolt', 'leaf',
  'puzzle', 'rocket-launch', 'shield-check', 'snowflake', 'fire',
];

const typeOptions: { value: 'item' | 'todo'; label: string }[] = [
  { value: 'item', label: '物品' },
  { value: 'todo', label: '待办' },
];

// 构建树形结构
const buildCategoryTree = (categories: LifeCategory[]): LifeCategory[] => {
  const categoryMap = new Map<string, LifeCategory & { children?: LifeCategory[] }>();
  const roots: LifeCategory[] = [];

  // 初始化映射
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // 构建树
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id)!;
    if (cat.parent_id) {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export default function CategoryManageScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { t } = useTranslation();
  const { categories, fetchCategories, addCategory, updateCategory, deleteCategory, loading } = useCategoryStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('tag');
  const [newType, setNewType] = useState<'item' | 'todo'>('item');
  const [newParentId, setNewParentId] = useState<string | undefined>(undefined);

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');

  // 图标选择弹窗
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<'add' | 'edit'>('add');

  // 颜色选择弹窗
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<'add' | 'edit'>('add');
  const [newColor, setNewColor] = useState(colors.success);

  useEffect(() => {
    fetchCategories(undefined, true);
  }, []);

  // 系统预设：user_id 为空
  const systemCategories = categories.filter((c) => !c.user_id);
  // 自定义：user_id 不为空，分物品和待办
  const customItemCategories = categories.filter((c) => c.user_id && c.type === 'item');
  const customTodoCategories = categories.filter((c) => c.user_id && c.type === 'todo');
  
  const itemCategoryTree = buildCategoryTree(customItemCategories);
  const todoCategoryTree = buildCategoryTree(customTodoCategories);

  const handleAdd = async () => {
    if (loading) return;
    if (!newName.trim()) {
      showAlert(t('common.error'), t('categories.nameRequired'));
      return;
    }
    const duplicate = categories.some((category) =>
      category.type === newType &&
      category.parent_id === newParentId &&
      category.name.trim().toLowerCase() === newName.trim().toLowerCase()
    );
    if (duplicate) {
      showAlert(t('common.error'), '同一层级下已存在同名分类');
      return;
    }
    try {
      await addCategory({ name: newName.trim(), type: newType, icon: newIcon, color: newColor, parent_id: newParentId });
      setNewName('');
      setNewIcon('tag');
      setNewType('item');
      setNewColor(colors.success);
      setNewParentId(undefined);
      setShowAdd(false);
      await fetchCategories(undefined, true);
    } catch (error) {
      showAlert(t('common.error'), error instanceof Error ? error.message : '创建分类失败');
    }
  };

  const handleStartEdit = (cat: typeof customItemCategories[0]) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || 'tag');
    setEditColor(cat.color || colors.success);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditIcon('');
    setEditColor('');
  };

  const handleSaveEdit = async () => {
    if (loading) return;
    if (!editName.trim()) {
      showAlert(t('common.error'), t('categories.nameRequired'));
      return;
    }
    if (!editingId) return;
    const editingCategory = categories.find((category) => category.id === editingId);
    const duplicate = categories.some((category) =>
      category.id !== editingId &&
      category.type === editingCategory?.type &&
      category.parent_id === editingCategory?.parent_id &&
      category.name.trim().toLowerCase() === editName.trim().toLowerCase()
    );
    if (duplicate) {
      showAlert(t('common.error'), '同一层级下已存在同名分类');
      return;
    }
    try {
      await updateCategory(editingId, { name: editName.trim(), icon: editIcon, color: editColor });
      setEditingId(null);
      setEditName('');
      setEditIcon('');
      setEditColor('');
      await fetchCategories(undefined, true);
    } catch (error) {
      showAlert(t('common.error'), error instanceof Error ? error.message : '更新分类失败');
    }
  };

  const handleDelete = (id: string, name: string) => {
    showAlert(t('categories.deleteConfirm'), `${name}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try {
          await deleteCategory(id);
          await fetchCategories(undefined, true);
        } catch (error) {
          showAlert(t('common.error'), error instanceof Error ? error.message : '删除分类失败');
        }
      }},
    ]);
  };

  const openIconPicker = (target: 'add' | 'edit') => {
    setIconPickerTarget(target);
    setShowIconPicker(true);
  };

  const selectIcon = (icon: string) => {
    if (iconPickerTarget === 'add') {
      setNewIcon(icon);
    } else {
      setEditIcon(icon);
    }
    setShowIconPicker(false);
  };

  const openColorPicker = (target: 'add' | 'edit') => {
    setColorPickerTarget(target);
    setShowColorPicker(true);
  };

  const selectColor = (color: string) => {
    if (colorPickerTarget === 'add') {
      setNewColor(color);
    } else {
      setEditColor(color);
    }
    setShowColorPicker(false);
  };

  const currentIcon = iconPickerTarget === 'add' ? newIcon : editIcon;
  const currentColor = colorPickerTarget === 'add' ? newColor : editColor;

  const renderCategoryItem = (cat: LifeCategory & { children?: LifeCategory[] }, isCustom: boolean, depth: number = 0) => {
    const categoryColor = cat.color || (isCustom ? colors.success : colors.primary);
    const indent = depth * 20;
    
    const displayRow = (
      <View style={[styles.cmItem, { marginLeft: indent, backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={[styles.cmIconWrapPlain, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons name={(cat.icon || 'tag') as any} size={20} color={categoryColor} />
        </View>
        <View style={styles.cmItemCopy}>
          <Text style={[styles.cmItemEyebrow, { color: palette.textSecondary }]}>{cat.type === 'item' ? t('categories.typeItem') : t('categories.typeTodo')}</Text>
          <Text style={[styles.cmItemName, { color: palette.text }]}>{cat.name}</Text>
        </View>
        <View style={[styles.cmTypeBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <Text style={[styles.cmTypeBadgeText, { color: cat.type === 'item' ? palette.orange : palette.success }]}>{cat.type === 'item' ? t('categories.typeItem') : t('categories.typeTodo')}</Text>
        </View>
        {isCustom && (
          <TouchableOpacity style={styles.cmEditBtn} onPress={() => handleStartEdit(cat)}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={palette.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    );

    return (
      <View key={cat.id}>
        {editingId === cat.id ? (
          <View style={[styles.cmAddForm, { marginLeft: indent, backgroundColor: palette.surface, borderColor: palette.border }]}>
            <TextInput
              style={[styles.cmInput, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surfaceSoft }]}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('categories.name')}
              placeholderTextColor={palette.textMuted}
            />
            <View style={styles.cmIconColorRow}>
              <TouchableOpacity style={[styles.cmIconSelect, { borderColor: palette.border, backgroundColor: palette.surfaceSoft }]} onPress={() => openIconPicker('edit')}>
                <LinearGradient
                  colors={[editColor || colors.success, (editColor || colors.success) + '80']}
                  style={styles.cmIconPreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons name={editIcon as any} size={22} color={colors.white} />
                </LinearGradient>
                <Text style={[styles.cmIconSelectText, { color: palette.textMuted }]}>选择图标</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cmColorSelect, { borderColor: palette.border, backgroundColor: palette.surfaceSoft }]} onPress={() => openColorPicker('edit')}>
                <View style={[styles.cmColorPreview, { backgroundColor: editColor || colors.success, borderColor: palette.border }]} />
                <Text style={[styles.cmColorSelectText, { color: palette.textMuted }]}>{t('categories.color')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.cmEditActions}>
              <TouchableOpacity style={[styles.cmCancelBtn, { backgroundColor: palette.surfaceSoft }]} onPress={handleCancelEdit}>
                <Text style={[styles.cmCancelBtnText, { color: palette.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cmSaveBtn, { backgroundColor: palette.orange, shadowColor: palette.orange }]} onPress={handleSaveEdit}>
                <Text style={[styles.cmSaveBtnText, { color: colors.white }]}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          isCustom ? (
            <SwipeableRow onDelete={() => handleDelete(cat.id, cat.name)}>
              {displayRow}
            </SwipeableRow>
          ) : displayRow
        )}
        {cat.children && cat.children.length > 0 && (
          <View style={styles.childrenContainer}>
            {cat.children.map(child => renderCategoryItem(child as LifeCategory & { children?: LifeCategory[] }, isCustom, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.cmContainer, { backgroundColor: palette.bg }]}>
      <ScrollView style={[styles.cmContainer, { backgroundColor: palette.bg }]} contentContainerStyle={styles.cmContent}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: palette.text }]}>分类管理</Text>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}> 
              <Text style={[styles.summaryText, { color: palette.text }]} numberOfLines={1}>
                <Text style={styles.summaryValue}>{categories.length}</Text>
                <Text style={[styles.summaryLabel, { color: palette.textMuted }]}> 个分类</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* 系统预设 */}
        <View style={styles.cmSection}>
          <Text style={[styles.cmSectionTitle, { color: palette.textSecondary }]}>{t('categories.systemPreset')}</Text>
          {systemCategories.map((cat) => renderCategoryItem(cat, false))}
        </View>

        {/* 自定义分类 */}
        <View style={styles.cmSection}>
          <View style={styles.cmSectionHeader}>
            <Text style={[styles.cmSectionTitle, { color: palette.textSecondary }]}>{t('categories.custom')}</Text>
            <TouchableOpacity
              style={[styles.cmAddBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
              onPress={() => { setShowAdd(!showAdd); setEditingId(null); setNewParentId(undefined); }}
              accessibilityRole="button"
              accessibilityLabel={showAdd ? '收起新增分类' : '新增分类'}
            >
              <MaterialCommunityIcons name={showAdd ? 'close' : 'plus'} size={18} color={palette.orange} />
              <Text style={[styles.cmAddBtnText, { color: palette.orange }]}>{showAdd ? '收起' : '新增分类'}</Text>
            </TouchableOpacity>
          </View>

          {showAdd && (
            <View style={[styles.cmAddForm, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.cmFormEyebrow, { color: palette.textSecondary }]}>新增分类</Text>
              <TextInput
                style={[styles.cmInput, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surfaceSoft }]}
                value={newName}
                onChangeText={setNewName}
                placeholder={newParentId ? `${t('categories.name')} (${t('locations.parent')})` : t('categories.name')}
                placeholderTextColor={palette.textMuted}
              />
              <View style={styles.cmTypeRow}>
                {typeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.cmTypeOption,
                      { borderColor: palette.border, backgroundColor: palette.surfaceSoft },
                      newType === opt.value && { borderColor: palette.orange, backgroundColor: palette.surface },
                    ]}
                    onPress={() => setNewType(opt.value)}
                  >
                    <Text style={[
                      styles.cmTypeOptionText,
                      { color: palette.textMuted },
                      newType === opt.value && { color: palette.orange },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.cmIconColorRow}>
                <TouchableOpacity style={[styles.cmIconSelect, { borderColor: palette.border, backgroundColor: palette.surfaceSoft }]} onPress={() => openIconPicker('add')}>
                  <LinearGradient
                    colors={[newColor, newColor + '80']}
                    style={styles.cmIconPreview}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name={newIcon as any} size={22} color={colors.white} />
                  </LinearGradient>
                  <Text style={[styles.cmIconSelectText, { color: palette.textMuted }]}>选择图标</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cmColorSelect, { borderColor: palette.border, backgroundColor: palette.surfaceSoft }]} onPress={() => openColorPicker('add')}>
                  <View style={[styles.cmColorPreview, { backgroundColor: newColor, borderColor: palette.border }]} />
                  <Text style={[styles.cmColorSelectText, { color: palette.textMuted }]}>{t('categories.color')}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
                </TouchableOpacity>
              </View>
              {newParentId && (
                <View style={[styles.cmParentInfo, { backgroundColor: palette.surfaceSoft }]}>
                  <MaterialCommunityIcons name="information-outline" size={16} color={palette.textMuted} />
                  <Text style={[styles.cmParentInfoText, { color: palette.textSecondary }]}>
                    {`${t('locations.parent')}: ${categories.find(c => c.id === newParentId)?.name || ''}`}
                  </Text>
                </View>
              )}
              <FormActions onCancel={() => setShowAdd(false)} onSubmit={handleAdd} submitLabel={t('common.save')} loading={loading} />
            </View>
          )}

        {(itemCategoryTree.length === 0 && todoCategoryTree.length === 0 && !showAdd && editingId === null) ? (
          <Text style={[styles.cmEmptyText, { color: palette.textMuted }]}>{t('categories.empty')}</Text>
        ) : (
          <>
            {itemCategoryTree.length > 0 && (
              <View>
                <Text style={[styles.cmSubTitle, { color: palette.textMuted }]}>
                  {t('categories.itemCategories')} · {customItemCategories.length}
                </Text>
                {itemCategoryTree.map((cat) => renderCategoryItem(cat as LifeCategory & { children?: LifeCategory[] }, true))}
              </View>
            )}
            {todoCategoryTree.length > 0 && (
              <View>
                <Text style={[styles.cmSubTitle, { color: palette.textMuted }]}>
                  {t('categories.todoCategories')} · {customTodoCategories.length}
                </Text>
                {todoCategoryTree.map((cat) => renderCategoryItem(cat as LifeCategory & { children?: LifeCategory[] }, true))}
              </View>
            )}
          </>
        )}
      </View>
      </ScrollView>

      {/* 图标选择弹窗 */}
      <Modal visible={showIconPicker} transparent animationType="fade" onRequestClose={() => setShowIconPicker(false)}>
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={() => setShowIconPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerModal, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
            <Text style={[styles.pickerTitle, { color: palette.text }]}>选择图标</Text>
            <ScrollView style={styles.pickerScroll} contentContainerStyle={styles.pickerGrid}>
              {iconOptions.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.pickerIconItem,
                    { backgroundColor: palette.surfaceSoft, borderColor: palette.border },
                    currentIcon === icon && { backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.orange },
                  ]}
                  onPress={() => selectIcon(icon)}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={24}
                    color={currentIcon === icon ? palette.orange : palette.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 颜色选择弹窗 */}
      <ColorPicker
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        onSelect={selectColor}
        currentColor={currentColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cmContainer: { flex: 1 },
  cmContent: { paddingBottom: 20, paddingTop: spacing.md },
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold },
  summaryBadge: { borderRadius: borderRadius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minWidth: 92, alignItems: 'center', justifyContent: 'center' },
  summaryText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  summaryValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  summaryLabel: { fontSize: fontSize.xs },
  cmSection: { marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  cmSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cmSectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, textTransform: 'uppercase', marginBottom: spacing.xs },
  cmSubTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, marginBottom: spacing.xs, marginTop: spacing.xs },
  cmItem: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 10, marginBottom: spacing.xs, ...shadows.sm },
  cmIconWrap: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  cmIconWrapPlain: { width: 36, height: 36, borderRadius: borderRadius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  cmItemCopy: { flex: 1 },
  cmItemEyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, marginBottom: 2 },
  cmItemName: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  cmTypeBadge: { paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: borderRadius.sm, marginRight: spacing.xs, borderWidth: 1 },
  cmTypeBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold },
  cmAddBtn: {
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  cmAddBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold },
  cmAddForm: { borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.xs, borderWidth: 1, ...shadows.sm },
  cmFormEyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, marginBottom: spacing.xs },
  cmInput: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 9, fontSize: fontSize.base, marginBottom: spacing.xs },
  cmTypeRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  cmTypeOption: { flex: 1, height: 36, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cmTypeOptionText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  cmIconSelect: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 8, gap: spacing.xs },
  cmIconPreview: { width: 32, height: 32, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  cmIconSelectText: { flex: 1, fontSize: fontSize.sm },
  cmIconColorRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  cmColorSelect: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 8, gap: spacing.xs },
  cmColorPreview: { width: 32, height: 32, borderRadius: borderRadius.sm, borderWidth: 1 },
  cmColorSelectText: { flex: 1, fontSize: fontSize.sm },
  cmAddChildBtn: { marginRight: spacing.sm },
  childrenContainer: { marginLeft: spacing.sm },
  cmParentInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  cmParentInfoText: { flex: 1, fontSize: fontSize.xs },
  cmEditBtn: { marginRight: spacing.xs, padding: 4 },
  cmEditActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cmCancelBtn: { flex: 1, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cmCancelBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  cmSaveBtn: { flex: 1, borderRadius: borderRadius.md, height: 40, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 3 },
  cmSaveBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  cmEmptyText: { fontSize: fontSize.base, textAlign: 'center', padding: spacing.xl },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end' },
  pickerModal: { borderTopLeftRadius: borderRadius['2xl'], borderTopRightRadius: borderRadius['2xl'], padding: spacing.xl, paddingBottom: 40, maxHeight: '70%', borderWidth: 1 },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  pickerTitle: { fontSize: fontSize['4xl'], fontWeight: fontWeight.semiBold, marginBottom: spacing.lg },
  pickerScroll: { maxHeight: 400 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pickerIconItem: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
