import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity, Text } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { useBorrowingStore } from '../../stores/borrowingStore';
import { useItemStore } from '../../stores/itemStore';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { usePalette } from '../../stores/themeStore';
import { Input, FormSection, DatePicker, FormActions, BottomSheet, FormCard } from '../../components/ui';
import { Toast } from '../../components/Toast';
import { showAlert } from '../../lib/alert';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CreateBorrowingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const palette = usePalette();
  const { createBorrowing, loading } = useBorrowingStore();
  const { items, fetchItems } = useItemStore();

  const [selectedItemId, setSelectedItemId] = useState(params.itemId || '');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);

  useEffect(() => {
    fetchItems();
    if (params.itemId) {
      setSelectedItemId(params.itemId);
    }
  }, [params.itemId, fetchItems]);

  const availableItems = items.filter((i) => !i.is_borrowed || i.id === params.itemId);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!selectedItemId) {
      showAlert('提示', '请选择要借出的物品');
      return;
    }
    if (!borrowerName.trim()) {
      showAlert('提示', '请输入借用人姓名');
      return;
    }

    try {
      const data: any = {
        item_id: selectedItemId,
        borrower_name: borrowerName.trim(),
      };
      if (borrowerContact.trim()) data.borrower_contact = borrowerContact.trim();
      if (expectedReturnDate) data.expected_return_date = new Date(expectedReturnDate).toISOString();
      if (notes.trim()) data.notes = notes.trim();

      await createBorrowing(data);
      await fetchItems();
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      showAlert('错误', '创建借用记录失败，请重试');
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '新增借用',
      headerRight: undefined,
    });
  }, [navigation, selectedItemId, borrowerName, loading, handleSubmit]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: palette.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ backgroundColor: palette.bg }}
          contentContainerStyle={[styles.content, { backgroundColor: palette.bg }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <FormCard title="基础信息">
            <FormSection label="借出物品" required>
              <TouchableOpacity
                style={[styles.selectorRow, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
                onPress={() => {
                  if (!params.itemId) setShowItemPicker(true);
                }}
                activeOpacity={params.itemId ? 1 : 0.82}
              >
                <View style={styles.selectorLeft}>
                  <View style={[styles.selectorIcon, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    <MaterialCommunityIcons name="package-variant" size={18} color={selectedItem ? palette.orange : palette.textMuted} />
                  </View>
                  <View style={styles.selectorCopy}>
                    <Text style={[styles.selectorValue, { color: selectedItem ? palette.text : palette.textMuted }]}>
                      {selectedItem?.name || '选择要借出的物品'}
                    </Text>
                    <Text style={[styles.selectorHint, { color: palette.textMuted }]}>
                      {params.itemId ? '从物品页上下文进入，已锁定当前物品' : '仅展示当前未借出的物品'}
                    </Text>
                  </View>
                </View>
                {!params.itemId && <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />}
              </TouchableOpacity>
            </FormSection>

            <Input
              label="借用人姓名"
              value={borrowerName}
              onChangeText={setBorrowerName}
              placeholder="例如：Lin"
              leftIcon="account"
              required
            />

            <Input
              label="联系方式"
              value={borrowerContact}
              onChangeText={setBorrowerContact}
              placeholder="手机号 / 微信 / 邮箱"
              leftIcon="phone"
            />

            <DatePicker
              label="预计归还时间"
              value={expectedReturnDate}
              onChange={setExpectedReturnDate}
              icon="calendar"
              placeholder="选择日期"
              minDate={new Date()}
            />
          </FormCard>

          <FormCard title="补充说明">
            <Input
              label="备注"
              value={notes}
              onChangeText={setNotes}
              placeholder="例如：用于露营活动，归还前一天提醒我"
              multiline
              numberOfLines={3}
            />
          </FormCard>

          <FormActions
            hideCancel
            onSubmit={handleSubmit}
            submitLabel="保存"
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomSheet visible={showItemPicker} onClose={() => setShowItemPicker(false)}>
            <View style={[styles.pickerHandle, { backgroundColor: palette.borderStrong }]} />
            <Text style={[styles.pickerTitle, { color: palette.text }]}>选择物品</Text>
            <ScrollView style={styles.pickerList}>
              {availableItems.length === 0 ? (
                <View style={styles.pickerEmpty}>
                  <Text style={[styles.pickerEmptyText, { color: palette.textMuted }]}>暂无可借出的物品</Text>
                </View>
              ) : availableItems.map((item) => {
                const disabled = Boolean(item.is_borrowed && item.id !== params.itemId);
                const selected = selectedItemId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.pickerItem, selected && { backgroundColor: palette.surfaceSoft }, disabled && { opacity: 0.5 }]}
                    onPress={() => {
                      if (disabled) return;
                      setSelectedItemId(item.id);
                      setShowItemPicker(false);
                    }}
                    disabled={disabled}
                  >
                    <View style={styles.pickerItemLeft}>
                      <View style={[styles.pickerItemIcon, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                        <MaterialCommunityIcons name="package-variant" size={18} color={selected ? palette.orange : palette.textMuted} />
                      </View>
                      <View style={styles.pickerItemCopy}>
                        <Text style={[styles.pickerItemName, { color: palette.text }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.pickerItemMeta, { color: disabled ? palette.warning : palette.textMuted }]}>
                          {disabled ? '已借出，暂不可再次借出' : '可借出'}
                        </Text>
                      </View>
                    </View>
                    {selected ? (
                      <MaterialCommunityIcons name="check-circle-outline" size={20} color={palette.orange} />
                    ) : (
                      <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
      </BottomSheet>
      <Toast visible={toastVisible} message="借用记录已创建" type="success" />
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
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  selectorIcon: {
    width: 36,
    height: 36,
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
    marginTop: 2,
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
    maxHeight: 360,
  },
  pickerEmpty: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerEmptyText: {
    fontSize: fontSize.sm,
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
  pickerItemCopy: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  pickerItemMeta: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
