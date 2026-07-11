import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
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
import { FormActions, Input, ImagePicker, FormSection, DatePicker, ReminderToggle, ShareDialog, BottomSheet, FormCard } from '../../components/ui';
import { Toast } from '../../components/Toast';
import { showAlert } from '../../lib/alert';
import { api } from '../../lib/api';
import { scanBarcode, validateBarcode } from '../../lib/barcode';

export default function CreateItemScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string; templateId?: string }>();
  const { items, addItem, updateItem, loading } = useItemStore();
  const { categories: customCategories, fetchCategories } = useCategoryStore();
  const { locations: customLocations, fetchLocations } = useLocationStore();
  const { templates: itemTemplates, fetchTemplates: fetchItemTemplates, createTemplate } = useTemplateStore();
  const {
    resourceShares,
    mutationLoading: sharesLoading,
    fetchResourceShares,
    createShare,
    updateShare,
    deleteShare,
  } = useShareStore();
  const currentUser = useAuthStore((state) => state.user);
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
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
  const [resourceOwnerId, setResourceOwnerId] = useState<string | null>(null);
  const [sharePermission, setSharePermission] = useState<'owner' | 'view' | 'edit' | null>(null);
  const [errors, setErrors] = useState<{ name?: string; category?: string; location?: string; purchasePrice?: string; currentValue?: string; depreciationRate?: string; purchaseDate?: string }>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const [prefillAttempted, setPrefillAttempted] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

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
      setResourceOwnerId(item.user_id || null);
      setSharePermission(item.share_permission || (item.user_id === currentUser?.id ? 'owner' : null));
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
  }, [isEdit, params.id, items, prefillAttempted, currentUser?.id]);

  const allCategories = customCategories
    .filter((c) => c.type === 'item')
    .map((c) => ({ id: c.id, name: c.name, icon: c.icon || 'tag' }));
  const allLocations = customLocations.map((l) => ({ id: l.id, name: l.name, icon: l.icon || 'map-marker' }));
  const selectedCategory = allCategories.find((item) => item.id === category);
  const selectedLocation = allLocations.find((item) => item.id === location);
  const isReadOnlyShared = Boolean(isEdit && resourceOwnerId && currentUser?.id && resourceOwnerId !== currentUser.id && sharePermission === 'view');
  const canManageResource = Boolean(isEdit && params.id && resourceOwnerId && currentUser?.id && resourceOwnerId === currentUser.id);
  const recentCategoryIds = Array.from(new Set(items.filter((item) => item.category_id).sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()).map((item) => item.category_id as string))).slice(0, 4);
  const recentLocationIds = Array.from(new Set(items.filter((item) => item.location_id).sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()).map((item) => item.location_id as string))).slice(0, 4);
  const recentCategories = recentCategoryIds.map((id) => allCategories.find((item) => item.id === id)).filter(Boolean) as typeof allCategories;
  const recentLocations = recentLocationIds.map((id) => allLocations.find((item) => item.id === id)).filter(Boolean) as typeof allLocations;
  const filteredCategories = allCategories.filter((item) => item.name.toLowerCase().includes(categoryQuery.trim().toLowerCase()));
  const filteredLocations = allLocations.filter((item) => item.name.toLowerCase().includes(locationQuery.trim().toLowerCase()));

  const validate = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = '请输入物品名称';
    if (!category) newErrors.category = '请选择分类';
    if (!location) newErrors.location = '请选择存放位置';
    // 数值非负校验
    if (purchasePrice.trim() && (Number.isNaN(Number(purchasePrice)) || Number(purchasePrice) < 0)) newErrors.purchasePrice = '请输入有效购买价格';
    if (currentValue.trim() && (Number.isNaN(Number(currentValue)) || Number(currentValue) < 0)) newErrors.currentValue = '请输入有效当前估值';
    if (depreciationRate.trim() && (Number.isNaN(Number(depreciationRate)) || Number(depreciationRate) < 0)) newErrors.depreciationRate = '请输入有效折旧率';
    // 购买日期不能晚于今天
    if (purchaseDate) {
      const purDate = new Date(purchaseDate);
      if (!Number.isNaN(purDate.getTime()) && purDate.getTime() > Date.now() + 60 * 1000) {
        newErrors.purchaseDate = '购买日期不能晚于今天';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, category, location, purchasePrice, currentValue, depreciationRate, purchaseDate]);

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
      };
      if (!isEdit) itemData.user_id = user.id;
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
      if (purchasePrice || currentValue) itemData.currency = 'CNY';
      if (depreciationRate) itemData.depreciation_rate = parseFloat(depreciationRate);

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
    if (data.images) setImages(data.images);
    if (data.barcode) setBarcode(data.barcode);
    if (data.expiry_date) setExpiryDate(data.expiry_date);
    if (data.reminder_enabled !== undefined) setReminderEnabled(data.reminder_enabled);
    if (data.reminder_days_before) setReminderDaysBefore(data.reminder_days_before);
    if (data.purchase_price != null) setPurchasePrice(String(data.purchase_price));
    if (data.purchase_date) setPurchaseDate(data.purchase_date);
    if (data.current_value != null) setCurrentValue(String(data.current_value));
    if (data.depreciation_rate != null) setDepreciationRate(String(data.depreciation_rate));
    if (data.purchase_price || data.current_value || data.depreciation_rate) setShowValueSection(true);
    setErrors({});
    setShowTemplatePicker(false);
  };

  useEffect(() => {
    if (isEdit || !params.templateId || appliedTemplateId === params.templateId || itemTemplates.length === 0) return;
    const template = itemTemplates.find((item) => item.id === params.templateId);
    if (!template) return;
    handleUseTemplate(template);
    setAppliedTemplateId(params.templateId);
  }, [isEdit, params.templateId, appliedTemplateId, itemTemplates]);

  const handleSaveTemplate = async () => {
    if (!name.trim()) {
      showAlert('提示', '请先填写物品名称');
      return;
    }
    const finalName = templateName.trim() || `${name.trim()}模板`;
    const data: Record<string, any> = {
      name: name.trim(),
    };
    if (description.trim()) data.description = description.trim();
    if (category) data.category_id = category;
    if (location) data.location_id = location;
    if (images.length > 0) data.images = images.filter((item) => item.startsWith('http'));
    if (barcode.trim()) data.barcode = barcode.trim();
    if (expiryDate) data.expiry_date = expiryDate;
    data.reminder_enabled = reminderEnabled;
    data.reminder_days_before = reminderEnabled ? reminderDaysBefore : null;
    if (purchasePrice) data.purchase_price = parseFloat(purchasePrice);
    if (purchaseDate) data.purchase_date = purchaseDate;
    if (currentValue) data.current_value = parseFloat(currentValue);
    if (purchasePrice || currentValue) data.currency = 'CNY';
    if (depreciationRate) data.depreciation_rate = parseFloat(depreciationRate);

    await createTemplate({
      name: finalName,
      description: description.trim() || undefined,
      template_type: 'item',
      data,
      icon: 'package-variant',
      color: palette.orange,
    });
    setTemplateName('');
    setShowSaveTemplateModal(false);
    await fetchItemTemplates('item');
    showAlert('已保存', '物品模板已保存，可在创建页套用');
  };

  if (isReadOnlyShared) {
    return (
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <ScrollView
          style={{ backgroundColor: palette.bg }}
          contentContainerStyle={[styles.content, { backgroundColor: palette.bg }]}
        >
          <FormCard title="共享物品">
            <Text style={[styles.readOnlyTitle, { color: palette.text }]}>{name || '未命名物品'}</Text>
            {description ? <Text style={[styles.readOnlyDesc, { color: palette.textMuted }]}>{description}</Text> : null}
            <View style={styles.readOnlyRows}>
              <ReadOnlyRow icon="tag-outline" label="分类" value={selectedCategory?.name || '未设置'} palette={palette} />
              <ReadOnlyRow icon="map-marker-outline" label="位置" value={selectedLocation?.name || '未设置'} palette={palette} />
              <ReadOnlyRow icon="calendar-clock" label="有效期" value={expiryDate || '未设置'} palette={palette} />
              <ReadOnlyRow icon="image-outline" label="图片" value={images.length > 0 ? `${images.length} 张` : '无'} palette={palette} />
            </View>
          </FormCard>
          <View style={[styles.readOnlyNotice, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="eye-outline" size={18} color={palette.textMuted} />
            <Text style={[styles.readOnlyNoticeText, { color: palette.textMuted }]}>你拥有查看权限，不能编辑、删除或继续共享该物品。</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

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

          {!isEdit && (
            <TouchableOpacity
              style={[styles.templateBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => {
                setTemplateName(name.trim() ? `${name.trim()}模板` : '');
                setShowSaveTemplateModal(true);
              }}
            >
              <MaterialCommunityIcons name="content-save-outline" size={20} color={palette.orange} />
              <Text style={[styles.templateBtnText, { color: palette.text }]}>保存为模板</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
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
          <FormCard title="基础信息">
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
          </FormCard>

          <FormCard title="附加信息">
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
          </FormCard>

          <TouchableOpacity
            style={[styles.valueToggle, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={() => setShowValueSection(!showValueSection)}
          >
            <MaterialCommunityIcons name="cash-multiple" size={20} color={palette.success} />
            <Text style={[styles.valueToggleText, { color: palette.text }]}>价值信息</Text>
            <MaterialCommunityIcons name={showValueSection ? 'chevron-up' : 'chevron-down'} size={20} color={palette.textMuted} />
          </TouchableOpacity>

          {showValueSection && (
            <FormCard title="价值追踪" style={styles.valueSection}>
              <Input
                label="购买价格"
                value={purchasePrice}
                onChangeText={(value) => { setPurchasePrice(value); if (errors.purchasePrice) setErrors((e) => ({ ...e, purchasePrice: undefined })); }}
                placeholder="0.00"
                leftIcon="cash"
                keyboardType="numeric"
                error={errors.purchasePrice}
                style={styles.compactInput}
              />
              <DatePicker
                label="购买日期"
                value={purchaseDate}
                onChange={(value) => { setPurchaseDate(value); if (errors.purchaseDate) setErrors((e) => ({ ...e, purchaseDate: undefined })); }}
                icon="calendar"
                placeholder="选择购买日期"
                maxDate={new Date()}
                error={errors.purchaseDate}
              />
              <Input
                label="当前估值"
                value={currentValue}
                onChangeText={(value) => { setCurrentValue(value); if (errors.currentValue) setErrors((e) => ({ ...e, currentValue: undefined })); }}
                placeholder="0.00"
                leftIcon="cash-marker"
                keyboardType="numeric"
                error={errors.currentValue}
                style={styles.compactInput}
              />
              <Input
                label="年折旧率 (%)"
                value={depreciationRate}
                onChangeText={(value) => { setDepreciationRate(value); if (errors.depreciationRate) setErrors((e) => ({ ...e, depreciationRate: undefined })); }}
                placeholder="0"
                leftIcon="percent"
                keyboardType="numeric"
                error={errors.depreciationRate}
                style={styles.compactInput}
              />
            </FormCard>
          )}

          {canManageResource && (
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
              <TouchableOpacity
                style={[styles.contextAction, { backgroundColor: palette.surface, borderColor: palette.border }]}
                onPress={() => {
                  setTemplateName(name.trim() ? `${name.trim()}模板` : '');
                  setShowSaveTemplateModal(true);
                }}
                activeOpacity={0.82}
              >
                <MaterialCommunityIcons name="content-save-outline" size={20} color={palette.orange} />
                <View style={styles.contextActionText}>
                  <Text style={[styles.contextActionTitle, { color: palette.text }]}>保存为模板</Text>
                  <Text style={[styles.contextActionDesc, { color: palette.textMuted }]}>下次新增物品时快速预填</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
        <View style={[styles.stickyActionsShell, { backgroundColor: palette.bg, borderTopColor: palette.border }]}>
          <FormActions
            hideCancel
            onSubmit={handleSubmit}
            submitLabel={isEdit ? '保存修改' : '保存'}
            loading={loading}
            style={styles.stickyActions}
          />
        </View>
      </KeyboardAvoidingView>
      {canManageResource && (
        <ShareDialog
          visible={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          resourceType="item"
          resourceId={params.id!}
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
      <BottomSheet visible={showSaveTemplateModal} onClose={() => setShowSaveTemplateModal(false)}>
        <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
        <Text style={[styles.pickerTitle, { color: palette.text }]}>保存为模板</Text>
        <Input
          label="模板名称"
          value={templateName}
          onChangeText={setTemplateName}
          placeholder="例如：露营装备模板"
          leftIcon="file-document-outline"
        />
        <FormActions
          onCancel={() => setShowSaveTemplateModal(false)}
          onSubmit={handleSaveTemplate}
          submitLabel="保存模板"
        />
      </BottomSheet>
      <BottomSheet visible={showCategoryPicker} onClose={() => setShowCategoryPicker(false)}>
        <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
        <Text style={[styles.pickerTitle, { color: palette.text }]}>选择分类</Text>
        <View style={[styles.pickerSearchBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={palette.textMuted} />
          <TextInput
            style={[styles.pickerSearchInput, { color: palette.text }]}
            value={categoryQuery}
            onChangeText={setCategoryQuery}
            placeholder="搜索分类"
            placeholderTextColor={palette.textMuted}
            autoCorrect={false}
          />
          {categoryQuery ? (
            <TouchableOpacity onPress={() => setCategoryQuery('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle-outline" size={18} color={palette.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView style={styles.pickerList}>
          {!categoryQuery.trim() && recentCategories.length > 0 && (
            <View style={styles.recentBlock}>
              <Text style={[styles.pickerSectionTitle, { color: palette.textMuted }]}>最近使用</Text>
              {recentCategories.map((cat) => (
                <PickerItem
                  key={`recent-${cat.id}`}
                  item={cat}
                  selected={category === cat.id}
                  palette={palette}
                  onPress={() => {
                    setCategory(cat.id);
                    if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
                    setCategoryQuery('');
                    setShowCategoryPicker(false);
                  }}
                />
              ))}
            </View>
          )}
          <Text style={[styles.pickerSectionTitle, { color: palette.textMuted }]}>{categoryQuery.trim() ? '搜索结果' : '全部分类'}</Text>
          {filteredCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pickerItem, category === cat.id && { backgroundColor: palette.surfaceSoft }]}
              onPress={() => {
                setCategory(cat.id);
                if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
                setCategoryQuery('');
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
          {filteredCategories.length === 0 && (
            <Text style={[styles.pickerEmpty, { color: palette.textMuted }]}>没有匹配的分类</Text>
          )}
        </ScrollView>
      </BottomSheet>
      <BottomSheet visible={showLocationPicker} onClose={() => setShowLocationPicker(false)}>
        <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
        <Text style={[styles.pickerTitle, { color: palette.text }]}>选择位置</Text>
        <View style={[styles.pickerSearchBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons name="magnify" size={18} color={palette.textMuted} />
          <TextInput
            style={[styles.pickerSearchInput, { color: palette.text }]}
            value={locationQuery}
            onChangeText={setLocationQuery}
            placeholder="搜索位置"
            placeholderTextColor={palette.textMuted}
            autoCorrect={false}
          />
          {locationQuery ? (
            <TouchableOpacity onPress={() => setLocationQuery('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle-outline" size={18} color={palette.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView style={styles.pickerList}>
          {!locationQuery.trim() && recentLocations.length > 0 && (
            <View style={styles.recentBlock}>
              <Text style={[styles.pickerSectionTitle, { color: palette.textMuted }]}>最近使用</Text>
              {recentLocations.map((loc) => (
                <PickerItem
                  key={`recent-${loc.id}`}
                  item={loc}
                  selected={location === loc.id}
                  palette={palette}
                  onPress={() => {
                    setLocation(loc.id);
                    if (errors.location) setErrors((e) => ({ ...e, location: undefined }));
                    setLocationQuery('');
                    setShowLocationPicker(false);
                  }}
                />
              ))}
            </View>
          )}
          <Text style={[styles.pickerSectionTitle, { color: palette.textMuted }]}>{locationQuery.trim() ? '搜索结果' : '全部位置'}</Text>
          {filteredLocations.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.pickerItem, location === loc.id && { backgroundColor: palette.surfaceSoft }]}
              onPress={() => {
                setLocation(loc.id);
                if (errors.location) setErrors((e) => ({ ...e, location: undefined }));
                setLocationQuery('');
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
          {filteredLocations.length === 0 && (
            <Text style={[styles.pickerEmpty, { color: palette.textMuted }]}>没有匹配的位置</Text>
          )}
        </ScrollView>
      </BottomSheet>
      <Toast visible={toastVisible} message={isEdit ? '编辑成功' : '保存成功'} type="success" />
    </View>
  );
}

function PickerItem({
  item,
  selected,
  palette,
  onPress,
}: {
  item: { id: string; name: string; icon: string };
  selected: boolean;
  palette: typeof appDesign.dark;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.pickerItem, selected && { backgroundColor: palette.surfaceSoft }]}
      onPress={onPress}
    >
      <View style={styles.pickerItemLeft}>
        <View style={[styles.pickerItemIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons name={item.icon as any} size={18} color={palette.orange} />
        </View>
        <Text style={[styles.pickerItemName, { color: palette.text }]}>{item.name}</Text>
      </View>
      {selected && <MaterialCommunityIcons name="check-circle-outline" size={20} color={palette.orange} />}
    </TouchableOpacity>
  );
}

function ReadOnlyRow({
  icon,
  label,
  value,
  palette,
}: {
  icon: string;
  label: string;
  value: string;
  palette: typeof appDesign.dark;
}) {
  return (
    <View style={styles.readOnlyRow}>
      <MaterialCommunityIcons name={icon as any} size={18} color={palette.textMuted} />
      <Text style={[styles.readOnlyLabel, { color: palette.textMuted }]}>{label}</Text>
      <Text style={[styles.readOnlyValue, { color: palette.text }]} numberOfLines={1}>{value}</Text>
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
  readOnlyTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  readOnlyDesc: {
    fontSize: fontSize.base,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  readOnlyRows: {
    gap: spacing.sm,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 34,
  },
  readOnlyLabel: {
    width: 56,
    fontSize: fontSize.sm,
  },
  readOnlyValue: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  readOnlyNotice: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  readOnlyNoticeText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
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
  pickerSearchBox: {
    minHeight: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickerSearchInput: {
    flex: 1,
    padding: 0,
    fontSize: fontSize.base,
  },
  pickerList: {
    maxHeight: 320,
  },
  recentBlock: {
    marginBottom: spacing.sm,
  },
  pickerSectionTitle: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
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
  pickerEmpty: {
    fontSize: fontSize.base,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
