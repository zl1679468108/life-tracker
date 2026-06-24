import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Keyboard, Modal } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTodoStore } from '../../stores/todoStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Input, Button, ImagePicker, DatePicker } from '../../components/ui';
import { Toast } from '../../components/Toast';
import { showAlert } from '../../lib/alert';
import { uploadImages } from '../../lib/upload';

export default function CreateTodoScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string }>();
  const { todos, addTodo, updateTodo, loading } = useTodoStore();
  const { categories, fetchCategories, addCategory } = useCategoryStore();
  const colors = useColors();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [dueDate, setDueDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string; category?: string; description?: string }>({});
  const [toastVisible, setToastVisible] = useState(false);

  // 分类选择弹窗
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // 新建分类
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const isEdit = !!params.id;

  // 优先级配置（使用动态颜色）
  const priorities = [
    { value: 3, label: '紧急', icon: 'alert-circle', color: colors.danger },
    { value: 2, label: '普通', icon: 'alert', color: colors.warning },
    { value: 1, label: '低', icon: 'check-circle', color: colors.success },
  ];

  // 获取待办分类列表
  const todoCategories = categories.filter((c) => c.type === 'todo');

  useEffect(() => {
    fetchCategories('todo');
  }, []);

  useEffect(() => {
    if (isEdit && todos.length > 0) {
      const todo = todos.find((t) => t.id === params.id);
      if (todo) {
        setTitle(todo.title);
        setDescription(todo.description || '');
        setPriority(todo.priority as 1 | 2 | 3);
        setCategoryId(todo.category_id);
        setImages(todo.images || []);
        if (todo.due_date) setDueDate(todo.due_date);
        if (todo.reminder_date) setReminderDate(todo.reminder_date);
      }
    }
  }, [isEdit, params.id, todos]);

  const validate = (): boolean => {
    const newErrors: { title?: string; category?: string; description?: string } = {};
    if (!title.trim()) newErrors.title = '请输入待办标题';
    if (!categoryId) newErrors.category = '请选择分类';
    if (!description.trim()) newErrors.description = '请输入描述';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showAlert('提示', '请输入分类名称');
      return;
    }
    await addCategory({ name: newCategoryName.trim(), type: 'todo', icon: 'tag' });
    setNewCategoryName('');
    setShowNewCategory(false);
    fetchCategories('todo');
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

      // 先上传图片
      let uploadedImageUrls: string[] = [];
      if (images.length > 0) {
        // 过滤出本地图片（未上传的）
        const localImages = images.filter(img => !img.startsWith('http'));
        // 已有的远程图片 URL
        const remoteImages = images.filter(img => img.startsWith('http'));

        if (localImages.length > 0) {
          uploadedImageUrls = await uploadImages(localImages, user.id);
        }

        // 合并远程和本地上传的图片
        uploadedImageUrls = [...remoteImages, ...uploadedImageUrls];
      }

      const todoData: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        user_id: user.id,
      };
      if (categoryId) todoData.category_id = categoryId;
      if (dueDate) todoData.due_date = dueDate;
      if (reminderDate) todoData.reminder_date = reminderDate;
      if (uploadedImageUrls.length > 0) todoData.images = uploadedImageUrls;

      if (isEdit && params.id) {
        await updateTodo(params.id, todoData);
      } else {
        await addTodo({ ...todoData, completed: false });
      }
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      showAlert('错误', isEdit ? '编辑待办失败，请重试' : '添加待办失败，请重试');
    }
  }, [title, description, priority, categoryId, dueDate, reminderDate, images, addTodo, updateTodo, isEdit, params.id, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEdit ? '编辑待办' : '添加待办',
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
  }, [navigation, title, loading, handleSubmit, router, isEdit]);

  const selectedCategory = todoCategories.find((c) => c.id === categoryId);

  return (
    <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.gray[50] }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Input
            label="待办标题"
            value={title}
            onChangeText={(t) => { setTitle(t); if (errors.title) setErrors({}); }}
            placeholder="例如：完成项目报告"
            leftIcon="checkbox-marked-circle"
            returnKeyType="next"
            required
            error={errors.title}
          />

          {/* 分类选择 */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.gray[700] }]}>
              分类
              <Text style={[styles.requiredStar, { color: colors.danger }]}> *</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {todoCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    { borderColor: colors.gray[200], backgroundColor: colors.white },
                    categoryId === cat.id && styles.categoryChipActive,
                    categoryId === cat.id && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => { setCategoryId(cat.id); if (errors.category) setErrors({ ...errors, category: undefined }); }}
                >
                  <MaterialCommunityIcons name={(cat.icon || 'tag') as any} size={16} color={categoryId === cat.id ? colors.primary : colors.gray[500]} />
                  <Text style={[styles.categoryChipText, { color: colors.gray[500] }, categoryId === cat.id && styles.categoryChipTextActive, categoryId === cat.id && { color: colors.primary }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.categoryChip, { borderColor: colors.gray[200], backgroundColor: colors.white }]} onPress={() => setShowCategoryPicker(true)}>
                <MaterialCommunityIcons name="plus" size={16} color={colors.gray[400]} />
                <Text style={[styles.categoryChipText, { color: colors.gray[400] }]}>新建</Text>
              </TouchableOpacity>
            </ScrollView>
            {errors.category && <Text style={[styles.errorText, { color: colors.danger }]}>{errors.category}</Text>}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.gray[700] }]}>
              优先级
              <Text style={[styles.requiredStar, { color: colors.danger }]}> *</Text>
            </Text>
            <View style={styles.priorityOptions}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityOption,
                    { borderColor: colors.gray[200], backgroundColor: colors.gray[50] },
                    priority === p.value && { borderColor: p.color, backgroundColor: p.color + '10' },
                  ]}
                  onPress={() => setPriority(p.value as 1 | 2 | 3)}
                >
                  <MaterialCommunityIcons
                    name={p.icon as any}
                    size={20}
                    color={priority === p.value ? p.color : colors.gray[400]}
                  />
                  <Text style={[
                    styles.priorityText,
                    { color: colors.gray[500] },
                    priority === p.value && { color: p.color },
                  ]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="描述"
            value={description}
            onChangeText={(t) => { setDescription(t); if (errors.description) setErrors({ ...errors, description: undefined }); }}
            placeholder="添加详细描述..."
            multiline
            numberOfLines={3}
            required
            error={errors.description}
          />

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.gray[700] }]}>图片</Text>
            <ImagePicker
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />
          </View>

          <DatePicker
            label="截止日期"
            value={dueDate}
            onChange={setDueDate}
            icon="calendar"
            mode="date"
            placeholder="选择截止日期"
            minDate={new Date()}
          />

          <DatePicker
            label="提醒时间"
            value={reminderDate}
            onChange={setReminderDate}
            icon="bell"
            mode="datetime"
            placeholder="设置提醒时间"
            minDate={new Date()}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 分类选择弹窗 */}
      <Modal visible={showCategoryPicker} transparent animationType="fade" onRequestClose={() => setShowCategoryPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowCategoryPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerModal, { backgroundColor: colors.white }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerHandle, { backgroundColor: colors.gray[200] }]} />
            <Text style={[styles.pickerTitle, { color: colors.gray[900] }]}>选择分类</Text>
            <ScrollView style={styles.pickerList}>
              {todoCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.pickerItem, categoryId === cat.id && styles.pickerItemActive, categoryId === cat.id && { backgroundColor: colors.primaryLight }]}
                  onPress={() => { setCategoryId(cat.id); setShowCategoryPicker(false); }}
                >
                  <View style={styles.pickerItemLeft}>
                    <View style={[styles.pickerItemIcon, { backgroundColor: colors.primaryLight }]}>
                      <MaterialCommunityIcons name={(cat.icon || 'tag') as any} size={18} color={colors.primary} />
                    </View>
                    <Text style={[styles.pickerItemName, { color: colors.gray[800] }]}>{cat.name}</Text>
                  </View>
                  {categoryId === cat.id && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.pickerAddItem}
                onPress={() => { setShowCategoryPicker(false); setShowNewCategory(true); }}
              >
                <MaterialCommunityIcons name="plus-circle" size={20} color={colors.primary} />
                <Text style={[styles.pickerAddText, { color: colors.primary }]}>新建分类</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 新建分类弹窗 */}
      <Modal visible={showNewCategory} transparent animationType="fade" onRequestClose={() => setShowNewCategory(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowNewCategory(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerModal, { backgroundColor: colors.white }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerHandle, { backgroundColor: colors.gray[200] }]} />
            <Text style={[styles.pickerTitle, { color: colors.gray[900] }]}>新建分类</Text>
            <Input
              label="分类名称"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="输入分类名称"
            />
            <View style={styles.pickerActions}>
              <TouchableOpacity style={[styles.pickerCancelBtn, { backgroundColor: colors.gray[100] }]} onPress={() => setShowNewCategory(false)}>
                <Text style={[styles.pickerCancelBtnText, { color: colors.gray[600] }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerSaveBtn, { backgroundColor: colors.primary }]} onPress={handleCreateCategory}>
                <Text style={[styles.pickerSaveBtnText, { color: colors.white }]}>创建</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  requiredStar: {
  },
  errorText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    marginBottom: spacing.md,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  categoryChipActive: {
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  categoryChipTextActive: {
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priorityOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  priorityText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    paddingBottom: 40,
    maxHeight: '70%',
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
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  pickerItemActive: {
  },
  pickerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pickerItemIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  pickerAddItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  pickerAddText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  pickerCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCancelBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  pickerSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSaveBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
});
