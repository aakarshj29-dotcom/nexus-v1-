'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTask } from '@/hooks/use-task';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TaskStatus, TaskPriority, UpdateTaskInput } from '@/types/task';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  Briefcase,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{
    taskId: string;
  }>;
}

export default function TaskDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { taskId } = React.use(params);

  // Real-time task subscription
  const { task, loading, error, updateTask, deleteTask } = useTask(taskId);

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleUpdate = async (input: UpdateTaskInput) => {
    await updateTask(input);
    showSuccess('Task details were updated successfully!');
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await updateTask({ status: newStatus });
    showSuccess(`Status changed to ${newStatus.replace('-', ' ')}`);
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    await updateTask({ priority: newPriority });
    showSuccess(`Priority changed to ${newPriority}`);
  };

  const handleDeleteConfirm = async () => {
    if (confirm('Are you sure you want to delete this task? This operation cannot be undone.')) {
      await deleteTask();
      // If we deleted it, redirect to Tasks Overview
      router.replace('/dashboard/tasks');
    }
  };

  const toggleComplete = async () => {
    if (!task) return;
    const isCompleted = task.status === 'completed';
    await updateTask({ status: isCompleted ? 'todo' : 'completed' });
    showSuccess(isCompleted ? 'Task reopened!' : 'Task completed!');
  };

  // Format dates
  const formattedCreatedDate = React.useMemo(() => {
    if (!task?.createdAt) return '';
    let dateObj: Date | null = null;
    if (typeof task.createdAt === 'string') {
      dateObj = new Date(task.createdAt);
    } else if (task.createdAt && typeof task.createdAt === 'object' && 'toDate' in task.createdAt) {
      dateObj = (task.createdAt as { toDate: () => Date }).toDate();
    }
    return dateObj ? dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  }, [task?.createdAt]);

  const formattedUpdatedDate = React.useMemo(() => {
    if (!task?.updatedAt) return '';
    let dateObj: Date | null = null;
    if (typeof task.updatedAt === 'string') {
      dateObj = new Date(task.updatedAt);
    } else if (task.updatedAt && typeof task.updatedAt === 'object' && 'toDate' in task.updatedAt) {
      dateObj = (task.updatedAt as { toDate: () => Date }).toDate();
    }
    return dateObj ? dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  }, [task?.updatedAt]);

  const formattedDueDate = React.useMemo(() => {
    if (!task?.dueDate) return null;
    try {
      const date = new Date(task.dueDate);
      return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return null;
    }
  }, [task?.dueDate]);

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
        <Skeleton className="h-9 w-24" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex-1 p-6 flex flex-col gap-4 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Task Details</AlertTitle>
          <AlertDescription>
            {error?.message || 'Task not found or access denied.'}
          </AlertDescription>
        </Alert>
        <Link href="/dashboard/tasks">
          <Button variant="outline" className="w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
      </div>
    );
  }

  const isCompleted = task.status === 'completed';

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full animate-fade-in">
      {/* Top Breadcrumb Nav Row */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Workspace
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleComplete} className="h-8 text-xs">
            {isCompleted ? (
              <>
                <Circle className="mr-1.5 h-3.5 w-3.5" />
                Reopen Task
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                Complete Task
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="h-8 text-xs">
            <Edit2 className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>

          <Button variant="destructive" size="sm" onClick={handleDeleteConfirm} className="h-8 text-xs">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {successMessage && (
        <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Update Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Task Header */}
      <div className="space-y-3.5 border-b pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {task.title}
        </h1>
        <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>Created on {formattedCreatedDate}</span>
          <span>•</span>
          <span>Last updated {formattedUpdatedDate}</span>
        </p>
      </div>

      {/* Main Grid Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Description */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <FileText className="h-4 w-4" />
                Task Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                {task.description || 'No description provided for this task. Use the edit feature to add details, objectives, and acceptance criteria.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sidebar Metadata controls */}
        <div className="space-y-6">
          {/* Metadata Controller Card */}
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/15">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Task Attributes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              {/* Parent Project */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">Associated Project</span>
                {task.projectId ? (
                  <Link
                    href={`/projects/${task.projectId}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-all text-primary font-medium text-xs w-full truncate"
                  >
                    <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{task.projectName || 'View Project'}</span>
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground italic">None</span>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">Due Date</span>
                {formattedDueDate ? (
                  <div className="flex items-center gap-2 text-xs font-medium bg-muted/20 border px-2.5 py-1.5 rounded-lg text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formattedDueDate}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic px-1 block">No due date assigned</span>
                )}
              </div>

              {/* Quick status selector */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <span className="text-xs font-semibold text-muted-foreground block">Modify Status</span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className="w-full text-xs rounded-md border border-input bg-background px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Quick priority selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground block">Modify Priority</span>
                <select
                  value={task.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                  className="w-full text-xs rounded-md border border-input bg-background px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTaskDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
