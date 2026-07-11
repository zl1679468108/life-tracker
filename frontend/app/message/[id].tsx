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
          backgroundColor: palette.surfaceSoft,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.avatarText, { color: palette.orange, fontSize: size * 0.4 }]}>
        {(name || '友').slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

function ResourceCard({
  message,
  palette,
  onToggleComplete,
}: {
  message: Message;
  palette: Palette;
  onToggleComplete?: () => void;
}) {
  const router = useRouter();
  const { card_data } = message || {};
  const isItem = message?.type === 'item';

  if (!card_data?.resource_id) return null;

  return (
    <View style={[styles.resourceCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
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
            { backgroundColor: isItem ? `${palette.orange}18` : `${palette.success}18`, borderColor: palette.border },
          ]}
        >
          <MaterialCommunityIcons
            name={isItem ? 'package-variant-closed' : 'check-circle-outline'}
            size={18}
            color={isItem ? palette.orange : palette.success}
          />
        </View>
        <View style={styles.resourceCopy}>
          <Text style={[styles.resourceName, { color: palette.text }]} numberOfLines={1}>
            {card_data.name || (isItem ? '物品' : '待办')}
          </Text>
          <Text style={[styles.resourceMeta, { color: palette.textMuted }]} numberOfLines={1}>
            {card_data.location || '点击查看详情'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={palette.textMuted} />
      </TouchableOpacity>

      {onToggleComplete ? (
        <TouchableOpacity style={[styles.completeButton, { backgroundColor: palette.success }]} onPress={onToggleComplete} activeOpacity={0.82}>
          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>标记完成</Text>
        </TouchableOpacity>
      ) : null}
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
          <Text style={[styles.systemText, { color: palette.textMuted }]}>{content || '系统通知'}</Text>
        </View>
      </View>
    );
  }

  const bubbleContent = (type === 'item' || type === 'todo') && card_data?.resource_id ? (
    <View
      style={[
        styles.cardBubble,
        {
          backgroundColor: isOwn ? `${palette.orange}14` : palette.surface,
          borderColor: isOwn ? palette.orange : palette.border,
        },
      ]}
    >
      <ResourceCard
        message={message}
        palette={palette}
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
      {content ? <Text style={[styles.cardText, { color: palette.textSecondary }]}>{cleanMessageContent(content)}</Text> : null}
      <Text style={[styles.timeText, { color: palette.textMuted, alignSelf: isOwn ? 'flex-end' : 'flex-start' }]}>
        {formatMessageTime(message.created_at)}
      </Text>
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
      <Text style={[styles.timeText, { color: isOwn ? 'rgba(255,255,255,0.72)' : palette.textMuted, alignSelf: isOwn ? 'flex-end' : 'flex-start' }]}>
        {formatMessageTime(message.created_at)}
      </Text>
    </View>
  );

  return (
    <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
      {!isOwn && (
        <View style={styles.messageAvatar}>
          <Avatar name={senderName} avatarUrl={senderAvatar} palette={palette} size={36} />
        </View>
      )}
      <View style={styles.bubbleWrap}>{bubbleContent}</View>
      {isOwn && (
        <View style={styles.messageAvatar}>
          <Avatar name={senderName} avatarUrl={senderAvatar} palette={palette} size={36} />
        </View>
      )}
    </View>
  );
}

export default function MessageDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
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
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading || !conversationId) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(conversationId, { type: 'text', content: text });
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (loading && messages.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={palette.orange} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.bg }]}>
      <View style={[styles.topBar, { backgroundColor: palette.bg, borderBottomColor: palette.border }]}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
          onPress={handleBack}
          activeOpacity={0.82}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>

        <View style={styles.topBarTitle}>
          <Text style={[styles.topBarName, { color: palette.text }]} numberOfLines={1}>
            {peerName}
          </Text>
          <Text style={[styles.topBarMeta, { color: palette.textMuted }]} numberOfLines={1}>
            {activityText}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
          activeOpacity={0.82}
          onPress={() => Keyboard.dismiss()}
        >
          <MaterialCommunityIcons name="dots-horizontal" size={20} color={palette.textSecondary} />
        </TouchableOpacity>
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
            icon="message-text-outline"
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

      <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} behavior="padding">
        <View style={[styles.composerBar, { backgroundColor: palette.bg, borderTopColor: palette.border }]}>
          <TouchableOpacity
            style={styles.composerIconBtn}
            activeOpacity={0.7}
            onPress={() => {
              Keyboard.dismiss();
              setPickerType(null);
              setShowActionPanel((prev) => !prev);
            }}
          >
            <MaterialCommunityIcons
              name={showActionPanel ? 'close' : 'plus'}
              size={22}
              color={showActionPanel ? palette.orange : palette.textMuted}
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
              onSubmitEditing={handleSend}
            />
          </View>
          <TouchableOpacity
            style={styles.composerIconBtn}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="arrow-right"
              size={22}
              color={inputText.trim() && !loading ? palette.orange : palette.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* 底部功能面板（在输入栏下方自然展开，不覆盖消息） */}
        {showActionPanel && (
          <View style={styles.actionPanel}>
            {/* 宫格功能区 */}
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionGridItem}
                onPress={() => {
                  if (myItems.length === 0) fetchMyItems();
                  setPickerType('item');
                  setShowPicker(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionGridIconWrap, { backgroundColor: `${palette.orange}14` }]}>
                  <MaterialCommunityIcons name="package-variant-closed" size={28} color={palette.orange} />
                </View>
                <Text style={[styles.actionGridLabel, { color: palette.textSecondary }]}>发送物品</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionGridItem}
                onPress={() => {
                  if (myTodos.length === 0) fetchMyTodos();
                  setPickerType('todo');
                  setShowPicker(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionGridIconWrap, { backgroundColor: `${palette.success}14` }]}>
                  <MaterialCommunityIcons name="check-circle-outline" size={28} color={palette.success} />
                </View>
                <Text style={[styles.actionGridLabel, { color: palette.textSecondary }]}>发送待办</Text>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    flex: 1,
    minWidth: 0,
  },
  topBarName: {
    fontSize: fontSize.lg,
    lineHeight: 22,
    fontWeight: fontWeight.semiBold,
  },
  topBarMeta: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 2,
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  emptyState: {
    minHeight: 360,
  },
  systemMessage: {
    alignItems: 'center',
  },
  systemBadge: {
    maxWidth: '80%',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  systemText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '100%',
  },
  messageRowOwn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  messageAvatar: {
    marginHorizontal: 4,
  },
  bubbleWrap: {
    maxWidth: '76%',
  },
  textBubble: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 6,
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  cardBubble: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.md,
    padding: spacing.sm,
  },
  resourceCard: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
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
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  resourceMeta: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    marginTop: 2,
  },
  completeButton: {
    marginTop: spacing.sm,
    minHeight: 36,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    lineHeight: 18,
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
    lineHeight: 16,
    marginTop: 6,
  },
  composerBar: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  composerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: fontSize.base,
    lineHeight: 20,
    padding: 0,
    maxHeight: 100,
  },

  // 底部功能面板 — WeChat 风格
  actionPanel: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionGridItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionGridIconWrap: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGridLabel: {
    fontSize: fontSize.sm,
    lineHeight: 18,
    fontWeight: fontWeight.medium,
  },
  actionPanelList: {
    marginTop: spacing.md,
  },
  actionPanelListScroll: {
    maxHeight: 180,
  },
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
