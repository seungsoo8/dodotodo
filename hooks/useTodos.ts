'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { arrayMove } from '@dnd-kit/sortable';
import { db } from '@/lib/firebase';
import {
  Todo, Priority, FilterStatus, SortOrder,
  RecurringType, DailyCompletion, WeeklyData, Urgency, Project, Subtask,
} from '@/types/todo';

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nextDueDate(dueDate: string, recurring: RecurringType): string | undefined {
  const d = new Date(dueDate + 'T00:00:00');
  if (recurring === 'daily') d.setDate(d.getDate() + 1);
  else if (recurring === 'weekly') d.setDate(d.getDate() + 7);
  else if (recurring === 'monthly') d.setMonth(d.getMonth() + 1);
  else return undefined;
  return d.toISOString().split('T')[0];
}

function migrateTodo(raw: Record<string, unknown>): Todo {
  return {
    urgency: 'not-urgent' as Urgency,
    pomodoroCount: 0,
    ...raw,
  } as Todo;
}

export function useTodos(firebaseUser: User | null = null, projects: Project[] = [], onSaveError?: () => void) {
  const userId = firebaseUser?.uid ?? null;

  const [todos, setTodos] = useState<Todo[]>([]);
  const [history, setHistory] = useState<DailyCompletion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('manual');

  const todosRef = useRef(todos);
  const historyRef = useRef(history);
  todosRef.current = todos;
  historyRef.current = history;

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFromRemote = useRef(false);

  // 실시간 구독 재시도 키 — 에러 시 자동 재구독
  const [snapshotKey, setSnapshotKey] = useState(0);

  // 실시간 구독 (onSnapshot)
  useEffect(() => {
    if (!userId) { setLoaded(false); return; }
    setLoaded(false);
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const unsub = onSnapshot(
      doc(db, 'users', userId),
      (snap) => {
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
        if (snap.exists()) {
          const data = snap.data();
          isFromRemote.current = true;
          setTodos((data.todos ?? []).map(migrateTodo));
          setHistory(data.history ?? []);
        } else {
          isFromRemote.current = true;
          setTodos([]);
          setHistory([]);
        }
        setLoaded(true);
      },
      (e) => {
        if ((e as any)?.code === 'already-exists') {
          window.location.reload();
          return;
        }
        console.error('Firestore snapshot error:', e);
        setLoaded(true);
        // 5초 후 재구독 시도 (permission denied, 네트워크 오류 등)
        retryTimer = setTimeout(() => setSnapshotKey(k => k + 1), 5000);
      }
    );
    return () => { unsub(); if (retryTimer) clearTimeout(retryTimer); };
  }, [userId, snapshotKey]);

  // Debounced save — 원격에서 온 변경은 다시 쓰지 않음
  useEffect(() => {
    if (!userId || !loaded) return;
    if (isFromRemote.current) {
      isFromRemote.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const clean = JSON.parse(JSON.stringify({ todos: todosRef.current, history: historyRef.current }));
      updateDoc(doc(db, 'users', userId), clean).catch(() =>
        setDoc(doc(db, 'users', userId), clean, { merge: true }).catch((e) => {
          console.error('[Todos] save failed:', e);
          onSaveError?.();
        })
      );
    }, 500);
  }, [todos, history, userId, loaded]);

  const recordCompletion = useCallback(() => {
    const today = todayStr();
    setHistory(prev => {
      const existing = prev.find(e => e.date === today);
      return existing
        ? prev.map(e => e.date === today ? { ...e, count: e.count + 1 } : e)
        : [...prev, { date: today, count: 1 }];
    });
  }, []);

  const addTodo = useCallback((data: Omit<Todo, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'subtasks' | 'pomodoroCount'>, initialSubtasks?: Subtask[]) => {
    setTodos(prev => [{
      ...data,
      id: generateId(),
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: initialSubtasks ?? [],
      pomodoroCount: 0,
    }, ...prev]);
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t
    ));
  }, []);

  const restoreTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, deletedAt: undefined } : t
    ));
  }, []);

  const permanentlyDeleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const emptyTrash = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.deletedAt));
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTodos(prev => {
      const todo = prev.find(t => t.id === id);
      if (!todo) return prev;
      const completing = !todo.completed;
      if (completing) recordCompletion();

      const updated = prev.map(t =>
        t.id === id ? { ...t, completed: completing, completedAt: completing ? new Date().toISOString() : undefined } : t
      );

      if (completing && todo.recurring !== 'none' && todo.dueDate) {
        const newDue = nextDueDate(todo.dueDate, todo.recurring);
        if (newDue) {
          const cloned: Todo = {
            ...todo,
            id: generateId(),
            completed: false,
            completedAt: undefined,
            myDay: undefined,
            dueDate: newDue,
            createdAt: new Date().toISOString(),
            pomodoroCount: 0,
            subtasks: todo.subtasks.map(s => ({ ...s, completed: false })),
          };
          return [cloned, ...updated];
        }
      }
      return updated;
    });
  }, [recordCompletion]);

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.map(t =>
      t.completed ? { ...t, deletedAt: new Date().toISOString() } : t
    ));
  }, []);

  const reorderTodos = useCallback((activeId: string, overId: string) => {
    setTodos(prev => {
      const oldIdx = prev.findIndex(t => t.id === activeId);
      const newIdx = prev.findIndex(t => t.id === overId);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }, []);

  const addSubtask = useCallback((todoId: string, title: string) => {
    setTodos(prev => prev.map(t =>
      t.id === todoId
        ? { ...t, subtasks: [...t.subtasks, { id: generateId(), title, completed: false }] }
        : t
    ));
  }, []);

  const toggleSubtask = useCallback((todoId: string, subtaskId: string) => {
    setTodos(prev => prev.map(t =>
      t.id === todoId
        ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) }
        : t
    ));
  }, []);

  const deleteSubtask = useCallback((todoId: string, subtaskId: string) => {
    setTodos(prev => prev.map(t =>
      t.id === todoId
        ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) }
        : t
    ));
  }, []);

  const incrementPomodoro = useCallback((id: string) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, pomodoroCount: (t.pomodoroCount ?? 0) + 1 } : t
    ));
  }, []);

  const bulkComplete = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setTodos(prev => prev.map(t =>
      idSet.has(t.id) && !t.completed
        ? { ...t, completed: true, completedAt: new Date().toISOString() }
        : t
    ));
    for (let i = 0; i < ids.length; i++) recordCompletion();
  }, [recordCompletion]);

  const bulkDelete = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    const deletedAt = new Date().toISOString();
    setTodos(prev => prev.map(t =>
      idSet.has(t.id) ? { ...t, deletedAt } : t
    ));
  }, []);

  const clearAllData = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setTodos([]);
    setHistory([]);
    if (userId) {
      const empty = { todos: [], history: [] };
      updateDoc(doc(db, 'users', userId), empty).catch(() =>
        setDoc(doc(db, 'users', userId), empty, { merge: true }).catch(console.error)
      );
    }
  }, [userId]);

  const filtered = todos.filter(todo => {
    if (todo.deletedAt) return false;
    const q = searchQuery.toLowerCase();
    const projectName = projects.find(p => p.id === todo.projectId)?.name ?? '';
    const matchSearch = !q ||
      todo.title.toLowerCase().includes(q) ||
      todo.description?.toLowerCase().includes(q) ||
      todo.category?.toLowerCase().includes(q) ||
      projectName.toLowerCase().includes(q);
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && !todo.completed) ||
      (filterStatus === 'completed' && todo.completed);
    const matchPriority = filterPriority === 'all' || todo.priority === filterPriority;
    const matchProject = !filterProjectId || todo.projectId === filterProjectId;
    const matchTags = filterTags.length === 0 || filterTags.every(tag => todo.tags?.includes(tag));
    const matchDateFrom = !filterDateFrom || (todo.dueDate ? todo.dueDate >= filterDateFrom : false);
    const matchDateTo = !filterDateTo || (todo.dueDate ? todo.dueDate <= filterDateTo : false);
    return matchSearch && matchStatus && matchPriority && matchProject && matchTags && matchDateFrom && matchDateTo;
  });

  const sortedTodos = sortOrder === 'manual' ? filtered : [...filtered].sort((a, b) => {
    if (sortOrder === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (sortOrder === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  const trashedTodos = todos.filter(t => !!t.deletedAt);

  const allTags = useMemo(() =>
    Array.from(new Set(todos.filter(t => !t.deletedAt).flatMap(t => t.tags ?? []))),
    [todos]
  );

  const stats = {
    total: todos.filter(t => !t.deletedAt).length,
    active: todos.filter(t => !t.completed && !t.deletedAt).length,
    completed: todos.filter(t => t.completed && !t.deletedAt).length,
  };

  const streak = (() => {
    let count = 0;
    const base = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (historyRef.current.find(e => e.date === key && e.count > 0)) count++;
      else break;
    }
    return count;
  })();

  const weeklyData: WeeklyData[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().split('T')[0];
    const entry = history.find(e => e.date === date);
    return { day: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()], completed: entry?.count ?? 0, date };
  });

  return {
    todos: sortedTodos,
    allTodos: todos,
    trashedTodos,
    allTags,
    history,
    loaded,
    stats,
    streak,
    weeklyData,
    searchQuery, setSearchQuery,
    filterStatus, setFilterStatus,
    filterPriority, setFilterPriority,
    filterProjectId, setFilterProjectId,
    filterTags, setFilterTags,
    filterDateFrom, setFilterDateFrom,
    filterDateTo, setFilterDateTo,
    sortOrder, setSortOrder,
    addTodo, updateTodo, deleteTodo,
    restoreTodo, permanentlyDeleteTodo, emptyTrash,
    toggleComplete, clearCompleted, reorderTodos,
    addSubtask, toggleSubtask, deleteSubtask,
    incrementPomodoro, clearAllData,
    bulkComplete, bulkDelete,
  };
}
