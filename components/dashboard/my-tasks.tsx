'use client';

import { Task } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, Clock, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MyTasksProps {
  tasks: Task[] | undefined;
  loading: boolean;
}

export function MyTasks({ tasks, loading }: MyTasksProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] flex-col items-center justify-center text-center">
          <CheckCircle2 className="mb-2 h-8 w-8 text-muted-foreground opacity-20" />
          <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>My Tasks</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center justify-between rounded-lg border p-2 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0">
                {task.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
              <div>
                <p className={cn(
                  "text-sm font-medium leading-none",
                  task.status === 'completed' && "text-muted-foreground line-through"
                )}>
                  {task.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-4", getPriorityColor(task.priority))}>
                    {task.priority}
                  </Badge>
                  {task.projectName && (
                    <span className="text-[10px] text-muted-foreground">
                      • {task.projectName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full mt-2">View All Tasks</Button>
      </CardContent>
    </Card>
  );
}
