import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, ActivityIndicator, RefreshControl, TextInput, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../../stores/themeStore';
import { SafeScreen } from '../../components/SafeScreen';
import { useConversationStore } from '../../stores/conversationStore';
import { socketService } from '../../lib/socket';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../constants/theme';
import { EmptyState, Loading } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { useShareStore } from '../../stores/shareStore';

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getMessageIcon(type: string) {
  switch (type) {
    case 'item': return 'package-variant';
    case 'todo': return 'check-circle';
    case 'system': return 'bell-outline';
    default: return 'message-text';
  }
}

function getMessageSummary(msg: { type?: string; content?: string } | null) {
  if (!msg) return '暂无消息';
  switch (msg.type) {
    case 'item': return '分享了一件物品';
    case 'todo': return '分享了一条待办';
    case 'system': return msg.content || '系统通知';
    default: return msg.content || '暂无消息';
  }
}

export default function MessagesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { conversations, loading, error, fetchConversations } = useConversationStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // 新建对话面板
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatMode, setNewChatMode] = useState<'search' | 'friends'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friends, setFriends] = useState<Array<{ user_id: string; user_name: string; email?: string }>>([]);

  useEffect(() => {
    fetchConversations();

    const handleConversationUpdated = () => {
      fetchConversations();
    };

    socketService.onConversationUpdated(handleConversationUpdated);

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  useLayoutEffect(() => {
    // 隐藏 Stack header title，用自定义 header
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  // 获取好友列表（从共享关系中获取）
  const fetchFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const res = await api.shares.outgoing();
      if (res.data) {
        // 去重：按 shared_with_id 取唯一用户
        const friendMap = new Map<string, { user_id: string; user_name: string; email?: string }>();
        res.data.forEach((share: any) => {
          if (!friendMap.has(share.shared_with_id)) {
            friendMap.set(share.shared_with_id, {
              user_id: share.shared_with_id,
              user_name: share.shared_with_name || '未知用户',
            });
          }
        });
        setFriends(Array.from(friendMap.values()));
      }
    } catch {
      // ignore
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  // 搜索用户（防抖）
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const q = searchQuery.trim();
    timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.messages.searchUsers(q);
        if (res.data) {
          setSearchResults(res.data);
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateChat = async () => {
    if (!selectedUserId || !user) return;
    setCreating(true);
    try {
      const res = await api.messages.createManualConversation({
        participant_ids: [user.id, selectedUserId],
      });
      if (res.data?.conversation) {
        setShowNewChat(false);
        setSearchQuery('');
        setSelectedUserId(null);
        setSearchResults([]);
        router.push(`/message/${res.data.conversation.id}`);
        await fetchConversations();
      }
    } catch {
      // error handled by API
    } finally {
      setCreating(false);
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <SafeScreen>
        <View style={[styles.center, { backgroundColor: colors.gray[50] }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeScreen>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <SafeScreen>
        <View style={[styles.center, { backgroundColor: colors.gray[50] }]}>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View style={[styles.container, { backgroundColor: colors.gray[50] }]}>
        {conversations.length === 0 ? (
          <EmptyState
            icon="message-text"
            title="暂无对话"
            description="分享物品或待办时会自动创建对话\n也可以从这里发起新对话"
            actionLabel="发起对话"
            onAction={() => setShowNewChat(true)}
          />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
          >
            {/* 常联系好友小卡片 */}
            {conversations.length > 0 && (
              <View style={[styles.frequentRow, { backgroundColor: colors.white }]}>
                {conversations.slice(0, 6).map((conv) => {
                  const otherUser = conv.other_user;
                  return (
                    <TouchableOpacity
                      key={conv.id}
                      style={styles.frequentItem}
                      onPress={() => router.push(`/message/${conv.id}`)}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.frequentAvatar, { backgroundColor: colors.primaryLight }]}>
                        <MaterialCommunityIcons name="account" size={18} color={colors.primary} />
                      </View>
                      <Text style={[styles.frequentName, { color: colors.gray[700] }]} numberOfLines={1}>
                        {otherUser?.display_name || '好友'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {conversations.map((conv) => {
              const otherUser = conv.other_user;
              const lastMsg = conv.last_message;
              const hasUnread = (conv.unread_count ?? 0) > 0;

              return (
                <TouchableOpacity
                  key={conv.id}
                  style={[styles.conversationItem, { backgroundColor: colors.white }]}
                  onPress={() => router.push(`/message/${conv.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                    <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
                  </View>

                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={[styles.conversationName, { color: colors.gray[800] }]} numberOfLines={1}>
                        {otherUser?.display_name || '未知用户'}
                      </Text>
                      <Text style={[styles.timeText, { color: colors.gray[400] }]}>
                        {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                      </Text>
                    </View>
                    <View style={styles.conversationFooter}>
                      {lastMsg && (
                        <View style={styles.messagePreview}>
                          <MaterialCommunityIcons
                            name={getMessageIcon(lastMsg.type)}
                            size={14}
                            color={colors.gray[500]}
                          />
                          <Text style={[styles.previewText, { color: colors.gray[500] }]} numberOfLines={1}>
                            {getMessageSummary(lastMsg)}
                          </Text>
                        </View>
                      )}
                      {hasUnread && (
                        <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.unreadText, { color: colors.white }]}>
                            {(conv.unread_count ?? 0) > 99 ? '99+' : String(conv.unread_count ?? 0)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* FAB 按钮 */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, ...shadows.md }]}
          onPress={() => setShowNewChat(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="message-plus" size={28} color={colors.white} />
        </TouchableOpacity>

        {/* 新建对话面板 */}
        {showNewChat && (
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.overlayBackdrop} activeOpacity={1} onPress={() => { setShowNewChat(false); setSearchQuery(''); setSelectedUserId(null); setSearchResults([]); setNewChatMode('search'); setFriends([]); }} />
            <View style={[styles.newChatPanel, { backgroundColor: colors.white }]}>
              <View style={styles.panelHeader}>
                <Text style={[styles.panelTitle, { color: colors.gray[900] }]}>新建对话</Text>
                <TouchableOpacity onPress={() => { setShowNewChat(false); setSearchQuery(''); setSelectedUserId(null); setSearchResults([]); setNewChatMode('search'); setFriends([]); }}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.gray[500]} />
                </TouchableOpacity>
              </View>

              {/* Tab 切换 */}
              <View style={styles.newChatTabs}>
                <TouchableOpacity
                  style={[styles.newChatTab, newChatMode === 'search' && { backgroundColor: colors.white, ...shadows.sm }]}
                  onPress={() => { setNewChatMode('search'); setSelectedUserId(null); }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="magnify" size={16} color={newChatMode === 'search' ? colors.primary : colors.gray[500]} />
                  <Text style={[styles.newChatTabText, { color: newChatMode === 'search' ? colors.primary : colors.gray[500] }, newChatMode === 'search' && { fontWeight: fontWeight.semiBold }]}>
                    搜索用户
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.newChatTab, newChatMode === 'friends' && { backgroundColor: colors.white, ...shadows.sm }]}
                  onPress={async () => {
                    setNewChatMode('friends');
                    setSelectedUserId(null);
                    if (friends.length === 0) {
                      await fetchFriends();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="account-multiple" size={16} color={newChatMode === 'friends' ? colors.primary : colors.gray[500]} />
                  <Text style={[styles.newChatTabText, { color: newChatMode === 'friends' ? colors.primary : colors.gray[500] }, newChatMode === 'friends' && { fontWeight: fontWeight.semiBold }]}>
                    好友列表
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 搜索模式 */}
              {newChatMode === 'search' && (
                <>
                  {/* 搜索框 */}
                  <View style={[styles.searchBox, { backgroundColor: colors.gray[100] }]}>
                    <MaterialCommunityIcons name="magnify" size={20} color={colors.gray[400]} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.gray[800] }]}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="搜索邮箱或用户名"
                      placeholderTextColor={colors.gray[400]}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={colors.gray[400]} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 搜索结果 */}
                  {searching && (
                    <View style={styles.searchingContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.searchingText, { color: colors.gray[500] }]}>搜索中...</Text>
                    </View>
                  )}

                  {!searching && searchQuery.trim() && searchResults.length === 0 && (
                    <View style={styles.emptySearch}>
                      <MaterialCommunityIcons name="account-off" size={32} color={colors.gray[300]} />
                      <Text style={[styles.emptySearchText, { color: colors.gray[500] }]}>未找到匹配的用户</Text>
                    </View>
                  )}

                  {!searching && (
                    <ScrollView style={styles.resultsList} nestedScrollEnabled>
                      {searchResults.map((u) => (
                        <TouchableOpacity
                          key={u.id}
                          style={[
                            styles.userItem,
                            { borderBottomColor: colors.gray[100] },
                            selectedUserId === u.id && { backgroundColor: colors.primaryLight },
                          ]}
                          onPress={() => setSelectedUserId(u.id)}
                          activeOpacity={0.6}
                        >
                          <View style={[styles.userAvatar, { backgroundColor: colors.primaryLight }]}>
                            <MaterialCommunityIcons name="account" size={18} color={colors.primary} />
                          </View>
                          <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: colors.gray[800] }]}>{u.display_name}</Text>
                            <Text style={[styles.userEmail, { color: colors.gray[500] }]}>{u.email}</Text>
                          </View>
                          {selectedUserId === u.id && (
                            <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </>
              )}

              {/* 好友模式 */}
              {newChatMode === 'friends' && (
                friendsLoading ? (
                  <View style={styles.searchingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.searchingText, { color: colors.gray[500] }]}>加载中...</Text>
                  </View>
                ) : friends.length === 0 ? (
                  <View style={styles.emptySearch}>
                    <MaterialCommunityIcons name="account-group" size={32} color={colors.gray[300]} />
                    <Text style={[styles.emptySearchText, { color: colors.gray[500] }]}>暂无好友<br/>搜索用户或分享物品来添加好友</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.resultsList} nestedScrollEnabled>
                    {friends.map((f) => (
                      <TouchableOpacity
                        key={f.user_id}
                        style={[
                          styles.userItem,
                          { borderBottomColor: colors.gray[100] },
                          selectedUserId === f.user_id && { backgroundColor: colors.primaryLight },
                        ]}
                        onPress={() => setSelectedUserId(f.user_id)}
                        activeOpacity={0.6}
                      >
                        <View style={[styles.userAvatar, { backgroundColor: colors.primaryLight }]}>
                          <MaterialCommunityIcons name="account" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={[styles.userName, { color: colors.gray[800] }]}>{f.user_name}</Text>
                        </View>
                        {selectedUserId === f.user_id && (
                          <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )
              )}

              {/* 创建按钮 */}
              <TouchableOpacity
                style={[
                  styles.createBtn,
                  { backgroundColor: selectedUserId ? colors.primary : colors.gray[300] },
                ]}
                onPress={handleCreateChat}
                disabled={!selectedUserId || creating}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.createBtnText, { color: selectedUserId ? '#fff' : colors.gray[500] }]}>
                    发起对话
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeScreen>
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
  frequentRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  frequentItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 56,
  },
  frequentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequentName: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    maxWidth: 60,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationContent: {
    flex: 1,
    minWidth: 0,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  timeText: {
    fontSize: fontSize.xs,
    flexShrink: 1,
    textAlign: 'right',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  previewText: {
    fontSize: fontSize.sm,
    flexShrink: 1,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  newChatPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '70%',
    padding: spacing.xl,
    paddingBottom: 40,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  panelTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.semiBold,
  },
  newChatTabs: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
    gap: 4,
  },
  newChatTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  newChatTabText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.lg,
    padding: 0,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
  },
  searchingText: {
    fontSize: fontSize.base,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptySearchText: {
    fontSize: fontSize.base,
  },
  resultsList: {
    maxHeight: 200,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  userEmail: {
    fontSize: fontSize.sm,
  },
  createBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
  },
});
