import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../../stores/themeStore';
import { useMessageStore } from '../../stores/messageStore';
import { useConversationStore } from '../../stores/conversationStore';
import { socketService } from '../../lib/socket';
import { spacing, borderRadius, fontSize, fontWeight } from '../../constants/theme';
import { EmptyState } from '../../components/ui';
import { useTodoStore } from '../../stores/todoStore';

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + ' ' +
    date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function ResourceCard({ message, onToggleComplete }: { message: any; onToggleComplete?: () => void }) {
  const colors = useColors();
  const router = useRouter();
  const { card_data } = message || {};
  const isItem = message?.type === 'item';

  if (!card_data?.resource_id) return null;

  return (
    <View style={styles.resourceCard}>
      <TouchableOpacity
        style={styles.resourceCardHeader}
        onPress={() => {
          Keyboard.dismiss();
          router.push(isItem ? `/item/${card_data.resource_id}` : `/todo/${card_data.resource_id}`);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.resourceIcon, { backgroundColor: isItem ? colors.primaryLight : colors.successLight }]}>
          <MaterialCommunityIcons
            name={isItem ? 'package-variant' : 'check-circle'}
            size={20}
            color={isItem ? colors.primary : colors.success}
          />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[styles.resourceName, { color: colors.gray[800] }]} numberOfLines={1}>
            {card_data.name || (isItem ? '物品' : '待办')}
          </Text>
          {card_data.location && (
            <Text style={[styles.resourceMeta, { color: colors.gray[400] }]}>
              {card_data.location}{isItem ? ' · 点击查看详情' : ''}
            </Text>
          )}
          {!card_data.location && (
            <Text style={[styles.resourceMeta, { color: colors.gray[400] }]}>
              点击查看详情
            </Text>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.gray[400]} />
      </TouchableOpacity>
      {onToggleComplete && (
        <TouchableOpacity
          style={[styles.completeBtn, { backgroundColor: colors.success }]}
          onPress={onToggleComplete}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="check" size={16} color={colors.white} />
          <Text style={[styles.completeBtnText, { color: colors.white }]}>标记完成</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
  const colors = useColors();
  const { type, content, card_data } = message;

  // 系统消息
  if (type === 'system') {
    return (
      <View style={styles.systemMessage}>
        <Text style={[styles.systemText, { color: colors.gray[400] }]}>{content || '系统通知'}</Text>
      </View>
    );
  }

  // 卡片消息（分享时自动创建的）
  if ((type === 'item' || type === 'todo') && card_data?.resource_id) {
    return (
      <View style={isOwn ? styles.ownBubbleRight : styles.otherBubbleLeft}>
        <View style={[styles.cardMessage, { backgroundColor: colors.white }]}>
          <ResourceCard
            message={{ type, card_data }}
            onToggleComplete={type === 'todo' ? async () => {
              try {
                await useTodoStore.getState().toggleComplete(card_data.resource_id);
              } catch { /* ignore */ }
            } : undefined}
          />
          {content && (
            <Text style={[styles.cardText, { color: colors.gray[600], fontSize: fontSize.sm, marginTop: spacing.sm }]}>
              {content}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // 文字消息
  return (
    <View style={isOwn ? styles.ownBubbleRight : styles.otherBubbleLeft}>
      <View style={[
        styles.textBubble,
        { backgroundColor: isOwn ? colors.primary : colors.white },
        !isOwn && { borderColor: colors.gray[200] },
      ]}>
        <Text style={[
          styles.textMessage,
          { color: isOwn ? colors.white : colors.gray[800] },
        ]} selectable>
          {content || '(空消息)'}
        </Text>
      </View>
      <Text style={[styles.msgTime, { color: colors.gray[400], fontSize: fontSize.xs }]}>
        {formatMessageTime(message.created_at)}
      </Text>
    </View>
  );
}

export default function MessageDetailScreen() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { messages, loading, fetchMessages, sendMessage, setCurrentConversation, clearMessages } = useMessageStore();
  const { conversations, fetchConversations } = useConversationStore();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // 找到当前对话信息
  const currentConv = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    setCurrentConversation(conversationId || null);
    fetchMessages(conversationId || '');
    fetchConversations();

    // 监听 WebSocket 新消息事件（实时推送）
    const handleMessageCreated = (message: any) => {
      const convId = conversationId || '';
      // 只处理当前对话的消息
      if (message.conversation_id === convId) {
        useMessageStore.getState().addRemoteMessage(message);
      }
    };

    const handleConversationUpdated = (conversation: any) => {
      // 更新对话列表
      if (conversation.id === conversationId) {
        useConversationStore.getState().fetchConversations();
      }
    };

    socketService.onMessageCreated(handleMessageCreated);
    socketService.onConversationUpdated(handleConversationUpdated);

    // 监听键盘弹出
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
    });

    return () => {
      keyboardDidShow.remove();
      clearMessages();
      socketService.removeAllListeners();
    };
  }, [conversationId]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;
    const text = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    await sendMessage(conversationId!, {
      type: 'text',
      content: text,
    });

    // 滚动到底部
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (loading && messages.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.gray[50] }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      {/* 顶部导航 */}
      <View style={[styles.navBar, { backgroundColor: colors.white, borderBottomColor: colors.gray[200] }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.gray[800]} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.gray[800] }]}>
          {currentConv?.other_user?.display_name || '对话'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 消息列表 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <EmptyState
            icon="message-text-outline"
            title="暂无消息"
            description="分享物品或待办时会自动创建对话\n这里是你们的聊天室"
          />
        ) : (
          messages.map((msg: any) => {
            // 判断是否是自己发的消息
            const otherUserId = currentConv?.other_user?.user_id;
            const isCurrentUser = otherUserId ? msg.sender_id !== otherUserId : false;
            return (
              <MessageBubble key={msg.id} message={msg} isOwn={isCurrentUser} />
            );
          })
        )}
      </ScrollView>

      {/* 输入框 */}
      <KeyboardAvoidingView
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        behavior="padding"
      >
        <View style={[styles.inputBar, { backgroundColor: colors.white, borderTopColor: colors.gray[200] }]}>
          <TouchableOpacity
            style={styles.quickShareBtn}
            activeOpacity={0.7}
            onPress={() => {
              // TODO: 打开快速分享面板（从物品/待办列表选择）
            }}
          >
            <MaterialCommunityIcons name="plus" size={22} color={colors.gray[500]} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { color: colors.gray[800 ], borderColor: colors.gray[200] }]}
            placeholder="输入消息..."
            placeholderTextColor={colors.gray[400]}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={inputText.trim() && !loading ? colors.white : colors.gray[400]}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  ownBubbleRight: {
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  otherBubbleLeft: {
    alignItems: 'flex-start',
    maxWidth: '80%',
  },
  textBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: '100%',
  },
  textMessage: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  resourceCard: {
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  resourceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  resourceMeta: {
    fontSize: fontSize.xs,
  },
  cardMessage: {
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
  },
  cardText: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: '#10B981',
  },
  completeBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  systemMessage: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  systemText: {
    fontSize: fontSize.xs,
  },
  msgTime: {
    marginTop: 2,
    textAlign: 'right',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  quickShareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
