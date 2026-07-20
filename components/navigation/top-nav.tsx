'use client';

import * as React from 'react';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Folder,
  CheckSquare,
  FileText,
  Calendar as CalendarIcon,
  MessageSquare,
  Building,
  Check,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { useSearch } from '@/hooks/use-search';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

function formatRelativeTime(
  dateInput: string | Date | { seconds: number } | null | undefined
): string {
  if (!dateInput) return '';
  try {
    const date = new Date(
      typeof dateInput === 'object' && dateInput !== null && 'seconds' in dateInput
        ? (dateInput as { seconds: number }).seconds * 1000
        : (dateInput as string | Date)
    );
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSecs < 10) return 'Just now';
    if (diffInSecs < 60) return `${diffInSecs}s ago`;
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function TopNav() {
  const router = useRouter();
  const { logout } = useAuth();
  const { profile } = useProfile();
  const toast = useToast();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [notifOpen, setNotifOpen] = React.useState(false);

  // Notifications custom sync hook
  const {
    workspaceNotifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    deleteRead,
  } = useNotifications();

  // Unified global debounced search hook
  const { results, isLoading, activeWorkspace } = useSearch(searchQuery);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelectResult = (link: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(link);
  };

  const handleNotificationClick = async (notifId: string, link: string) => {
    setNotifOpen(false);
    await markRead(notifId, true);
    router.push(link);
  };

  const handleMarkAllAsRead = async () => {
    await markAllRead();
    toast.success('Notifications updated', 'All workspace notifications have been marked as read.');
  };

  const handleClearRead = async () => {
    await deleteRead();
    toast.info('Notification cleanup', 'Cleared all read notifications.');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <CheckSquare className="h-4 w-4 text-emerald-500" />;
      case 'workspace_invited':
        return <Building className="h-4 w-4 text-blue-500" />;
      case 'project_added':
        return <Folder className="h-4 w-4 text-indigo-500" />;
      case 'mention':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background/95 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold hidden md:inline-block text-muted-foreground">Workspace:</span>
          <span className="text-sm font-semibold text-foreground">
            {activeWorkspace?.name || 'Nexus General'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Button */}
        <Button
          variant="outline"
          className="relative h-9 w-9 p-0 xl:h-9 xl:w-64 xl:justify-start xl:px-3 xl:py-2 bg-muted/20 hover:bg-muted/40 transition-colors rounded-xl"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4 text-muted-foreground xl:mr-2" />
          <span className="hidden xl:inline-flex text-muted-foreground text-sm">
            Search projects, tasks, notes...
          </span>
          <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded-lg border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Global Search Dialog */}
        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} shouldFilter={false}>
          <CommandInput
            placeholder="Type a query to search globally..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[400px] overflow-y-auto">
            {searchQuery.trim() === '' ? (
              <CommandGroup heading="Quick Suggestions">
                <CommandItem onSelect={() => handleSelectResult('/projects')}>
                  <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Go to Projects overview</span>
                </CommandItem>
                <CommandItem onSelect={() => handleSelectResult('/dashboard/tasks')}>
                  <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Manage tasks dashboard</span>
                </CommandItem>
                <CommandItem onSelect={() => handleSelectResult('/dashboard/notes')}>
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Access dynamic workspace notes</span>
                </CommandItem>
              </CommandGroup>
            ) : isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching documents and resources...
              </div>
            ) : !results.hasResults ? (
              <CommandEmpty>No workspace matching results found.</CommandEmpty>
            ) : (
              <>
                {/* Categorized Projects results */}
                {results.projects.length > 0 && (
                  <CommandGroup heading={`Projects (${results.projects.length})`}>
                    {results.projects.map((p) => (
                      <CommandItem
                        key={p.id}
                        onSelect={() => handleSelectResult(`/projects/${p.id}`)}
                      >
                        <Folder className="mr-2 h-4 w-4 text-indigo-500" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{p.title}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-md">
                            {p.description}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Categorized Tasks results */}
                {results.tasks.length > 0 && (
                  <CommandGroup heading={`Tasks (${results.tasks.length})`}>
                    {results.tasks.map((t) => (
                      <CommandItem
                        key={t.id}
                        onSelect={() => handleSelectResult('/dashboard/tasks')}
                      >
                        <CheckSquare className="mr-2 h-4 w-4 text-emerald-500" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{t.title}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-md">
                            {t.description || 'No description provided'}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Categorized Notes results */}
                {results.notes.length > 0 && (
                  <CommandGroup heading={`Notes (${results.notes.length})`}>
                    {results.notes.map((n) => (
                      <CommandItem
                        key={n.id}
                        onSelect={() => handleSelectResult(`/dashboard/notes`)}
                      >
                        <FileText className="mr-2 h-4 w-4 text-amber-500" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{n.title}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-md">
                            {n.excerpt || 'No excerpt'}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Categorized Calendar events results */}
                {results.calendar.length > 0 && (
                  <CommandGroup heading={`Calendar Events (${results.calendar.length})`}>
                    {results.calendar.map((evt) => (
                      <CommandItem
                        key={evt.id}
                        onSelect={() => handleSelectResult('/dashboard/calendar')}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-rose-500" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{evt.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {evt.description || 'Workspace event'}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Categorized Conversations results */}
                {results.conversations.length > 0 && (
                  <CommandGroup heading={`Messages & Chats (${results.conversations.length})`}>
                    {results.conversations.map((c) => (
                      <CommandItem
                        key={c.id}
                        onSelect={() => handleSelectResult('/dashboard/messages')}
                      >
                        <MessageSquare className="mr-2 h-4 w-4 text-teal-500" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {c.name || 'Direct Conversation'}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-md">
                            {c.lastMessage?.text || 'No message history'}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Categorized Workspaces results */}
                {results.workspaces.length > 0 && (
                  <CommandGroup heading={`Workspaces (${results.workspaces.length})`}>
                    {results.workspaces.map((w) => (
                      <CommandItem
                        key={w.id}
                        onSelect={() => handleSelectResult('/dashboard/workspace')}
                      >
                        <Building className="mr-2 h-4 w-4 text-blue-500" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{w.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-md">
                            {w.description || 'Collaboration workspace'}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </CommandDialog>

        {/* Firestore-backed Notification Center */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-xl hover:bg-muted/50 transition-colors"
              aria-label={`Open notifications center, ${unreadCount} unread`}
            >
              <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-2xl shadow-xl border border-border" align="end">
            <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/10">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMarkAllAsRead}
                    title="Mark all as read"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                {workspaceNotifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearRead}
                    title="Clear read notifications"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto py-1">
              {workspaceNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 opacity-20 mb-2" />
                  <p className="text-xs font-medium">All caught up!</p>
                  <p className="text-[10px] opacity-80">No workspace notifications to display.</p>
                </div>
              ) : (
                workspaceNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'group relative flex gap-3 items-start p-3 text-xs border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer',
                      !n.read && 'bg-primary/5 font-medium'
                    )}
                    onClick={() => handleNotificationClick(n.id, n.link)}
                  >
                    <div className="mt-0.5 rounded-full p-1 bg-muted shrink-0">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-semibold text-foreground text-[11px]">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-normal">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-[10px] line-clamp-2">
                        {n.body}
                      </p>
                    </div>

                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {!n.read && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await markRead(n.id, true);
                          }}
                          className="p-1 rounded-md bg-background border hover:bg-muted text-muted-foreground"
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteNotification(n.id);
                        }}
                        className="p-1 rounded-md bg-background border hover:bg-muted text-destructive"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Account Settings Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-9 w-9 rounded-full focus:ring-2 focus:ring-ring">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatarUrl || ''} alt={profile?.displayName || 'User'} />
                  <AvatarFallback className="font-semibold">
                    {profile?.displayName?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent className="w-56 rounded-2xl p-1.5 shadow-xl" align="end">
            <DropdownMenuLabel className="font-normal px-2.5 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-foreground leading-none">
                  {profile?.displayName || profile?.username}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/dashboard/settings')}>
              <User className="mr-2.5 h-4 w-4 text-muted-foreground" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2.5 h-4 w-4 text-muted-foreground" />
              <span>Account Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout()} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2.5 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
