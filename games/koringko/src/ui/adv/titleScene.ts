/**
 * 타이틀 그림: 이삿날 전날 밤. 별이 가득한 하늘 아래 작은 집, 다락방 둥근 창에만 불이 켜져 있고
 * 창가에 태엽 토끼의 그림자. 가끔 종이별이 내려온다. (그림은 모두 코드로 그린다)
 */
import { hash2 } from '../art/paint.ts';

/** 타이틀이 차례로 나타나는 시간 (초): 하늘 → 집 → 제목 → 고르기 */
export const TITLE_FADE = { sky: 0, house: 1.2, title: 2.4, menu: 3.6 };

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** t 초에 이 단계가 얼마나 보이는가 (1 초 동안 서서히) */
export const reveal = (t: number, at: number) => clamp01(t - at);

export function drawTitleScene(c: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  // 하늘: 위는 깊은 남색, 지평선은 보랏빛
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#070a1e');
  sky.addColorStop(0.55, '#1a1838');
  sky.addColorStop(0.85, '#3a2a4a');
  sky.addColorStop(1, '#4a3048');
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);

  // 별: 반짝임은 저마다 다른 박자
  for (let i = 0; i < 150; i++) {
    const x = hash2(i, 1, 901) * w;
    const y = hash2(i, 2, 902) * h * 0.72;
    const tw = 0.45 + 0.55 * Math.sin(t * (0.6 + hash2(i, 3, 903) * 1.6) + i);
    const a = (0.25 + hash2(i, 4, 904) * 0.6) * tw;
    c.fillStyle = `rgba(255,248,230,${a.toFixed(3)})`;
    const s = hash2(i, 5, 905) < 0.1 ? 2 : 1;
    c.fillRect(Math.round(x), Math.round(y), s, s);
  }
  // 하루 별 · 할머니 별: 나란히, 조금 더 크게
  const pair = (x: number, y: number, r: number, k: number) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, `rgba(255,236,190,${0.5 * k})`);
    g.addColorStop(1, 'rgba(255,236,190,0)');
    c.fillStyle = g;
    c.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    c.fillStyle = `rgba(255,250,235,${0.9 * k})`;
    c.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), Math.ceil(r), Math.ceil(r));
  };
  const sk = reveal(t, TITLE_FADE.sky);
  pair(w * 0.72, h * 0.16, 3, sk * (0.85 + 0.15 * Math.sin(t * 1.3)));
  pair(w * 0.76, h * 0.13, 2, sk * (0.8 + 0.2 * Math.sin(t * 1.1 + 1)));

  // 언덕과 집 (실루엣), 다락방 둥근 창만 노랗게
  const hk = reveal(t, TITLE_FADE.house);
  c.globalAlpha = hk;
  c.fillStyle = '#0c0a16';
  c.beginPath();
  c.moveTo(0, h * 0.86);
  c.quadraticCurveTo(w * 0.3, h * 0.78, w * 0.55, h * 0.84);
  c.quadraticCurveTo(w * 0.8, h * 0.9, w, h * 0.82);
  c.lineTo(w, h);
  c.lineTo(0, h);
  c.fill();
  // 가로 화면에서는 고르기 단추를 가리지 않게 오른쪽으로
  const wide = w > h * 1.2;
  const hx = Math.round(w * (wide ? 0.78 : 0.5));
  const base = Math.round(h * (wide ? 0.87 : 0.84));
  const hw = Math.round(Math.min(wide ? w * 0.15 : w * 0.22, 150));
  const hh = Math.round(hw * 0.62);
  c.fillStyle = '#110e1c';
  c.fillRect(hx - hw / 2, base - hh, hw, hh);
  c.beginPath();
  c.moveTo(hx - hw / 2 - 8, base - hh);
  c.lineTo(hx, base - hh - hw * 0.42);
  c.lineTo(hx + hw / 2 + 8, base - hh);
  c.fill();
  // 굴뚝
  c.fillRect(hx + hw * 0.22, base - hh - hw * 0.36, hw * 0.08, hw * 0.2);
  // 아래층 창은 꺼져 있다 (모두 잠든 밤)
  c.fillStyle = '#1c1830';
  for (const dx of [-0.3, 0.12]) c.fillRect(hx + hw * dx, base - hh * 0.62, hw * 0.16, hh * 0.3);
  // 다락방 둥근 창: 따뜻한 불빛
  const wy = base - hh - hw * 0.16;
  const wr = Math.max(6, hw * 0.075);
  const glow = c.createRadialGradient(hx, wy, 0, hx, wy, wr * 6);
  const flick = 0.85 + Math.sin(t * 2.3) * 0.05 + Math.sin(t * 5.1) * 0.03;
  glow.addColorStop(0, `rgba(255,200,120,${0.5 * flick})`);
  glow.addColorStop(1, 'rgba(255,200,120,0)');
  c.fillStyle = glow;
  c.fillRect(hx - wr * 6, wy - wr * 6, wr * 12, wr * 12);
  c.fillStyle = `rgba(255,214,140,${flick})`;
  c.beginPath();
  c.arc(hx, wy, wr, 0, Math.PI * 2);
  c.fill();
  // 창가의 토끼 그림자 (귀 둘) 와 천천히 도는 태엽 열쇠
  c.fillStyle = '#3a2418';
  const bx = hx - wr * 0.15;
  const by = wy + wr * 0.55;
  c.fillRect(bx - wr * 0.35, by - wr * 0.7, wr * 0.7, wr * 0.7);
  c.fillRect(bx - wr * 0.25, by - wr * 1.25, wr * 0.15, wr * 0.6);
  c.fillRect(bx + wr * 0.1, by - wr * 1.25, wr * 0.15, wr * 0.6);
  const ka = t * 0.8;
  const kx = bx + wr * 0.45;
  const ky = by - wr * 0.4;
  c.fillRect(kx, ky - 1, Math.max(2, wr * 0.2), 2);
  c.fillRect(kx + wr * 0.2 + Math.cos(ka) * wr * 0.15 - 1, ky - 1 + Math.sin(ka) * wr * 0.15, 3, 3);
  c.globalAlpha = 1;

  // 내려오는 종이별 (몇 개만, 천천히 흔들리며)
  for (let i = 0; i < 6; i++) {
    const period = 11 + hash2(i, 6, 906) * 7;
    const ph = ((t + hash2(i, 7, 907) * period) % period) / period;
    const x = w * (0.1 + hash2(i, 8, 908) * 0.8) + Math.sin(t * 0.9 + i) * 12;
    const y = -10 + ph * (h * 0.9);
    const a = Math.sin(ph * Math.PI) * 0.8 * hk;
    star(c, x, y, 3, ['#ffe07a', '#ff9ec7', '#8ad0ff', '#b8f08a'][i % 4], a, t * 0.6 + i);
  }
}

/** 작은 종이별 (다섯 꼭지) */
function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a: number, rot: number): void {
  if (a <= 0) return;
  c.save();
  c.globalAlpha = a;
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = color;
  c.beginPath();
  for (let k = 0; k < 10; k++) {
    const rr = k % 2 ? r * 0.45 : r;
    const an = (k * Math.PI) / 5 - Math.PI / 2;
    c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
  }
  c.fill();
  c.restore();
}
