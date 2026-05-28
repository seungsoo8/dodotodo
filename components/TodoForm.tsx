'use client';

import { useState, useRef } from 'react';
import { Calendar, Clock, Bell, Tag, Folder, RefreshCw, FileText, X, ChevronRight, Check } from 'lucide-react';
import { Project, RecurringType, Todo } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';
import { COLOR_PALETTE } from '@/lib/colorPalette';
import LabelPicker from '@/components/LabelPicker';

interface TodoFormProps {
  onSubmit: (data: Omit<Todo, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'subtasks' | 'pomodoroCount'>) => void;
  onCancel?: () => void;
  initialData?: Todo;
  projects?: Project[];
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

const chipStyle = (active: boolean, color?: string): React.CSSProperties => active
  ? { color: color ?? 'var(--accent)', background: color ? `${color}18` : 'var(--accent-muted)', borderRadius: 8, padding: '3px 10px', fontSize: 13, fontWeight: 600 }
  : { color: 'var(--muted)', background: 'var(--border)', borderRadius: 8, padding: '3px 10px', fontSize: 13, fontWeight: 500 };

export default function TodoForm({ onSubmit, onCancel, initialData, projects }: TodoFormProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [colorTag, setColorTag] = useState<string | undefined>(initialData?.colorTag);
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(initialData ? (initialData.startDate ?? '') : today);
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? '');
  const [dueTime, setDueTime] = useState(initialData?.dueTime ?? '');
  const [reminderMinutes, setReminderMinutes] = useState<number | undefined>(initialData?.reminderMinutes);
  const [recurring, setRecurring] = useState<RecurringType>(initialData?.recurring ?? 'none');
  const [weekDays, setWeekDays] = useState<number[]>(initialData?.weekDays ?? []);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>(initialData?.projectId);
  const [urgency, setUrgency] = useState<'urgent' | 'not-urgent'>(initialData?.urgency ?? 'not-urgent');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showRecurring, setShowRecurring] = useState((initialData?.recurring ?? 'none') !== 'none');
  const [showMemo, setShowMemo] = useState(!!(initialData?.description));
  const dueTimeRef = useRef<HTMLInputElement>(null);

  const selectedLabel = COLOR_PALETTE.find(c => c.hex === colorTag);

  const recurringOpts: { value: RecurringType; label: string }[] = [
    { value: 'none', label: t.recurring.none },
    { value: 'daily', label: t.recurring.daily },
    { value: 'weekly', label: t.recurring.weekly },
    { value: 'monthly', label: t.recurring.monthly },
    { value: 'yearly', label: (t.recurring as any).yearly ?? '매년' },
  ];

  function openTimePicker() {
    if (!dueTimeRef.current) return;
    try { (dueTimeRef.current as any).showPicker(); } catch { dueTimeRef.current.click(); }
  }

  function toggleWeekDay(day: number) {
    setWeekDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  }

  function addTag() {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]);
    setTagInput('');
  }

  function formatDateLabel(ds: string) {
    if (!ds) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (ds === todayStr) return '오늘';
    if (ds === tomorrowStr) return '내일';
    const d = new Date(ds + 'T00:00:00');
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority: 'medium',
      urgency,
      colorTag: colorTag || undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      reminderMinutes,
      category: undefined,
      recurring,
      weekDays: recurring === 'weekly' && weekDays.length > 0 ? weekDays : undefined,
      tags: tags.length > 0 ? tags : undefined,
      projectId: projectId || undefined,
    });
    if (!initialData) {
      setTitle(''); setDescription(''); setColorTag(undefined);
      setStartDate(''); setDueDate(''); setDueTime(''); setReminderMinutes(undefined);
      setRecurring('none'); setWeekDays([]); setTags([]); setProjectId(undefined);
      setUrgency('not-urgent'); setShowRecurring(false); setShowMemo(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-5 mb-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }}>
      {/* 제목 */}
      <input
        type="text"
        placeholder={t.todo.titlePlaceholder}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape' && onCancel) onCancel(); }}
        className="w-full outline-none mb-3"
        style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', background: 'transparent', lineHeight: 1.3, padding: '4px 0' }}
        autoFocus
      />

      {/* 기간 */}
      <RowItem icon={<Calendar size={18} />}>
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
          <button type="button" onClick={() => { setDueDate(''); setDueTime(''); setReminderMinutes(undefined); }} className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--border)', color: 'var(--muted)', fontSize: 10 }}>×</button>
        )}
      </RowItem>

      {/* 시간 (마감일 또는 반복 설정 있을 때) */}
      {(dueDate || recurring !== 'none') && (
        <RowItem icon={<Clock size={18} />}>
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
      {(dueDate || recurring !== 'none') && dueTime && (
        <RowItem icon={<Bell size={18} />}>
          {([undefined, 0, 10, 30, 60, 1440] as (number | undefined)[]).map(min => (
            <button key={min ?? 'none'} type="button" onClick={() => setReminderMinutes(min)} style={chipStyle(reminderMinutes === min)}>
              {min === undefined ? '없음' : min === 0 ? '정시' : min === 60 ? '1시간 전' : min === 1440 ? '하루 전' : `${min}분 전`}
            </button>
          ))}
        </RowItem>
      )}

      {/* 라벨 */}
      <RowItem icon={<Tag size={18} />}>
        <button type="button" onClick={() => setShowLabelPicker(true)} className="flex items-center gap-2 flex-1 justify-between">
          <span className="flex items-center gap-2">
            {selectedLabel
              ? <><span className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ background: selectedLabel.hex }} /><span className="text-sm font-medium" style={{ color: selectedLabel.hex }}>{selectedLabel.name}</span></>
              : <span className="text-sm" style={{ color: 'var(--muted)' }}>없음</span>
            }
          </span>
          <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
        </button>
      </RowItem>

      {/* 그룹 */}
      {projects && projects.length > 0 && (
        <RowItem icon={<Folder size={18} />}>
          <button type="button" onClick={() => setProjectId(undefined)} style={chipStyle(!projectId)}>없음</button>
          {projects.map(p => (
            <button key={p.id} type="button" onClick={() => setProjectId(prev => prev === p.id ? undefined : p.id)}
              style={chipStyle(projectId === p.id, p.color)} className="flex items-center gap-1">
              <span>{p.icon}</span><span>{p.name}</span>
            </button>
          ))}
        </RowItem>
      )}

      {/* 반복 (확장 시) */}
      {showRecurring && (
        <RowItem icon={<RefreshCw size={18} />}>
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
                    className="w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center"
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

      {/* 메모 (확장 시) */}
      {showMemo && (
        <RowItem icon={<FileText size={18} />}>
          <textarea
            placeholder={t.todo.descPlaceholder}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="flex-1 text-sm resize-none placeholder:opacity-40 outline-none"
            style={{ background: 'transparent', color: 'var(--text)', minHeight: 44 }}
          />
        </RowItem>
      )}

      {/* 태그 */}
      <div className="flex flex-wrap items-center gap-2 pt-3" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
            #{tag}
            <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="leading-none opacity-60 hover:opacity-100">×</button>
          </span>
        ))}
        <input
          type="text"
          placeholder={t.todo.addTag}
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } if (e.key === ',') { e.preventDefault(); addTag(); } }}
          onBlur={addTag}
          className="text-xs px-2 py-1 rounded-lg placeholder:opacity-40 outline-none"
          style={{ background: 'var(--border)', color: 'var(--text)', minWidth: 80 }}
        />
      </div>

      {/* 하단 + 추가 옵션 */}
      <div className="flex items-center gap-2 pt-3 pb-1">
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>+</span>
        <button type="button" onClick={() => setShowRecurring(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={showRecurring && recurring !== 'none'
            ? { color: 'var(--accent)', background: 'var(--accent-muted)' }
            : { color: 'var(--muted)', background: 'var(--border)' }}>
          <RefreshCw size={11} />
          반복
        </button>
        <button type="button" onClick={() => setShowMemo(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={showMemo
            ? { color: 'var(--accent)', background: 'var(--accent-muted)' }
            : { color: 'var(--muted)', background: 'var(--border)' }}>
          <FileText size={11} />
          메모
        </button>
        <button type="button" onClick={() => setUrgency(v => v === 'urgent' ? 'not-urgent' : 'urgent')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={urgency === 'urgent'
            ? { color: '#f59e0b', background: 'rgba(245,158,11,0.12)' }
            : { color: 'var(--muted)', background: 'var(--border)' }}>
          ⚡ 긴급
        </button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2 pt-3">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm rounded-xl"
            style={{ color: 'var(--muted)', background: 'var(--border)' }}>
            {t.common.cancel}
          </button>
        )}
        <button type="submit" disabled={!title.trim()}
          className="px-5 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)' }}>
          {initialData ? t.common.edit : t.common.add}
        </button>
      </div>

      {/* 라벨 피커 */}
      {showLabelPicker && (
        <LabelPicker
          colorTag={colorTag}
          onSelect={hex => { setColorTag(hex); setShowLabelPicker(false); }}
          onClose={() => setShowLabelPicker(false)}
        />
      )}
    </form>
  );
}
