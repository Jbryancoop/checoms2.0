import React, { useMemo } from 'react';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import UpdatesScreen from '../screens/UpdatesScreen';
import InfoScreen from '../screens/InfoScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

interface AppNavigatorProps {
  onLogout: () => void;
}

export default function AppNavigator({ onLogout }: AppNavigatorProps) {
  const { colors, colorScheme } = useTheme();

  const navigationTheme = useMemo(() => {
    const baseTheme = colorScheme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [colorScheme, colors]);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Updates') {
              iconName = focused ? 'newspaper' : 'newspaper-outline';
            } else if (route.name === 'Info') {
              iconName = focused ? 'information-circle' : 'information-circle-outline';
            } else if (route.name === 'Messages') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.separator,
          },
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.primaryText,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            headerShown: false,
          }}
        />
        <Tab.Screen 
          name="Updates" 
          component={UpdatesScreen}
          options={{ 
            title: 'Updates',
            headerShown: false
          }}
        />
        <Tab.Screen 
          name="Info" 
          component={InfoScreen}
          options={{ title: 'Info' }}
        />
        <Tab.Screen 
          name="Messages" 
          component={MessagesScreen}
          options={{ title: 'Messages' }}
        />
        <Tab.Screen 
          name="Profile" 
          options={{ title: 'Profile' }}
        >
          {() => <ProfileScreen onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
