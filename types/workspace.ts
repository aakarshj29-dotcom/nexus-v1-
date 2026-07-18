import { Timestamp } from 'firebase/firestore';

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  roles: Record<string, WorkspaceRole>;
  deleted: boolean;
  isPersonal: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface WorkspaceMember {
  uid: string;
  email: string | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  role: WorkspaceRole;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string; // Lowercase
  role: 'admin' | 'member';
  invitedBy: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  isPersonal?: boolean;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
}
