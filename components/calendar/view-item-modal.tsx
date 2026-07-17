'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { UnifiedCalendarItem } from '@/types/calendar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Clock, MapPin, Tag, ArrowUpRight, Pencil, Trash } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ViewItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: UnifiedCalendarItem | null;
  onEdit: (item: UnifiedCalendarItem) => void;
  onDelete: (id: string) => Promise<void>;
}

export function ViewItemModal({
  open,
  onOpenChange,
  item,
  onEdit,
  onDelete,
}: ViewItemModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!item) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'Meeting 🤝';
      case 'deadline':
        return 'Deadline 🚨';
      case 'reminder':
        return 'Reminder 🔔';
      case 'personal':
        return 'Personal 👤';
      case 'task':
        return 'Task Due 📝';
      case 'project_deadline':
        return 'Project Deadline 📅';
      default:
        return type;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'deadline':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'reminder':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'personal':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'task':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'project_deadline':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20';
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this event?')) {
      setIsDeleting(true);
      try {
        await onDelete(item.originalId);
        onOpenChange(false);
      } catch (err) {
        console.error('Error deleting event:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getTypeBadgeClass(
                item.type
              )}`}
            >
              {getTypeLabel(item.type)}
            </span>
            {item.projectName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
                <Tag className="h-3 w-3" />
                {item.projectName}
              </span>
            )}
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-left">
            {item.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            Detailed information about this calendar slot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-sm text-left">
          {/* Time block */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">
                {formatDate(item.startTime)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(item.startTime)} – {formatTime(item.endTime)}
              </p>
            </div>
          </div>

          {/* Location if meeting/event */}
          {item.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">{item.location}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="rounded-lg bg-muted/50 border border-border p-3 mt-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">
                Description
              </p>
              <p className="text-sm whitespace-pre-wrap text-foreground">
                {item.description}
              </p>
            </div>
          )}

          {/* If Task Status block */}
          {item.originalType === 'task' && item.status && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Status:</span>
              <span className="text-xs font-medium bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded capitalize">
                {item.status.replace('-', ' ')}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border mt-4">
          <div className="flex-1 flex justify-start gap-2">
            {item.originalType === 'task' && (
              <Link
                href={`/dashboard/tasks`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "w-full sm:w-auto")}
              >
                View on Kanban Board <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            )}
            {item.originalType === 'project' && (
              <Link
                href={`/projects/${item.originalId}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "w-full sm:w-auto")}
              >
                Go to Project Dashboard <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {item.originalType === 'event' && (
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
                className="flex items-center gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5"
              >
                <Trash className="h-3.5 w-3.5" /> {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
