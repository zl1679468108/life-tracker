import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState } from '../../components/ui';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { socketService } from '../../lib/socket';
import { useConversationStore } from '../../stores/conversationStore';
import { useMessageStore } from '../../stores/messageStore';
import { useColors } from '../../stores/themeStore';
import { useTodoStore } from '../../stores/todoStore';
import type { Message } from '../../types';

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

function AvatarWord({ name, palette }: { name?: string; palette: Palette }) {
  return (
    <View style={[styles.avatar, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}>
      <Text style={[styles.avatarText, { color: palette.orange }]}>{(name || '友').slice(0, 1).toUpperCase()}</Text>
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
  palette,
}: {
  message: Message;
  isOwn: boolean;
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

  if ((type === 'item' || type === 'todo') && card_data?.resource_id) {
    return (
      <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
        <View
          style={[
            styles.cardBubble,
            {
              backgroundColor: isOwn ? '#FFF4EC' : palette.surface,
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
          {content ? <Text style={[styles.cardText, { color: palette.textSecondary }]}>{content}</Text> : null}
          <Text style={[styles.timeText, { color: palette.textMuted }]}>{formatMessageTime(message.created_at)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
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
          {content || '(空消息)'}
        </Text>
      </View>
      <Text style={[styles.timeText, { color: palette.textMuted }]}>{formatMessageTime(message.created_at)}</Text>
    </View>
  );
}

export default function MessageDetailScreen() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const { messages, loading, fetchMessages, sendMessage, setCurrentConversation, clearMessages } = useMessageStore();
  const { conversations, fetchConversations } = useConversationStore();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const currentConv = conversations.find((c) => c.id === conversationId);
  const peerName = currentConv?.other_user?.display_name || '对话';
  const activityText = useMemo(() => formatRelativeTime(currentConv?.last_message_at), [currentConv?.last_message_at]);

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
          onPress={() => router.back()}
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

      <View style={styles.hero}>
        <AvatarWord name={peerName} palette={palette} />
        <Text style={[styles.heroTitle, { color: palette.text }]} numberOfLines={1}>
          与 {peerName} 的对话
        </Text>
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
            const otherUserId = currentConv?.other_user?.user_id;
            const isCurrentUser = otherUserId ? msg.sender_id !== otherUserId : false;
            return <MessageBubble key={msg.id} message={msg} isOwn={isCurrentUser} palette={palette} />;
          })
        )}
      </ScrollView>

      <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} behavior="padding">
        <View style={[styles.composerWrap, { backgroundColor: palette.bg, borderTopColor: palette.border }]}>
          <View style={[styles.composer, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: palette.surfaceSoft, borderColor: palette.border }]}
              activeOpacity={0.82}
              onPress={() => Keyboard.dismiss()}
            >
              <MaterialCommunityIcons name="plus" size={18} color={palette.textMuted} />
            </TouchableOpacity>
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
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: inputText.trim() && !loading ? palette.orange : palette.surfaceSoft, borderColor: palette.border },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
              activeOpacity={0.82}
            >
              <MaterialCommunityIcons
                name="send"
                size={18}
                color={inputText.trim() && !loading ? '#FFFFFF' : palette.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },
  heroTitle: {
    fontSize: fontSize.xl,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
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
    maxWidth: '82%',
  },
  messageRowOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  textBubble: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageText: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  cardBubble: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
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
  composerWrap: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  composer: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingLeft: spacing.sm,
    paddingRight: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  quickAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontSize: fontSize.base,
    lineHeight: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
