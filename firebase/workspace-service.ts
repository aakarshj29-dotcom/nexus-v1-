import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  runTransaction,
} from './firestore';
import { db } from './firestore';
import { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput, WorkspaceInvitation, WorkspaceRole, WorkspaceMember } from '@/types/workspace';
import { AppUser } from '@/types/auth';

const WORKSPACES_COLLECTION = 'workspaces';
const INVITATIONS_COLLECTION = 'invitations';
const USERS_COLLECTION = 'users';

/**
 * Helper to validate workspace data.
 */
function validateWorkspaceData(name: string, description?: string) {
  if (!name || name.trim() === '') {
    throw new Error('Workspace name is required.');
  }
  if (name.length > 100) {
    throw new Error('Workspace name cannot exceed 100 characters.');
  }
  if (description && description.length > 500) {
    throw new Error('Workspace description cannot exceed 500 characters.');
  }
}

/**
 * Creates a new Workspace.
 */
export async function createWorkspace(userId: string, input: CreateWorkspaceInput): Promise<string> {
  validateWorkspaceData(input.name, input.description);

  const workspaceRef = doc(collection(db, WORKSPACES_COLLECTION));

  const workspaceData = {
    name: input.name.trim(),
    description: (input.description || '').trim(),
    ownerId: userId,
    memberIds: [userId],
    roles: {
      [userId]: 'owner' as WorkspaceRole,
    },
    deleted: false,
    isPersonal: !!input.isPersonal,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(workspaceRef, workspaceData);
  return workspaceRef.id;
}

/**
 * Gets a workspace by ID.
 */
export async function getWorkspace(workspaceId: string): Promise<Workspace> {
  const docRef = doc(db, WORKSPACES_COLLECTION, workspaceId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Workspace not found.');
  }

  const data = docSnap.data();
  if (data.deleted) {
    throw new Error('Workspace has been deleted.');
  }

  return {
    id: docSnap.id,
    ...data,
  } as Workspace;
}

/**
 * Updates a workspace (Owner or Admin only).
 */
export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  input: UpdateWorkspaceInput
): Promise<void> {
  if (input.name !== undefined) {
    validateWorkspaceData(input.name, input.description);
  }

  const workspace = await getWorkspace(workspaceId);

  // Check role: Must be owner or admin
  const userRole = workspace.roles[userId];
  if (userRole !== 'owner' && userRole !== 'admin') {
    throw new Error('Permission denied. Only Owners and Admins can update workspace settings.');
  }

  const docRef = doc(db, WORKSPACES_COLLECTION, workspaceId);
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.description !== undefined) updateData.description = input.description.trim();

  await updateDoc(docRef, updateData);
}

/**
 * Soft deletes a workspace (Owner only).
 */
export async function deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
  const workspace = await getWorkspace(workspaceId);

  if (workspace.ownerId !== userId) {
    throw new Error('Permission denied. Only the Owner can delete this workspace.');
  }

  if (workspace.isPersonal) {
    throw new Error('Cannot delete your personal workspace.');
  }

  const docRef = doc(db, WORKSPACES_COLLECTION, workspaceId);
  await updateDoc(docRef, {
    deleted: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Sends/Creates a workspace invitation.
 */
export async function inviteToWorkspace(
  workspaceId: string,
  invitedByUserId: string,
  email: string,
  role: 'admin' | 'member' = 'member'
): Promise<string> {
  const workspace = await getWorkspace(workspaceId);

  // Check roles: Owner or Admin
  const callerRole = workspace.roles[invitedByUserId];
  if (callerRole !== 'owner' && callerRole !== 'admin') {
    throw new Error('Permission denied. Only Owners and Admins can invite new members.');
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Email is required.');
  }

  // Check if already a member
  const usersQuery = query(collection(db, USERS_COLLECTION), where('email', '==', cleanEmail));
  const userDocs = await getDocs(usersQuery);
  if (!userDocs.empty) {
    const userDoc = userDocs.docs[0];
    if (workspace.memberIds.includes(userDoc.id)) {
      throw new Error('This user is already a member of this workspace.');
    }
  }

  // Fetch inviter's profile for display name
  const inviterSnap = await getDoc(doc(db, USERS_COLLECTION, invitedByUserId));
  const inviterData = inviterSnap.data();
  const invitedByName = inviterData?.displayName || inviterData?.username || 'Nexus User';

  // Check if pending invitation already exists
  const existingQuery = query(
    collection(db, INVITATIONS_COLLECTION),
    where('workspaceId', '==', workspaceId),
    where('email', '==', cleanEmail),
    where('status', '==', 'pending')
  );
  const existingSnaps = await getDocs(existingQuery);
  if (!existingSnaps.empty) {
    throw new Error('A pending invitation already exists for this email.');
  }

  const inviteRef = doc(collection(db, INVITATIONS_COLLECTION));
  const inviteData = {
    workspaceId,
    workspaceName: workspace.name,
    email: cleanEmail,
    role,
    invitedBy: invitedByUserId,
    invitedByName,
    status: 'pending' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(inviteRef, inviteData);
  return inviteRef.id;
}

/**
 * Responds to an invitation (Accept or Decline).
 */
export async function respondToInvitation(
  invitationId: string,
  userId: string,
  action: 'accept' | 'decline'
): Promise<void> {
  const inviteRef = doc(db, INVITATIONS_COLLECTION, invitationId);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    throw new Error('Invitation not found.');
  }

  const invitation = inviteSnap.data() as WorkspaceInvitation;
  if (invitation.status !== 'pending') {
    throw new Error('This invitation has already been processed.');
  }

  // Fetch current user details to check email match
  const userSnap = await getDoc(doc(db, USERS_COLLECTION, userId));
  if (!userSnap.exists()) {
    throw new Error('User account not found.');
  }
  const userData = userSnap.data() as AppUser;
  if (userData.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error('This invitation was sent to a different email address.');
  }

  if (action === 'decline') {
    await updateDoc(inviteRef, {
      status: 'declined',
      updatedAt: serverTimestamp(),
    });
    return;
  }

  // Accept Flow: Must be a transaction to safely update both invitation status and workspace members
  const workspaceRef = doc(db, WORKSPACES_COLLECTION, invitation.workspaceId);

  await runTransaction(db, async (transaction) => {
    const freshInviteSnap = await transaction.get(inviteRef);
    if (!freshInviteSnap.exists() || freshInviteSnap.data()?.status !== 'pending') {
      throw new Error('Invitation was already processed.');
    }

    const freshWorkspaceSnap = await transaction.get(workspaceRef);
    if (!freshWorkspaceSnap.exists()) {
      throw new Error('Workspace not found or has been deleted.');
    }

    const workspaceData = freshWorkspaceSnap.data() as Workspace;
    if (workspaceData.deleted) {
      throw new Error('This workspace has been deleted.');
    }

    // Add user to memberIds and assign role
    const updatedMemberIds = [...(workspaceData.memberIds || [])];
    if (!updatedMemberIds.includes(userId)) {
      updatedMemberIds.push(userId);
    }

    const updatedRoles = {
      ...(workspaceData.roles || {}),
      [userId]: invitation.role,
    };

    transaction.update(workspaceRef, {
      memberIds: updatedMemberIds,
      roles: updatedRoles,
      updatedAt: serverTimestamp(),
    });

    transaction.update(inviteRef, {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Updates a member's role (Owner or Admin only).
 */
export async function updateMemberRole(
  workspaceId: string,
  callerUserId: string,
  targetUserId: string,
  newRole: WorkspaceRole
): Promise<void> {
  const workspace = await getWorkspace(workspaceId);

  const callerRole = workspace.roles[callerUserId];
  if (callerRole !== 'owner' && callerRole !== 'admin') {
    throw new Error('Permission denied. Only Owners and Admins can update roles.');
  }

  const targetRole = workspace.roles[targetUserId];
  if (!targetRole) {
    throw new Error('User is not a member of this workspace.');
  }

  if (targetUserId === workspace.ownerId) {
    throw new Error('Cannot change the role of the workspace Owner.');
  }

  // Admins cannot demote/promote other admins or the owner
  if (callerRole === 'admin' && (targetRole === 'admin' || newRole === 'admin')) {
    throw new Error('Permission denied. Admins cannot modify other Admins or elevate users to Admin.');
  }

  const workspaceRef = doc(db, WORKSPACES_COLLECTION, workspaceId);

  if (newRole === 'owner') {
    // Ownership transfer (Owner-only action)
    if (callerRole !== 'owner') {
      throw new Error('Permission denied. Only the Owner can transfer workspace ownership.');
    }

    await runTransaction(db, async (transaction) => {
      transaction.update(workspaceRef, {
        ownerId: targetUserId,
        roles: {
          ...workspace.roles,
          [callerUserId]: 'admin' as WorkspaceRole, // Former owner becomes admin
          [targetUserId]: 'owner' as WorkspaceRole,
        },
        updatedAt: serverTimestamp(),
      });
    });
  } else {
    // Simple role update
    await updateDoc(workspaceRef, {
      [`roles.${targetUserId}`]: newRole,
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Removes a member from the workspace (Owner or Admin only, or self-leave).
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  callerUserId: string,
  targetUserId: string
): Promise<void> {
  const workspace = await getWorkspace(workspaceId);

  const callerRole = workspace.roles[callerUserId];
  const targetRole = workspace.roles[targetUserId];

  if (!targetRole) {
    throw new Error('User is not a member of this workspace.');
  }

  if (targetUserId === workspace.ownerId) {
    throw new Error('Cannot remove the workspace Owner. Transfer ownership first.');
  }

  const isSelfLeaving = callerUserId === targetUserId;

  if (!isSelfLeaving) {
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      throw new Error('Permission denied. Only Owners and Admins can remove members.');
    }
    if (callerRole === 'admin' && targetRole === 'admin') {
      throw new Error('Permission denied. Admins cannot remove other Admins.');
    }
  }

  const workspaceRef = doc(db, WORKSPACES_COLLECTION, workspaceId);

  await runTransaction(db, async (transaction) => {
    const freshWorkspaceSnap = await transaction.get(workspaceRef);
    if (!freshWorkspaceSnap.exists()) {
      throw new Error('Workspace not found.');
    }

    const freshData = freshWorkspaceSnap.data() as Workspace;
    const updatedMemberIds = (freshData.memberIds || []).filter((id) => id !== targetUserId);

    const updatedRoles = { ...(freshData.roles || {}) };
    delete updatedRoles[targetUserId];

    transaction.update(workspaceRef, {
      memberIds: updatedMemberIds,
      roles: updatedRoles,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Fetches detailed member records (with profile information) for a workspace.
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const workspace = await getWorkspace(workspaceId);

  const members: WorkspaceMember[] = [];

  for (const uid of workspace.memberIds) {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as AppUser;
      members.push({
        uid,
        email: userData.email,
        displayName: userData.displayName,
        username: userData.username,
        avatarUrl: userData.avatarUrl,
        role: workspace.roles[uid] || 'member',
      });
    }
  }

  return members;
}

/**
 * Fetches invitations sent from a workspace.
 */
export async function getWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  const q = query(
    collection(db, INVITATIONS_COLLECTION),
    where('workspaceId', '==', workspaceId)
  );

  const snap = await getDocs(q);
  const list: WorkspaceInvitation[] = [];
  snap.forEach((d) => {
    list.push({
      id: d.id,
      ...d.data(),
    } as WorkspaceInvitation);
  });

  list.sort((a, b) => {
    const getMs = (val: unknown) => {
      if (!val) return 0;
      if (typeof val === 'string') return new Date(val).getTime();
      if (typeof val === 'object' && 'seconds' in val) {
        return (val as { seconds: number }).seconds * 1000;
      }
      return new Date(val as Date).getTime();
    };
    return getMs(b.createdAt) - getMs(a.createdAt);
  });

  return list;
}

/**
 * Cancels/Deletes a workspace invitation (Owner/Admin only).
 */
export async function cancelInvitation(
  invitationId: string,
  workspaceId: string,
  userId: string
): Promise<void> {
  const workspace = await getWorkspace(workspaceId);
  const callerRole = workspace.roles[userId];

  if (callerRole !== 'owner' && callerRole !== 'admin') {
    throw new Error('Permission denied. Only Owners and Admins can cancel invitations.');
  }

  const inviteRef = doc(db, INVITATIONS_COLLECTION, invitationId);
  await deleteDoc(inviteRef);
}
