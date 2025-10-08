import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  Image,
  ActionSheetIOS,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
import { MessageService } from '../services/messageService';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notifications';
import { AnyUser, Message } from '../types';
import ProfileImage from '../components/ProfileImage';
import { useTheme } from '../contexts/ThemeContext';
import { Colors as ThemeColors } from '../theme/colors';
import { HapticFeedback } from '../utils/haptics';


interface ConversationScreenProps {
  recipient: AnyUser;
  onBack: () => void;
}

export default function ConversationScreen({ recipient, onBack }: ConversationScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  // const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<AnyUser | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeMessages = async () => {
      const user = await loadCurrentUser();
      // Only load messages after current user is loaded
      if (user?.UID) {
        unsubscribe = await loadMessages(user);
      }
    };

    initializeMessages();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Run once on mount

  // Track when user is viewing a conversation to suppress push notifications
  useEffect(() => {
    // User is viewing conversation - suppress message notifications
    NotificationService.setOnMessagesScreen(true);

    return () => {
      // User left conversation - allow message notifications
      NotificationService.setOnMessagesScreen(false);
    };
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      // Scroll to bottom when keyboard appears - multiple attempts for reliability
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const loadCurrentUser = async () => {
    try {
      const authResult = await AuthService.getCurrentUserWithStaffInfo();
      if (authResult) {
        setCurrentUser(authResult.userInfo);
        return authResult.userInfo;
      }
      return null;
    } catch (error) {
      console.error('[MSG] Error loading current user:', error);
      return null;
    }
  };

  const loadMessages = async (user?: AnyUser) => {
    try {
      setIsLoading(true);

      const userToUse = user || currentUser;
      if (!userToUse?.UID) {
        console.error('[MSG] No current user UID available');
        setIsLoading(false);
        return;
      }

      // Mark messages from recipient as read
      await MessageService.markMessagesAsRead(
        recipient.UID || recipient.id,
        userToUse.UID
      );

      // Set up real-time listener for messages
      const unsubscribe = MessageService.getMessages(
        userToUse.UID,
        recipient.UID || recipient.id,
        (messages) => {
          setMessages(messages);
          setIsLoading(false);
        }
      );

      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('[MSG] Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
      setIsLoading(false);
    }
  };

  // const pickImage = async () => {
  //   try {
  //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //     if (status !== 'granted') {
  //       Alert.alert('Permission needed', 'Please allow access to your photos to send images.');
  //       return;
  //     }

  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //       allowsEditing: true,
  //       aspect: [4, 3],
  //       quality: 0.8,
  //     });

  //     if (!result.canceled && result.assets[0]) {
  //       setSelectedImage(result.assets[0].uri);
  //     }
  //   } catch (error) {
  //     console.error('Error picking image:', error);
  //     Alert.alert('Error', 'Failed to select image');
  //   }
  // };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser?.UID) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);
    HapticFeedback.medium();

    try {
      await MessageService.sendMessage(
        currentUser.UID,
        currentUser['Full Name'],
        'CHE Email' in currentUser ? currentUser['CHE Email'] : currentUser['Email'],
        recipient.UID || recipient.id,
        recipient['Full Name'],
        'CHE Email' in recipient ? recipient['CHE Email'] : recipient['Email'],
        messageContent
      );
      HapticFeedback.success();
    } catch (error) {
      console.error('[MSG] Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      HapticFeedback.error();
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleMessageLongPress = (message: Message) => {
    HapticFeedback.medium();

    const options = ['Copy', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Copy
            Clipboard.setString(message.content);
            HapticFeedback.light();
          } else if (buttonIndex === 1) {
            // Delete
            handleDeleteMessage(message);
          }
        }
      );
    } else {
      // Android - use Alert
      Alert.alert(
        'Message Options',
        '',
        [
          {
            text: 'Copy',
            onPress: () => {
              Clipboard.setString(message.content);
              HapticFeedback.light();
            },
          },
          {
            text: 'Delete',
            onPress: () => handleDeleteMessage(message),
            style: 'destructive',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleDeleteMessage = (message: Message) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            HapticFeedback.heavy();
            try {
              if (!currentUser?.UID) {
                Alert.alert('Error', 'User not found');
                return;
              }
              await MessageService.deleteMessage(message.id, currentUser.UID);
              HapticFeedback.success();
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
              HapticFeedback.error();
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isFromCurrentUser ? styles.sentMessage : styles.receivedMessage
    ]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => handleMessageLongPress(item)}
        style={[
          styles.messageBubble,
          item.isFromCurrentUser ? styles.sentBubble : styles.receivedBubble
        ]}
      >
        {/* {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
        )} */}
        <Text style={[
          styles.messageText,
          item.isFromCurrentUser ? styles.sentText : styles.receivedText
        ]}>
          {item.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            item.isFromCurrentUser ? styles.sentTime : styles.receivedTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
          {item.isFromCurrentUser && (
            <Ionicons
              name={
                item.status === 'sending' ? 'time-outline' :
                item.status === 'sent' ? 'checkmark' :
                'checkmark-done'
              }
              size={14}
              color={
                item.status === 'read'
                  ? colors.primary
                  : colors.textSecondary
              }
              style={styles.statusIcon}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </TouchableOpacity>
      
      <View style={styles.recipientInfo}>
        <ProfileImage
          profilePic={recipient.ProfilePic}
          size={40}
          style={styles.recipientImageContainer}
        />
        <View style={styles.recipientDetails}>
          <Text style={styles.recipientName}>{recipient['Full Name']}</Text>
          <Text style={styles.recipientStatus}>Online</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-horizontal" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {renderHeader()}
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation!</Text>
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={1000}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (newMessage.trim() && !isSending) {
                  sendMessage();
                }
              }}
              onFocus={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || isSending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <Ionicons name="send" size={20} color={colors.primaryText} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: typeof ThemeColors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.separator,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  recipientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  recipientImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  recipientImage: {
    width: '100%',
    height: '100%',
  },
  defaultRecipientImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  recipientStatus: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  messageContainer: {
    marginBottom: 12,
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  sentBubble: {
    backgroundColor: colors.sentBubble,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: colors.receivedBubble,
    borderBottomLeftRadius: 4,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentText: {
    color: colors.sentText,
  },
  receivedText: {
    color: colors.receivedText,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sentTime: {
    color: colors.sentText,
    opacity: 0.7,
  },
  receivedTime: {
    color: colors.textSecondary,
  },
  statusIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.separator,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.separator,
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
  // imagePreviewContainer: {
  //   position: 'relative',
  //   marginBottom: 8,
  //   alignSelf: 'flex-start',
  // },
  // imagePreview: {
  //   width: 120,
  //   height: 120,
  //   borderRadius: 8,
  // },
  // removeImageButton: {
  //   position: 'absolute',
  //   top: -8,
  //   right: -8,
  //   backgroundColor: colors.background,
  //   borderRadius: 12,
  // },
  // messageImage: {
  //   width: 200,
  //   height: 200,
  //   borderRadius: 12,
  //   marginTop: 8,
  // },
});
