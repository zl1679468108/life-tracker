import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTodoStore } from '../../stores/todoStore';
import { LifeTodo } from '../../types';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Button, Checkbox, Loading } from '../../components/ui';
import { DeleteButton } from '../../components/DeleteButton';
import { ImagePreview } from '../../components/ui/ImagePreview';
import { showAlert } from '../../lib/alert';
import { shareTodo } from '../../lib/share';

export default function TodoDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { todos, fetchTodos, toggleComplete, deleteTodo, loading } = useTodoStore();
  const colors = useColors();
  const [todo, setTodo] = useState<LifeTodo | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    if (todos.length > 0 && id) {
      setTodo(todos.find((t) => t.id === id) || null);
    }
  }, [todos, id]);

  const handleDelete = () => {
    showAlert('确认删除？', '此操作不可撤销', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive', onPress: async () => {
          if (id) { await deleteTodo(id); router.back(); }
        },
      },
    ]);
  };

  const handleShare = () => {
    if (!todo) return;
    shareTodo({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      due_date: todo.due_date,
      completed: todo.completed,
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity onPress={handleShare} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="share-variant" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Button
            title="编辑"
            onPress={() => router.push({ pathname: '/todo/create', params: { id } })}
            variant="secondary"
            size="sm"
          />
        </View>
      ),
    });
  }, [navigation, id, todo]);

  if (loading || !todo) return <Loading overlay text="加载中..." />;

  const getPriorityInfo = (p: number) => {
    if (p === 3) return { label: '紧急', color: colors.danger, bg: colors.dangerLight, icon: 'alert-circle' };
    if (p === 2) return { label: '普通', color: colors.warning, bg: colors.warningLight, icon: 'alert' };
    return { label: '低', color: colors.success, bg: colors.successLight, icon: 'check-circle' };
  };

  const priorityInfo = getPriorityInfo(todo.priority);
  const images = todo.images || [];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const isOverdue = todo.due_date && !todo.completed && new Date(todo.due_date) < new Date();

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.gray[50] }]}>
      {/* Status + Title Hero */}
      <View style={styles.heroCard}>
        <LinearGradient
          colors={todo.completed ? [colors.success, colors.success + 'CC'] : [colors.primary, colors.primary + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <TouchableOpacity style={styles.heroCheckWrap} onPress={() => toggleComplete(todo.id)} activeOpacity={0.7}>
            <View style={[styles.heroCheck, todo.completed && styles.heroCheckDone]}>
              {todo.completed && <MaterialCommunityIcons name="check" size={20} color={colors.white} />}
            </View>
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, todo.completed && styles.heroTitleDone]} numberOfLines={3}>
              {todo.title}
            </Text>
            <Text style={styles.heroSubtitle}>
              {todo.completed ? '已完成' : '进行中'}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <View style={[styles.infoGridItem, { backgroundColor: colors.white }]}>
          <View style={[styles.infoGridIcon, { backgroundColor: priorityInfo.bg }]}>
            <MaterialCommunityIcons name={priorityInfo.icon as any} size={20} color={priorityInfo.color} />
          </View>
          <Text style={[styles.infoGridLabel, { color: colors.gray[500] }]}>优先级</Text>
          <Text style={[styles.infoGridValue, { color: priorityInfo.color }]}>{priorityInfo.label}</Text>
        </View>

        <View style={[styles.infoGridItem, { backgroundColor: colors.white }]}>
          <View style={[styles.infoGridIcon, { backgroundColor: isOverdue ? colors.dangerLight : colors.secondaryLight }]}>
            <MaterialCommunityIcons name={isOverdue ? 'alert-circle-outline' : 'calendar'} size={20} color={isOverdue ? colors.danger : colors.secondary} />
          </View>
          <Text style={[styles.infoGridLabel, { color: colors.gray[500] }]}>截止日期</Text>
          <Text style={[styles.infoGridValue, { color: colors.gray[800] }, isOverdue && { color: colors.danger }]}>
            {todo.due_date ? formatDate(todo.due_date) : '未设置'}
          </Text>
        </View>
      </View>

      {/* Description */}
      {todo.description ? (
        <View style={[styles.descCard, { backgroundColor: colors.white }]}>
          <View style={styles.descHeader}>
            <MaterialCommunityIcons name="text-box-outline" size={18} color={colors.gray[500]} />
            <Text style={[styles.descHeaderTitle, { color: colors.gray[500] }]}>描述</Text>
          </View>
          <Text style={[styles.descText, { color: colors.gray[800] }]}>{todo.description}</Text>
        </View>
      ) : null}

      {/* Images */}
      {images.length > 0 && (
        <View style={[styles.imagesCard, { backgroundColor: colors.white }]}>
          <View style={styles.imagesHeader}>
            <MaterialCommunityIcons name="image-multiple" size={18} color={colors.gray[500]} />
            <Text style={[styles.imagesHeaderTitle, { color: colors.gray[500] }]}>图片 ({images.length})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((uri, index) => (
              <TouchableOpacity key={index} onPress={() => { setPreviewIndex(index); setPreviewVisible(true); }} activeOpacity={0.8}>
                <Image source={{ uri }} style={[styles.image, { backgroundColor: colors.gray[100] }]} />
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

      {/* Time */}
      <View style={[styles.timeCard, { backgroundColor: colors.white }]}>
        <View style={styles.timeItem}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={colors.gray[400]} />
          <Text style={[styles.timeLabel, { color: colors.gray[400] }]}>创建</Text>
          <Text style={[styles.timeValue, { color: colors.gray[700] }]}>{formatDate(todo.created_at)}</Text>
        </View>
        <View style={[styles.timeDivider, { backgroundColor: colors.gray[200] }]} />
        <View style={styles.timeItem}>
          <MaterialCommunityIcons name="update" size={14} color={colors.gray[400]} />
          <Text style={[styles.timeLabel, { color: colors.gray[400] }]}>更新</Text>
          <Text style={[styles.timeValue, { color: colors.gray[700] }]}>{formatDate(todo.updated_at)}</Text>
        </View>
      </View>

      {/* Actions */}
      <DeleteButton label="删除待办" onPress={handleDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden' as const,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  heroGradient: {
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  heroCheckWrap: {
    paddingTop: 2,
  },
  heroCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCheckDone: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  heroTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoGridItem: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  infoGridIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  infoGridLabel: {
    fontSize: fontSize.sm,
    marginBottom: 2,
  },
  infoGridValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
  },
  descCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  descHeaderTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  descText: {
    fontSize: fontSize.xl,
    lineHeight: 26,
  },
  imagesCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  imagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  imagesHeaderTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  timeCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  timeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  timeLabel: {
    fontSize: fontSize.sm,
  },
  timeValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  timeDivider: {
    width: 1,
    height: 24,
  },
});
