import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { usePalette, useTheme, type AppPalette } from '../../stores/themeStore';
import { Notification, useNotificationStore } from '../../stores/notificationStore';
import { EmptyState, Skeleton, AppScreen, SegmentedTabs } from '../../components/ui';

type FilterTab = 'all' | 'unread' | 'read';
const MARK_UNREAD_WIDTH = 80;

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
  palette: AppPalette;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onOpenLink: (link: string) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const isOpen = useRef(false);
  const { isDark: dark } = useTheme();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.max(-MARK_UNREAD_WIDTH, Math.min(0, lastOffset.current + g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        const nextValue = lastOffset.current + g.dx;
        const shouldOpen = g.vx < -0.5 || nextValue < -MARK_UNREAD_WIDTH / 2;
        const toValue = shouldOpen ? -MARK_UNREAD_WIDTH : 0;
        if (!isOpen.current && shouldOpen && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        isOpen.current = shouldOpen;
        lastOffset.current = toValue;
        Animated.spring(translateX, { toValue, useNativeDriver: true, damping: 22, stiffness: 260 }).start();
      },
      onPanResponderTerminate: () => {
        const toValue = isOpen.current ? -MARK_UNREAD_WIDTH : 0;
        Animated.spring(translateX, { toValue, useNativeDriver: true, damping: 22, stiffness: 260 }).start(() => { lastOffset.current = toValue; });
      },
    })
  ).current;

  const handleMarkUnread = () => {
    // Web 端不支持 expo-haptics，仅原生触发触感反馈
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isOpen.current = false;
    lastOffset.current = 0;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 260 }).start();
    onMarkAsUnread();
  };

  return (
    <View style={cardSwipe.container}>
      {/* swipe action background */}
      <View style={[cardSwipe.actionBg, { backgroundColor: palette.warning }]}>
        <TouchableOpacity style={cardSwipe.actionBtn} onPress={handleMarkUnread} activeOpacity={0.76}>
          <MaterialCommunityIcons name="email-mark-as-unread" size={18} color="#FFF" />
          <Text style={cardSwipe.actionLabel}>未读</Text>
        </TouchableOpacity>
      </View>

      {/* card body */}
      <Animated.View
        style={[
          cardSwipe.card,
          {
            backgroundColor: palette.surface,
            borderColor: isRead ? palette.border : `${palette.orange}50`,
            transform: [{ translateX }],
            ...(dark ? {} : shadows.md),
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* unread accent bar */}
        {!isRead && (
          <View style={[cardSwipe.accentBar, { backgroundColor: palette.orange }]} />
        )}

        <TouchableOpacity
          style={cardSwipe.body}
          activeOpacity={0.82}
          onPress={async () => {
            if (!notification.link) return;
            if (!isRead) await onMarkAsRead();
            onOpenLink(notification.link);
          }}
        >
          <View
            style={[
              cardSwipe.iconWrap,
              {
                backgroundColor: isRead ? palette.surfaceSoft : `${notification.iconBg}20`,
                borderColor: isRead ? palette.border : `${notification.iconBg}40`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={notification.icon as any}
              size={22}
              color={isRead ? palette.textMuted : notification.iconBg}
            />
          </View>

          <View style={cardSwipe.copy}>
            <View style={cardSwipe.titleRow}>
              <Text
                style={[
                  cardSwipe.title,
                  { color: isRead ? palette.textMuted : palette.text },
                  !isRead && { fontWeight: fontWeight.semiBold },
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {!isRead && <View style={[cardSwipe.dot, { backgroundColor: palette.danger }]} />}
            </View>
            <Text
              style={[cardSwipe.desc, { color: isRead ? palette.textDisabled : palette.textSecondary }]}
              numberOfLines={2}
            >
              {notification.desc}
            </Text>
            <Text style={[cardSwipe.time, { color: palette.textDisabled }]}>{notification.time}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function NotificationsScreen() {
  const palette = usePalette();
  const router = useRouter();
  const {
    notifications,
    readIds,
    markAsRead,
    markAllAsRead,
    markAsUnread,
    isRead,
    loadReadIds,
    loaded,
    refreshNotifications,
  } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => { void loadReadIds(); }, []);
  useEffect(() => { if (loaded) refreshNotifications(); }, [loaded]);

  const unreadCount = useMemo(() => notifications.filter((n) => !isRead(n.id)).length, [notifications, readIds, isRead]);

  const filteredNotifications = notifications.filter((n) => {
    const r = isRead(n.id);
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !r;
    return r;
  });

  const tabs: Array<{ key: FilterTab; label: string; count?: number }> = [
    { key: 'all', label: '全部', count: notifications.length },
    { key: 'unread', label: '未读', count: unreadCount },
    { key: 'read', label: '已读', count: notifications.length - unreadCount },
  ];

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <SegmentedTabs
        tabs={tabs}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* mark all read */}
      {activeTab === 'unread' && unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.markAllBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
          onPress={() => void markAllAsRead()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="check-all" size={18} color={palette.orange} />
          <Text style={[styles.markAllLabel, { color: palette.orange }]}>全部标记为已读</Text>
        </TouchableOpacity>
      )}

      {/* content */}
      {/* 首次加载时显示骨架屏，避免提前显示空状态 */}
      {!loaded ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                cardSwipe.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={cardSwipe.body}>
                <Skeleton width={44} height={44} borderRadius={borderRadius.md} />
                <View style={cardSwipe.copy}>
                  <Skeleton width="60%" height={14} />
                  <View style={{ height: spacing.xs }} />
                  <Skeleton width="85%" height={11} />
                  <View style={{ height: 4 }} />
                  <Skeleton width="25%" height={10} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          variant="notifications"
          title="暂无通知"
          description="新的提醒、系统消息和推送事件会出现在这里。"
          style={{ paddingTop: spacing['2xl'] }}
        />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          variant="notifications"
          title={activeTab === 'unread' ? '暂无未读通知' : '暂无已读通知'}
          description="切换筛选后没有匹配结果，稍后再来看看。"
          style={{ paddingTop: spacing['2xl'] }}
        />
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
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xl },
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
  markAllLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semiBold },
  list: { gap: spacing.md },
});

const cardSwipe = StyleSheet.create({
  container: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  actionBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: MARK_UNREAD_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  actionBtn: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', gap: 2 },
  actionLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: '#FFF' },
  card: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 6 },
  title: { fontSize: fontSize.base, lineHeight: 20, flexShrink: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  desc: { fontSize: fontSize.sm, lineHeight: 18 },
  time: { fontSize: fontSize.xs, marginTop: 4 },
});
