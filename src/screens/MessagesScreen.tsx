import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { StaffMessage, RecipientGroup } from '../types';
import { AirtableService } from '../services/airtable';
import { AuthService } from '../services/auth';

export default function MessagesScreen() {
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientGroup>('Coordinator');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  const recipientOptions: { label: string; value: RecipientGroup }[] = [
    { label: 'Coordinator', value: 'Coordinator' },
    { label: 'Director', value: 'Director' },
    { label: 'Tech', value: 'Tech' },
  ];

  const loadMessages = useCallback(async () => {
    try {
      const staffMessages = await AirtableService.getStaffMessages();
      setMessages(staffMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    
    // Get current user email
    const getCurrentUser = async () => {
      const userWithStaff = await AuthService.getCurrentUserWithStaffInfo();
      if (userWithStaff?.user.email) {
        setCurrentUserEmail(userWithStaff.user.email);
      }
    };
    getCurrentUser();
  }, [loadMessages]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMessages();
  }, [loadMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (!currentUserEmail) {
      Alert.alert('Error', 'User email not found');
      return;
    }

    try {
      setIsSending(true);
      await AirtableService.sendStaffMessage(
        currentUserEmail,
        selectedRecipient,
        newMessage.trim()
      );
      
      setNewMessage('');
      Alert.alert('Success', 'Message sent successfully!');
      
      // Refresh messages
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      return timestamp;
    }
  };

  const renderMessage = ({ item }: { item: StaffMessage }) => {
    const isFromCurrentUser = item.SenderEmail === currentUserEmail;
    
    return (
      <View style={[
        styles.messageContainer,
        isFromCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderEmail}>
            {isFromCurrentUser ? 'You' : item.SenderEmail.split('@')[0]}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.Timestamp)}
          </Text>
        </View>
        <Text style={styles.messageText}>{item.Message}</Text>
        <Text style={styles.recipientText}>To: {item.RecipientGroup}</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No messages yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Send a message to get started
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        inverted
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.recipientButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.recipientButtonText}>To: {selectedRecipient}</Text>
          <Text style={styles.recipientArrow}>▼</Text>
        </TouchableOpacity>

        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            <Text style={styles.sendButtonText}>
              {isSending ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Recipient</Text>
            <Picker
              selectedValue={selectedRecipient}
              onValueChange={(value) => setSelectedRecipient(value)}
              style={styles.picker}
            >
              {recipientOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  currentUserMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  senderEmail: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
    color: '#333',
  },
  recipientText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  recipientButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  recipientButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  recipientArrow: {
    fontSize: 12,
    color: '#666',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  picker: {
    height: 120,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
