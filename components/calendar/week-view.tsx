'use client';

import * as React from 'react';
import { UnifiedCalendarItem } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { Clock, Plus } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  items: UnifiedCalendarItem[];
  onItemClick: (item: UnifiedCalendarItem) => void;
  onDayClick: (date: Date) => void;
}

export function WeekView({
  currentDate,
  items,
  onItemClick,
  onDayClick,
}: WeekViewProps) {
  // Get Sunday of current week
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  // Generate 7 days of the week
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return {
      date: d,
      isToday: isSameDay(d, new Date()),
    };
  });

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  const getItemsForDay = (date: Date) => {
    return items.filter((item) => {
      const itemStart = new Date(item.startTime);
      return isSameDay(itemStart, date);
    });
  };

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4 min-h-[450px]">
      {weekDays.map(({ date, isToday }, idx) => {
        const dayItems = getItemsForDay(date);
        const dayLabel = date.toLocaleDateString([], { weekday: 'short' });
        const dateLabel = date.getDate();

        return (
          <div
            key={idx}
            className={cn(
              "flex flex-col rounded-xl border bg-card p-3 shadow-2xs transition-all",
              isToday ? "ring-2 ring-primary/40 border-primary/40 bg-primary/5" : "border-border"
            )}
          >
            {/* Weekday Header */}
            <div
              onClick={() => onDayClick(date)}
              className="flex items-center justify-between pb-2 mb-3 border-b cursor-pointer group"
            >
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {dayLabel}
                </p>
                <p
                  className={cn(
                    "text-lg font-bold tracking-tight mt-0.5",
                    isToday ? "text-primary" : "text-foreground"
                  )}
                >
                  {dateLabel}
                </p>
              </div>
              <div className="h-6 w-6 rounded-full bg-muted/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-primary/20 hover:text-primary">
                <Plus className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Event List */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[350px] custom-scrollbar pr-0.5">
              {dayItems.length > 0 ? (
                dayItems.map((item) => {
                  const startTimeStr = new Date(item.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className={cn(
                        "rounded-lg border p-2 text-left cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xs",
                        item.type === 'meeting' && "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400",
                        item.type === 'deadline' && "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-400",
                        item.type === 'reminder' && "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-400",
                        item.type === 'personal' && "bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 text-indigo-800 dark:text-indigo-400",
                        item.type === 'task' && "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-400",
                        item.type === 'project_deadline' && "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 text-purple-800 dark:text-purple-400"
                      )}
                    >
                      <p className="text-[10px] font-semibold opacity-80 flex items-center gap-1 mb-0.5">
                        <Clock className="h-3 w-3 inline shrink-0" /> {startTimeStr}
                      </p>
                      <p className="text-xs font-bold leading-tight line-clamp-2">
                        {item.title}
                      </p>
                      {item.projectName && (
                        <p className="text-[9px] font-medium opacity-75 mt-1 line-clamp-1 truncate">
                          📁 {item.projectName}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-[11px] text-muted-foreground text-center py-6">
                  Nothing scheduled
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
