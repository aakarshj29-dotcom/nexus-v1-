'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  onCreateEventClick: () => void;
}

export function CalendarHeader({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigatePrev,
  onNavigateNext,
  onNavigateToday,
  onCreateEventClick,
}: CalendarHeaderProps) {
  // Format the title based on the current date and view mode
  const getHeaderTitle = () => {
    const month = currentDate.toLocaleDateString([], { month: 'long' });
    const year = currentDate.getFullYear();

    if (viewMode === 'day') {
      const day = currentDate.toLocaleDateString([], { day: 'numeric', weekday: 'short' });
      return `${day} ${month}, ${year}`;
    }

    if (viewMode === 'week') {
      // Find Sunday and Saturday of the current week
      const sun = new Date(currentDate);
      sun.setDate(currentDate.getDate() - currentDate.getDay());
      const sat = new Date(currentDate);
      sat.setDate(currentDate.getDate() - currentDate.getDay() + 6);

      const sunMonth = sun.toLocaleDateString([], { month: 'short' });
      const satMonth = sat.toLocaleDateString([], { month: 'short' });

      if (sun.getFullYear() !== sat.getFullYear()) {
        return `${sunMonth} ${sun.getDate()}, ${sun.getFullYear()} – ${satMonth} ${sat.getDate()}, ${sat.getFullYear()}`;
      }
      if (sun.getMonth() !== sat.getMonth()) {
        return `${sunMonth} ${sun.getDate()} – ${satMonth} ${sat.getDate()}, ${year}`;
      }
      return `${month} ${sun.getDate()} – ${sat.getDate()}, ${year}`;
    }

    return `${month} ${year}`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-lg text-primary">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Schedule & Calendar</h1>
          <p className="text-xs text-muted-foreground">
            Manage your personal calendar slots, project tasks, and deadlines.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Navigation Controls */}
        <div className="flex items-center border rounded-lg bg-background p-1 shadow-2xs">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded"
            onClick={onNavigatePrev}
            title="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-3 text-xs font-medium rounded"
            onClick={onNavigateToday}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded"
            onClick={onNavigateNext}
            title="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Date Display */}
        <div className="text-sm font-semibold px-2 min-w-[120px] text-center sm:text-left">
          {getHeaderTitle()}
        </div>

        {/* View Switcher */}
        <div className="flex items-center border rounded-lg bg-background p-1 shadow-2xs">
          {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'secondary' : 'ghost'}
              className="h-8 px-3 text-xs font-medium rounded capitalize"
              onClick={() => onViewModeChange(mode)}
            >
              {mode}
            </Button>
          ))}
        </div>

        {/* Create Action */}
        <Button size="sm" className="h-9 gap-1" onClick={onCreateEventClick}>
          <Plus className="h-4 w-4" />
          <span>Add Event</span>
        </Button>
      </div>
    </div>
  );
}
