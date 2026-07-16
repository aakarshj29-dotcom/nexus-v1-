export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'archived';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  updatedAt: string;
  color?: string;
  memberCount: number;
}

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  projectId?: string;
  projectName?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'deadline' | 'reminder' | 'personal';
  location?: string;
}

export interface Note {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  tags?: string[];
}

export interface ProductivityStats {
  completedTasks: number;
  totalTasks: number;
  productivityScore: number;
  weeklyActivity: number[]; // 7 days of activity levels
}

export interface DashboardData {
  projects: Project[];
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
  stats: ProductivityStats;
}
