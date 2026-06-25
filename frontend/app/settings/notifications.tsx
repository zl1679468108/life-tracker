import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Animated, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useRouter } from 'expo-router';

type FilterTab = 'unread' | 'read';

const MARK_UNREAD_WIDTH = 80;

function SwipeableNotifItem({
  notification,
  isRead,
  onMarkAsRead,
  onMarkAsUnread,
  onOpenTodo,
}: {
  notification: any;
  isRead: boolean;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onOpenTodo: (todoId: string) => void;
}) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.2,
      onPanResponderMove: (_, gs) => {
        const newValue = lastOffset.current + gs.dx;
        const clamped = Math.max(-MARK_UNREAD_WIDTH, Math.min(0, newValue));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        const newValue = lastOffset.current + gs.dx;
        let toValue = 0;
        if (isOpen.current) {
          if (gs.vx < -0.5 || newValue < -MARK_UNREAD_WIDTH / 2) {
            toValue = -MARK_UNREAD_WIDTH;
          } else {
            toValue = 0;
          }
        } else {
          if (gs.vx < -0.5 || newValue < -MARK_UNREAD_WIDTH / 2) {
            toValue = -MARK_UNREAD_WIDTH;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else {
            toValue = 0;
          }
        }
        isOpen.current = toValue !== 0;
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
      <View style={[swipeStyles.actionBackground, { backgroundColor: colors.warning }]}>
        <TouchableOpacity style={swipeStyles.actionButton} onPress={handleMarkUnread} activeOpacity={0.7}>
          <MaterialCommunityIcons name="email-mark-as-unread" size={20} color={colors.white} />
          <Text style={swipeStyles.actionText}>未读</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[
          swipeStyles.content,
          { backgroundColor: colors.white, transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.notifItem,
            { backgroundColor: colors.white },
            !isRead && styles.notifItemUnread,
            !isRead && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
          ]}
          activeOpacity={0.7}
          onPress={async () => {
            if (!notification.id.startsWith('todo-')) return;
            const todoId = notification.id.replace('todo-', '');
            if (!isRead) {
              await onMarkAsRead();
            }
            onOpenTodo(todoId);
          }}
        >
          <View style={[styles.notifIcon, { backgroundColor: notification.iconBg + '20' }]}>
            <MaterialCommunityIcons name={notification.icon as any} size={22} color={notification.iconBg} />
          </View>
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <Text
                style={[
                  styles.notifTitle,
                  { color: colors.gray[800] },
                  !isRead && styles.notifTitleUnread,
                  !isRead && { color: colors.gray[900] },
                ]}
              >
                {notification.title}
              </Text>
              {!isRead && <View style={[styles.unreadDot, { backgroundColor: colors.danger }]} />}
            </View>
            <Text style={[styles.notifDesc, { color: colors.gray[500] }]} numberOfLines={2}>
              {notification.desc}
            </Text>
            <Text style={[styles.notifTime, { color: colors.gray[400] }]}>{notification.time}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
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
  const [activeTab, setActiveTab] = useState<FilterTab>('unread');

  useEffect(() => {
    loadReadIds();
  }, []);

  useEffect(() => {
    if (loaded) {
      refreshNotifications();
    }
  }, [loaded]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAsUnread = async (id: string) => {
    await markAsUnread(id);
  };

  const filteredNotifications = notifications.filter((n) => {
    const read = isRead(n.id);
    if (activeTab === 'unread') return !read;
    return read;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'unread', label: '未读' },
    { key: 'read', label: '已读' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.gray[50] }]} contentContainerStyle={styles.content}>
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.gray[100] }]}>
            <MaterialCommunityIcons name="bell-off-outline" size={48} color={colors.gray[300]} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.gray[700] }]}>暂无通知</Text>
          <Text style={[styles.emptyDesc, { color: colors.gray[400] }]}>新的通知会显示在这里</Text>
        </View>
      ) : (
        <>
          {/* Tab 切换 */}
          <View style={[styles.tabContainer, { backgroundColor: colors.gray[100] }]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.tabActive,
                  activeTab === tab.key && { backgroundColor: colors.white },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.gray[500] },
                    activeTab === tab.key && styles.tabTextActive,
                    activeTab === tab.key && { color: colors.primary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'unread' && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllAsRead} activeOpacity={0.7}>
              <MaterialCommunityIcons name="check-all" size={20} color={colors.primary} />
              <Text style={[styles.markAllText, { color: colors.primary }]}>全部标记为已读</Text>
            </TouchableOpacity>
          )}

          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.gray[700] }]}>
                {activeTab === 'unread' ? '暂无未读通知' : '暂无已读通知'}
              </Text>
            </View>
          ) : (
            filteredNotifications.map((n) => {
              const read = isRead(n.id);
              return (
                <SwipeableNotifItem
                  key={n.id}
                  notification={n}
                  isRead={read}
                  onMarkAsRead={() => handleMarkAsRead(n.id)}
                  onMarkAsUnread={() => handleMarkAsUnread(n.id)}
                  onOpenTodo={(todoId) => router.push(`/todo/${todoId}`)}
                />
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl },
  tabContainer: { flexDirection: 'row', borderRadius: borderRadius.lg, padding: 3, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
  tabActive: { ...shadows.sm },
  tabText: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  tabTextActive: { fontWeight: fontWeight.semiBold },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: spacing.md, padding: spacing.sm },
  markAllText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, marginLeft: spacing.xs },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  emptyTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.semiBold, marginBottom: spacing.sm },
  emptyDesc: { fontSize: fontSize.base },
  notifItem: { flexDirection: 'row', borderRadius: borderRadius.lg, padding: spacing.xl, marginBottom: spacing.md, ...shadows.sm },
  notifItemUnread: { borderWidth: 1 },
  notifIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semiBold },
  notifTitleUnread: { fontWeight: fontWeight.bold },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: spacing.sm },
  notifDesc: { fontSize: fontSize.base, marginBottom: spacing.xs },
  notifTime: { fontSize: fontSize.sm },
});

const swipeStyles = StyleSheet.create({
  container: { marginBottom: spacing.md, borderRadius: borderRadius.lg, overflow: 'hidden' },
  actionBackground: { position: 'absolute', right: 0, top: 0, bottom: 0, width: MARK_UNREAD_WIDTH, justifyContent: 'center', alignItems: 'center' },
  actionButton: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', gap: 2 },
  actionText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: '#FFFFFF' },
  content: { borderRadius: borderRadius.lg },
});
