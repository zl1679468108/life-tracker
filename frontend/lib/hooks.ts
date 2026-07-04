import { useEffect, useState } from 'react';

/**
 * 通用防抖 Hook，延迟 delay 毫秒后更新值
 * 常用于搜索输入防抖，避免频繁触发 API 调用
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
