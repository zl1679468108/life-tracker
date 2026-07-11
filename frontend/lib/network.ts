import { Platform } from 'react-native';

type NetworkStatus = 'online' | 'offline' | 'unknown';
type NetworkListener = (status: NetworkStatus) => void;

const isTestEnvironment = () =>
  typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

class NetworkMonitor {
  private listeners: NetworkListener[] = [];
  private currentStatus: NetworkStatus = 'unknown';
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private started = false;

  constructor() {
    if (isTestEnvironment()) {
      this.currentStatus = 'online';
      this.started = true;
      return;
    }

    this.startMonitoring();
  }

  /**
   * 开始监控网络状态
   */
  private startMonitoring() {
    if (this.started) return;

    // Web 端使用 navigator.onLine
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
        this.currentStatus = navigator.onLine ? 'online' : 'offline';
        this.started = true;
      }
    } else {
      // 原生平台定期检测网络状态
      this.checkInterval = setInterval(() => {
        this.checkNetworkStatus();
      }, 5000);
      this.checkNetworkStatus();
      this.started = true;
    }
  }

  /**
   * Web 静态渲染阶段可能在没有 window 的情况下初始化单例。
   * 真正进入浏览器后再次访问时，补做一次启动，避免状态永久停留在 unknown。
   */
  private ensureMonitoring() {
    if (Platform.OS === 'web' && !this.started && typeof window !== 'undefined') {
      this.startMonitoring();
    }
  }

  /**
   * 检查网络状态（原生平台）
   * 探测自身后端地址而非第三方站点（google.com 在中国大陆不可访问，
   * 会导致原生端永远判定为 offline，进而触发缓存回退、数据不刷新）。
   */
  private async checkNetworkStatus() {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3020';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(baseUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // 只要能拿到响应（不论状态码），说明网络可达后端
      const newStatus: NetworkStatus = response.ok || response.status < 500 ? 'online' : 'offline';

      if (newStatus !== this.currentStatus) {
        this.currentStatus = newStatus;
        this.notifyListeners();
      }
    } catch (error) {
      if (this.currentStatus !== 'offline') {
        this.currentStatus = 'offline';
        this.notifyListeners();
      }
    }
  }

  /**
   * 处理上线事件（Web）
   */
  private handleOnline = () => {
    if (this.currentStatus !== 'online') {
      this.currentStatus = 'online';
      this.notifyListeners();
    }
  };

  /**
   * 处理离线事件（Web）
   */
  private handleOffline = () => {
    if (this.currentStatus !== 'offline') {
      this.currentStatus = 'offline';
      this.notifyListeners();
    }
  };

  /**
   * 通知所有监听器
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  /**
   * 添加网络状态监听器
   */
  addListener(listener: NetworkListener): () => void {
    this.ensureMonitoring();
    this.listeners.push(listener);
    // 立即通知当前状态
    listener(this.currentStatus);
    
    // 返回取消监听的函数
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 获取当前网络状态
   */
  getStatus(): NetworkStatus {
    this.ensureMonitoring();
    return this.currentStatus;
  }

  /**
   * 是否在线
   */
  isOnline(): boolean {
    this.ensureMonitoring();
    // unknown 更接近“尚未确认”而不是“确认离线”，
    // 对请求层按在线处理可避免首屏在 web 静态渲染后无限等待网络恢复。
    return this.currentStatus !== 'offline';
  }

  /**
   * 停止监控
   */
  stop() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.listeners = [];
  }
}

// 导出单例
export const networkMonitor = new NetworkMonitor();
