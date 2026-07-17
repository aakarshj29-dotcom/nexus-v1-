'use client';

import * as React from 'react';
import Link from 'next/link';
import { Task } from '@/types/task';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEditClick: (task: Task) => void;
  onDeleteClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

export function TaskCard({
  task,
  onEditClick,
  onDeleteClick,
  onStatusChange,
}: TaskCardProps) {
  // Format due date elegantly
  const formattedDueDate = React.useMemo(() => {
    if (!task.dueDate) return null;
    try {
      const date = new Date(task.dueDate);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  }, [task.dueDate]);

  // Check if task is overdue
  const isOverdue = React.useMemo(() => {
    if (!task.dueDate || task.status === 'completed') return false;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(task.dueDate) < today;
    } catch {
      return false;
    }
  }, [task.dueDate, task.status]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const toggleComplete = () => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    onStatusChange(task.id, newStatus);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border bg-card p-4 shadow-xs transition-all hover:border-foreground/20 hover:shadow-sm cursor-grab active:cursor-grabbing select-none",
        task.status === 'completed' && "opacity-80 border-dashed"
      )}
    >
      <div className="space-y-3">
        {/* Top Badges & Options Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <TaskPriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEditClick(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                }
              />
              <DropdownMenuSeparator />
              {task.status !== 'completed' ? (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, 'completed')}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                  Complete
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, 'todo')}>
                  <Circle className="mr-2 h-4 w-4 text-muted-foreground" />
                  Reopen
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteClick(task.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title and Action Box */}
        <div className="flex items-start gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleComplete}
            className="mt-0.5 h-5 w-5 shrink-0 rounded-full p-0 text-muted-foreground hover:text-primary hover:bg-transparent"
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
          <div className="space-y-1 flex-1">
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className={cn(
                "font-medium text-sm text-foreground hover:text-primary transition-colors block leading-tight",
                task.status === 'completed' && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </Link>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
        {/* Project Name Tag */}
        {task.projectName ? (
          <span className="truncate max-w-[120px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground font-medium">
            {task.projectName}
          </span>
        ) : (
          <span />
        )}

        {/* Due Date Indicator */}
        {formattedDueDate && (
          <div
            className={cn(
              "flex items-center gap-1.5 font-medium",
              isOverdue
                ? "text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20"
                : "text-muted-foreground"
            )}
            title={isOverdue ? "Overdue Task!" : "Due Date"}
          >
            {isOverdue ? (
              <AlertTriangle className="h-3 w-3 shrink-0" />
            ) : (
              <Calendar className="h-3 w-3 shrink-0" />
            )}
            <span>{formattedDueDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
