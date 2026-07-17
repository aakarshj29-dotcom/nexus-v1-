'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
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
  orderBy,
  onSnapshot,
} from '@/firebase/firestore';

export function useProjects(workspaceId: string = 'default-workspace') {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'projects'),
      where('workspaceId', '==', workspaceId),
      where('memberIds', 'array-contains', user.uid),
      where('deleted', '==', false),
      orderBy('createdAt', 'desc')
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
        setProjects(fetchedProjects);
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
  }, [user?.uid, workspaceId]);

  const createProject = async (input: CreateProjectInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
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
