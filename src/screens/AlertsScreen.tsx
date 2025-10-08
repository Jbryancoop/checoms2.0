import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';
import { Alert } from '../types';
import { AirtableService } from '../services/airtable';
import { AlertService } from '../services/alertService';

interface AlertsScreenProps {
  onBack: () => void;
}

export default function AlertsScreen({ onBack }: AlertsScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const allAlerts = await AirtableService.getActiveAlerts();
      // Sort by created date (newest first)
      const sortedAlerts = allAlerts.sort((a, b) => {
        const dateA = new Date(a['Created Date'] || 0).getTime();
        const dateB = new Date(b['Created Date'] || 0).getTime();
        return dateB - dateA;
      });
      setAlerts(sortedAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderAlert = ({ item }: { item: Alert }) => {
    const priorityColor = AlertService.getPriorityColor(item.Priority || 'Low');
    const priorityBgColor = AlertService.getPriorityBackgroundColor(item.Priority || 'Low');
    const priorityBorderColor = AlertService.getPriorityBorderColor(item.Priority || 'Low');
    const priorityIcon = AlertService.getPriorityIcon(item.Priority || 'Low');

    return (
      <View
        style={[
          styles.alertCard,
          {
            backgroundColor: priorityBgColor,
            borderColor: priorityBorderColor,
          },
        ]}
      >
        <View style={styles.alertHeader}>
          <View style={styles.priorityBadge}>
            <Ionicons name={priorityIcon as any} size={16} color={priorityColor} />
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {item.Priority || 'Low'}
            </Text>
          </View>
          {item['Created Date'] && (
            <Text style={styles.dateText}>{formatDate(item['Created Date'])}</Text>
          )}
        </View>

        <Text style={[styles.alertTitle, { color: priorityColor }]}>
          {item.Title}
        </Text>

        <Text style={styles.alertMessage}>{item.Message}</Text>

        {item['Action Link'] && (
          <View style={styles.actionLinkContainer}>
            <Ionicons name="link" size={14} color={colors.textSecondary} />
            <Text style={styles.actionLinkText} numberOfLines={1}>
              {item['Action Link']}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerts History</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No alerts found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof ThemeColors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      backgroundColor: colors.card,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      padding: 16,
    },
    alertCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
    },
    alertHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    priorityText: {
      fontSize: 14,
      fontWeight: '600',
    },
    dateText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    alertTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
    },
    alertMessage: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
      marginBottom: 8,
    },
    actionLinkContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    actionLinkText: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
    },
  });
