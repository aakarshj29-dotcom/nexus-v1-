'use client';

import React, { useState } from 'react';
import { Conversation } from '@/types/message';
import { WorkspaceMember } from '@/types/workspace';
import { Button } from '@/components/ui/button';
import { MessageSquare, Hash, Plus, MessageCircle } from 'lucide-react';
import { NewConversationDialog } from './new-conversation-dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  membersMap: Record<string, WorkspaceMember>;
  onCreateConversation: (type: 'direct' | 'workspace', memberIds: string[], name?: string, description?: string) => Promise<string>;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
  membersMap,
  onCreateConversation,
}) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('create') === 'true') {
        setDialogOpen(true);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const getConversationDetails = (conv: Conversation) => {
    if (conv.type === 'direct') {
      const otherId = conv.memberIds.find((id) => id !== user?.uid);
      const member = otherId ? membersMap[otherId] : null;
      return {
        title: member?.displayName || member?.username || 'Workspace Colleague',
        subtitle: member ? `@${member.username}` : 'Direct Message',
        icon: MessageSquare,
        avatarFallback: (member?.displayName || member?.username || 'C').charAt(0).toUpperCase(),
        avatarUrl: member?.avatarUrl,
      };
    } else {
      return {
        title: `# ${conv.name}`,
        subtitle: conv.description || 'Workspace Channel',
        icon: Hash,
        avatarFallback: '#',
        avatarUrl: null,
      };
    }
  };

  const formatTime = (timestamp: unknown) => {
    if (!timestamp) return '';
    let date: Date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      date = new Date((timestamp as { seconds: number }).seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date();
    }

    if (isNaN(date.getTime())) return '';

    // If today, show time, else show date
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full border-r bg-card/40">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-sm tracking-tight text-foreground">Discussions</h2>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          title="New Conversation"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-[200px]">
            <p className="text-xs">No active discussions yet.</p>
            <Button
              onClick={() => setDialogOpen(true)}
              variant="link"
              className="mt-2 text-xs text-primary"
            >
              Start the first one!
            </Button>
          </div>
        ) : (
          conversations.map((conv) => {
            const { title, subtitle, avatarFallback } = getConversationDetails(conv);
            const isActive = activeConversation?.id === conv.id;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={cn(
                  "w-full text-left p-3.5 transition-colors flex gap-3 hover:bg-accent/40 items-start",
                  isActive && "bg-accent/80 border-l-2 border-primary"
                )}
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                  {avatarFallback}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={cn("text-xs font-semibold truncate text-foreground", isActive && "text-primary")}>
                      {title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate leading-relaxed">
                    {conv.lastMessage
                      ? `${conv.lastMessage.senderId === user?.uid ? 'You: ' : ''}${conv.lastMessage.text}`
                      : subtitle}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <NewConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={onCreateConversation}
        onSelectConversation={(id) => {
          const found = conversations.find((c) => c.id === id);
          if (found) {
            onSelectConversation(found);
          } else {
            // Wait brief moment or let the snapshots handle the creation update
            window.dispatchEvent(new Event('nexus_mock_messages_changed'));
          }
        }}
      />
    </div>
  );
};
