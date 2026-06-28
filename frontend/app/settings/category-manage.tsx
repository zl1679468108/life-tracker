import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCategoryStore } from '../../stores/categoryStore';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { showAlert } from '../../lib/alert';
import { ColorPicker } from '../../components/ui';
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
  const { t } = useTranslation();
  const { categories, fetchCategories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
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
    if (!newName.trim()) {
      showAlert(t('common.error'), t('categories.nameRequired'));
      return;
    }
    await addCategory({ name: newName.trim(), type: newType, icon: newIcon, color: newColor, parent_id: newParentId });
    setNewName('');
    setNewIcon('tag');
    setNewType('item');
    setNewColor(colors.success);
    setNewParentId(undefined);
    setShowAdd(false);
    fetchCategories(undefined, true);
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
    if (!editName.trim()) {
      showAlert(t('common.error'), t('categories.nameRequired'));
      return;
    }
    if (!editingId) return;
    await updateCategory(editingId, { name: editName.trim(), icon: editIcon, color: editColor });
    setEditingId(null);
    setEditName('');
    setEditIcon('');
    setEditColor('');
    fetchCategories(undefined, true);
  };

  const handleDelete = (id: string, name: string) => {
    showAlert(t('categories.deleteConfirm'), `${name}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        await deleteCategory(id);
        await fetchCategories(undefined, true);
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
      <View style={[styles.cmItem, { marginLeft: indent, backgroundColor: colors.white }]}>
        <LinearGradient
          colors={[categoryColor, categoryColor + '80']}
          style={styles.cmIconWrap}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name={(cat.icon || 'tag') as any} size={20} color={colors.white} />
        </LinearGradient>
        <Text style={[styles.cmItemName, { color: colors.gray[800] }]}>{cat.name}</Text>
        <View style={[styles.cmTypeBadge, cat.type === 'item' ? { backgroundColor: colors.primary + '15' } : { backgroundColor: colors.success + '15' }]}>
          <Text style={styles.cmTypeBadgeText}>{cat.type === 'item' ? t('categories.typeItem') : t('categories.typeTodo')}</Text>
        </View>
        {isCustom && (
          <TouchableOpacity style={styles.cmEditBtn} onPress={() => handleStartEdit(cat)}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );

    return (
      <View key={cat.id}>
        {editingId === cat.id ? (
          <View style={[styles.cmAddForm, { marginLeft: indent, backgroundColor: colors.white, borderColor: colors.gray[100] }]}>
            <TextInput
              style={[styles.cmInput, { borderColor: colors.gray[200], color: colors.gray[800] }]}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('categories.name')}
              placeholderTextColor={colors.gray[400]}
            />
            <View style={styles.cmIconColorRow}>
              <TouchableOpacity style={[styles.cmIconSelect, { borderColor: colors.gray[200] }]} onPress={() => openIconPicker('edit')}>
                <LinearGradient
                  colors={[editColor || colors.success, (editColor || colors.success) + '80']}
                  style={styles.cmIconPreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons name={editIcon as any} size={22} color={colors.white} />
                </LinearGradient>
                <Text style={[styles.cmIconSelectText, { color: colors.gray[500] }]}>{t('common.add')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cmColorSelect, { borderColor: colors.gray[200] }]} onPress={() => openColorPicker('edit')}>
                <View style={[styles.cmColorPreview, { backgroundColor: editColor || colors.success, borderColor: colors.gray[200] }]} />
                <Text style={[styles.cmColorSelectText, { color: colors.gray[500] }]}>{t('categories.color')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>
            <View style={styles.cmEditActions}>
              <TouchableOpacity style={[styles.cmCancelBtn, { backgroundColor: colors.gray[100] }]} onPress={handleCancelEdit}>
                <Text style={[styles.cmCancelBtnText, { color: colors.gray[600] }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cmSaveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleSaveEdit}>
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
    <View style={[styles.cmContainer, { backgroundColor: colors.gray[50] }]}>
      <ScrollView style={[styles.cmContainer, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.cmContent}>

        {/* 系统预设 */}
        <View style={styles.cmSection}>
          <Text style={[styles.cmSectionTitle, { color: colors.gray[400] }]}>{t('categories.systemPreset')}</Text>
          {systemCategories.map((cat) => renderCategoryItem(cat, false))}
        </View>

        {/* 自定义分类 */}
        <View style={styles.cmSection}>
        <View style={styles.cmSectionHeader}>
          <Text style={[styles.cmSectionTitle, { color: colors.gray[400] }]}>{t('categories.custom')}</Text>
          <TouchableOpacity style={[styles.cmAddBtn, { backgroundColor: colors.primaryLight }]} onPress={() => { setShowAdd(!showAdd); setEditingId(null); setNewParentId(undefined); }}>
            <MaterialCommunityIcons name={showAdd ? 'close' : 'plus'} size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {showAdd && (
          <View style={[styles.cmAddForm, { backgroundColor: colors.white, borderColor: colors.gray[100] }]}>
            <TextInput
              style={[styles.cmInput, { borderColor: colors.gray[200], color: colors.gray[800] }]}
              value={newName}
              onChangeText={setNewName}
              placeholder={newParentId ? `${t('categories.name')} (${t('locations.parent')})` : t('categories.name')}
              placeholderTextColor={colors.gray[400]}
            />
            {/* 类型选择 */}
            <View style={styles.cmTypeRow}>
              {typeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.cmTypeOption,
                    { borderColor: colors.gray[200], backgroundColor: colors.gray[50] },
                    newType === opt.value && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setNewType(opt.value)}
                >
                  <Text style={[
                    styles.cmTypeOptionText,
                    { color: colors.gray[500] },
                    newType === opt.value && { color: colors.primary },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.cmIconColorRow}>
              <TouchableOpacity style={[styles.cmIconSelect, { borderColor: colors.gray[200] }]} onPress={() => openIconPicker('add')}>
                <LinearGradient
                  colors={[newColor, newColor + '80']}
                  style={styles.cmIconPreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialCommunityIcons name={newIcon as any} size={22} color={colors.white} />
                </LinearGradient>
                <Text style={[styles.cmIconSelectText, { color: colors.gray[500] }]}>{t('common.add')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cmColorSelect, { borderColor: colors.gray[200] }]} onPress={() => openColorPicker('add')}>
                <View style={[styles.cmColorPreview, { backgroundColor: newColor, borderColor: colors.gray[200] }]} />
                <Text style={[styles.cmColorSelectText, { color: colors.gray[500] }]}>{t('categories.color')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>
            {newParentId && (
              <View style={[styles.cmParentInfo, { backgroundColor: colors.gray[50] }]}>
                <MaterialCommunityIcons name="information-outline" size={16} color={colors.gray[500]} />
                <Text style={[styles.cmParentInfoText, { color: colors.gray[600] }]}>
                  {`${t('locations.parent')}: ${categories.find(c => c.id === newParentId)?.name || ''}`}
                </Text>
              </View>
            )}
            <TouchableOpacity style={[styles.cmSaveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleAdd} activeOpacity={0.8}>
              <Text style={[styles.cmSaveBtnText, { color: colors.white }]}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {(itemCategoryTree.length === 0 && todoCategoryTree.length === 0 && !showAdd && editingId === null) ? (
          <Text style={[styles.cmEmptyText, { color: colors.gray[400] }]}>{t('categories.empty')}</Text>
        ) : (
          <>
            {itemCategoryTree.length > 0 && (
              <View>
                <Text style={[styles.cmSubTitle, { color: colors.gray[500] }]}>{t('categories.itemCategories')}</Text>
                {itemCategoryTree.map((cat) => renderCategoryItem(cat as LifeCategory & { children?: LifeCategory[] }, true))}
              </View>
            )}
            {todoCategoryTree.length > 0 && (
              <View>
                <Text style={[styles.cmSubTitle, { color: colors.gray[500] }]}>{t('categories.todoCategories')}</Text>
                {todoCategoryTree.map((cat) => renderCategoryItem(cat as LifeCategory & { children?: LifeCategory[] }, true))}
              </View>
            )}
          </>
        )}
      </View>
      </ScrollView>

      {/* 图标选择弹窗 */}
      <Modal visible={showIconPicker} transparent animationType="fade" onRequestClose={() => setShowIconPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowIconPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerModal, { backgroundColor: colors.white }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerHandle, { backgroundColor: colors.gray[200] }]} />
            <Text style={[styles.pickerTitle, { color: colors.gray[900] }]}>{t('common.add')}</Text>
            <ScrollView style={styles.pickerScroll} contentContainerStyle={styles.pickerGrid}>
              {iconOptions.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.pickerIconItem,
                    { backgroundColor: colors.gray[100] },
                    currentIcon === icon && { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary },
                  ]}
                  onPress={() => selectIcon(icon)}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={24}
                    color={currentIcon === icon ? colors.primary : colors.gray[600]}
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
  cmContent: { paddingBottom: 20 },
  cmSection: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
  cmSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cmSectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  cmSubTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, marginBottom: spacing.sm },
  cmItem: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm },
  cmIconWrap: { width: 40, height: 40, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cmItemName: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.medium },
  cmTypeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginRight: spacing.sm },
  cmTypeBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold },
  cmAddBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cmAddForm: { borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, ...shadows.sm },
  cmInput: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.lg, fontSize: fontSize.xl, marginBottom: spacing.md },
  cmTypeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  cmTypeOption: { flex: 1, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cmTypeOptionText: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  cmIconSelect: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, gap: spacing.sm },
  cmIconPreview: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  cmIconSelectText: { flex: 1, fontSize: fontSize.base },
  cmIconColorRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  cmColorSelect: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, gap: spacing.sm },
  cmColorPreview: { width: 36, height: 36, borderRadius: borderRadius.sm, borderWidth: 1 },
  cmColorSelectText: { flex: 1, fontSize: fontSize.base },
  cmAddChildBtn: { marginRight: spacing.sm },
  childrenContainer: { marginLeft: spacing.md },
  cmParentInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  cmParentInfoText: { flex: 1, fontSize: fontSize.sm },
  cmEditBtn: { marginRight: spacing.sm },
  cmEditActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cmCancelBtn: { flex: 1, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  cmCancelBtnText: { fontSize: fontSize.xl, fontWeight: fontWeight.semiBold },
  cmSaveBtn: { flex: 1, borderRadius: borderRadius.md, height: 48, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  cmSaveBtnText: { fontSize: fontSize.xl, fontWeight: fontWeight.semiBold },
  cmEmptyText: { fontSize: fontSize.base, textAlign: 'center', padding: spacing.xl },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  pickerModal: { borderTopLeftRadius: borderRadius['2xl'], borderTopRightRadius: borderRadius['2xl'], padding: spacing.xl, paddingBottom: 40, maxHeight: '70%' },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  pickerTitle: { fontSize: fontSize['4xl'], fontWeight: fontWeight.semiBold, marginBottom: spacing.lg },
  pickerScroll: { maxHeight: 400 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pickerIconItem: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
});
