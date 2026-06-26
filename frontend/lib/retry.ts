import { networkMonitor } from './network';

interface RetryOptions {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 初始延迟（ms） */
  baseDelay?: number;
  /** 是否仅在 GET 请求时重试 */
  getOnly?: boolean;
  /** 是否在网络离线时等待恢复 */
  waitForNetwork?: boolean;
  /** 网络恢复后额外延迟（ms） */
  networkRestoreDelay?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  baseDelay: 1000,
  getOnly: true,
  waitForNetwork: true,
  networkRestoreDelay: 500,
};

/**
 * 带指数退避的网络重试包装器。
 * - 对 GET 请求重试 2 次
 * - 写入操作仅重试 1 次（考虑幂等风险）
 * - 网络离线时等待恢复
 * - 临时网络错误（5xx/超时）自动重试
 * - 4xx 客户端错误不重试
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  method: string = 'GET',
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const maxRetries = opts.getOnly && method !== 'GET' ? 1 : opts.maxRetries;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // 如果离线，等待网络恢复
    if (opts.waitForNetwork && !networkMonitor.isOnline()) {
      await waitForNetwork(opts.networkRestoreDelay);
    }

    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // 最后一次尝试失败就直接抛
      if (attempt >= maxRetries) break;

      // 只对特定的网络/服务器错误重试
      if (!shouldRetry(error)) break;

      // 指数退避
      const delay = opts.baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * 判断错误是否可以重试
 */
function shouldRetry(error: any): boolean {
  if (!error) return false;

  // 超时错误可以重试
  if (error?.name === 'AbortError') return true;

  // 网络错误可以重试
  if (error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT') return true;

  // 服务器错误（5xx）可以重试
  if (typeof error?.code === 'number' && error.code >= 500) return true;

  // 4xx 客户端错误不重试
  if (typeof error?.code === 'number' && error.code >= 400 && error.code < 500) return false;

  // fetch 网络异常也可以重试
  if (error instanceof TypeError && error.message.includes('Network')) return true;

  return false;
}

/**
 * 等待网络恢复
 */
function waitForNetwork(extraDelay: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return new Promise((resolve) => {
    if (networkMonitor.isOnline()) {
      timer = setTimeout(resolve, extraDelay);
      return;
    }

    const unsubscribe = networkMonitor.addListener((status) => {
      if (status === 'online') {
        unsubscribe();
        timer = setTimeout(resolve, extraDelay);
      }
    });
    return () => { if (timer) { clearTimeout(timer); } };
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
