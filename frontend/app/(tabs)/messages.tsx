import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  RefreshControl,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeScreen } from '../../components/SafeScreen';
import { SwipeableRow } from '../../components/SwipeableRow';
import { AppHeader, MessagesBackground, UserAvatar } from '../../components/ui';
import { ConversationRow, SheetStatus, UserPickRow } from '../../components/message';
import { borderRadius, fontSize, fontWeight, shadows, spacing } from '../../constants/theme';
import { api } from '../../lib/api';
import { useDebounce } from '../../lib/hooks';
import { showAlert } from '../../lib/alert';
import { avatarColor } from '../../lib/avatar';
import { formatChatListTime } from '../../lib/format';
import { socketService } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';
import { usePalette, useTheme } from '../../stores/themeStore';
import { useConversationStore } from '../../stores/conversationStore';
import type { Conversation, LifeFriend } from '../../types';





export default function MessagesScreen() {
  const router = useRouter();
  const palette = usePalette();
  const { isDark } = useTheme();
  const { conversations, loading, error, fetchConversations } = useConversationStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatMode, setNewChatMode] = useState<'search' | 'records'>('search');
  const [recordTab, setRecordTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friends, setFriends] = useState<LifeFriend[]>([]);
  const [friendRequests, setFriendRequests] = useState<LifeFriend[]>([]);
  const [requestMessage, setRequestMessage] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageSearchResults, setMessageSearchResults] = useState<{ friends: LifeFriend[]; messages: any[] }>({ friends: [], messages: [] });
  const [messageSearching, setMessageSearching] = useState(false);
  const incomingRequests = friendRequests.filter((r) => r.direction === 'incoming');
  // 消息列表只展示已通过验证的好友聊天；其余对话（非好友）不应出现在主列表
  const acceptedFriendIds = new Set(friends.map((f) => f.friend.id));
  const chatConversations = conversations.filter((conv) => {
    const type = conv.last_message?.type || conv.last_message_type;
    if (type === 'system') return false;
    const otherUserId = conv.other_user?.user_id;
    return otherUserId ? acceptedFriendIds.has(otherUserId) : false;
  });

  // 用好友列表的信息兜底显示名称/头像
  const resolveUserInfo = (conv: Conversation) => {
    const otherUserId = conv.other_user?.user_id;
    const friend = otherUserId ? friends.find((f) => f.friend.id === otherUserId) : null;
    return {
      display_name: friend?.friend.display_name || conv.other_user?.display_name || '未知用户',
      avatar_url: friend?.friend.avatar_url || conv.other_user?.avatar_url || null,
    };
  };

  const storyItems = (() => {
    if (friends.length > 0) {
      return friends.slice(0, 8).map((friend) => ({
        key: friend.id,
        name: friend.friend.display_name,
        avatarUrl: friend.friend.avatar_url,
        onPress: () => {
          setShowNewChat(true);
          setNewChatMode('records');
          setRecordTab('accepted');
          setSelectedUserId(friend.friend.id);
        },
      }));
    }
    const mapped = new Map<string, { key: string; name: string; avatarUrl?: string | null; conversationId: string }>();
    chatConversations.forEach((conv) => {
      const userInfo = resolveUserInfo(conv);
      if (!conv.other_user?.user_id || mapped.has(conv.other_user.user_id)) return;
      mapped.set(conv.other_user.user_id, {
        key: conv.other_user.user_id,
        name: userInfo.display_name,
        avatarUrl: userInfo.avatar_url,
        conversationId: conv.id,
      });
    });
    return Array.from(mapped.values())
      .slice(0, 8)
      .map((item) => ({
        key: item.key,
        name: item.name,
        avatarUrl: item.avatarUrl,
        onPress: () => router.push(`/message/${item.conversationId}` as never),
      }));
  })();

  useEffect(() => {
    fetchConversations();
    fetchFriends();
    const handleConversationUpdated = () => fetchConversations();
    const handleFriendUpdated = () => {
      fetchFriends();
      fetchFriendRequests();
    };
    socketService.onConversationUpdated(handleConversationUpdated);
    socketService.onFriendRequestUpdated(handleFriendUpdated);
    return () => {
      socketService.offConversationUpdated(handleConversationUpdated);
      socketService.offFriendRequestUpdated(handleFriendUpdated);
    };
  }, []);

  useEffect(() => {
    if (!messageSearchQuery.trim()) {
      setMessageSearchResults({ friends: [], messages: [] });
      return;
    }
    const q = messageSearchQuery.trim();
    const timer = setTimeout(async () => {
      setMessageSearching(true);
      try {
        const res = await api.messages.searchMessages(q);
        if (res.data) setMessageSearchResults(res.data);
      } catch {
        // ignore
      } finally {
        setMessageSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [messageSearchQuery]);

  // 添加好友搜索：防抖
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = debouncedSearchQuery.trim();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.messages.searchUsers(q);
        if (res.data) setSearchResults(res.data);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [debouncedSearchQuery]);

  const closeSearch = () => {
    setSearchVisible(false);
    setMessageSearchQuery('');
    setMessageSearchResults({ friends: [], messages: [] });
  };

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

  const openRecords = async () => {
    setNewChatMode('records');
    setRecordTab('pending');
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
      <View style={[styles.pageWrap, { backgroundColor: 'transparent' }]}>
        {/* 氛围背景层 */}
        <View style={styles.atmosphereArea} pointerEvents="none">
          <LinearGradient
            colors={isDark
              ? ['rgba(124,92,252,0.06)', 'rgba(16,166,110,0.03)', palette.bg]
              : ['#F0EDFF', '#ECFDF5', palette.bg]
            }
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <MessagesBackground />
        </View>

        <View style={[styles.stickyHeader, { backgroundColor: 'transparent' }]}>
          <AppHeader
            title="消息"
            actions={[
              { icon: 'magnify', label: '搜索好友或聊天记录', onPress: () => setSearchVisible(true) },
              { icon: 'plus-circle-outline', label: '打开添加好友', onPress: () => setShowNewChat(true) },
            ]}
          />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.orange} colors={[palette.orange]} />}
        >

          {storyItems.length > 0 && (
            <View
              style={[
                styles.storyPanel,
                { backgroundColor: palette.surface },
                !isDark && shadows.sm,
              ]}
            >
              <View style={styles.storyPanelHeader}>
                <Text style={[styles.storyPanelTitle, { color: palette.text }]}>最近联系人</Text>
              </View>
              <View style={styles.storyRow}>
                <TouchableOpacity
                  style={styles.storyItem}
                  onPress={() => {
                    setShowNewChat(true);
                    setNewChatMode('search');
                  }}
                  activeOpacity={0.82}
                >
                  <View style={[styles.storyAvatarWrap, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                    <View style={[styles.storyAddDot, { backgroundColor: palette.success, borderColor: palette.bg }]}>
                      <MaterialCommunityIcons name="plus" size={12} color="#FFFFFF" />
                    </View>
                    <MaterialCommunityIcons name="account-plus-outline" size={20} color={palette.orange} />
                  </View>
                  <Text style={[styles.storyLabel, { color: palette.text }]} numberOfLines={1}>添加好友</Text>
                </TouchableOpacity>
                <FlatList
                  data={storyItems}
                  keyExtractor={(item) => item.key}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  initialNumToRender={8}
                  windowSize={3}
                  contentContainerStyle={styles.storyListContent}
                  renderItem={({ item }) => {
                    const ac = avatarColor(item.name);
                    return (
                      <TouchableOpacity style={styles.storyItem} onPress={item.onPress} activeOpacity={0.82}>
                        <View style={[styles.storyAvatarWrap, { borderColor: `${ac}66` }]}>
                          <UserAvatar name={item.name} avatarUrl={item.avatarUrl} size={48} />
                          <View style={[styles.storyOnlineDot, { backgroundColor: palette.success, borderColor: palette.surface }]} />
                        </View>
                        <Text style={[styles.storyLabel, { color: palette.text }]} numberOfLines={1}>{item.name}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          )}

          {error && conversations.length === 0 ? (
            <View style={[styles.emptyPanel, { backgroundColor: palette.surface }, !isDark && shadows.sm]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color={palette.danger} />
              <Text style={[styles.emptyTitle, { color: palette.text }]}>消息加载失败</Text>
              <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>{error}</Text>
            </View>
          ) : chatConversations.length === 0 && incomingRequests.length === 0 ? (
            <View style={[styles.emptyPanel, { backgroundColor: palette.surface }, !isDark && shadows.sm]}>
              <MaterialCommunityIcons name="message-text-outline" size={30} color={palette.textMuted} />
              <Text style={[styles.emptyTitle, { color: palette.text }]}>暂无对话</Text>
              <Text style={[styles.emptyDesc, { color: palette.textMuted }]}>
                分享物品或待办时会自动创建对话，也可以主动发起新对话。
              </Text>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: palette.orange }]} onPress={() => setShowNewChat(true)} activeOpacity={0.84}>
                <Text style={styles.primaryButtonText}>发起对话</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {incomingRequests.length > 0 && (
                <TouchableOpacity
                  style={[styles.featuredRow, { borderColor: `${palette.warning}40` }]}
                  onPress={() => {
                    setShowNewChat(true);
                    setNewChatMode('records');
                    setRecordTab('pending');
                  }}
                  activeOpacity={0.82}
                >
                  <LinearGradient
                    colors={
                      isDark
                        ? [`${palette.warning}1F`, `${palette.warning}0A`, palette.surface]
                        : [`${palette.warning}26`, `${palette.warning}0F`, palette.surface]
                    }
                    locations={[0, 0.55, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.featuredIcon, { backgroundColor: `${palette.warning}26`, borderColor: `${palette.warning}40` }]}>
                    <MaterialCommunityIcons name="account-clock-outline" size={20} color={palette.warning} />
                  </View>
                  <View style={styles.featuredContent}>
                    <View style={styles.featuredHead}>
                      <Text style={[styles.featuredTitle, { color: palette.text }]}>待处理好友申请</Text>
                      <View style={[styles.unreadBadge, { backgroundColor: palette.warning }]}>
                        <Text style={styles.unreadText}>{incomingRequests.length}</Text>
                      </View>
                    </View>
                    <Text style={[styles.featuredSummary, { color: palette.textMuted }]} numberOfLines={1}>
                      {incomingRequests.length} 位用户请求添加你为好友
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} style={styles.featuredChevron} />
                </TouchableOpacity>
              )}
              <View
                style={[
                  styles.conversationPanel,
                  { backgroundColor: palette.surface },
                  !isDark && shadows.sm,
                ]}
              >
                <View style={styles.conversationHeader}>
                  <Text style={[styles.conversationHeaderTitle, { color: palette.text }]}>消息</Text>
                  {chatConversations.length > 0 && (
                    <View style={[styles.conversationHeaderBadge, { backgroundColor: palette.surfaceSoft }]}>
                      <Text style={[styles.conversationHeaderBadgeText, { color: palette.textMuted }]}>{chatConversations.length}</Text>
                    </View>
                  )}
                </View>
                {chatConversations.map((conv, ci) => {
                  const userInfo = resolveUserInfo(conv);
                  return (
                    <ConversationRow
                      key={conv.id}
                      conversation={conv}
                      displayName={userInfo.display_name}
                      avatarUrl={userInfo.avatar_url}
                      palette={palette}
                      showDivider={ci < chatConversations.length - 1}
                      onPress={() => router.push(`/message/${conv.id}` as never)}
                    />
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {showNewChat && (
          <View style={styles.overlay}>
            <TouchableOpacity style={[styles.overlayBackdrop, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={closeSheet} />
            <View style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderPlaceholder} />
                <Text style={[styles.sheetTitle, { color: palette.text }]}>{newChatMode === 'search' ? '添加好友' : '申请记录'}</Text>
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
                  testID="messages-sheet-mode-search"
                  accessibilityLabel="切换到添加好友"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="magnify" size={16} color={newChatMode === 'search' ? palette.orange : palette.textMuted} />
                  <Text style={[styles.segmentText, { color: newChatMode === 'search' ? palette.text : palette.textMuted }]}>添加好友</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentItem, newChatMode === 'records' && { backgroundColor: palette.surface, borderColor: palette.border }]}
                  onPress={openRecords}
                  activeOpacity={0.82}
                  testID="messages-sheet-mode-records"
                  accessibilityLabel="切换到申请记录"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="account-clock-outline" size={16} color={newChatMode === 'records' ? palette.orange : palette.textMuted} />
                  <Text style={[styles.segmentText, { color: newChatMode === 'records' ? palette.text : palette.textMuted }]}>申请记录</Text>
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
                      testID="messages-search-user-input"
                      accessibilityLabel="搜索邮箱或用户名"
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
              ) : (
                <>
                  <View style={[styles.segment, { backgroundColor: palette.surfaceSoft, marginBottom: spacing.md }]}>
                    {(['pending', 'accepted', 'rejected'] as const).map((tab) => (
                      <TouchableOpacity
                        key={tab}
                        style={[styles.segmentItem, recordTab === tab && { backgroundColor: palette.surface, borderColor: palette.border }]}
                        onPress={() => {
                          setRecordTab(tab);
                          setSelectedUserId(null);
                        }}
                        activeOpacity={0.82}
                      >
                        <Text style={[styles.segmentText, { color: recordTab === tab ? palette.text : palette.textMuted }]}>
                          {tab === 'pending' ? '申请中' : tab === 'accepted' ? '已通过' : '已拒绝'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <ScrollView style={styles.resultList} nestedScrollEnabled>
                    {recordTab === 'pending' && (
                      <>
                        {friendRequests.filter((r) => r.status === 'pending').length === 0 ? (
                          <SheetStatus palette={palette} text="暂无申请中的好友记录" icon="account-group-outline" />
                        ) : (
                          <View style={styles.sheetSection}>
                            {friendRequests
                              .filter((r) => r.status === 'pending')
                              .map((r) => (
                                <UserPickRow
                                  key={r.id}
                                  id={r.id}
                                  name={r.friend.display_name}
                                  desc={
                                    r.direction === 'incoming'
                                      ? (r.request_message || '请求添加你为好友')
                                      : '已发送好友申请'
                                  }
                                  palette={palette}
                                  showCheck={false}
                                  onPress={() => {}}
                                  trailing={
                                    r.direction === 'incoming' ? (
                                      <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TouchableOpacity
                                          onPress={() => handleRespondRequest(r.id, 'reject')}
                                          style={[styles.requestIconBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
                                        >
                                          <MaterialCommunityIcons name="close" size={18} color={palette.danger} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          onPress={() => handleRespondRequest(r.id, 'accept')}
                                          style={[styles.requestIconBtn, { backgroundColor: `${palette.success}16` }]}
                                        >
                                          <MaterialCommunityIcons name="check" size={18} color={palette.success} />
                                        </TouchableOpacity>
                                      </View>
                                    ) : (
                                      <Text style={[styles.statusLabel, { color: palette.textMuted }]}>等待对方通过</Text>
                                    )
                                  }
                                />
                              ))}
                          </View>
                        )}
                      </>
                    )}
                    {recordTab === 'accepted' && (
                      <>
                        {friends.length === 0 ? (
                          <SheetStatus palette={palette} text="暂无已通过好友" icon="account-group-outline" />
                        ) : (
                          <View style={styles.sheetSection}>
                            {friends.map((f) => (
                              <SwipeableRow key={f.id} onDelete={() => handleDeleteFriend(f)}>
                                <UserPickRow
                                  id={f.friend.id}
                                  name={f.friend.display_name}
                                  desc={f.friend.email || undefined}
                                  selected={selectedUserId === f.friend.id}
                                  palette={palette}
                                  onPress={() => setSelectedUserId(f.friend.id)}
                                  pinned={Boolean(f.pinned)}
                                  trailing={
                                    <TouchableOpacity
                                      style={[styles.requestIconBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
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
                          </View>
                        )}
                      </>
                    )}
                    {recordTab === 'rejected' && (
                      <>
                        {friendRequests.filter((r) => r.status === 'rejected').length === 0 ? (
                          <SheetStatus palette={palette} text="暂无已拒绝记录" icon="account-off-outline" />
                        ) : (
                          <View style={styles.sheetSection}>
                            {friendRequests
                              .filter((r) => r.status === 'rejected')
                              .map((r) => (
                                <UserPickRow
                                  key={r.id}
                                  id={r.id}
                                  name={r.friend.display_name}
                                  desc={r.direction === 'incoming' ? '已拒绝对方申请' : '对方已拒绝你的申请'}
                                  palette={palette}
                                  showCheck={false}
                                  onPress={() => {}}
                                />
                              ))}
                          </View>
                        )}
                      </>
                    )}
                  </ScrollView>
                  {recordTab === 'accepted' && selectedUserId && (
                    <TouchableOpacity
                      style={[styles.createButton, { backgroundColor: palette.orange }]}
                      onPress={handleCreateChat}
                      disabled={creating}
                      activeOpacity={0.84}
                    >
                      {creating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.createText}>发起对话</Text>}
                    </TouchableOpacity>
                  )}
                </>
              )}

              {newChatMode === 'search' && selectedUserId && (
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: palette.orange }]}
                  onPress={handleSendFriendRequest}
                  disabled={creating}
                  activeOpacity={0.84}
                  testID="messages-send-request"
                  accessibilityLabel="发送好友申请"
                  accessibilityRole="button"
                >
                  {creating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.createText}>发送申请</Text>}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {searchVisible && (
          <View style={styles.overlay}>
            <TouchableOpacity style={[styles.overlayBackdrop, { backgroundColor: palette.scrim }]} activeOpacity={1} onPress={closeSearch} />
            <View style={[styles.searchSheet, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderPlaceholder} />
                <Text style={[styles.sheetTitle, { color: palette.text }]}>搜索</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeSearch}>
                  <MaterialCommunityIcons name="close" size={22} color={palette.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputBox, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={palette.textMuted} />
                <TextInput
                  style={[styles.input, { color: palette.text }]}
                  value={messageSearchQuery}
                  onChangeText={setMessageSearchQuery}
                  placeholder="搜索好友、邮箱或聊天记录"
                  placeholderTextColor={palette.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                {messageSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setMessageSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle-outline" size={18} color={palette.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              {messageSearching ? (
                <SheetStatus palette={palette} text="搜索中..." />
              ) : messageSearchQuery.trim() &&
                messageSearchResults.friends.length === 0 &&
                messageSearchResults.messages.length === 0 ? (
                <SheetStatus palette={palette} text="未找到相关结果" icon="magnify-close" />
              ) : (
                <ScrollView style={styles.resultList} nestedScrollEnabled>
                  {messageSearchResults.friends.length > 0 && (
                    <View style={styles.sheetSection}>
                      <Text style={[styles.sectionTitle, { color: palette.text, marginBottom: spacing.sm }]}>联系人</Text>
                      {messageSearchResults.friends.map((f) => {
                        const conv = conversations.find((c) => c.other_user?.user_id === f.friend.id);
                        return (
                          <UserPickRow
                            key={f.friend.id}
                            id={f.friend.id}
                            name={f.friend.display_name}
                            desc={f.friend.email || undefined}
                            palette={palette}
                            showCheck={false}
                            onPress={() => {
                              closeSearch();
                              if (conv) {
                                router.push(`/message/${conv.id}` as never);
                              } else if (user) {
                                api.messages.createManualConversation({ participant_ids: [user.id, f.friend.id] }).then((res) => {
                                  if (res.data?.conversation) {
                                    router.push(`/message/${res.data.conversation.id}` as never);
                                  }
                                });
                              }
                            }}
                            trailing={<MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />}
                          />
                        );
                      })}
                    </View>
                  )}
                  {messageSearchResults.messages.length > 0 && (
                    <View style={styles.sheetSection}>
                      <Text style={[styles.sectionTitle, { color: palette.text, marginBottom: spacing.sm }]}>聊天记录</Text>
                      {messageSearchResults.messages.map((msg) => (
                        <UserPickRow
                          key={msg.id}
                          id={msg.id}
                          name={msg.other_user_name || '聊天'}
                          desc={`${msg.sender_name}: ${msg.content || ''}`}
                          palette={palette}
                          showCheck={false}
                          onPress={() => {
                            closeSearch();
                            router.push(`/message/${msg.conversation_id}` as never);
                          }}
                          leading={
                            <View style={[styles.requestIconBtn, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
                              <MaterialCommunityIcons name="message-text-outline" size={18} color={palette.orange} />
                            </View>
                          }
                          trailing={<Text style={[styles.searchTime, { color: palette.textMuted }]}>{formatChatListTime(msg.created_at)}</Text>}
                        />
                      ))}
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
    position: 'relative',
  },
  atmosphereArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  stickyHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 112,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyPanel: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  storyPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 6,
  },
  storyPanelTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  storyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: spacing.lg,
    paddingBottom: 12,
  },
  storyListContent: {
    paddingRight: spacing.md,
  },
  storyItem: {
    width: 68,
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  storyAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  storyOnlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  storyAddDot: {
    position: 'absolute',
    right: -3,
    bottom: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  storyLabel: {
    fontSize: fontSize.xs,
    lineHeight: 14,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  list: {
    gap: spacing.sm,
  },
  conversationPanel: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 6,
  },
  conversationHeaderTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  conversationHeaderBadge: {
    minWidth: 22,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  conversationHeaderBadgeText: {
    fontSize: fontSize.xs,
    lineHeight: 14,
    fontWeight: fontWeight.semiBold,
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featuredIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featuredContent: {
    flex: 1,
    minWidth: 0,
  },
  featuredHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featuredTitle: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  featuredSummary: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  featuredChevron: {
    marginLeft: spacing.sm,
  },
  timeText: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: fontWeight.bold,
  },
  emptyPanel: {
    borderRadius: borderRadius.xl,
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
    fontSize: fontSize['2xl'],
    lineHeight: 28,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    flex: 1,
  },
  sheetHeaderPlaceholder: {
    width: 36,
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
    flex: 1,
  },
  searchSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  statusLabel: {
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  sheetSection: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  sectionBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  sectionBadgeText: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    fontWeight: fontWeight.bold,
  },

  requestIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  searchTime: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  createText: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
});
