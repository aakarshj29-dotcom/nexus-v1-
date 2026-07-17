'use client';

import * as React from 'react';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './task-card';
import { cn } from '@/lib/utils';
import { CheckSquare, Circle, AlertCircle, HelpCircle } from 'lucide-react';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onEditClick: (task: Task) => void;
  onDeleteClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const COLUMNS: { status: TaskStatus; label: string; bgClass: string; textClass: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    status: 'todo',
    label: 'To Do',
    bgClass: 'bg-slate-100/60 dark:bg-slate-900/40',
    textClass: 'text-slate-600 dark:text-slate-400',
    icon: Circle,
  },
  {
    status: 'in-progress',
    label: 'In Progress',
    bgClass: 'bg-indigo-50/40 dark:bg-indigo-950/20',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    icon: HelpCircle, // or other status icons
  },
  {
    status: 'blocked',
    label: 'Blocked',
    bgClass: 'bg-rose-50/40 dark:bg-rose-950/20',
    textClass: 'text-rose-600 dark:text-rose-400',
    icon: AlertCircle,
  },
  {
    status: 'completed',
    label: 'Completed',
    bgClass: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    icon: CheckSquare,
  },
];

export function TaskKanbanBoard({
  tasks,
  onEditClick,
  onDeleteClick,
  onStatusChange,
}: TaskKanbanBoardProps) {
  // Track which column is currently being dragged over
  const [activeOverColumn, setActiveOverColumn] = React.useState<TaskStatus | null>(null);

  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      'in-progress': [],
      blocked: [],
      completed: [],
    };
    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (activeOverColumn !== status) {
      setActiveOverColumn(status);
    }
  };

  const handleDragLeave = () => {
    setActiveOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setActiveOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      // Find the task and verify if its status is indeed changing
      const targetTask = tasks.find((t) => t.id === taskId);
      if (targetTask && targetTask.status !== status) {
        onStatusChange(taskId, status);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start w-full overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colTasks = tasksByStatus[col.status] || [];
        const isOver = activeOverColumn === col.status;
        const IconComponent = col.icon;

        return (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
            className={cn(
              "rounded-xl p-3 flex flex-col gap-3 min-h-[450px] transition-all border",
              col.bgClass,
              isOver ? "border-primary/50 ring-2 ring-primary/10" : "border-border/50"
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-1 border-b border-border/40">
              <div className="flex items-center gap-2">
                <IconComponent className={cn("h-4 w-4", col.textClass)} />
                <span className="font-semibold text-sm text-foreground">{col.label}</span>
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                {colTasks.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-[600px] scrollbar-thin">
              {colTasks.length > 0 ? (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onStatusChange={onStatusChange}
                  />
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-xl border-muted-foreground/25 min-h-[120px] bg-muted/10">
                  <p className="text-xs text-muted-foreground">
                    Drag tasks here
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
