import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';
import { useEffect, useRef } from 'react';
import type { Todo } from '@/types/todo';

interface WidgetDataPlugin {
  setTodos(options: { todosJson: string }): Promise<void>;
}
const WidgetData = registerPlugin<WidgetDataPlugin>('WidgetData');

export function useWidgetSync(todos: Todo[]) {
  const prevHashRef = useRef<string>('');

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const completedToday = todos.filter(t => {
      if (!t.completedAt || t.deletedAt) return false;
      const d = new Date(t.completedAt);
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return local === todayStr;
    }).length;

    const widgetTodos = todos
      .filter(t => !t.deletedAt && !t.completed)
      .map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        priority: t.priority,
        urgency: t.urgency,
        dueDate: t.dueDate,
      }));

    const payload = { todos: widgetTodos, completedToday };
    const hash = JSON.stringify(payload);
    if (hash === prevHashRef.current) return;
    prevHashRef.current = hash;

    WidgetData.setTodos({ todosJson: hash }).catch((e) => {
      console.error('[WidgetSync] setTodos failed:', e);
    });
  }, [todos]);
}
