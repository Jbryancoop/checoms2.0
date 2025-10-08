import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../services/auth';
import PreloadService from '../services/preloadService';
import { AnyUser } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';

interface ProfileScreenProps {
  onLogout: () => void;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [userInfo, setUserInfo] = useState<AnyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors, isDarkMode, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setIsLoading(true);

      // Try to use preloaded data first for instant loading
      const preloadedUser = PreloadService.getPreloadedCurrentUser();
      if (preloadedUser) {
        console.log('✅ Using preloaded user info');
        setUserInfo(preloadedUser);
        setIsLoading(false);
        return;
      }

      // Fallback to fetching if not preloaded
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (authResult) {
        console.log('📸 ProfilePic data:', authResult.userInfo.ProfilePic);
        console.log('📸 ProfilePic type:', typeof authResult.userInfo.ProfilePic);
        console.log('📸 ProfilePic is array:', Array.isArray(authResult.userInfo.ProfilePic));
        setUserInfo(authResult.userInfo);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
              onLogout();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleThemeToggle = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.errorText}>Unable to load profile information</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserInfo}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {userInfo.ProfilePic ? (
            <Image 
              source={{ uri: Array.isArray(userInfo.ProfilePic) ? userInfo.ProfilePic[0]?.url : userInfo.ProfilePic }} 
              style={styles.profileImage}
              onError={() => console.log('Failed to load profile image')}
            />
          ) : (
            <View style={styles.defaultProfileImage}>
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
          )}
        </View>
        <Text style={styles.name}>{userInfo['Full Name']}</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={20} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>
              {'CHE Email' in userInfo ? userInfo['CHE Email'] : userInfo['Email']}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="call" size={20} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{userInfo.Phone}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="business" size={20} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              {'Type of Campus' in userInfo ? 'Campus Type' : 'User Type'}
            </Text>
            <Text style={styles.infoValue}>
              {'Type of Campus' in userInfo ? userInfo['Type of Campus'] : userInfo['User Type']}
            </Text>
          </View>
        </View>

        {'Campus Director' in userInfo && userInfo['Campus Director'] && userInfo['Campus Director'].length > 0 && (
          <View style={styles.infoItem}>
            <Ionicons name="people" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Campus Director</Text>
              <Text style={styles.infoValue}>{userInfo['Campus Director'].join(', ')}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>Switch between light and dark themes</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={handleThemeToggle}
            trackColor={{ false: colors.separator, true: colors.primary }}
            thumbColor={isDarkMode ? colors.primaryText : '#f4f3f4'}
            ios_backgroundColor={colors.separator}
          />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color={colors.primaryText} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (colors: typeof ThemeColors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 30,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 10,
  },
  logoutButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
