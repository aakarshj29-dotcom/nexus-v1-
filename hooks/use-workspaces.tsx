'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput, WorkspaceInvitation, WorkspaceRole } from '@/types/workspace';
import { useAuth } from '@/hooks/use-auth';
import {
  createWorkspace as createWorkspaceService,
  updateWorkspace as updateWorkspaceService,
  deleteWorkspace as deleteWorkspaceService,
  inviteToWorkspace as inviteToWorkspaceService,
  respondToInvitation as respondToInvitationService,
  updateMemberRole as updateMemberRoleService,
  removeWorkspaceMember as removeWorkspaceMemberService,
  cancelInvitation as cancelInvitationService,
} from '@/firebase/workspace-service';
import {
  db,
  collection,
  query,
  where,
  onSnapshot,
} from '@/firebase/firestore';

const DEFAULT_MOCK_WORKSPACES: Workspace[] = [
  {
    id: 'mock-workspace-personal',
    name: 'Jules Personal Workspace',
    description: 'My private sandbox workspace.',
    ownerId: 'mock-user-123',
    memberIds: ['mock-user-123'],
    roles: {
      'mock-user-123': 'owner'
    },
    deleted: false,
    isPersonal: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-workspace-team',
    name: 'Nexus Team Workspace',
    description: 'Shared platform space for Nexus V1 developers.',
    ownerId: 'mock-user-123',
    memberIds: ['mock-user-123', 'mock-user-456', 'mock-user-789'],
    roles: {
      'mock-user-123': 'owner',
      'mock-user-456': 'admin',
      'mock-user-789': 'member'
    },
    deleted: false,
    isPersonal: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const DEFAULT_MOCK_INVITATIONS: WorkspaceInvitation[] = [
  {
    id: 'mock-invitation-1',
    workspaceId: 'mock-workspace-external',
    workspaceName: 'Acme Corp Lab',
    email: 'jules@nexus.com',
    role: 'member',
    invitedBy: 'mock-user-external',
    invitedByName: 'Alice Smith',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  pendingInvitations: WorkspaceInvitation[];
  loading: boolean;
  error: Error | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  createWorkspace: (input: CreateWorkspaceInput) => Promise<string>;
  updateWorkspace: (workspaceId: string, input: UpdateWorkspaceInput) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  sendInvite: (workspaceId: string, email: string, role?: 'admin' | 'member') => Promise<string>;
  cancelInvite: (workspaceId: string, invitationId: string) => Promise<void>;
  respondToInvite: (invitationId: string, action: 'accept' | 'decline') => Promise<void>;
  updateMemberRole: (workspaceId: string, targetUserId: string, newRole: WorkspaceRole) => Promise<void>;
  removeMember: (workspaceId: string, targetUserId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  // Active Workspace Persistence
  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    if (user?.uid) {
      localStorage.setItem(`nexus_active_workspace_id_${user.uid}`, workspace.id);
    }
  };

  // Subscription to Workspaces and Pending Invitations
  useEffect(() => {
    if (!user?.uid) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setPendingInvitations([]);
      setLoading(false);
      return;
    }

    if (isMock) {
      // Mock / LocalStorage sync logic
      const loadMockWorkspaces = () => {
        const storedWs = localStorage.getItem('nexus_mock_workspaces');
        const storedInv = localStorage.getItem('nexus_mock_invitations');

        let wsList: Workspace[] = [];
        let invList: WorkspaceInvitation[] = [];

        if (storedWs) {
          try {
            wsList = JSON.parse(storedWs);
          } catch {
            wsList = DEFAULT_MOCK_WORKSPACES;
          }
        } else {
          localStorage.setItem('nexus_mock_workspaces', JSON.stringify(DEFAULT_MOCK_WORKSPACES));
          wsList = DEFAULT_MOCK_WORKSPACES;
        }

        if (storedInv) {
          try {
            invList = JSON.parse(storedInv);
          } catch {
            invList = DEFAULT_MOCK_INVITATIONS;
          }
        } else {
          localStorage.setItem('nexus_mock_invitations', JSON.stringify(DEFAULT_MOCK_INVITATIONS));
          invList = DEFAULT_MOCK_INVITATIONS;
        }

        setWorkspaces(wsList);
        setPendingInvitations(invList.filter((i) => i.status === 'pending'));

        const savedId = localStorage.getItem(`nexus_active_workspace_id_${user.uid}`);
        const found = wsList.find((w) => w.id === savedId) || wsList.find((w) => w.isPersonal) || wsList[0];
        setActiveWorkspaceState(found || null);
        setLoading(false);
      };

      loadMockWorkspaces();

      const handleCustomUpdate = () => {
        loadMockWorkspaces();
      };

      window.addEventListener('nexus_mock_workspaces_changed', handleCustomUpdate);
      return () => {
        window.removeEventListener('nexus_mock_workspaces_changed', handleCustomUpdate);
      };
    }

    setLoading(true);

    // 1. Subscribe to workspaces the user is part of
    const wsQuery = query(
      collection(db, 'workspaces'),
      where('memberIds', 'array-contains', user.uid),
      where('deleted', '==', false)
    );

    const unsubWorkspaces = onSnapshot(
      wsQuery,
      async (snapshot) => {
        const list: Workspace[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as Workspace);
        });

        // Sort by createdAt descending in-memory to avoid missing-index compilation errors
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

        // 2. Automatically check if a personal workspace exists, if not create one
        const finalWorkspaces = [...list];
        if (list.length === 0) {
          try {
            await createWorkspaceService(user.uid, {
              name: 'My Workspace',
              isPersonal: true,
            });
            return;
          } catch (err) {
            console.error('Failed to create default workspace:', err);
            setError(err instanceof Error ? err : new Error('Failed to setup workspace'));
            setLoading(false);
            return;
          }
        }

        setWorkspaces(finalWorkspaces);

        // 3. Resolve Active Workspace
        const savedId = localStorage.getItem(`nexus_active_workspace_id_${user.uid}`);
        const found = finalWorkspaces.find((w) => w.id === savedId) || finalWorkspaces.find((w) => w.isPersonal) || finalWorkspaces[0];

        if (found) {
          setActiveWorkspaceState(found);
        } else {
          setActiveWorkspaceState(null);
        }

        setLoading(false);
      },
      (err) => {
        console.error('Workspaces subscription error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load workspaces'));
        setLoading(false);
      }
    );

    // 4. Subscribe to pending invitations received by user's email
    let unsubInvitations = () => {};
    if (user.email) {
      const invitesQuery = query(
        collection(db, 'invitations'),
        where('email', '==', user.email.toLowerCase()),
        where('status', '==', 'pending')
      );

      unsubInvitations = onSnapshot(
        invitesQuery,
        (snapshot) => {
          const list: WorkspaceInvitation[] = [];
          snapshot.forEach((docSnap) => {
            list.push({
              id: docSnap.id,
              ...docSnap.data(),
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
          setPendingInvitations(list);
        },
        (err) => {
          console.error('Invitations subscription error:', err);
        }
      );
    }

    return () => {
      unsubWorkspaces();
      unsubInvitations();
    };
  }, [user?.uid, user?.email, isMock]);

  // Actions
  const createWorkspace = async (input: CreateWorkspaceInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    if (isMock) {
      const stored = localStorage.getItem('nexus_mock_workspaces');
      let currentList: Workspace[] = stored ? JSON.parse(stored) : [...DEFAULT_MOCK_WORKSPACES];
      const newId = 'mock-workspace-' + Math.random().toString(36).substring(2, 9);
      const newWorkspace: Workspace = {
        id: newId,
        name: input.name,
        description: input.description || '',
        ownerId: user.uid,
        memberIds: [user.uid],
        roles: {
          [user.uid]: 'owner'
        },
        deleted: false,
        isPersonal: !!input.isPersonal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentList = [newWorkspace, ...currentList];
      localStorage.setItem('nexus_mock_workspaces', JSON.stringify(currentList));
      window.dispatchEvent(new Event('nexus_mock_workspaces_changed'));
      return newId;
    }

    try {
      const id = await createWorkspaceService(user.uid, input);
      return id;
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error('Failed to create workspace');
      setError(errObj);
      throw errObj;
    }
  };

  const updateWorkspace = async (workspaceId: string, input: UpdateWorkspaceInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    if (isMock) {
      const stored = localStorage.getItem('nexus_mock_workspaces');
      let currentList: Workspace[] = stored ? JSON.parse(stored) : [...DEFAULT_MOCK_WORKSPACES];
      currentList = currentList.map((w) => {
        if (w.id === workspaceId) {
          return {
            ...w,
            name: input.name !== undefined ? input.name : w.name,
            description: input.description !== undefined ? input.description : w.description,
            updatedAt: new Date().toISOString(),
          };
        }
        return w;
      });
      localStorage.setItem('nexus_mock_workspaces', JSON.stringify(currentList));
      window.dispatchEvent(new Event('nexus_mock_workspaces_changed'));
      return;
    }

    try {
      await updateWorkspaceService(workspaceId, user.uid, input);
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error('Failed to update workspace');
      setError(errObj);
      throw errObj;
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    if (isMock) {
      const stored = localStorage.getItem('nexus_mock_workspaces');
      let currentList: Workspace[] = stored ? JSON.parse(stored) : [...DEFAULT_MOCK_WORKSPACES];
      currentList = currentList.map((w) => {
        if (w.id === workspaceId) {
          return { ...w, deleted: true, updatedAt: new Date().toISOString() };
        }
        return w;
      });
      localStorage.setItem('nexus_mock_workspaces', JSON.stringify(currentList));
      window.dispatchEvent(new Event('nexus_mock_workspaces_changed'));
      return;
    }

    try {
      await deleteWorkspaceService(workspaceId, user.uid);
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error('Failed to delete workspace');
      setError(errObj);
      throw errObj;
    }
  };

  const sendInvite = async (workspaceId: string, email: string, role: 'admin' | 'member' = 'member') => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    if (isMock) {
      const stored = localStorage.getItem('nexus_mock_invitations');
      let currentList: WorkspaceInvitation[] = stored ? JSON.parse(stored) : [...DEFAULT_MOCK_INVITATIONS];
      const newId = 'mock-invitation-' + Math.random().toString(36).substring(2, 9);
      const newInvitation: WorkspaceInvitation = {
        id: newId,
        workspaceId,
        workspaceName: activeWorkspace?.name || 'Workspace',
        email: email.trim().toLowerCase(),
        role,
        invitedBy: user.uid,
        invitedByName: user.displayName || user.username || 'User',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentList = [newInvitation, ...currentList];
      localStorage.setItem('nexus_mock_invitations', JSON.stringify(currentList));
      window.dispatchEvent(new Event('nexus_mock_workspaces_changed'));
      return newId;
    }

    return await inviteToWorkspaceService(workspaceId, user.uid, email, role);
  };

  const cancelInvite = async (workspaceId: string, invitationId: string) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    if (isMock) {
      const stored = localStorage.getItem('nexus_mock_invitations');
      let currentList: WorkspaceInvitation[] = stored ? JSON.parse(stored) : [...DEFAULT_MOCK_INVITATIONS];
      currentList = currentList.filter((i) => i.id !== invitationId);
      localStorage.setItem('nexus_mock_invitations', JSON.stringify(currentList));
      window.dispatchEvent(new Event('nexus_mock_workspaces_changed'));
      return;
    }

    await cancelInvitationService(invitationId, workspaceId, user.uid);
  };

  const respondToInvite = async (invitationId: string, action: 'accept' | 'decline') => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    if (isMock) {
      const storedInv = localStorage.getItem('nexus_mock_invitations');
      const currentInvList: WorkspaceInvitation[] = storedInv ? JSON.parse(storedInv) : [...DEFAULT_MOCK_INVITATIONS];
      const targetInvite = currentInvList.find((i) => i.id === invitationId);

      if (targetInvite) {
        targetInvite.status = action === 'accept' ? 'accepted' : 'declined';
        targetInvite.updatedAt = new Date().toISOString();
        localStorage.setItem('nexus_mock_invitations', JSON.stringify(currentInvList));

        if (action === 'accept') {
          // Add to workspace members
          const storedWs = localStorage.getItem('nexus_mock_workspaces');
          let currentWsList: Workspace[] = storedWs ? JSON.parse(storedWs) : [...DEFAULT_MOCK_WORKSPACES];
          currentWsList = currentWsList.map((w) => {
            if (w.id === targetInvite.workspaceId) {
              const updatedMemberIds = [...(w.memberIds || [])];
              if (!updatedMemberIds.includes(user.uid)) {
                updatedMemberIds.push(user.uid);
              }
              return {
                ...w,
                memberIds: updatedMemberIds,
                roles: {
                  ...(w.roles || {}),
                  [user.uid]: targetInvite.role
                },
                updatedAt: new Date().toISOString()
              };
            }
            return w;
          });
          localStorage.setItem('nexus_mock_workspaces', JSON.stringify(currentWsList));
        }
      }

      window.dispatchEvent(new Event('nexus_mock_workspaces_changed'));
      return;
    }

    await respondToInvitationService(invitationId, user.uid, action);
  };

  const updateMemberRole = async (workspaceId: string, targetUserId: string, newRole: WorkspaceRole) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    if (isMock) {
      const stored = localStorage.getItem('nexus_mock_workspaces');
      let currentList: Workspace[] = stored ? JSON.parse(stored) : [...DEFAULT_MOCK_WORKSPACES];
      currentList = currentList.map((w) => {
        if (w.id === workspaceId) {
          const updatedRoles = {
            ...(w.roles || {}),
            [targetUserId]: newRole
          };
          let updatedOwnerId = w.ownerId;
          if (newRole === 'owner') {
            updatedOwnerId = targetUserId;
            updatedRoles[user.uid] = 'admin';
          }
          return {
            ...w,
            ownerId: updatedOwnerId,
            roles: updatedRoles,
            updatedAt: new Date().toISOString()
          };
        }
        return w;
      });
      localStorage.setItem('nexus_mock_workspaces', JSON.stringify(currentList));
      window.dispatchEvent(new Event('nexus_mock_workspaces_changed'));
      return;
    }

    await updateMemberRoleService(workspaceId, user.uid, targetUserId, newRole);
  };

  const removeMember = async (workspaceId: string, targetUserId: string) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    if (isMock) {
      const stored = localStorage.getItem('nexus_mock_workspaces');
      let currentList: Workspace[] = stored ? JSON.parse(stored) : [...DEFAULT_MOCK_WORKSPACES];
      currentList = currentList.map((w) => {
        if (w.id === workspaceId) {
          const updatedMemberIds = (w.memberIds || []).filter((id) => id !== targetUserId);
          const updatedRoles = { ...(w.roles || {}) };
          delete updatedRoles[targetUserId];
          return {
            ...w,
            memberIds: updatedMemberIds,
            roles: updatedRoles,
            updatedAt: new Date().toISOString()
          };
        }
        return w;
      });
      localStorage.setItem('nexus_mock_workspaces', JSON.stringify(currentList));
      window.dispatchEvent(new Event('nexus_mock_workspaces_changed'));
      return;
    }

    await removeWorkspaceMemberService(workspaceId, user.uid, targetUserId);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        pendingInvitations,
        loading,
        error,
        setActiveWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        sendInvite,
        cancelInvite,
        respondToInvite,
        updateMemberRole,
        removeMember,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspaces must be used within a WorkspaceProvider');
  }
  return context;
}
