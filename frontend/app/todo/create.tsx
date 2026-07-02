import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Keyboard, Modal } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTodoStore } from '../../stores/todoStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { useShareStore } from '../../stores/shareStore';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { FormActions, Input, ImagePicker, DatePicker, ShareDialog, FormSection } from '../../components/ui';
import { Toast } from '../../components/Toast';
import { showAlert } from '../../lib/alert';
import { api } from '../../lib/api';
import { uploadImages } from '../../lib/upload';

export default function CreateTodoScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string }>();
  const { todos, addTodo, updateTodo, loading } = useTodoStore();
  const { categories, fetchCategories, addCategory } = useCategoryStore();
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [dueDate, setDueDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; category?: string; description?: string }>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [prefillAttempted, setPrefillAttempted] = useState(false);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const isEdit = !!params.id;

  // 优先级配置（使用动态颜色）
  const priorities = [
    { value: 3, label: '紧急', icon: 'alert-circle-outline', color: palette.danger },
    { value: 2, label: '普通', icon: 'alert-outline', color: palette.warning },
    { value: 1, label: '低', icon: 'check-circle-outline', color: palette.success },
  ];

  // 获取待办分类列表
  const todoCategories = categories.filter((c) => c.type === 'todo');
  const selectedCategory = todoCategories.find((item) => item.id === categoryId);
  const selectedPriority = priorities.find((item) => item.value === priority);

  useEffect(() => {
    fetchCategories('todo');
  }, []);

  useEffect(() => {
    if (isEdit && params.id) {
      fetchResourceShares('todo', params.id);
    }
  }, [isEdit, params.id]);

  useEffect(() => {
    const hydrateTodo = (todo: any) => {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setPriority(todo.priority as 1 | 2 | 3);
      setCategoryId(todo.category_id);
      setImages(todo.images || []);
      setCompleted(todo.completed);
      setDueDate(todo.due_date || '');
      setReminderDate(todo.reminder_date || '');
    };

    if (!isEdit || !params.id || prefillAttempted) return;

    const cachedTodo = todos.find((t) => t.id === params.id);
    if (cachedTodo) {
      hydrateTodo(cachedTodo);
      setPrefillAttempted(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const response = await api.todos.get(params.id!);
      if (!cancelled && response?.data) {
        hydrateTodo(response.data);
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
  }, [isEdit, params.id, todos, prefillAttempted]);

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
        completed: isEdit ? completed : false,
      };
      if (categoryId) todoData.category_id = categoryId;
      if (dueDate) todoData.due_date = dueDate;
      if (reminderDate) todoData.reminder_date = reminderDate;
      if (uploadedImageUrls.length > 0) todoData.images = uploadedImageUrls;

      if (isEdit && params.id) {
        await updateTodo(params.id, todoData);
      } else {
        await addTodo(todoData);
      }
      setSubmitSucceeded(true);
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        if (isEdit) {
          router.back();
        } else {
          router.replace('/todo/list');
        }
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      showAlert('错误', isEdit ? '编辑待办失败，请重试' : '添加待办失败，请重试');
    }
  }, [title, description, priority, categoryId, dueDate, reminderDate, images, addTodo, updateTodo, isEdit, params.id, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEdit ? '编辑待办' : '添加待办',
      headerRight: undefined,
    });
  }, [navigation, title, loading, handleSubmit, router, isEdit]);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: palette.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ backgroundColor: palette.bg }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.cardEyebrow, { color: palette.textSecondary }]}>基础信息</Text>
            <Input
              label="待办标题"
              value={title}
              onChangeText={(t) => { setTitle(t); if (errors.title) setErrors({}); }}
              placeholder="例如：补充药箱清单"
              leftIcon="checkbox-marked-circle"
              returnKeyType="next"
              required
              error={errors.title}
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
                    <Text style={[styles.selectorHint, { color: palette.textMuted }]}>用于列表筛选和状态归类</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </TouchableOpacity>
            </FormSection>

            {isEdit && (
              <FormSection label="状态" density="compact">
                <TouchableOpacity
                  style={[styles.selectorRow, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
                  onPress={() => setCompleted((value) => !value)}
                  activeOpacity={0.82}
                >
                  <View style={styles.selectorLeft}>
                    <View style={[styles.selectorIcon, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                      <MaterialCommunityIcons name={completed ? 'check-circle' : 'check-circle-outline'} size={18} color={completed ? palette.success : palette.textMuted} />
                    </View>
                    <View style={styles.selectorCopy}>
                      <Text style={[styles.selectorValue, { color: palette.text }]}>{completed ? '已完成' : '待完成'}</Text>
                    <Text style={[styles.selectorHint, { color: palette.textMuted }]}>点击切换任务完成状态</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </TouchableOpacity>
              </FormSection>
            )}

            <FormSection label="优先级" required density="compact">
              <TouchableOpacity
                style={[styles.selectorRow, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
                onPress={() => setShowPriorityPicker(true)}
                activeOpacity={0.82}
              >
                <View style={styles.selectorLeft}>
                  <View style={[styles.selectorIcon, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    <MaterialCommunityIcons name={(selectedPriority?.icon || 'alert-outline') as any} size={18} color={selectedPriority?.color || palette.textMuted} />
                  </View>
                  <View style={styles.selectorCopy}>
                    <Text style={[styles.selectorValue, { color: palette.text }]}>{selectedPriority?.label || '选择优先级'}</Text>
                    <Text style={[styles.selectorHint, { color: palette.textMuted }]}>决定待办的提醒和排序权重</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
              </TouchableOpacity>
            </FormSection>

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
          </View>

          <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <Text style={[styles.cardEyebrow, { color: palette.textSecondary }]}>补充说明</Text>
            <Input
              label="描述"
              value={description}
              onChangeText={(t) => { setDescription(t); if (errors.description) setErrors({ ...errors, description: undefined }); }}
              placeholder="添加详细描述..."
              multiline
              numberOfLines={3}
              required
              error={errors.description}
              style={styles.compactInput}
            />

            <FormSection label="图片" density="compact">
              <ImagePicker
                images={images}
                onImagesChange={setImages}
                maxImages={5}
              />
            </FormSection>
          </View>

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
                router.replace('/todo/list');
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
          resourceType="todo"
          resourceId={params.id}
          shares={resourceShares}
          loading={sharesLoading}
          onShare={async (friendId, permission) => {
            await createShare({ resource_type: 'todo', resource_id: params.id!, shared_with_id: friendId, permission });
            await fetchResourceShares('todo', params.id!);
          }}
          onUpdatePermission={async (shareId, permission) => {
            await updateShare(shareId, { permission });
            await fetchResourceShares('todo', params.id!);
          }}
          onDeleteShare={async (shareId) => {
            await deleteShare(shareId);
            await fetchResourceShares('todo', params.id!);
          }}
        />
      )}

      {/* 分类选择弹窗 */}
      <Modal visible={showCategoryPicker} transparent animationType="fade" onRequestClose={() => setShowCategoryPicker(false)}>
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={() => setShowCategoryPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerModal, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
            <Text style={[styles.pickerTitle, { color: palette.text }]}>选择分类</Text>
            <ScrollView style={styles.pickerList}>
              {todoCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.pickerItem, categoryId === cat.id && styles.pickerItemActive, categoryId === cat.id && { backgroundColor: palette.surfaceSoft }]}
                  onPress={() => {
                    setCategoryId(cat.id);
                    if (errors.category) setErrors({ ...errors, category: undefined });
                    setShowCategoryPicker(false);
                  }}
                >
                  <View style={styles.pickerItemLeft}>
                    <View style={[styles.pickerItemIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                      <MaterialCommunityIcons name={(cat.icon || 'tag') as any} size={18} color={palette.orange} />
                    </View>
                    <Text style={[styles.pickerItemName, { color: palette.text }]}>{cat.name}</Text>
                  </View>
                  {categoryId === cat.id && (
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color={palette.orange} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.pickerAddItem}
                onPress={() => { setShowCategoryPicker(false); setShowNewCategory(true); }}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={palette.orange} />
                <Text style={[styles.pickerAddText, { color: palette.orange }]}>新建分类</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showPriorityPicker} transparent animationType="fade" onRequestClose={() => setShowPriorityPicker(false)}>
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={() => setShowPriorityPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerModal, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
            <Text style={[styles.pickerTitle, { color: palette.text }]}>选择优先级</Text>
            <ScrollView style={styles.pickerList}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.pickerItem, priority === p.value && { backgroundColor: palette.surfaceSoft }]}
                  onPress={() => {
                    setPriority(p.value as 1 | 2 | 3);
                    setShowPriorityPicker(false);
                  }}
                >
                  <View style={styles.pickerItemLeft}>
                    <View style={[styles.pickerItemIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                      <MaterialCommunityIcons name={p.icon as any} size={18} color={p.color} />
                    </View>
                    <Text style={[styles.pickerItemName, { color: palette.text }]}>{p.label}</Text>
                  </View>
                  {priority === p.value && <MaterialCommunityIcons name="check-circle-outline" size={20} color={palette.orange} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 新建分类弹窗 */}
      <Modal visible={showNewCategory} transparent animationType="fade" onRequestClose={() => setShowNewCategory(false)}>
        <TouchableOpacity style={[styles.pickerOverlay, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={() => setShowNewCategory(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.pickerModal, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
            <Text style={[styles.pickerTitle, { color: palette.text }]}>新建分类</Text>
            <Input
              label="分类名称"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="输入分类名称"
            />
            <FormActions
              onCancel={() => setShowNewCategory(false)}
              onSubmit={handleCreateCategory}
              submitLabel="创建"
            />
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
  contextActions: {
    gap: spacing.sm,
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
    borderWidth: 1,
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
});
