'use client';

import * as React from 'react';
import { Project, ProjectStatus } from '@/types/project';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderKanban, Briefcase, Flame, Star, Rocket, Sparkles, AlertCircle } from 'lucide-react';

const COLORS = [
  { value: '#6366f1', name: 'Indigo' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#10b981', name: 'Emerald' },
  { value: '#f59e0b', name: 'Amber' },
  { value: '#ef4444', name: 'Red' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#8b5cf6', name: 'Purple' },
];

const ICONS = [
  { name: 'FolderKanban', icon: FolderKanban },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Flame', icon: Flame },
  { name: 'Star', icon: Star },
  { name: 'Rocket', icon: Rocket },
  { name: 'Sparkles', icon: Sparkles },
];

interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (
    projectId: string,
    input: { title: string; description: string; color: string; icon: string; status: ProjectStatus }
  ) => Promise<unknown>;
}

export function EditProjectDialog({ project, open, onOpenChange, onUpdate }: EditProjectDialogProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState(COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = React.useState(ICONS[0].name);
  const [status, setStatus] = React.useState<ProjectStatus>('active');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && project) {
      setTitle(project.title || '');
      setDescription(project.description || '');
      setSelectedColor(project.color || COLORS[0].value);
      setSelectedIcon(project.icon || ICONS[0].name);
      setStatus(project.status || 'active');
      setError(null);
    }
  }, [open, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }
    if (title.length > 100) {
      setError('Project title cannot exceed 100 characters.');
      return;
    }
    if (description.length > 1000) {
      setError('Description cannot exceed 1000 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onUpdate(project.id, {
        title: title.trim(),
        description: description.trim(),
        color: selectedColor,
        icon: selectedIcon,
        status,
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to update project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details, status, or design settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="edit-title" className="text-sm font-medium">
              Project Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-title"
              placeholder="e.g. Website Redesign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="edit-description"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              maxLength={1000}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              disabled={loading}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Theme Color</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className="relative h-8 w-8 rounded-full border border-black/10 shadow-xs transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Project Icon</span>
            <div className="flex gap-2">
              {ICONS.map((iconItem) => {
                const IconComponent = iconItem.icon;
                const isSelected = selectedIcon === iconItem.name;
                return (
                  <button
                    key={iconItem.name}
                    type="button"
                    onClick={() => setSelectedIcon(iconItem.name)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input hover:bg-muted'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
