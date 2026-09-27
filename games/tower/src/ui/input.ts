/** 보상 카드가 뜬 뒤 입력을 받기까지 (카드를 보기 전에 눌린 입력을 막는다) */
export const CHOICE_INPUT_DELAY = 0.4;
/** 결과 화면이 뜬 뒤 넘길 수 있기까지 (창이 다 뜬 뒤) */
export const END_INPUT_DELAY = 1.2;

/**
 * 단축키를 물리 키 위치로 읽는다. 한글 입력 상태에서는 Q 가 'ㅂ' 으로 들어오므로
 * KeyQ → 'q', Digit1·Numpad1 → '1', 그 밖의 키는 원래 이름.
 */
export function normalizeKey(code: string, key: string): string {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^(Digit|Numpad)[0-9]$/.test(code)) return code.slice(-1);
  return key;
}

/** 누르고 있어서 반복되는 입력, Ctrl·Cmd·Alt 조합(브라우저 단축키)은 게임이 받지 않는다 */
export function shouldIgnoreKey(ev: { repeat: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean }): boolean {
  return ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey;
}

/** 화면이 열린 지 delay 초가 지났는가 (열리지 않았으면 false) */
export function inputReady(openedAt: number | null, now: number, delay: number): boolean {
  return openedAt !== null && now - openedAt >= delay;
}

/** 터치: 처음 누르면 설명만 보이고, 같은 것을 한 번 더 누르면 실행 */
export function touchConfirm(prev: string | null, key: string): { confirm: boolean; next: string | null } {
  return prev === key ? { confirm: true, next: null } : { confirm: false, next: key };
}
