import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useItemStore } from '../../stores/itemStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useLocationStore } from '../../stores/locationStore';
import { useAuthStore } from '../../stores/authStore';
import { useTemplateStore } from '../../stores/templateStore';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Input, Button, ImagePicker, FormSection, DatePicker, ReminderToggle } from '../../components/ui';
import { Toast } from '../../components/Toast';
import { showAlert } from '../../lib/alert';
import { scanBarcode, validateBarcode } from '../../lib/barcode';

export default function CreateItemScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string }>();
  const { items, addItem, updateItem, loading } = useItemStore();
  const { categories: customCategories, fetchCategories } = useCategoryStore();
  const { locations: customLocations, fetchLocations } = useLocationStore();
  const { templates: itemTemplates, fetchTemplates: fetchItemTemplates } = useTemplateStore();
  const colors = useColors();
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
  const [errors, setErrors] = useState<{ name?: string; category?: string; location?: string }>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEdit = !!params.id;

  useEffect(() => {
    fetchCategories('item');
    fetchLocations();
    fetchItemTemplates('item');
  }, []);

  useEffect(() => {
    if (isEdit && items.length > 0) {
      const item = items.find((i) => i.id === params.id);
      if (item) {
        setName(item.name);
        setDescription(item.description || '');
        setCategory(item.category_id || '');
        setLocation(item.location_id || '');
        setImages(item.images || []);
        setBarcode(item.barcode || '');
        setExpiryDate(item.expiry_date || '');
        setReminderEnabled(item.reminder_enabled || false);
        setReminderDaysBefore(item.reminder_days_before || 7);
        if (item.purchase_price) setPurchasePrice(String(item.purchase_price));
        if (item.purchase_date) setPurchaseDate(item.purchase_date);
        if (item.current_value) setCurrentValue(String(item.current_value));
        if (item.depreciation_rate) setDepreciationRate(String(item.depreciation_rate));
        if (item.purchase_price || item.current_value) setShowValueSection(true);
      }
    }
  }, [isEdit, params.id, items]);

  const allCategories = customCategories
    .filter((c) => c.type === 'item')
    .map((c) => ({ id: c.id, name: c.name, icon: c.icon || 'tag' }));
  const allLocations = customLocations.map((l) => ({ id: l.id, name: l.name, icon: l.icon || 'map-marker' }));

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
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      showAlert('错误', isEdit ? '编辑物品失败，请重试' : '添加物品失败，请重试');
    }
  }, [name, description, category, location, images, barcode, expiryDate, reminderEnabled, reminderDaysBefore, purchasePrice, purchaseDate, currentValue, depreciationRate, addItem, updateItem, isEdit, params.id, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEdit ? '编辑物品' : '添加物品',
      headerRight: () => (
        <View style={{ flexShrink: 0 }}>
          <Button
            title="保存"
            onPress={handleSubmit}
            variant="primary"
            size="sm"
            loading={loading}
          />
        </View>
      ),
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
    <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.gray[50] }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ backgroundColor: colors.gray[50] }}
          contentContainerStyle={[styles.content, { backgroundColor: colors.gray[50] }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* 从模板创建 */}
          {!isEdit && itemTemplates.length > 0 && (
            <TouchableOpacity
              style={[styles.templateBtn, { backgroundColor: colors.secondaryLight }]}
              onPress={() => setShowTemplatePicker(true)}
            >
              <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.secondary} />
              <Text style={[styles.templateBtnText, { color: colors.secondary }]}>从模板创建</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.secondary} />
            </TouchableOpacity>
          )}

          {showTemplatePicker && (
            <View style={[styles.templatePicker, { backgroundColor: colors.white }]}>
              {itemTemplates.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.templateItem, { borderBottomColor: colors.gray[100] }]}
                  onPress={() => handleUseTemplate(t)}
                >
                  <MaterialCommunityIcons name={(t.icon || 'package-variant') as any} size={20} color={t.color || colors.primary} />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[{ fontSize: fontSize.base, color: colors.gray[800] }]}>{t.name}</Text>
                    <Text style={[{ fontSize: fontSize.xs, color: colors.gray[400] }]}>使用 {t.usage_count} 次</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.templateItem, { justifyContent: 'center' }]}
                onPress={() => setShowTemplatePicker(false)}
              >
                <Text style={[{ fontSize: fontSize.base, color: colors.gray[400] }]}>取消</Text>
              </TouchableOpacity>
            </View>
          )}
          <Input
            label="物品名称"
            value={name}
            onChangeText={(t) => { setName(t); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
            placeholder="例如：MacBook Pro"
            leftIcon="tag"
            returnKeyType="next"
            required
            error={errors.name}
          />

          <FormSection label="分类" required error={errors.category}>
            <View style={styles.optionGrid}>
              {allCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.optionItem,
                    { backgroundColor: colors.gray[100] },
                    category === cat.id && {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary,
                    }
                  ]}
                  onPress={() => { setCategory(cat.id); if (errors.category) setErrors((e) => ({ ...e, category: undefined })); }}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={20}
                    color={category === cat.id ? colors.primary : colors.gray[500]}
                  />
                  <Text style={[
                    styles.optionText,
                    { color: colors.gray[600] },
                    category === cat.id && { color: colors.primary }
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormSection>

          <FormSection label="存放位置" required error={errors.location}>
            <View style={styles.optionGrid}>
              {allLocations.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={[
                    styles.optionItem,
                    { backgroundColor: colors.gray[100] },
                    location === loc.id && {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary,
                    }
                  ]}
                  onPress={() => { setLocation(loc.id); if (errors.location) setErrors((e) => ({ ...e, location: undefined })); }}
                >
                  <MaterialCommunityIcons
                    name={loc.icon as any}
                    size={20}
                    color={location === loc.id ? colors.primary : colors.gray[500]}
                  />
                  <Text style={[
                    styles.optionText,
                    { color: colors.gray[600] },
                    location === loc.id && { color: colors.primary }
                  ]}>
                    {loc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormSection>

          <FormSection label="图片">
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

          <Input
            label="描述"
            value={description}
            onChangeText={setDescription}
            placeholder="添加物品描述..."
            multiline
            numberOfLines={3}
          />

          {/* T47: 价值信息 */}
          <TouchableOpacity
            style={[styles.valueToggle, { backgroundColor: colors.white }]}
            onPress={() => setShowValueSection(!showValueSection)}
          >
            <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.success} />
            <Text style={[styles.valueToggleText, { color: colors.gray[800] }]}>价值信息</Text>
            <MaterialCommunityIcons name={showValueSection ? 'chevron-up' : 'chevron-down'} size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          {showValueSection && (
            <View style={[styles.valueSection, { backgroundColor: colors.white }]}>
              <Input
                label="购买价格"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="0.00"
                leftIcon="cash"
                keyboardType="numeric"
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
              />
              <Input
                label="年折旧率 (%)"
                value={depreciationRate}
                onChangeText={setDepreciationRate}
                placeholder="0"
                leftIcon="percent"
                keyboardType="numeric"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 100,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  optionActive: {
    borderWidth: 1,
  },
  optionText: {
    fontSize: fontSize.base,
  },
  optionTextActive: {
    fontWeight: fontWeight.medium,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  templateBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  templatePicker: {
    borderRadius: borderRadius.lg,
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
    padding: spacing.md,
    borderRadius: borderRadius.lg,
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
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
});
