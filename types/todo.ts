export type Priority = 'high' | 'medium' | 'low';
export type FilterStatus = 'all' | 'active' | 'completed';
export type SortOrder = 'manual' | 'priority' | 'dueDate' | 'createdAt';
export type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly';
export type Urgency = 'urgent' | 'not-urgent';
export type ViewType = 'list' | 'calendar' | 'matrix' | 'analytics' | 'today' | 'trash' | 'kanban' | 'settings' | 'help' | 'patchnotes' | 'admin' | 'habit';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  urgency: Urgency;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  category?: string;
  projectId?: string;
  recurring: RecurringType;
  subtasks: Subtask[];
  pomodoroCount: number;
  tags?: string[];
  myDay?: boolean;
  inProgress?: boolean;
  deletedAt?: string;
  xp?: number;
}

export interface DailyCompletion {
  date: string;
  count: number;
}

export interface WeeklyData {
  day: string;
  completed: number;
  date: string;
}
