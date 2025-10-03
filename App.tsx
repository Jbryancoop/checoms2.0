import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthService } from './src/services/auth';
import { NotificationService } from './src/services/notifications';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up notification handlers
    NotificationService.setupNotificationHandlers();

    // Check authentication state
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null; // You can add a loading screen here
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
