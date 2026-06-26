import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { useBorrowingStore } from '../../stores/borrowingStore';
import { useItemStore } from '../../stores/itemStore';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Input, Button, FormSection, DatePicker } from '../../components/ui';
import { Toast } from '../../components/Toast';
import { showAlert } from '../../lib/alert';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity } from 'react-native';

export default function CreateBorrowingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const colors = useColors();
  const { createBorrowing, loading } = useBorrowingStore();
  const { items } = useItemStore();

  const [selectedItemId, setSelectedItemId] = useState(params.itemId || '');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (params.itemId) {
      setSelectedItemId(params.itemId);
    }
  }, [params.itemId]);

  const availableItems = items.filter((i) => !i.is_borrowed || !params.itemId);

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
  }, [navigation, selectedItemId, borrowerName, loading, handleSubmit]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.gray[50] }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ backgroundColor: colors.gray[50] }}
          contentContainerStyle={[styles.content, { backgroundColor: colors.gray[50] }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {!params.itemId && (
            <FormSection label="选择物品" required>
              <View style={styles.itemGrid}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.itemOption,
                      { backgroundColor: colors.gray[100] },
                      selectedItemId === item.id && {
                        backgroundColor: colors.primaryLight,
                        borderColor: colors.primary,
                        borderWidth: 1,
                      },
                      item.is_borrowed && { opacity: 0.5 },
                    ]}
                    onPress={() => !item.is_borrowed && setSelectedItemId(item.id)}
                    disabled={item.is_borrowed}
                  >
                    <MaterialCommunityIcons
                      name="package-variant"
                      size={20}
                      color={selectedItemId === item.id ? colors.primary : colors.gray[500]}
                    />
                    <Text
                      style={[
                        styles.itemOptionText,
                        { color: colors.gray[600] },
                        selectedItemId === item.id && { color: colors.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {item.is_borrowed && (
                      <Text style={[styles.borrowedText, { color: colors.warning }]}>已借出</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </FormSection>
          )}

          {selectedItem && (
            <View style={[styles.selectedItemCard, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="package-variant" size={18} color={colors.primary} />
              <Text style={[styles.selectedItemText, { color: colors.primary }]}>
                借出物品：{selectedItem.name}
              </Text>
            </View>
          )}

          <Input
            label="借用人姓名"
            value={borrowerName}
            onChangeText={setBorrowerName}
            placeholder="例如：张三"
            leftIcon="account"
            required
          />

          <Input
            label="联系方式（选填）"
            value={borrowerContact}
            onChangeText={setBorrowerContact}
            placeholder="手机号/微信"
            leftIcon="phone"
          />

          <DatePicker
            label="预计归还时间（选填）"
            value={expectedReturnDate}
            onChange={setExpectedReturnDate}
            icon="calendar"
            placeholder="选择日期"
            minDate={new Date()}
          />

          <Input
            label="备注（选填）"
            value={notes}
            onChangeText={setNotes}
            placeholder="添加备注信息..."
            multiline
            numberOfLines={3}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  itemOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  itemOptionText: {
    fontSize: fontSize.base,
    flexShrink: 1,
  },
  borrowedText: {
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  selectedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  selectedItemText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
});
