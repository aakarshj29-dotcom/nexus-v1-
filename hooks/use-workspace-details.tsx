'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { WorkspaceMember, WorkspaceInvitation } from '@/types/workspace';
import {
  getWorkspaceMembers,
} from '@/firebase/workspace-service';
import {
  db,
  collection,
  query,
  where,
  onSnapshot,
} from '@/firebase/firestore';

const MOCK_PROFILES: Record<string, { displayName: string; username: string; email: string; avatarUrl: string | null }> = {
  'mock-user-123': {
    displayName: 'Jules Nexus',
    username: 'jules_nexus',
    email: 'jules@nexus.com',
    avatarUrl: null
  },
  'mock-user-456': {
    displayName: 'Alice Developer',
    username: 'alice_dev',
    email: 'alice@nexus.com',
    avatarUrl: null
  },
  'mock-user-789': {
    displayName: 'Bob Designer',
    username: 'bob_design',
    email: 'bob@nexus.com',
    avatarUrl: null
  }
};

export function useWorkspaceDetails(workspaceId: string | undefined) {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspaces();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  // Sync Members
  useEffect(() => {
    if (!user?.uid || !workspaceId) {
      setMembers([]);
      return;
    }

    if (isMock) {
      setLoadingMembers(true);
      if (activeWorkspace) {
        const list: WorkspaceMember[] = activeWorkspace.memberIds.map((uid) => {
          const profile = MOCK_PROFILES[uid] || {
            displayName: 'External Team Member',
            username: 'external_member',
            email: 'external@nexus.com',
            avatarUrl: null
          };
          return {
            uid,
            email: profile.email,
            displayName: profile.displayName,
            username: profile.username,
            avatarUrl: profile.avatarUrl,
            role: activeWorkspace.roles[uid] || 'member',
          };
        });
        setMembers(list);
      }
      setLoadingMembers(false);

      const handleCustomUpdate = () => {
        if (activeWorkspace) {
          const list: WorkspaceMember[] = activeWorkspace.memberIds.map((uid) => {
            const profile = MOCK_PROFILES[uid] || {
              displayName: 'External Team Member',
              username: 'external_member',
              email: 'external@nexus.com',
              avatarUrl: null
            };
            return {
              uid,
              email: profile.email,
              displayName: profile.displayName,
              username: profile.username,
              avatarUrl: profile.avatarUrl,
              role: activeWorkspace.roles[uid] || 'member',
            };
          });
          setMembers(list);
        }
      };

      window.addEventListener('nexus_mock_workspaces_changed', handleCustomUpdate);
      return () => {
        window.removeEventListener('nexus_mock_workspaces_changed', handleCustomUpdate);
      };
    }

    let isSubscribed = true;
    setLoadingMembers(true);

    const qWorkspace = query(collection(db, 'workspaces'), where('__name__', '==', workspaceId));
    const unsubWorkspace = onSnapshot(
      qWorkspace,
      async (snapshot) => {
        if (snapshot.empty) {
          if (isSubscribed) setLoadingMembers(false);
          return;
        }

        try {
          const fetchedMembers = await getWorkspaceMembers(workspaceId);
          if (isSubscribed) {
            setMembers(fetchedMembers);
            setLoadingMembers(false);
          }
        } catch (err) {
          console.error('Error fetching workspace members details:', err);
          if (isSubscribed) {
            setError(err instanceof Error ? err : new Error('Failed to load workspace members'));
            setLoadingMembers(false);
          }
        }
      },
      (err) => {
        console.error('Workspace doc subscription error:', err);
        if (isSubscribed) {
          setError(err);
          setLoadingMembers(false);
        }
      }
    );

    return () => {
      isSubscribed = false;
      unsubWorkspace();
    };
  }, [user?.uid, workspaceId, activeWorkspace, isMock]);

  // Sync Invitations
  useEffect(() => {
    if (!user?.uid || !workspaceId) {
      setInvitations([]);
      return;
    }

    if (isMock) {
      setLoadingInvitations(true);
      const loadMockInv = () => {
        const stored = localStorage.getItem('nexus_mock_invitations');
        if (stored) {
          const list: WorkspaceInvitation[] = JSON.parse(stored);
          setInvitations(list.filter((i) => i.workspaceId === workspaceId && i.status === 'pending'));
        }
        setLoadingInvitations(false);
      };
      loadMockInv();

      window.addEventListener('nexus_mock_workspaces_changed', loadMockInv);
      return () => {
        window.removeEventListener('nexus_mock_workspaces_changed', loadMockInv);
      };
    }

    setLoadingInvitations(true);

    const q = query(
      collection(db, 'invitations'),
      where('workspaceId', '==', workspaceId)
    );

    const unsubscribe = onSnapshot(
      q,
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

        setInvitations(list);
        setLoadingInvitations(false);
      },
      (err) => {
        console.error('Workspace invitations subscription error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load invitations'));
        setLoadingInvitations(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, workspaceId, isMock]);

  return {
    members,
    invitations,
    loadingMembers,
    loadingInvitations,
    error,
  };
}
