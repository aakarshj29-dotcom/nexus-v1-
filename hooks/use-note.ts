'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Note, UpdateNoteInput } from '@/types/note';
import { updateNote } from '@/firebase/note-service';
import { db, doc, onSnapshot } from '@/firebase/firestore';
import { useAuth } from './use-auth';

export function useNote(noteId: string | null) {
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  // Use a ref to store the latest values to prevent saving stale data
  const noteRef = useRef<Note | null>(null);
  noteRef.current = note;

  useEffect(() => {
    if (!user?.uid || !noteId) {
      setNote(null);
      setLoading(false);
      return;
    }

    if (isMock) {
      setLoading(true);
      const loadMockNote = () => {
        const stored = localStorage.getItem('nexus_mock_notes');
        if (stored) {
          try {
            const list: Note[] = JSON.parse(stored);
            const found = list.find((n) => n.id === noteId);
            if (found) {
              setNote(found);
              setError(null);
            } else {
              setNote(null);
              setError(new Error('Note not found.'));
            }
          } catch {
            setNote(null);
          }
        }
        setLoading(false);
      };

      loadMockNote();

      const handleCustomUpdate = () => {
        loadMockNote();
      };

      window.addEventListener('nexus_mock_notes_changed', handleCustomUpdate);
      return () => {
        window.removeEventListener('nexus_mock_notes_changed', handleCustomUpdate);
      };
    }

    setLoading(true);
    const nRef = doc(db, 'notes', noteId);

    const unsubscribe = onSnapshot(
      nRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const fetchedNote = {
            id: docSnap.id,
            ...docSnap.data(),
          } as Note;

          if (fetchedNote.ownerId !== user.uid) {
            setError(new Error('Access denied. You do not have permission to view this note.'));
            setNote(null);
          } else {
            setNote(fetchedNote);
            setError(null);
          }
        } else {
          setError(new Error('Note not found.'));
          setNote(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching note details:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch note details'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, noteId, isMock]);

  const handleUpdateNote = useCallback(
    async (updates: UpdateNoteInput) => {
      if (!user?.uid || !noteId) return;

      if (isMock) {
        setIsSaving(true);
        const stored = localStorage.getItem('nexus_mock_notes');
        if (stored) {
          try {
            const list: Note[] = JSON.parse(stored);
            const index = list.findIndex((n) => n.id === noteId);
            if (index !== -1) {
              const updatedNote: Note = {
                ...list[index],
                ...updates,
                updatedAt: new Date().toISOString(),
              } as Note;

              list[index] = updatedNote;
              localStorage.setItem('nexus_mock_notes', JSON.stringify(list));
              window.dispatchEvent(new Event('nexus_mock_notes_changed'));
            }
          } catch (err) {
            console.error('Error updating mock note:', err);
          }
        }
        setIsSaving(false);
        return;
      }

      try {
        setIsSaving(true);
        await updateNote(noteId, user.uid, updates);
      } catch (err) {
        console.error('Error updating note:', err);
        setError(err instanceof Error ? err : new Error('Failed to update note'));
      } finally {
        setIsSaving(false);
      }
    },
    [user?.uid, noteId, isMock]
  );

  return {
    note,
    loading,
    error,
    updateNote: handleUpdateNote,
    isSaving,
  };
}
