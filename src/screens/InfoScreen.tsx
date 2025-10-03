import React from 'react';
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

interface InfoCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  action?: {
    type: 'link' | 'email' | 'phone';
    value: string;
    label: string;
  };
}

export default function InfoScreen() {
  const infoCards: InfoCard[] = [
    {
      id: '1',
      title: 'Staff Handbook',
      description: 'Access the complete CHE staff handbook with policies, procedures, and guidelines.',
      icon: 'book',
      action: {
        type: 'link',
        value: 'https://docs.google.com/document/d/your-handbook-link',
        label: 'Open Handbook',
      },
    },
    {
      id: '2',
      title: 'Key Dates',
      description: 'Important dates, deadlines, and events for the current academic year.',
      icon: 'calendar',
      action: {
        type: 'link',
        value: 'https://calendar.google.com/calendar/embed?src=your-calendar-id',
        label: 'View Calendar',
      },
    },
    {
      id: '3',
      title: 'Tech Support',
      description: 'Get help with technical issues, password resets, and IT support.',
      icon: 'help-circle',
      action: {
        type: 'email',
        value: 'tech-support@che.school',
        label: 'Contact Tech Support',
      },
    },
    {
      id: '4',
      title: 'Emergency Contacts',
      description: 'Important emergency contact information for immediate assistance.',
      icon: 'call',
      action: {
        type: 'phone',
        value: 'tel:+1234567890',
        label: 'Emergency Line',
      },
    },
    {
      id: '5',
      title: 'Campus Directory',
      description: 'Directory of all CHE campuses and their contact information.',
      icon: 'location',
      action: {
        type: 'link',
        value: 'https://che.school/campuses',
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
          <Ionicons name={card.icon} size={24} color="#007AFF" />
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
          <Ionicons name="arrow-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CHE Information Center</Text>
        <Text style={styles.headerSubtitle}>
          Quick access to important resources and contacts
        </Text>
      </View>

      {infoCards.map(renderInfoCard)}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Need help? Contact your campus director or tech support.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
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
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
