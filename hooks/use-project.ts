'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Project, UpdateProjectInput } from '@/types/project';
import {
  updateProject as updateProjectService,
  deleteProject as deleteProjectService,
  archiveProject as archiveProjectService,
  restoreProject as restoreProjectService,
} from '@/firebase/project-service';
import { db, doc, onSnapshot } from '@/firebase/firestore';

export function useProject(projectId: string) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid || !projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const projectRef = doc(db, 'projects', projectId);

    const unsubscribe = onSnapshot(
      projectRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.deleted) {
            setProject(null);
            setError(new Error('Project not found (deleted)'));
          } else {
            // Verify access
            const memberIds = data.memberIds || [];
            if (data.ownerId !== user.uid && !memberIds.includes(user.uid)) {
              setProject(null);
              setError(new Error('Access denied. You are not a member of this project.'));
            } else {
              setProject({
                id: docSnap.id,
                ...data,
              } as Project);
              setError(null);
            }
          }
        } else {
          setProject(null);
          setError(new Error('Project not found'));
        }
        setLoading(false);
      },
      (err) => {
        console.error('Project subscription error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load project'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, projectId]);

  const updateProject = async (input: UpdateProjectInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await updateProjectService(projectId, user.uid, input);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to update project');
      setError(errorObj);
      throw errorObj;
    }
  };

  const archiveProject = async () => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await archiveProjectService(projectId, user.uid);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to archive project');
      setError(errorObj);
      throw errorObj;
    }
  };

  const restoreProject = async () => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await restoreProjectService(projectId, user.uid);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to restore project');
      setError(errorObj);
      throw errorObj;
    }
  };

  const deleteProject = async () => {
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
    project,
    loading,
    error,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
  };
}
