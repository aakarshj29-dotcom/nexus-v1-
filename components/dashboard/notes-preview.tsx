'use client';

import { Note } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotesPreviewProps {
  notes: Note[] | undefined;
  loading: boolean;
}

import Link from 'next/link';

export function NotesPreview({ notes, loading }: NotesPreviewProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Notes</CardTitle>
        <Link href="/dashboard/notes">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <Link
              key={note.id}
              href="/dashboard/notes"
              className="group relative flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50 block"
            >
              <h4 className="text-sm font-medium">{note.title}</h4>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {note.excerpt || 'No content yet.'}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  {note.tags?.map(tag => (
                    <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">#{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="flex h-[150px] flex-col items-center justify-center text-center">
            <FileText className="mb-2 h-8 w-8 text-muted-foreground opacity-20" />
            <p className="text-sm text-muted-foreground">No notes found.</p>
          </div>
        )}
        <Link href="/dashboard/notes" className="block w-full">
          <Button variant="outline" className="w-full">View All Notes</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
