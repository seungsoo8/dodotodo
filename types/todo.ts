export type Priority = 'high' | 'medium' | 'low';
export type FilterStatus = 'all' | 'active' | 'completed';
export type SortOrder = 'manual' | 'priority' | 'dueDate' | 'createdAt';
export type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type Urgency = 'urgent' | 'not-urgent';
export type ViewType = 'list' | 'calendar' | 'matrix' | 'analytics' | 'today' | 'trash' | 'kanban' | 'settings' | 'help' | 'patchnotes' | 'admin' | 'habit' | 'projects' | 'plan';

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
  favorite?: boolean;
}

export interface KanbanColumn {
  id: string;
  label: string;
  emoji: string;
  color: string;
  isCompleted?: boolean;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  urgency: Urgency;
  startDate?: string;
  dueDate?: string;
  dueTime?: string;
  reminderMinutes?: number;
  createdAt: string;
  completedAt?: string;
  category?: string;
  projectId?: string;
  recurring: RecurringType;
  weekDays?: number[];
  subtasks: Subtask[];
  pomodoroCount: number;
  colorTag?: string;
  tags?: string[];
  myDay?: boolean;
  important?: boolean;
  inProgress?: boolean;
  kanbanColumnId?: string;
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
