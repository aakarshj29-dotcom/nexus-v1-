import { Timestamp } from 'firebase/firestore';

export type LiveObjectType = 'task' | 'project' | 'note' | 'event';

export interface LiveObjectAttachment {
  type: LiveObjectType;
  id: string;
  title: string;
  statusOrDate?: string;
}

export type ConversationType = 'direct' | 'workspace';

export interface Conversation {
  id: string;
  type: ConversationType;
  workspaceId: string;
  name?: string;
  description?: string;
  memberIds: string[];
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    createdAt: Timestamp | string;
  } | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  text: string;
  createdAt: Timestamp | string;
  attachment?: LiveObjectAttachment | null;
}
