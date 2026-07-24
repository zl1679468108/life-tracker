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
import { formatRelativeActive, formatDateZh } from '../../lib/format';
import { EmptyState, UserAvatar } from '../../components/ui';
import { MessageBubble } from '../../components/message/MessageBubble';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { socketService } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';
import { useConversationStore } from '../../stores/conversationStore';
import { useMessageStore } from '../../stores/messageStore';
import { useProfileStore } from '../../stores/profileStore';
import { useItemStore } from '../../stores/itemStore';
import { usePalette } from '../../stores/themeStore';
import { useTodoStore } from '../../stores/todoStore';
import type { Message, LifeItem, LifeTodo } from '../../types';


export default function MessageDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const palette = usePalette();
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
  const activityText = useMemo(() => formatRelativeActive(currentConv?.last_message_at), [currentConv?.last_message_at]);

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
            <UserAvatar name={peerName} avatarUrl={peerAvatar} size={28} />
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
                            {todo.completed ? '已完成' : todo.due_date ? `截止 ${formatDateZh(todo.due_date)}` : '未设截止'}
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
