import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserAvatar } from '../ui';
import { fontSize, fontWeight, spacing } from '../../constants/theme';
import { formatChatListTime, getMessageSummary } from '../../lib/format';
import type { AppPalette } from '../../stores/themeStore';
import type { Conversation } from '../../types';

export type ConversationRowProps = {
  conversation: Conversation;
  displayName: string;
  avatarUrl?: string | null;
  palette: AppPalette;
  showDivider?: boolean;
  onPress: () => void;
};

function ConversationRowInner({
  conversation,
  displayName,
  avatarUrl,
  palette,
  showDivider = false,
  onPress,
}: ConversationRowProps) {
  const lastMsg = conversation.last_message;
  const unread = conversation.unread_count ?? 0;
  const hasUnread = unread > 0;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        showDivider && { borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
      testID={`conversation-row-${conversation.id}`}
      accessibilityLabel={`打开对话 ${displayName}`}
      accessibilityRole="button"
    >
      <UserAvatar name={displayName} avatarUrl={avatarUrl} size={50} />
      <View style={styles.rowContent}>
        <View style={styles.rowHead}>
          <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.timeText, { color: palette.textMuted }]}>
            {conversation.last_message_at ? formatChatListTime(conversation.last_message_at) : ''}
          </Text>
        </View>
        <Text style={[styles.previewText, { color: palette.textMuted }]} numberOfLines={1}>
          {getMessageSummary(lastMsg ?? null)}
        </Text>
      </View>
      {hasUnread &&
        (unread > 1 ? (
          <View style={[styles.unreadBadge, { backgroundColor: palette.danger }]}>
            <Text style={styles.unreadText}>{unread > 99 ? '99+' : String(unread)}</Text>
          </View>
        ) : (
          <View style={[styles.unreadDot, { backgroundColor: palette.danger }]} />
        ))}
    </TouchableOpacity>
  );
}

export const ConversationRow = memo(ConversationRowInner);

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: 3,
  },
  rowTitle: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 20,
    fontWeight: fontWeight.semiBold,
  },
  timeText: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  previewText: {
    fontSize: fontSize.sm,
    lineHeight: 18,
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
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
