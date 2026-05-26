import { Priority, RecurringType } from '@/types/todo';

export interface ParsedInput {
  title: string;
  priority?: Priority;
  dueDate?: string;
  dueTime?: string;
  recurring?: RecurringType;
  detectedFields: ('priority' | 'dueDate' | 'dueTime' | 'recurring')[];
}

function currentYear() { return new Date().getFullYear(); }

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseNaturalInput(raw: string): ParsedInput {
  let text = raw;
  let priority: Priority | undefined;
  let dueDate: string | undefined;
  let dueTime: string | undefined;
  let recurring: RecurringType | undefined;
  const detectedFields: ParsedInput['detectedFields'] = [];

  // ── Priority ────────────────────────────────────────────────
  if (/!1/.test(text) || /\b(높음|중요|urgent|high)\b/i.test(text)) {
    priority = 'high';
    detectedFields.push('priority');
    text = text.replace(/!1/, '').replace(/\b(높음|중요|urgent|high)\b/gi, '');
  } else if (/!2/.test(text) || /\b(보통|medium)\b/i.test(text)) {
    priority = 'medium';
    detectedFields.push('priority');
    text = text.replace(/!2/, '').replace(/\b(보통|medium)\b/gi, '');
  } else if (/!3/.test(text) || /\b(낮음|low)\b/i.test(text)) {
    priority = 'low';
    detectedFields.push('priority');
    text = text.replace(/!3/, '').replace(/\b(낮음|low)\b/gi, '');
  }

  // ── Recurring ───────────────────────────────────────────────
  if (/매일/.test(text)) {
    recurring = 'daily';
    detectedFields.push('recurring');
    text = text.replace(/매일/, '');
  } else if (/매주/.test(text)) {
    recurring = 'weekly';
    detectedFields.push('recurring');
    text = text.replace(/매주/, '');
  } else if (/매월/.test(text)) {
    recurring = 'monthly';
    detectedFields.push('recurring');
    text = text.replace(/매월/, '');
  } else if (/매년/.test(text)) {
    recurring = 'yearly';
    detectedFields.push('recurring');
    text = text.replace(/매년/, '');
  }

  // ── Time (must run before date to avoid conflicts) ──────────
  const pmMatch = text.match(/오후\s*(\d{1,2})시(?:\s*(\d{2})분)?/);
  const amMatch = text.match(/오전\s*(\d{1,2})시(?:\s*(\d{2})분)?/);
  const time24Match = text.match(/(\d{1,2}):(\d{2})/);
  const hourMatch = text.match(/(\d{1,2})시(?:\s*(\d{2})분)?/);

  if (pmMatch) {
    let h = parseInt(pmMatch[1]);
    if (h < 12) h += 12;
    dueTime = `${String(h).padStart(2, '0')}:${pmMatch[2] ?? '00'}`;
    detectedFields.push('dueTime');
    text = text.replace(pmMatch[0], '');
  } else if (amMatch) {
    const h = parseInt(amMatch[1]) % 12;
    dueTime = `${String(h).padStart(2, '0')}:${amMatch[2] ?? '00'}`;
    detectedFields.push('dueTime');
    text = text.replace(amMatch[0], '');
  } else if (time24Match) {
    dueTime = `${time24Match[1].padStart(2, '0')}:${time24Match[2]}`;
    detectedFields.push('dueTime');
    text = text.replace(time24Match[0], '');
  } else if (hourMatch) {
    const h = parseInt(hourMatch[1]);
    dueTime = `${String(h).padStart(2, '0')}:${hourMatch[2] ?? '00'}`;
    detectedFields.push('dueTime');
    text = text.replace(hourMatch[0], '');
  }

  // ── Date ────────────────────────────────────────────────────
  if (/오늘/.test(text)) {
    dueDate = offsetDate(0);
    detectedFields.push('dueDate');
    text = text.replace(/오늘/, '');
  } else if (/모레/.test(text)) {
    dueDate = offsetDate(2);
    detectedFields.push('dueDate');
    text = text.replace(/모레/, '');
  } else if (/내일/.test(text)) {
    dueDate = offsetDate(1);
    detectedFields.push('dueDate');
    text = text.replace(/내일/, '');
  } else if (/다음\s*주/.test(text)) {
    dueDate = offsetDate(7);
    detectedFields.push('dueDate');
    text = text.replace(/다음\s*주/, '');
  } else {
    const koDate = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
    const slashDate = text.match(/(\d{1,2})\/(\d{1,2})/);
    if (koDate) {
      dueDate = `${currentYear()}-${koDate[1].padStart(2, '0')}-${koDate[2].padStart(2, '0')}`;
      detectedFields.push('dueDate');
      text = text.replace(koDate[0], '');
    } else if (slashDate) {
      dueDate = `${currentYear()}-${slashDate[1].padStart(2, '0')}-${slashDate[2].padStart(2, '0')}`;
      detectedFields.push('dueDate');
      text = text.replace(slashDate[0], '');
    }
  }

  return {
    title: text.trim().replace(/\s+/g, ' '),
    priority,
    dueDate,
    dueTime,
    recurring,
    detectedFields,
  };
}
