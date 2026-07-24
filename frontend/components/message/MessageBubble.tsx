import React, { memo } from 'react';
import { Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserAvatar } from '../ui';
import { borderRadius, fontSize, fontWeight, spacing } from '../../constants/theme';
import { formatMessageTime } from '../../lib/format';
import { useTodoStore } from '../../stores/todoStore';
import type { AppPalette } from '../../stores/themeStore';
import type { Message } from '../../types';

function cleanMessageContent(content?: string) {
  if (!content) return '';
  return content.replace(/^.+?[:：]\s*/, '');
}

function ResourceCard({
  message,
  palette,
  onToggleComplete,
}: {
  message: Message;
  palette: AppPalette;
  onToggleComplete?: () => void;
}) {
  const router = useRouter();
  const { card_data } = message || {};
  const isItem = message?.type === 'item';
  const accent = isItem ? palette.orange : palette.success;

  if (!card_data?.resource_id) return null;

  const todoCompleted = !isItem && (card_data as { completed?: boolean })?.completed === true;

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
        <View style={[styles.resourceIcon, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}>
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

export type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string | null;
  palette: AppPalette;
};

function MessageBubbleInner({ message, isOwn, senderName, senderAvatar, palette }: MessageBubbleProps) {
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
          <UserAvatar name={senderName} avatarUrl={senderAvatar} size={32} />
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
          <UserAvatar name={senderName} avatarUrl={senderAvatar} size={32} />
        </View>
      )}
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleInner);

const styles = StyleSheet.create({
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
});
