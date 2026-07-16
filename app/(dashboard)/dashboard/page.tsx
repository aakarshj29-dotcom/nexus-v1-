'use client';

import { useDashboard } from '@/hooks/use-dashboard';
import { WelcomeCard } from '@/components/dashboard/welcome-card';
import { RecentProjects } from '@/components/dashboard/recent-projects';
import { MyTasks } from '@/components/dashboard/my-tasks';
import { CalendarPreview } from '@/components/dashboard/calendar-preview';
import { NotesPreview } from '@/components/dashboard/notes-preview';
import { ProductivitySummary } from '@/components/dashboard/productivity-summary';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data, loading, error, refresh } = useDashboard();

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message || 'Failed to load dashboard data. Please try again.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refresh()} variant="outline" className="w-fit">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-1 md:p-4">
      <WelcomeCard />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column - Main Content */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <RecentProjects projects={data?.projects} loading={loading} />
            <MyTasks tasks={data?.tasks} loading={loading} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <NotesPreview notes={data?.notes} loading={loading} />
            <QuickActions />
          </div>
        </div>

        {/* Right Column - Side Panels */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <ProductivitySummary stats={data?.stats} loading={loading} />
          <CalendarPreview events={data?.events} loading={loading} />
        </div>
      </div>
    </div>
  );
}
