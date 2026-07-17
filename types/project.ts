import { Timestamp } from 'firebase/firestore';

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  ownerId: string;
  workspaceId: string; // Ready for multi-workspace support
  title: string;
  description: string;
  status: ProjectStatus;
  color: string; // Hex color string or color name
  icon: string; // Icon identifier string (e.g. Lucide icon name)
  createdAt: Timestamp | string; // Accept Timestamp or ISO string for flexibility
  updatedAt: Timestamp | string;
  archivedAt: Timestamp | string | null;
  memberIds: string[]; // Collaboration support
  taskCount: number;
  completedTaskCount: number;
  deleted?: boolean; // Soft delete architecture
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  workspaceId?: string;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  color?: string;
  icon?: string;
  taskCount?: number;
  completedTaskCount?: number;
}
