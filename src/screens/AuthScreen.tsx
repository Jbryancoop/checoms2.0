import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { AuthService } from '../services/auth';
import { auth } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';
import { HapticFeedback } from '../utils/haptics';


interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Configure Google Sign-In on component mount
  useEffect(() => {
    AuthService.configureGoogleSignIn();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      HapticFeedback.light();

      const authResult = await AuthService.signInWithGoogle();
      if (authResult) {
        HapticFeedback.success();
        onAuthSuccess();
      }
    } catch (error: any) {
      // Check if user cancelled the sign-in process
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';

      // Common cancellation error codes from Google Sign-In
      const cancellationCodes = [
        'SIGN_IN_CANCELLED',
        '-5', // iOS cancellation
        '12501', // Android cancellation
        'ERROR_CANCELLED',
      ];

      const isCancellation =
        cancellationCodes.some(code => errorCode.includes(code)) ||
        errorMessage.toLowerCase().includes('cancel') ||
        errorMessage.toLowerCase().includes('user cancelled');

      // If user cancelled, just return - don't show an error alert
      if (isCancellation) {
        return;
      }

      // For actual errors, show the alert
      console.error('Google sign-in error:', error);
      HapticFeedback.error();
      Alert.alert(
        'Authentication Error',
        error.message || 'An error occurred during authentication. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/che-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>CHE Comms</Text>
        <Text style={styles.subtitle}>
          Sign in with your CHE Google account
        </Text>

        <TouchableOpacity
          style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
          onPress={signInWithGoogle}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#1f1f1f" />
          ) : (
            <>
              <Image
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/480px-Google_%22G%22_logo.svg.png' }}
                style={styles.googleIconContainer}
                resizeMode="contain"
              />
              <Text style={styles.signInButtonText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof ThemeColors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#747775',
    marginBottom: 30,
    height: 40,
    minWidth: 'auto',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: 'rgba(60, 64, 67, 0.3)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 2,
  },
  signInButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderColor: 'rgba(31, 31, 31, 0.12)',
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  signInButtonText: {
    color: '#1f1f1f',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
});
