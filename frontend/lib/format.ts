/**
 * 统一中文本地化时间格式，避免各页面各自 new Date().toLocaleDateString
 */

/** 日期：2026/7/24 */
export function formatDateZh(value?: string | Date | null, fallback = ''): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('zh-CN');
}

/** 时间：14:30 */
export function formatTimeZh(value?: string | Date | null, fallback = ''): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return fallback;
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

/** 消息列表相对时间：刚刚 / n分钟前 / 昨天 / M/D */
export function formatChatListTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
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

/** 聊天消息时间：今天 HH:mm / 昨天 HH:mm / M月D日 HH:mm */
export function formatMessageTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = formatTimeZh(date);
  if (isToday) return time;
  if (isYesterday) return `昨天 ${time}`;
  return `${date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} ${time}`;
}

/** 相对活跃：刚刚活跃 / n 分钟前 */
export function formatRelativeActive(dateStr?: string | null, empty = '刚刚活跃'): string {
  if (!dateStr) return empty;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return empty;
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return '刚刚活跃';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小时前`;
  return `${Math.floor(diffHours / 24)} 天前`;
}


/** 会话列表/分享预览文案 */
export function getMessageSummary(msg: { type?: string; content?: string } | null | undefined): string {
  if (!msg) return '暂无消息';
  if (msg.type === 'item') return '分享了一件物品';
  if (msg.type === 'todo') return '分享了一条待办';
  if (msg.type === 'system') return msg.content || '系统通知';
  return msg.content || '暂无消息';
}
