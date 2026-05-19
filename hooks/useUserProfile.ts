import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserProfile {
  nickname: string;
  profileIcon: string;
}

export function useUserProfile(uid: string) {
  const [profile, setProfile] = useState<UserProfile>({ nickname: '', profileIcon: '' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setProfile({
          nickname: d.nickname ?? '',
          profileIcon: d.profileIcon ?? '',
        });
      }
      setLoaded(true);
    });
  }, [uid]);

  async function saveProfile(nickname: string, profileIcon: string) {
    await updateDoc(doc(db, 'users', uid), { nickname, profileIcon });
  }

  return { profile, loaded, saveProfile };
}
