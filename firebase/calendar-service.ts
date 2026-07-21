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
 * Sanitizes input payloads to ensure no undefined fields are passed to Firestore.
 * Standard optional fields (like description and location) are default-fallback initialized.
 * All other undefined fields are either removed or converted safely.
 */
function sanitizeEventData(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Define default values for standard optional fields to prevent them being undefined.
  const defaults: Record<string, unknown> = {
    description: "",
    location: "",
    attendees: [],
    color: "",
    notes: "",
    recurrence: "",
    reminder: "",
    projectId: "",
    workspaceId: "",
  };

  // Merge defaults first, then apply given fields
  const merged: Record<string, unknown> = { ...defaults, ...data };

  for (const key of Object.keys(merged)) {
    const val = merged[key];
    if (val !== undefined) {
      result[key] = val;
    }
  }

  return result;
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

    const rawEventData = {
      ...input,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
    };

    const eventData = sanitizeEventData(rawEventData);

    const docRef = await addDoc(eventsRef, eventData);

    return {
      id: docRef.id,
      ...eventData,
    } as CalendarEvent;
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

    const now = new Date().toISOString();

    // Dynamically build update payload to preserve any and all properties passed in,
    // while stripping out any properties that are undefined.
    // Standard optional string/array fields are converted to safe defaults if they are undefined or null.
    const updatePayload: Record<string, unknown> = {
      ...input,
      updatedAt: now,
    };

    // Safe fallbacks for known optional fields if they are explicitly passed as undefined or null
    const defaults: Record<string, unknown> = {
      description: "",
      location: "",
      attendees: [],
      color: "",
      notes: "",
      recurrence: "",
      reminder: "",
      projectId: "",
      workspaceId: "",
    };

    for (const key of Object.keys(updatePayload)) {
      if (updatePayload[key] === undefined) {
        if (key in defaults) {
          updatePayload[key] = defaults[key];
        } else {
          delete updatePayload[key];
        }
      } else if (updatePayload[key] === null) {
        if (key in defaults) {
          updatePayload[key] = defaults[key];
        }
      }
    }

    await updateDoc(docRef, updatePayload);
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
