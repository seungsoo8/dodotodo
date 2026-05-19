import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';

export async function upsertUserProfile(user: User): Promise<void> {
  try {
    const ref = doc(db, 'users', user.uid);
    const existing = await getDoc(ref);

    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      lastLoginAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true });
  } catch (e) {
    console.error('[userProfile] upsert failed:', e);
  }
}
