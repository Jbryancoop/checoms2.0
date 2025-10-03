/**
 * Firebase Cloud Function to send push notifications
 * Triggered by Airtable automation webhook
 *
 * Deploy with: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Airtable = require('airtable');

admin.initializeApp();

// Initialize Airtable
const base = new Airtable({
  apiKey: functions.config().airtable.api_key
}).base(functions.config().airtable.base_id);

exports.sendPushNotification = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  try {
    const { recordId } = req.body;

    if (!recordId) {
      return res.status(400).json({ error: 'recordId is required' });
    }

    // Get the notification record from Airtable
    const notificationRecord = await base('Push Notifications').find(recordId);
    const title = notificationRecord.get('Title');
    const message = notificationRecord.get('Message');
    const sendTo = notificationRecord.get('SendTo');
    const recipientIds = notificationRecord.get('Recipient'); // Array of linked record IDs

    console.log('Processing notification:', { title, sendTo, recipientIds });

    // Collect push tokens
    let tokens = [];

    if (sendTo === 'Single User' && recipientIds && recipientIds.length > 0) {
      // Get single user's token
      const recipientId = recipientIds[0];

      // Try Users table first
      try {
        const userRecords = await base('Users').select({
          filterByFormula: `RECORD_ID() = '${recipientId}'`,
          maxRecords: 1
        }).firstPage();

        if (userRecords.length > 0) {
          const token = userRecords[0].get('Push Token');
          if (token) tokens.push(token);
        }
      } catch (err) {
        console.log('User not found in Users table, checking Leaders...');
      }

      // Try Leaders table if not found
      if (tokens.length === 0) {
        try {
          const leaderRecords = await base('Leaders').select({
            filterByFormula: `RECORD_ID() = '${recipientId}'`,
            maxRecords: 1
          }).firstPage();

          if (leaderRecords.length > 0) {
            const token = leaderRecords[0].get('Push Token');
            if (token) tokens.push(token);
          }
        } catch (err) {
          console.error('Error fetching from Leaders table:', err);
        }
      }
    } else {
      // Get all tokens from both tables
      const userRecords = await base('Users').select({
        fields: ['Push Token']
      }).all();

      userRecords.forEach(record => {
        const token = record.get('Push Token');
        if (token) tokens.push(token);
      });

      const leaderRecords = await base('Leaders').select({
        fields: ['Push Token']
      }).all();

      leaderRecords.forEach(record => {
        const token = record.get('Push Token');
        if (token) tokens.push(token);
      });
    }

    console.log(`Found ${tokens.length} push tokens`);

    if (tokens.length === 0) {
      await base('Push Notifications').update(recordId, {
        'Status': 'Failed',
        'ErrorMessage': 'No push tokens found',
        'SentCount': 0
      });
      return res.status(200).json({ error: 'No push tokens found', sent: 0 });
    }

    // Send notifications via Expo Push API
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: message,
      data: { type: sendTo === 'Single User' ? 'direct' : 'broadcast' }
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages)
    });

    const result = await response.json();
    console.log('Expo response:', result);

    // Update the record
    await base('Push Notifications').update(recordId, {
      'Status': 'Sent',
      'SentCount': tokens.length,
      'SentAt': new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      sent: tokens.length,
      result
    });

  } catch (error) {
    console.error('Error sending notifications:', error);

    // Try to update status to failed
    try {
      if (req.body.recordId) {
        await base('Push Notifications').update(req.body.recordId, {
          'Status': 'Failed',
          'ErrorMessage': error.message
        });
      }
    } catch (updateError) {
      console.error('Error updating record:', updateError);
    }

    return res.status(500).json({
      error: error.message,
      sent: 0
    });
  }
});
