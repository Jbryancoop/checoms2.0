const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Helper function to get push token from Airtable
async function getPushTokenFromAirtable(userId) {
  try {
    const apiKey = functions.config().airtable.api_key;
    const baseId = functions.config().airtable.base_id;
    
    // Try Users table first
    const usersUrl = `https://api.airtable.com/v0/${baseId}/Users?filterByFormula={UID}='${userId}'`;
    const usersResponse = await fetch(usersUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      if (usersData.records.length > 0) {
        return usersData.records[0].fields['Push Token'];
      }
    }
    
    // Try Staff table if not found in Users
    const staffUrl = `https://api.airtable.com/v0/${baseId}/Staff?filterByFormula={UID}='${userId}'`;
    const staffResponse = await fetch(staffUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (staffResponse.ok) {
      const staffData = await staffResponse.json();
      if (staffData.records.length > 0) {
        return staffData.records[0].fields['Push Token'];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

// Helper function to send push notification via Expo
async function sendPushNotification(pushToken, notification) {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {}
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    const result = await response.json();
    console.log('Push notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

exports.onNewMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    try {
      const messageId = context.params.messageId;
      const message = snap.data();
      
      console.log('=== NEW MESSAGE TRIGGER ===');
      console.log('Message ID:', messageId);
      console.log('Message data:', message);
      
      // Check if this message already has a notification sent flag
      if (message.notificationSent) {
        console.log('Notification already sent for this message, skipping');
        return;
      }
      
      // Don't send notification to the sender
      if (message.senderId === message.recipientId) {
        console.log('Skipping notification - same sender and recipient');
        return;
      }
      
      // Check if message has required fields
      if (!message.senderId || !message.recipientId || !message.content) {
        console.log('Message missing required fields, skipping notification');
        return;
      }
      
      console.log('Processing notification for message:', messageId);
      
      // Get recipient's push token from Airtable
      const pushToken = await getPushTokenFromAirtable(message.recipientId);
      
      if (!pushToken) {
        console.log('No push token found for recipient:', message.recipientId);
        return;
      }
      
      console.log('Found push token for recipient, sending notification');
      
      // Send push notification
      const result = await sendPushNotification(pushToken, {
        title: `New message from ${message.senderName}`,
        body: message.content,
        data: { 
          type: 'message',
          conversationId: message.conversationId || messageId,
          senderId: message.senderId,
          recipientId: message.recipientId,
          messageId: messageId
        }
      });
      
      console.log('Push notification sent successfully:', result);
      
      // Mark message as notification sent to prevent duplicates
      await snap.ref.update({
        notificationSent: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Message marked as notification sent');
    } catch (error) {
      console.error('Error in onNewMessage trigger:', error);
    }
  });
