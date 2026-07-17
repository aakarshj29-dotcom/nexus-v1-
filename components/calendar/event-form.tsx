'use client';

import * as React from 'react';
import { CreateCalendarEventInput, CalendarEvent, CalendarEventType } from '@/types/calendar';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EventFormProps {
  initialEvent?: CalendarEvent | null;
  projects: Project[];
  onSubmit: (data: CreateCalendarEventInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EventForm({
  initialEvent,
  projects,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EventFormProps) {
  // Setup default times (current hour to next hour)
  const getDefaultTimes = () => {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    // Format for datetime-local input: YYYY-MM-DDTHH:MM
    const tzOffset = start.getTimezoneOffset() * 60000;
    const startLocal = new Date(start.getTime() - tzOffset).toISOString().slice(0, 16);
    const endLocal = new Date(end.getTime() - tzOffset).toISOString().slice(0, 16);

    return { startLocal, endLocal };
  };

  const defaults = getDefaultTimes();

  // Format existing event dates to local datetime input format
  const formatIsoToLocalInput = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const [title, setTitle] = React.useState(initialEvent?.title || '');
  const [description, setDescription] = React.useState(initialEvent?.description || '');
  const [type, setType] = React.useState<CalendarEventType>(initialEvent?.type || 'meeting');
  const [startTime, setStartTime] = React.useState(
    initialEvent ? formatIsoToLocalInput(initialEvent.startTime) : defaults.startLocal
  );
  const [endTime, setEndTime] = React.useState(
    initialEvent ? formatIsoToLocalInput(initialEvent.endTime) : defaults.endLocal
  );
  const [location, setLocation] = React.useState(initialEvent?.location || '');
  const [projectId, setProjectId] = React.useState(initialEvent?.projectId || '');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!startTime) {
      setError('Start time is required.');
      return;
    }

    if (!endTime) {
      setError('End time is required.');
      return;
    }

    const startD = new Date(startTime);
    const endD = new Date(endTime);

    if (endD <= startD) {
      setError('End time must be after start time.');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      startTime: startD.toISOString(),
      endTime: endD.toISOString(),
      location: location.trim() || undefined,
      projectId: projectId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Title</label>
        <Input
          placeholder="e.g. Weekly Planning Sync"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CalendarEventType)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="meeting">Meeting 🤝</option>
            <option value="deadline">Deadline 🚨</option>
            <option value="reminder">Reminder 🔔</option>
            <option value="personal">Personal 👤</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Project (Optional)</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">None</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Start Date & Time</label>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">End Date & Time</label>
          <Input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Location (Optional)</label>
        <Input
          placeholder="e.g. Google Meet, Room 402"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={150}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Description (Optional)</label>
        <textarea
          placeholder="Provide additional details or context..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          maxLength={500}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialEvent ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
}
