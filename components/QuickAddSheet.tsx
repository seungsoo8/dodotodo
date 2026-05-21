'use client';

import { useState, useRef } from 'react';
import { Calendar, Clock, Bell, Tag, Folder, RefreshCw, X, ChevronRight, Check } from 'lucide-react';
import { Project, RecurringType } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';
import { COLOR_PALETTE } from '@/lib/colorPalette';

interface QuickAddSheetProps {
  onSubmit: (title: string, priority: 'medium', dueDate?: string, projectId?: string, startDate?: string, recurring?: RecurringType, weekDays?: number[], dueTime?: string, reminderMinutes?: number, colorTag?: string) => void;
  onCancel: () => void;
  projects?: Project[];
  initialDate?: string;
  initialProjectId?: string;
}

function getDateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function RowItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)', minHeight: 52, paddingTop: 8, paddingBottom: 8 }}>
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ color: 'var(--accent)' }}>
        {icon}
      </div>
      <div className="flex-1 flex items-center gap-2 flex-wrap">
        {children}
      </div>
    </div>
  );
}

export default function QuickAddSheet({ onSubmit, onCancel, projects, initialDate, initialProjectId }: QuickAddSheetProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(initialDate ?? getDateStr(0));
  const [dueDate, setDueDate] = useState(initialDate ?? '');
  const [projectId, setProjectId] = useState<string | null>(initialProjectId ?? null);
  const [recurring, setRecurring] = useState<RecurringType>('none');
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [dueTime, setDueTime] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(undefined);
  const [colorTag, setColorTag] = useState<string | undefined>(undefined);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const dueTimeRef = useRef<HTMLInputElement>(null);

  const selectedLabel = COLOR_PALETTE.find(c => c.hex === colorTag);
  const today = getDateStr(0);
  const tomorrow = getDateStr(1);

  function formatDateLabel(ds: string) {
    if (!ds) return null;
    if (ds === today) return '오늘';
    if (ds === tomorrow) return '내일';
    const d = new Date(ds + 'T00:00:00');
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  function openTimePicker() {
    if (!dueTimeRef.current) return;
    try { (dueTimeRef.current as any).showPicker(); } catch { dueTimeRef.current.click(); }
  }

  function toggleWeekDay(day: number) {
    setWeekDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  function handleSubmit() {
    if (!title.trim()) return;
    onSubmit(
      title.trim(), 'medium',
      dueDate || undefined, projectId ?? undefined, startDate || undefined,
      recurring !== 'none' ? recurring : undefined,
      recurring === 'weekly' && weekDays.length > 0 ? weekDays : undefined,
      dueTime || undefined, reminderMinutes, colorTag,
    );
  }

  const recurringOpts: { value: RecurringType; label: string }[] = [
    { value: 'none', label: t.recurring.none },
    { value: 'daily', label: t.recurring.daily },
    { value: 'weekly', label: t.recurring.weekly },
    { value: 'monthly', label: t.recurring.monthly },
    { value: 'yearly', label: (t.recurring as any).yearly ?? '매년' },
  ];

  const chipStyle = (active: boolean, color?: string): React.CSSProperties => active
    ? { color: color ?? 'var(--accent)', background: color ? `${color}18` : 'var(--accent-muted)', borderRadius: 8, padding: '3px 10px', fontSize: 13, fontWeight: 600 }
    : { color: 'var(--muted)', background: 'var(--border)', borderRadius: 8, padding: '3px 10px', fontSize: 13, fontWeight: 500 };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <button type="button" onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70" style={{ background: 'var(--border)', color: 'var(--muted)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button type="button" onClick={handleSubmit} disabled={!title.trim()}
          className="px-5 py-1.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-35"
          style={{ background: 'var(--accent)' }}>
          저장
        </button>
      </div>

      {/* 제목 입력 */}
      <input
        type="text"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
          if (e.key === 'Escape') onCancel();
        }}
        className="w-full outline-none mb-3"
        style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', background: 'transparent', lineHeight: 1.3, padding: '4px 0' }}
        autoFocus
      />

      {/* 기간 */}
      <RowItem icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      }>
        <label className="relative cursor-pointer" style={chipStyle(!!startDate)}>
          {formatDateLabel(startDate) ?? '시작일'}
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" style={{ fontSize: 16 }} />
        </label>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>→</span>
        <label className="relative cursor-pointer" style={chipStyle(!!dueDate)}>
          {formatDateLabel(dueDate) ?? '마감일'}
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" style={{ fontSize: 16 }} />
        </label>
        {dueDate && (
          <button type="button" onClick={() => setDueDate('')} className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--border)', color: 'var(--muted)', fontSize: 10 }}>×</button>
        )}
        <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
        <button type="button" onClick={() => setDueDate(p => p === today ? '' : today)} style={chipStyle(dueDate === today)}>{t.date.today}</button>
        <button type="button" onClick={() => setDueDate(p => p === tomorrow ? '' : tomorrow)} style={chipStyle(dueDate === tomorrow)}>{t.date.tomorrow}</button>
      </RowItem>

      {/* 시간 (마감일 있을 때) */}
      {dueDate && (
        <RowItem icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        }>
          <button type="button" onClick={openTimePicker} style={chipStyle(!!dueTime)}>
            {dueTime || '시간 없음'}
          </button>
          {dueTime && (
            <button type="button" onClick={() => { setDueTime(''); setReminderMinutes(undefined); }} className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--border)', color: 'var(--muted)', fontSize: 10 }}>×</button>
          )}
          <input ref={dueTimeRef} type="time" value={dueTime} onChange={e => setDueTime(e.target.value)}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none', fontSize: 16 }} />
        </RowItem>
      )}

      {/* 알림 (마감일+시간 있을 때) */}
      {dueDate && dueTime && (
        <RowItem icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        }>
          {([undefined, 0, 10, 30, 60, 1440] as (number | undefined)[]).map(min => (
            <button key={min ?? 'none'} type="button" onClick={() => setReminderMinutes(min)} style={chipStyle(reminderMinutes === min)}>
              {min === undefined ? '없음' : min === 0 ? '정시' : min === 60 ? '1시간 전' : min === 1440 ? '하루 전' : `${min}분 전`}
            </button>
          ))}
        </RowItem>
      )}

      {/* 라벨 */}
      <RowItem icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      }>
        <button type="button" onClick={() => setShowLabelPicker(true)} className="flex items-center gap-2 flex-1 justify-between">
          <span className="flex items-center gap-2">
            {selectedLabel
              ? <><span className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: selectedLabel.hex }} /><span className="text-sm font-medium" style={{ color: selectedLabel.hex }}>{selectedLabel.name}</span></>
              : <span className="text-sm" style={{ color: 'var(--muted)' }}>없음</span>
            }
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </RowItem>

      {/* 그룹 */}
      {projects && projects.length > 0 && (
        <RowItem icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        }>
          <button type="button" onClick={() => setProjectId(null)} style={chipStyle(!projectId)}>없음</button>
          {projects.map(p => (
            <button key={p.id} type="button" onClick={() => setProjectId(prev => prev === p.id ? null : p.id)}
              style={chipStyle(projectId === p.id, p.color)} className="flex items-center gap-1">
              <span>{p.icon}</span><span>{p.name}</span>
            </button>
          ))}
        </RowItem>
      )}

      {/* 반복 (확장 시) */}
      {showRecurring && (
        <RowItem icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
        }>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {recurringOpts.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => { setRecurring(opt.value); if (opt.value !== 'weekly') setWeekDays([]); }}
                  style={chipStyle(recurring === opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
            {recurring === 'weekly' && (
              <div className="flex gap-1 mt-2">
                {WEEKDAY_LABELS.map((label, i) => (
                  <button key={i} type="button" onClick={() => toggleWeekDay(i)}
                    className="w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition-all"
                    style={weekDays.includes(i)
                      ? { color: 'var(--accent)', background: 'var(--accent-muted)' }
                      : { color: 'var(--muted)', background: 'var(--border)' }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </RowItem>
      )}

      {/* 하단 + 추가 옵션 */}
      <div className="flex items-center gap-2 pt-4">
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>+</span>
        <button type="button" onClick={() => setShowRecurring(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={showRecurring && recurring !== 'none'
            ? { color: 'var(--accent)', background: 'var(--accent-muted)' }
            : { color: 'var(--muted)', background: 'var(--border)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
          반복
        </button>
      </div>

      {/* 라벨 피커 */}
      {showLabelPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowLabelPicker(false)}>
          <div className="rounded-t-3xl p-4 pb-8" style={{ background: 'var(--card)' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--border)' }} />
            <p className="text-sm font-semibold mb-4 text-center" style={{ color: 'var(--text)' }}>라벨 선택</p>
            <div className="space-y-1">
              <button type="button" onClick={() => { setColorTag(undefined); setShowLabelPicker(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                style={{ background: !colorTag ? 'var(--accent-muted)' : 'transparent' }}>
                <span className="w-5 h-5 rounded-md border flex-shrink-0" style={{ borderColor: 'var(--border)' }} />
                <span className="text-sm" style={{ color: 'var(--muted)' }}>없음</span>
                {!colorTag && <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
              </button>
              {COLOR_PALETTE.map(c => (
                <button key={c.hex} type="button" onClick={() => { setColorTag(c.hex); setShowLabelPicker(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                  style={{ background: colorTag === c.hex ? 'var(--accent-muted)' : 'transparent' }}>
                  <span className="w-5 h-5 rounded-md flex-shrink-0" style={{ background: c.hex }} />
                  <span className="text-sm font-medium" style={{ color: colorTag === c.hex ? c.hex : 'var(--text)' }}>{c.name}</span>
                  {colorTag === c.hex && <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
