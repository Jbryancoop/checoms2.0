import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.separator,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

// Pre-built skeleton layouts
export const MessageSkeleton = () => {
  return (
    <View style={styles.messageSkeletonContainer}>
      <View style={styles.messageSkeletonRow}>
        <Skeleton width={50} height={50} borderRadius={25} />
        <View style={styles.messageSkeletonContent}>
          <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={14} />
        </View>
      </View>
    </View>
  );
};

export const UpdateSkeleton = () => {
  return (
    <View style={styles.updateSkeletonContainer}>
      <Skeleton width="80%" height={20} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
      <Skeleton width="60%" height={14} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={200} borderRadius={12} />
    </View>
  );
};

export const StudentSkeleton = () => {
  return (
    <View style={styles.studentSkeletonContainer}>
      <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
      <Skeleton width="50%" height={14} />
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  messageSkeletonContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  messageSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageSkeletonContent: {
    flex: 1,
    marginLeft: 12,
  },
  updateSkeletonContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  studentSkeletonContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
});

Object.assign(styles, skeletonStyles);
