import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageService } from '../services/messageService';
import { AuthService } from '../services/auth';
import { AnyUser, Conversation } from '../types';
import UserSelectionScreen from './UserSelectionScreen';
import ConversationScreen from './ConversationScreen';
import ProfileImage from '../components/ProfileImage';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<AnyUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AnyUser | null>(null);
  const [conversationsUnsubscribe, setConversationsUnsubscribe] = useState<(() => void) | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      await loadCurrentUser();
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }

    // Cleanup function
    return () => {
      if (conversationsUnsubscribe) {
        conversationsUnsubscribe();
      }
    };
  }, [currentUser]);

  const loadCurrentUser = async () => {
    try {
      console.log('🔄 Loading current user...');
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (authResult) {
        console.log('✅ Current user loaded:', authResult.userInfo);
        setCurrentUser(authResult.userInfo);
      } else {
        console.log('❌ No current user found');
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadConversations = () => {
    try {
      setIsLoading(true);

      console.log('🔄 Loading conversations, currentUser:', currentUser);
      console.log('🔄 Current user UID:', currentUser?.UID);

      if (!currentUser?.UID) {
        console.log('No current user UID available, cannot load conversations');
        setConversations([]);
        setIsLoading(false);
        return;
      }

      // Clean up previous listener if exists
      if (conversationsUnsubscribe) {
        conversationsUnsubscribe();
      }

      // Set up real-time listener for conversations
      const unsubscribe = MessageService.getConversationsRealtime(currentUser.UID, (conversations) => {
        console.log('📱 Real-time conversations update:', conversations);
        setConversations(conversations);
        setIsLoading(false);
      });

      // Store unsubscribe function for cleanup
      setConversationsUnsubscribe(() => unsubscribe);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    // The real-time listener will automatically update the conversations
    // Just wait a moment for the refresh to complete
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
    // Refresh conversations when coming back
    loadConversations();
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
              console.log('✅ Conversation deleted successfully');
            } catch (error) {
              console.error('❌ Error deleting conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation. Please try again.');
            }
          },
        },
      ]
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
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const SwipeableConversation = ({ item }: { item: Conversation }) => {
    const translateX = React.useRef(new Animated.Value(0)).current;
    const [showDelete, setShowDelete] = useState(false);

    const panResponder = React.useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 100;
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dx < 0) {
            translateX.setValue(gestureState.dx);
            setShowDelete(gestureState.dx < -50);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -100) {
            // Swipe far enough to show delete
            Animated.spring(translateX, {
              toValue: -100,
              useNativeDriver: true,
            }).start();
            setShowDelete(true);
          } else {
            // Snap back
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
            setShowDelete(false);
          }
        },
      })
    ).current;

    return (
      <View style={styles.swipeContainer}>
        {showDelete && (
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteConversation(item.id)}
            >
              <Ionicons name="trash" size={24} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        <Animated.View
          style={[
            styles.conversationCard,
            { transform: [{ translateX }] }
          ]}
          {...panResponder.panHandlers}
        >
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
                <Text style={styles.recipientName}>
                  {item.recipient['Full Name'] || 'Unknown User'}
                </Text>
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
        </Animated.View>
      </View>
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    console.log('🎨 Rendering conversation:', {
      id: item.id,
      recipient: item.recipient,
      recipientName: item.recipient['Full Name'],
      hasProfilePic: !!item.recipient.ProfilePic,
      profilePicData: item.recipient.ProfilePic,
      lastMessage: item.lastMessage
    });

    return <SwipeableConversation item={item} />;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#c7c7cc" />
      <Text style={styles.emptyStateText}>No conversations yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Start a conversation by tapping the compose button
      </Text>
      <TouchableOpacity style={styles.newMessageButton} onPress={handleNewMessage}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.newMessageButtonText}>New Message</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Messages</Text>
      <TouchableOpacity style={styles.composeButton} onPress={handleNewMessage}>
        <Ionicons name="create-outline" size={24} color="#007AFF" />
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
    return (
      <ConversationScreen
        recipient={selectedRecipient}
        onBack={handleBackFromConversation}
      />
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={conversations}
        renderItem={renderConversation}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f2f7',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c6c6c8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
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
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
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
    color: '#000',
  },
  lastMessageTime: {
    fontSize: 13,
    color: '#8e8e93',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 15,
    color: '#8e8e93',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
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
    color: '#8e8e93',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#c7c7cc',
    textAlign: 'center',
    marginBottom: 24,
  },
  newMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newMessageButtonText: {
    color: '#fff',
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
    color: '#8e8e93',
  },
  // Swipe to delete styles
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  rightActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 16,
    zIndex: 1,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});