import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { AirtableService } from './airtable';
import { AuthService } from './auth';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
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

  // Get push token and register with Airtable
  static async registerForPushNotifications(): Promise<string | null> {
    try {
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

      // Update push token in Airtable
      await AirtableService.updateStaffPushToken(
        userWithStaff.user.email!,
        token
      );

      console.log('Push token registered:', token);
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
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
