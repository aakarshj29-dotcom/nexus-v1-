'use client';

import React, { useState } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useNotes } from '@/hooks/use-notes';
import { useCalendar } from '@/hooks/use-calendar';
import { Paperclip, FolderKanban, Users, FileText, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentSelectorProps {
  onSelect: (attachment: {
    type: 'project' | 'task' | 'note' | 'event';
    id: string;
    title: string;
    statusOrDate?: string;
  }) => void;
}

type TabType = 'project' | 'task' | 'note' | 'event';

export const AttachmentSelector: React.FC<AttachmentSelectorProps> = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('project');

  // Load resources
  const { projects, loading: loadingProjects } = useProjects();
  const { tasks, loading: loadingTasks } = useTasks();
  const { notes, loading: loadingNotes } = useNotes();
  const { unifiedItems, loading: loadingEvents } = useCalendar();

  const handleSelectItem = (
    type: TabType,
    id: string,
    title: string,
    statusOrDate?: string
  ) => {
    onSelect({ type, id, title, statusOrDate });
    setOpen(false);
  };

  const activeNotes = notes.filter((n) => !n.deleted);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach Item</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0 overflow-hidden">
        {/* Tab Buttons */}
        <div className="grid grid-cols-4 border-b bg-muted/50 p-1 text-center">
          {(['project', 'task', 'note', 'event'] as TabType[]).map((tab) => {
            const label = tab.charAt(0).toUpperCase() + tab.slice(1);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                className={cn(
                  "py-1.5 text-xs font-semibold rounded transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab(tab)}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content Lists */}
        <div className="max-h-[250px] overflow-y-auto p-2">
          {activeTab === 'project' && (
            <div className="space-y-1">
              {loadingProjects ? (
                <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Loading Projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center p-4 text-xs text-muted-foreground">No active projects</div>
              ) : (
                projects.map((proj) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => handleSelectItem('project', proj.id, proj.title, proj.status)}
                    className="w-full text-left p-2 rounded hover:bg-accent/50 transition-colors flex items-center gap-2"
                  >
                    <FolderKanban className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="text-xs font-medium truncate flex-1">{proj.title}</span>
                    <span className="text-[10px] text-muted-foreground capitalize shrink-0">{proj.status}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'task' && (
            <div className="space-y-1">
              {loadingTasks ? (
                <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Loading Tasks...
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center p-4 text-xs text-muted-foreground">No tasks found</div>
              ) : (
                tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleSelectItem('task', task.id, task.title, task.status)}
                    className="w-full text-left p-2 rounded hover:bg-accent/50 transition-colors flex items-center gap-2"
                  >
                    <Users className="h-4 w-4 text-sky-500 shrink-0" />
                    <span className="text-xs font-medium truncate flex-1">{task.title}</span>
                    <span className="text-[10px] text-muted-foreground capitalize shrink-0">{task.status}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'note' && (
            <div className="space-y-1">
              {loadingNotes ? (
                <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Loading Notes...
                </div>
              ) : activeNotes.length === 0 ? (
                <div className="text-center p-4 text-xs text-muted-foreground">No notes found</div>
              ) : (
                activeNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => handleSelectItem('note', note.id, note.title, note.tags?.join(', '))}
                    className="w-full text-left p-2 rounded hover:bg-accent/50 transition-colors flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium truncate flex-1">{note.title}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'event' && (
            <div className="space-y-1">
              {loadingEvents ? (
                <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Loading Events...
                </div>
              ) : unifiedItems.length === 0 ? (
                <div className="text-center p-4 text-xs text-muted-foreground">No events found</div>
              ) : (
                unifiedItems.map((evt) => {
                  const dateStr = evt.startTime
                    ? new Date(evt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : '';
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => handleSelectItem('event', evt.originalId || evt.id, evt.title, dateStr)}
                      className="w-full text-left p-2 rounded hover:bg-accent/50 transition-colors flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-medium truncate flex-1">{evt.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{dateStr}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
