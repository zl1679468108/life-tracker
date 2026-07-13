import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState } from '../../components/ui';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { socketService } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';
import { useConversationStore } from '../../stores/conversationStore';
import { useMessageStore } from '../../stores/messageStore';
import { useProfileStore } from '../../stores/profileStore';
import { useItemStore } from '../../stores/itemStore';
import { useColors } from '../../stores/themeStore';
import { useTodoStore } from '../../stores/todoStore';
import type { Message, LifeItem, LifeTodo } from '../../types';

type Palette = typeof appDesign.dark;

const AVATAR_COLORS = ['#F36F3C', '#7C5CFC', '#1E88E5', '#10A66E', '#E84A5F', '#D89400', '#8E24AA', '#43A047'];

function avatarColor(name?: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  return `${date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return '刚刚活跃';
  const date = new Date(dateStr);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return '刚刚活跃';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小时前`;
  return `${Math.floor(diffHours / 24)} 天前`;
}

function cleanMessageContent(content?: string) {
  if (!content) return '';
  return content.replace(/^.+?[:：]\s*/, '');
}

function Avatar({
  name,
  avatarUrl,
  palette,
  size = 36,
}: {
  name?: string;
  avatarUrl?: string | null;
  palette: Palette;
  size?: number;
}) {
  const [hasError, setHasError] = useState(false);
  const ac = avatarColor(name);

  if (avatarUrl && !hasError) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.surfaceSoft,
        }}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${ac}18`,
          borderColor: `${ac}40`,
        },
      ]}
    >
      <Text style={[styles.avatarText, { color: ac, fontSize: size * 0.42 }]}>
        {(name || '友').slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

function ResourceCard({
  message,
  palette,
  isOwn,
  onToggleComplete,
}: {
  message: Message;
  palette: Palette;
  isOwn: boolean;
  onToggleComplete?: () => void;
}) {
  const router = useRouter();
  const { card_data } = message || {};
  const isItem = message?.type === 'item';
  const accent = isItem ? palette.orange : palette.success;

  if (!card_data?.resource_id) return null;

  const todoCompleted = !isItem && (card_data as any)?.completed === true;

  return (
    <View style={[styles.resourceCard, { backgroundColor: palette.surfaceSoft, borderColor: `${accent}40` }]}>
      <View style={[styles.resourceTypeTag, { backgroundColor: `${accent}1F` }]}>
        <MaterialCommunityIcons
          name={isItem ? 'package-variant-closed' : 'check-circle-outline'}
          size={11}
          color={accent}
        />
        <Text style={[styles.resourceTypeTagText, { color: accent }]}>
          {isItem ? '物品' : todoCompleted ? '待办 · 已完成' : '待办'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.resourceHeader}
        onPress={() => {
          Keyboard.dismiss();
          router.push(isItem ? `/item/${card_data.resource_id}` : `/todo/${card_data.resource_id}`);
        }}
        activeOpacity={0.82}
      >
        <View
          style={[
            styles.resourceIcon,
            { backgroundColor: `${accent}18`, borderColor: `${accent}40` },
          ]}
        >
          <MaterialCommunityIcons
            name={isItem ? 'package-variant-closed' : todoCompleted ? 'check-circle' : 'checkbox-blank-circle-outline'}
            size={18}
            color={accent}
          />
        </View>
        <View style={styles.resourceCopy}>
          <Text style={[styles.resourceName, { color: palette.text }]} numberOfLines={1}>
            {card_data.name || (isItem ? '物品' : '待办')}
          </Text>
          <Text style={[styles.resourceMeta, { color: palette.textMuted }]} numberOfLines={1}>
            {card_data.location || (todoCompleted ? '已完成' : '点击查看详情')}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
      </TouchableOpacity>

      <View style={styles.resourceActions}>
        <TouchableOpacity
          style={[styles.resourceActionBtn, { borderColor: palette.border }]}
          onPress={() => {
            Keyboard.dismiss();
            router.push(isItem ? `/item/${card_data.resource_id}` : `/todo/${card_data.resource_id}`);
          }}
          activeOpacity={0.82}
        >
          <MaterialCommunityIcons name="open-in-new" size={14} color={palette.textSecondary} />
          <Text style={[styles.resourceActionText, { color: palette.textSecondary }]}>
            {isItem ? '打开' : '查看'}
          </Text>
        </TouchableOpacity>
        {onToggleComplete && !todoCompleted ? (
          <TouchableOpacity
            style={[styles.resourceActionBtn, { backgroundColor: palette.success, borderColor: palette.success }]}
            onPress={onToggleComplete}
            activeOpacity={0.82}
          >
            <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
            <Text style={[styles.resourceActionText, { color: '#FFFFFF' }]}>标记完成</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function MessageBubble({
  message,
  isOwn,
  senderName,
  senderAvatar,
  palette,
}: {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string | null;
  palette: Palette;
}) {
  const { type, content, card_data } = message;

  if (type === 'system') {
    return (
      <View style={styles.systemMessage}>
        <View style={[styles.systemBadge, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
          <MaterialCommunityIcons name="bell-outline" size={12} color={palette.textMuted} />
          <Text style={[styles.systemText, { color: palette.textMuted }]}>{content || '系统通知'}</Text>
        </View>
      </View>
    );
  }

  const isCard = (type === 'item' || type === 'todo') && card_data?.resource_id;
  const bubbleContent = isCard ? (
    <View style={[styles.cardBubble, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <ResourceCard
        message={message}
        palette={palette}
        isOwn={isOwn}
        onToggleComplete={
          type === 'todo'
            ? async () => {
                try {
                  await useTodoStore.getState().toggleComplete(card_data.resource_id);
                } catch {
                  // ignore
                }
              }
            : undefined
        }
      />
      {content ? (
        <Text style={[styles.cardText, { color: palette.textSecondary }]}>
          {cleanMessageContent(content)}
        </Text>
      ) : null}
    </View>
  ) : (
    <View
      style={[
        styles.textBubble,
        {
          backgroundColor: isOwn ? palette.orange : palette.surface,
          borderColor: isOwn ? palette.orange : palette.border,
        },
      ]}
    >
      <Text style={[styles.messageText, { color: isOwn ? '#FFFFFF' : palette.text }]} selectable>
        {cleanMessageContent(content) || '(空消息)'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
      {!isOwn && (
        <View style={styles.messageAvatar}>
          <Avatar name={senderName} avatarUrl={senderAvatar} palette={palette} size={32} />
        </View>
      )}
      <View style={[styles.bubbleWrap, isOwn ? styles.bubbleWrapOwn : styles.bubbleWrapOther]}>
        {bubbleContent}
        <Text style={[styles.timeText, { color: palette.textMuted, alignSelf: isOwn ? 'flex-end' : 'flex-start' }]}>
          {formatMessageTime(message.created_at)}
        </Text>
      </View>
      {isOwn && (
        <View style={styles.messageAvatar}>
          <Avatar name={senderName} avatarUrl={senderAvatar} palette={palette} size={32} />
        </View>
      )}
    </View>
  );
}

export default function MessageDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { user } = useAuthStore();
  const { messages, loading, fetchMessages, sendMessage, markAsRead, setCurrentConversation, clearMessages } = useMessageStore();
  const { conversations, fetchConversations } = useConversationStore();
  const [inputText, setInputText] = useState('');
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState<'item' | 'todo' | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasMarkedRead = useRef(false);

  const currentConv = conversations.find((c) => c.id === conversationId);
  const peerName = currentConv?.other_user?.display_name || '对话';
  const peerAvatar = currentConv?.other_user?.avatar_url;
  const activityText = useMemo(() => formatRelativeTime(currentConv?.last_message_at), [currentConv?.last_message_at]);

  // 自己的头像和名称
  const { profile } = useProfileStore();
  const { items: myItems, fetchItems: fetchMyItems } = useItemStore();
  const { todos: myTodos, fetchTodos: fetchMyTodos } = useTodoStore();
  const myAvatar = profile?.avatar_url;
  const myName = profile?.display_name || user?.email?.split('@')[0] || '我';

  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      // 与 _layout.tsx 中 subPageOptions 的 handleBack 逻辑保持一致
      router.replace('/(tabs)');
    }
  };

  useEffect(() => {
    setCurrentConversation(conversationId || null);
    fetchMessages(conversationId || '');
    fetchConversations();

    const handleMessageCreated = (message: Message) => {
      const convId = conversationId || '';
      if (message.conversation_id === convId) {
        useMessageStore.getState().addRemoteMessage(message);
      }
    };

    const handleConversationUpdated = (conversation: { id: string }) => {
      if (conversation.id === conversationId) {
        useConversationStore.getState().fetchConversations();
      }
    };

    socketService.onMessageCreated(handleMessageCreated);
    socketService.onConversationUpdated(handleConversationUpdated);

    if (conversationId && !hasMarkedRead.current) {
      hasMarkedRead.current = true;
      markAsRead(conversationId).then(() => {
        useConversationStore.getState().fetchConversations();
      });
    }

    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
    });

    return () => {
      keyboardDidShow.remove();
      clearMessages();
      socketService.offMessageCreated(handleMessageCreated);
      socketService.offConversationUpdated(handleConversationUpdated);
    };
  }, [conversationId]);

  const handleSendResource = async (type: 'item' | 'todo', resource: LifeItem | LifeTodo) => {
    if (!conversationId) return;
    const isItem = type === 'item';
    const name = isItem ? (resource as LifeItem).name : (resource as LifeTodo).title;
    await sendMessage(conversationId, {
      type,
      resource_type: type,
      resource_id: resource.id,
      content: `分享了一件${isItem ? '物品' : '待办'}"${name}"`,
      card_data: {
        resource_type: type,
        resource_id: resource.id,
        name,
        location: '',
      },
    });
    setShowPicker(false);
    setPickerType(null);
    setShowActionPanel(false);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading || !conversationId) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(conversationId, { type: 'text', content: text });
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const canSend = inputText.trim().length > 0 && !loading;

  if (loading && messages.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.orange} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: palette.bg,
            borderBottomColor: palette.border,
            paddingTop: Math.max(insets.top, spacing.sm),
            paddingBottom: spacing.sm,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
          onPress={handleBack}
          activeOpacity={0.82}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>

        <View style={styles.topBarTitle}>
          <View style={styles.topBarTitleRow}>
            <Avatar name={peerName} avatarUrl={peerAvatar} palette={palette} size={28} />
            <View style={styles.topBarTitleText}>
              <Text style={[styles.topBarName, { color: palette.text }]} numberOfLines={1}>
                {peerName}
              </Text>
              <Text style={[styles.topBarMeta, { color: palette.textMuted }]} numberOfLines={1}>
                {activityText}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.topBarTrailing} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <EmptyState
            variant="messages"
            title="暂无消息"
            description="分享物品或待办时会自动创建对话，这里就是你们后续协作的聊天区。"
            style={styles.emptyState}
          />
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                senderName={isOwn ? myName : peerName}
                senderAvatar={isOwn ? myAvatar : peerAvatar}
                palette={palette}
              />
            );
          })
        )}
      </ScrollView>

      <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} behavior="padding">
        <View
          style={[
            styles.composerBar,
            {
              backgroundColor: palette.bg,
              borderTopColor: palette.border,
              paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.xs,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.composerIconBtn,
              {
                backgroundColor: showActionPanel ? `${palette.orange}1F` : palette.surfaceSoft,
                borderColor: showActionPanel ? palette.orange : palette.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => {
              Keyboard.dismiss();
              setPickerType(null);
              setShowActionPanel((prev) => !prev);
            }}
            accessibilityLabel={showActionPanel ? '收起功能面板' : '展开功能面板'}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={showActionPanel ? 'close' : 'plus'}
              size={20}
              color={showActionPanel ? palette.orange : palette.textSecondary}
            />
          </TouchableOpacity>

          <View style={[styles.inputWrap, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <TextInput
              style={[styles.input, { color: palette.text }]}
              placeholder="输入消息..."
              placeholderTextColor={palette.textDisabled}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.composerIconBtn,
              styles.sendBtn,
              {
                backgroundColor: canSend ? palette.orange : palette.surfaceSoft,
                borderColor: canSend ? palette.orange : palette.border,
              },
            ]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
            accessibilityLabel="发送消息"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="arrow-up"
              size={20}
              color={canSend ? '#FFFFFF' : palette.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* 底部功能面板 — 横向卡片，自然展开，不覆盖消息 */}
        {showActionPanel && (
          <View
            style={[
              styles.actionPanel,
              {
                backgroundColor: palette.surface,
                borderTopColor: palette.border,
                paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.xs,
              },
            ]}
          >
            <Text style={[styles.actionPanelTitle, { color: palette.textMuted }]}>分享到对话</Text>
            <View style={styles.actionCards}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: palette.surfaceSoft, borderColor: `${palette.orange}40` }]}
                onPress={() => {
                  if (myItems.length === 0) fetchMyItems();
                  setPickerType('item');
                  setShowPicker(true);
                }}
                activeOpacity={0.78}
                accessibilityLabel="发送物品"
                accessibilityRole="button"
              >
                <View style={[styles.actionCardIcon, { backgroundColor: `${palette.orange}1F` }]}>
                  <MaterialCommunityIcons name="package-variant-closed" size={22} color={palette.orange} />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={[styles.actionCardTitle, { color: palette.text }]}>发送物品</Text>
                  <Text style={[styles.actionCardDesc, { color: palette.textMuted }]} numberOfLines={1}>
                    从你的物品中选择分享
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: palette.surfaceSoft, borderColor: `${palette.success}40` }]}
                onPress={() => {
                  if (myTodos.length === 0) fetchMyTodos();
                  setPickerType('todo');
                  setShowPicker(true);
                }}
                activeOpacity={0.78}
                accessibilityLabel="发送待办"
                accessibilityRole="button"
              >
                <View style={[styles.actionCardIcon, { backgroundColor: `${palette.success}1F` }]}>
                  <MaterialCommunityIcons name="check-circle-outline" size={22} color={palette.success} />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={[styles.actionCardTitle, { color: palette.text }]}>发送待办</Text>
                  <Text style={[styles.actionCardDesc, { color: palette.textMuted }]} numberOfLines={1}>
                    分享一条待办给对方
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Picker 弹窗 */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPicker(false);
          setPickerType(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              setShowPicker(false);
              setPickerType(null);
            }}
          />
          <View style={[styles.modalContent, { backgroundColor: palette.surface }]}>
            {/* 标题栏 */}
            <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
              <View style={styles.modalHeaderPlaceholder} />
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                {pickerType === 'item' ? '选择物品' : '选择待办'}
              </Text>
              <TouchableOpacity
                style={styles.modalHeaderClose}
                onPress={() => {
                  setShowPicker(false);
                  setPickerType(null);
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={24} color={palette.textMuted} />
              </TouchableOpacity>
            </View>

            {/* 列表 */}
            {pickerType === 'item' && (
              <View style={styles.modalList}>
                {myItems.length === 0 ? (
                  <View style={styles.actionPanelEmpty}>
                    <MaterialCommunityIcons name="package-variant-closed" size={32} color={palette.textDisabled} />
                    <Text style={[styles.actionPanelEmptyText, { color: palette.textMuted }]}>暂无物品，先去创建吧</Text>
                  </View>
                ) : (
                  <ScrollView>
                    {myItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.actionPanelItem, { borderBottomColor: palette.border }]}
                        onPress={() => handleSendResource('item', item)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.actionPanelItemDot, { backgroundColor: palette.orange }]} />
                        <View style={styles.actionPanelItemCopy}>
                          <Text style={[styles.actionPanelItemName, { color: palette.text }]} numberOfLines={1}>{item.name}</Text>
                          <Text style={[styles.actionPanelItemMeta, { color: palette.textMuted }]} numberOfLines={1}>{item.description || '物品'}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
            {pickerType === 'todo' && (
              <View style={styles.modalList}>
                {myTodos.length === 0 ? (
                  <View style={styles.actionPanelEmpty}>
                    <MaterialCommunityIcons name="check-circle-outline" size={32} color={palette.textDisabled} />
                    <Text style={[styles.actionPanelEmptyText, { color: palette.textMuted }]}>暂无需办，先去创建吧</Text>
                  </View>
                ) : (
                  <ScrollView>
                    {myTodos.map((todo) => (
                      <TouchableOpacity
                        key={todo.id}
                        style={[styles.actionPanelItem, { borderBottomColor: palette.border }]}
                        onPress={() => handleSendResource('todo', todo)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.actionPanelItemDot, { backgroundColor: palette.success }]} />
                        <View style={styles.actionPanelItemCopy}>
                          <Text style={[styles.actionPanelItemName, { color: palette.text }]} numberOfLines={1}>{todo.title}</Text>
                          <Text style={[styles.actionPanelItemMeta, { color: palette.textMuted }]} numberOfLines={1}>
                            {todo.completed ? '已完成' : todo.due_date ? `截止 ${new Date(todo.due_date).toLocaleDateString('zh-CN')}` : '未设截止'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    flex: 1,
    minWidth: 0,
  },
  topBarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topBarTitleText: {
    flex: 1,
    minWidth: 0,
  },
  topBarName: {
    fontSize: fontSize.lg,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  topBarMeta: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    marginTop: 1,
  },
  topBarTrailing: {
    width: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: fontWeight.bold,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  emptyState: {
    minHeight: 360,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  systemBadge: {
    maxWidth: '80%',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  systemText: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '100%',
  },
  messageRowOwn: {
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  messageAvatar: {
    marginBottom: spacing.xs,
  },
  bubbleWrap: {
    maxWidth: '78%',
    minWidth: 80,
  },
  bubbleWrapOwn: {
    alignItems: 'flex-end',
    marginRight: spacing.xs,
  },
  bubbleWrapOther: {
    alignItems: 'flex-start',
    marginLeft: spacing.xs,
  },
  textBubble: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.sm,
    borderBottomLeftRadius: borderRadius.sm,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  cardBubble: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    minWidth: 240,
  },
  resourceCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  resourceTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  resourceTypeTagText: {
    fontSize: fontSize.xs,
    lineHeight: 14,
    fontWeight: fontWeight.semiBold,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },
  resourceName: {
    fontSize: fontSize.base,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
  },
  resourceMeta: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    marginTop: 2,
  },
  resourceActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  resourceActionBtn: {
    flex: 1,
    height: 32,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  resourceActionText: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    fontWeight: fontWeight.semiBold,
  },
  cardText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  timeText: {
    fontSize: fontSize.xs,
    lineHeight: 14,
    marginTop: 4,
  },
  composerBar: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  composerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sendBtn: {
    borderWidth: 0,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: fontSize.base,
    lineHeight: 20,
    padding: 0,
    maxHeight: 92,
  },

  // 底部功能面板 — 横向卡片
  actionPanel: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  actionPanelTitle: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  actionCards: {
    gap: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionCardIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardText: {
    flex: 1,
    minWidth: 0,
  },
  actionCardTitle: {
    fontSize: fontSize.base,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
  },
  actionCardDesc: {
    fontSize: fontSize.sm,
    lineHeight: 16,
    marginTop: 2,
  },
  actionPanelEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  actionPanelEmptyText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: spacing.sm,
  },

  // Picker 弹窗内的列表项
  actionPanelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  actionPanelItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  actionPanelItemCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionPanelItemName: {
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  actionPanelItemMeta: {
    fontSize: fontSize.xs,
    lineHeight: 16,
    marginTop: 1,
  },

  // Picker 弹窗
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
    textAlign: 'center',
    flex: 1,
  },
  modalHeaderPlaceholder: {
    width: 24,
  },
  modalHeaderClose: {
    width: 24,
    alignItems: 'flex-end',
  },
  modalList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: 400,
  },
});
