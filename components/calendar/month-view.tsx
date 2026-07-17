'use client';

import * as React from 'react';
import { UnifiedCalendarItem } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface MonthViewProps {
  currentDate: Date;
  items: UnifiedCalendarItem[];
  onItemClick: (item: UnifiedCalendarItem) => void;
  onDayClick: (date: Date) => void;
}

export function MonthView({
  currentDate,
  items,
  onItemClick,
  onDayClick,
}: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of the month (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Get total days in the current month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  // Get total days in previous month
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  // Compute days grid
  const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // Padding days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, totalDaysInPrevMonth - i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
    });
  }

  // Days of current month
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: isSameDay(d, new Date()),
    });
  }

  // Padding days from next month to fill grid (usually 42 cells total for 6-week view)
  const totalCells = days.length > 35 ? 42 : 35;
  const nextMonthPadding = totalCells - days.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, new Date()),
    });
  }

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  // Filter items that occur on a specific day
  const getItemsForDay = (date: Date) => {
    return items.filter((item) => {
      const itemStart = new Date(item.startTime);
      return isSameDay(itemStart, date);
    });
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col h-full min-h-[500px]">
      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {weekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-7 flex-1 border-r border-b bg-background">
        {days.map(({ date, isCurrentMonth, isToday }, idx) => {
          const dayItems = getItemsForDay(date);

          return (
            <div
              key={idx}
              onClick={() => onDayClick(date)}
              className={cn(
                "min-h-[100px] border-t border-l p-1 flex flex-col justify-between transition-colors hover:bg-muted/30 cursor-pointer group",
                !isCurrentMonth && "bg-muted/10 text-muted-foreground/60"
              )}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between p-1">
                <span
                  className={cn(
                    "text-xs font-semibold flex items-center justify-center h-6 w-6 rounded-full",
                    isToday && "bg-primary text-primary-foreground font-bold",
                    !isCurrentMonth && "text-muted-foreground/60"
                  )}
                >
                  {date.getDate()}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium group-hover:block hidden sm:block">
                    {dayItems.length} {dayItems.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              {/* Items in Cell */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] mt-1 custom-scrollbar">
                {dayItems.slice(0, 3).map((item) => {
                  const itemTime = new Date(item.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid triggering cell click
                        onItemClick(item);
                      }}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border leading-tight truncate transition-all hover:brightness-95 hover:scale-[1.02]",
                        item.type === 'meeting' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                        item.type === 'deadline' && "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400",
                        item.type === 'reminder' && "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
                        item.type === 'personal' && "bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400",
                        item.type === 'task' && "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
                        item.type === 'project_deadline' && "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400"
                      )}
                      title={`${itemTime} - ${item.title}`}
                    >
                      <span className="font-semibold">{itemTime}</span> {item.title}
                    </div>
                  );
                })}
                {dayItems.length > 3 && (
                  <div className="text-[9px] text-muted-foreground text-center font-medium">
                    + {dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
