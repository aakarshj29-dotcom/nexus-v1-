'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link2,
  Unlink,
  Minus,
  Undo2,
  Redo2,
  Save,
  Pin,
  Heart,
  Trash2,
  CornerUpLeft,
} from 'lucide-react';
import { Note } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NoteEditorProps {
  note: Note;
  onUpdate: (updates: { title?: string; content?: string; excerpt?: string; pinned?: boolean; favorite?: boolean }) => void;
  onDelete: () => void;
  onRestore?: () => void;
  isSaving?: boolean;
}

export function NoteEditor({ note, onUpdate, onDelete, onRestore, isSaving }: NoteEditorProps) {
  const [title, setTitle] = React.useState(note.title);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary/80',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: note.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Generate excerpt from the raw editor text
      const text = editor.getText();
      const excerpt = text.length > 200 ? text.substring(0, 200) + '...' : text;

      onUpdate({ content: html, excerpt });
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[300px]',
      },
    },
  });

  // Keep title input and editor content synced when the note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      if (editor && editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content || '');
      }
    }
  }, [note, editor]);

  if (!editor) {
    return null;
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    onUpdate({ title: val });
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl || 'https://');

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Editor Top Bar Controls */}
      <div className="flex items-center justify-between border-b p-4 gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-hidden flex-1">
          <Input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            className="border-0 bg-transparent text-xl font-bold shadow-none focus-visible:ring-0 px-0 h-9 w-full"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isSaving && (
            <span className="text-xs text-muted-foreground mr-1.5 flex items-center gap-1">
              <Save className="h-3.5 w-3.5 animate-pulse text-muted-foreground" />
              Saving...
            </span>
          )}

          {note.deleted ? (
            <>
              {onRestore && (
                <Button variant="outline" size="sm" onClick={onRestore} className="gap-1.5 text-xs h-8">
                  <CornerUpLeft className="h-4 w-4" />
                  Restore
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1.5 text-xs h-8">
                <Trash2 className="h-4 w-4" />
                Delete Forever
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onUpdate({ pinned: !note.pinned })}
                className={`h-8 w-8 ${note.pinned ? 'text-amber-500 hover:text-amber-600' : ''}`}
                aria-label="Pin note"
              >
                <Pin className={`h-4 w-4 ${note.pinned ? 'fill-amber-500' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onUpdate({ favorite: !note.favorite })}
                className={`h-8 w-8 ${note.favorite ? 'text-rose-500 hover:text-rose-600' : ''}`}
                aria-label="Favorite note"
              >
                <Heart className={`h-4 w-4 ${note.favorite ? 'fill-rose-500' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                aria-label="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Editor Toolbar */}
      {!note.deleted && (
        <div className="flex flex-wrap items-center gap-1 border-b bg-muted/20 p-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`h-8 w-8 ${editor.isActive('bold') ? 'bg-muted' : ''}`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`h-8 w-8 ${editor.isActive('italic') ? 'bg-muted' : ''}`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`h-8 w-8 ${editor.isActive('underline') ? 'bg-muted' : ''}`}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`h-8 w-8 ${editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}`}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`h-8 w-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}`}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`h-8 w-8 ${editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}`}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`h-8 w-8 ${editor.isActive('taskList') ? 'bg-muted' : ''}`}
            title="Checklist"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`h-8 w-8 ${editor.isActive('blockquote') ? 'bg-muted' : ''}`}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`h-8 w-8 ${editor.isActive('codeBlock') ? 'bg-muted' : ''}`}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={setLink}
            className={`h-8 w-8 ${editor.isActive('link') ? 'bg-muted' : ''}`}
            title="Link"
          >
            <Link2 className="h-4 w-4" />
          </Button>

          {editor.isActive('link') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="h-8 w-8"
              title="Remove Link"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-none focus:outline-none tiptap-container">
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  );
}
