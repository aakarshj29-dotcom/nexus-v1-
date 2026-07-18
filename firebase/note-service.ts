import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from './firestore';
import { db } from './firestore';
import { Note, CreateNoteInput, UpdateNoteInput } from '@/types/note';

const NOTES_COLLECTION = 'notes';

/**
 * Validates a note title.
 */
function validateNoteData(title: string) {
  if (title.length > 200) {
    throw new Error('Note title cannot exceed 200 characters.');
  }
}

/**
 * Create a new note in Firestore.
 */
export async function createNote(userId: string, input?: CreateNoteInput): Promise<string> {
  const noteRef = doc(collection(db, NOTES_COLLECTION));

  const title = input?.title?.trim() || 'Untitled Note';
  validateNoteData(title);

  const noteData = {
    ownerId: userId,
    workspaceId: input?.workspaceId || null,
    title,
    content: input?.content || '',
    excerpt: input?.excerpt || '',
    pinned: false,
    favorite: false,
    deleted: false,
    tags: input?.tags || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(noteRef, noteData);
  return noteRef.id;
}

/**
 * Retrieve a note by ID with ownership verification.
 */
export async function getNote(noteId: string, userId: string): Promise<Note> {
  const noteRef = doc(db, NOTES_COLLECTION, noteId);
  const noteSnap = await getDoc(noteRef);

  if (!noteSnap.exists()) {
    throw new Error('Note not found.');
  }

  const data = noteSnap.data();

  if (data.ownerId !== userId) {
    throw new Error('Access denied. You do not have permission to view this note.');
  }

  return {
    id: noteSnap.id,
    ...data,
  } as Note;
}

/**
 * Update a note with ownership verification.
 */
export async function updateNote(
  noteId: string,
  userId: string,
  input: UpdateNoteInput
): Promise<void> {
  const note = await getNote(noteId, userId);

  if (input.title !== undefined) {
    validateNoteData(input.title);
  }

  const noteRef = doc(db, NOTES_COLLECTION, noteId);

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.content !== undefined) updateData.content = input.content;
  if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
  if (input.pinned !== undefined) updateData.pinned = input.pinned;
  if (input.favorite !== undefined) updateData.favorite = input.favorite;
  if (input.deleted !== undefined) updateData.deleted = input.deleted;
  if (input.tags !== undefined) updateData.tags = input.tags;

  await updateDoc(noteRef, updateData);
}

/**
 * Soft delete a note.
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  await updateNote(noteId, userId, { deleted: true });
}

/**
 * Restore a soft deleted note.
 */
export async function restoreNote(noteId: string, userId: string): Promise<void> {
  await updateNote(noteId, userId, { deleted: false });
}

/**
 * Permanently delete a note from Firestore.
 */
export async function permanentlyDeleteNote(noteId: string, userId: string): Promise<void> {
  const note = await getNote(noteId, userId);

  if (note.ownerId !== userId) {
    throw new Error('Permission denied.');
  }

  const noteRef = doc(db, NOTES_COLLECTION, noteId);
  await deleteDoc(noteRef);
}
