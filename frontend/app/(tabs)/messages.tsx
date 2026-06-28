import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeScreen } from '../../components/SafeScreen';
import { SwipeableRow } from '../../components/SwipeableRow';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { api } from '../../lib/api';
import { showAlert } from '../../lib/alert';
import { socketService } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../stores/themeStore';
import { useConversationStore } from '../../stores/conversationStore';
import type { LifeFriend } from '../../types';

type Palette = typeof appDesign.dark;

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getMessageIcon(type?: string): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (type) {
    case 'item':
      return 'package-variant-closed';
    case 'todo':
      return 'check-circle-outline';
    case 'system':
      return 'bell-outline';
    default:
      return 'message-text-outline';
  }
}

function getMessageSummary(msg: { type?: string; content?: string } | null) {
  if (!msg) return '暂无消息';
  if (msg.type === 'item') return '分享了一件物品';
  if (msg.type === 'todo') return '分享了一条待办';
  if (msg.type === 'system') return msg.content || '系统通知';
  return msg.content || '暂无消息';
}

function AvatarWord({ name, palette }: { name?: string; palette: Palette }) {
  return (
    <View style={[styles.avatar, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
      <Text style={[styles.avatarText, { color: palette.orange }]}>{(name || '友').slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { conversations, loading, error, fetchConversations } = useConversationStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatMode, setNewChatMode] = useState<'search' | 'friends'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friends, setFriends] = useState<LifeFriend[]>([]);
  const [friendRequests, setFriendRequests] = useState<LifeFriend[]>([]);
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    fetchConversations();
    const handleConversationUpdated = () => fetchConversations();
    const handleFriendUpdated = () => {
      fetchFriends();
      fetchFriendRequests();
    };
    socketService.onConversationUpdated(handleConversationUpdated);
    socketService.onFriendRequestUpdated(handleFriendUpdated);
    return () => socketService.removeAllListeners();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.trim();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.messages.searchUsers(q);
        if (res.data) setSearchResults(res.data);
      } catch {
        // Search errors are non-blocking in the create-chat sheet.
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const closeSheet = () => {
    setShowNewChat(false);
    setSearchQuery('');
    setSelectedUserId(null);
    setSearchResults([]);
    setNewChatMode('search');
    setFriends([]);
    setFriendRequests([]);
    setRequestMessage('');
    Keyboard.dismiss();
  };

  const fetchFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const res = await api.messages.friends();
      if (res.data) setFriends(res.data);
    } catch {
      // ignore
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  const fetchFriendRequests = useCallback(async () => {
    try {
      const res = await api.messages.friendRequests();
      if (res.data) setFriendRequests(res.data);
    } catch {
      // ignore
    }
  }, []);

  const handleSendFriendRequest = async () => {
    if (!selectedUserId) return;
    setCreating(true);
    try {
      await api.messages.sendFriendRequest({
        target_user_id: selectedUserId,
        message: requestMessage.trim() || undefined,
      });
      showAlert('申请已发送', '对方同意后即可开始对话。');
      setSelectedUserId(null);
      setSearchQuery('');
      setRequestMessage('');
      await fetchFriendRequests();
    } catch {
      showAlert('发送失败', '好友申请发送失败，请稍后重试。');
    } finally {
      setCreating(false);
    }
  };

  const handleRespondRequest = async (id: string, action: 'accept' | 'reject') => {
    try {
      await api.messages.respondFriendRequest(id, action);
      await Promise.all([fetchFriendRequests(), fetchFriends(), fetchConversations()]);
    } catch {
      showAlert('处理失败', '好友申请处理失败，请稍后重试。');
    }
  };

  const handleTogglePin = async (friend: LifeFriend) => {
    try {
      await api.messages.setFriendPinned(friend.id, !friend.pinned);
      await fetchFriends();
    } catch {
      showAlert('操作失败', '好友置顶状态更新失败，请稍后重试。');
    }
  };

  const handleDeleteFriend = async (friend: LifeFriend) => {
    showAlert('删除好友', `确认删除好友「${friend.friend.display_name}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.messages.deleteFriend(friend.id);
            if (selectedUserId === friend.friend.id) setSelectedUserId(null);
            await Promise.all([fetchFriends(), fetchConversations()]);
          } catch {
            showAlert('删除失败', '好友删除失败，请稍后重试。');
          }
        },
      },
    ]);
  };

  const handleCreateChat = async () => {
    if (!selectedUserId || !user) return;
    setCreating(true);
    try {
      const res = await api.messages.createManualConversation({
        participant_ids: [user.id, selectedUserId],
      });
      if (res.data?.conversation) {
        closeSheet();
        router.push(`/message/${res.data.conversation.id}` as never);
        await fetchConversations();
      }
    } catch {
      // error handled by API layer
    } finally {
      setCreating(false);
    }
  };

  const openFriends = async () => {
    setNewChatMode('friends');
    setSelectedUserId(null);
    await Promise.all([fetchFriends(), fetchFriendRequests()]);
  };

  if (loading && conversations.length === 0) {
    return (
      <SafeScreen backgroundColor={palette.bg}>
        <View style={[styles.center, { backgroundColor: palette.bg }]}>
          <ActivityIndicator size="large" color={palette.orange} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen backgroundColor={palette.bg}>
      <View style={[styles.container, { backgroundColor: palette.bg }]}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.orange} colors={[palette.orange]} />}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: palette.text }]}>消息</Text>
            </View>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
              onPress={() => setShowNewChat(true)}
              activeOpacity={0.82}
            >
              <MaterialCommunityIcons name="message-plus-outline" size={21} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={palette.textMuted} />
            <Text style={[styles.searchText, { color: palette.textMuted }]}>搜索对话</Text>
          </View>

          {error && conversations.length === 0 ? (
            <View style={[styles.emptyPanel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={palette.danger} />
              <Text style={[styles.emptyTitle, { color: palette.text }]}>消息加载失败</Text>
              <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>{error}</Text>
            </View>
          ) : conversations.length === 0 ? (
            <View style={[styles.emptyPanel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <MaterialCommunityIcons name="message-text-outline" size={30} color={palette.textMuted} />
              <Text style={[styles.emptyTitle, { color: palette.text }]}>暂无对话</Text>
              <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>分享物品或待办时会自动创建对话，也可以主动发起新对话。</Text>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: palette.orange }]} onPress={() => setShowNewChat(true)} activeOpacity={0.84}>
                <Text style={styles.primaryButtonText}>发起对话</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {conversations.map((conv) => {
                const otherUser = conv.other_user;
                const lastMsg = conv.last_message;
                const hasUnread = (conv.unread_count ?? 0) > 0;
                return (
                  <TouchableOpacity
                    key={conv.id}
                    style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border }]}
                    onPress={() => router.push(`/message/${conv.id}` as never)}
                    activeOpacity={0.82}
                  >
                    <AvatarWord name={otherUser?.display_name} palette={palette} />
                    <View style={styles.rowContent}>
                      <View style={styles.rowHead}>
                        <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>
                          {otherUser?.display_name || '未知用户'}
                        </Text>
                        <Text style={[styles.timeText, { color: palette.textMuted }]}>
                          {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                        </Text>
                      </View>
                      <View style={styles.previewLine}>
                        <MaterialCommunityIcons name={getMessageIcon(lastMsg?.type)} size={14} color={palette.textMuted} />
                        <Text style={[styles.previewText, { color: palette.textMuted }]} numberOfLines={1}>
                          {getMessageSummary(lastMsg ?? null)}
                        </Text>
                      </View>
                    </View>
                    {hasUnread && (
                      <View style={[styles.unreadBadge, { backgroundColor: palette.orange }]}>
                        <Text style={styles.unreadText}>{(conv.unread_count ?? 0) > 99 ? '99+' : String(conv.unread_count ?? 0)}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {showNewChat && (
          <View style={styles.overlay}>
            <TouchableOpacity style={[styles.overlayBackdrop, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={closeSheet} />
            <View style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: palette.text }]}>{newChatMode === 'search' ? '添加好友' : '好友列表'}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeSheet}>
                  <MaterialCommunityIcons name="close" size={22} color={palette.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={[styles.segment, { backgroundColor: palette.surfaceSoft }]}>
                <TouchableOpacity
                  style={[styles.segmentItem, newChatMode === 'search' && { backgroundColor: palette.surface, borderColor: palette.border }]}
                  onPress={() => {
                    setNewChatMode('search');
                    setSelectedUserId(null);
                  }}
                  activeOpacity={0.82}
                >
                  <MaterialCommunityIcons name="magnify" size={16} color={newChatMode === 'search' ? palette.orange : palette.textMuted} />
                  <Text style={[styles.segmentText, { color: newChatMode === 'search' ? palette.text : palette.textMuted }]}>添加好友</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentItem, newChatMode === 'friends' && { backgroundColor: palette.surface, borderColor: palette.border }]}
                  onPress={openFriends}
                  activeOpacity={0.82}
                >
                  <MaterialCommunityIcons name="account-multiple-outline" size={16} color={newChatMode === 'friends' ? palette.orange : palette.textMuted} />
                  <Text style={[styles.segmentText, { color: newChatMode === 'friends' ? palette.text : palette.textMuted }]}>好友列表</Text>
                </TouchableOpacity>
              </View>

              {newChatMode === 'search' ? (
                <>
                  <View style={[styles.inputBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                    <MaterialCommunityIcons name="magnify" size={20} color={palette.textMuted} />
                    <TextInput
                      style={[styles.input, { color: palette.text }]}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="搜索邮箱或用户名"
                      placeholderTextColor={palette.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialCommunityIcons name="close-circle-outline" size={18} color={palette.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {searching ? (
                    <SheetStatus palette={palette} text="搜索中..." />
                  ) : searchQuery.trim() && searchResults.length === 0 ? (
                    <SheetStatus palette={palette} text="未找到匹配的用户" icon="account-off-outline" />
                  ) : (
                    <ScrollView style={styles.resultList} nestedScrollEnabled>
                      {searchResults.map((u) => (
                        <UserPickRow
                          key={u.id}
                          id={u.id}
                          name={u.display_name}
                          desc={u.email}
                          selected={selectedUserId === u.id}
                          palette={palette}
                          onPress={() => setSelectedUserId(u.id)}
                        />
                      ))}
                    </ScrollView>
                  )}
                  {selectedUserId && (
                    <View style={[styles.inputBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                      <MaterialCommunityIcons name="message-text-outline" size={18} color={palette.textMuted} />
                      <TextInput
                        style={[styles.input, { color: palette.text }]}
                        value={requestMessage}
                        onChangeText={setRequestMessage}
                        placeholder="验证消息（选填）"
                        placeholderTextColor={palette.textMuted}
                      />
                    </View>
                  )}
                </>
              ) : friendsLoading ? (
                <SheetStatus palette={palette} text="加载中..." />
              ) : friends.length === 0 && friendRequests.filter((r) => r.direction === 'incoming').length === 0 ? (
                <SheetStatus palette={palette} text="暂无已通过好友，先发送好友申请" icon="account-group-outline" />
              ) : (
                <ScrollView style={styles.resultList} nestedScrollEnabled>
                  {friendRequests.filter((r) => r.direction === 'incoming').map((r) => (
                    <View key={r.id} style={[styles.requestRow, { borderColor: palette.border, backgroundColor: palette.surfaceSoft }]}>
                      <AvatarWord name={r.friend.display_name} palette={palette} />
                      <View style={styles.userText}>
                        <Text style={[styles.userName, { color: palette.text }]}>{r.friend.display_name}</Text>
                        <Text style={[styles.userDesc, { color: palette.textMuted }]}>{r.request_message || '请求添加你为好友'}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRespondRequest(r.id, 'reject')} style={styles.requestIconBtn}>
                        <MaterialCommunityIcons name="close" size={18} color={palette.danger} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRespondRequest(r.id, 'accept')} style={styles.requestIconBtn}>
                        <MaterialCommunityIcons name="check" size={18} color={palette.success} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {friends.map((f) => (
                    <SwipeableRow key={f.id} onDelete={() => handleDeleteFriend(f)}>
                      <UserPickRow
                        id={f.friend.id}
                        name={f.friend.display_name}
                        desc={f.friend.email || undefined}
                        selected={selectedUserId === f.friend.id}
                        palette={palette}
                        onPress={() => setSelectedUserId(f.friend.id)}
                        trailing={
                          <TouchableOpacity
                            style={styles.requestIconBtn}
                            onPress={() => handleTogglePin(f)}
                            activeOpacity={0.78}
                          >
                            <MaterialCommunityIcons
                              name={f.pinned ? 'star' : 'star-outline'}
                              size={20}
                              color={f.pinned ? palette.warning : palette.textMuted}
                            />
                          </TouchableOpacity>
                        }
                      />
                    </SwipeableRow>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: selectedUserId ? palette.orange : palette.surfaceHover }]}
                onPress={newChatMode === 'search' ? handleSendFriendRequest : handleCreateChat}
                disabled={!selectedUserId || creating}
                activeOpacity={0.84}
              >
                {creating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.createText}>{newChatMode === 'search' ? '发送申请' : '发起对话'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeScreen>
  );
}

function SheetStatus({ palette, text, icon }: { palette: Palette; text: string; icon?: keyof typeof MaterialCommunityIcons.glyphMap }) {
  return (
    <View style={styles.sheetStatus}>
      {icon ? <MaterialCommunityIcons name={icon} size={28} color={palette.textMuted} /> : <ActivityIndicator size="small" color={palette.orange} />}
      <Text style={[styles.sheetStatusText, { color: palette.textMuted }]}>{text}</Text>
    </View>
  );
}

function UserPickRow({
  id,
  name,
  desc,
  selected,
  palette,
  onPress,
  trailing,
}: {
  id: string;
  name: string;
  desc?: string;
  selected: boolean;
  palette: Palette;
  onPress: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      key={id}
      style={[styles.userRow, { borderColor: palette.border }, selected && { backgroundColor: palette.surfaceSoft }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <AvatarWord name={name} palette={palette} />
      <View style={styles.userText}>
        <Text style={[styles.userName, { color: palette.text }]}>{name || '未知用户'}</Text>
        {!!desc && <Text style={[styles.userDesc, { color: palette.textMuted }]}>{desc}</Text>}
      </View>
      {trailing}
      {selected && <MaterialCommunityIcons name="check-circle-outline" size={22} color={palette.orange} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 112,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    marginTop: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchText: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    minHeight: 78,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize['3xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  timeText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  previewLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  previewText: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: fontWeight.bold,
  },
  emptyPanel: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fontSize['2xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  emptyDesc: {
    fontSize: fontSize.base,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  primaryButton: {
    height: 44,
    minWidth: 120,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '76%',
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: fontSize['4xl'],
    lineHeight: 26,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    minHeight: 44,
    borderRadius: borderRadius.md,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.lg,
  },
  segmentItem: {
    flex: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentText: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  inputBox: {
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 20,
    padding: 0,
  },
  resultList: {
    maxHeight: 280,
  },
  userRow: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  requestRow: {
    minHeight: 74,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  requestIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userText: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  userDesc: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 1,
  },
  sheetStatus: {
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sheetStatusText: {
    fontSize: fontSize.base,
    lineHeight: 20,
    textAlign: 'center',
  },
  createButton: {
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  createText: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
});
