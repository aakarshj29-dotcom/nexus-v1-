'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useAuth } from '@/hooks/use-auth';
import { getWorkspaceMembers } from '@/firebase/workspace-service';
import { WorkspaceMember } from '@/types/workspace';
import { MessageSquare, Hash, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (type: 'direct' | 'workspace', memberIds: string[], name?: string, description?: string) => Promise<string>;
  onSelectConversation: (id: string) => void;
}

export const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  open,
  onOpenChange,
  onCreate,
  onSelectConversation,
}) => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspaces();
  const [tab, setTab] = useState<'direct' | 'workspace'>('direct');

  // Workspace members state
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [channelName, setChannelName] = useState<string>('');
  const [channelDesc, setChannelDesc] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  useEffect(() => {
    if (!open || !activeWorkspace?.id) return;

    setError(null);
    setSelectedMemberId('');
    setChannelName('');
    setChannelDesc('');

    if (isMock) {
      setMembers([
        {
          uid: 'mock-user-456',
          email: 'alice@nexus.com',
          displayName: 'Alice Smith',
          username: 'alice_smith',
          avatarUrl: null,
          role: 'admin',
        },
        {
          uid: 'mock-user-789',
          email: 'bob@nexus.com',
          displayName: 'Bob Johnson',
          username: 'bob_johnson',
          avatarUrl: null,
          role: 'member',
        },
      ]);
      return;
    }

    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const list = await getWorkspaceMembers(activeWorkspace.id);
        // Exclude the current user from the list for DMs
        const filtered = list.filter((m) => m.uid !== user?.uid);
        setMembers(filtered);
      } catch (err) {
        console.error('Error loading workspace members:', err);
        setError('Failed to load workspace members.');
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [open, activeWorkspace?.id, user?.uid, isMock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace?.id) return;
    setError(null);
    setSubmitting(true);

    try {
      let conversationId = '';
      if (tab === 'direct') {
        if (!selectedMemberId) {
          throw new Error('Please select a member to message.');
        }
        conversationId = await onCreate('direct', [selectedMemberId]);
      } else {
        const nameClean = channelName.trim().toLowerCase().replace(/\s+/g, '-');
        if (!nameClean) {
          throw new Error('Please enter a channel name.');
        }
        // Let's create a workspace conversation with all current workspace members
        const allMemberIds = members.map((m) => m.uid);
        if (user?.uid) {
          allMemberIds.push(user.uid);
        }
        conversationId = await onCreate('workspace', allMemberIds, nameClean, channelDesc.trim());
      }

      onOpenChange(false);
      onSelectConversation(conversationId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">New Chat</DialogTitle>
          <DialogDescription>
            Start a direct message or create a new workspace channel.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-2 border-b pb-4">
          <Button
            type="button"
            variant={tab === 'direct' ? 'default' : 'outline'}
            className="flex items-center gap-2 justify-center"
            onClick={() => {
              setTab('direct');
              setError(null);
            }}
          >
            <MessageSquare className="h-4 w-4" />
            Direct Message
          </Button>
          <Button
            type="button"
            variant={tab === 'workspace' ? 'default' : 'outline'}
            className="flex items-center gap-2 justify-center"
            onClick={() => {
              setTab('workspace');
              setError(null);
            }}
          >
            <Hash className="h-4 w-4" />
            Workspace Channel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {tab === 'direct' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select a Workspace Member</label>
              {loadingMembers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No other members found in this workspace.
                </div>
              ) : (
                <div className="max-h-[200px] overflow-y-auto border rounded-md divide-y">
                  {members.map((member) => (
                    <button
                      key={member.uid}
                      type="button"
                      onClick={() => setSelectedMemberId(member.uid)}
                      className={cn(
                        "w-full text-left p-3 flex items-center gap-3 transition-colors hover:bg-accent/50",
                        selectedMemberId === member.uid && "bg-accent"
                      )}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {(member.displayName || member.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.displayName || member.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{member.username || 'user'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Channel Name</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. marketing-team"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Channel names must be lowercase, alphanumeric, and can contain hyphens.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  placeholder="What is this channel about?"
                  value={channelDesc}
                  onChange={(e) => setChannelDesc(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={submitting || (tab === 'direct' && !selectedMemberId) || (tab === 'workspace' && !channelName)}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : tab === 'direct' ? (
                'Start Chat'
              ) : (
                'Create Channel'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
