import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useItemStore } from '../../stores/itemStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useLocationStore } from '../../stores/locationStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Input, Button, ImagePicker, FormSection } from '../../components/ui';
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
  const colors = useColors();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [barcode, setBarcode] = useState('');
  const [errors, setErrors] = useState<{ name?: string; category?: string; location?: string }>({});
  const [toastVisible, setToastVisible] = useState(false);

  const isEdit = !!params.id;

  useEffect(() => {
    fetchCategories('item');
    fetchLocations();
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
  }, [name, description, category, location, images, addItem, updateItem, isEdit, params.id, router]);

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
            rightIcon={
              <TouchableOpacity onPress={async () => {
                const code = await scanBarcode();
                if (code) {
                  if (validateBarcode(code)) {
                    setBarcode(code);
                  } else {
                    showAlert('提示', '条形码格式无效');
                  }
                }
              }}>
                <MaterialCommunityIcons name="barcode-scan" size={24} color={colors.primary} />
              </TouchableOpacity>
            }
          />

          <Input
            label="描述"
            value={description}
            onChangeText={setDescription}
            placeholder="添加物品描述..."
            multiline
            numberOfLines={3}
          />
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
});
