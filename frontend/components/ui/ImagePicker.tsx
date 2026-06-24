import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Platform } from 'react-native';
import * as ImagePickerLib from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { borderRadius, fontSize, fontWeight, spacing, shadows } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { ImagePreview } from './ImagePreview';
import { showAlert } from '../../lib/alert';

interface ImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImagePicker({ images, onImagesChange, maxImages = 5 }: ImagePickerProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const colors = useColors();

  const pickImage = async () => {
    if (images.length >= maxImages) {
      showAlert('提示', `最多只能上传 ${maxImages} 张图片`);
      return;
    }

    const result = await ImagePickerLib.launchImageLibraryAsync({
      mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImagesChange([...images, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    if (images.length >= maxImages) {
      showAlert('提示', `最多只能上传 ${maxImages} 张图片`);
      return;
    }

    const { status } = await ImagePickerLib.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('提示', '需要相机权限才能拍照');
      return;
    }

    const result = await ImagePickerLib.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImagesChange([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  // Web 端：通过 DOM API 动态创建 input 元素打开文件选择器
  const pickImageWeb = () => {
    if (typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (maxImages - images.length > 1) {
      input.multiple = true;
    }
    // 不使用 display:none，某些浏览器会阻止文件选择器
    // 用定位移出视口 + 不可见的方式隐藏
    input.style.position = 'fixed';
    input.style.top = '-1000px';
    input.style.left = '-1000px';
    input.style.opacity = '0';

    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    input.onchange = () => {
      const files = input.files;
      if (!files || files.length === 0) {
        cleanup();
        return;
      }

      const remaining = maxImages - images.length;
      const filesToProcess = Array.from(files).slice(0, remaining);
      const collected: string[] = [];
      let loaded = 0;

      filesToProcess.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          collected.push(reader.result as string);
          loaded++;
          if (loaded === filesToProcess.length) {
            onImagesChange([...images, ...collected]);
          }
        };
        reader.readAsDataURL(file);
      });

      cleanup();
    };

    // 监听 focus 恢复来检测用户取消了文件对话框
    const onFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          cleanup();
        }
        window.removeEventListener('focus', onFocus);
      }, 300);
    };
    window.addEventListener('focus', onFocus);

    document.body.appendChild(input);
    input.click();
  };

  const showOptions = () => {
    if (images.length >= maxImages) {
      showAlert('提示', `最多只能上传 ${maxImages} 张图片`);
      return;
    }

    // Web 端直接打开文件选择器
    if (Platform.OS === 'web') {
      pickImageWeb();
      return;
    }

    // 原生平台使用 Alert 选择相册或拍照
    showAlert('选择图片', '请选择图片来源', [
      { text: '相册', onPress: pickImage },
      { text: '拍照', onPress: takePhoto },
      { text: '取消', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.previewGrid}>
        {images.map((uri, index) => (
          <TouchableOpacity key={index} style={styles.previewItem} onPress={() => openPreview(index)} activeOpacity={0.8}>
            <Image source={{ uri }} style={styles.previewImage} />
            <View style={styles.previewOverlay}>
              <MaterialCommunityIcons name="eye" size={20} color={colors.white} />
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeImage(index)}
            >
              <MaterialCommunityIcons name="close" size={16} color={colors.white} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        {images.length < maxImages && (
          <TouchableOpacity 
            style={[styles.addBtn, { borderColor: colors.gray[200], backgroundColor: colors.gray[50] }]} 
            onPress={showOptions}
          >
            <MaterialCommunityIcons name="camera-plus" size={32} color={colors.gray[400]} />
            <Text style={[styles.addText, { color: colors.gray[500] }]}>添加图片</Text>
            <Text style={[styles.addHint, { color: colors.gray[400] }]}>{images.length}/{maxImages}</Text>
          </TouchableOpacity>
        )}
      </View>
      <ImagePreview
        visible={previewVisible}
        images={images}
        initialIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  previewItem: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  addHint: {
    fontSize: 10,
  },
});
