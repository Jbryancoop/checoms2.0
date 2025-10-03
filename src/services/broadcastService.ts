import { AirtableService } from './airtable';
import { NotificationService } from './notifications';

export class BroadcastService {
  /**
   * Send a notification based on target audience
   * This can be called from an Airtable automation webhook
   */
  static async sendBroadcastNotification(
    title: string,
    message: string,
    sendTo: 'Single User' | 'All Staff' | 'All Users' | 'Everyone',
    recipientAirtableId?: string // Airtable record ID if sending to single user
  ): Promise<{ sent: number; failed: number; error?: string }> {
    try {
      console.log('📢 Broadcasting notification:', { title, message, sendTo, recipientAirtableId });

      let tokens: string[] = [];

      if (sendTo === 'Single User') {
        // Send to a single user
        if (!recipientAirtableId) {
          console.error('❌ Recipient ID required for single user notification');
          return { sent: 0, failed: 0, error: 'Recipient ID required' };
        }

        const token = await this.getTokenByAirtableRecordId(recipientAirtableId);
        if (token) {
          tokens = [token];
        } else {
          console.warn('⚠️ No push token found for recipient:', recipientAirtableId);
          return { sent: 0, failed: 1, error: 'No push token found for recipient' };
        }
      } else {
        // Get all push tokens
        tokens = await AirtableService.getAllPushTokens();
      }

      if (tokens.length === 0) {
        console.warn('⚠️ No push tokens found to send to');
        return { sent: 0, failed: 0, error: 'No push tokens found' };
      }

      console.log(`📱 Sending to ${tokens.length} device(s)...`);

      // Send notifications in batches of 100 (Expo limit)
      const batchSize = 100;
      let sent = 0;
      let failed = 0;

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);

        try {
          await NotificationService.sendBulkPushNotifications(
            batch,
            title,
            message,
            { type: sendTo === 'Single User' ? 'direct' : 'broadcast' }
          );
          sent += batch.length;
          console.log(`✅ Sent batch ${Math.floor(i / batchSize) + 1}: ${batch.length} notifications`);
        } catch (error) {
          console.error(`❌ Failed to send batch ${Math.floor(i / batchSize) + 1}:`, error);
          failed += batch.length;
        }
      }

      console.log(`📊 Broadcast complete: ${sent} sent, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('❌ Error broadcasting notifications:', error);
      return { sent: 0, failed: 0, error: error.message };
    }
  }

  /**
   * Get push token by Airtable record ID (from either Staff or Users table)
   */
  private static async getTokenByAirtableRecordId(recordId: string): Promise<string | null> {
    try {
      // The recordId is the Airtable record ID (like "recXXXXXXXXXXXXXX")
      // We need to fetch the record and get its UID, then get the push token by UID
      const user = await AirtableService.getUserById(recordId);

      if (user && user.UID) {
        return await AirtableService.getPushTokenByUID(user.UID);
      }

      return null;
    } catch (error) {
      console.error('Error getting token by Airtable record ID:', error);
      return null;
    }
  }

  /**
   * Test notification - send to a single user for testing
   */
  static async sendTestNotification(uid: string, title: string, message: string): Promise<boolean> {
    try {
      console.log('🧪 Sending test notification to:', uid);

      const pushToken = await AirtableService.getPushTokenByUID(uid);

      if (!pushToken) {
        console.error('❌ No push token found for user:', uid);
        return false;
      }

      await NotificationService.sendPushNotification(
        pushToken,
        title,
        message,
        { type: 'test' }
      );

      console.log('✅ Test notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return false;
    }
  }
}
