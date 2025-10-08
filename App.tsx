import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthService } from './src/services/auth';
import { NotificationService } from './src/services/notifications';
import { MessageService } from './src/services/messageService';
import { AlertService } from './src/services/alertService';
import PreloadService from './src/services/preloadService';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const { colorScheme } = useTheme();

  useEffect(() => {
    const initializeApp = async () => {
      // Clear dismissed alerts so active alerts show again each time app opens
      AlertService.clearDismissedAlerts().catch(err =>
        console.error('Failed to clear dismissed alerts:', err)
      );

      // Set up notification handlers
      NotificationService.setupNotificationHandlers();

      // Start preloading data in the background (don't wait for it)
      PreloadService.preloadData().catch(err =>
        console.error('Background preload failed:', err)
      );

      // Check authentication state
      const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
        setIsAuthenticated(!!user);

        // If user is authenticated, ensure data is preloaded and register for push notifications
        if (user) {
          await PreloadService.preloadData();

          // Register for push notifications
          NotificationService.registerForPushNotifications().catch(err =>
            console.error('Failed to register push token:', err)
          );

          // Initialize message conversations in the background
          try {
            const authResult = await AuthService.getCurrentUserWithStaffInfo();
            if (authResult?.userInfo?.UID) {
              console.log('📱 Preloading message conversations for user:', authResult.userInfo.UID);
              MessageService.initializeConversationsFromMessages(authResult.userInfo.UID).catch(err =>
                console.error('Failed to initialize conversations:', err)
              );
            }
          } catch (error) {
            console.error('Failed to get current user for message preload:', error);
          }
        }

        // Mark loading as complete (LoadingScreen will control the transition)
        setIsLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribe = initializeApp();

    return () => {
      unsubscribe.then(unsub => unsub());
    };
  }, []);

  const handleTransitionComplete = () => {
    setShowContent(true);
  };

  const handleAuthSuccess = async () => {
    // Preload data after successful auth
    await PreloadService.preloadData();

    // Initialize message conversations in the background
    try {
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (authResult?.userInfo?.UID) {
        console.log('📱 Preloading message conversations for user:', authResult.userInfo.UID);
        MessageService.initializeConversationsFromMessages(authResult.userInfo.UID).catch(err =>
          console.error('Failed to initialize conversations:', err)
        );
      }
    } catch (error) {
      console.error('Failed to get current user for message preload:', error);
    }

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear preloaded data on logout
    PreloadService.clearPreloadedData();
    setIsAuthenticated(false);
  };

  if (!showContent) {
    return <LoadingScreen onTransitionComplete={handleTransitionComplete} />;
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {isAuthenticated ? (
        <AppNavigator onLogout={handleLogout} />
      ) : (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
