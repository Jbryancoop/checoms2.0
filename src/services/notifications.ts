import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AirtableService } from './airtable';
import { AuthService } from './auth';

// Track if user is on Messages screen
let isOnMessagesScreen = false;

// Storage key for tracking if push token has been registered for this app install
const PUSH_TOKEN_REGISTERED_KEY = 'push_token_registered';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Don't show notification if app is in foreground and user is on Messages screen
    const appState = AppState.currentState;
    const isMessageNotification = notification.request.content.data?.type === 'message';

    if (appState === 'active' && isOnMessagesScreen && isMessageNotification) {
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

export class NotificationService {
  // Set whether user is on Messages screen
  static setOnMessagesScreen(value: boolean): void {
    isOnMessagesScreen = value;
  }

  // Request notification permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Get push token and register with Airtable (only on first login after app install)
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if we've already registered a push token for this app install
      const alreadyRegistered = await AsyncStorage.getItem(PUSH_TOKEN_REGISTERED_KEY);
      if (alreadyRegistered) {
        console.log('📱 Push token already registered for this app install, skipping');
        return alreadyRegistered;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;

      // Get current user
      const userWithStaff = await AuthService.getCurrentUserWithStaffInfo();
      if (!userWithStaff) {
        console.log('No authenticated user found');
        return null;
      }

      const email = userWithStaff.user.email!;
      const userInfo = userWithStaff.userInfo;

      // Determine if user is staff or regular user and update accordingly
      if ('CHE Email' in userInfo) {
        // This is a staff member (Leader)
        console.log('📱 Registering push token for staff member (FIRST TIME):', email);
        await AirtableService.updateStaffPushToken(email, token);
      } else if ('Email' in userInfo) {
        // This is a regular user
        console.log('📱 Registering push token for user (FIRST TIME):', email);
        await AirtableService.updateUserPushToken(email, token);
      }

      // Mark as registered so we don't update again
      await AsyncStorage.setItem(PUSH_TOKEN_REGISTERED_KEY, token);

      console.log('✅ Push token registered (first time for this app install):', token);
      return token;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  // Send push notification to a specific user
  static async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('📤 Push notification sent:', result);
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      throw error;
    }
  }

  // Send push notification to multiple tokens (for broadcasts)
  static async sendBulkPushNotifications(
    pushTokens: string[],
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      const messages = pushTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log(`📤 Sent ${pushTokens.length} push notifications:`, result);
    } catch (error) {
      console.error('❌ Error sending bulk push notifications:', error);
      throw error;
    }
  }

  // Handle notification received while app is in foreground
  static setupNotificationHandlers(): void {
    // Handle notification received
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can add custom logic here for handling notifications
    });

    // Handle notification response (when user taps notification)
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.screen) {
        // Navigate to specific screen
        // This will be handled by the navigation component
      }
    });
  }

  // Schedule local notification (for testing)
  static async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  // Get notification settings
  static async getNotificationSettings(): Promise<Notifications.NotificationPermissionsStatus> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw error;
    }
  }
}
