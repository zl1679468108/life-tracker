// 扫码工具函数
import { Platform } from 'react-native';

/**
 * 启动扫码功能
 * 注意：实际扫码需要 expo-camera 和 expo-barcode-scanner
 * 这里提供 UI 入口和手动输入方案
 */
export async function scanBarcode(): Promise<string | null> {
  // Web 端不支持原生扫码，提供手动输入
  if (Platform.OS === 'web') {
    return manualInputBarcode();
  }

  // 原生端需要安装 expo-camera 和 expo-barcode-scanner
  // 这里返回 null，提示用户手动输入
  if (__DEV__) console.log('扫码功能需要安装 expo-camera');
  return null;
}

/**
 * 手动输入条形码
 */
function manualInputBarcode(): Promise<string | null> {
  return new Promise((resolve) => {
    // 在 Web 端使用 prompt
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const barcode = window.prompt('请输入条形码');
      resolve(barcode);
    } else {
      resolve(null);
    }
  });
}

/**
 * 生成简单的条形码文本表示
 * 实际应用中应该使用专业的条形码生成库
 */
export function generateBarcodeText(barcode: string): string {
  // 简单的文本表示，实际应该使用条形码字体或图片
  return barcode;
}

/**
 * 验证条形码格式
 */
export function validateBarcode(barcode: string): boolean {
  // 支持常见的条形码格式
  // EAN-13: 13位数字
  // UPC-A: 12位数字
  // Code 128: 可变长度
  // QR Code: 任意文本
  
  if (!barcode || barcode.trim().length === 0) {
    return false;
  }
  
  // 如果是纯数字，检查长度
  if (/^\d+$/.test(barcode)) {
    return [8, 12, 13, 14].includes(barcode.length);
  }
  
  // 其他格式（QR Code 等）允许任意文本
  return true;
}
