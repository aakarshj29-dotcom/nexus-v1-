'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useConversations } from '@/hooks/use-conversations';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { getWorkspaceMembers } from '@/firebase/workspace-service';
import { WorkspaceMember } from '@/types/workspace';
import { MessageSquare, ArrowRight, MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Conversation } from '@/types/message';
import { cn } from '@/lib/utils';

export const RecentChatsWidget: React.FC = () => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspaces();
  const { conversations, loading: loadingConversations } = useConversations();
  const [membersMap, setMembersMap] = useState<Record<string, WorkspaceMember>>({});
  const [loadingMembers, setLoadingMembers] = useState(false);

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
        console.error('Error fetching workspace members for widget:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [activeWorkspace?.id, isMock]);

  const getConversationTitle = (conv: Conversation) => {
    if (conv.type === 'direct') {
      const otherId = conv.memberIds.find((id) => id !== user?.uid);
      const member = otherId ? membersMap[otherId] : null;
      return member?.displayName || member?.username || 'Workspace Colleague';
    }
    return `# ${conv.name}`;
  };

  const recentThreads = conversations.slice(0, 4);
  const loading = loadingConversations || loadingMembers;

  return (
    <Card className="col-span-1 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 shrink-0">
        <div className="space-y-1">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-primary" />
            Recent Chats
          </CardTitle>
          <CardDescription className="text-xs">
            Stay in touch with your team
          </CardDescription>
        </div>
        <Link
          href="/dashboard/messages"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            "h-8 w-8 text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-center animate-pulse">
                <div className="h-8 w-8 bg-muted rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3.5 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recentThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-[180px] text-muted-foreground p-4">
            <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs font-semibold">No discussions yet</p>
            <p className="text-[10px] mt-0.5 max-w-[200px]">
              Start a conversation with a teammate or create a workspace channel.
            </p>
            <Link
              href="/dashboard/messages"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                "mt-3 text-[10px] h-7 px-2.5 rounded-full"
              )}
            >
              Open Chat
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentThreads.map((conv) => {
              const title = getConversationTitle(conv);
              const isDirect = conv.type === 'direct';

              return (
                <Link
                  key={conv.id}
                  href="/dashboard/messages"
                  className="flex gap-3 items-center p-2 rounded-lg hover:bg-accent/40 transition-colors border border-transparent hover:border-border/30"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                    {isDirect ? title.charAt(0).toUpperCase() : '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-foreground">
                      {title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {conv.lastMessage
                        ? `${conv.lastMessage.senderId === user?.uid ? 'You: ' : ''}${conv.lastMessage.text}`
                        : 'No messages yet'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
