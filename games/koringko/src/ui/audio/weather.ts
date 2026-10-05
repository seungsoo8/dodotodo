/** 빗소리 세기: 방의 날씨만 따른다 (꾸밈 이름과 무관) */

/** 창밖에 비가 보이는 안쪽 방: 유리 너머로 먹먹하게 */
export const INDOOR_RAIN = 0.45;

interface RainRoom {
  rain?: boolean;
  furniture?: readonly { kind: string }[];
}

/** 1 = 비 맞는 곳 · INDOOR_RAIN = 창밖에 비 (window:rain) · 0 = 고요 */
export function rainLevelOf(room: RainRoom | null | undefined): number {
  if (!room) return 0;
  if (room.rain) return 1;
  return room.furniture?.some((f) => f.kind === 'window:rain') ? INDOOR_RAIN : 0;
}
