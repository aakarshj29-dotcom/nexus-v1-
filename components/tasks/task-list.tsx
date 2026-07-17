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
  MoreVertical,
  Edit,
  Trash,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  onEditClick: (task: Task) => void;
  onDeleteClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

export function TaskList({
  tasks,
  onEditClick,
  onDeleteClick,
  onStatusChange,
}: TaskListProps) {
  return (
    <div className="w-full border rounded-xl overflow-hidden bg-card">
      {/* Table Header (Desktop only) */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <div className="col-span-6 flex items-center gap-3">Task Title</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Priority</div>
        <div className="col-span-1.5 flex items-center justify-end">Due Date</div>
        <div className="col-span-0.5 text-right"></div>
      </div>

      {/* Table Body */}
      <div className="divide-y">
        {tasks.map((task) => {
          const isCompleted = task.status === 'completed';

          // Format date safely
          let formattedDate = '';
          let isOverdue = false;
          if (task.dueDate) {
            try {
              const d = new Date(task.dueDate);
              formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (!isCompleted && d < today) {
                isOverdue = true;
              }
            } catch {}
          }

          const toggleStatus = () => {
            onStatusChange(task.id, isCompleted ? 'todo' : 'completed');
          };

          return (
            <div
              key={task.id}
              className={cn(
                "group flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-4 py-4 md:px-6 md:py-3.5 items-start md:items-center transition-colors hover:bg-muted/30",
                isCompleted && "opacity-75"
              )}
            >
              {/* Checkbox and Title column */}
              <div className="col-span-6 flex items-start gap-3.5 w-full min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleStatus}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-full p-0 text-muted-foreground hover:text-primary hover:bg-transparent"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className={cn(
                        "font-medium text-sm text-foreground hover:text-primary transition-colors truncate max-w-[280px] md:max-w-md block",
                        isCompleted && "text-muted-foreground line-through"
                      )}
                    >
                      {task.title}
                    </Link>
                    {task.projectName && (
                      <span className="hidden sm:inline bg-muted/60 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]">
                        {task.projectName}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-sm md:max-w-lg">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Status column (stacked on mobile) */}
              <div className="col-span-2 flex items-center md:block">
                <span className="text-xs text-muted-foreground md:hidden mr-2 font-medium">Status:</span>
                <TaskStatusBadge status={task.status} />
              </div>

              {/* Priority column (stacked on mobile) */}
              <div className="col-span-2 flex items-center md:block">
                <span className="text-xs text-muted-foreground md:hidden mr-2 font-medium">Priority:</span>
                <TaskPriorityBadge priority={task.priority} />
              </div>

              {/* Due Date column (stacked on mobile) */}
              <div className="col-span-1.5 flex items-center md:justify-end w-full md:w-auto text-xs text-muted-foreground">
                {formattedDate ? (
                  <div
                    className={cn(
                      "flex items-center gap-1.5 font-medium md:justify-end",
                      isOverdue && "text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20"
                    )}
                  >
                    {isOverdue ? (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{formattedDate}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/40 md:pr-4">—</span>
                )}
              </div>

              {/* Actions dropdown */}
              <div className="col-span-0.5 flex items-center justify-end w-full md:w-auto border-t md:border-t-0 pt-2.5 md:pt-0">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
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
                    {isCompleted ? (
                      <DropdownMenuItem onClick={() => onStatusChange(task.id, 'todo')}>
                        <Circle className="mr-2 h-4 w-4 text-muted-foreground" />
                        Reopen Task
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onStatusChange(task.id, 'completed')}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                        Mark Completed
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
