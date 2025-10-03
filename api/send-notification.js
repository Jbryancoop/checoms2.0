/**
 * Simple API endpoint for sending push notifications from Airtable
 * Can be deployed to Vercel or run locally
 *
 * To deploy to Vercel:
 * 1. npm install -g vercel
 * 2. vercel
 *
 * To run locally:
 * 1. node api/send-notification.js
 */

const Airtable = require('airtable');

// Vercel serverless function format
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recordId } = req.body || req.query;

    if (!recordId) {
      return res.status(400).json({ error: 'recordId is required' });
    }

    // Initialize Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY || process.env.EXPO_PUBLIC_AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID || process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID);

    console.log('📥 Processing notification request for record:', recordId);

    // Get the notification record
    const notificationRecord = await base('Push Notifications').find(recordId);
    const title = notificationRecord.get('Title');
    const message = notificationRecord.get('Message');
    const sendTo = notificationRecord.get('SendTo');
    const recipientLinks = notificationRecord.get('Recipient'); // Array of linked records

    console.log('📧 Notification details:', { title, sendTo, recipientCount: recipientLinks?.length });

    // Collect push tokens
    let tokens = [];

    if (sendTo === 'Single User' && recipientLinks && recipientLinks.length > 0) {
      // Get single user's token by record ID
      const recipientId = recipientLinks[0];

      // Try Users table
      try {
        const userRecord = await base('Users').find(recipientId);
        const token = userRecord.get('Push Token');
        if (token) tokens.push(token);
      } catch (err) {
        // Try Leaders table
        try {
          const leaderRecord = await base('Leaders').find(recipientId);
          const token = leaderRecord.get('Push Token');
          if (token) tokens.push(token);
        } catch (err2) {
          console.error('Recipient not found in either table');
        }
      }
    } else {
      // Get all tokens
      const userRecords = await base('Users').select({ fields: ['Push Token'] }).all();
      userRecords.forEach(record => {
        const token = record.get('Push Token');
        if (token) tokens.push(token);
      });

      const leaderRecords = await base('Leaders').select({ fields: ['Push Token'] }).all();
      leaderRecords.forEach(record => {
        const token = record.get('Push Token');
        if (token) tokens.push(token);
      });
    }

    console.log(`📱 Found ${tokens.length} push tokens`);

    if (tokens.length === 0) {
      await base('Push Notifications').update(recordId, {
        'Status': 'Failed',
        'ErrorMessage': 'No push tokens found',
        'SentCount': 0
      });
      return res.status(200).json({ error: 'No push tokens found', sent: 0 });
    }

    // Send via Expo Push API
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body: message,
      data: { type: sendTo === 'Single User' ? 'direct' : 'broadcast' }
    }));

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages)
    });

    const result = await expoResponse.json();
    console.log('✅ Expo response:', result);

    // Update status
    await base('Push Notifications').update(recordId, {
      'Status': 'Sent',
      'SentCount': tokens.length,
      'SentAt': new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      sent: tokens.length,
      tokens: tokens.length // Don't expose actual tokens
    });

  } catch (error) {
    console.error('❌ Error:', error);

    // Try to update record
    try {
      if (req.body?.recordId || req.query?.recordId) {
        const recordId = req.body?.recordId || req.query?.recordId;
        const base = new Airtable({
          apiKey: process.env.AIRTABLE_API_KEY || process.env.EXPO_PUBLIC_AIRTABLE_API_KEY
        }).base(process.env.AIRTABLE_BASE_ID || process.env.EXPO_PUBLIC_AIRTABLE_BASE_ID);

        await base('Push Notifications').update(recordId, {
          'Status': 'Failed',
          'ErrorMessage': error.message
        });
      }
    } catch (updateErr) {
      console.error('Could not update record:', updateErr);
    }

    return res.status(500).json({ error: error.message });
  }
};
