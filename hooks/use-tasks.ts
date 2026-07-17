'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, TaskPriority } from '@/types/task';
import {
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
} from '@/firebase/task-service';
import { db, collection, query, where, onSnapshot } from '@/firebase/firestore';

interface UseTasksOptions {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  searchQuery?: string;
  sortBy?: 'position' | 'dueDate' | 'title' | 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export function useTasks(options: UseTasksOptions = {}) {
  const { user } = useAuth();
  const [rawTasks, setRawTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { projectId, status, priority, searchQuery, sortBy = 'position', sortOrder = 'asc' } = options;

  useEffect(() => {
    if (!user?.uid) {
      setRawTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let q = query(
      collection(db, 'tasks'),
      where('deleted', '==', false)
    );

    // If projectId is provided, filter by it. Otherwise, get all tasks created by the user.
    if (projectId) {
      q = query(
        collection(db, 'tasks'),
        where('projectId', '==', projectId),
        where('deleted', '==', false)
      );
    } else {
      q = query(
        collection(db, 'tasks'),
        where('ownerId', '==', user.uid),
        where('deleted', '==', false)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          fetchedTasks.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as Task);
        });
        setRawTasks(fetchedTasks);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Tasks subscription error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load tasks'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, projectId]);

  // In-memory Filtering and Sorting for high performance and zero-index dependency!
  const tasks = useMemo(() => {
    let filtered = [...rawTasks];

    // Filter by status
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    // Filter by priority
    if (priority) {
      filtered = filtered.filter((t) => t.priority === priority);
    }

    // Filter by search query (title/description)
    if (searchQuery && searchQuery.trim() !== '') {
      const qLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(qLower) ||
          t.description.toLowerCase().includes(qLower)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'position') {
        comparison = (a.position || 0) - (b.position || 0);
      } else if (sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'createdAt') {
        const getSecs = (ts: unknown) => {
          if (!ts) return 0;
          if (typeof ts === 'string') return new Date(ts).getTime();
          if (ts !== null && typeof ts === 'object' && 'seconds' in ts) {
            return (ts as { seconds: number }).seconds || 0;
          }
          return 0;
        };
        comparison = getSecs(a.createdAt) - getSecs(b.createdAt);
      } else if (sortBy === 'priority') {
        const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        comparison = weightB - weightA; // High priority first
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [rawTasks, status, priority, searchQuery, sortBy, sortOrder]);

  const createTask = async (input: CreateTaskInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      return await createTaskService(user.uid, input);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to create task');
      setError(errorObj);
      throw errorObj;
    }
  };

  const updateTask = async (taskId: string, input: UpdateTaskInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await updateTaskService(taskId, user.uid, input);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to update task');
      setError(errorObj);
      throw errorObj;
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await deleteTaskService(taskId, user.uid);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to delete task');
      setError(errorObj);
      throw errorObj;
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
  };
}
