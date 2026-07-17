'use client';

import { Badge } from '@/components/ui/badge';
import { TaskStatus } from '@/types/task';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
};

const STATUS_VARIANTS: Record<TaskStatus, 'secondary' | 'default' | 'success' | 'destructive'> = {
  todo: 'secondary',
  'in-progress': 'default',
  completed: 'success',
  blocked: 'destructive',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className="capitalize">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
