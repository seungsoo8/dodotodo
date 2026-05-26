'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { KanbanColumn, SortOrder } from '@/types/todo';

export interface AppSettings {
  pomodoro: { work: number; break: number };
  notifications: { enabled: boolean; minutesBeforeDue: number; notificationHour: number };
  defaults: { sortOrder: SortOrder };
  views: { matrix: boolean; kanban: boolean; aiChat: boolean };
  kanbanColumns?: KanbanColumn[];
}

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo',       label: '할 일',   emoji: '📋', color: '#6366f1' },
  { id: 'inprogress', label: '진행 중', emoji: '⚡', color: '#f59e0b' },
  { id: 'done',       label: '완료',    emoji: '✅', color: '#10b981', isCompleted: true },
];

const LOCAL_KEY = 'app-settings';

const DEFAULT_SETTINGS: AppSettings = {
  pomodoro: { work: 25, break: 5 },
  notifications: { enabled: true, minutesBeforeDue: 60 * 9, notificationHour: 9 },
  defaults: { sortOrder: 'manual' },
  views: { matrix: false, kanban: false, aiChat: false },
  kanbanColumns: DEFAULT_KANBAN_COLUMNS,
};

function loadLocal(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings(userId: string | null = null, onSaveError?: () => void) {
  const [settings, setSettings] = useState<AppSettings>(loadLocal);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const isFromRemote = useRef(false);

  const [snapshotKey, setSnapshotKey] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const unsub = onSnapshot(
      doc(db, 'users', userId),
      (snap) => {
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
        isFromRemote.current = true;
        if (snap.exists() && snap.data().settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data().settings });
        }
        setLoaded(true);
      },
      (e) => {
        if ((e as any)?.code === 'already-exists') {
          window.location.reload();
          return;
        }
        console.error('Firestore settings snapshot error:', e);
        setLoaded(true);
        retryTimer = setTimeout(() => setSnapshotKey(k => k + 1), 5000);
      }
    );
    return () => { unsub(); if (retryTimer) clearTimeout(retryTimer); };
  }, [userId, snapshotKey]);

  useEffect(() => {
    if (!loaded) return;
    if (isFromRemote.current) {
      isFromRemote.current = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const data = { settings: settingsRef.current };
      if (!userId) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(settingsRef.current));
        return;
      }
      updateDoc(doc(db, 'users', userId), data).catch(() =>
        setDoc(doc(db, 'users', userId), data, { merge: true }).catch((e) => {
          console.error('[Settings] save failed:', e);
          onSaveError?.();
        })
      );
    }, 500);
  }, [settings, userId, loaded]);

  const update = useCallback(<K extends keyof AppSettings>(
    section: K,
    values: Partial<AppSettings[K]>
  ) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], ...values } }));
  }, []);

  const setKanbanColumns = useCallback((columns: KanbanColumn[]) => {
    setSettings(prev => ({ ...prev, kanbanColumns: columns }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (!userId) {
      localStorage.removeItem(LOCAL_KEY);
    }
  }, [userId]);

  return { settings, update, setKanbanColumns, resetSettings };
}
