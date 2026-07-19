'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, LiveObjectAttachment } from '@/types/message';
import { WorkspaceMember } from '@/types/workspace';
import { useMessages } from '@/hooks/use-messages';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AttachmentSelector } from './attachment-selector';
import { LiveObjectCard } from './live-object-card';
import { Loader2, Send, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  activeConversation: Conversation | null;
  membersMap: Record<string, WorkspaceMember>;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  activeConversation,
  membersMap,
}) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(activeConversation?.id);

  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<LiveObjectAttachment | null>(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10 h-full">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MessageSquare className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Select a discussion</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Select a direct chat with a workspace colleague, or jump into a shared channel to start collaborating.
        </p>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText && !attachment) return;

    setSending(true);
    try {
      await sendMessage(cleanText, attachment);
      setText('');
      setAttachment(null);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const getHeaderDetails = () => {
    if (activeConversation.type === 'direct') {
      const otherId = activeConversation.memberIds.find((id) => id !== user?.uid);
      const member = otherId ? membersMap[otherId] : null;
      return {
        title: member?.displayName || member?.username || 'Workspace Colleague',
        subtitle: member ? `@${member.username}` : 'Direct Message',
        avatarFallback: (member?.displayName || member?.username || 'C').charAt(0).toUpperCase(),
        description: member?.email || 'Collaboration thread',
      };
    } else {
      return {
        title: `# ${activeConversation.name}`,
        subtitle: `${activeConversation.memberIds.length} members`,
        avatarFallback: '#',
        description: activeConversation.description || 'Workspace discussion channel',
      };
    }
  };

  const { title, avatarFallback, description } = getHeaderDetails();

  const formatMessageTime = (createdAt: unknown) => {
    if (!createdAt) return '';
    let date: Date;
    if (typeof createdAt === 'string') {
      date = new Date(createdAt);
    } else if (createdAt && typeof createdAt === 'object' && 'seconds' in createdAt) {
      date = new Date((createdAt as { seconds: number }).seconds * 1000);
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else {
      date = new Date();
    }

    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-card/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
            {avatarFallback}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs">Loading message stream...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 text-muted-foreground">
            <p className="text-xs font-semibold mb-1">No messages yet</p>
            <p className="text-[11px] max-w-xs">Be the first to say hello, or share a live attachment like a task or note!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            const fallbackChar = (msg.senderName || 'U').charAt(0).toUpperCase();

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[80%] items-start animate-fade-in",
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {!isMe && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs shrink-0 mt-0.5">
                    {fallbackChar}
                  </div>
                )}
                <div className="flex flex-col">
                  {/* Sender Info (Only if not me) */}
                  {!isMe && (
                    <span className="text-[11px] font-semibold text-muted-foreground mb-0.5 ml-1">
                      {msg.senderName}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                        : "bg-muted text-foreground rounded-tl-none border shadow-xs"
                    )}
                  >
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    {/* Render attachment if exists */}
                    {msg.attachment && (
                      <div className="mt-1">
                        <LiveObjectCard attachment={msg.attachment} />
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span
                    className={cn(
                      "text-[9px] text-muted-foreground mt-1 mx-1.5",
                      isMe ? "text-right" : "text-left"
                    )}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t bg-card/10 shrink-0">
        {/* Render Pending Attachment */}
        {attachment && (
          <div className="flex items-center justify-between gap-4 p-2 bg-accent/60 border rounded-lg mb-3 animate-slide-up">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold capitalize bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 shrink-0">
                {attachment.type}
              </span>
              <span className="text-xs font-medium truncate text-foreground">
                {attachment.title}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
              onClick={() => setAttachment(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Paperclip Attachment Selector */}
          <AttachmentSelector onSelect={(item) => setAttachment(item)} />

          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your message..."
            className="flex-1 rounded-full px-4 h-9 border-muted bg-background focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
            disabled={sending}
          />

          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 rounded-full shrink-0"
            disabled={sending || (!text.trim() && !attachment)}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
