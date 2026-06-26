import { Platform, Share } from 'react-native';
import { showAlert } from './alert';

/**
 * 分享内容类型
 */
export interface ShareContent {
  title: string;
  message: string;
  url?: string;
}

/**
 * 分享功能
 * - Web 端：使用 Web Share API
 * - 原生端：使用 React Native Share API
 */
export async function shareContent(content: ShareContent): Promise<boolean> {
  try {
    // Web 端：使用 Web Share API
    if (Platform.OS === 'web') {
      if (navigator.share) {
        await navigator.share({
          title: content.title,
          text: content.message,
          url: content.url || window.location.href,
        });
        return true;
      } else {
        // 降级方案：复制到剪贴板
        const textToCopy = `${content.title}\n${content.message}${content.url ? '\n' + content.url : ''}`;
        await copyToClipboard(textToCopy);
        showAlert('提示', '内容已复制到剪贴板');
        return true;
      }
    }

    // 原生端：使用 React Native Share API
    const shareOptions = {
      title: content.title,
      message: `${content.title}\n${content.message}`,
      url: content.url,
    };

    await Share.share(shareOptions);
    return true;
  } catch (error: any) {
    // 用户取消分享不报错
    if (error.name === 'AbortError' || error.message === 'User did not share') {
      return false;
    }
    console.error('Share error:', error);
    // 降级方案：复制到剪贴板
    try {
      const textToCopy = `${content.title}\n${content.message}${content.url ? '\n' + content.url : ''}`;
      await copyToClipboard(textToCopy);
      showAlert('提示', '内容已复制到剪贴板');
      return true;
    } catch (clipboardError) {
      console.error('Clipboard error:', clipboardError);
      showAlert('错误', '分享失败，请重试');
      return false;
    }
  }
}

/**
 * 复制文本到剪贴板
 */
async function copyToClipboard(text: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Web 端
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  } else {
    // 原生端
    // 使用 expo-clipboard 复制到剪贴板
    const clipboardModule = await import('expo-clipboard');
    await clipboardModule.setStringAsync(text);
  }
}

/**
 * 分享物品信息
 */
export async function shareItem(item: {
  name: string;
  description?: string;
  category?: string;
  location?: string;
}): Promise<boolean> {
  const message = `物品名称：${item.name}${item.description ? '\n描述：' + item.description : ''}${item.category ? '\n分类：' + item.category : ''}${item.location ? '\n位置：' + item.location : ''}`;
  return shareContent({
    title: `分享物品：${item.name}`,
    message,
  });
}

/**
 * 分享待办信息
 */
export async function shareTodo(todo: {
  title: string;
  description?: string;
  priority: number;
  due_date?: string;
  completed: boolean;
}): Promise<boolean> {
  const priorityMap = { 1: '低', 2: '普通', 3: '紧急' };
  const priorityLabel = priorityMap[todo.priority as 1 | 2 | 3] || '普通';
  const statusLabel = todo.completed ? '已完成' : '进行中';
  const dueDateLabel = todo.due_date ? new Date(todo.due_date).toLocaleDateString('zh-CN') : '未设置';

  const message = `待办标题：${todo.title}${todo.description ? '\n描述：' + todo.description : ''}\n优先级：${priorityLabel}\n状态：${statusLabel}\n截止日期：${dueDateLabel}`;

  return shareContent({
    title: `分享待办：${todo.title}`,
    message,
  });
}
