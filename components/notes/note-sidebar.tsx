'use client';

import React from 'react';
import { Search, Folder, Pin, Heart, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Note } from '@/types/note';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export type NoteFilterType = 'all' | 'pinned' | 'favorites' | 'trash';

interface NoteSidebarProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  activeFilter: NoteFilterType;
  setActiveFilter: (filter: NoteFilterType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function NoteSidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
}: NoteSidebarProps) {
  // Client side filters
  const filteredNotes = React.useMemo(() => {
    return notes.filter((note) => {
      // Filter by category
      if (activeFilter === 'pinned' && (!note.pinned || note.deleted)) return false;
      if (activeFilter === 'favorites' && (!note.favorite || note.deleted)) return false;
      if (activeFilter === 'trash' && !note.deleted) return false;
      if (activeFilter === 'all' && note.deleted) return false;

      // Filter by search query (title or content)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesExcerpt = note.excerpt.toLowerCase().includes(query);
        const matchesTags = note.tags?.some((tag) => tag.toLowerCase().includes(query));
        return matchesTitle || matchesContent || matchesExcerpt || matchesTags;
      }

      return true;
    });
  }, [notes, activeFilter, searchQuery]);

  return (
    <div className="flex h-full w-full flex-col border-r bg-background md:w-80 lg:w-96">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold tracking-tight">My Notes</h2>
        <Button onClick={onCreateNote} size="sm" className="gap-1.5">
          <Edit className="h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Filter Toggles & Search */}
      <div className="flex flex-col gap-2 p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="grid grid-cols-4 gap-1 pt-1">
          <Button
            variant={activeFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="text-xs px-2 h-8 flex flex-col justify-center items-center"
          >
            <Folder className="h-4 w-4 mb-0.5" />
            <span>All</span>
          </Button>
          <Button
            variant={activeFilter === 'pinned' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('pinned')}
            className="text-xs px-2 h-8 flex flex-col justify-center items-center"
          >
            <Pin className="h-4 w-4 mb-0.5" />
            <span>Pinned</span>
          </Button>
          <Button
            variant={activeFilter === 'favorites' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('favorites')}
            className="text-xs px-2 h-8 flex flex-col justify-center items-center"
          >
            <Heart className="h-4 w-4 mb-0.5" />
            <span>Favorites</span>
          </Button>
          <Button
            variant={activeFilter === 'trash' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('trash')}
            className="text-xs px-2 h-8 flex flex-col justify-center items-center"
          >
            <Trash2 className="h-4 w-4 mb-0.5" />
            <span>Trash</span>
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const updatedAtDate = note.updatedAt
                ? new Date(
                    typeof note.updatedAt === 'object' && 'seconds' in note.updatedAt
                      ? note.updatedAt.seconds * 1000
                      : note.updatedAt
                  )
                : new Date();

              return (
                <button
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={`flex w-full flex-col gap-1.5 rounded-lg p-3 text-left transition-colors hover:bg-muted/60 ${
                    selectedNoteId === note.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <h3 className="font-semibold text-sm truncate pr-1 flex-1">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {note.pinned && <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                      {note.favorite && <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />}
                    </div>
                  </div>

                  <p className="line-clamp-2 text-xs text-muted-foreground break-words">
                    {note.excerpt || 'No content yet.'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{updatedAtDate.toLocaleDateString()}</span>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1 max-w-[60%] overflow-hidden">
                        {note.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="bg-muted px-1 py-0.2 rounded truncate">
                            #{tag}
                          </span>
                        ))}
                        {note.tags.length > 2 && <span>+{note.tags.length - 2}</span>}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-48 gap-1.5">
              <AlertCircle className="h-6 w-6 text-muted-foreground opacity-30" />
              <p className="text-sm font-medium">No notes found</p>
              <p className="text-xs">Create a new note or change your filters.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
