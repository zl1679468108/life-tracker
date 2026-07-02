import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Keyboard, Modal } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useItemStore } from '../../stores/itemStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useLocationStore } from '../../stores/locationStore';
import { useAuthStore } from '../../stores/authStore';
import { useTemplateStore } from '../../stores/templateStore';
import { useShareStore } from '../../stores/shareStore';
import { appDesign, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { FormActions, Input, ImagePicker, FormSection, DatePicker, ReminderToggle, ShareDialog } from '../../components/ui';
import { Toast } from '../../components/Toast';
import { showAlert } from '../../lib/alert';
import { api } from '../../lib/api';
import { scanBarcode, validateBarcode } from '../../lib/barcode';

export default function CreateItemScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string }>();
  const { items, addItem, updateItem, loading } = useItemStore();
  const { categories: customCategories, fetchCategories } = useCategoryStore();
  const { locations: customLocations, fetchLocations } = useLocationStore();
  const { templates: itemTemplates, fetchTemplates: fetchItemTemplates } = useTemplateStore();
  const {
    resourceShares,
    loading: sharesLoading,
    fetchResourceShares,
    createShare,
    updateShare,
    deleteShare,
  } = useShareStore();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [barcode, setBarcode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(7);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [depreciationRate, setDepreciationRate] = useState('0');
  const [showValueSection, setShowValueSection] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; category?: string; location?: string }>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const [prefillAttempted, setPrefillAttempted] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const isEdit = !!params.id;

  useEffect(() => {
    fetchCategories('item');
    fetchLocations();
    fetchItemTemplates('item');
  }, []);

  useEffect(() => {
    if (isEdit && params.id) {
      fetchResourceShares('item', params.id);
    }
  }, [isEdit, params.id]);

  useEffect(() => {
    const hydrateItem = (item: any) => {
      setName(item.name);
      setDescription(item.description || '');
      setCategory(item.category_id || '');
      setLocation(item.location_id || '');
      setImages(item.images || []);
      setBarcode(item.barcode || '');
      setExpiryDate(item.expiry_date || '');
      setReminderEnabled(item.reminder_enabled || false);
      setReminderDaysBefore(item.reminder_days_before || 7);
      setPurchasePrice(item.purchase_price != null ? String(item.purchase_price) : '');
      setPurchaseDate(item.purchase_date || '');
      setCurrentValue(item.current_value != null ? String(item.current_value) : '');
      setDepreciationRate(item.depreciation_rate != null ? String(item.depreciation_rate) : '0');
      setShowValueSection(Boolean(item.purchase_price || item.current_value || item.depreciation_rate));
    };

    if (!isEdit || !params.id || prefillAttempted) return;

    const cachedItem = items.find((i) => i.id === params.id);
    if (cachedItem) {
      hydrateItem(cachedItem);
      setPrefillAttempted(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const response = await api.items.get(params.id!);
      if (!cancelled && response?.data) {
        hydrateItem(response.data);
      }
      if (!cancelled) {
        setPrefillAttempted(true);
      }
    })().catch(() => {
      if (!cancelled) {
        setPrefillAttempted(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isEdit, params.id, items, prefillAttempted]);

  const allCategories = customCategories
    .filter((c) => c.type === 'item')
    .map((c) => ({ id: c.id, name: c.name, icon: c.icon || 'tag' }));
  const allLocations = customLocations.map((l) => ({ id: l.id, name: l.name, icon: l.icon || 'map-marker' }));
  const selectedCategory = allCategories.find((item) => item.id === category);
  const selectedLocation = allLocations.find((item) => item.id === location);

  const validate = (): boolean => {
    const newErrors: { name?: string; category?: string; location?: string } = {};
    if (!name.trim()) newErrors.name = '请输入物品名称';
    if (!category) newErrors.category = '请选择分类';
    if (!location) newErrors.location = '请选择存放位置';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        showAlert('提示', '请先登录');
        router.replace('/auth/login');
        return;
      }
      const itemData: any = {
        name: name.trim(),
        category_id: category,
        location_id: location,
        user_id: user.id,
      };
      if (description.trim()) itemData.description = description.trim();
      if (images.length > 0) itemData.images = images;
      if (barcode.trim()) itemData.barcode = barcode.trim();
      if (expiryDate) {
        itemData.expiry_date = new Date(expiryDate).toISOString();
        itemData.reminder_enabled = reminderEnabled;
        itemData.reminder_days_before = reminderEnabled ? reminderDaysBefore : null;
      }
      if (purchasePrice) itemData.purchase_price = parseFloat(purchasePrice);
      if (purchaseDate) itemData.purchase_date = new Date(purchaseDate).toISOString();
      if (currentValue) itemData.current_value = parseFloat(currentValue);
      if (depreciationRate && parseFloat(depreciationRate) > 0) itemData.depreciation_rate = parseFloat(depreciationRate);

      if (isEdit && params.id) {
        await updateItem(params.id, itemData);
      } else {
        await addItem(itemData);
      }
      setSubmitSucceeded(true);
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        if (isEdit) {
          router.back();
        } else {
          router.replace('/item/list');
        }
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      showAlert('错误', isEdit ? '编辑物品失败，请重试' : '添加物品失败，请重试');
    }
  }, [name, description, category, location, images, barcode, expiryDate, reminderEnabled, reminderDaysBefore, purchasePrice, purchaseDate, currentValue, depreciationRate, addItem, updateItem, isEdit, params.id, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEdit ? '编辑物品' : '添加物品',
      headerRight: undefined,
    });
  }, [navigation, name, loading, handleSubmit, router, isEdit]);

  const handleUseTemplate = (template: any) => {
    const data = template.data;
    if (data.name) setName(data.name);
    if (data.description) setDescription(data.description);
    if (data.category_id) setCategory(data.category_id);
    if (data.location_id) setLocation(data.location_id);
    if (data.barcode) setBarcode(data.barcode);
    if (data.expiry_date) setExpiryDate(data.expiry_date);
    if (data.reminder_enabled !== undefined) setReminderEnabled(data.reminder_enabled);
    if (data.reminder_days_before) setReminderDaysBefore(data.reminder_days_before);
    setShowTemplatePicker(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: palette.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ backgroundColor: palette.bg }}
          contentContainerStyle={[styles.content, { backgroundColor: palette.bg }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {!isEdit && itemTemplates.length > 0 && (
            <TouchableOpacity
              style={[styles.templateBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => setShowTemplatePicker(true)}
            >
              <MaterialCommunityIcons name="file-document-outline" size={20} color={palette.violet} />
              <Text style={[styles.templateBtnText, { color: palette.text }]}>从模板创建</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={palette.textMuted} />
            </TouchableOpacity>
          )}

          {showTemplatePicker && (
            <View style={[styles.templatePicker, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              {itemTemplates.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.templateItem, { borderBottomColor: palette.border }]}
                  onPress={() => handleUseTemplate(t)}
                >
                  <MaterialCommunityIcons name={(t.icon || 'package-variant') as any} size={20} color={palette.orange} />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[{ fontSize: fontSize.base, color: palette.text }]}>{t.name}</Text>
                    <Text style={[{ fontSize: fontSize.xs, color: palette.textMuted }]}>使用 {t.usage_count} 次</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.templateItem, { justifyContent: 'center' }]}
                onPress={() => setShowTemplatePicker(false)}
              >
                <Text style={[{ fontSize: fontSize.base, color: palette.textMuted }]}>取消</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.cardEyebrow, { color: palette.textSecondary }]}>基础信息</Text>
            <Input
              label="物品名称"
              value={name}
              onChangeText={(t) => { setName(t); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
              placeholder="例如：露营装备箱"
              leftIcon="tag"
              returnKeyType="next"
              required
              error={errors.name}
              style={styles.compactInput}
            />

            <FormSection label="分类" required error={errors.category} density="compact">
              <TouchableOpacity
                style={[styles.selectorRow, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.82}
              >
                <View style={styles.selectorLeft}>
                  <View style={[styles.selectorIcon, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    <MaterialCommunityIcons name={(selectedCategory?.icon || 'tag') as any} size={18} color={selectedCategory ? palette.orange : palette.textMuted} />
                  </View>
                  <View style={styles.selectorCopy}>
                    <Text style={[styles.selectorValue, { color: selectedCategory ? palette.text : palette.textMuted }]}>
                      {selectedCategory?.name || '选择分类'}
                    </Text>
                    <Text style={[styles.selectorHint, { color: palette.textMuted }]}>用于归类和筛选物品</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </TouchableOpacity>
            </FormSection>

            <FormSection label="存放位置" required error={errors.location} density="compact">
              <TouchableOpacity
                style={[styles.selectorRow, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
                onPress={() => setShowLocationPicker(true)}
                activeOpacity={0.82}
              >
                <View style={styles.selectorLeft}>
                  <View style={[styles.selectorIcon, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    <MaterialCommunityIcons name={(selectedLocation?.icon || 'map-marker-outline') as any} size={18} color={selectedLocation ? palette.orange : palette.textMuted} />
                  </View>
                  <View style={styles.selectorCopy}>
                    <Text style={[styles.selectorValue, { color: selectedLocation ? palette.text : palette.textMuted }]}>
                      {selectedLocation?.name || '选择存放位置'}
                    </Text>
                    <Text style={[styles.selectorHint, { color: palette.textMuted }]}>编辑页和列表页会展示该位置</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </TouchableOpacity>
            </FormSection>

            <Input
              label="描述"
              value={description}
              onChangeText={setDescription}
              placeholder="记录品牌、数量、保质期等信息"
              multiline
              numberOfLines={3}
              style={styles.compactInput}
            />
          </View>

          <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.cardEyebrow, { color: palette.textSecondary }]}>附加信息</Text>
            <FormSection label="图片" density="compact">
              <ImagePicker
                images={images}
                onImagesChange={setImages}
                maxImages={5}
              />
            </FormSection>

            <Input
              label="条形码/二维码"
              value={barcode}
              onChangeText={setBarcode}
              placeholder="扫码或手动输入"
              leftIcon="barcode-scan"
              rightIcon="barcode-scan"
              onRightIconPress={async () => {
                const code = await scanBarcode();
                if (code) {
                  if (validateBarcode(code)) {
                    setBarcode(code);
                  } else {
                    showAlert('提示', '条形码格式无效');
                  }
                }
              }}
              style={styles.compactInput}
            />

            <DatePicker
              label="保质期/过期时间"
              value={expiryDate}
              onChange={setExpiryDate}
              icon="calendar-clock"
              placeholder="选择过期日期"
            />

            {expiryDate ? (
              <ReminderToggle
                enabled={reminderEnabled}
                daysBefore={reminderDaysBefore}
                onToggle={setReminderEnabled}
                onDaysChange={setReminderDaysBefore}
              />
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.valueToggle, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={() => setShowValueSection(!showValueSection)}
          >
            <MaterialCommunityIcons name="cash-multiple" size={20} color={palette.success} />
            <Text style={[styles.valueToggleText, { color: palette.text }]}>价值信息</Text>
            <MaterialCommunityIcons name={showValueSection ? 'chevron-up' : 'chevron-down'} size={20} color={palette.textMuted} />
          </TouchableOpacity>

          {showValueSection && (
            <View style={[styles.valueSection, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.cardEyebrow, { color: palette.textSecondary }]}>价值追踪</Text>
              <Input
                label="购买价格"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="0.00"
                leftIcon="cash"
                keyboardType="numeric"
                style={styles.compactInput}
              />
              <DatePicker
                label="购买日期"
                value={purchaseDate}
                onChange={setPurchaseDate}
                icon="calendar"
                placeholder="选择购买日期"
              />
              <Input
                label="当前估值"
                value={currentValue}
                onChangeText={setCurrentValue}
                placeholder="0.00"
                leftIcon="cash-marker"
                keyboardType="numeric"
                style={styles.compactInput}
              />
              <Input
                label="年折旧率 (%)"
                value={depreciationRate}
                onChangeText={setDepreciationRate}
                placeholder="0"
                leftIcon="percent"
                keyboardType="numeric"
                style={styles.compactInput}
              />
            </View>
          )}

          {isEdit && params.id && (
            <View style={styles.contextActions}>
              <TouchableOpacity
                style={[styles.contextAction, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => setShowShareDialog(true)}
                activeOpacity={0.82}
              >
                <MaterialCommunityIcons name="share-variant-outline" size={20} color={palette.violet} />
                <View style={styles.contextActionText}>
                  <Text style={[styles.contextActionTitle, { color: palette.text }]}>共享设置</Text>
                  <Text style={[styles.contextActionDesc, { color: palette.textMuted }]}>给好友授权查看或编辑</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contextAction, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => router.push(`/settings/borrowings?itemId=${params.id}`)}
                activeOpacity={0.82}
              >
                <MaterialCommunityIcons name="account-arrow-right-outline" size={20} color={palette.success} />
                <View style={styles.contextActionText}>
                  <Text style={[styles.contextActionTitle, { color: palette.text }]}>借用记录</Text>
                  <Text style={[styles.contextActionDesc, { color: palette.textMuted }]}>查看或新增该物品借用</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
        <View style={[styles.stickyActionsShell, { backgroundColor: palette.bg, borderTopColor: palette.border }]}>
          <FormActions
            onCancel={() => {
              if (submitSucceeded) return;
              if (isEdit) {
                router.back();
              } else {
                router.replace('/item/list');
              }
            }}
            onSubmit={handleSubmit}
            submitLabel={isEdit ? '保存修改' : '保存'}
            loading={loading}
            style={styles.stickyActions}
          />
        </View>
      </KeyboardAvoidingView>
      {isEdit && params.id && (
        <ShareDialog
          visible={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          resourceType="item"
          resourceId={params.id}
          shares={resourceShares}
          loading={sharesLoading}
          onShare={async (friendId, permission) => {
            await createShare({ resource_type: 'item', resource_id: params.id!, shared_with_id: friendId, permission });
            await fetchResourceShares('item', params.id!);
          }}
          onUpdatePermission={async (shareId, permission) => {
            await updateShare(shareId, { permission });
            await fetchResourceShares('item', params.id!);
          }}
          onDeleteShare={async (shareId) => {
            await deleteShare(shareId);
            await fetchResourceShares('item', params.id!);
          }}
        />
      )}
      <Modal visible={showCategoryPicker} transparent animationType="fade" onRequestClose={() => setShowCategoryPicker(false)}>
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={() => setShowCategoryPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerModal, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
            <Text style={[styles.pickerTitle, { color: palette.text }]}>选择分类</Text>
            <ScrollView style={styles.pickerList}>
              {allCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.pickerItem, category === cat.id && { backgroundColor: palette.surfaceSoft }]}
                  onPress={() => {
                    setCategory(cat.id);
                    if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
                    setShowCategoryPicker(false);
                  }}
                >
                  <View style={styles.pickerItemLeft}>
                    <View style={[styles.pickerItemIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                      <MaterialCommunityIcons name={cat.icon as any} size={18} color={palette.orange} />
                    </View>
                    <Text style={[styles.pickerItemName, { color: palette.text }]}>{cat.name}</Text>
                  </View>
                  {category === cat.id && <MaterialCommunityIcons name="check-circle-outline" size={20} color={palette.orange} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showLocationPicker} transparent animationType="fade" onRequestClose={() => setShowLocationPicker(false)}>
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={() => setShowLocationPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerModal, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
            <Text style={[styles.pickerTitle, { color: palette.text }]}>选择位置</Text>
            <ScrollView style={styles.pickerList}>
              {allLocations.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={[styles.pickerItem, location === loc.id && { backgroundColor: palette.surfaceSoft }]}
                  onPress={() => {
                    setLocation(loc.id);
                    if (errors.location) setErrors((e) => ({ ...e, location: undefined }));
                    setShowLocationPicker(false);
                  }}
                >
                  <View style={styles.pickerItemLeft}>
                    <View style={[styles.pickerItemIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                      <MaterialCommunityIcons name={loc.icon as any} size={18} color={palette.orange} />
                    </View>
                    <Text style={[styles.pickerItemName, { color: palette.text }]}>{loc.name}</Text>
                  </View>
                  {location === loc.id && <MaterialCommunityIcons name="check-circle-outline" size={20} color={palette.orange} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Toast visible={toastVisible} message={isEdit ? '编辑成功' : '保存成功'} type="success" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 144,
  },
  formCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardEyebrow: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.sm,
  },
  compactInput: {
    minHeight: 44,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  selectorIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorCopy: {
    flex: 1,
    minWidth: 0,
  },
  selectorValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  selectorHint: {
    fontSize: fontSize.sm,
    marginTop: 1,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  templateBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  templatePicker: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  valueToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  valueToggleText: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  valueSection: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  contextActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  contextAction: {
    minHeight: 64,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  contextActionText: {
    flex: 1,
  },
  contextActionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  contextActionDesc: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  stickyActionsShell: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  stickyActions: {
    marginTop: 0,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerModal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    paddingBottom: 40,
    maxHeight: '70%',
    borderWidth: 1,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  pickerTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.lg,
  },
  pickerList: {
    maxHeight: 320,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  pickerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  pickerItemIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    flexShrink: 1,
  },
});
