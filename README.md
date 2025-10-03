# CHE Staff Communication App

A React Native app built with Expo for CHE staff communication, featuring Firebase authentication, Airtable integration, and push notifications.

## Features

- **Firebase Google Authentication** - Secure login restricted to @che.school and @ventureoff.org emails
- **Staff Updates** - View announcements and updates from the StaffUpdates Airtable
- **Info Center** - Quick access to handbooks, calendars, and contact information
- **Messages** - Send messages to different recipient groups (Coordinator, Director, Tech)
- **Push Notifications** - Real-time notifications for new messages
- **Airtable Integration** - Uses Airtable as the backend data source

## Setup Instructions

### 1. Firebase Setup

You need to set up Firebase for authentication and push notifications:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Google Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google sign-in
   - Add your domain to authorized domains
4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and add a web app
   - Copy the Firebase config object

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Go to Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Add authorized redirect URIs for Expo AuthSession

### 3. Airtable Setup

1. Go to [Airtable](https://airtable.com/) and create your base
2. Set up the tables as specified in `Airtable.csv`
3. Get your API key from [Airtable Account](https://airtable.com/account)
4. Get your base ID from your base URL

### 4. Environment Configuration

1. Copy `env.example` to `.env` (create this file)
2. Fill in your configuration values:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Airtable Configuration
EXPO_PUBLIC_AIRTABLE_API_KEY=your_airtable_api_key
EXPO_PUBLIC_AIRTABLE_BASE_ID=your_base_id
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the App

```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # React Navigation setup
├── screens/            # Main app screens
│   ├── AuthScreen.tsx
│   ├── UpdatesScreen.tsx
│   ├── InfoScreen.tsx
│   └── MessagesScreen.tsx
├── services/           # API and external service integrations
│   ├── firebase.ts
│   ├── auth.ts
│   ├── airtable.ts
│   └── notifications.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── utils/              # Utility functions
```

## Airtable Schema

The app expects the following Airtable tables:

1. **StaffInfo** (tblO65y2oxVPbROoU) - Staff member information
2. **StaffUpdates** (tblJqbelzK03BNOwZ) - Announcements and updates
3. **StaffMessages** (tbl0VWPjWbDv1Cv4O) - Internal messaging
4. **2025-2026 Leaders** (tblltaeQ2muGLvXcb) - Staff directory

See `Airtable.csv` for detailed field specifications.

## Authentication Flow

1. User signs in with Google via Firebase Auth
2. Email is validated against authorized domains (@che.school, @ventureoff.org)
3. Staff information is fetched from Airtable Leaders table
4. Push notification token is registered and stored in Airtable
5. User gains access to the app features

## Push Notifications

- Uses Firebase Cloud Messaging (FCM)
- Tokens are stored in Airtable for each staff member
- Firebase Cloud Functions handle notification triggers
- Notifications are sent when new messages are created

## Development Notes

- The app uses Expo Go for development
- Firebase authentication works in web mode for easier development
- Airtable API calls are made directly from the client
- All sensitive configuration is stored in environment variables

## Next Steps for Production

1. Set up Firebase Cloud Functions for notification handling
2. Configure proper iOS push notification certificates
3. Set up EAS Build for iOS app store deployment
4. Implement proper error handling and offline support
5. Add unit tests for critical functionality

## Support

For technical support or questions, contact the tech team through the Messages tab in the app.
