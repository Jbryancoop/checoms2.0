# Real-Time Alert Push Notifications

## Current Setup
The app checks for new alerts:
- Every 5 minutes (automatic polling)
- When user navigates to Home screen
- When user pulls down to refresh

## Optional: Instant Push Notifications

To send push notifications immediately when an alert becomes active:

### 1. Create Airtable Automation
In your Airtable base:
1. Create a new Automation
2. **Trigger**: "When record matches conditions"
   - Table: Alerts
   - Conditions: Status = "Active"
3. **Action**: "Send webhook"
   - URL: `https://your-firebase-function-url/sendAlertNotification`
   - Method: POST
   - Content-Type: application/json
   - Body:
   ```json
   {
     "alertId": "{Record ID}",
     "title": "{Title}",
     "message": "{Message}",
     "priority": "{Priority}",
     "specificStaff": "{Specific Staff}"
   }
   ```

### 2. Create Firebase Cloud Function

Add to `functions/src/index.ts`:

```typescript
export const sendAlertNotification = functions.https.onRequest(async (req, res) => {
  try {
    const { title, message, priority, specificStaff } = req.body;

    // Get push tokens
    let tokens: string[] = [];

    if (specificStaff && specificStaff.length > 0) {
      // Send to specific staff only
      const staffSnapshot = await admin.firestore()
        .collection('staff')
        .where('airtableId', 'in', specificStaff)
        .get();

      tokens = staffSnapshot.docs
        .map(doc => doc.data().pushToken)
        .filter(token => token);
    } else {
      // Send to all staff
      const staffSnapshot = await admin.firestore()
        .collection('staff')
        .get();

      tokens = staffSnapshot.docs
        .map(doc => doc.data().pushToken)
        .filter(token => token);
    }

    // Send notifications
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: `🚨 ${title}`,
      body: message,
      data: { type: 'alert', priority },
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    res.status(200).send({ success: true, sent: tokens.length });
  } catch (error) {
    console.error('Error sending alert notification:', error);
    res.status(500).send({ error: error.message });
  }
});
```

### 3. Deploy Cloud Function
```bash
cd functions
npm run deploy
```

### 4. Update Airtable Webhook URL
Replace the webhook URL in your Airtable automation with your deployed function URL.

## Notes
- The 5-minute polling is sufficient for most use cases
- Push notifications are best for critical/urgent alerts
- Users can always manually refresh by pulling down on the home screen
