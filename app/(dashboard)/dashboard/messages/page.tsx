'use client';

import React, { useState, useEffect } from 'react';
import { useConversations } from '@/hooks/use-conversations';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { getWorkspaceMembers } from '@/firebase/workspace-service';
import { WorkspaceMember } from '@/types/workspace';
import { ConversationList } from '@/components/messages/conversation-list';
import { ChatWindow } from '@/components/messages/chat-window';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Conversation } from '@/types/message';

export default function MessagesPage() {
  const { activeWorkspace } = useWorkspaces();
  const {
    conversations,
    activeConversation,
    loading: conversationsLoading,
    error,
    setActiveConversation,
    createConversation,
  } = useConversations();

  const [membersMap, setMembersMap] = useState<Record<string, WorkspaceMember>>({});
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const isMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  useEffect(() => {
    if (!activeWorkspace?.id) return;

    if (isMock) {
      setMembersMap({
        'mock-user-456': {
          uid: 'mock-user-456',
          email: 'alice@nexus.com',
          displayName: 'Alice Smith',
          username: 'alice_smith',
          avatarUrl: null,
          role: 'admin',
        },
        'mock-user-789': {
          uid: 'mock-user-789',
          email: 'bob@nexus.com',
          displayName: 'Bob Johnson',
          username: 'bob_johnson',
          avatarUrl: null,
          role: 'member',
        },
      });
      return;
    }

    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const list = await getWorkspaceMembers(activeWorkspace.id);
        const map: Record<string, WorkspaceMember> = {};
        list.forEach((m) => {
          map[m.uid] = m;
        });
        setMembersMap(map);
      } catch (err) {
        console.error('Error fetching workspace members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [activeWorkspace?.id, isMock]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setShowMobileDetail(true);
  };

  const handleCreateConversation = async (
    type: 'direct' | 'workspace',
    memberIds: string[],
    name?: string,
    description?: string
  ): Promise<string> => {
    return await createConversation(type, memberIds, name, description);
  };

  if (error) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading messages</AlertTitle>
          <AlertDescription>
            {error.message || 'There was an issue loading your discussions. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pageLoading = conversationsLoading || loadingMembers;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Conversation Sidebar Panel */}
      <div
        className={`h-full border-r md:w-[320px] shrink-0 ${
          showMobileDetail ? 'hidden md:block' : 'w-full md:block'
        }`}
      >
        {pageLoading && conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs">Syncing discussions...</p>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={handleSelectConversation}
            membersMap={membersMap}
            onCreateConversation={handleCreateConversation}
          />
        )}
      </div>

      {/* Main Chat Stream Area */}
      <div className={`flex-1 h-full flex flex-col ${!showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
        {showMobileDetail && (
          <div className="flex items-center gap-2 border-b px-4 py-2 md:hidden bg-background shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileDetail(false)}
              className="gap-1.5 pl-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to discussions
            </Button>
          </div>
        )}

        <ChatWindow
          activeConversation={activeConversation}
          membersMap={membersMap}
        />
      </div>
    </div>
  );
}
