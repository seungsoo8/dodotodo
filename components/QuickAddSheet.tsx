'use client';

import { useState } from 'react';
import { Priority, Project } from '@/types/todo';

interface QuickAddSheetProps {
  onSubmit: (title: string, priority: Priority, dueDate?: string, projectId?: string) => void;
  onCancel: () => void;
  projects?: Project[];
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: '높음', color: '#ff3b30' },
  { value: 'medium', label: '보통', color: '#ff9500' },
  { value: 'low', label: '낮음', color: '#34c759' },
];

function getDateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function QuickAddSheet({ onSubmit, onCancel, projects }: QuickAddSheetProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [showDateInput, setShowDateInput] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const today = getDateStr(0);
  const tomorrow = getDateStr(1);

  function handleSubmit() {
    if (!title.trim()) return;
    onSubmit(title.trim(), priority, dueDate || undefined, projectId ?? undefined);
  }

  function selectQuickDate(val: string) {
    setDueDate(prev => prev === val ? '' : val);
  }

  const dueDateLabel = dueDate === today
    ? '오늘'
    : dueDate === tomorrow
    ? '내일'
    : dueDate
    ? dueDate
    : null;

  return (
    <div className="px-1">
      <input
        type="text"
        placeholder="무엇을 할까요?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
          if (e.key === 'Escape') onCancel();
        }}
        className="w-full text-lg font-medium outline-none bg-transparent placeholder:opacity-40"
        style={{ color: 'var(--text)' }}
        autoFocus
      />

      {/* 날짜 선택 영역 */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          type="button"
          onClick={() => selectQuickDate(today)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
          style={
            dueDate === today
              ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-muted)' }
              : { borderColor: 'var(--border)', color: 'var(--muted)' }
          }
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          오늘
        </button>
        <button
          type="button"
          onClick={() => selectQuickDate(tomorrow)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
          style={
            dueDate === tomorrow
              ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-muted)' }
              : { borderColor: 'var(--border)', color: 'var(--muted)' }
          }
        >
          내일
        </button>
        <button
          type="button"
          onClick={() => setShowDateInput(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
          style={
            (dueDate && dueDate !== today && dueDate !== tomorrow) || showDateInput
              ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-muted)' }
              : { borderColor: 'var(--border)', color: 'var(--muted)' }
          }
        >
          날짜 선택
        </button>
        {dueDate && (
          <button
            type="button"
            onClick={() => { setDueDate(''); setShowDateInput(false); }}
            className="px-2 py-1 rounded-full text-xs border transition-all"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            ✕ {dueDateLabel}
          </button>
        )}
      </div>

      {showDateInput && (
        <input
          type="date"
          value={dueDate}
          min={today}
          onChange={e => { setDueDate(e.target.value); setShowDateInput(false); }}
          className="mt-2 w-full text-sm px-3 py-2 rounded-xl outline-none"
          style={{
            background: 'var(--accent-muted)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            colorScheme: 'auto',
          }}
          autoFocus
        />
      )}

      {/* 프로젝트 선택 */}
      {projects && projects.length > 0 && (
        <div className="flex items-center gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {projects.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProjectId(prev => prev === p.id ? null : p.id)}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
              style={
                projectId === p.id
                  ? { borderColor: p.color, color: p.color, background: `${p.color}18` }
                  : { borderColor: 'var(--border)', color: 'var(--muted)' }
              }
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1.5">
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={
                priority === p.value
                  ? { borderColor: p.color, color: p.color, background: `${p.color}18` }
                  : { borderColor: 'var(--border)', color: 'var(--muted)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-5 py-2 text-sm font-semibold rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)' }}
        >
          추가
        </button>
      </div>
    </div>
  );
}
