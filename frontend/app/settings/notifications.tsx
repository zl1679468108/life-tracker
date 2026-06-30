import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { Notification, useNotificationStore } from '../../stores/notificationStore';

type FilterTab = 'all' | 'unread' | 'read';
const MARK_UNREAD_WIDTH = 84;

function SwipeableNotifItem({
  notification,
  isRead,
  palette,
  onMarkAsRead,
  onMarkAsUnread,
  onOpenLink,
}: {
  notification: Notification;
  isRead: boolean;
  palette: typeof appDesign.light;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onOpenLink: (link: string) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
      onPanResponderMove: (_, gestureState) => {
        const nextValue = lastOffset.current + gestureState.dx;
        translateX.setValue(Math.max(-MARK_UNREAD_WIDTH, Math.min(0, nextValue)));
      },
      onPanResponderRelease: (_, gestureState) => {
        const nextValue = lastOffset.current + gestureState.dx;
        const shouldOpen = gestureState.vx < -0.5 || nextValue < -MARK_UNREAD_WIDTH / 2;
        const toValue = shouldOpen ? -MARK_UNREAD_WIDTH : 0;
        if (!isOpen.current && shouldOpen) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        isOpen.current = shouldOpen;
        lastOffset.current = toValue;
        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }).start();
      },
      onPanResponderTerminate: () => {
        const toValue = isOpen.current ? -MARK_UNREAD_WIDTH : 0;
        Animated.spring(translateX, {
          toValue,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }).start(() => {
          lastOffset.current = toValue;
        });
      },
    })
  ).current;

  const handleMarkUnread = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isOpen.current = false;
    lastOffset.current = 0;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
    onMarkAsUnread();
  };

  return (
    <View style={swipeStyles.container}>
      <View style={[swipeStyles.actionBackground, { backgroundColor: palette.warning }]}>
        <TouchableOpacity style={swipeStyles.actionButton} onPress={handleMarkUnread} activeOpacity={0.76}>
          <MaterialCommunityIcons name="email-mark-as-unread" size={20} color="#FFFFFF" />
          <Text style={swipeStyles.actionText}>未读</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          swipeStyles.content,
          {
            backgroundColor: isRead ? palette.surface : '#FFF4EC',
            borderColor: isRead ? palette.border : palette.orange,
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.notificationCard}
          activeOpacity={0.82}
          onPress={async () => {
            if (!notification.link) return;
            if (!isRead) {
              await onMarkAsRead();
            }
            onOpenLink(notification.link);
          }}
        >
          <View style={[styles.notificationIconWrap, { backgroundColor: `${notification.iconBg}18`, borderColor: palette.border }]}>
            <MaterialCommunityIcons name={notification.icon as any} size={20} color={notification.iconBg} />
          </View>

          <View style={styles.notificationCopy}>
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.notificationTitle,
                  { color: palette.text },
                  !isRead && { fontWeight: fontWeight.bold },
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {!isRead && <View style={[styles.unreadDot, { backgroundColor: palette.danger }]} />}
            </View>
            <Text style={[styles.notificationDesc, { color: palette.textSecondary }]} numberOfLines={2}>
              {notification.desc}
            </Text>
            <Text style={[styles.notificationTime, { color: palette.textMuted }]}>{notification.time}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const router = useRouter();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    markAsUnread,
    isRead,
    loadReadIds,
    loaded,
    refreshNotifications,
  } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    void loadReadIds();
  }, []);

  useEffect(() => {
    if (loaded) {
      refreshNotifications();
    }
  }, [loaded]);

  const unreadCount = useMemo(() => notifications.filter((item) => !isRead(item.id)).length, [notifications, isRead]);

  const filteredNotifications = notifications.filter((item) => {
    const read = isRead(item.id);
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !read;
    return read;
  });

  const tabs: Array<{ key: FilterTab; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'unread', label: '未读' },
    { key: 'read', label: '已读' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: palette.textSecondary }]}>数据与提醒</Text>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: palette.text }]}>通知中心</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              集中查看待办提醒、系统消息和推送事件，并在这里统一管理已读状态。
            </Text>
          </View>
          <View style={[styles.summaryBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <Text style={[styles.summaryValue, { color: palette.text }]}>{unreadCount}</Text>
            <Text style={[styles.summaryLabel, { color: palette.textMuted }]}>未读通知</Text>
          </View>
        </View>
      </View>

      <View style={[styles.segmentWrap, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.segmentButton,
              activeTab === tab.key && { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.82}
          >
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === tab.key ? palette.text : palette.textMuted },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'unread' && unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.markAllBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
          onPress={() => void markAllAsRead()}
          activeOpacity={0.82}
        >
          <MaterialCommunityIcons name="check-all" size={18} color={palette.orange} />
          <Text style={[styles.markAllText, { color: palette.orange }]}>全部标记为已读</Text>
        </TouchableOpacity>
      )}

      {notifications.length === 0 ? (
        <View style={[styles.emptyPanel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="bell-off-outline" size={28} color={palette.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>暂无通知</Text>
          <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>新的提醒、系统消息和推送事件会出现在这里。</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={[styles.emptyPanel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="email-outline" size={28} color={palette.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>
            {activeTab === 'unread' ? '暂无未读通知' : activeTab === 'read' ? '暂无已读通知' : '暂无通知'}
          </Text>
          <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>切换筛选后没有匹配结果，稍后再来看看。</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredNotifications.map((notification) => {
            const read = isRead(notification.id);
            return (
              <SwipeableNotifItem
                key={notification.id}
                notification={notification}
                isRead={read}
                palette={palette}
                onMarkAsRead={() => markAsRead(notification.id)}
                onMarkAsUnread={() => markAsUnread(notification.id)}
                onOpenLink={(link) => router.push(link as any)}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  eyebrow: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold, marginBottom: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerCopy: { flex: 1 },
  title: { fontSize: fontSize['5xl'], fontWeight: fontWeight.bold },
  subtitle: { fontSize: fontSize.base, marginTop: spacing.xs },
  summaryBadge: {
    minWidth: 88,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'flex-start',
  },
  summaryValue: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold },
  summaryLabel: { fontSize: fontSize.sm, marginTop: 2 },
  segmentWrap: {
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: { fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  markAllText: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold },
  list: { paddingBottom: spacing.md },
  notificationCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  notificationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationCopy: { flex: 1, minWidth: 0 },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  notificationTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semiBold, flexShrink: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: spacing.sm },
  notificationDesc: { fontSize: fontSize.base, lineHeight: 22, marginBottom: spacing.xs },
  notificationTime: { fontSize: fontSize.sm },
  emptyPanel: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semiBold, marginBottom: spacing.sm },
  emptyDesc: { fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20 },
});

const swipeStyles = StyleSheet.create({
  container: { marginBottom: spacing.md, borderRadius: borderRadius.lg, overflow: 'hidden' },
  actionBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: MARK_UNREAD_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', gap: 2 },
  actionText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: '#FFFFFF' },
  content: { borderWidth: 1, borderRadius: borderRadius.lg },
});
