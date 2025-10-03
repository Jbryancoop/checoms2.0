import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList } from '../types';

// Import screens
import UpdatesScreen from '../screens/UpdatesScreen';
import InfoScreen from '../screens/InfoScreen';
import MessagesScreen from '../screens/MessagesScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Updates') {
              iconName = focused ? 'newspaper' : 'newspaper-outline';
            } else if (route.name === 'Info') {
              iconName = focused ? 'information-circle' : 'information-circle-outline';
            } else if (route.name === 'Messages') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Updates" 
          component={UpdatesScreen}
          options={{ title: 'Updates' }}
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
      </Tab.Navigator>
    </NavigationContainer>
  );
}
