/**
 * 대본 글 → 명령. 한 줄에 하나:
 *   who: 대사          > 해설          # 주석
 *   @명령 인자…        @if 깃발 … @else … @end
 */
import type { HeroId } from '../types.ts';
import type { Cmd, Emote, Facing } from './types.ts';

const EMOTES = new Set(['!', '?', '…', '♪', '♥', 'sweat', 'anger', 'zz', 'idea', 'tear']);

class ParseError extends Error {}

export function parseScript(src: string): Cmd[] {
  const lines = src.split('\n');
  const stack: { cmds: Cmd[]; node?: Extract<Cmd, { t: 'if' }>; inElse?: boolean }[] = [{ cmds: [] }];
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const fail = (why: string): never => {
      throw new ParseError(`${i + 1}번째 줄: ${why} — "${line}"`);
    };
    const top = stack[stack.length - 1];
    const push = (c: Cmd) => top.cmds.push(c);
    if (line.startsWith('>')) {
      push({ t: 'say', who: '', text: line.slice(1).trim() });
      return;
    }
    if (!line.startsWith('@')) {
      const k = line.indexOf(':');
      if (k <= 0 || !/^[a-z0-9_]+$/i.test(line.slice(0, k).trim())) fail('대사는 "누구: 말" 꼴이어야 해요');
      push({ t: 'say', who: line.slice(0, k).trim(), text: line.slice(k + 1).trim() });
      return;
    }
    const [name, ...args] = line.slice(1).split(/\s+/);
    const rest = line.slice(1 + name.length).trim();
    const num = (s: string | undefined): number => {
      const v = Number(s);
      if (s === undefined || !Number.isFinite(v)) fail(`숫자가 필요해요 (${s ?? '없음'})`);
      return v;
    };
    const need = (n: number) => {
      if (args.length < n) fail(`인자가 ${n}개 필요해요`);
    };
    switch (name) {
      case 'if': {
        need(1);
        const node: Extract<Cmd, { t: 'if' }> = { t: 'if', flag: args[0], then: [] };
        push(node);
        stack.push({ cmds: node.then, node });
        break;
      }
      case 'else': {
        if (!top.node || top.inElse) fail('@else 앞에 @if 가 없어요');
        top.node!.else = [];
        stack[stack.length - 1] = { cmds: top.node!.else, node: top.node, inElse: true };
        break;
      }
      case 'end':
        if (stack.length < 2) fail('@end 앞에 @if 가 없어요');
        stack.pop();
        break;
      case 'walk': {
        need(3);
        const c: Extract<Cmd, { t: 'walk' }> = { t: 'walk', who: args[0], to: [num(args[1]), num(args[2])] };
        for (const a of args.slice(3)) {
          if (a === 'nowait') c.wait = false;
          else c.speed = num(a);
        }
        push(c);
        break;
      }
      case 'emote': {
        need(2);
        if (!EMOTES.has(args[1])) fail(`모르는 감정 (${args[1]})`);
        const c: Extract<Cmd, { t: 'emote' }> = { t: 'emote', who: args[0], e: args[1] as Emote };
        for (const a of args.slice(2)) {
          if (a === 'nowait') c.wait = false;
          else c.s = num(a);
        }
        push(c);
        break;
      }
      case 'face':
        need(2);
        push({ t: 'face', who: args[0], dir: args[1] });
        break;
      case 'pose':
        need(2);
        push({ t: 'pose', who: args[0], pose: args[1] });
        break;
      case 'show': {
        need(4);
        const c: Extract<Cmd, { t: 'show' }> = { t: 'show', who: args[0], kind: args[1], at: [num(args[2]), num(args[3])] };
        if (args[4]) c.dir = args[4] as Facing;
        if (args[5]) c.pose = args[5];
        push(c);
        break;
      }
      case 'hide':
        need(1);
        push({ t: 'hide', who: args[0] });
        break;
      case 'wait':
        need(1);
        push({ t: 'wait', s: num(args[0]) });
        break;
      case 'fade': {
        need(1);
        const c: Extract<Cmd, { t: 'fade' }> = { t: 'fade', to: num(args[0]) };
        if (args[1] !== undefined) c.s = num(args[1]);
        if (args[2] === 'white' || args[2] === 'black') c.color = args[2];
        push(c);
        break;
      }
      case 'bars':
        need(1);
        push({ t: 'bars', on: args[0] === 'on' });
        break;
      case 'music':
        need(1);
        push({ t: 'music', track: args[0] === 'none' ? null : args[0] });
        break;
      case 'sfx':
        need(1);
        push({ t: 'sfx', name: args[0] });
        break;
      case 'cam': {
        need(1);
        if (args[0] === 'off') push({ t: 'cam', to: null });
        else if (Number.isFinite(Number(args[0]))) {
          const c: Extract<Cmd, { t: 'cam' }> = { t: 'cam', to: [num(args[0]), num(args[1])] };
          if (args[2] !== undefined) c.s = num(args[2]);
          push(c);
        } else {
          const c: Extract<Cmd, { t: 'cam' }> = { t: 'cam', to: args[0] };
          if (args[1] !== undefined) c.s = num(args[1]);
          push(c);
        }
        break;
      }
      case 'shake':
        need(1);
        push({ t: 'shake', s: num(args[0]) });
        break;
      case 'tone':
        need(1);
        if (!['memory', 'now', 'dawn'].includes(args[0])) fail('색감은 memory · now · dawn');
        push({ t: 'tone', v: args[0] as 'memory' });
        break;
      case 'title': {
        const [text, sub] = rest.split('|').map((s) => s.trim());
        const c: Extract<Cmd, { t: 'title' }> = { t: 'title', text };
        if (sub) c.sub = sub;
        push(c);
        break;
      }
      case 'room': {
        need(1);
        const c: Extract<Cmd, { t: 'room' }> = { t: 'room', id: args[0] };
        if (args.length >= 3) c.at = [num(args[1]), num(args[2])];
        if (args[3]) c.dir = args[3] as Facing;
        push(c);
        break;
      }
      case 'flag':
        need(1);
        push(args[1] === 'off' ? { t: 'flag', name: args[0], v: false } : { t: 'flag', name: args[0] });
        break;
      case 'join':
      case 'leave':
        need(1);
        push({ t: name, who: args[0] as HeroId });
        break;
      case 'control':
        need(1);
        push({ t: 'control', who: args[0] });
        break;
      case 'goal':
        push({ t: 'goal', text: rest === 'off' || !rest ? null : rest });
        break;
      case 'mini':
        need(1);
        push({ t: 'mini', id: args[0] });
        break;
      case 'chapter':
        need(1);
        push({ t: 'chapter', n: num(args[0]) });
        break;
      case 'wind':
        need(1);
        push({ t: 'wind', v: num(args[0]) });
        break;
      case 'album':
        need(1);
        push({ t: 'album', id: args[0] });
        break;
      case 'credits':
        push({ t: 'credits' });
        break;
      case 'choice': {
        const [flag, ...options] = rest.split('|').map((s) => s.trim());
        if (!flag || options.length < 2) fail('@choice 깃발 | 고르기1 | 고르기2 …');
        push({ t: 'choice', flag, options });
        break;
      }
      default:
        fail(`모르는 명령 @${name}`);
    }
  });
  if (stack.length > 1) throw new ParseError('@if 를 닫는 @end 가 없어요');
  return stack[0].cmds;
}

/** 템플릿 글자로 대본 쓰기: s`…` */
export function s(strings: TemplateStringsArray, ...vals: unknown[]): Cmd[] {
  return parseScript(String.raw({ raw: strings }, ...vals));
}
