import { useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Todo } from '@/types/todo';

const NOTIF_KEY = 'todos-notif-date';
const DEBOUNCE_MS = 2000;

export function useNotifications(todos: Todo[], notificationHour = 9) {
  const scheduledIds = useRef<Set<number>>(new Set());
  const sentWebRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSignatureRef = useRef('');

  useEffect(() => {
    if (todos.length === 0) return;

    // 마감일이 있는 미완료 할 일만 변경 감지 대상으로 삼아 불필요한 재등록 방지
    const signature = todos
      .filter(t => !t.completed && t.dueDate)
      .map(t => `${t.id}:${t.dueDate}`)
      .sort()
      .join('|');

    if (signature === prevSignatureRef.current) return;
    prevSignatureRef.current = signature;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (Capacitor.isNativePlatform()) {
        scheduleNativeNotifications(todos, scheduledIds.current, notificationHour).then(ids => {
          scheduledIds.current = ids;
        });
      } else {
        scheduleWebNotifications(todos, sentWebRef, notificationHour);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [todos, notificationHour]);
}

function scheduleWebNotifications(todos: Todo[], sentRef: React.MutableRefObject<boolean>, notificationHour = 9) {
  if (sentRef.current) return;
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  const today = new Date().toISOString().slice(0, 10);
  const lastSent = localStorage.getItem(NOTIF_KEY);
  if (lastSent === today) { sentRef.current = true; return; }

  const nowHour = new Date().getHours();
  if (nowHour < notificationHour) return;

  const send = () => {
    sentRef.current = true;
    localStorage.setItem(NOTIF_KEY, today);
    const dueTodayTodos = todos.filter(t => !t.completed && !t.deletedAt && t.dueDate === today);
    const overdueTodos = todos.filter(t => !t.completed && !t.deletedAt && t.dueDate && t.dueDate < today);
    if (dueTodayTodos.length > 0) {
      new Notification('📋 오늘 마감 할 일', {
        body: dueTodayTodos.map(t => t.title).slice(0, 3).join(', '),
        icon: '/icon.png',
      });
    }
    if (overdueTodos.length > 0) {
      new Notification('⚠️ 기한 초과 할 일', {
        body: `${overdueTodos.length}개의 할 일이 기한을 넘겼습니다.`,
        icon: '/icon.png',
      });
    }
  };

  if (Notification.permission === 'granted') send();
  else if (Notification.permission === 'default') {
    Notification.requestPermission().then(p => { if (p === 'granted') send(); });
  }
}

async function scheduleNativeNotifications(todos: Todo[], prevIds: Set<number>, notificationHour = 9): Promise<Set<number>> {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return prevIds;

    if (prevIds.size > 0) {
      await LocalNotifications.cancel({ notifications: [...prevIds].map(id => ({ id })) });
    }

    const now = new Date();
    const newIds = new Set<number>();
    const toSchedule: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];

    for (const todo of todos) {
      if (todo.completed || !todo.dueDate || todo.deletedAt) continue;

      // dueTime + reminderMinutes 기반 정밀 알림
      if (todo.dueTime && todo.reminderMinutes !== undefined) {
        const dueDateTime = new Date(`${todo.dueDate}T${todo.dueTime}:00`);
        const reminderAt = new Date(dueDateTime.getTime() - todo.reminderMinutes * 60 * 1000);
        if (reminderAt > now) {
          const id = Math.abs(hashCode(todo.id + '_reminder')) % 2000000000;
          const label = todo.reminderMinutes === 0 ? '⏰ 지금 마감' : todo.reminderMinutes < 60
            ? `⏰ ${todo.reminderMinutes}분 후 마감`
            : todo.reminderMinutes === 60 ? '⏰ 1시간 후 마감' : '⏰ 내일 마감';
          toSchedule.push({ id, title: label, body: todo.title, schedule: { at: reminderAt }, smallIcon: 'ic_stat_icon' });
          newIds.add(id);
        }
        continue;
      }

      // 기존 방식: notificationHour 기준 당일 + 전날 알림
      const hourStr = String(notificationHour).padStart(2, '0');
      const due = new Date(`${todo.dueDate}T${hourStr}:00:00`);
      const dayBefore = new Date(`${todo.dueDate}T${hourStr}:00:00`);
      dayBefore.setDate(dayBefore.getDate() - 1);

      if (due > now) {
        const id = Math.abs(hashCode(todo.id + '_due')) % 2000000000;
        toSchedule.push({ id, title: '📋 오늘 마감', body: todo.title, schedule: { at: due }, smallIcon: 'ic_stat_icon' });
        newIds.add(id);
      }
      if (dayBefore > now) {
        const id = Math.abs(hashCode(todo.id + '_pre')) % 2000000000;
        toSchedule.push({ id, title: '⏰ 내일 마감 예정', body: todo.title, schedule: { at: dayBefore }, smallIcon: 'ic_stat_icon' });
        newIds.add(id);
      }
    }

    if (toSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: toSchedule });
    }

    return newIds;
  } catch {
    return prevIds;
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}
