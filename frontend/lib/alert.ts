import { Alert, Platform } from 'react-native';

/**
 * 跨平台 Alert，Web 端使用 window.alert / window.confirm
 */
interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n${message}` : title;

    // 无按钮或单按钮 → window.alert
    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }

    // 多按钮 → window.confirm
    const confirmBtn = buttons.find(b => b.style === 'destructive') || buttons[buttons.length - 1];
    const cancelBtn = buttons.find(b => b.style === 'cancel');

    const confirmed = window.confirm(text);
    if (confirmed) {
      confirmBtn?.onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
    return;
  }

  Alert.alert(title, message, buttons);
}
