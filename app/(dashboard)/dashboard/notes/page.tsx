'use client';

import React, { useState, useEffect } from 'react';
import { useNotes } from '@/hooks/use-notes';
import { useNote } from '@/hooks/use-note';
import { NoteSidebar, NoteFilterType } from '@/components/notes/note-sidebar';
import { NoteEditor } from '@/components/notes/note-editor';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteNote, restoreNote, permanentlyDeleteNote } from '@/firebase/note-service';
import { useAuth } from '@/hooks/use-auth';

export default function NotesPage() {
  const { user } = useAuth();
  const { notes, loading: listLoading, error: listError, createNote } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { note, loading: noteLoading, updateNote, isSaving } = useNote(selectedNoteId);

  const [activeFilter, setActiveFilter] = useState<NoteFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Debounced Auto-save implementation
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerAutoSave = (updates: Record<string, unknown>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (selectedNoteId) {
        await updateNote(updates);
      }
    }, 1000); // 1 second debounce
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setShowMobileDetail(true);
  };

  const handleCreateNote = async () => {
    try {
      const newId = await createNote();
      setSelectedNoteId(newId);
      setShowMobileDetail(true);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNoteId || !user?.uid) return;

    try {
      if (note?.deleted) {
        // Permanently Delete
        if (confirm('Are you sure you want to permanently delete this note? This action cannot be undone.')) {
          await permanentlyDeleteNote(selectedNoteId, user.uid);
          setSelectedNoteId(null);
          setShowMobileDetail(false);
        }
      } else {
        // Soft delete
        await deleteNote(selectedNoteId, user.uid);
        // Deselect or switch to next if possible
        setSelectedNoteId(null);
        setShowMobileDetail(false);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleRestoreNote = async () => {
    if (!selectedNoteId || !user?.uid) return;

    try {
      await restoreNote(selectedNoteId, user.uid);
    } catch (err) {
      console.error('Failed to restore note:', err);
    }
  };

  if (listError) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading notes</AlertTitle>
          <AlertDescription>
            {listError.message || 'There was an issue synchronizing your notes. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar List panel */}
      <div className={`h-full border-r ${showMobileDetail ? 'hidden md:block' : 'w-full md:block'}`}>
        {listLoading ? (
          <div className="flex h-full w-full flex-col p-4 gap-4 bg-background">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <div className="space-y-2 flex-1">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <NoteSidebar
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
      </div>

      {/* Editor Main Content Area */}
      <div className={`flex-1 h-full ${!showMobileDetail ? 'hidden md:block' : 'block'}`}>
        {showMobileDetail && (
          <div className="flex items-center gap-2 border-b px-4 py-2 md:hidden bg-background">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileDetail(false)}
              className="gap-1.5 pl-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </Button>
          </div>
        )}

        {selectedNoteId ? (
          noteLoading ? (
            <div className="flex h-full flex-col p-6 gap-4">
              <Skeleton className="h-8 w-1/3" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
              <Skeleton className="flex-1 w-full" />
            </div>
          ) : note ? (
            <NoteEditor
              note={note}
              onUpdate={triggerAutoSave}
              onDelete={handleDeleteNote}
              onRestore={handleRestoreNote}
              isSaving={isSaving}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground gap-1.5">
              <AlertCircle className="h-8 w-8 text-muted-foreground opacity-30 animate-pulse" />
              <p className="text-sm font-medium">Note could not be loaded</p>
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground gap-3">
            <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileText className="h-6 w-6 opacity-40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">No note selected</p>
              <p className="text-xs max-w-xs mx-auto">
                Select a note from the list, or create a brand new one to begin editing.
              </p>
            </div>
            <Button onClick={handleCreateNote} size="sm">
              Create Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
