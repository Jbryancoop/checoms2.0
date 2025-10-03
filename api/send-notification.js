const Airtable = require('airtable');

module.exports = async (req, res) => {
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

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      hasBaseId: !!baseId
    });

    if (!apiKey || !baseId) {
      return res.status(500).json({
        error: 'Server configuration error - Airtable credentials missing'
      });
    }

    const base = new Airtable({ apiKey }).base(baseId);

    console.log('📥 Processing notification for record:', recordId);

    const notificationRecord = await base('Push Notifications').find(recordId);
    const title = notificationRecord.get('Title');
    const message = notificationRecord.get('Message');
    const sendTo = notificationRecord.get('SendTo');
    const recipientLinks = notificationRecord.get('Recipient');

    console.log('📧 Details:', { title, sendTo });

    let tokens = [];

    if (sendTo === 'Single User' && recipientLinks && recipientLinks.length > 0) {
      const recipientId = recipientLinks[0];

      try {
        const userRecord = await base('Users').find(recipientId);
        const token = userRecord.get('Push Token');
        if (token) tokens.push(token);
      } catch (err) {
        try {
          const staffRecord = await base('Staff').find(recipientId);
          const token = staffRecord.get('Push Token');
          if (token) tokens.push(token);
        } catch (err2) {
          console.error('Recipient not found');
        }
      }
    } else {
      const userRecords = await base('Users').select({ fields: ['Push Token'] }).all();
      userRecords.forEach(record => {
        const token = record.get('Push Token');
        if (token) tokens.push(token);
      });

      const staffRecords = await base('Staff').select({ fields: ['Push Token'] }).all();
      staffRecords.forEach(record => {
        const token = record.get('Push Token');
        if (token) tokens.push(token);
      });
    }

    console.log(`📱 Found ${tokens.length} tokens`);

    if (tokens.length === 0) {
      await base('Push Notifications').update(recordId, {
        'Status': 'Failed',
        'ErrorMessage': 'No push tokens found',
        'SentCount': 0
      });
      return res.status(200).json({ error: 'No push tokens found', sent: 0 });
    }

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

    await base('Push Notifications').update(recordId, {
      'Status': 'Sent',
      'SentCount': tokens.length,
      'SentAt': new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      sent: tokens.length
    });

  } catch (error) {
    console.error('❌ Error:', error);

    return res.status(500).json({
      error: error.message
    });
  }
};
