import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { StaffUpdate } from '../types';
import { AirtableService } from '../services/airtable';

export default function UpdatesScreen() {
  const [updates, setUpdates] = useState<StaffUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUpdates = useCallback(async () => {
    try {
      const staffUpdates = await AirtableService.getStaffUpdates();
      setUpdates(staffUpdates);
    } catch (error) {
      console.error('Error loading updates:', error);
      Alert.alert('Error', 'Failed to load updates. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadUpdates();
  }, [loadUpdates]);

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderUpdate = ({ item }: { item: StaffUpdate }) => (
    <View style={styles.updateCard}>
      <Text style={styles.updateTitle}>{item.Title}</Text>
      <Text style={styles.updateDate}>{formatDate(item.Date)}</Text>
      <Text style={styles.updateDescription}>{item.Description}</Text>
      {item.Link && (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => handleLinkPress(item.Link!)}
        >
          <Text style={styles.linkText}>View Link</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No updates available</Text>
      <Text style={styles.emptyStateSubtext}>
        Pull down to refresh and check for new updates
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading updates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={updates}
        renderItem={renderUpdate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  updateCard: {
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
  updateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  updateDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  updateDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  linkButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  linkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
