'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  UnifiedCalendarItem,
} from '@/types/calendar';
import { calendarService } from '@/firebase/calendar-service';
import { db, collection, query, where, onSnapshot } from '@/firebase/firestore';
import { useTasks } from './use-tasks';
import { useProjects } from './use-projects';

interface UseCalendarOptions {
  startDate?: Date;
  endDate?: Date;
}

export function useCalendar(options: UseCalendarOptions = {}) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [calendarError, setCalendarError] = useState<Error | null>(null);

  // Hook up to tasks and projects
  const { tasks, loading: loadingTasks, error: tasksError } = useTasks();
  const { projects, loading: loadingProjects, error: projectsError } = useProjects();

  const { startDate, endDate } = options;

  // Subscribe to custom calendar events
  useEffect(() => {
    if (!user?.uid) {
      setEvents([]);
      setLoadingEvents(false);
      return;
    }

    setLoadingEvents(true);

    const q = query(
      collection(db, 'events'),
      where('ownerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedEvents: CalendarEvent[] = [];
        snapshot.forEach((docSnap) => {
          fetchedEvents.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as CalendarEvent);
        });
        setEvents(fetchedEvents);
        setLoadingEvents(false);
        setCalendarError(null);
      },
      (err) => {
        console.error('Events subscription error:', err);
        setCalendarError(err instanceof Error ? err : new Error('Failed to load calendar events'));
        setLoadingEvents(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Combine calendar events, tasks (derived), and project deadlines (derived)
  const unifiedItems = useMemo(() => {
    const items: UnifiedCalendarItem[] = [];

    // 1. Process custom calendar events
    events.forEach((evt) => {
      const proj = projects.find((p) => p.id === evt.projectId);
      items.push({
        id: `event-${evt.id}`,
        title: evt.title,
        description: evt.description,
        startTime: evt.startTime,
        endTime: evt.endTime,
        type: evt.type,
        location: evt.location,
        projectId: evt.projectId,
        projectName: proj?.title || '',
        color: proj?.color || undefined,
        originalId: evt.id,
        originalType: 'event',
      });
    });

    // 2. Process tasks with due dates (derived calendar items)
    tasks.forEach((task) => {
      if (!task.dueDate) return;

      // Ensure standard start/end time. Since tasks usually have a due date/deadline,
      // we can represent them as a 30-minute block or a full day event.
      // Let's model it as starting at the task's due date and ending 30 minutes later.
      const start = new Date(task.dueDate);
      const end = new Date(start.getTime() + 30 * 60 * 1000); // +30 minutes

      const proj = projects.find((p) => p.id === task.projectId);

      items.push({
        id: `task-${task.id}`,
        title: `Task: ${task.title}`,
        description: task.description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: 'task',
        projectId: task.projectId,
        projectName: task.projectName || proj?.title || '',
        color: proj?.color || '#3b82f6', // Task color matches project color or default blue
        originalId: task.id,
        originalType: 'task',
        status: task.status,
      });
    });

    // 3. Process project deadlines if they have any (e.g. if projects have any optional dueDate field)
    projects.forEach((proj) => {
      const projDoc = proj as unknown as Record<string, unknown>;
      const projDueDate = projDoc.dueDate || projDoc.deadline;
      if (!projDueDate || typeof projDueDate !== 'string') return;

      const start = new Date(projDueDate);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

      items.push({
        id: `project-${proj.id}`,
        title: `Project Deadline: ${proj.title}`,
        description: proj.description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: 'project_deadline',
        projectId: proj.id,
        projectName: proj.title,
        color: proj.color || '#ef4444',
        originalId: proj.id,
        originalType: 'project',
      });
    });

    // In-memory Filter based on options.startDate and options.endDate
    let filteredItems = items;
    if (startDate) {
      filteredItems = filteredItems.filter(
        (item) => new Date(item.endTime) >= startDate
      );
    }
    if (endDate) {
      filteredItems = filteredItems.filter(
        (item) => new Date(item.startTime) <= endDate
      );
    }

    // Sort chronologically
    filteredItems.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return filteredItems;
  }, [events, tasks, projects, startDate, endDate]);

  // Combined Loading & Error states
  const loading = loadingEvents || loadingTasks || loadingProjects;
  const error = calendarError || tasksError || projectsError;

  // CRUD operation wrappers
  const createEvent = async (input: CreateCalendarEventInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      return await calendarService.createEvent(user.uid, input);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to create event');
      setCalendarError(errorObj);
      throw errorObj;
    }
  };

  const updateEvent = async (eventId: string, input: UpdateCalendarEventInput) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await calendarService.updateEvent(eventId, user.uid, input);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to update event');
      setCalendarError(errorObj);
      throw errorObj;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user?.uid) throw new Error('User must be authenticated.');
    try {
      await calendarService.deleteEvent(eventId, user.uid);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to delete event');
      setCalendarError(errorObj);
      throw errorObj;
    }
  };

  return {
    events,
    tasks,
    projects,
    unifiedItems,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
