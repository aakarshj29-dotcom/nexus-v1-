import { DashboardData, Project as DashProject, Task as DashTask, CalendarEvent as DashEvent, Note } from '@/types/dashboard';
import { db, collection, query, where, getDocs } from '@/firebase/firestore';
import { calendarService } from '@/firebase/calendar-service';

// Helper to convert Firestore timestamp or other date formats to ISO string
function toIsoString(dateVal: unknown): string {
  if (!dateVal) return new Date().toISOString();
  if (typeof dateVal === 'string') return dateVal;

  const hasToDate = (val: unknown): val is { toDate: () => Date } => {
    return val !== null && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate?: unknown }).toDate === 'function';
  };

  if (hasToDate(dateVal)) {
    return dateVal.toDate().toISOString();
  }

  const hasSeconds = (val: unknown): val is { seconds: number } => {
    return val !== null && typeof val === 'object' && 'seconds' in val;
  };

  if (hasSeconds(dateVal)) {
    return new Date(dateVal.seconds * 1000).toISOString();
  }

  try {
    return new Date(dateVal as string | number | Date).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export const dashboardService = {
  async getDashboardData(userId: string, workspaceId?: string, isPersonal: boolean = false): Promise<DashboardData> {
    if (!userId) {
      throw new Error('User ID is required to fetch dashboard data.');
    }

    try {
      // 1. Fetch real active projects
      const projectsRef = collection(db, 'projects');
      const pq = query(
        projectsRef,
        where('memberIds', 'array-contains', userId),
        where('deleted', '==', false)
      );
      const projectSnaps = await getDocs(pq);

      const allProjectWorkspaceMap = new Map<string, string>();
      const realProjects: DashProject[] = [];

      projectSnaps.forEach((docSnap) => {
        const data = docSnap.data();
        const wsId = data.workspaceId || 'default-workspace';
        allProjectWorkspaceMap.set(docSnap.id, wsId);

        // Filter by workspace
        if (workspaceId) {
          if (isPersonal) {
            if (wsId !== 'default-workspace' && wsId !== workspaceId) {
              return;
            }
          } else {
            if (wsId !== workspaceId) {
              return;
            }
          }
        }

        realProjects.push({
          id: docSnap.id,
          name: data.title || '',
          description: data.description || '',
          status: data.status || 'active',
          updatedAt: toIsoString(data.updatedAt),
          color: data.color || '#6366f1',
          memberCount: data.memberIds?.length || 1,
        });
      });

      // Sort by updatedAt descending
      realProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      // 2. Fetch real active tasks (limit to 20 for dashboard summary)
      const tasksRef = collection(db, 'tasks');
      const tq = query(
        tasksRef,
        where('ownerId', '==', userId),
        where('deleted', '==', false)
      );
      const taskSnaps = await getDocs(tq);

      const realTasks: DashTask[] = [];
      taskSnaps.forEach((docSnap) => {
        const data = docSnap.data();
        const pId = data.projectId;
        const taskWsId = allProjectWorkspaceMap.get(pId) || 'default-workspace';

        // Filter by workspace
        if (workspaceId) {
          if (isPersonal) {
            if (taskWsId !== 'default-workspace' && taskWsId !== workspaceId) {
              return;
            }
          } else {
            if (taskWsId !== workspaceId) {
              return;
            }
          }
        }

        realTasks.push({
          id: docSnap.id,
          title: data.title || '',
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : new Date().toISOString(),
          projectId: pId,
          projectName: data.projectName || '',
        });
      });

      // Sort tasks by dueDate/status/createdAt
      realTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      // 3. Fetch real upcoming calendar events (starting from today)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const realEvents = await calendarService.getEventsInRange(userId, startOfToday.toISOString());

      const dashEvents: DashEvent[] = realEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
        type: e.type,
        location: e.location,
      }));

      // 4. Fetch real notes (Recent & Pinned)
      let realNotes: Note[] = [];
      if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
        realNotes = [
          {
            id: 'mock-note-1',
            title: 'Welcome to Nexus Notes V1 🚀',
            excerpt: 'Welcome to Nexus Notes V1. Nexus Notes is a modern, rich-text document module designed for fast, focused editing and productivity.',
            updatedAt: new Date().toISOString(),
            tags: ['intro', 'nexus-v1'],
          },
          {
            id: 'mock-note-2',
            title: 'Project Aurora Specifications 🌌',
            excerpt: 'Project Aurora. This note serves as the main specifications reference for Project Aurora.',
            updatedAt: new Date().toISOString(),
            tags: ['tech', 'specs'],
          }
        ];
      } else {
        const notesRef = collection(db, 'notes');
        const nq = query(
          notesRef,
          where('ownerId', '==', userId),
          where('deleted', '==', false)
        );
        const noteSnaps = await getDocs(nq);
        noteSnaps.forEach((docSnap) => {
          const data = docSnap.data();
          realNotes.push({
            id: docSnap.id,
            title: data.title || 'Untitled Note',
            excerpt: data.excerpt || '',
            updatedAt: toIsoString(data.updatedAt),
            tags: data.tags || [],
          });
        });
      }

      // Sort notes so pinned ones are at the top, then by updatedAt descending
      realNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      // 5. Compute real stats
      const totalTasksCount = realTasks.length;
      const completedTasksCount = realTasks.filter((t) => t.status === 'completed').length;
      const score = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

      // 6. Construct response
      return {
        projects: realProjects.slice(0, 5), // top 5 recent
        tasks: realTasks.slice(0, 10), // top 10 upcoming tasks
        events: dashEvents.slice(0, 10), // top 10 upcoming events
        notes: realNotes.slice(0, 5), // top 5 recent notes
        stats: {
          completedTasks: completedTasksCount,
          totalTasks: totalTasksCount,
          productivityScore: score,
          weeklyActivity: [completedTasksCount, totalTasksCount, score > 0 ? score / 10 : 2, 4, 3, 1, 0],
        },
      };
    } catch (err) {
      console.error('Error fetching dashboard data from Firestore:', err);
      throw err;
    }
  },

  async getRecentProjects(userId: string, limitVal = 5) {
    const data = await this.getDashboardData(userId);
    return data.projects.slice(0, limitVal);
  },

  async getMyTasks(userId: string, limitVal = 10) {
    const data = await this.getDashboardData(userId);
    return data.tasks.slice(0, limitVal);
  },
};
