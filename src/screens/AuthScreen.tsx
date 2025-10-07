import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { AuthService } from '../services/auth';
import { auth } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';


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
    console.log('🔥 Firebase Auth instance:', auth);
    console.log('🔥 Current user:', auth.currentUser);
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting native Google sign-in...');
      
      const authResult = await AuthService.signInWithGoogle();
      if (authResult) {
        console.log('✅ Firebase authentication successful');
        onAuthSuccess();
      }
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
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
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>CHE Staff Communication</Text>
        <Text style={styles.subtitle}>
          Sign in with your CHE or VentureOff Google account
        </Text>

        <TouchableOpacity
          style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
          onPress={signInWithGoogle}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <>
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleLogo}
              />
              <Text style={styles.signInButtonText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Only @che.school and @ventureoff.org email addresses are authorized to use this app.
        </Text>
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
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 30,
    minWidth: 200,
    justifyContent: 'center',
  },
  signInButtonDisabled: {
    backgroundColor: colors.separator,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  signInButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
});
