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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageService } from '../services/messageService';
import { AuthService } from '../services/auth';
import { AnyUser, Conversation } from '../types';
import UserSelectionScreen from './UserSelectionScreen';
import ConversationScreen from './ConversationScreen';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<AnyUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AnyUser | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (authResult) {
        setCurrentUser(authResult.userInfo);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      
      if (!currentUser?.UID) {
        console.log('No current user UID available, using mock data');
        // Use mock data for now
        const mockConversations: Conversation[] = [
          {
            id: '1',
            recipient: {
              id: 'user1',
              'Full Name': 'Sarah Johnson',
              'First Name': 'Sarah',
              'Last Name': 'Johnson',
              'Email': 'sarah.johnson@che.school',
              'Phone': '(555) 123-4567',
              'User Type': 'Staff',
              'UID': 'uid1',
              'ProfilePic': undefined,
              'Active': true,
            },
            lastMessage: 'Thanks for the update on the project!',
            lastMessageTime: new Date(Date.now() - 300000).toISOString(),
            unreadCount: 2,
            isOnline: true,
          },
          {
            id: '2',
            recipient: {
              id: 'user2',
              'Full Name': 'Mike Chen',
              'First Name': 'Mike',
              'Last Name': 'Chen',
              'Email': 'mike.chen@che.school',
              'Phone': '(555) 234-5678',
              'User Type': 'Admin',
              'UID': 'uid2',
              'ProfilePic': undefined,
              'Active': true,
            },
            lastMessage: 'Can we schedule a meeting for tomorrow?',
            lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
            unreadCount: 0,
            isOnline: false,
          },
        ];
        setConversations(mockConversations);
        setIsLoading(false);
        return;
      }

      const conversations = await MessageService.getConversations(currentUser.UID);
      setConversations(conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
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

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => setSelectedRecipient(item.recipient)}
      activeOpacity={0.7}
    >
      <View style={styles.conversationInfo}>
        <View style={styles.avatarContainer}>
          {item.recipient.ProfilePic ? (
            <Image 
              source={{ 
                uri: Array.isArray(item.recipient.ProfilePic) 
                  ? item.recipient.ProfilePic[0]?.url 
                  : item.recipient.ProfilePic 
              }} 
              style={styles.avatar}
              onError={() => console.log('Failed to load profile image')}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={20} color="#007AFF" />
            </View>
          )}
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.conversationDetails}>
          <View style={styles.conversationHeader}>
            <Text style={styles.recipientName}>{item.recipient['Full Name']}</Text>
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
      </View>
    </TouchableOpacity>
  );

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
    paddingBottom: 15,
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
    paddingBottom: 32,
  },
  conversationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    paddingTop: 100,
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
});