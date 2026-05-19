'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Project } from '@/types/todo';

const LOCAL_KEY = 'todos-projects';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const DEFAULT_PROJECTS: Project[] = [
  { id: 'work', name: '업무', color: '#6366f1', icon: '💼' },
  { id: 'personal', name: '개인', color: '#10b981', icon: '🏠' },
  { id: 'study', name: '학습', color: '#f59e0b', icon: '📚' },
];

export function useProjects(userId: string | null = null) {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const isFromRemote = useRef(false);

  const [snapshotKey, setSnapshotKey] = useState(0);

  useEffect(() => {
    if (!userId) {
      try {
        const s = localStorage.getItem(LOCAL_KEY);
        if (s) setProjects(JSON.parse(s));
      } catch { /* ignore */ }
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
        if (snap.exists() && snap.data().projects) {
          setProjects(snap.data().projects as Project[]);
        } else {
          setProjects(DEFAULT_PROJECTS);
        }
        setLoaded(true);
      },
      (e) => {
        console.error('Firestore projects snapshot error:', e);
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
      const data = { projects: projectsRef.current };
      if (!userId) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(projectsRef.current));
        return;
      }
      updateDoc(doc(db, 'users', userId), data).catch(() =>
        setDoc(doc(db, 'users', userId), data, { merge: true }).catch(console.error)
      );
    }, 500);
  }, [projects, userId, loaded]);

  const addProject = useCallback((data: Omit<Project, 'id'>) => {
    setProjects(prev => [...prev, { ...data, id: generateId() }]);
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Omit<Project, 'id'>>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  return { projects, addProject, updateProject, deleteProject };
}
