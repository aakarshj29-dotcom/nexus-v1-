'use client';

import * as React from 'react';
import { UnifiedCalendarItem } from '@/types/calendar';
import { cn } from '@/lib/utils';
import { Clock, MapPin, Tag, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface AgendaViewProps {
  items: UnifiedCalendarItem[];
  onItemClick: (item: UnifiedCalendarItem) => void;
}

export function AgendaView({ items, onItemClick }: AgendaViewProps) {
  // Group items by date string (YYYY-MM-DD)
  const groupedItems = React.useMemo(() => {
    const groups: { [key: string]: UnifiedCalendarItem[] } = {};

    items.forEach((item) => {
      // Get local date string YYYY-MM-DD
      const d = new Date(item.startTime);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    // Sort group keys chronologically
    const sortedKeys = Object.keys(groups).sort();

    return sortedKeys.map((key) => {
      const parts = key.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

      return {
        dateKey: key,
        date: d,
        items: groups[key].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ),
      };
    });
  }, [items]);

  const formatDateLabel = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }

    if (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    ) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getBadgeStyles = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400';
      case 'deadline':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400';
      case 'reminder':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'personal':
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400';
      case 'task':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400';
      case 'project_deadline':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-neutral-500/10 border-neutral-500/20 text-neutral-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 max-w-4xl mx-auto w-full min-h-[400px]">
      {groupedItems.length > 0 ? (
        groupedItems.map(({ date, items: dayItems }) => (
          <div key={date.toISOString()} className="space-y-3">
            {/* Date Group Header */}
            <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xs py-1 flex items-baseline gap-2 border-b">
              <span className="text-sm font-extrabold text-foreground tracking-tight">
                {formatDateLabel(date)}
              </span>
              <span className="text-xs text-muted-foreground font-semibold uppercase">
                {date.toLocaleDateString([], { year: 'numeric', month: 'long' })}
              </span>
            </div>

            {/* Items inside Date Group */}
            <div className="space-y-3 pl-1">
              {dayItems.map((item) => {
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
                    className="group border border-border bg-card hover:bg-muted/30 transition-all rounded-xl p-4 cursor-pointer flex items-start sm:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {item.originalType === 'task' && item.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-0 shrink-0" />
                      ) : (
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full mt-1.5 sm:mt-0 shrink-0",
                            item.type === 'meeting' && "bg-emerald-500",
                            item.type === 'deadline' && "bg-rose-500",
                            item.type === 'reminder' && "bg-amber-500",
                            item.type === 'personal' && "bg-indigo-500",
                            item.type === 'task' && "bg-blue-500",
                            item.type === 'project_deadline' && "bg-purple-500"
                          )}
                        />
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors text-sm sm:text-base">
                            {item.title}
                          </p>
                          <span
                            className={cn(
                              "inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold w-fit",
                              getBadgeStyles(item.type)
                            )}
                          >
                            {item.type}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-2xl">
                            {item.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-[11px]">
                            <Clock className="h-3.5 w-3.5 shrink-0" /> {startLocalTime} – {endLocalTime}
                          </span>
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" /> {item.location}
                            </span>
                          )}
                          {item.projectName && (
                            <span className="flex items-center gap-1 font-bold text-[10px] uppercase text-muted-foreground/80 bg-secondary px-2 py-0.5 rounded-full border border-border">
                              <Tag className="h-3 w-3 shrink-0" /> {item.projectName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-muted-foreground group-hover:text-primary transition-all shrink-0">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 text-center max-w-md mx-auto flex flex-col items-center justify-center space-y-4 my-8">
          <div className="p-3 bg-muted rounded-full">
            <HelpCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-lg">No Items Scheduled</h3>
            <p className="text-sm text-muted-foreground mt-1">
              There are no meetings, reminders, task deadlines, or personal slots in this visible range.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
