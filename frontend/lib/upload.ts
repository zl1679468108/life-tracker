import { api } from './api';
import { Platform } from 'react-native';

/**
 * 压缩头像（专门用于头像，尺寸更小）
 */
export async function compressAvatar(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return uri;
  }
  const ImageManipulator = await import('expo-image-manipulator');
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 256 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

/**
 * Web 端图片压缩：使用 Canvas API 缩放到最大宽度并转为 JPEG blob
 * 返回 blob URL，供后续 fetch 读取
 */
function compressImageWeb(uri: string, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 计算缩放尺寸，保持宽高比
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      // 创建 canvas 并绘制图片
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取 canvas 上下文'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // 转为压缩后的 blob（JPEG 格式）
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('图片压缩失败'));
            return;
          }
          resolve(URL.createObjectURL(blob));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = uri;
  });
}

/**
 * 压缩图片
 * - 原生平台：使用 expo-image-manipulator
 * - Web 平台：使用 Canvas API 缩放到最大宽度 1024，质量 0.8，JPEG 格式
 */
async function compressImage(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return compressImageWeb(uri, 1024, 0.8);
  }
  const ImageManipulator = await import('expo-image-manipulator');
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

/**
 * 上传图片到后端
 * user_id 由后端从认证 token 注入，前端无需传递。
 */
export async function uploadImage(uri: string, _userId?: string): Promise<string> {
  try {
    // 压缩图片（Web 跳过）
    const compressedUri = await compressImage(uri);

    // 读取文件为 blob
    const response = await fetch(compressedUri);
    const blob = await response.blob();

    // 生成文件名
    const ext = Platform.OS === 'web' ? 'jpg' : compressedUri.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}.${ext}`;

    // 创建 FormData
    const formData = new FormData();
    formData.append('files', blob, fileName);

    // 调用后端上传接口
    const result = await api.upload.single(formData);

    return result.data.url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * 批量上传图片
 * user_id 由后端从认证 token 注入，前端无需传递。
 */
export async function uploadImages(uris: string[], _userId?: string): Promise<string[]> {
  try {
    // 压缩所有图片
    const compressedUris = await Promise.all(uris.map(uri => compressImage(uri)));

    // 创建 FormData
    const formData = new FormData();

    // 添加所有文件
    for (let i = 0; i < compressedUris.length; i++) {
      const response = await fetch(compressedUris[i]);
      const blob = await response.blob();
      const ext = Platform.OS === 'web' ? 'jpg' : compressedUris[i].split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${i}.${ext}`;
      formData.append('files', blob, fileName);
    }

    // 调用后端批量上传接口
    const result = await api.upload.batch(formData);

    // 后端批量接口返回 { urls: string[], files: [{fileName, url}] }
    // UploadData 类型仅描述单文件上传，此处按实际响应结构访问
    const batchData = result.data as any;
    const urls = batchData?.urls;
    if (Array.isArray(urls) && urls.length > 0) {
      return urls;
    }
    // 兜底：从 files 映射
    const files = batchData?.files;
    if (Array.isArray(files) && files.length > 0) {
      return files.map((f: any) => f.url);
    }
    // 上传失败时不返回伪 URL，抛错让调用方感知
    throw new Error(result.message || '图片上传失败');
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * 从 URL 中提取存储路径
 */
export function getPathFromUrl(url: string): string | null {
  const match = url.match(/items-images\/(.+)$/);
  return match ? match[1] : null;
}
