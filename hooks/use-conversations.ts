'use client';

import { useState, useEffect } from 'react';
import { Conversation, ConversationType } from '@/types/message';
import { useAuth } from './use-auth';
import { useWorkspaces } from './use-workspaces';
import { conversationService } from '@/firebase/conversation-service';

const MOCK_CONVERSATIONS_KEY = 'nexus_mock_conversations';

const getInitialMockConversations = (workspaceId: string, currentUserId: string): Conversation[] => {
  return [
    {
      id: 'mock-chat-general',
      type: 'workspace',
      workspaceId: workspaceId,
      name: 'general',
      description: 'Workspace-wide communication and announcements.',
      memberIds: [currentUserId, 'mock-user-456', 'mock-user-789'],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      lastMessage: {
        text: 'Welcome to the general workspace channel! Keep here for announcements.',
        senderId: 'mock-user-456',
        senderName: 'Alice Smith',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    },
    {
      id: 'mock-chat-direct-alice',
      type: 'direct',
      workspaceId: workspaceId,
      name: '',
      description: '',
      memberIds: [currentUserId, 'mock-user-456'],
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      lastMessage: {
        text: 'Hi! Let me know when you are free to discuss the project specification.',
        senderId: 'mock-user-456',
        senderName: 'Alice Smith',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      }
    },
    {
      id: 'mock-chat-direct-bob',
      type: 'direct',
      workspaceId: workspaceId,
      name: '',
      description: '',
      memberIds: [currentUserId, 'mock-user-789'],
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      lastMessage: {
        text: 'I just completed the database design draft.',
        senderId: 'mock-user-789',
        senderName: 'Bob Johnson',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      }
    }
  ];
};

export const useConversations = () => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspaces();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  useEffect(() => {
    if (!user?.uid || !activeWorkspace?.id) {
      setConversations([]);
      setActiveConversation(null);
      setLoading(false);
      return;
    }

    if (isMock) {
      const loadMockConversations = () => {
        const stored = localStorage.getItem(MOCK_CONVERSATIONS_KEY);
        let list: Conversation[] = [];
        if (stored) {
          try {
            list = JSON.parse(stored);
          } catch {
            list = getInitialMockConversations(activeWorkspace.id, user.uid);
          }
        } else {
          list = getInitialMockConversations(activeWorkspace.id, user.uid);
          localStorage.setItem(MOCK_CONVERSATIONS_KEY, JSON.stringify(list));
        }

        // Filter for active workspace
        const filtered = list.filter((c) => c.workspaceId === activeWorkspace.id);

        // Sort by last active timestamp (descending)
        const getMs = (val: any) => {
          if (!val) return 0;
          return new Date(val).getTime();
        };

        filtered.sort((a, b) => {
          const timeA = getMs(a.updatedAt) || getMs(a.createdAt);
          const timeB = getMs(b.updatedAt) || getMs(b.createdAt);
          return timeB - timeA;
        });

        setConversations(filtered);
        setLoading(false);
      };

      loadMockConversations();

      const handleUpdate = () => {
        loadMockConversations();
      };

      window.addEventListener('nexus_mock_messages_changed', handleUpdate);
      return () => {
        window.removeEventListener('nexus_mock_messages_changed', handleUpdate);
      };
    }

    setLoading(true);
    const unsubscribe = conversationService.onConversationsSnapshot(
      activeWorkspace.id,
      (list) => {
        // Sort by last active timestamp (descending)
        const getMs = (val: any) => {
          if (!val) return 0;
          if (typeof val === 'string') return new Date(val).getTime();
          if (typeof val === 'object' && 'seconds' in val) {
            return val.seconds * 1000;
          }
          return new Date(val).getTime();
        };

        const sorted = [...list].sort((a, b) => {
          const timeA = getMs(a.updatedAt) || getMs(a.createdAt);
          const timeB = getMs(b.updatedAt) || getMs(b.createdAt);
          return timeB - timeA;
        });

        setConversations(sorted);

        // Keep active conversation reference current
        if (activeConversation) {
          const currentActive = sorted.find((c) => c.id === activeConversation.id);
          if (currentActive) {
            setActiveConversation(currentActive);
          }
        }

        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, activeWorkspace?.id, isMock]);

  const createConversation = async (
    type: ConversationType,
    memberIds: string[],
    name?: string,
    description?: string
  ): Promise<string> => {
    if (!user?.uid || !activeWorkspace?.id) throw new Error('Unauthenticated or workspace missing');

    const participants = Array.from(new Set([user.uid, ...memberIds]));

    if (isMock) {
      const stored = localStorage.getItem(MOCK_CONVERSATIONS_KEY);
      const list: Conversation[] = stored ? JSON.parse(stored) : [];

      // If DM, check duplicate
      if (type === 'direct' && participants.length === 2) {
        const [a, b] = participants;
        const existing = list.find(
          (c) =>
            c.type === 'direct' &&
            c.workspaceId === activeWorkspace.id &&
            c.memberIds.includes(a) &&
            c.memberIds.includes(b)
        );
        if (existing) {
          return existing.id;
        }
      }

      const newId = 'mock-chat-' + Math.random().toString(36).substring(2, 9);
      const newConversation: Conversation = {
        id: newId,
        type,
        workspaceId: activeWorkspace.id,
        name: name || '',
        description: description || '',
        memberIds: participants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessage: null,
      };

      const updatedList = [newConversation, ...list];
      localStorage.setItem(MOCK_CONVERSATIONS_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new Event('nexus_mock_messages_changed'));
      return newId;
    }

    return await conversationService.createConversation(
      activeWorkspace.id,
      type,
      participants,
      name,
      description
    );
  };

  return {
    conversations,
    activeConversation,
    loading,
    error,
    setActiveConversation,
    createConversation,
  };
};
