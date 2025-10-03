import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthService } from './src/services/auth';
import { NotificationService } from './src/services/notifications';
import PreloadService from './src/services/preloadService';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/screens/LoadingScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      // Set up notification handlers
      NotificationService.setupNotificationHandlers();

      // Start preloading data in the background (don't wait for it)
      PreloadService.preloadData().catch(err =>
        console.error('Background preload failed:', err)
      );

      // Check authentication state
      const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
        setIsAuthenticated(!!user);

        // If user is authenticated, ensure data is preloaded
        if (user) {
          await PreloadService.preloadData();
        }

        setIsLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribe = initializeApp();

    return () => {
      unsubscribe.then(unsub => unsub());
    };
  }, []);

  const handleAuthSuccess = async () => {
    // Preload data after successful auth
    await PreloadService.preloadData();
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear preloaded data on logout
    PreloadService.clearPreloadedData();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style="light" />
      {isAuthenticated ? (
        <AppNavigator onLogout={handleLogout} />
      ) : (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
}
