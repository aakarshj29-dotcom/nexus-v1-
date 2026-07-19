'use client';

import { useState, useEffect } from 'react';
import { Message, LiveObjectAttachment } from '@/types/message';
import { useAuth } from './use-auth';
import { messageService } from '@/firebase/message-service';

const MOCK_CONVERSATIONS_KEY = 'nexus_mock_conversations';
const MOCK_MESSAGES_PREFIX = 'nexus_mock_messages_';

const getInitialMockMessages = (conversationId: string): Message[] => {
  if (conversationId === 'mock-chat-general') {
    return [
      {
        id: 'msg-gen-1',
        conversationId,
        senderId: 'mock-user-456',
        senderName: 'Alice Smith',
        senderAvatarUrl: null,
        text: 'Hi everyone! Welcome to Nexus Chat & Collaboration V1.',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        attachment: null,
      },
      {
        id: 'msg-gen-2',
        conversationId,
        senderId: 'mock-user-789',
        senderName: 'Bob Johnson',
        senderAvatarUrl: null,
        text: 'This is awesome. Looking forward to live collaboration here!',
        createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
        attachment: null,
      }
    ];
  }

  if (conversationId === 'mock-chat-direct-alice') {
    return [
      {
        id: 'msg-alice-1',
        conversationId,
        senderId: 'mock-user-456',
        senderName: 'Alice Smith',
        senderAvatarUrl: null,
        text: 'Hi! Let me know when you are free to discuss the project specification.',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        attachment: null,
      }
    ];
  }

  if (conversationId === 'mock-chat-direct-bob') {
    return [
      {
        id: 'msg-bob-1',
        conversationId,
        senderId: 'mock-user-789',
        senderName: 'Bob Johnson',
        senderAvatarUrl: null,
        text: 'I just completed the database design draft.',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        attachment: null,
      }
    ];
  }

  return [];
};

export const useMessages = (conversationId: string | null | undefined) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    if (isMock) {
      setLoading(true);
      const loadMockMessages = () => {
        const key = MOCK_MESSAGES_PREFIX + conversationId;
        const stored = localStorage.getItem(key);
        let list: Message[] = [];

        if (stored) {
          try {
            list = JSON.parse(stored);
          } catch {
            list = getInitialMockMessages(conversationId);
          }
        } else {
          list = getInitialMockMessages(conversationId);
          localStorage.setItem(key, JSON.stringify(list));
        }

        // Sort ascending
        const getMs = (val: any) => {
          if (!val) return 0;
          if (typeof val === 'string') return new Date(val).getTime();
          if (typeof val === 'object' && 'seconds' in val) {
            return val.seconds * 1000;
          }
          return new Date(val).getTime();
        };
        list.sort((a, b) => getMs(a.createdAt) - getMs(b.createdAt));
        setMessages(list);
        setLoading(false);
      };

      loadMockMessages();

      const handleUpdate = () => {
        loadMockMessages();
      };

      window.addEventListener('nexus_mock_messages_changed', handleUpdate);
      return () => {
        window.removeEventListener('nexus_mock_messages_changed', handleUpdate);
      };
    }

    setLoading(true);
    const unsubscribe = messageService.onMessagesSnapshot(
      conversationId,
      (list) => {
        setMessages(list);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId, isMock]);

  const sendMessage = async (
    text: string,
    attachment?: LiveObjectAttachment | null
  ): Promise<string> => {
    if (!conversationId) throw new Error('No active conversation');
    if (!user?.uid) throw new Error('User must be authenticated');

    const cleanText = text.trim();
    if (!cleanText && !attachment) {
      throw new Error('Message text or attachment is required');
    }

    const senderInfo = {
      id: user.uid,
      name: user.displayName || user.username || 'Nexus User',
      avatarUrl: user.avatarUrl || null,
    };

    if (isMock) {
      const key = MOCK_MESSAGES_PREFIX + conversationId;
      const stored = localStorage.getItem(key);
      const list: Message[] = stored ? JSON.parse(stored) : getInitialMockMessages(conversationId);

      const newId = 'msg-' + Math.random().toString(36).substring(2, 9);
      const newMessage: Message = {
        id: newId,
        conversationId,
        senderId: senderInfo.id,
        senderName: senderInfo.name,
        senderAvatarUrl: senderInfo.avatarUrl,
        text: cleanText,
        createdAt: new Date().toISOString(),
        attachment: attachment || null,
      };

      const updatedList = [...list, newMessage];
      localStorage.setItem(key, JSON.stringify(updatedList));

      // Also update parent conversation's last message in conversations list
      const storedConvs = localStorage.getItem(MOCK_CONVERSATIONS_KEY);
      if (storedConvs) {
        const convList = JSON.parse(storedConvs);
        const updatedConvs = convList.map((c: any) => {
          if (c.id === conversationId) {
            return {
              ...c,
              updatedAt: new Date().toISOString(),
              lastMessage: {
                text: cleanText || `Shared a ${attachment?.type}`,
                senderId: senderInfo.id,
                senderName: senderInfo.name,
                createdAt: new Date().toISOString(),
              }
            };
          }
          return c;
        });
        localStorage.setItem(MOCK_CONVERSATIONS_KEY, JSON.stringify(updatedConvs));
      }

      window.dispatchEvent(new Event('nexus_mock_messages_changed'));
      return newId;
    }

    return await messageService.sendMessage(conversationId, senderInfo, cleanText, attachment);
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
};
