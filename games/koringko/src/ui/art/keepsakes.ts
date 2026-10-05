/** 기억의 상징물 (기억의 문) · 기억 조각 · 종이별 · 밀 수 있는 덩어리 그림 */
import { Pix, hex, shade, type Color } from './paint.ts';

const INK = hex('#2a1c24');

function star5(p: Pix, cx: number, cy: number, r: number, c: Color): void {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  for (let i = 0; i < 10; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % 10];
    p.tri(cx, cy, ax, ay, bx, by, i % 2 ? shade(c, -0.12) : c);
  }
}

/** 상징물 그림 (20×20 안팎) */
export function keepsakeSprite(icon: string): Pix {
  const p = new Pix(22, 22);
  switch (icon) {
    case 'star':
      star5(p, 11, 12, 9, hex('#ffe07a'));
      p.line(11, 4, 11, 12, shade(hex('#ffe07a'), 0.35));
      break;
    case 'halfstar':
      // 접다 만 종이별: 반쯤 접힌 띠
      star5(p, 9, 12, 7, hex('#ffe07a'));
      p.rect(13, 9, 8, 3, hex('#ffe07a'));
      p.rect(13, 9, 8, 1, shade(hex('#ffe07a'), 0.3));
      break;
    case 'key': {
      const g = hex('#ffc83a');
      p.oval(6, 11, 5, 4, g);
      p.oval(6, 11, 2, 1.5, -1);
      p.rect(10, 10, 9, 3, g);
      p.rect(16, 13, 2, 3, g);
      p.rect(13, 13, 2, 2, g);
      // 리본
      p.tri(3, 4, 8, 7, 3, 9, hex('#e8414f'));
      p.tri(13, 4, 8, 7, 13, 9, hex('#e8414f'));
      break;
    }
    case 'umbrella': {
      const c = hex('#e85a6a');
      for (let i = -9; i <= 9; i++) {
        const h = Math.round(Math.sqrt(Math.max(0, 81 - i * i)) * 0.7);
        p.rect(11 + i, 10 - h, 1, h + 1, i % 3 === 0 ? shade(c, 0.25) : c);
      }
      p.rect(11, 10, 1, 9, hex('#5a4038'));
      p.rect(9, 18, 3, 1, hex('#5a4038'));
      break;
    }
    case 'needle':
      p.line(4, 18, 17, 4, hex('#c8d0d8'));
      p.set(16, 5, -1);
      p.line(16, 5, 20, 12, hex('#e85a6a'));
      p.line(20, 12, 14, 16, hex('#e85a6a'));
      p.oval(7, 16, 4, 3, hex('#e85a6a'));
      break;
    case 'phone':
      p.rect(3, 9, 16, 9, hex('#e8e0d0'));
      p.rect(2, 5, 18, 4, hex('#f0e8d8'));
      p.rect(7, 11, 8, 4, hex('#a8a090'));
      break;
    case 'candle':
      p.rect(8, 8, 6, 12, hex('#8ad0ff'));
      p.rect(8, 8, 2, 12, shade(hex('#8ad0ff'), 0.3));
      p.oval(11, 5, 2, 3, hex('#ffd84a'));
      p.set(11, 4, hex('#ffffff'));
      break;
    case 'photo':
      p.rect(2, 3, 18, 16, hex('#8a5a3a'));
      p.rect(4, 5, 14, 12, hex('#f0e4c8'));
      p.oval(9, 10, 2, 2, hex('#e8e4ec'));
      p.rect(7, 12, 4, 5, hex('#a88ad0'));
      p.oval(14, 11, 1.6, 1.6, hex('#4a3226'));
      p.rect(12, 13, 4, 4, hex('#ffd25a'));
      break;
    case 'puppet':
      p.ball(11, 8, 6, 6, hex('#b07444'), true);
      p.ball(6, 3, 2.5, 2.5, hex('#b07444'));
      p.ball(16, 3, 2.5, 2.5, hex('#b07444'));
      p.rect(6, 13, 10, 7, hex('#4f9a52'));
      p.set(9, 8, INK);
      p.set(13, 8, INK);
      break;
    case 'jar':
      p.rect(5, 6, 12, 14, hex('#d8f0f8'));
      p.rect(7, 3, 8, 3, hex('#e8c860'));
      for (let i = 0; i < 18; i++) p.set(6 + ((i * 7) % 10), 9 + ((i * 5) % 10), [hex('#ffe07a'), hex('#ff9ec7'), hex('#8ad0ff')][i % 3]);
      break;
    case 'letter':
      p.rect(2, 5, 18, 13, hex('#f8f0e0'));
      p.tri(2, 5, 20, 5, 11, 12, shade(hex('#f8f0e0'), -0.1));
      p.ball(11, 12, 2, 2, hex('#e85a6a'));
      break;
    default:
      p.ball(11, 11, 7, 7, hex('#ffe07a'), true);
  }
  return p.outline(INK);
}

/** 기억 조각: 빛나는 구슬 (frame 0~3 반짝임) */
export function shardSprite(frame: number): Pix {
  const p = new Pix(16, 16);
  p.ball(8, 8, 5, 5, hex('#bfe8ff'), false);
  p.ball(8, 8, 3, 3, hex('#ffffff'), true);
  const k = frame % 4;
  const sp = hex('#ffffff');
  if (k === 0 || k === 2) {
    p.set(8, 0, sp);
    p.set(8, 1, sp);
    p.set(8, 15, sp);
    p.set(0, 8, sp);
    p.set(15, 8, sp);
  } else {
    p.set(2, 2, sp);
    p.set(13, 2, sp);
    p.set(2, 13, sp);
    p.set(13, 13, sp);
  }
  return p;
}

/** 바닥에 떨어진 종이별 */
export function paperStarSprite(): Pix {
  const p = new Pix(11, 11);
  star5(p, 5.5, 6, 5, hex('#ffe07a'));
  return p.outline();
}

/** 보리가 미는 덩어리 */
export function blockSprite(look: string): Pix {
  const p = new Pix(24, 30);
  switch (look) {
    case 'cookie': {
      p.ball(12, 17, 11, 11, hex('#d8a060'), true);
      for (const [x, y] of [[8, 13], [15, 15], [10, 21], [17, 22], [13, 9]]) p.oval(x, y, 1.6, 1.4, hex('#5a3420'));
      break;
    }
    case 'book': {
      p.rect(1, 12, 22, 16, hex('#c84a4a'));
      p.rect(1, 12, 22, 3, shade(hex('#c84a4a'), 0.25));
      p.rect(3, 24, 20, 3, hex('#f4ecdc'));
      p.rect(5, 18, 14, 2, hex('#e8c860'));
      break;
    }
    case 'shoe': {
      // 운동화
      p.rect(2, 16, 20, 8, hex('#f0f0f0'));
      p.rect(2, 22, 20, 3, hex('#c8c8d0'));
      p.rect(4, 11, 10, 7, hex('#4a78d8'));
      p.rect(6, 13, 6, 1, hex('#ffffff'));
      p.rect(6, 15, 6, 1, hex('#ffffff'));
      break;
    }
    case 'soap': {
      p.rect(2, 12, 20, 14, hex('#f8c8d8'));
      p.rect(2, 12, 20, 4, hex('#ffe0ea'));
      p.ball(18, 9, 3, 3, hex('#e8f4ff'), true);
      p.ball(13, 7, 2, 2, hex('#e8f4ff'), true);
      break;
    }
    case 'spool': {
      // 실패: 나무 양 끝 · 빨간 실
      p.rect(2, 8, 20, 4, hex('#c8905a'));
      p.rect(2, 24, 20, 4, hex('#a8703c'));
      p.rect(4, 12, 16, 12, hex('#e85a6a'));
      for (let y = 13; y < 24; y += 2) p.rect(4, y, 16, 1, shade(hex('#e85a6a'), -0.15));
      p.rect(6, 12, 2, 12, shade(hex('#e85a6a'), 0.25));
      break;
    }
    case 'pot': {
      // 화분
      p.rect(3, 14, 18, 14, hex('#c8704a'));
      p.rect(1, 12, 22, 4, hex('#d88a5a'));
      for (let i = 0; i < 5; i++) p.ball(6 + i * 3, 9 - (i % 2) * 3, 3, 3, hex('#4a9a4a'), true);
      break;
    }
    case 'box': {
      p.rect(1, 8, 22, 20, hex('#c89a64'));
      p.rect(1, 8, 22, 4, shade(hex('#c89a64'), 0.2));
      p.rect(10, 8, 4, 20, hex('#d8c098'));
      break;
    }
    default: {
      // 나무 블록 (글자)
      const c = hex('#e8b04a');
      p.rect(1, 8, 22, 20, c);
      p.rect(1, 8, 22, 5, shade(c, 0.25));
      p.rect(19, 13, 4, 15, shade(c, -0.2));
      p.rect(6, 15, 9, 9, hex('#e85a5a'));
      p.rect(8, 17, 5, 5, c);
    }
  }
  return p.outline();
}
