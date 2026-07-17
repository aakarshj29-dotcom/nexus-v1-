'use client';

import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyProjectStateProps {
  onCreateClick: () => void;
}

export function EmptyProjectState({ onCreateClick }: EmptyProjectStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-fade-in">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FolderPlus className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">No projects found</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Get started by creating your first workspace project to organize, monitor, and collaborate on your tasks effectively.
      </p>
      <Button onClick={onCreateClick} className="mt-6">
        Create Your First Project
      </Button>
    </div>
  );
}
