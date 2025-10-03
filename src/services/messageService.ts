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
      console.log('📤 Sending message from', senderEmail, 'to', recipientEmail);
      console.log('📤 Sender ID:', senderId, 'Recipient ID:', recipientId);

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

      const docRef = await addDoc(collection(db, this.messagesCollection), messageData);
      console.log('✅ Message sent with ID:', docRef.id);

      // Update conversation
      await this.updateConversation(senderId, recipientId, content);

      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending message:', error);
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
        const messages: Message[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // Only include messages between these two users
          if ((data.senderId === userId1 && data.recipientId === recipientId) ||
              (data.senderId === recipientId && data.recipientId === userId1)) {

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

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const otherUserId = data.participants.find((id: string) => id !== userId);

        if (otherUserId) {
          conversations.push({
            id: docSnap.id,
            recipient: data.recipientInfo,
            lastMessage: data.lastMessage,
            lastMessageTime: (data.lastMessageTime as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            unreadCount: data.unreadCounts?.[userId] || 0,
            isOnline: data.isOnline || false,
          });
        }
      });

      console.log('✅ Found conversations:', conversations.length);
      return conversations;
    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      throw error;
    }
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

      const conversationData = {
        participants: [senderId, recipientId],
        lastMessage,
        lastMessageTime: serverTimestamp(),
        recipientInfo: {
          id: recipientId,
          // This will be populated by the client
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
}
