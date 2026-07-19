import {
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from './firestore';
import { AppNotification, CreateNotificationInput } from '@/types/notification';

const NOTIFICATIONS_COLLECTION = 'notifications';

const isMock = () => typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

const getMockNotifications = (): AppNotification[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('nexus_mock_notifications');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

const saveMockNotifications = (notifications: AppNotification[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nexus_mock_notifications', JSON.stringify(notifications));
  window.dispatchEvent(new Event('nexus_notifications_changed'));
};

/**
 * Creates a notification.
 */
export async function createNotification(input: CreateNotificationInput): Promise<string> {
  if (isMock()) {
    const list = getMockNotifications();
    const newId = 'mock-notify-' + Math.random().toString(36).substring(2, 9);
    const newNotification: AppNotification = {
      id: newId,
      ...input,
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveMockNotifications([newNotification, ...list]);
    return newId;
  }

  const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    ...input,
    read: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Marks a notification as read/unread.
 */
export async function markNotificationRead(id: string, read: boolean): Promise<void> {
  if (isMock()) {
    const list = getMockNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, read } : n));
    saveMockNotifications(updated);
    return;
  }

  const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
  await updateDoc(docRef, { read });
}

/**
 * Marks all notifications as read for a specific recipient.
 */
export async function markAllNotificationsRead(recipientId: string): Promise<void> {
  if (isMock()) {
    const list = getMockNotifications();
    const updated = list.map((n) => (n.recipientId === recipientId ? { ...n, read: true } : n));
    saveMockNotifications(updated);
    return;
  }

  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('recipientId', '==', recipientId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => {
    batch.update(doc(db, NOTIFICATIONS_COLLECTION, docSnap.id), { read: true });
  });
  await batch.commit();
}

/**
 * Deletes a single notification.
 */
export async function deleteNotification(id: string): Promise<void> {
  if (isMock()) {
    const list = getMockNotifications();
    const updated = list.filter((n) => n.id !== id);
    saveMockNotifications(updated);
    return;
  }

  const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Clears/deletes all read notifications for a recipient (retention & cleanup strategy).
 */
export async function deleteReadNotifications(recipientId: string): Promise<void> {
  if (isMock()) {
    const list = getMockNotifications();
    const updated = list.filter((n) => n.recipientId !== recipientId || !n.read);
    saveMockNotifications(updated);
    return;
  }

  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('recipientId', '==', recipientId),
    where('read', '==', true)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => {
    batch.delete(doc(db, NOTIFICATIONS_COLLECTION, docSnap.id));
  });
  await batch.commit();
}
