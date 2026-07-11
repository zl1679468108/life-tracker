import { Platform } from 'react-native';
import { showAlert } from './alert';

// Web 端定时提醒的 Map（用于取消）
const webTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Web 端持久化提醒的 localStorage key
const WEB_REMINDERS_KEY = 'lifetracker.web_reminders';

interface WebReminderRecord {
  id: string;
  todoId: string;
  title: string;
  fireAt: number; // 毫秒时间戳
}

// 仅在原生平台加载 expo-notifications（Web 端不支持）
let Notifications: any = null;
let Device: any = null;

if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  // 配置通知处理
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ===== Web 端 localStorage 持久化辅助 =====

function readWebReminders(): WebReminderRecord[] {
  if (Platform.OS !== 'web') return [];
  try {
    const raw = localStorage.getItem(WEB_REMINDERS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeWebReminders(list: WebReminderRecord[]): void {
  if (Platform.OS !== 'web') return;
  try {
    localStorage.setItem(WEB_REMINDERS_KEY, JSON.stringify(list));
  } catch {
    // 忽略写入失败（如隐私模式）
  }
}

function removeWebReminder(id: string): void {
  const list = readWebReminders().filter((r) => r.id !== id);
  writeWebReminders(list);
}

/**
 * Web 端：页面加载/恢复时重新调度所有未触发的提醒。
 * 应在应用启动时调用一次。
 */
export function rescheduleWebReminders(): void {
  if (Platform.OS !== 'web') return;
  const now = Date.now();
  const list = readWebReminders();
  const stillPending: WebReminderRecord[] = [];
  for (const r of list) {
    const delay = r.fireAt - now;
    if (delay <= 0) {
      // 已过期：直接跳过（不补发，避免刷新后集中轰炸）
      continue;
    }
    // 重新设置定时器
    const timer = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('待办提醒', { body: r.title });
      }
      webTimers.delete(r.id);
      removeWebReminder(r.id);
    }, delay);
    webTimers.set(r.id, timer);
    stillPending.push(r);
  }
  // 清理已过期的记录
  if (stillPending.length !== list.length) {
    writeWebReminders(stillPending);
  }
}

/**
 * 注册推送通知权限
 */
export async function registerForPushNotifications(): Promise<boolean> {
  // Web 端：使用 Web Notification API
  if (Platform.OS === 'web') {
    if (!('Notification' in window)) {
      showAlert('提示', '当前浏览器不支持通知功能');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      showAlert('提示', '通知权限已被拒绝，请在浏览器设置中开启');
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // 原生平台：使用 expo-notifications
  if (!Device.isDevice) {
    showAlert('提示', '需要真机才能接收通知');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    showAlert('提示', '需要通知权限才能设置提醒');
    return false;
  }

  // Android 需要通知渠道
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('todo-reminder', {
      name: '待办提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
    });
  }

  return true;
}

/**
 * 调度待办提醒
 */
export async function scheduleTodoReminder(
  todoId: string,
  title: string,
  reminderDate: Date
): Promise<string | null> {
  try {
    const hasPermission = await registerForPushNotifications();
    if (!hasPermission) return null;

    // Web 端：使用 setTimeout 调度 + Web Notification API 显示，并持久化到 localStorage
    if (Platform.OS === 'web') {
      const delay = reminderDate.getTime() - Date.now();
      if (delay <= 0) return null;

      const id = `web-${todoId}-${Date.now()}`;
      const fireAt = reminderDate.getTime();
      const timer = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('待办提醒', { body: title });
        }
        webTimers.delete(id);
        removeWebReminder(id);
      }, delay);
      webTimers.set(id, timer);
      // 持久化，以便页面刷新后重新调度
      const list = readWebReminders();
      list.push({ id, todoId, title, fireAt });
      writeWebReminders(list);
      return id;
    }

    // 原生平台：使用 expo-notifications
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '待办提醒',
        body: title,
        data: { todoId },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'todo-reminder' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    return id;
  } catch (error) {
    console.error('Schedule notification error:', error);
    return null;
  }
}

/**
 * 取消提醒
 */
export async function cancelReminder(notificationId: string): Promise<void> {
  try {
    // Web 端：清除 setTimeout 定时器 + 移除持久化记录
    if (Platform.OS === 'web') {
      const timer = webTimers.get(notificationId);
      if (timer) {
        clearTimeout(timer);
        webTimers.delete(notificationId);
      }
      removeWebReminder(notificationId);
      return;
    }

    // 原生平台
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Cancel notification error:', error);
  }
}

/**
 * 取消所有提醒
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    // Web 端：清除所有定时器 + 清空持久化记录
    if (Platform.OS === 'web') {
      webTimers.forEach((timer) => clearTimeout(timer));
      webTimers.clear();
      writeWebReminders([]);
      return;
    }

    // 原生平台
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Cancel all notifications error:', error);
  }
}

/**
 * 获取所有已调度的通知
 */
export async function getScheduledReminders(): Promise<any[]> {
  try {
    if (Platform.OS === 'web') {
      // Web 端返回定时器 ID 列表
      return Array.from(webTimers.keys()).map((id) => ({ identifier: id }));
    }
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Get scheduled notifications error:', error);
    return [];
  }
}

/**
 * 添加通知监听器
 */
export function addNotificationListeners(
  onReceived?: (notification: any) => void,
  onTapped?: (notification: any) => void
) {
  // Web 端不支持 expo-notifications 的监听器
  if (Platform.OS === 'web') {
    return () => {};
  }

  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification: any) => {
      onReceived?.(notification);
    }
  );

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response: any) => {
      onTapped?.(response.notification);
    }
  );

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * 显示 Web 通知（用于 socket 推送提醒时在浏览器显示通知）
 */
export function showWebNotification(title: string, body: string): void {
  if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}
