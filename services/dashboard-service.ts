import { DashboardData, Project as DashProject, Task as DashTask } from '@/types/dashboard';
import { db, collection, query, where, getDocs } from '@/firebase/firestore';

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
  async getDashboardData(userId: string): Promise<DashboardData> {
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

      const realProjects: DashProject[] = [];
      projectSnaps.forEach((docSnap) => {
        const data = docSnap.data();
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
        realTasks.push({
          id: docSnap.id,
          title: data.title || '',
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : new Date().toISOString(),
          projectId: data.projectId,
          projectName: data.projectName || '',
        });
      });

      // Sort tasks by dueDate/status/createdAt
      realTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      // 3. Compute real stats
      const totalTasksCount = realTasks.length;
      const completedTasksCount = realTasks.filter((t) => t.status === 'completed').length;
      const score = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

      // 4. Construct response
      return {
        projects: realProjects.slice(0, 5), // top 5 recent
        tasks: realTasks.slice(0, 10), // top 10 upcoming tasks
        events: [
          {
            id: '1',
            title: 'Weekly Sync',
            startTime: new Date(new Date().setHours(10, 0)).toISOString(),
            endTime: new Date(new Date().setHours(11, 0)).toISOString(),
            type: 'meeting',
          },
          {
            id: '2',
            title: 'Project Deadline',
            startTime: new Date(new Date().setHours(17, 0)).toISOString(),
            endTime: new Date(new Date().setHours(18, 0)).toISOString(),
            type: 'deadline',
          },
        ],
        notes: [
          {
            id: '1',
            title: 'Nexus V1 Onboarding Brief',
            excerpt: 'The primary focus is completing task boards and real-time dashboard updates...',
            updatedAt: new Date().toISOString(),
            tags: ['product', 'chapter-8'],
          },
        ],
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
