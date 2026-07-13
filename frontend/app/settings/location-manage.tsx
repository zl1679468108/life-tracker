import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocationStore } from '../../stores/locationStore';
import { appDesign, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { showAlert } from '../../lib/alert';
import { SwipeableRow } from '../../components/SwipeableRow';
import { FormActions, BottomSheet } from '../../components/ui';
import { LifeLocation } from '../../types';
import { useTranslation } from '../../lib/i18n';

// 可选图标列表（MaterialCommunityIcons key）
const iconOptions = [
  'book-open-variant', 'bed', 'sofa', 'pot-steam', 'bag-personal-outline',
  'home', 'office-building', 'warehouse', 'garage', 'castle',
  'floor-plan', 'door-open', 'stairs', 'elevator-passenger', 'shower-head',
  'washing-machine', 'fridge', 'microwave', 'stove', 'dishwasher',
  'map-marker', 'car', 'bike', 'train', 'airplane',
  'school', 'hospital-building', 'store', 'church', 'basketball',
  'swim', 'tennis', 'soccer', 'pool', 'tent',
];

// 构建树形结构
const buildLocationTree = (locations: LifeLocation[]): LifeLocation[] => {
  const locationMap = new Map<string, LifeLocation & { children?: LifeLocation[] }>();
  const roots: LifeLocation[] = [];

  // 初始化映射
  locations.forEach(loc => {
    locationMap.set(loc.id, { ...loc, children: [] });
  });

  // 构建树
  locations.forEach(loc => {
    const node = locationMap.get(loc.id)!;
    if (loc.parent_id) {
      const parent = locationMap.get(loc.parent_id);
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

export default function LocationManageScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { t } = useTranslation();
  const { locations, fetchLocations, addLocation, updateLocation, deleteLocation } = useLocationStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('map-marker');
  const [newParentId, setNewParentId] = useState<string | undefined>(undefined);

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  // 图标选择弹窗
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    fetchLocations(true);
  }, []);

  // 系统预设：user_id 为空
  const systemLocations = locations.filter((l) => !l.user_id);
  // 自定义：user_id 不为空
  const customLocations = locations.filter((l) => l.user_id);
  const locationTree = buildLocationTree(customLocations).filter(Boolean);

  const handleAdd = async () => {
    if (!newName.trim()) {
      showAlert(t('common.error'), t('locations.nameRequired'));
      return;
    }
    const duplicate = locations.some((location) =>
      location.parent_id === newParentId &&
      location.name.trim().toLowerCase() === newName.trim().toLowerCase()
    );
    if (duplicate) {
      showAlert(t('common.error'), '同一层级下已存在同名位置');
      return;
    }
    try {
      await addLocation({ name: newName.trim(), icon: newIcon, parent_id: newParentId, level: newParentId ? 1 : 0, user_id: undefined });
      setNewName('');
      setNewIcon('map-marker');
      setNewParentId(undefined);
      setShowAdd(false);
      await fetchLocations(true);
    } catch (error) {
      showAlert(t('common.error'), error instanceof Error ? error.message : '创建位置失败');
    }
  };

  const handleStartEdit = (loc: typeof customLocations[0]) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditIcon(loc.icon || 'map-marker');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditIcon('');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      showAlert(t('common.error'), t('locations.nameRequired'));
      return;
    }
    if (!editingId) return;
    const editingLocation = locations.find((location) => location.id === editingId);
    const duplicate = locations.some((location) =>
      location.id !== editingId &&
      location.parent_id === editingLocation?.parent_id &&
      location.name.trim().toLowerCase() === editName.trim().toLowerCase()
    );
    if (duplicate) {
      showAlert(t('common.error'), '同一层级下已存在同名位置');
      return;
    }
    try {
      await updateLocation(editingId, { name: editName.trim(), icon: editIcon });
      setEditingId(null);
      setEditName('');
      setEditIcon('');
      await fetchLocations(true);
    } catch (error) {
      showAlert(t('common.error'), error instanceof Error ? error.message : '更新位置失败');
    }
  };

  const handleDelete = (id: string, name: string) => {
    showAlert(t('locations.deleteConfirm'), `${name}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        try {
          await deleteLocation(id);
          await fetchLocations(true);
        } catch (error) {
          showAlert(t('common.error'), error instanceof Error ? error.message : '删除位置失败');
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

  const currentIcon = iconPickerTarget === 'add' ? newIcon : editIcon;

  const renderLocationItem = (loc: LifeLocation & { children?: LifeLocation[] }, depth: number = 0) => {
    const indent = depth * 20;
    const displayRow = (
      <View style={[styles.lmItem, { marginLeft: indent, backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={[styles.lmIconWrapPlain, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons name={(loc.icon || 'map-marker') as any} size={20} color={palette.violet} />
        </View>
        <View style={styles.lmItemCopy}>
          <Text style={[styles.lmItemEyebrow, { color: palette.textSecondary }]}>位置节点</Text>
          <Text style={[styles.lmItemName, { color: palette.text }]}>{loc.name}</Text>
        </View>
        <TouchableOpacity style={styles.lmEditBtn} onPress={() => handleStartEdit(loc)}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={palette.textMuted} />
        </TouchableOpacity>
      </View>
    );

    return (
      <View key={loc.id}>
        {editingId === loc.id ? (
          <View style={[styles.lmAddForm, { marginLeft: indent, backgroundColor: palette.surface, borderColor: palette.border }]}>
            <TextInput
              style={[styles.lmInput, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surfaceSoft }]}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('locations.name')}
              placeholderTextColor={palette.textMuted}
            />
            <TouchableOpacity style={[styles.lmIconSelect, { borderColor: palette.border, backgroundColor: palette.surfaceSoft }]} onPress={() => openIconPicker('edit')}>
              <View style={[styles.lmIconPreview, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <MaterialCommunityIcons name={editIcon as any} size={22} color={palette.violet} />
              </View>
              <Text style={[styles.lmIconSelectText, { color: palette.textMuted }]}>选择图标</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
            </TouchableOpacity>
            <View style={styles.lmEditActions}>
              <TouchableOpacity style={[styles.lmCancelBtn, { backgroundColor: palette.surfaceSoft }]} onPress={handleCancelEdit}>
                <Text style={[styles.lmCancelBtnText, { color: palette.textSecondary }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.lmSaveBtn, { backgroundColor: palette.orange, shadowColor: palette.orange }]} onPress={handleSaveEdit}>
                <Text style={[styles.lmSaveBtnText, { color: colors.white }]}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <SwipeableRow onDelete={() => handleDelete(loc.id, loc.name)}>
            {displayRow}
          </SwipeableRow>
        )}
        {loc.children && loc.children.length > 0 && (
          <View style={styles.childrenContainer}>
            {loc.children.map(child => renderLocationItem(child as LifeLocation & { children?: LifeLocation[] }, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.lmContainer, { backgroundColor: palette.bg }]}>
      <ScrollView style={[styles.lmContainer, { backgroundColor: palette.bg }]} contentContainerStyle={styles.lmContent}>
        {/* 系统预设 */}
        <View style={styles.lmSection}>
          <Text style={[styles.lmSectionTitle, { color: palette.textSecondary }]}>{t('locations.systemPreset')}</Text>
          {systemLocations.map((loc) => (
            <View key={loc.id} style={[styles.lmItem, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={[styles.lmIconWrapPlain, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <MaterialCommunityIcons name={(loc.icon || 'map-marker') as any} size={20} color={palette.violet} />
              </View>
              <View style={styles.lmItemCopy}>
                <Text style={[styles.lmItemEyebrow, { color: palette.textSecondary }]}>{t('locations.systemPreset')}</Text>
                <Text style={[styles.lmItemName, { color: palette.text }]}>{loc.name}</Text>
              </View>
              <Text style={[styles.lmSystemBadge, { color: palette.textMuted, backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>{t('locations.systemPreset')}</Text>
            </View>
          ))}
        </View>

        {/* 自定义位置 */}
        <View style={styles.lmSection}>
          <View style={styles.lmSectionHeader}>
            <Text style={[styles.lmSectionTitle, { color: palette.textSecondary }]}>{t('locations.custom')}</Text>
            <TouchableOpacity
              style={[styles.lmAddBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
              onPress={() => { setEditingId(null); setNewParentId(undefined); setShowAdd(true); }}
              accessibilityRole="button"
              accessibilityLabel="新增位置"
            >
              <MaterialCommunityIcons name="plus" size={18} color={palette.orange} />
              <Text style={[styles.lmAddBtnText, { color: palette.orange }]}>新增位置</Text>
            </TouchableOpacity>
          </View>

          {locationTree.length === 0 ? (
            <Text style={[styles.lmEmptyText, { color: palette.textMuted }]}>{t('locations.empty')}</Text>
          ) : (
            locationTree.map((loc) => renderLocationItem(loc as LifeLocation & { children?: LifeLocation[] }))
          )}
        </View>
      </ScrollView>

      {/* 新增位置弹窗 */}
      <BottomSheet visible={showAdd} onClose={() => setShowAdd(false)}>
        <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
        <Text style={[styles.pickerTitle, { color: palette.text }]}>新增位置</Text>
        <TextInput
          style={[styles.lmInput, { borderColor: palette.border, color: palette.text, backgroundColor: palette.surfaceSoft }]}
          value={newName}
          onChangeText={setNewName}
          placeholder={newParentId ? `${t('locations.name')} (${t('locations.parent')})` : t('locations.name')}
          placeholderTextColor={palette.textMuted}
        />
        <TouchableOpacity style={[styles.lmIconSelect, { borderColor: palette.border, backgroundColor: palette.surfaceSoft }]} onPress={() => openIconPicker('add')}>
          <View style={[styles.lmIconPreview, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <MaterialCommunityIcons name={newIcon as any} size={22} color={palette.violet} />
          </View>
          <Text style={[styles.lmIconSelectText, { color: palette.textMuted }]}>选择图标</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
        </TouchableOpacity>
        {newParentId && (
          <View style={[styles.lmParentInfo, { backgroundColor: palette.surfaceSoft }]}>
            <MaterialCommunityIcons name="information-outline" size={16} color={palette.textMuted} />
            <Text style={[styles.lmParentInfoText, { color: palette.textSecondary }]}>
              {`${t('locations.parent')}: ${locations.find(l => l.id === newParentId)?.name || ''}`}
            </Text>
          </View>
        )}
        <FormActions hideCancel onSubmit={handleAdd} submitLabel={t('common.save')} />
      </BottomSheet>

      {/* 图标选择弹窗 */}
      <BottomSheet visible={showIconPicker} onClose={() => setShowIconPicker(false)}>
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
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  lmContainer: { flex: 1 },
  lmContent: { paddingBottom: 20, paddingTop: spacing.lg },
  lmSection: { marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  lmSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lmSectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, textTransform: 'uppercase', marginBottom: spacing.xs },
  lmItem: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.md, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 10, marginBottom: spacing.xs, ...shadows.sm },
  lmIconWrap: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  lmIconWrapPlain: { width: 36, height: 36, borderRadius: borderRadius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  lmItemCopy: { flex: 1 },
  lmItemEyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, marginBottom: 2 },
  lmItemName: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  lmSystemBadge: { fontSize: fontSize.xs, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: borderRadius.sm, borderWidth: 1 },
  lmAddBtn: {
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  lmAddBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold },
  lmAddForm: { borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.xs, borderWidth: 1, ...shadows.sm },
  lmFormEyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, marginBottom: spacing.xs },
  lmInput: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 9, fontSize: fontSize.base, marginBottom: spacing.xs },
  lmIconSelect: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 8, marginBottom: spacing.xs, gap: spacing.xs },
  lmIconPreview: { width: 32, height: 32, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  lmIconSelectText: { flex: 1, fontSize: fontSize.sm },
  lmAddChildBtn: { marginRight: spacing.sm },
  childrenContainer: { marginLeft: spacing.sm },
  lmParentInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  lmParentInfoText: { flex: 1, fontSize: fontSize.xs },
  lmEditBtn: { marginRight: spacing.xs, padding: 4 },
  lmEditActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  lmCancelBtn: { flex: 1, height: 40, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  lmCancelBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  lmSaveBtn: { flex: 1, borderRadius: borderRadius.md, height: 40, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 3 },
  lmSaveBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  lmEmptyText: { fontSize: fontSize.base, textAlign: 'center', padding: spacing.xl },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  pickerTitle: { fontSize: fontSize['4xl'], fontWeight: fontWeight.semiBold, marginBottom: spacing.lg, textAlign: 'center' },
  pickerScroll: { maxHeight: 400 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pickerIconItem: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pickerIconItemActive: {},
});
