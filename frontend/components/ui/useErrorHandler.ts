import { useState, useCallback, useRef } from 'react';

interface ErrorHandlerOptions {
  /** 自动清除错误的时间，毫秒，0 表示不自动清除 */
  autoClearMs?: number;
}

interface ErrorHandlerReturn {
  error: string | null;
  visible: boolean;
  showError: (msg: string) => void;
  clearError: () => void;
}

/**
 * 统一错误状态管理 hook。
 * 通常配合 ErrorSnackbar 使用，但也可以用于 showAlert。
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}): ErrorHandlerReturn {
  const { autoClearMs = 5000 } = options;
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clearError = useCallback(() => {
    setError(null);
    setVisible(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const showError = useCallback((msg: string) => {
    setError(msg);
    setVisible(true);
    if (autoClearMs > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        clearError();
      }, autoClearMs);
    }
  }, [autoClearMs, clearError]);

  return { error, visible, showError, clearError };
}
