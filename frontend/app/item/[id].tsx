import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useItemStore } from '../../stores/itemStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useLocationStore } from '../../stores/locationStore';
import { useShareStore } from '../../stores/shareStore';
import { useAuthStore } from '../../stores/authStore';
import { useTemplateStore } from '../../stores/templateStore';
import { LifeItem } from '../../types';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Button, Loading, ShareDialog } from '../../components/ui';
import { DeleteButton } from '../../components/DeleteButton';
import { ImagePreview } from '../../components/ui/ImagePreview';
import { showAlert } from '../../lib/alert';
import { shareItem } from '../../lib/share';

function getDaysUntilExpiry(expiryDate?: string): number {
  if (!expiryDate) return 999;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function ItemDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, fetchItems, deleteItem, loading } = useItemStore();
  const { categories: customCategories, fetchCategories } = useCategoryStore();
  const { locations: customLocations, fetchLocations } = useLocationStore();
  const { resourceShares, fetchResourceShares, createShare, updateShare, deleteShare } = useShareStore();
  const { createTemplate } = useTemplateStore();
  const { user } = useAuthStore();
  const colors = useColors();
  const [item, setItem] = useState<LifeItem | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [shareDialogVisible, setShareDialogVisible] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchCategories('item');
    fetchLocations();
  }, []);

  useEffect(() => {
    if (items.length > 0 && id) {
      setItem(items.find((i) => i.id === id) || null);
      fetchResourceShares('item', id);
    }
  }, [items, id]);

  const getCategoryInfo = (categoryId?: string) => {
    if (!categoryId) return { name: '未分类', icon: 'package-variant' as string, color: colors.gray[400] };
    const custom = customCategories.find((c) => c.id === categoryId);
    if (custom) return { name: custom.name, icon: custom.icon || 'tag', color: colors.secondary };
    return { name: categoryId, icon: 'tag', color: colors.secondary };
  };

  const getLocationName = (locationId?: string): string => {
    if (!locationId) return '未设置';
    const custom = customLocations.find((l) => l.id === locationId);
    return custom?.name || locationId;
  };

  const handleDelete = () => {
    showAlert('确认删除？', '此操作不可撤销', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        if (id) { await deleteItem(id); router.back(); }
      }},
    ]);
  };

  const handleShare = () => {
    if (!item) return;
    shareItem({
      name: item.name,
      description: item.description,
      category: categoryInfo.name,
      location: getLocationName(item.location_id),
    });
  };

  const handleOpenShareDialog = () => {
    if (!item || !id) return;
    fetchResourceShares('item', id);
    setShareDialogVisible(true);
  };

  const handleCreateShare = async (email: string, permission: 'view' | 'edit') => {
    if (!id || !user) return;
    try {
      const res = await createShare({
        shared_with_email: email,
        resource_type: 'item',
        resource_id: id,
        permission,
      });
      // 分享成功后自动跳转到对话
      if (res?.conversation_id) {
        router.push(`/message/${res.conversation_id}`);
      }
      await fetchResourceShares('item', id);
    } catch (e) {
      // error handled in store
    }
  };

  const handleUpdateSharePermission = async (shareId: string, permission: 'view' | 'edit') => {
    await updateShare(shareId, { permission });
    if (id) await fetchResourceShares('item', id);
  };

  const handleDeleteShare = async (shareId: string) => {
    await deleteShare(shareId);
    if (id) await fetchResourceShares('item', id);
  };

  const handleSaveAsTemplate = () => {
    if (!item) return;
    showAlert('保存为模板', `将「${item.name}」保存为模板？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '保存',
        onPress: async () => {
          try {
            await createTemplate({
              name: item.name,
              description: item.description,
              template_type: 'item',
              data: {
                name: item.name,
                description: item.description,
                category_id: item.category_id,
                location_id: item.location_id,
                barcode: item.barcode,
                expiry_date: item.expiry_date,
                reminder_enabled: item.reminder_enabled,
                reminder_days_before: item.reminder_days_before,
              },
              icon: categoryInfo.icon,
              color: categoryInfo.color,
            });
            showAlert('成功', '模板已保存');
          } catch (e) {
            showAlert('失败', '保存模板失败');
          }
        },
      },
    ]);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={handleShare} style={[styles.headerBtn, { backgroundColor: colors.gray[100] }]}>
            <MaterialCommunityIcons name="share-variant" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenShareDialog} style={[styles.headerBtn, { backgroundColor: colors.secondaryLight }]}>
            <MaterialCommunityIcons name="account-multiple-plus" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <Button title="编辑" onPress={() => router.push({ pathname: '/item/create', params: { id } })} variant="secondary" size="sm" />
        </View>
      ),
    });
  }, [navigation, id, item]);

  if (loading || !item) return <Loading overlay text="加载中..." />;

  const categoryInfo = getCategoryInfo(item.category_id);
  const images = item.images || [];

  return (
    <ScrollView style={{ backgroundColor: colors.gray[50] }} contentContainerStyle={[styles.content, { backgroundColor: colors.gray[50] }]}>
      <View style={[styles.headerSection, { backgroundColor: colors.white }]}>
        <LinearGradient
          colors={[categoryInfo.color, categoryInfo.color + '80']}
          style={styles.iconCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name={categoryInfo.icon as any} size={28} color={colors.white} />
        </LinearGradient>
        <View style={styles.headerText}>
          <Text style={[styles.itemName, { color: colors.gray[900] }]}>{item.name}</Text>
          {item.description ? (
            <Text style={[styles.itemDesc, { color: colors.gray[500] }]} numberOfLines={2}>{item.description}</Text>
          ) : (
            <Text style={[styles.itemDescEmpty, { color: colors.gray[300] }]}>暂无描述</Text>
          )}
        </View>
      </View>

      {item.is_borrowed && (
        <View style={[styles.infoCard, { backgroundColor: colors.warningLight, borderLeftWidth: 3, borderLeftColor: colors.warning }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <MaterialCommunityIcons name="arrow-right-bold-circle" size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: fontSize.base, fontWeight: fontWeight.semiBold, color: colors.gray[800] }]}>
                已借给 {item.borrowed_by || '他人'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push(`/settings/borrowings?itemId=${id}`)}>
              <Text style={[{ fontSize: fontSize.sm, color: colors.primary }]}>查看记录</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.infoCard, { backgroundColor: colors.white }]}>
        <View style={styles.mainInfoRow}>
          <View style={styles.mainInfoItem}>
            <MaterialCommunityIcons name="tag" size={16} color={colors.secondary} />
            <View style={styles.mainInfoText}>
              <Text style={[styles.mainInfoLabel, { color: colors.gray[400] }]}>分类</Text>
              <Text style={[styles.mainInfoValue, { color: colors.gray[800] }]}>{categoryInfo.name}</Text>
            </View>
          </View>
          <View style={styles.mainInfoItem}>
            <MaterialCommunityIcons name="map-marker" size={16} color={colors.primary} />
            <View style={styles.mainInfoText}>
              <Text style={[styles.mainInfoLabel, { color: colors.gray[400] }]}>位置</Text>
              <Text style={[styles.mainInfoValue, { color: colors.gray[800] }]}>{getLocationName(item.location_id)}</Text>
            </View>
          </View>
        </View>
      </View>

      {images.length > 0 && (
        <View style={[styles.infoCard, { backgroundColor: colors.white }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((uri, index) => (
              <TouchableOpacity key={index} onPress={() => { setPreviewIndex(index); setPreviewVisible(true); }} activeOpacity={0.8}>
                <Image
                  source={{ uri }}
                  style={[styles.image, { backgroundColor: colors.gray[100] }]}
                  cachePolicy="memory-disk"
                  transition={200}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ImagePreview
        visible={previewVisible}
        images={images}
        initialIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />

      {item.barcode && (
        <View style={[styles.infoCard, { backgroundColor: colors.white }]}>
          <View style={styles.barcodeRow}>
            <MaterialCommunityIcons name="barcode" size={20} color={colors.primary} />
            <View style={styles.barcodeText}>
              <Text style={[styles.barcodeLabel, { color: colors.gray[400] }]}>条形码</Text>
              <Text style={[styles.barcodeValue, { color: colors.gray[800], fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }]}>{item.barcode}</Text>
            </View>
          </View>
        </View>
      )}

      {item.expiry_date && (
        <View style={[styles.infoCard, { backgroundColor: colors.white }]}>
          <View style={styles.barcodeRow}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={20}
              color={getDaysUntilExpiry(item.expiry_date) < 0 ? colors.danger : getDaysUntilExpiry(item.expiry_date) <= 7 ? colors.warning : colors.success}
            />
            <View style={styles.barcodeText}>
              <Text style={[styles.barcodeLabel, { color: colors.gray[400] }]}>保质期</Text>
              <Text style={[
                styles.barcodeValue,
                { color: getDaysUntilExpiry(item.expiry_date) < 0 ? colors.danger : getDaysUntilExpiry(item.expiry_date) <= 7 ? colors.warning : colors.success }
              ]}>
                {new Date(item.expiry_date).toLocaleDateString('zh-CN')}
                {' · '}
                {getDaysUntilExpiry(item.expiry_date) < 0
                  ? `已过期${Math.abs(getDaysUntilExpiry(item.expiry_date))}天`
                  : `剩余${getDaysUntilExpiry(item.expiry_date)}天`}
              </Text>
            </View>
          </View>
          {item.reminder_enabled && (
            <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <MaterialCommunityIcons name="bell-ring" size={14} color={colors.primary} />
              <Text style={[{ fontSize: fontSize.sm, color: colors.gray[500] }]}>
                提前 {item.reminder_days_before || 7} 天提醒
              </Text>
            </View>
          )}
        </View>
      )}

      {/* T47: 价值信息 */}
      {(item.purchase_price || item.current_value) && (
        <View style={[styles.infoCard, { backgroundColor: colors.white }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.success} />
            <Text style={[{ fontSize: fontSize.lg, fontWeight: fontWeight.semiBold, color: colors.gray[900] }]}>价值信息</Text>
          </View>
          <View style={styles.mainInfoRow}>
            <View style={styles.mainInfoItem}>
              <View style={styles.mainInfoText}>
                <Text style={[styles.mainInfoLabel, { color: colors.gray[400] }]}>购买价格</Text>
                <Text style={[styles.mainInfoValue, { color: colors.success }]}>
                  {item.purchase_price ? `¥${Number(item.purchase_price).toLocaleString()}` : '-'}
                </Text>
              </View>
            </View>
            <View style={styles.mainInfoItem}>
              <View style={styles.mainInfoText}>
                <Text style={[styles.mainInfoLabel, { color: colors.gray[400] }]}>当前估值</Text>
                <Text style={[styles.mainInfoValue, { color: colors.primary }]}>
                  {item.current_value ? `¥${Number(item.current_value).toLocaleString()}` : '-'}
                </Text>
              </View>
            </View>
          </View>
          {item.purchase_date && (
            <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <MaterialCommunityIcons name="calendar" size={14} color={colors.gray[400]} />
              <Text style={[{ fontSize: fontSize.sm, color: colors.gray[500] }]}>
                购买于 {new Date(item.purchase_date).toLocaleDateString('zh-CN')}
              </Text>
            </View>
          )}
          {item.depreciation_rate && Number(item.depreciation_rate) > 0 && (
            <View style={{ marginTop: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <MaterialCommunityIcons name="percent" size={14} color={colors.warning} />
              <Text style={[{ fontSize: fontSize.sm, color: colors.gray[500] }]}>
                年折旧率 {item.depreciation_rate}%
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.infoCard, { backgroundColor: colors.white }]}>
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: colors.gray[400] }]}>添加</Text>
            <Text style={[styles.timeValue, { color: colors.gray[700] }]}>{new Date(item.created_at).toLocaleDateString('zh-CN')}</Text>
          </View>
          <View style={[styles.timeDivider, { backgroundColor: colors.gray[200] }]} />
          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: colors.gray[400] }]}>更新</Text>
            <Text style={[styles.timeValue, { color: colors.gray[700] }]}>{new Date(item.updated_at).toLocaleDateString('zh-CN')}</Text>
          </View>
        </View>
      </View>

      {/* 保存为模板 */}
      <TouchableOpacity
        style={[styles.infoCard, { backgroundColor: colors.primaryLight, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }]}
        onPress={handleSaveAsTemplate}
      >
        <MaterialCommunityIcons name="file-document-plus" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.primary }]}>
            保存为模板
          </Text>
          <Text style={[{ fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 }]}>
            快速复用此物品配置
          </Text>
        </View>
      </TouchableOpacity>

      <DeleteButton label="删除物品" onPress={handleDelete} />

      {/* 共享状态提示 */}
      {resourceShares.length > 0 && (
        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: colors.secondaryLight, borderLeftWidth: 3, borderLeftColor: colors.secondary }]}
          onPress={handleOpenShareDialog}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <MaterialCommunityIcons name="account-multiple-check" size={20} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: fontSize.base, fontWeight: fontWeight.semiBold, color: colors.gray[800] }]}>
                已共享给 {resourceShares.length} 人
              </Text>
              <Text style={[{ fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2 }]}>
                {resourceShares.map(s => s.shared_with_name).join('、')}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[400]} />
          </View>
        </TouchableOpacity>
      )}

      {id && (
        <ShareDialog
          visible={shareDialogVisible}
          onClose={() => setShareDialogVisible(false)}
          resourceType="item"
          resourceId={id}
          shares={resourceShares}
          loading={loading}
          onShare={handleCreateShare}
          onUpdatePermission={handleUpdateSharePermission}
          onDeleteShare={handleDeleteShare}
          onShareSuccess={() => setShareDialogVisible(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  itemDesc: {
    fontSize: fontSize.base,
    marginTop: 2,
  },
  itemDescEmpty: {
    fontSize: fontSize.base,
    marginTop: 2,
    fontStyle: 'italic',
  },
  infoCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  mainInfoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  mainInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mainInfoText: {
    flex: 1,
  },
  mainInfoLabel: {
    fontSize: fontSize.xs,
  },
  mainInfoValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  timeDivider: {
    width: 1,
    height: 30,
    marginHorizontal: spacing.md,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barcodeText: {
    flex: 1,
  },
  barcodeLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  barcodeValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
