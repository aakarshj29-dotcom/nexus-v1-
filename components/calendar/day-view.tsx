'use client';

import * as React from 'react';
import { UnifiedCalendarItem } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { Clock, MapPin, Tag, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DayViewProps {
  currentDate: Date;
  items: UnifiedCalendarItem[];
  onItemClick: (item: UnifiedCalendarItem) => void;
  onDayClick: (date: Date) => void;
}

export function DayView({
  currentDate,
  items,
  onItemClick,
  onDayClick,
}: DayViewProps) {
  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  // Get items occurring today
  const dayItems = React.useMemo(() => {
    return items.filter((item) => isSameDay(new Date(item.startTime), currentDate));
  }, [items, currentDate]);

  // Generate 24 hours (12 AM to 11 PM) for scheduling
  const hours = Array.from({ length: 24 }).map((_, i) => i);

  // Filter items matching a specific hour index (0 to 23)
  const getItemsForHour = (hour: number) => {
    return dayItems.filter((item) => {
      const itemStart = new Date(item.startTime);
      return itemStart.getHours() === hour;
    });
  };

  const formatHourLabel = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6">
      {/* Left panel: Quick Summary Card */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-2">
            Day Summary
          </h3>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {currentDate.toLocaleDateString([], { day: 'numeric', month: 'long' })}
          </p>
          <p className="text-sm font-medium text-muted-foreground capitalize mt-0.5">
            {currentDate.toLocaleDateString([], { weekday: 'long' })}
          </p>

          <div className="border-t border-dashed my-4" />

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Total Items Scheduled:</span>
              <span className="font-bold text-foreground">{dayItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Meetings:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {dayItems.filter((i) => i.type === 'meeting').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Work Tasks:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {dayItems.filter((i) => i.type === 'task').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Deadlines:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {dayItems.filter((i) => i.type === 'deadline' || i.type === 'project_deadline').length}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            className="w-full mt-4 h-9 gap-1"
            onClick={() => onDayClick(currentDate)}
          >
            <Plus className="h-4 w-4" /> Add Event for Today
          </Button>
        </div>

        {/* Mini scroll of items occurring today */}
        <div className="rounded-xl border bg-card p-4 shadow-2xs flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">
            Timeline List
          </h4>
          {dayItems.length > 0 ? (
            <div className="space-y-3">
              {dayItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="group flex gap-2.5 items-start p-2 rounded-lg border border-border bg-background hover:bg-muted/30 cursor-pointer transition-all"
                >
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full mt-1 shrink-0",
                      item.type === 'meeting' && "bg-emerald-500",
                      item.type === 'deadline' && "bg-rose-500",
                      item.type === 'reminder' && "bg-amber-500",
                      item.type === 'personal' && "bg-indigo-500",
                      item.type === 'task' && "bg-blue-500",
                      item.type === 'project_deadline' && "bg-purple-500"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate group-hover:text-primary">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 inline" />
                      {new Date(item.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">
              No items for this day.
            </p>
          )}
        </div>
      </div>

      {/* Right panel: Vertical hour-by-hour timeline schedule */}
      <div className="flex-1 rounded-xl border bg-card p-4 shadow-2xs max-h-[600px] overflow-y-auto custom-scrollbar">
        <div className="divide-y divide-border">
          {hours.map((hour) => {
            const hourItems = getItemsForHour(hour);

            return (
              <div key={hour} className="flex min-h-[64px] group/row">
                {/* Hour Label */}
                <div className="w-16 shrink-0 text-right pr-4 py-2 text-xs font-medium text-muted-foreground select-none">
                  {formatHourLabel(hour)}
                </div>

                {/* Hour Grid Area */}
                <div className="flex-1 pl-4 border-l relative py-2 flex flex-col gap-1.5 justify-center min-w-0 group-hover/row:bg-muted/10 transition-colors">
                  {hourItems.length > 0 ? (
                    hourItems.map((item) => {
                      const startLocalTime = new Date(item.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endLocalTime = new Date(item.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={item.id}
                          onClick={() => onItemClick(item)}
                          className={cn(
                            "rounded-lg border p-2 text-left cursor-pointer transition-all hover:scale-[1.01] hover:shadow-2xs flex items-start gap-2.5",
                            item.type === 'meeting' && "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400",
                            item.type === 'deadline' && "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-400",
                            item.type === 'reminder' && "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-400",
                            item.type === 'personal' && "bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 text-indigo-800 dark:text-indigo-400",
                            item.type === 'task' && "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-400",
                            item.type === 'project_deadline' && "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 text-purple-800 dark:text-purple-400"
                          )}
                        >
                          {item.originalType === 'task' && item.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                          ) : (
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full mt-1.5 shrink-0",
                                item.type === 'meeting' && "bg-emerald-500",
                                item.type === 'deadline' && "bg-rose-500",
                                item.type === 'reminder' && "bg-amber-500",
                                item.type === 'personal' && "bg-indigo-500",
                                item.type === 'task' && "bg-blue-500",
                                item.type === 'project_deadline' && "bg-purple-500"
                              )}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold leading-tight">{item.title}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="h-3 w-3 shrink-0" /> {startLocalTime} – {endLocalTime}
                              </span>
                              {item.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 shrink-0" /> {item.location}
                                </span>
                              )}
                              {item.projectName && (
                                <span className="flex items-center gap-1 font-semibold text-[10px] uppercase text-muted-foreground/80">
                                  <Tag className="h-3 w-3 shrink-0" /> {item.projectName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground/30 opacity-0 group-hover/row:opacity-100 select-none transition-opacity">
                      No schedule entries
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
