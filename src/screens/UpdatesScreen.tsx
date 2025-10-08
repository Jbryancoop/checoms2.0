import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StaffUpdate } from '../types';
import { AirtableService } from '../services/airtable';
import PreloadService from '../services/preloadService';
import UpdateDetailScreen from './UpdateDetailScreen';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';
import { UpdateSkeleton } from '../components/Skeleton';
import { HapticFeedback } from '../utils/haptics';
import { EmptyState } from '../components/EmptyState';

export default function UpdatesScreen() {
  const [updates, setUpdates] = useState<StaffUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<StaffUpdate | null>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadUpdates = useCallback(async (useCache = true) => {
    try {
      console.log('🔄 Loading updates...');

      // Try to use preloaded data first
      if (useCache && PreloadService.isDataPreloaded()) {
        const preloadedUpdates = PreloadService.getPreloadedUpdates();
        if (preloadedUpdates.length > 0) {
          console.log('📱 Using preloaded updates:', preloadedUpdates.length);
          setUpdates(preloadedUpdates);
          setIsLoading(false);
          return;
        }
      }

      // Otherwise fetch fresh data
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
    // Clear cache and fetch fresh data on refresh
    PreloadService.clearPreloadedData();
    loadUpdates(false);
  }, [loadUpdates]);

  const handleUpdatePress = (update: StaffUpdate) => {
    HapticFeedback.light();
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
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        )}
        <View style={styles.cardContent}>
          <Text style={styles.updateTitle}>{item.Title}</Text>
          <Text style={styles.updateDate}>{formatDate(item.Date)}</Text>
          <Text style={styles.updateDescription} numberOfLines={3}>
            {item.Description}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.readMoreText}>Tap to read more</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="newspaper-outline"
      title="No updates yet"
      description="Stay tuned for important announcements, action items, and campus highlights. Pull to refresh for the latest updates."
      actionText="Refresh Now"
      onActionPress={onRefresh}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.listContainer, { paddingTop: 50 }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Staff Updates</Text>
            <Text style={styles.headerSubtitle}>
              Stay current with announcements, action items, and campus highlights.
            </Text>
          </View>
          {[1, 2, 3].map((i) => (
            <UpdateSkeleton key={i} />
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
      <FlatList
        data={updates}
        renderItem={renderUpdate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        style={styles.flatListStyle}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Staff Updates</Text>
            <Text style={styles.headerSubtitle}>
              Stay current with announcements, action items, and campus highlights.
            </Text>
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = (colors: typeof ThemeColors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flatListStyle: {
    backgroundColor: colors.background,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  listContainer: {
    paddingTop: 50,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  updateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  updateCardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.12,
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.surface,
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
    color: colors.primary,
    fontWeight: '400',
  },
  updateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  updateDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  updateDescription: {
    fontSize: 16,
    color: colors.text,
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
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  refreshButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Skeleton styles
  skeletonCard: {
    backgroundColor: colors.surface,
  },
  skeletonImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.separator,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: colors.separator,
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  skeletonDate: {
    height: 14,
    backgroundColor: colors.separator,
    borderRadius: 4,
    marginBottom: 12,
    width: '40%',
  },
  skeletonDescription: {
    height: 16,
    backgroundColor: colors.separator,
    borderRadius: 4,
    marginBottom: 8,
    width: '100%',
  },
  skeletonReadMore: {
    height: 14,
    backgroundColor: colors.separator,
    borderRadius: 4,
    width: 80,
  },
  skeletonChevron: {
    height: 14,
    width: 14,
    backgroundColor: colors.separator,
    borderRadius: 2,
  },
});
