/**
 * Firebase Cloud Function to send push notifications
 * Triggered by Airtable automation webhook
 *
 * AIRTABLE PUSH NOTIFICATIONS TABLE STRUCTURE:
 * Fields:
 * - Title (Single line text, Primary field)
 * - Message (Long text)
 * - SendTo (Single select: "Single User", "All Staff", "All Users", "Everyone")
 * - Recipient - User (Linked record to Users table - must exist)
 * - Recipient - Staff (Linked record to Staff table)
 * - Status (Single select: "Pending", "Sent", "Failed")
 * - SentCount (Number)
 * - SentAt (Date)
 * - ErrorMessage (Long text)
 * - Push! (Checkbox)
 * - Push Token (from Recipient - User) (Lookup field - contains actual push tokens)
 * - Push Token (from Recipient - Staff) (Lookup field - contains actual push tokens)
 *
 * Field IDs:
 * fld5Ww3CvCWcEFf8N - Title
 * fld16ZyzPUAmY0I3M - Message
 * fldGduwpbDll6ORWl - SendTo
 * fldjuhLPWjD1K0hAz - Recipient - User
 * fldLCxd6FZ2ZTV2cQ - Recipient - Staff
 * fldn3DGh94qeNus07 - Status
 * fldjddBL1P5NTXNFu - SentCount
 * fldHicn1MCeTR3HxN - SentAt
 * fldNNHWxNfTuMyoUg - ErrorMessage
 * fldoBX2TRRdgRPSzZ - Push!
 * [Lookup Field IDs - add when available]
 *
 * Deploy with: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

// Helper function to make Airtable API requests
async function airtableRequest(apiKey, baseId, tableName, method = 'GET', recordId = null, body = null) {
  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const url = recordId ? `${baseUrl}/${recordId}` : baseUrl;

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable error: ${response.status} - ${error}`);
  }
  return response.json();
}

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

    // Get config
    const apiKey = functions.config().airtable.api_key;
    const baseId = functions.config().airtable.base_id;

    console.log('Config check:', {
      hasApiKey: !!apiKey,
      hasBaseId: !!baseId
    });

    if (!apiKey || !baseId) {
      return res.status(500).json({
        error: 'Server configuration error - Airtable credentials missing'
      });
    }

    // Get the notification record from Airtable with lookup fields
    const notificationData = await airtableRequest(apiKey, baseId, 'Push Notifications', 'GET', recordId);
    const title = notificationData.fields.Title;
    const message = notificationData.fields.Message;
    const sendTo = notificationData.fields['SendTo'];
    const recipientUserIds = notificationData.fields['Recipient - User']; // Array of linked User record IDs
    const recipientStaffIds = notificationData.fields['Recipient - Staff']; // Array of linked Staff record IDs
    const pushTokensFromUsers = notificationData.fields['Push Token (from Recipient - User)']; // Lookup field
    const pushTokensFromStaff = notificationData.fields['Push Token (from Recipient - Staff)']; // Lookup field

    console.log('Processing notification:', { 
      title, 
      sendTo, 
      recipientUserIds, 
      recipientStaffIds,
      pushTokensFromUsers,
      pushTokensFromStaff
    });

    // Collect push tokens
    let tokens = [];

    if (sendTo === 'Single User') {
      // Use lookup fields to get tokens directly
      if (pushTokensFromUsers && pushTokensFromUsers.length > 0) {
        tokens.push(...pushTokensFromUsers.filter(token => token && token.trim() !== ''));
      }
      if (pushTokensFromStaff && pushTokensFromStaff.length > 0) {
        tokens.push(...pushTokensFromStaff.filter(token => token && token.trim() !== ''));
      }
    } else if (sendTo === 'All Staff') {
      // Get all tokens from Staff table
      const staffUrl = `https://api.airtable.com/v0/${baseId}/Staff?fields%5B%5D=Push%20Token`;
      const staffResponse = await fetch(staffUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const staffData = await staffResponse.json();

      staffData.records.forEach(record => {
        const token = record.fields['Push Token'];
        if (token) tokens.push(token);
      });
    } else if (sendTo === 'All Users') {
      // Get all tokens from Users table
      const usersUrl = `https://api.airtable.com/v0/${baseId}/Users?fields%5B%5D=Push%20Token`;
      const usersResponse = await fetch(usersUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const usersData = await usersResponse.json();

      usersData.records.forEach(record => {
        const token = record.fields['Push Token'];
        if (token) tokens.push(token);
      });
    } else if (sendTo === 'Everyone') {
      // Get all tokens from both tables
      const staffUrl = `https://api.airtable.com/v0/${baseId}/Staff?fields%5B%5D=Push%20Token`;
      const staffResponse = await fetch(staffUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const staffData = await staffResponse.json();

      staffData.records.forEach(record => {
        const token = record.fields['Push Token'];
        if (token) tokens.push(token);
      });

      const usersUrl = `https://api.airtable.com/v0/${baseId}/Users?fields%5B%5D=Push%20Token`;
      const usersResponse = await fetch(usersUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const usersData = await usersResponse.json();

      usersData.records.forEach(record => {
        const token = record.fields['Push Token'];
        if (token) tokens.push(token);
      });
    }

    console.log(`Found ${tokens.length} push tokens`);

    if (tokens.length === 0) {
      await airtableRequest(apiKey, baseId, 'Push Notifications', 'PATCH', recordId, {
        fields: {
          'Status': 'Failed',
          'ErrorMessage': 'No push tokens found',
          'SentCount': 0
        }
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
    await airtableRequest(apiKey, baseId, 'Push Notifications', 'PATCH', recordId, {
      fields: {
        'Status': 'Sent',
        'SentCount': tokens.length,
        'SentAt': new Date().toISOString()
      }
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
        const failApiKey = functions.config().airtable.api_key;
        const failBaseId = functions.config().airtable.base_id;
        await airtableRequest(failApiKey, failBaseId, 'Push Notifications', 'PATCH', req.body.recordId, {
          fields: {
            'Status': 'Failed',
            'ErrorMessage': error.message
          }
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
