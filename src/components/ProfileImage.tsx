import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImageOptimizer } from '../utils/imageOptimizer';

interface ProfileImageProps {
  profilePic: any;
  size?: number;
  style?: any;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
}

export default function ProfileImage({
  profilePic,
  size = 50,
  style,
  showOnlineIndicator = false,
  isOnline = false,
}: ProfileImageProps) {
  const imageUrl = ImageOptimizer.getOptimizedAirtableUrl(profilePic, 'small');

  return (
    <View style={[styles.container, style]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.defaultImage, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons name="person" size={size * 0.4} color="#007AFF" />
        </View>
      )}

      {showOnlineIndicator && isOnline && (
        <View style={[styles.onlineIndicator, { width: size * 0.24, height: size * 0.24, borderRadius: size * 0.12 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#f0f8ff',
  },
  defaultImage: {
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
