import {
  db,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from './firestore';
import {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@/types/calendar';

const EVENTS_COLLECTION = 'events';

/**
 * Sanitizes input data before writing to Firestore.
 * Removes only 'undefined' values.
 * Preserves null, false, 0, empty strings, empty arrays, and other legitimate values.
 * Safer than Record<string, any> and never mutates the original object.
 */
export function sanitizeEventData<T extends Record<string, unknown>>(data: T): Partial<T> {
  const sanitized: Record<string, unknown> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value !== undefined) {
        sanitized[key] = value;
      }
    }
  }
  return sanitized as Partial<T>;
}

/**
 * Validates the required fields of a calendar event during creation.
 * All required fields must exist, be valid non-empty strings, and end time must be after start time.
 */
export function validateCreateEventData(data: {
  ownerId?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
}) {
  if (!data.ownerId || data.ownerId.trim() === '') {
    throw new Error('Owner ID is required.');
  }
  if (!data.title || data.title.trim() === '') {
    throw new Error('Event title is required.');
  }
  if (!data.startTime || data.startTime.trim() === '') {
    throw new Error('Event start time is required.');
  }
  if (!data.endTime || data.endTime.trim() === '') {
    throw new Error('Event end time is required.');
  }

  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start time format.');
  }
  if (isNaN(end.getTime())) {
    throw new Error('Invalid end time format.');
  }
  if (end <= start) {
    throw new Error('Event end time must be after the start time.');
  }
}

/**
 * Validates specified fields of a calendar event during updates.
 * Supports partial validation for updated fields, and ensures the prospective merged document is valid.
 */
export function validateUpdateEventData(
  existingEvent: { ownerId: string; title: string; startTime: string; endTime: string },
  updates: { title?: string; startTime?: string; endTime?: string }
) {
  // 1. If fields are specified in updates, validate them individually if they are empty
  if (updates.title !== undefined && (!updates.title || updates.title.trim() === '')) {
    throw new Error('Event title cannot be empty.');
  }
  if (updates.startTime !== undefined && (!updates.startTime || updates.startTime.trim() === '')) {
    throw new Error('Event start time cannot be empty.');
  }
  if (updates.endTime !== undefined && (!updates.endTime || updates.endTime.trim() === '')) {
    throw new Error('Event end time cannot be empty.');
  }

  // 2. Validate chronology on prospective merged result
  const prospectiveStartTime = updates.startTime !== undefined ? updates.startTime : existingEvent.startTime;
  const prospectiveEndTime = updates.endTime !== undefined ? updates.endTime : existingEvent.endTime;

  const start = new Date(prospectiveStartTime);
  const end = new Date(prospectiveEndTime);
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start time format.');
  }
  if (isNaN(end.getTime())) {
    throw new Error('Invalid end time format.');
  }
  if (end <= start) {
    throw new Error('Event end time must be after the start time.');
  }
}

export const calendarService = {
  /**
   * Creates a new calendar event for a user.
   */
  async createEvent(userId: string, input: CreateCalendarEventInput): Promise<CalendarEvent> {
    if (!userId) {
      throw new Error('User ID is required to create an event.');
    }

    const eventsRef = collection(db, EVENTS_COLLECTION);
    const now = new Date().toISOString();

    const eventData = {
      ...input,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
    };

    // Validate create payload
    validateCreateEventData(eventData);

    // Sanitize payload to strip undefined fields
    const sanitizedData = sanitizeEventData(eventData as unknown as Record<string, unknown>);

    const docRef = await addDoc(eventsRef, sanitizedData);

    return {
      id: docRef.id,
      ...sanitizedData,
    } as unknown as CalendarEvent;
  },

  /**
   * Retrieves an event by its ID.
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as CalendarEvent;
  },

  /**
   * Updates an existing event.
   */
  async updateEvent(
    eventId: string,
    userId: string,
    input: UpdateCalendarEventInput
  ): Promise<void> {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Event not found.');
    }

    const eventData = docSnap.data() as CalendarEvent;
    if (eventData.ownerId !== userId) {
      throw new Error('You are not authorized to update this event.');
    }

    // Validate updates with respect to existing data
    validateUpdateEventData(eventData, input);

    const now = new Date().toISOString();
    const sanitizedInput = sanitizeEventData({
      ...input,
      updatedAt: now,
    } as Record<string, unknown>);

    await updateDoc(docRef, sanitizedInput);
  },

  /**
   * Deletes an event.
   */
  async deleteEvent(eventId: string, userId: string): Promise<void> {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Event not found.');
    }

    const eventData = docSnap.data() as CalendarEvent;
    if (eventData.ownerId !== userId) {
      throw new Error('You are not authorized to delete this event.');
    }

    await deleteDoc(docRef);
  },

  /**
   * Queries calendar events for a specific user within a date range (startTime/endTime).
   * Range parameters are optional, but recommended for optimization.
   * Dates are ISO strings.
   * Since Firestore requires composite indexes for range query inequality + orderBy,
   * we can query by ownerId, and filter in-memory, or query on ownerId and sort by startTime.
   * Given the likely scale for a single user, fetching all events and filtering in-memory is safe,
   * OR we can query with simple constraints.
   * To keep it robust and index-friendly, we will query on ownerId and do in-memory filtering
   * for the exact date range to avoid needing complex composite indexes.
   */
  async getEventsInRange(
    userId: string,
    startIso?: string,
    endIso?: string
  ): Promise<CalendarEvent[]> {
    if (!userId) return [];

    const eventsRef = collection(db, EVENTS_COLLECTION);
    const q = query(eventsRef, where('ownerId', '==', userId), orderBy('startTime', 'asc'));
    const querySnapshot = await getDocs(q);

    const events: CalendarEvent[] = [];
    querySnapshot.forEach((docSnap) => {
      const event = {
        id: docSnap.id,
        ...docSnap.data(),
      } as CalendarEvent;

      if (startIso && event.endTime < startIso) {
        return; // Event ends before range starts
      }
      if (endIso && event.startTime > endIso) {
        return; // Event starts after range ends
      }

      events.push(event);
    });

    return events;
  },
};
