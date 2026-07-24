import { Platform } from 'react-native';

/** 浏览器标签固定显示的应用名称 */
export const APP_DOCUMENT_NAME = 'LifeTracker';

/** Web 端写入 document.title；原生 no-op */
export function setDocumentTitle(title: string = APP_DOCUMENT_NAME): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.title !== title) {
    document.title = title;
  }
}

/** 始终使用品牌名 LifeTracker（不拼接页面名） */
export function setDocumentTitleFromSegments(_segments?: readonly string[]): void {
  setDocumentTitle(APP_DOCUMENT_NAME);
}
