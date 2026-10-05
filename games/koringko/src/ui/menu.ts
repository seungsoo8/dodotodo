/** 메뉴 글: 멈춤 메뉴의 「지금 할 일」 · 기기에 맞는 조작 안내 */

const ABILITY: Record<string, string> = {
  toby: '토비 — 태엽을 나눠 줄 수 있어',
  bori: '보리 — 무거운 것을 밀 수 있어',
  ruru: '루루 — 밧줄을 걸어 높은 데로',
  nabi: '나비 — 등불로 어두운 곳을 밝혀',
};

/** 지금 목표 한 줄 + 함께하는 친구마다 할 수 있는 일 */
export function todoLines(goal: string | null, party: readonly string[]): string[] {
  const out = [goal ?? '둘러보며 살펴보자'];
  for (const h of party) if (ABILITY[h]) out.push(ABILITY[h]);
  return out;
}

/** 타이틀 아래 조작 안내: 손가락 기기에는 키 글자를 쓰지 않는다 */
export function controlsLine(touch: boolean): string {
  return touch ? '왼쪽을 끌어 걷기 · 오른쪽을 눌러 살펴보기 · 꾹 누르면 대사 빨리' : '방향키 걷기 · Z 살펴보기/넘기기 (꾹: 빨리) · Esc 멈춤';
}
