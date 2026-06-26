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
 * 压缩图片（仅原生平台，Web 不支持 ImageManipulator）
 */
async function compressImage(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return uri;
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
 */
export async function uploadImage(uri: string, userId: string): Promise<string> {
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
    formData.append('user_id', userId);
    
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
 */
export async function uploadImages(uris: string[], userId: string): Promise<string[]> {
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
    
    formData.append('user_id', userId);
    
    // 调用后端批量上传接口
    const result = await api.upload.batch(formData);
    
    // 批量上传返回单个 upload 数据
  return [result.data?.url ?? ''];
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
