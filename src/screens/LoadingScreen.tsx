import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';

interface LoadingScreenProps {
  onTransitionComplete?: () => void;
}

export default function LoadingScreen({ onTransitionComplete }: LoadingScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Three bouncing dots with different delays
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Rotating circle animation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Scale animation for logo (grows to infinite on exit)
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const logoOpacityAnim = useRef(new Animated.Value(1)).current;
  const contentOpacityAnim = useRef(new Animated.Value(1)).current;

  const dotAnimationsRef = useRef<Animated.CompositeAnimation[]>([]);
  const rotateAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Bouncing dots animation
    const createBounceAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -20,
            duration: 500,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 500,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Rotating circle animation (5 seconds per rotation)
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const dot1Animation = createBounceAnimation(dot1Anim, 0);
    const dot2Animation = createBounceAnimation(dot2Anim, 200);
    const dot3Animation = createBounceAnimation(dot3Anim, 400);

    dot1Animation.start();
    dot2Animation.start();
    dot3Animation.start();
    rotateAnimation.start();

    dotAnimationsRef.current = [dot1Animation, dot2Animation, dot3Animation];
    rotateAnimationRef.current = rotateAnimation;

    return () => {
      dotAnimationsRef.current.forEach(anim => anim.stop());
      rotateAnimationRef.current?.stop();
    };
  }, []);

  // Trigger exit animation after minimum display time
  useEffect(() => {
    const exitTimer = setTimeout(() => {
      // Stop all looping animations
      dotAnimationsRef.current.forEach(anim => anim.stop());
      rotateAnimationRef.current?.stop();

      // Start exit animation - grow logo infinitely and fade everything else
      Animated.parallel([
        // Logo grows
        Animated.timing(scaleAnim, {
          toValue: 20, // Grow to 20x size
          duration: 800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        // Logo fades out later
        Animated.timing(logoOpacityAnim, {
          toValue: 0,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
        // Content (text and animations) fades out immediately
        Animated.timing(contentOpacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animation complete, notify parent
        onTransitionComplete?.();
      });
    }, 3000); // Wait 3 seconds before transitioning

    return () => clearTimeout(exitTimer);
  }, [onTransitionComplete]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={{
          transform: [{ scale: scaleAnim }],
          opacity: logoOpacityAnim,
        }}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacityAnim }}>
          <Text style={styles.title}>CHE Comms</Text>
        </Animated.View>

        {/* Rotating Circle with Dots */}
        <Animated.View style={[styles.animationContainer, { opacity: contentOpacityAnim }]}>
          <Animated.View
            style={[
              styles.rotatingCircle,
              {
                borderColor: colors.primary,
                transform: [{ rotate }]
              }
            ]}
          />

          {/* Bouncing Dots */}
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: colors.primary, transform: [{ translateY: dot1Anim }] }
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: colors.primary, transform: [{ translateY: dot2Anim }] }
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: colors.primary, transform: [{ translateY: dot3Anim }] }
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof ThemeColors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 40,
  },
  animationContainer: {
    position: 'relative',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotatingCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
