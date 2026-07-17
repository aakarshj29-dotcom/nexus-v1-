'use client';

import * as React from 'react';
import { CalendarView } from '@/components/calendar/calendar-view';

export default function CalendarPage() {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      <CalendarView />
    </div>
  );
}
