'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { EventForm } from './event-form';
import { CreateCalendarEventInput, CalendarEvent } from '@/types/calendar';
import { Project } from '@/types/project';

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEvent?: CalendarEvent | null;
  projects: Project[];
  onSubmit: (data: CreateCalendarEventInput) => Promise<void>;
}

export function EventModal({
  open,
  onOpenChange,
  initialEvent,
  projects,
  onSubmit,
}: EventModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: CreateCalendarEventInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (err) {
      console.error('Error submitting event form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialEvent ? 'Edit Calendar Event' : 'Create New Event'}</DialogTitle>
          <DialogDescription>
            {initialEvent
              ? 'Modify details for your scheduled calendar event.'
              : 'Add a new custom meeting, deadline, reminder, or personal block.'}
          </DialogDescription>
        </DialogHeader>
        <EventForm
          initialEvent={initialEvent}
          projects={projects}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
