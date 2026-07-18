'use client';

import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { createNote } from '@/firebase/note-service';
import { db, collection, query, where, onSnapshot } from '@/firebase/firestore';
import { useAuth } from './use-auth';

// Initial dummy notes to populate the editor beautifully for mock preview and first use
const DEFAULT_MOCK_NOTES: Note[] = [
  {
    id: 'mock-note-1',
    ownerId: 'mock-user-123',
    title: 'Welcome to Nexus Notes V1 🚀',
    content: `<h1>Welcome to Nexus Notes V1</h1>
<p>Nexus Notes is a <strong>modern, rich-text document module</strong> designed for fast, focused editing and productivity. It features real-time state synchronization, clean styling, and full accessibility.</p>
<h2>✍️ Formatting Support</h2>
<p>Our editor, built with Tiptap, supports all major rich text block elements:</p>
<ul>
  <li><strong>Bold</strong>, <em>Italic</em>, and <u>Underlined</u> inline styling.</li>
  <li>Custom bullet lists and numbered checklists.</li>
  <li>H1, H2, and H3 headers.</li>
  <li>Horizontal dividers.</li>
</ul>
<blockquote>"Quality is not an act, it is a habit." – Aristotle</blockquote>
<p>Start editing this note, or create a brand new one using the sidebar actions!</p>`,
    excerpt: 'Welcome to Nexus Notes V1. Nexus Notes is a modern, rich-text document module designed for fast, focused editing and productivity.',
    pinned: true,
    favorite: true,
    deleted: false,
    tags: ['intro', 'nexus-v1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-note-2',
    ownerId: 'mock-user-123',
    title: 'Project Aurora Specifications 🌌',
    content: `<h2>Project Aurora</h2>
<p>This note serves as the main specifications reference for <em>Project Aurora</em>.</p>
<h3>1. Technology Stack</h3>
<ul>
  <li>Next.js 15 (App Router)</li>
  <li>Tailwind CSS 4</li>
  <li>Firebase Firestore & Authentication</li>
  <li>Tiptap Rich-Text Editor</li>
</ul>
<h3>2. Code Reference</h3>
<pre><code>function initAurora() {
  console.log("Aurora initialized successfully.");
}</code></pre>`,
    excerpt: 'Project Aurora. This note serves as the main specifications reference for Project Aurora.',
    pinned: false,
    favorite: true,
    deleted: false,
    tags: ['tech', 'specs'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'mock-note-3',
    ownerId: 'mock-user-123',
    title: 'Trash Idea Draft',
    content: `<p>This is an outdated draft that was soft-deleted but can be restored at any time.</p>`,
    excerpt: 'This is an outdated draft that was soft-deleted but can be restored at any time.',
    pinned: false,
    favorite: false,
    deleted: true,
    tags: ['old', 'draft'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isMock = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

  useEffect(() => {
    if (!user?.uid) {
      setNotes([]);
      setLoading(false);
      return;
    }

    if (isMock) {
      // Setup local storage subscription
      const loadMockNotes = () => {
        const stored = localStorage.getItem('nexus_mock_notes');
        if (stored) {
          try {
            setNotes(JSON.parse(stored));
          } catch {
            setNotes(DEFAULT_MOCK_NOTES);
          }
        } else {
          localStorage.setItem('nexus_mock_notes', JSON.stringify(DEFAULT_MOCK_NOTES));
          setNotes(DEFAULT_MOCK_NOTES);
        }
        setLoading(false);
      };

      loadMockNotes();

      // Listen to storage changes to keep multiple tabs or single page detail/list sync'd
      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'nexus_mock_notes') {
          loadMockNotes();
        }
      };

      const handleCustomUpdate = () => {
        loadMockNotes();
      };

      window.addEventListener('storage', handleStorage);
      window.addEventListener('nexus_mock_notes_changed', handleCustomUpdate);

      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('nexus_mock_notes_changed', handleCustomUpdate);
      };
    }

    setLoading(true);
    const q = query(
      collection(db, 'notes'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedNotes: Note[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedNotes.push({
            id: docSnap.id,
            ...data,
          } as Note);
        });

        // Sort by updatedAt descending
        fetchedNotes.sort((a, b) => {
          const timeA = a.updatedAt ? new Date(
            typeof a.updatedAt === 'object' && 'seconds' in a.updatedAt
              ? a.updatedAt.seconds * 1000
              : a.updatedAt
          ).getTime() : 0;
          const timeB = b.updatedAt ? new Date(
            typeof b.updatedAt === 'object' && 'seconds' in b.updatedAt
              ? b.updatedAt.seconds * 1000
              : b.updatedAt
          ).getTime() : 0;
          return timeB - timeA;
        });

        setNotes(fetchedNotes);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching notes:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch notes'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, isMock]);

  const handleCreateNote = async (title?: string, content?: string, excerpt?: string, tags?: string[]) => {
    if (!user?.uid) {
      throw new Error('You must be logged in to create a note.');
    }

    if (isMock) {
      const stored = localStorage.getItem('nexus_mock_notes');
      let currentMockList: Note[] = stored ? JSON.parse(stored) : [...DEFAULT_MOCK_NOTES];

      const newId = 'mock-note-' + Math.random().toString(36).substring(2, 9);
      const newNote: Note = {
        id: newId,
        ownerId: user.uid,
        title: title || 'Untitled Note',
        content: content || '',
        excerpt: excerpt || '',
        pinned: false,
        favorite: false,
        deleted: false,
        tags: tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      currentMockList = [newNote, ...currentMockList];
      localStorage.setItem('nexus_mock_notes', JSON.stringify(currentMockList));
      window.dispatchEvent(new Event('nexus_mock_notes_changed'));
      return newId;
    }

    return await createNote(user.uid, { title, content, excerpt, tags });
  };

  return {
    notes,
    loading,
    error,
    createNote: handleCreateNote,
  };
}
