import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions, Text } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../../stores/themeStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImagePreviewProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImagePreview({ visible, images, initialIndex = 0, onClose }: ImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const colors = useColors();

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  };

  if (images.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <MaterialCommunityIcons name="close" size={28} color={colors.white} />
        </TouchableOpacity>

        {images.length > 1 && (
          <Text style={[styles.counter, { color: colors.white }]}>
            {currentIndex + 1} / {images.length}
          </Text>
        )}

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: images[currentIndex] }}
            style={styles.image}
            resizeMode="contain"
            cachePolicy="memory-disk"
            transition={200}
          />
        </View>

        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity style={[styles.navBtn, styles.navLeft]} onPress={goToPrev} activeOpacity={0.7}>
                <MaterialCommunityIcons name="chevron-left" size={36} color={colors.white} />
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity style={[styles.navBtn, styles.navRight]} onPress={goToNext} activeOpacity={0.7}>
                <MaterialCommunityIcons name="chevron-right" size={36} color={colors.white} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  counter: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    zIndex: 10,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.7,
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -30,
    width: 50,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navLeft: {
    left: 10,
  },
  navRight: {
    right: 10,
  },
});
