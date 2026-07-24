import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTodoStore } from '../../stores/todoStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { useShareStore } from '../../stores/shareStore';
import { useTemplateStore } from '../../stores/templateStore';
import { appDesign, spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors, usePalette } from '../../stores/themeStore';
import { FormActions, Input, ImagePicker, DatePicker, ShareDialog, FormSection, FormCard, BottomSheet } from '../../components/ui';
import { Toast } from '../../components/Toast';
import { showAlert } from '../../lib/alert';
import { api } from '../../lib/api';
import { uploadImages } from '../../lib/upload';

export default function CreateTodoScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string; templateId?: string }>();
  const { todos, addTodo, updateTodo, loading } = useTodoStore();
  const { categories, fetchCategories, addCategory } = useCategoryStore();
  const {
    resourceShares,
    mutationLoading: sharesLoading,
    fetchResourceShares,
    createShare,
    updateShare,
    deleteShare,
  } = useShareStore();
  const { templates: todoTemplates, fetchTemplates: fetchTodoTemplates, createTemplate } = useTemplateStore();
  const currentUser = useAuthStore((state) => state.user);
  const colors = useColors();
  const palette = usePalette();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [dueDate, setDueDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; category?: string; description?: string; dueDate?: string; reminderDate?: string }>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [resourceOwnerId, setResourceOwnerId] = useState<string | null>(null);
  const [sharePermission, setSharePermission] = useState<'owner' | 'view' | 'edit' | null>(null);
  const [prefillAttempted, setPrefillAttempted] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

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
  const isReadOnlyShared = Boolean(isEdit && resourceOwnerId && currentUser?.id && resourceOwnerId !== currentUser.id && sharePermission === 'view');
  const canManageResource = Boolean(isEdit && params.id && resourceOwnerId && currentUser?.id && resourceOwnerId === currentUser.id);

  useEffect(() => {
    fetchCategories('todo');
    fetchTodoTemplates('todo');
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
      setResourceOwnerId(todo.user_id || null);
      setSharePermission(todo.share_permission || (todo.user_id === currentUser?.id ? 'owner' : null));
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
  }, [isEdit, params.id, todos, prefillAttempted, currentUser?.id]);

  const handleUseTemplate = (template: any) => {
    const data = template.data || {};
    if (data.title) setTitle(data.title);
    if (data.description) setDescription(data.description);
    if (data.priority) setPriority(data.priority as 1 | 2 | 3);
    if (data.category_id) setCategoryId(data.category_id);
    if (data.due_date) setDueDate(data.due_date);
    if (data.reminder_date) setReminderDate(data.reminder_date);
    if (data.images) setImages(data.images);
    setErrors({});
    setShowTemplatePicker(false);
  };

  useEffect(() => {
    if (isEdit || !params.templateId || appliedTemplateId === params.templateId || todoTemplates.length === 0) return;
    const template = todoTemplates.find((item) => item.id === params.templateId);
    if (!template) return;
    handleUseTemplate(template);
    setAppliedTemplateId(params.templateId);
  }, [isEdit, params.templateId, appliedTemplateId, todoTemplates]);

  const handleSaveTemplate = async () => {
    if (!title.trim()) {
      showAlert('提示', '请先填写待办标题');
      return;
    }
    const finalName = templateName.trim() || `${title.trim()}模板`;
    const data: Record<string, any> = {
      title: title.trim(),
      priority,
    };
    if (description.trim()) data.description = description.trim();
    if (categoryId) data.category_id = categoryId;
    if (dueDate) data.due_date = dueDate;
    if (reminderDate) data.reminder_date = reminderDate;
    if (images.length > 0) data.images = images.filter((item) => item.startsWith('http'));

    await createTemplate({
      name: finalName,
      description: description.trim() || undefined,
      template_type: 'todo',
      data,
      icon: 'checkbox-marked-circle-outline',
      color: palette.warning,
    });
    setTemplateName('');
    setShowSaveTemplateModal(false);
    await fetchTodoTemplates('todo');
    showAlert('已保存', '待办模板已保存，可在创建页套用');
  };

  const validate = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = '请输入待办标题';
    if (!categoryId) newErrors.category = '请选择分类';
    // description 非必填，与 item 表单策略统一
    if (dueDate && Number.isNaN(new Date(dueDate).getTime())) newErrors.dueDate = '截止日期无效';
    if (reminderDate) {
      const reminder = new Date(reminderDate);
      if (Number.isNaN(reminder.getTime())) {
        newErrors.reminderDate = '提醒时间无效';
      } else if (reminder.getTime() < Date.now() - 60 * 1000) {
        newErrors.reminderDate = '提醒时间不能早于当前时间';
      } else if (dueDate && !Number.isNaN(new Date(dueDate).getTime()) && reminder.getTime() > new Date(dueDate).getTime()) {
        newErrors.reminderDate = '提醒时间不能晚于截止日期';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, categoryId, dueDate, reminderDate]);

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
        completed: isEdit ? completed : false,
      };
      if (!isEdit) todoData.user_id = user.id;
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

  if (isReadOnlyShared) {
    return (
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <ScrollView
          style={{ backgroundColor: palette.bg }}
          contentContainerStyle={[styles.content, { backgroundColor: palette.bg }]}
        >
          <FormCard title="共享待办">
            <Text style={[styles.readOnlyTitle, { color: palette.text }]}>{title || '未命名待办'}</Text>
            {description ? <Text style={[styles.readOnlyDesc, { color: palette.textMuted }]}>{description}</Text> : null}
            <View style={styles.readOnlyRows}>
              <ReadOnlyRow icon="tag-outline" label="分类" value={selectedCategory?.name || '未设置'} palette={palette} />
              <ReadOnlyRow icon={(selectedPriority?.icon || 'alert-outline') as string} label="优先级" value={selectedPriority?.label || '普通'} palette={palette} />
              <ReadOnlyRow icon="calendar" label="截止" value={dueDate || '未设置'} palette={palette} />
              <ReadOnlyRow icon="bell-outline" label="提醒" value={reminderDate || '未设置'} palette={palette} />
              <ReadOnlyRow icon="check-circle-outline" label="状态" value={completed ? '已完成' : '待完成'} palette={palette} />
            </View>
          </FormCard>
          <View style={[styles.readOnlyNotice, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="eye-outline" size={18} color={palette.textMuted} />
            <Text style={[styles.readOnlyNoticeText, { color: palette.textMuted }]}>你拥有查看权限，不能编辑、删除或继续共享该待办。</Text>
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {!isEdit && todoTemplates.length > 0 && (
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
                setTemplateName(title.trim() ? `${title.trim()}模板` : '');
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
              {todoTemplates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[styles.templateItem, { borderBottomColor: palette.border }]}
                  onPress={() => handleUseTemplate(template)}
                >
                  <MaterialCommunityIcons name={(template.icon || 'checkbox-marked-circle-outline') as any} size={20} color={palette.orange} />
                  <View style={styles.templateItemCopy}>
                    <Text style={[styles.templateItemTitle, { color: palette.text }]} numberOfLines={1}>{template.name}</Text>
                    <Text style={[styles.templateItemMeta, { color: palette.textMuted }]}>使用 {template.usage_count} 次</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.templateItem, { justifyContent: 'center' }]}
                onPress={() => setShowTemplatePicker(false)}
              >
                <Text style={[styles.templateItemTitle, { color: palette.textMuted }]}>取消</Text>
              </TouchableOpacity>
            </View>
          )}

          <FormCard title="基础信息">
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
              onChange={(value) => { setDueDate(value); if (errors.dueDate || errors.reminderDate) setErrors((e) => ({ ...e, dueDate: undefined, reminderDate: undefined })); }}
              icon="calendar"
              mode="date"
              placeholder="选择截止日期"
              minDate={new Date()}
              error={errors.dueDate}
            />

            <DatePicker
              label="提醒时间"
              value={reminderDate}
              onChange={(value) => { setReminderDate(value); if (errors.reminderDate) setErrors((e) => ({ ...e, reminderDate: undefined })); }}
              icon="bell"
              mode="datetime"
              placeholder="设置提醒时间"
              minDate={new Date()}
              error={errors.reminderDate}
            />
          </FormCard>

          <FormCard title="补充说明">
            <Input
              label="描述"
              value={description}
              onChangeText={(t) => { setDescription(t); if (errors.description) setErrors({ ...errors, description: undefined }); }}
              placeholder="添加详细描述..."
              multiline
              numberOfLines={3}
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
          </FormCard>

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
                onPress={() => {
                  setTemplateName(title.trim() ? `${title.trim()}模板` : '');
                  setShowSaveTemplateModal(true);
                }}
                activeOpacity={0.82}
              >
                <MaterialCommunityIcons name="content-save-outline" size={20} color={palette.orange} />
                <View style={styles.contextActionText}>
                  <Text style={[styles.contextActionTitle, { color: palette.text }]}>保存为模板</Text>
                  <Text style={[styles.contextActionDesc, { color: palette.textMuted }]}>下次新增待办时快速预填</Text>
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
          resourceType="todo"
          resourceId={params.id!}
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

      <BottomSheet visible={showSaveTemplateModal} onClose={() => setShowSaveTemplateModal(false)}>
        <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
        <Text style={[styles.pickerTitle, { color: palette.text }]}>保存为模板</Text>
        <Input
          label="模板名称"
          value={templateName}
          onChangeText={setTemplateName}
          placeholder="例如：采购待办模板"
          leftIcon="file-document-outline"
        />
        <FormActions
          onCancel={() => setShowSaveTemplateModal(false)}
          onSubmit={handleSaveTemplate}
          submitLabel="保存模板"
        />
      </BottomSheet>

      {/* 分类选择弹窗 */}
      <BottomSheet visible={showCategoryPicker} onClose={() => setShowCategoryPicker(false)}>
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
      </BottomSheet>
      <BottomSheet visible={showPriorityPicker} onClose={() => setShowPriorityPicker(false)}>
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
      </BottomSheet>

      {/* 新建分类弹窗 */}
      <BottomSheet visible={showNewCategory} onClose={() => setShowNewCategory(false)}>
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
      </BottomSheet>

      <Toast visible={toastVisible} message={isEdit ? '编辑成功' : '保存成功'} type="success" />
    </View>
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
  templateItemCopy: {
    flex: 1,
    marginLeft: spacing.sm,
    minWidth: 0,
  },
  templateItemTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  templateItemMeta: {
    fontSize: fontSize.xs,
    marginTop: 2,
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
    textAlign: 'center',
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
