'use client';

import { CalendarEvent } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as React from 'react';

interface CalendarPreviewProps {
  events: CalendarEvent[] | undefined;
  loading: boolean;
}

export function CalendarPreview({ events, loading }: CalendarPreviewProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border shadow-none w-full flex justify-center"
        />

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Upcoming Today</h4>
          {events && events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                    {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-muted-foreground py-4">No events scheduled today.</p>
          )}
          <Button variant="outline" className="w-full">Open Calendar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
