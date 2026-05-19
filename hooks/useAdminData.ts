import { useEffect, useState } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
  todoCount?: number;
  completedCount?: number;
}

export function useAdminData() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const profiles = usersSnap.docs.map(d => d.data() as UserProfile);

      const withCounts = await Promise.all(profiles.map(async p => {
        try {
          const todosSnap = await getDocs(collection(db, 'users', p.uid, 'todos'));
          const todos = todosSnap.docs.map(d => d.data());
          const active = todos.filter(t => !t.deletedAt);
          return {
            ...p,
            todoCount: active.length,
            completedCount: active.filter(t => t.completed).length,
          };
        } catch {
          return { ...p, todoCount: 0, completedCount: 0 };
        }
      }));

      setUsers(withCounts.sort((a, b) => {
        const aTime = (a.lastLoginAt as unknown as { seconds: number })?.seconds ?? 0;
        const bTime = (b.lastLoginAt as unknown as { seconds: number })?.seconds ?? 0;
        return bTime - aTime;
      }));
    } catch (e) {
      setError('데이터를 불러올 수 없어요. Firestore 규칙을 확인해주세요.');
      console.error('[AdminData] load failed:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { users, loading, error, refresh: load };
}
