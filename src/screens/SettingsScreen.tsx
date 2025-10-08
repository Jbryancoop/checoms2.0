import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notifications';
import { HapticFeedback } from '../utils/haptics';

export default function SettingsScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleToggleNotifications = async (value: boolean) => {
    HapticFeedback.light();
    setNotificationsEnabled(value);
    // Store preference
    await AsyncStorage.setItem('notifications_enabled', JSON.stringify(value));
  };

  const handleToggleTheme = () => {
    HapticFeedback.light();
    toggleTheme();
  };

  const handleClearCache = () => {
    HapticFeedback.warning();
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and reload the app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            HapticFeedback.heavy();
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'Cache cleared successfully. Please restart the app.');
              HapticFeedback.success();
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
              HapticFeedback.error();
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    HapticFeedback.warning();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            HapticFeedback.heavy();
            try {
              await AuthService.signOut();
              HapticFeedback.success();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
              HapticFeedback.error();
            }
          },
        },
      ]
    );
  };

  const handleCheckNotificationSettings = async () => {
    HapticFeedback.light();
    const settings = await NotificationService.getNotificationSettings();
    const status = settings.status;

    Alert.alert(
      'Notification Permissions',
      `Current status: ${status}\n\n${
        status === 'granted'
          ? 'Notifications are enabled.'
          : 'Notifications are disabled. Please enable them in your device settings.'
      }`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Use dark theme for better viewing at night
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.primaryText}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive notifications for new messages and updates
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.primaryText}
            />
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleCheckNotificationSettings}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="settings-outline" size={24} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Notification Permissions</Text>
                <Text style={styles.settingDescription}>
                  Check your notification permission status
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearCache}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={24} color={colors.warning} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.warning }]}>
                  Clear Cache
                </Text>
                <Text style={styles.settingDescription}>
                  Remove all cached data and images
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleSignOut}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={24} color={colors.error} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.error }]}>
                  Sign Out
                </Text>
                <Text style={styles.settingDescription}>
                  Sign out of your account
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>2025.1</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CHE Comms © 2025
          </Text>
          <Text style={styles.footerSubtext}>
            Made with care for CHE staff and families
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof ThemeColors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    headerTitle: {
      fontSize: 34,
      fontWeight: '700',
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    section: {
      marginTop: 32,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 1,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    settingText: {
      marginLeft: 12,
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    infoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    infoValue: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
    },
    footerText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    footerSubtext: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  });
