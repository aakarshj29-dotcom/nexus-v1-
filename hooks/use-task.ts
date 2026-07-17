'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Task, UpdateTaskInput } from '@/types/task';
import {
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
} from '@/firebase/task-service';
import { db, doc, onSnapshot } from '@/firebase/firestore';

export function useTask(taskId: string) {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid || !taskId) {
      setTask(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const taskRef = doc(db, 'tasks', taskId);

    const unsubscribe = onSnapshot(
      taskRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.deleted) {
            setTask(null);
            setError(new Error('Task not found (deleted)'));
          } else {
            setTask({
              id: docSnap.id,
              ...data,
            } as Task);
            setError(null);
          }
        } else {
          setTask(null);
          setError(new Error('Task not found'));
        }
        setLoading(false);
      },
      (err) => {
        console.error('Task subscription error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load task'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, taskId]);

  const updateTask = async (input: UpdateTaskInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await updateTaskService(taskId, user.uid, input);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to update task');
      setError(errorObj);
      throw errorObj;
    }
  };

  const deleteTask = async () => {
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
    task,
    loading,
    error,
    updateTask,
    deleteTask,
  };
}
