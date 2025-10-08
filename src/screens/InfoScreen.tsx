import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DirectoryScreen from './DirectoryScreen';
import CalendarScreen from './CalendarScreen';
import WaiversScreen from './WaiversScreen';
import AlertsScreen from './AlertsScreen';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';

interface InfoCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  action?: {
    type: 'link' | 'email' | 'phone' | 'directory' | 'calendar' | 'waivers' | 'alerts';
    value: string;
    label: string;
  };
}

export default function InfoScreen() {
  const [showDirectory, setShowDirectory] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWaivers, setShowWaivers] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const infoCards: InfoCard[] = [
    {
      id: '1',
      title: 'Staff Handbook',
      description: 'Access the complete CHE staff handbook with policies, procedures, and guidelines.',
      icon: 'book',
      action: {
        type: 'link',
        value: 'https://docs.google.com/document/d/1j0fFOi0aX5ksHT-EPU-1byqX6Fr-griMTONlEYP2D8o/edit?usp=sharing',
        label: 'Open Handbook',
      },
    },
    {
      id: '2',
      title: 'Alerts History',
      description: 'View all current and past alerts with full details.',
      icon: 'notifications',
      action: {
        type: 'alerts',
        value: 'alerts',
        label: 'View Alerts',
      },
    },
    {
      id: '3',
      title: 'Key Dates',
      description: 'Important dates, deadlines, and events for the current academic year.',
      icon: 'calendar',
      action: {
        type: 'calendar',
        value: 'calendar',
        label: 'View Calendar',
      },
    },
    {
      id: '4',
      title: 'Tech Support',
      description: 'Get help with technical issues, password resets, and IT support.',
      icon: 'help-circle',
      action: {
        type: 'email',
        value: 'Help@che.school',
        label: 'Contact Tech Support',
      },
    },
    {
      id: '5',
      title: 'Liability Waivers',
      description: 'View and search student liability waivers on file.',
      icon: 'document-text',
      action: {
        type: 'waivers',
        value: 'waivers',
        label: 'View Waivers',
      },
    },
    {
      id: '6',
      title: 'Campus Directory',
      description: 'Directory of all CHE staff members with contact information.',
      icon: 'location',
      action: {
        type: 'directory',
        value: 'directory',
        label: 'View Directory',
      },
    },
  ];

  const handleAction = async (action: InfoCard['action']) => {
    if (!action) return;

    try {
      switch (action.type) {
        case 'link':
          const supported = await Linking.canOpenURL(action.value);
          if (supported) {
            await Linking.openURL(action.value);
          } else {
            Alert.alert('Error', 'Cannot open this link');
          }
          break;
        case 'email':
          await Linking.openURL(`mailto:${action.value}`);
          break;
        case 'phone':
          await Linking.openURL(action.value);
          break;
        case 'directory':
          setShowDirectory(true);
          break;
        case 'calendar':
          setShowCalendar(true);
          break;
        case 'waivers':
          setShowWaivers(true);
          break;
        case 'alerts':
          setShowAlerts(true);
          break;
      }
    } catch (error) {
      console.error('Error handling action:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const renderInfoCard = (card: InfoCard) => (
    <View key={card.id} style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={card.icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.cardTitle}>{card.title}</Text>
      </View>
      
      <Text style={styles.cardDescription}>{card.description}</Text>
      
      {card.action && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAction(card.action)}
        >
          <Text style={styles.actionButtonText}>{card.action.label}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (showDirectory) {
    return <DirectoryScreen onBack={() => setShowDirectory(false)} />;
  }

  if (showCalendar) {
    return <CalendarScreen onBack={() => setShowCalendar(false)} />;
  }

  if (showWaivers) {
    return <WaiversScreen onBack={() => setShowWaivers(false)} />;
  }

  if (showAlerts) {
    return <AlertsScreen onBack={() => setShowAlerts(false)} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CHE Information Center</Text>
        <Text style={styles.headerSubtitle}>
          Quick access to important resources and contacts
        </Text>
      </View>

      {infoCards.map(renderInfoCard)}
    </ScrollView>
  );
}

const createStyles = (colors: typeof ThemeColors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  cardDescription: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
});
