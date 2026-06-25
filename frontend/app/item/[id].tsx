import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useItemStore } from '../../stores/itemStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useLocationStore } from '../../stores/locationStore';
import { LifeItem } from '../../types';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Button, Loading } from '../../components/ui';
import { DeleteButton } from '../../components/DeleteButton';
import { ImagePreview } from '../../components/ui/ImagePreview';
import { showAlert } from '../../lib/alert';
import { shareItem } from '../../lib/share';

export default function ItemDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, fetchItems, deleteItem, loading } = useItemStore();
  const { categories: customCategories, fetchCategories } = useCategoryStore();
  const { locations: customLocations, fetchLocations } = useLocationStore();
  const colors = useColors();
  const [item, setItem] = useState<LifeItem | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    fetchItems();
    fetchCategories('item');
    fetchLocations();
  }, []);

  useEffect(() => {
    if (items.length > 0 && id) {
      setItem(items.find((i) => i.id === id) || null);
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={handleShare} style={[styles.headerBtn, { backgroundColor: colors.gray[100] }]}>
            <MaterialCommunityIcons name="share-variant" size={20} color={colors.primary} />
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

      <DeleteButton label="删除物品" onPress={handleDelete} />
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
