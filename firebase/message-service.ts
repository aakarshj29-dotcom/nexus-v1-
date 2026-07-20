import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firestore';
import { Message, LiveObjectAttachment } from '@/types/message';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

export const messageService = {
  /**
   * Sends a message in a conversation.
   * Updates the parent conversation's lastMessage and updatedAt fields.
   */
  async sendMessage(
    conversationId: string,
    sender: { id: string; name: string; avatarUrl: string | null },
    text: string,
    attachment?: LiveObjectAttachment | null
  ): Promise<string> {
    if (!conversationId) throw new Error('Conversation ID is required');
    if (!sender.id) throw new Error('Sender ID is required');

    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const messagesRef = collection(conversationRef, MESSAGES_SUBCOLLECTION);
    const messageRef = doc(messagesRef);

    const messageData = {
      id: messageRef.id,
      conversationId,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatarUrl: sender.avatarUrl,
      text: text,
      attachment: attachment || null,
      createdAt: serverTimestamp(),
    };

    // Save message
    await setDoc(messageRef, messageData);

    // Update parent conversation
    await updateDoc(conversationRef, {
      updatedAt: serverTimestamp(),
      lastMessage: {
        text: text || (attachment ? `Shared a ${attachment.type}` : ''),
        senderId: sender.id,
        senderName: sender.name,
        createdAt: serverTimestamp(),
      },
    });

    return messageRef.id;
  },

  /**
   * Set up real-time snapshot subscription to messages for an active conversation.
   * Orders messages by createdAt ascending.
   */
  onMessagesSnapshot(
    conversationId: string,
    callback: (messages: Message[]) => void,
    onError?: (error: Error) => void
  ) {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const messagesRef = collection(conversationRef, MESSAGES_SUBCOLLECTION);

    // We order by createdAt to ensure correct timeline presentation
    const q = query(
      messagesRef,
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: Message[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as Message);
        });
        callback(list);
      },
      (err) => {
        // If ordering causes a missing-index error, fall back to in-memory sorting
        console.warn('orderBy query failed or needs index, trying unordered query...', err);
        const fallbackQ = query(messagesRef);
        return onSnapshot(
          fallbackQ,
          (snapshot) => {
            const list: Message[] = [];
            snapshot.forEach((docSnap) => {
              list.push({
                id: docSnap.id,
                ...docSnap.data(),
              } as Message);
            });
            // Sort in-memory by createdAt
            list.sort((a, b) => {
              const getMs = (val: unknown) => {
                if (!val) return 0;
                if (typeof val === 'string') return new Date(val).getTime();
                if (typeof val === 'object' && val !== null && 'seconds' in val) {
                  return (val as { seconds: number }).seconds * 1000;
                }
                return new Date(val as string).getTime();
              };
              return getMs(a.createdAt) - getMs(b.createdAt);
            });
            callback(list);
          },
          (fallbackErr) => {
            console.error('Error listening to messages:', fallbackErr);
            if (onError) onError(fallbackErr as Error);
          }
        );
      }
    );
  }
};
