import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocationStore } from '../../stores/locationStore';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { showAlert } from '../../lib/alert';
import { SwipeableRow } from '../../components/SwipeableRow';
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
    await addLocation({ name: newName.trim(), icon: newIcon, parent_id: newParentId, level: newParentId ? 1 : 0, user_id: undefined });
    setNewName('');
    setNewIcon('map-marker');
    setNewParentId(undefined);
    setShowAdd(false);
    fetchLocations(true);
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
    await updateLocation(editingId, { name: editName.trim(), icon: editIcon });
    setEditingId(null);
    setEditName('');
    setEditIcon('');
    fetchLocations(true);
  };

  const handleDelete = (id: string, name: string) => {
    showAlert(t('locations.deleteConfirm'), `${name}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        await deleteLocation(id);
        await fetchLocations(true);
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
      <View style={[styles.lmItem, { marginLeft: indent, backgroundColor: colors.white }]}>
        <LinearGradient
          colors={[colors.success, colors.success + '80']}
          style={styles.lmIconWrap}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name={(loc.icon || 'map-marker') as any} size={20} color={colors.white} />
        </LinearGradient>
        <Text style={[styles.lmItemName, { color: colors.gray[800] }]}>{loc.name}</Text>
        <TouchableOpacity style={styles.lmEditBtn} onPress={() => handleStartEdit(loc)}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );

    return (
      <View key={loc.id}>
        {editingId === loc.id ? (
          <View style={[styles.lmAddForm, { marginLeft: indent, backgroundColor: colors.white, borderColor: colors.gray[100] }]}>
            <TextInput
              style={[styles.lmInput, { borderColor: colors.gray[200], color: colors.gray[800] }]}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('locations.name')}
              placeholderTextColor={colors.gray[400]}
            />
            <TouchableOpacity style={[styles.lmIconSelect, { borderColor: colors.gray[200] }]} onPress={() => openIconPicker('edit')}>
              <View style={[styles.lmIconPreview, { backgroundColor: colors.primary + '20' }]}>
                <MaterialCommunityIcons name={editIcon as any} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.lmIconSelectText, { color: colors.gray[500] }]}>{t('common.add')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray[400]} />
            </TouchableOpacity>
            <View style={styles.lmEditActions}>
              <TouchableOpacity style={[styles.lmCancelBtn, { backgroundColor: colors.gray[100] }]} onPress={handleCancelEdit}>
                <Text style={[styles.lmCancelBtnText, { color: colors.gray[600] }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.lmSaveBtn} onPress={handleSaveEdit}>
                <Text style={styles.lmSaveBtnText}>{t('common.save')}</Text>
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
    <View style={[styles.lmContainer, { backgroundColor: colors.gray[50] }]}>
      <ScrollView style={[styles.lmContainer, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.lmContent}>

        {/* 系统预设 */}
        <View style={styles.lmSection}>
          <Text style={[styles.lmSectionTitle, { color: colors.gray[400] }]}>{t('locations.systemPreset')}</Text>
          {systemLocations.map((loc) => (
            <View key={loc.id} style={[styles.lmItem, { backgroundColor: colors.white }]}>
              <LinearGradient
                colors={[colors.secondary, colors.secondary + '80']}
                style={styles.lmIconWrap}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name={(loc.icon || 'map-marker') as any} size={20} color={colors.white} />
              </LinearGradient>
              <Text style={[styles.lmItemName, { color: colors.gray[800] }]}>{loc.name}</Text>
              <Text style={[styles.lmSystemBadge, { color: colors.gray[400], backgroundColor: colors.gray[100] }]}>{t('locations.systemPreset')}</Text>
            </View>
          ))}
        </View>

        {/* 自定义位置 */}
        <View style={styles.lmSection}>
          <View style={styles.lmSectionHeader}>
            <Text style={[styles.lmSectionTitle, { color: colors.gray[400] }]}>{t('locations.custom')}</Text>
            <TouchableOpacity style={[styles.lmAddBtn, { backgroundColor: colors.primaryLight }]} onPress={() => { setShowAdd(!showAdd); setEditingId(null); setNewParentId(undefined); }}>
              <MaterialCommunityIcons name={showAdd ? 'close' : 'plus'} size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {showAdd && (
            <View style={[styles.lmAddForm, { backgroundColor: colors.white, borderColor: colors.gray[100] }]}>
              <TextInput
                style={[styles.lmInput, { borderColor: colors.gray[200], color: colors.gray[800] }]}
                value={newName}
                onChangeText={setNewName}
                placeholder={newParentId ? `${t('locations.name')} (${t('locations.parent')})` : t('locations.name')}
                placeholderTextColor={colors.gray[400]}
              />
              <TouchableOpacity style={[styles.lmIconSelect, { borderColor: colors.gray[200] }]} onPress={() => openIconPicker('add')}>
                <View style={[styles.lmIconPreview, { backgroundColor: colors.primary + '20' }]}>
                  <MaterialCommunityIcons name={newIcon as any} size={22} color={colors.primary} />
                </View>
                <Text style={[styles.lmIconSelectText, { color: colors.gray[500] }]}>{t('common.add')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray[400]} />
              </TouchableOpacity>
              {newParentId && (
                <View style={[styles.lmParentInfo, { backgroundColor: colors.gray[50] }]}>
                  <MaterialCommunityIcons name="information-outline" size={16} color={colors.gray[500]} />
                  <Text style={[styles.lmParentInfoText, { color: colors.gray[600] }]}> 
                    {`${t('locations.parent')}: ${locations.find(l => l.id === newParentId)?.name || ''}`}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.lmSaveBtn} onPress={handleAdd} activeOpacity={0.8}>
                <Text style={styles.lmSaveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {locationTree.length === 0 && !showAdd ? (
            <Text style={[styles.lmEmptyText, { color: colors.gray[400] }]}>{t('locations.empty')}</Text>
          ) : (
            locationTree.map((loc) => renderLocationItem(loc as LifeLocation & { children?: LifeLocation[] }))
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
    </View>
  );
}

const styles = StyleSheet.create({
  lmContainer: { flex: 1 },
  lmContent: { paddingBottom: 20 },
  lmSection: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
  lmSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lmSectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.semiBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  lmItem: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm },
  lmIconWrap: { width: 40, height: 40, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  lmItemName: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.medium },
  lmSystemBadge: { fontSize: fontSize.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  lmAddBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lmAddForm: { borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm, ...shadows.sm },
  lmInput: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.lg, fontSize: fontSize.xl, marginBottom: spacing.md },
  lmIconSelect: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  lmIconPreview: { width: 36, height: 36, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  lmIconSelectText: { flex: 1, fontSize: fontSize.base },
  lmAddChildBtn: { marginRight: spacing.sm },
  childrenContainer: { marginLeft: spacing.md },
  lmParentInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md },
  lmParentInfoText: { flex: 1, fontSize: fontSize.sm },
  lmEditBtn: { marginRight: spacing.sm },
  lmEditActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  lmCancelBtn: { flex: 1, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  lmCancelBtnText: { fontSize: fontSize.xl, fontWeight: fontWeight.semiBold },
  lmSaveBtn: { flex: 1, borderRadius: borderRadius.md, height: 48, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  lmSaveBtnText: { fontSize: fontSize.xl, fontWeight: fontWeight.semiBold },
  lmEmptyText: { fontSize: fontSize.base, textAlign: 'center', padding: spacing.xl },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  pickerModal: { borderTopLeftRadius: borderRadius['2xl'], borderTopRightRadius: borderRadius['2xl'], padding: spacing.xl, paddingBottom: 40, maxHeight: '70%' },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  pickerTitle: { fontSize: fontSize['4xl'], fontWeight: fontWeight.semiBold, marginBottom: spacing.lg },
  pickerScroll: { maxHeight: 400 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pickerIconItem: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  pickerIconItemActive: {},
});
