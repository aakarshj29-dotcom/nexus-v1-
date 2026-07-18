import { Timestamp } from 'firebase/firestore';

export interface Note {
  id: string;
  ownerId: string;
  title: string;
  content: string; // HTML markup or JSON string representing rich text
  excerpt: string; // Plain-text preview snippet
  pinned: boolean;
  favorite: boolean;
  deleted: boolean; // Soft delete flag
  tags: string[];
  createdAt: Timestamp | string; // Firebase Timestamp or ISO-8601 string
  updatedAt: Timestamp | string;
}

export interface CreateNoteInput {
  title?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  excerpt?: string;
  pinned?: boolean;
  favorite?: boolean;
  deleted?: boolean;
  tags?: string[];
}
