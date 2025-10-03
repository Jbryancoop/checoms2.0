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
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }
    } catch {
      return dateString;
    }
  };

  const getImageUrl = (update: StaffUpdate) => {
    if (!update.image) return null;
    return Array.isArray(update.image) ? update.image[0]?.url : update.image;
  };

  const renderUpdate = ({ item }: { item: StaffUpdate }) => {
    console.log('🎨 Rendering update card for:', item.Title);
    const imageUrl = getImageUrl(item);
    
    return (
      <TouchableOpacity 
        onPress={() => handleUpdatePress(item)}
        activeOpacity={0.95}
        style={styles.updateCard}
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
      <Ionicons name="newspaper-outline" size={64} color="#c7c7cc" />
      <Text style={styles.emptyStateText}>No updates yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Check back later for important announcements and updates
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Ionicons name="refresh" size={16} color="#007AFF" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSkeletonCard = () => (
    <View style={[styles.updateCard, styles.skeletonCard]}>
      <View style={styles.skeletonImage} />
      <View style={styles.cardContent}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonDate} />
        <View style={styles.skeletonDescription} />
        <View style={[styles.skeletonDescription, { width: '60%' }]} />
        <View style={styles.cardFooter}>
          <View style={styles.skeletonReadMore} />
          <View style={styles.skeletonChevron} />
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Updates</Text>
        </View>
        <View style={styles.listContainer}>
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index}>{renderSkeletonCard()}</View>
          ))}
        </View>
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

  console.log('📱 UpdatesScreen render - updates count:', updates.length);
  console.log('📱 UpdatesScreen render - updates data:', updates);

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
        style={styles.flatListStyle}
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
    backgroundColor: '#e5e5ea',
  },
  flatListStyle: {
    backgroundColor: '#e5e5ea',
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
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  updateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  updateCardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.12,
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  updateDate: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  updateDescription: {
    fontSize: 16,
    color: '#1c1c1e',
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.1,
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
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Skeleton styles
  skeletonCard: {
    backgroundColor: '#f8f9fa',
  },
  skeletonImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#e9ecef',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  skeletonDate: {
    height: 14,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 12,
    width: '40%',
  },
  skeletonDescription: {
    height: 16,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
    width: '100%',
  },
  skeletonReadMore: {
    height: 14,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    width: 80,
  },
  skeletonChevron: {
    height: 14,
    width: 14,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
  },
});
