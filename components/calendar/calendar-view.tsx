'use client';

import * as React from 'react';
import { useCalendar } from '@/hooks/use-calendar';
import { CalendarHeader, CalendarViewMode } from './calendar-header';
import { MonthView } from './month-view';
import { WeekView } from './week-view';
import { DayView } from './day-view';
import { AgendaView } from './agenda-view';
import { EventModal } from './event-modal';
import { ViewItemModal } from './view-item-modal';
import { UnifiedCalendarItem, CreateCalendarEventInput, CalendarEventType } from '@/types/calendar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCcw, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CalendarView() {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>('month');

  // Compute visible date range in-memory to let hooks manage filtering
  const visibleRange = React.useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'month') {
      start.setDate(1);
      // Give padding to fetch previous month's overlap
      start.setDate(start.getDate() - 7);

      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      // Padding for next month's overlap
      end.setDate(end.getDate() + 7);
    } else if (viewMode === 'week') {
      start.setDate(currentDate.getDate() - currentDate.getDay());
      end.setDate(currentDate.getDate() - currentDate.getDay() + 6);
    } else if (viewMode === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      // Agenda view: show 30 days from today
      start.setDate(currentDate.getDate() - 1);
      end.setDate(currentDate.getDate() + 30);
    }

    return { startDate: start, endDate: end };
  }, [currentDate, viewMode]);

  // Use hook with visible range
  const {
    unifiedItems,
    projects,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useCalendar(visibleRange);

  // Modal and Interactive States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<UnifiedCalendarItem | null>(null);
  const [preselectedDate, setPreselectedDate] = React.useState<Date | null>(null);

  // feedback message
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Date Navigation Handlers
  const handleNavigatePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'month') {
      nextDate.setMonth(currentDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(currentDate.getDate() - 7);
    } else if (viewMode === 'day') {
      nextDate.setDate(currentDate.getDate() - 1);
    } else {
      nextDate.setDate(currentDate.getDate() - 7);
    }
    setCurrentDate(nextDate);
  };

  const handleNavigateNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'month') {
      nextDate.setMonth(currentDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(currentDate.getDate() + 7);
    } else if (viewMode === 'day') {
      nextDate.setDate(currentDate.getDate() + 1);
    } else {
      nextDate.setDate(currentDate.getDate() + 7);
    }
    setCurrentDate(nextDate);
  };

  const handleNavigateToday = () => {
    setCurrentDate(new Date());
  };

  // Event interaction
  const handleItemClick = (item: UnifiedCalendarItem) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setPreselectedDate(date);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (input: CreateCalendarEventInput) => {
    if (selectedItem?.originalType === 'event') {
      // Editing
      await updateEvent(selectedItem.originalId, input);
      showFeedback(`Event "${input.title}" was successfully updated.`);
      setSelectedItem(null);
    } else {
      // Creating
      await createEvent(input);
      showFeedback(`Event "${input.title}" was successfully added to your calendar.`);
    }
    setPreselectedDate(null);
  };

  const handleEditClick = () => {
    setIsViewOpen(false);
    setIsCreateOpen(true);
  };

  const handleDeleteSubmit = async (id: string) => {
    await deleteEvent(id);
    showFeedback('Event has been deleted from your schedule.');
  };

  if (error) {
    return (
      <div className="flex-1 p-6 flex flex-col gap-4 max-w-4xl mx-auto justify-center h-[70vh]">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Calendar System Error</AlertTitle>
          <AlertDescription>
            {error.message || 'Unable to load your schedule. Please try refreshing.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline" className="w-fit mx-auto">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reload Calendar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full h-full pb-10">
      {/* Calendar Header with Navigation and Views */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        onNavigateToday={handleNavigateToday}
        onCreateEventClick={() => {
          setSelectedItem(null);
          setPreselectedDate(null);
          setIsCreateOpen(true);
        }}
      />

      {/* Success/Feedback alert banner */}
      {feedback && (
        <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      )}

      {/* Main Calendar View Area */}
      {loading ? (
        <div className="space-y-4 flex-1">
          <div className="flex justify-between items-center pb-2">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-8 w-1/3" />
          </div>
          <Skeleton className="h-[450px] w-full rounded-2xl" />
        </div>
      ) : (
        <div className="flex-1">
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              items={unifiedItems}
              onItemClick={handleItemClick}
              onDayClick={handleDayClick}
            />
          )}

          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              items={unifiedItems}
              onItemClick={handleItemClick}
              onDayClick={handleDayClick}
            />
          )}

          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              items={unifiedItems}
              onItemClick={handleItemClick}
              onDayClick={handleDayClick}
            />
          )}

          {viewMode === 'agenda' && (
            <AgendaView
              items={unifiedItems}
              onItemClick={handleItemClick}
            />
          )}
        </div>
      )}

      {/* Unified Modals */}
      {isCreateOpen && (
        <EventModal
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          initialEvent={
            selectedItem?.originalType === 'event'
              ? {
                  id: selectedItem.originalId,
                  ownerId: '',
                  title: selectedItem.title,
                  description: selectedItem.description,
                  startTime: selectedItem.startTime,
                  endTime: selectedItem.endTime,
                  type: selectedItem.type as CalendarEventType,
                  location: selectedItem.location,
                  projectId: selectedItem.projectId,
                  createdAt: '',
                  updatedAt: '',
                }
              : preselectedDate
                ? {
                    id: '',
                    ownerId: '',
                    title: '',
                    startTime: (() => {
                      const d = new Date(preselectedDate);
                      d.setHours(9, 0, 0, 0); // Default to 9:00 AM
                      return d.toISOString();
                    })(),
                    endTime: (() => {
                      const d = new Date(preselectedDate);
                      d.setHours(10, 0, 0, 0); // Default to 10:00 AM
                      return d.toISOString();
                    })(),
                    type: 'meeting',
                    createdAt: '',
                    updatedAt: '',
                  }
                : null
          }
          projects={projects}
          onSubmit={handleCreateSubmit}
        />
      )}

      {isViewOpen && (
        <ViewItemModal
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          item={selectedItem}
          onEdit={handleEditClick}
          onDelete={handleDeleteSubmit}
        />
      )}
    </div>
  );
}
