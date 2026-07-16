import { DashboardData } from '@/types/dashboard';

// Mock data for initial implementation
const MOCK_DASHBOARD_DATA: DashboardData = {
  projects: [
    {
      id: '1',
      name: 'Nexus V1 Redesign',
      status: 'active',
      updatedAt: new Date().toISOString(),
      memberCount: 5,
      color: '#6366f1',
    },
    {
      id: '2',
      name: 'Mobile App Development',
      status: 'active',
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      memberCount: 3,
      color: '#10b981',
    },
    {
      id: '3',
      name: 'Marketing Campaign',
      status: 'on-hold',
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      memberCount: 2,
      color: '#f59e0b',
    },
  ],
  tasks: [
    {
      id: '1',
      title: 'Implement dashboard widgets',
      status: 'in-progress',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      projectName: 'Nexus V1 Redesign',
    },
    {
      id: '2',
      title: 'Fix authentication bugs',
      status: 'todo',
      priority: 'urgent',
      dueDate: new Date().toISOString(),
      projectName: 'Nexus V1 Redesign',
    },
    {
      id: '3',
      title: 'Design system updates',
      status: 'completed',
      priority: 'medium',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      projectName: 'Nexus V1 Redesign',
    },
    {
      id: '4',
      title: 'User interview prep',
      status: 'todo',
      priority: 'low',
      dueDate: new Date(Date.now() + 172800000).toISOString(),
    },
  ],
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
      title: 'Launch Strategy',
      excerpt: 'The primary focus for the Q4 launch is on user acquisition and...',
      updatedAt: new Date().toISOString(),
      tags: ['marketing', 'strategy'],
    },
    {
      id: '2',
      title: 'Technical Debt',
      excerpt: 'List of areas requiring refactoring after the V1 release...',
      updatedAt: new Date(Date.now() - 432000000).toISOString(),
    },
  ],
  stats: {
    completedTasks: 12,
    totalTasks: 20,
    productivityScore: 75,
    weeklyActivity: [40, 60, 45, 90, 75, 30, 20],
  },
};

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In the future, this will fetch from Firestore
    return MOCK_DASHBOARD_DATA;
  },

  async getRecentProjects(limit = 5) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_DASHBOARD_DATA.projects.slice(0, limit);
  },

  async getMyTasks(limit = 10) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_DASHBOARD_DATA.tasks.slice(0, limit);
  },
};
