export type CalendarEventType = 'meeting' | 'deadline' | 'reminder' | 'personal';

export interface CalendarEvent {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601 UTC string
  endTime: string;   // ISO 8601 UTC string
  type: CalendarEventType;
  location?: string;
  projectId?: string;
  workspaceId?: string;
  createdAt: string; // ISO 8601 UTC string
  updatedAt: string; // ISO 8601 UTC string
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: CalendarEventType;
  location?: string;
  projectId?: string;
  workspaceId?: string;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  type?: CalendarEventType;
  location?: string;
  projectId?: string;
  workspaceId?: string;
}

export type UnifiedCalendarItemType = CalendarEventType | 'task' | 'project_deadline';

export interface UnifiedCalendarItem {
  id: string; // unique for the UI, e.g. `event-${id}` or `task-${id}`
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  type: UnifiedCalendarItemType;
  location?: string;
  projectId?: string;
  projectName?: string; // Cache for UI display
  color?: string;       // Color theme (e.g., from project or event type preset)
  originalId: string;   // Original Firestore document ID
  originalType: 'event' | 'task' | 'project';
  status?: string;      // Task status (todo, completed, etc.) if originalType is 'task'
}
