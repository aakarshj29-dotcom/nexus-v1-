import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firestore';
import { Conversation, ConversationType } from '@/types/message';

const CONVERSATIONS_COLLECTION = 'conversations';

export const conversationService = {
  /**
   * Creates a new conversation.
   * If it's a DM, it first checks if a DM already exists between these members in the workspace.
   */
  async createConversation(
    workspaceId: string,
    type: ConversationType,
    memberIds: string[],
    name?: string,
    description?: string
  ): Promise<string> {
    if (!workspaceId) throw new Error('Workspace ID is required');
    if (memberIds.length === 0) throw new Error('Conversation members are required');

    // For direct conversations, find if one already exists
    if (type === 'direct') {
      const existingId = await this.findExistingDM(workspaceId, memberIds);
      if (existingId) {
        return existingId;
      }
    }

    const conversationRef = doc(collection(db, CONVERSATIONS_COLLECTION));
    const conversationData = {
      id: conversationRef.id,
      type,
      workspaceId,
      name: name || '',
      description: description || '',
      memberIds,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
    };

    await setDoc(conversationRef, conversationData);
    return conversationRef.id;
  },

  /**
   * Helper to check if a DM conversation already exists in a given workspace
   */
  async findExistingDM(workspaceId: string, memberIds: string[]): Promise<string | null> {
    if (memberIds.length < 2) return null;
    const [userA, userB] = memberIds;

    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('workspaceId', '==', workspaceId),
      where('type', '==', 'direct'),
      where('memberIds', 'array-contains', userA)
    );

    const snapshot = await getDocs(q);
    let existingId: string | null = null;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const ids = data.memberIds || [];
      if (ids.includes(userB)) {
        existingId = docSnap.id;
      }
    });

    return existingId;
  },

  /**
   * Get a single conversation document
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Conversation not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Conversation;
  },

  /**
   * Get all conversations in a workspace (one-time fetch)
   */
  async getConversations(workspaceId: string): Promise<Conversation[]> {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('workspaceId', '==', workspaceId)
    );

    const snapshot = await getDocs(q);
    const list: Conversation[] = [];
    snapshot.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as Conversation);
    });

    return list;
  },

  /**
   * Set up a real-time listener for conversations in a workspace
   */
  onConversationsSnapshot(
    workspaceId: string,
    callback: (conversations: Conversation[]) => void,
    onError?: (error: Error) => void
  ) {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('workspaceId', '==', workspaceId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: Conversation[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as Conversation);
        });
        callback(list);
      },
      (err) => {
        console.error('Error listening to conversations:', err);
        if (onError) onError(err);
      }
    );
  }
};
