'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { Project, CreateProjectInput, UpdateProjectInput } from '@/types/project';
import {
  createProject as createProjectService,
  updateProject as updateProjectService,
  deleteProject as deleteProjectService,
  archiveProject as archiveProjectService,
  restoreProject as restoreProjectService,
} from '@/firebase/project-service';
import {
  db,
  collection,
  query,
  where,
  onSnapshot,
} from '@/firebase/firestore';

export function useProjects(workspaceIdOverride?: string) {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspaces();
  const [rawProjects, setRawProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const targetWorkspaceId = workspaceIdOverride || activeWorkspace?.id;
  const isPersonalTarget = workspaceIdOverride ? false : activeWorkspace?.isPersonal;

  useEffect(() => {
    if (!user?.uid) {
      setRawProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'projects'),
      where('memberIds', 'array-contains', user.uid),
      where('deleted', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProjects: Project[] = [];
        snapshot.forEach((docSnap) => {
          fetchedProjects.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as Project);
        });
        setRawProjects(fetchedProjects);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Projects subscription error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load projects'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // In-memory workspace filtering and sorting to ensure compatibility, speed, and zero composite index issues!
  const projects = useMemo(() => {
    let list = [...rawProjects];

    // Filter by workspace
    if (targetWorkspaceId) {
      if (isPersonalTarget) {
        // If personal workspace, show personal data: where workspaceId is null, empty, 'default-workspace', or matches personal workspace id
        list = list.filter(
          (p) =>
            !p.workspaceId ||
            p.workspaceId === 'default-workspace' ||
            p.workspaceId === targetWorkspaceId
        );
      } else {
        // Show team workspace data
        list = list.filter((p) => p.workspaceId === targetWorkspaceId);
      }
    } else {
      // Default fallback if activeWorkspace is still loading
      list = list.filter((p) => !p.workspaceId || p.workspaceId === 'default-workspace');
    }

    // Sort by createdAt descending
    list.sort((a, b) => {
      const getMs = (dateVal: unknown) => {
        if (!dateVal) return 0;
        if (typeof dateVal === 'string') return new Date(dateVal).getTime();
        if (typeof dateVal === 'object' && 'seconds' in dateVal) {
          return (dateVal as { seconds: number }).seconds * 1000;
        }
        return new Date(dateVal as Date).getTime();
      };
      return getMs(b.createdAt) - getMs(a.createdAt);
    });

    return list;
  }, [rawProjects, targetWorkspaceId, isPersonalTarget]);

  const createProject = async (input: CreateProjectInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      const workspaceId = targetWorkspaceId || 'default-workspace';
      return await createProjectService(user.uid, { ...input, workspaceId });
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to create project');
      setError(errorObj);
      throw errorObj;
    }
  };

  const updateProject = async (projectId: string, input: UpdateProjectInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await updateProjectService(projectId, user.uid, input);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to update project');
      setError(errorObj);
      throw errorObj;
    }
  };

  const archiveProject = async (projectId: string) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await archiveProjectService(projectId, user.uid);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to archive project');
      setError(errorObj);
      throw errorObj;
    }
  };

  const restoreProject = async (projectId: string) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await restoreProjectService(projectId, user.uid);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to restore project');
      setError(errorObj);
      throw errorObj;
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await deleteProjectService(projectId, user.uid);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to delete project');
      setError(errorObj);
      throw errorObj;
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
  };
}
