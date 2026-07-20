'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { AppNotification } from '@/types/notification';
import { db, collection, query, where, onSnapshot } from '@/firebase/firestore';
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationService,
  deleteReadNotifications as deleteReadNotificationsService,
} from '@/firebase/notification-service';

export function useNotifications() {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspaces();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    if (isMock) {
      const loadMockNotifications = () => {
        const stored = localStorage.getItem('nexus_mock_notifications');
        let list: AppNotification[] = [];
        if (stored) {
          try {
            list = JSON.parse(stored);
          } catch {
            list = [];
          }
        } else {
          // Populate some mock initial notifications for Jules
          const initialMocks: AppNotification[] = [
            {
              id: 'mock-notif-1',
              recipientId: user.uid,
              senderId: 'mock-user-456',
              senderName: 'Alice Smith',
              type: 'task_assigned',
              title: 'New Task Assigned 📋',
              body: 'Alice assigned you "Review database architecture specifications" in Nexus Team Workspace.',
              link: '/dashboard/tasks',
              read: false,
              createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
              workspaceId: 'mock-workspace-team',
            },
            {
              id: 'mock-notif-2',
              recipientId: user.uid,
              senderId: 'mock-user-external',
              senderName: 'Alice Smith',
              type: 'workspace_invited',
              title: 'Workspace Invitation 🚀',
              body: 'Alice invited you to join Acme Corp Lab workspace.',
              link: '/dashboard/workspace',
              read: false,
              createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
            },
            {
              id: 'mock-notif-3',
              recipientId: user.uid,
              senderId: 'mock-user-789',
              senderName: 'Bob Johnson',
              type: 'mention',
              title: 'Mentioned in Chat 💬',
              body: 'Bob mentioned you in #general channel: "@Jules can you review my latest commit?"',
              link: '/dashboard/messages',
              read: true,
              createdAt: new Date(Date.now() - 1000 * 3600 * 24).toISOString(), // 1 day ago
              workspaceId: 'mock-workspace-team',
            }
          ];
          localStorage.setItem('nexus_mock_notifications', JSON.stringify(initialMocks));
          list = initialMocks;
        }

        // Filter notifications intended for this recipient
        const filtered = list.filter((n) => n.recipientId === user.uid);

        // Sort by createdAt descending
        filtered.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());

        setNotifications(filtered);
        setLoading(false);
      };

      loadMockNotifications();

      const handleUpdate = () => {
        loadMockNotifications();
      };

      window.addEventListener('nexus_notifications_changed', handleUpdate);
      return () => {
        window.removeEventListener('nexus_notifications_changed', handleUpdate);
      };
    }

    setLoading(true);

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as AppNotification);
        });

        // Sort by createdAt descending in-memory
        fetched.sort((a, b) => {
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

        setNotifications(fetched);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Notifications subscription error:', err);
        setError(err instanceof Error ? err : new Error('Failed to load notifications'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, isMock]);

  // Derived unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Filter notifications relevant to current active workspace (or workspace-less general ones)
  const workspaceNotifications = useMemo(() => {
    if (!activeWorkspace) return notifications;
    return notifications.filter((n) => !n.workspaceId || n.workspaceId === activeWorkspace.id);
  }, [notifications, activeWorkspace]);

  const markRead = async (id: string, read: boolean) => {
    try {
      await markNotificationRead(id, read);
    } catch (err) {
      console.error('Failed to mark notification read status:', err);
    }
  };

  const markAllRead = async () => {
    if (!user?.uid) return;
    try {
      await markAllNotificationsRead(user.uid);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteNotificationService(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const deleteRead = async () => {
    if (!user?.uid) return;
    try {
      await deleteReadNotificationsService(user.uid);
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  return {
    notifications,
    workspaceNotifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
    deleteNotification,
    deleteRead,
  };
}
export type { AppNotification };
export { markNotificationRead, markAllNotificationsRead, deleteNotificationService, deleteReadNotificationsService };
