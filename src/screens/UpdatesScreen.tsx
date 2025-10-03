import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StaffUpdate } from '../types';
import { AirtableService } from '../services/airtable';
import UpdateDetailScreen from './UpdateDetailScreen';

export default function UpdatesScreen() {
  const [updates, setUpdates] = useState<StaffUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<StaffUpdate | null>(null);

  const loadUpdates = useCallback(async () => {
    try {
      console.log('🔄 Loading updates...');
      const staffUpdates = await AirtableService.getStaffUpdates();
      console.log('📱 Received updates in UpdatesScreen:', staffUpdates);
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

  const handleUpdatePress = (update: StaffUpdate) => {
    setSelectedUpdate(update);
  };

  const handleBack = () => {
    setSelectedUpdate(null);
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

  const getImageUrl = (update: StaffUpdate) => {
    if (!update.image) return null;
    return Array.isArray(update.image) ? update.image[0]?.url : update.image;
  };

  const renderUpdate = ({ item }: { item: StaffUpdate }) => {
    const imageUrl = getImageUrl(item);
    
    return (
      <TouchableOpacity 
        style={styles.updateCard} 
        onPress={() => handleUpdatePress(item)}
        activeOpacity={0.7}
      >
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        )}
        <View style={styles.cardContent}>
          <Text style={styles.updateTitle}>{item.Title}</Text>
          <Text style={styles.updateDate}>{formatDate(item.Date)}</Text>
          <Text style={styles.updateDescription} numberOfLines={3}>
            {item.Description}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.readMoreText}>Tap to read more</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

  if (selectedUpdate) {
    return (
      <UpdateDetailScreen 
        update={selectedUpdate} 
        onBack={handleBack} 
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Updates</Text>
      </View>
      
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
    backgroundColor: '#f2f2f7',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
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
    paddingTop: 8,
    paddingBottom: 32,
  },
  updateCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
  },
  cardContent: {
    padding: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  readMoreText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '400',
  },
  updateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 22,
  },
  updateDate: {
    fontSize: 15,
    color: '#8e8e93',
    marginBottom: 8,
    fontWeight: '400',
  },
  updateDescription: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
    fontWeight: '400',
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
