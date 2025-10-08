import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';
import { RootTabParamList, Alert } from '../types';
import { Colors as ThemeColors } from '../theme/colors';
import { AlertService } from '../services/alertService';
import { AuthService } from '../services/auth';
import { HapticFeedback } from '../utils/haptics';

type NavigationProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;

interface HomeSection {
  key: keyof RootTabParamList;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (authResult?.userInfo) {
        const userAlerts = await AlertService.getAlertsForUser(authResult.userInfo);
        setAlerts(userAlerts);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, [loadAlerts]);

  // Load alerts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [loadAlerts])
  );

  // Periodic polling for new alerts (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadAlerts]);

  const handleDismissAlert = async (alertId: string) => {
    HapticFeedback.light();
    await AlertService.dismissAlert(alertId);
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  const handleAlertAction = (alert: Alert) => {
    HapticFeedback.light();
    if (alert['Action Link']) {
      Linking.openURL(alert['Action Link']).catch(err => {
        console.error('Failed to open link:', err);
      });
    }
  };

  const sections: HomeSection[] = [
    {
      key: 'Updates',
      title: 'Staff Updates',
      description: 'Stay current with announcements, action items, and campus highlights.',
      icon: 'newspaper-outline',
    },
    {
      key: 'Students',
      title: 'Students',
      description: 'View and manage student information for your classes.',
      icon: 'school-outline',
    },
    {
      key: 'Attendance',
      title: 'Attendance',
      description: 'Track and manage student attendance for your classes.',
      icon: 'checkmark-circle-outline',
    },
    {
      key: 'Info',
      title: 'Resource Hub',
      description: 'Find handbooks, key dates, and quick links tailored for your role.',
      icon: 'information-circle-outline',
    },
    {
      key: 'Messages',
      title: 'Messages',
      description: 'Connect with teammates and campus directors in one organized inbox.',
      icon: 'chatbubbles-outline',
    },
    {
      key: 'Profile',
      title: 'Your Profile',
      description: 'Review your details, manage preferences, and sign out safely.',
      icon: 'person-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>CHE Comms</Text>
        </View>

        {/* Alert Banners */}
        {alerts.map(alert => (
          <View
            key={alert.id}
            style={[
              styles.alertBanner,
              {
                backgroundColor: AlertService.getPriorityBackgroundColor(alert.Priority),
                borderColor: AlertService.getPriorityBorderColor(alert.Priority),
              }
            ]}
          >
            <View style={styles.alertIconContainer}>
              <Ionicons
                name={AlertService.getPriorityIcon(alert.Priority) as any}
                size={28}
                color={AlertService.getPriorityColor(alert.Priority)}
              />
            </View>
            <View style={styles.alertContent}>
              <Text
                style={[
                  styles.alertTitle,
                  { color: AlertService.getPriorityColor(alert.Priority) }
                ]}
              >
                {alert.Title}
              </Text>
              <Text
                style={[
                  styles.alertMessage,
                  { color: AlertService.getPriorityColor(alert.Priority) }
                ]}
              >
                {alert.Message}
              </Text>
              {alert['Action Link'] && (
                <TouchableOpacity
                  style={styles.alertActionButton}
                  onPress={() => handleAlertAction(alert)}
                >
                  <Text
                    style={[
                      styles.alertActionText,
                      { color: AlertService.getPriorityColor(alert.Priority) }
                    ]}
                  >
                    Learn More
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={AlertService.getPriorityColor(alert.Priority)}
                  />
                </TouchableOpacity>
              )}
            </View>
            {alert.Dismissible && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => handleDismissAlert(alert.id)}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={AlertService.getPriorityColor(alert.Priority)}
                />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.cardsGrid}>
          {sections.map((section, index) => (
            <TouchableOpacity
              key={section.key}
              style={[styles.card, index === sections.length - 1 && styles.lastCard]}
              activeOpacity={0.9}
              onPress={() => {
                HapticFeedback.light();
                navigation.navigate(section.key);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${section.title}. ${section.description}`}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={section.icon} size={30} color={colors.primary} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{section.title}</Text>
                <Text style={styles.cardDescription}>{section.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof ThemeColors.light) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 20,
    },
    header: {
      marginBottom: 24,
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    welcomeSubtitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    cardsGrid: {
    },
    card: {
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    iconContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    cardTextContainer: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    lastCard: {
      marginBottom: 0,
    },
    footer: {
      marginTop: 32,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    footerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    footerDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    alertBanner: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderWidth: 1.5,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
    },
    alertIconContainer: {
      marginRight: 14,
      marginTop: 2,
    },
    alertContent: {
      flex: 1,
    },
    alertTitle: {
      fontSize: 17,
      fontWeight: '600',
      marginBottom: 6,
    },
    alertMessage: {
      fontSize: 15,
      lineHeight: 21,
      marginBottom: 8,
      fontWeight: '400',
    },
    alertActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingVertical: 6,
    },
    alertActionText: {
      fontSize: 15,
      fontWeight: '700',
      marginRight: 6,
      textDecorationLine: 'underline',
    },
    dismissButton: {
      padding: 4,
      marginLeft: 12,
    },
  });

