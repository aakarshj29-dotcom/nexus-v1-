'use client';

import { ProductivityStats } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

interface ProductivitySummaryProps {
  stats: ProductivityStats | undefined;
  loading: boolean;
}

export function ProductivitySummary({ stats, loading }: ProductivitySummaryProps) {
  if (loading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{stats.productivityScore}%</span>
            <span className="flex items-center text-xs text-emerald-500">
              <TrendingUp className="mr-1 h-3 w-3" />
              +5% from last week
            </span>
          </div>
          <div className="h-16 w-16">
             {/* Circular progress could go here, for now using just text and a bar below */}
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tasks Completed</span>
              <span className="font-medium">{stats.completedTasks} / {stats.totalTasks}</span>
            </div>
            <Progress value={(stats.completedTasks / stats.totalTasks) * 100} className="h-1.5" />
          </div>

          <div className="flex items-end justify-between gap-1 pt-2">
            {stats.weeklyActivity.map((activity, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-4 rounded-t-sm bg-primary/20 hover:bg-primary/40 transition-colors"
                  style={{ height: `${activity}px` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
