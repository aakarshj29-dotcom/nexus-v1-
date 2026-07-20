import { Timestamp } from 'firebase/firestore';

export type NotificationType =
  | 'task_assigned'
  | 'workspace_invited'
  | 'project_added'
  | 'mention'
  | 'system';

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link: string; // URL path to navigate, e.g. "/dashboard/tasks", "/dashboard/workspace"
  read: boolean;
  createdAt: Timestamp | string; // Handle Firestore Timestamp or ISO string
  workspaceId?: string; // Optional reference to workspace context
  metadata?: Record<string, unknown>; // Flexible metadata
}

export interface CreateNotificationInput {
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
}
