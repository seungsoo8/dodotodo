import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export async function hapticLight() {
  if (!isNative) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticMedium() {
  if (!isNative) return;
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticSuccess() {
  if (!isNative) return;
  await Haptics.notification({ type: NotificationType.Success });
}
