import { Platform } from 'react-native';

type NetworkStatus = 'online' | 'offline' | 'unknown';
type NetworkListener = (status: NetworkStatus) => void;

class NetworkMonitor {
  private listeners: NetworkListener[] = [];
  private currentStatus: NetworkStatus = 'unknown';
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startMonitoring();
  }

  /**
   * 开始监控网络状态
   */
  private startMonitoring() {
    // Web 端使用 navigator.onLine
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
        this.currentStatus = navigator.onLine ? 'online' : 'offline';
      }
    } else {
      // 原生平台定期检测网络状态
      this.checkInterval = setInterval(() => {
        this.checkNetworkStatus();
      }, 5000);
      this.checkNetworkStatus();
    }
  }

  /**
   * 检查网络状态（原生平台）
   */
  private async checkNetworkStatus() {
    try {
      // 简单的网络检测
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });
      
      const newStatus = response.type === 'opaque' || response.ok ? 'online' : 'offline';
      
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
    return this.currentStatus;
  }

  /**
   * 是否在线
   */
  isOnline(): boolean {
    return this.currentStatus === 'online';
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
