import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AnyUser } from '../types';
import { AirtableService } from './airtable';

const DISMISSED_ALERTS_KEY = '@dismissed_alerts';

// Global callback for when alerts change
let onAlertsChangeCallback: (() => void) | null = null;

export class AlertService {
  // Register a callback to be notified when alerts change
  static setOnAlertsChangeCallback(callback: (() => void) | null): void {
    onAlertsChangeCallback = callback;
  }
  // Get alerts filtered for the current user
  static async getAlertsForUser(user: AnyUser): Promise<Alert[]> {
    try {
      const allAlerts = await AirtableService.getActiveAlerts();
      const dismissedAlerts = await this.getDismissedAlerts();

      // Filter alerts based on targeting
      const relevantAlerts = allAlerts.filter(alert => {
        // Check if already dismissed
        if (dismissedAlerts.includes(alert.id)) {
          return false;
        }

        // Check Specific Staff - if specified, only show to those staff members
        if (alert['Specific Staff'] && alert['Specific Staff'].length > 0) {
          if (!alert['Specific Staff'].includes(user.id)) {
            return false;
          }
        }

        // If no specific staff targeting, show to all users
        return true;
      });

      return relevantAlerts;
    } catch (error) {
      console.error('Error getting alerts for user:', error);
      return [];
    }
  }

  // Get list of dismissed alert IDs
  static async getDismissedAlerts(): Promise<string[]> {
    try {
      const dismissed = await AsyncStorage.getItem(DISMISSED_ALERTS_KEY);
      return dismissed ? JSON.parse(dismissed) : [];
    } catch (error) {
      console.error('Error getting dismissed alerts:', error);
      return [];
    }
  }

  // Dismiss an alert
  static async dismissAlert(alertId: string): Promise<void> {
    try {
      const dismissed = await this.getDismissedAlerts();
      if (!dismissed.includes(alertId)) {
        dismissed.push(alertId);
        await AsyncStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(dismissed));

        // Notify callback that alerts have changed
        if (onAlertsChangeCallback) {
          onAlertsChangeCallback();
        }
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  }

  // Clear all dismissed alerts (optional, for testing or reset)
  static async clearDismissedAlerts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DISMISSED_ALERTS_KEY);
    } catch (error) {
      console.error('Error clearing dismissed alerts:', error);
    }
  }

  // Get priority color (for text/icons)
  static getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'Critical': '#7C2D12', // deep brown-red
      'High': '#92400E', // deep amber-brown
      'Medium': '#78350F', // deep brown
      'Low': '#7C2D12', // deep brown-red
    };

    return colors[priority] || colors['Low'];
  }

  // Get priority background color
  static getPriorityBackgroundColor(priority: string): string {
    const colors: Record<string, string> = {
      'Critical': '#FED7D7', // soft muted red
      'High': '#FED7AA', // soft muted orange
      'Medium': '#FDE68A', // soft muted yellow
      'Low': '#FECACA', // soft muted pink-red
    };

    return colors[priority] || colors['Low'];
  }

  // Get priority border color (darker shade)
  static getPriorityBorderColor(priority: string): string {
    const colors: Record<string, string> = {
      'Critical': '#F87171', // muted coral-red
      'High': '#FB923C', // muted orange
      'Medium': '#FBBF24', // muted amber
      'Low': '#FCA5A5', // muted rose
    };

    return colors[priority] || colors['Low'];
  }

  // Get icon for priority
  static getPriorityIcon(priority: string): string {
    const icons: Record<string, string> = {
      'Critical': 'alert-circle',
      'High': 'warning',
      'Medium': 'information-circle',
      'Low': 'notifications',
    };

    return icons[priority] || icons['Low'];
  }
}
