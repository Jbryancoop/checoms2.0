import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { RootTabParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { AlertService } from '../services/alertService';
import { MessageService } from '../services/messageService';
import { AuthService } from '../services/auth';
import { AppState } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import UpdatesScreen from '../screens/UpdatesScreen';
import InfoScreen from '../screens/InfoScreen';
import StudentsScreen from '../screens/StudentsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

interface AppNavigatorProps {
  onLogout: () => void;
}

export default function AppNavigator({ onLogout }: AppNavigatorProps) {
  const { colors, colorScheme } = useTheme();
  const [alertCount, setAlertCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Check for active alerts
  const checkAlerts = useCallback(async () => {
    try {
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (authResult?.userInfo) {
        const userAlerts = await AlertService.getAlertsForUser(authResult.userInfo);
        setAlertCount(userAlerts.length);
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }, []);

  useEffect(() => {
    // Register callback so alerts can notify when dismissed
    AlertService.setOnAlertsChangeCallback(checkAlerts);

    checkAlerts();

    // Recheck alerts every minute
    const interval = setInterval(checkAlerts, 60 * 1000);

    return () => {
      clearInterval(interval);
      AlertService.setOnAlertsChangeCallback(null);
    };
  }, [checkAlerts]);

  // Update app icon badge when alert count or message count changes
  useEffect(() => {
    const totalBadgeCount = alertCount + unreadMessageCount;
    Notifications.setBadgeCountAsync(totalBadgeCount).catch(err =>
      console.error('Error setting badge count:', err)
    );

    // Clear badge on unmount
    return () => {
      Notifications.setBadgeCountAsync(0).catch(err =>
        console.error('Error clearing badge count:', err)
      );
    };
  }, [alertCount, unreadMessageCount]);

  // Check for unread messages
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const checkMessages = async () => {
      try {
        console.log('[MSG] 🔔 Setting up badge listener in AppNavigator');
        const authResult = await AuthService.getCurrentUserWithStaffInfo();
        if (authResult?.userInfo?.UID) {
          console.log('[MSG] 🔔 Badge listener for user:', authResult.userInfo.UID, authResult.userInfo['Full Name']);
          unsubscribe = MessageService.getConversationsRealtime(
            authResult.userInfo.UID,
            (conversations) => {
              const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
              console.log('[MSG] 📊 Badge update - conversations:', conversations.length, 'total unread:', totalUnread);
              conversations.forEach(conv => {
                console.log(`[MSG]   - ${conv.recipient['Full Name']}: ${conv.unreadCount} unread`);
              });
              setUnreadMessageCount(totalUnread);
            }
          );
          console.log('[MSG] 🔔 Badge listener set up successfully');
        } else {
          console.log('[MSG] 🔔 No user found, cannot set up badge listener');
        }
      } catch (error) {
        console.error('[MSG] Error checking messages:', error);
      }
    };

    checkMessages();

    return () => {
      if (unsubscribe) {
        console.log('[MSG] 🔔 Cleaning up badge listener');
        unsubscribe();
      }
    };
  }, []);

  const navigationTheme = useMemo(() => {
    const baseTheme = colorScheme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [colorScheme, colors]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Updates') {
              iconName = focused ? 'newspaper' : 'newspaper-outline';
            } else if (route.name === 'Info') {
              iconName = focused ? 'information-circle' : 'information-circle-outline';
            } else if (route.name === 'Students') {
              iconName = focused ? 'school' : 'school-outline';
            } else if (route.name === 'Attendance') {
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
            } else if (route.name === 'Messages') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.separator,
          },
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.primaryText,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            headerShown: false,
            tabBarBadge: alertCount > 0 ? alertCount : undefined,
          }}
        />
        <Tab.Screen 
          name="Updates" 
          component={UpdatesScreen}
          options={{ 
            title: 'Updates',
            headerShown: false
          }}
        />
        <Tab.Screen
          name="Info"
          component={InfoScreen}
          options={{ title: 'Info' }}
        />
        <Tab.Screen
          name="Students"
          component={StudentsScreen}
          options={{
            title: 'Students',
            headerShown: false
          }}
        />
        <Tab.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={{
            title: 'Attendance',
            headerShown: false
          }}
        />
        <Tab.Screen
          name="Messages"
          component={MessagesScreen}
          options={{
            title: 'Messages',
            tabBarBadge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
            tabBarBadgeStyle: unreadMessageCount > 0 ? { minWidth: 20 } : undefined,
          }}
        />
        <Tab.Screen 
          name="Profile" 
          options={{ title: 'Profile' }}
        >
          {() => <ProfileScreen onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
