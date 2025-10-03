import { db } from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { Message, Conversation, AnyUser } from '../types';

export class MessageService {
  private static messagesCollection = 'messages';
  private static conversationsCollection = 'conversations';

  // Send a message
  static async sendMessage(
    senderId: string,
    senderName: string,
    senderEmail: string,
    recipientId: string,
    recipientName: string,
    recipientEmail: string,
    content: string
  ): Promise<string> {
    try {
      console.log('📤 ====== STARTING MESSAGE SEND ======');
      console.log('📤 Firestore instance:', db ? 'EXISTS' : 'NULL');
      console.log('📤 Sending message from', senderEmail, 'to', recipientEmail);
      console.log('📤 Sender ID:', senderId, 'Recipient ID:', recipientId);
      console.log('📤 Content:', content);

      // Use the recipientId as-is (could be UID or Airtable ID)
      const messageData = {
        senderId,
        senderName,
        senderEmail,
        recipientId,
        recipientName,
        recipientEmail,
        content,
        timestamp: serverTimestamp(),
        status: 'sent',
        read: false,
      };

      console.log('📤 Message data prepared, collection:', this.messagesCollection);

      const collectionRef = collection(db, this.messagesCollection);
      console.log('📤 Collection ref created, attempting to add document...');

      const docRef = await addDoc(collectionRef, messageData);
      console.log('✅ Message sent with ID:', docRef.id);
      console.log('✅ ====== MESSAGE SEND COMPLETE ======');

      // Update conversation
      await this.updateConversation(senderId, recipientId, content);

      // Send push notification to recipient
      await this.sendMessageNotification(recipientId, senderName, content);

      return docRef.id;
    } catch (error: any) {
      console.error('❌ ====== MESSAGE SEND FAILED ======');
      console.error('❌ Error sending message:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error code:', error?.code);
      console.error('❌ Full error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // Get messages between two users
  static getMessages(
    userId1: string,
    userId2: string,
    callback: (messages: Message[]) => void
  ): () => void {
    console.log('🔍 Setting up message listener for users:', userId1, userId2);

    // If userId2 doesn't have a UID, use the Airtable ID instead
    const recipientId = userId2.startsWith('rec') ? userId2 : userId2;

    const messagesRef = collection(db, this.messagesCollection);
    const q = query(
      messagesRef,
      where('senderId', 'in', [userId1, recipientId]),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📨 Firestore snapshot received:', snapshot.size, 'messages');
        const messages: Message[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // Only include messages between these two users
          if ((data.senderId === userId1 && data.recipientId === recipientId) ||
              (data.senderId === recipientId && data.recipientId === userId1)) {

            // Skip messages that the current user has deleted
            if (data.deletedBy?.[userId1]) {
              console.log('⏭️ Skipping deleted message:', docSnap.id);
              return;
            }

            messages.push({
              id: docSnap.id,
              senderId: data.senderId,
              senderName: data.senderName,
              senderEmail: data.senderEmail,
              recipientId: data.recipientId,
              recipientName: data.recipientName,
              recipientEmail: data.recipientEmail,
              content: data.content,
              timestamp: (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
              status: data.status || 'sent',
              isFromCurrentUser: data.senderId === userId1,
            });
          }
        });

        console.log('📨 Received messages:', messages.length);
        callback(messages);
      },
      (error) => {
        console.error('❌ Error listening to messages:', error);
        console.error('❌ Error details:', error);

        // Return empty messages on error to prevent app crash
        callback([]);
      }
    );

    return unsubscribe;
  }

  // Get conversations for a user
  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      console.log('🔍 Getting conversations for user:', userId);

      const conversationsRef = collection(db, this.conversationsCollection);
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );

      const snapshot = await getDocs(q);
      const conversations: Conversation[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Skip if this user has deleted the conversation
        if (data.deletedBy?.[userId]) {
          console.log('⏭️ Skipping deleted conversation:', docSnap.id);
          continue;
        }

        const otherUserId = data.participants.find((id: string) => id !== userId);

        if (otherUserId) {
          // Determine which user info to show based on who is viewing the conversation
          let recipientInfo;
          if (data.senderInfo && data.recipientInfo) {
            // Use the appropriate user info based on who is viewing
            recipientInfo = userId === data.participants[0] ? data.recipientInfo : data.senderInfo;
          } else {
            // Fallback: fetch from Airtable
            try {
              const { AirtableService } = await import('./airtable');
              recipientInfo = await AirtableService.getUserById(otherUserId) || {
                id: otherUserId,
                'Full Name': 'Unknown User',
                'ProfilePic': null,
              };
            } catch (error) {
              console.warn('Failed to fetch user info for:', otherUserId);
              recipientInfo = {
                id: otherUserId,
                'Full Name': 'Unknown User',
                'ProfilePic': null,
              };
            }
          }

          conversations.push({
            id: docSnap.id,
            recipient: recipientInfo,
            lastMessage: data.lastMessage,
            lastMessageTime: (data.lastMessageTime as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            unreadCount: data.unreadCounts?.[userId] || 0,
            isOnline: data.isOnline || false,
          });
        }
      }

      console.log('✅ Found conversations:', conversations.length);
      return conversations;
    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      throw error;
    }
  }

  // Get conversations with real-time updates
  static getConversationsRealtime(userId: string, callback: (conversations: Conversation[]) => void): () => void {
    console.log('🔍 Setting up real-time conversations listener for user:', userId);

    const conversationsRef = collection(db, this.conversationsCollection);
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      console.log('📱 Conversations snapshot received:', snapshot.docs.length, 'conversations');
      const conversations: Conversation[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Skip if this user has deleted the conversation
        if (data.deletedBy?.[userId]) {
          console.log('⏭️ Skipping deleted conversation:', docSnap.id, 'deletedBy:', data.deletedBy);
          continue;
        }

        // Debug: Log conversation data to see what's being received
        console.log('🔍 Processing conversation:', docSnap.id, 'deletedBy:', data.deletedBy, 'userId:', userId);

        const otherUserId = data.participants.find((id: string) => id !== userId);

        if (otherUserId) {
          // Determine which user info to show based on who is viewing the conversation
          let recipientInfo;
          if (data.senderInfo && data.recipientInfo) {
            // Use the appropriate user info based on who is viewing
            recipientInfo = userId === data.participants[0] ? data.recipientInfo : data.senderInfo;
          } else {
            // Fallback: fetch from Airtable
            try {
              const { AirtableService } = await import('./airtable');
              recipientInfo = await AirtableService.getUserById(otherUserId) || {
                id: otherUserId,
                'Full Name': 'Unknown User',
                'ProfilePic': null,
              };
            } catch (error) {
              console.warn('Failed to fetch user info for:', otherUserId);
              recipientInfo = {
                id: otherUserId,
                'Full Name': 'Unknown User',
                'ProfilePic': null,
              };
            }
          }

          conversations.push({
            id: docSnap.id,
            recipient: recipientInfo,
            lastMessage: data.lastMessage,
            lastMessageTime: (data.lastMessageTime as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            unreadCount: data.unreadCounts?.[userId] || 0,
            isOnline: data.isOnline || false,
          });
        }
      }

      console.log('✅ Real-time conversations updated:', conversations.length);
      callback(conversations);
    }, (error) => {
      console.error('❌ Error in conversations listener:', error);
    });
  }

  // Update conversation
  private static async updateConversation(
    senderId: string,
    recipientId: string,
    lastMessage: string
  ): Promise<void> {
    try {
      const conversationId = this.getConversationId(senderId, recipientId);
      const conversationRef = doc(db, this.conversationsCollection, conversationId);

      // Get both users' info from Airtable
      const { AirtableService } = await import('./airtable');
      const senderInfo = await AirtableService.getUserById(senderId);
      const recipientInfo = await AirtableService.getUserById(recipientId);

      const conversationData = {
        participants: [senderId, recipientId],
        lastMessage,
        lastMessageTime: serverTimestamp(),
        // Store both users' info so either can see the conversation
        senderInfo: senderInfo || {
          id: senderId,
          'Full Name': 'Unknown User',
          'ProfilePic': null,
        },
        recipientInfo: recipientInfo || {
          id: recipientId,
          'Full Name': 'Unknown User',
          'ProfilePic': null,
        },
        unreadCounts: {
          [recipientId]: 1, // Increment unread count for recipient
        },
        updatedAt: serverTimestamp(),
      };

      await setDoc(conversationRef, conversationData, { merge: true });
      console.log('✅ Updated conversation:', conversationId);
    } catch (error) {
      console.error('❌ Error updating conversation:', error);
      // Don't throw here as it's not critical
    }
  }

  // Generate consistent conversation ID
  private static getConversationId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  }

  // Mark messages as read
  static async markMessagesAsRead(
    senderId: string,
    recipientId: string
  ): Promise<void> {
    try {
      console.log('📖 Marking messages as read from', senderId, 'to', recipientId);

      const messagesRef = collection(db, this.messagesCollection);
      const q = query(
        messagesRef,
        where('senderId', '==', senderId),
        where('recipientId', '==', recipientId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(docSnap => {
        batch.update(docSnap.ref, { read: true, status: 'read' });
      });

      await batch.commit();
      console.log('✅ Marked messages as read');
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      throw error;
    }
  }

  // Get user by ID from both tables
  static async getUserById(userId: string): Promise<AnyUser | null> {
    try {
      console.log('🔍 Getting user by ID:', userId);

      // Import AirtableService here to avoid circular dependency
      const { AirtableService } = await import('./airtable');
      return await AirtableService.getUserById(userId);
    } catch (error) {
      console.error('❌ Error getting user by ID:', error);
      return null;
    }
  }

  // Delete conversation for a specific user (soft delete)
  static async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting conversation for user:', conversationId, userId);

      // The conversationId is in format "userId1_userId2" (sorted)
      const [userId1, userId2] = conversationId.split('_');

      const conversationRef = doc(db, this.conversationsCollection, conversationId);

      // Get the current conversation data to debug
      try {
        const conversationSnap = await getDocs(query(conversationsRef, where('participants', 'array-contains', userId1)));
        const conversationDoc = conversationSnap.docs.find(doc => doc.id === conversationId);
        if (conversationDoc) {
          const currentData = conversationDoc.data();
          console.log('🔍 Current conversation data before delete:', currentData);
          console.log('🔍 Current deletedBy field:', currentData.deletedBy);
        }
      } catch (error) {
        console.log('⚠️ Could not fetch conversation data for debugging:', error);
      }

      // Mark conversation as deleted for this user
      await updateDoc(conversationRef, {
        [`deletedBy.${userId}`]: serverTimestamp(),
      });

      console.log('✅ Marked conversation as deleted for user');

      // Also mark all messages in this conversation as deleted for this user
      const messagesRef = collection(db, this.messagesCollection);

      // Query for messages from user1 to user2
      const q1 = query(
        messagesRef,
        where('senderId', '==', userId1),
        where('recipientId', '==', userId2)
      );

      // Query for messages from user2 to user1
      const q2 = query(
        messagesRef,
        where('senderId', '==', userId2),
        where('recipientId', '==', userId1)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      console.log(`🗑️ Marking ${snapshot1.docs.length + snapshot2.docs.length} messages as deleted for user`);

      const updatePromises = [
        ...snapshot1.docs.map(docSnap =>
          setDoc(docSnap.ref, {
            [`deletedBy.${userId}`]: serverTimestamp(),
          }, { merge: true })
        ),
        ...snapshot2.docs.map(docSnap =>
          setDoc(docSnap.ref, {
            [`deletedBy.${userId}`]: serverTimestamp(),
          }, { merge: true })
        )
      ];

      await Promise.all(updatePromises);

      console.log('✅ Successfully marked conversation and all messages as deleted for user');
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      throw error;
    }
  }

  // Delete a single message for a specific user (soft delete)
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting message for user:', messageId, userId);

      const messageRef = doc(db, this.messagesCollection, messageId);

      // Mark message as deleted for this user
      await setDoc(messageRef, {
        [`deletedBy.${userId}`]: serverTimestamp(),
      }, { merge: true });

      console.log('✅ Successfully marked message as deleted for user');
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw error;
    }
  }

  // Send push notification when a message is received
  private static async sendMessageNotification(
    recipientId: string,
    senderName: string,
    messageContent: string
  ): Promise<void> {
    try {
      console.log('📱 Sending push notification to recipient:', recipientId);

      // Get recipient's push token from Airtable
      const { AirtableService } = await import('./airtable');
      const pushToken = await AirtableService.getPushTokenByUID(recipientId);

      if (!pushToken) {
        console.log('⚠️ No push token found for recipient:', recipientId);
        return;
      }

      // Send notification
      const { NotificationService } = await import('./notifications');
      const truncatedMessage = messageContent.length > 100
        ? messageContent.substring(0, 100) + '...'
        : messageContent;

      await NotificationService.sendPushNotification(
        pushToken,
        `New message from ${senderName}`,
        truncatedMessage,
        { type: 'message', senderId: recipientId }
      );

      console.log('✅ Push notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      // Don't throw - notification failure shouldn't block message sending
    }
  }
}
