import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MessageService } from '../services/messageService';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notifications';
import { AnyUser, Conversation } from '../types';
import UserSelectionScreen from './UserSelectionScreen';
import ConversationScreen from './ConversationScreen';
import ProfileImage from '../components/ProfileImage';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<AnyUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AnyUser | null>(null);
  const [conversationsUnsubscribe, setConversationsUnsubscribe] = useState<(() => void) | null>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const initializeData = async () => {
      await loadCurrentUser();
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    } else {
      // Clear conversations when user logs out
      setConversations([]);
      // Unsubscribe from any active listeners
      if (conversationsUnsubscribe) {
        conversationsUnsubscribe();
        setConversationsUnsubscribe(null);
      }
    }

    return () => {
      if (conversationsUnsubscribe) {
        conversationsUnsubscribe();
      }
    };
  }, [currentUser]);

  // Track when user is on Messages screen to suppress push notifications
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - suppress message notifications
      NotificationService.setOnMessagesScreen(true);

      return () => {
        // Screen is unfocused - allow message notifications
        NotificationService.setOnMessagesScreen(false);
      };
    }, [])
  );

  const loadCurrentUser = async () => {
    try {
      console.log('[MSG] 🔄 Loading current user...');
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (authResult) {
        console.log('[MSG] ✅ Current user loaded:', authResult.userInfo);
        setCurrentUser(authResult.userInfo);
      } else {
        console.log('[MSG] ❌ No current user found');
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setIsLoading(true);

      console.log('[MSG] 🔄 Loading conversations, currentUser:', currentUser);
      console.log('[MSG] 🔄 Current user UID:', currentUser?.UID);

      if (!currentUser?.UID) {
        console.log('[MSG] No current user UID available, cannot load conversations');
        setConversations([]);
        setIsLoading(false);
        return;
      }

      if (conversationsUnsubscribe) {
        conversationsUnsubscribe();
      }

      const unsubscribe = MessageService.getConversationsRealtime(currentUser.UID, (data) => {
        console.log('[MSG] 📱 Real-time conversations update:', data);
        setConversations(data);
        setIsLoading(false);
      });

      setConversationsUnsubscribe(() => unsubscribe);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (currentUser?.UID) {
      await MessageService.initializeConversationsFromMessages(currentUser.UID);
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleNewMessage = () => {
    setShowUserSelection(true);
  };

  const handleUserSelect = (user: AnyUser) => {
    setSelectedRecipient(user);
    setShowUserSelection(false);
  };

  const handleBackFromConversation = () => {
    setSelectedRecipient(null);
    loadConversations();
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!currentUser?.UID) {
                Alert.alert('Error', 'User not found');
                return;
              }
              await MessageService.deleteConversation(conversationId, currentUser.UID);
              console.log('[MSG] ✅ Conversation deleted successfully');
            } catch (error) {
              console.error('[MSG] ❌ Error deleting conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation. Please try again.');
            }
          },
        },
      ],
    );
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const SwipeableConversation = ({ item }: { item: Conversation }) => {
    const swipeableRef = useRef<Swipeable>(null);

    const renderRightActions = () => (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          swipeableRef.current?.close();
          handleDeleteConversation(item.id);
        }}
      >
        <Ionicons name="trash" size={24} color={colors.primaryText} />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        rightThreshold={40}
      >
        <View style={styles.conversationCard}>
          <TouchableOpacity
            style={styles.conversationInfo}
            onPress={() => setSelectedRecipient(item.recipient)}
            activeOpacity={0.7}
          >
            <ProfileImage
              profilePic={item.recipient.ProfilePic}
              size={50}
              showOnlineIndicator={true}
              isOnline={item.isOnline}
            />

            <View style={styles.conversationDetails}>
              <View style={styles.conversationHeader}>
                <Text style={styles.recipientName}>{item.recipient['Full Name'] || 'Unknown User'}</Text>
                <Text style={styles.lastMessageTime}>{formatLastMessageTime(item.lastMessageTime)}</Text>
              </View>
              <View style={styles.conversationFooter}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    console.log('[MSG] 🎨 Rendering conversation:', {
      id: item.id,
      recipient: item.recipient,
      recipientName: item.recipient['Full Name'],
      hasProfilePic: !!item.recipient.ProfilePic,
      profilePicData: item.recipient.ProfilePic,
      lastMessage: item.lastMessage,
    });

    return <SwipeableConversation item={item} />;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyStateText}>No conversations yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Start a conversation by tapping the compose button
      </Text>
      <TouchableOpacity style={styles.newMessageButton} onPress={handleNewMessage}>
        <Ionicons name="add" size={20} color={colors.primaryText} />
        <Text style={styles.newMessageButtonText}>New Message</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Messages</Text>
      <TouchableOpacity style={styles.composeButton} onPress={handleNewMessage}>
        <Ionicons name="create-outline" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  if (showUserSelection) {
    return (
      <UserSelectionScreen
        onBack={() => setShowUserSelection(false)}
        onUserSelect={handleUserSelect}
      />
    );
  }

  if (selectedRecipient) {
    return <ConversationScreen recipient={selectedRecipient} onBack={handleBackFromConversation} />;
  }

  if (isLoading) {
    return (
      <GestureHandlerRootView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: typeof ThemeColors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  composeButton: {
    padding: 8,
    marginRight: -8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  conversationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  conversationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationDetails: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  lastMessageTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
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
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newMessageButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  deleteButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    marginBottom: 8,
    marginRight: 16,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
