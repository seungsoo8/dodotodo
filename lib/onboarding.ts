import { Preferences } from '@capacitor/preferences';

const key = (uid: string) => `onboarding_done_${uid}`;

export async function isOnboardingDone(uid: string): Promise<boolean> {
  const { value } = await Preferences.get({ key: key(uid) });
  return value === 'true';
}

export async function markOnboardingDone(uid: string): Promise<void> {
  await Preferences.set({ key: key(uid), value: 'true' });
}
