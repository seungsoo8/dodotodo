'use client';

import { useState, useRef } from 'react';
import { Priority, RecurringType, Todo } from '@/types/todo';

interface TodoFormProps {
  onSubmit: (data: Omit<Todo, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'subtasks' | 'urgency' | 'pomodoroCount'>) => void;
  onCancel?: () => void;
  initialData?: Todo;
}

const CATEGORIES = ['업무', '개인', '쇼핑', '건강', '학습', '기타'];

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--nm-text)',
  outline: 'none',
};

export default function TodoForm({ onSubmit, onCancel, initialData }: TodoFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [recurring, setRecurring] = useState<RecurringType>(initialData?.recurring ?? 'none');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const dateInputRef = useRef<HTMLInputElement>(null);

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      category: category || undefined,
      recurring,
      tags: tags.length > 0 ? tags : undefined,
    });
    if (!initialData) {
      setTitle(''); setDescription(''); setPriority('medium');
      setDueDate(''); setCategory(''); setRecurring('none');
    }
  }

  const priorityOpts: { value: Priority; label: string; color: string }[] = [
    { value: 'high', label: '높음', color: '#f43f5e' },
    { value: 'medium', label: '보통', color: '#f59e0b' },
    { value: 'low', label: '낮음', color: '#10b981' },
  ];

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-5 mb-4 space-y-4" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-md)' }}>
      <input
        type="text"
        placeholder="할 일을 입력하세요..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full text-base font-medium pb-2 border-b placeholder:opacity-40"
        style={{ ...inputStyle, borderColor: 'var(--nm-border)' }}
        autoFocus
      />

      <textarea
        placeholder="설명 (선택사항)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
        className="w-full text-sm resize-none placeholder:opacity-40"
        style={inputStyle}
      />

      <div className="flex flex-wrap gap-3 items-center">
        {/* Priority */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--nm-muted)' }}>우선순위</span>
          <div className="flex gap-1">
            {priorityOpts.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                style={
                  priority === opt.value
                    ? { borderColor: opt.color, color: opt.color, background: `${opt.color}18` }
                    : { borderColor: 'var(--nm-border)', color: 'var(--nm-muted)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--nm-muted)' }}>마감일</span>
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker()}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg cursor-pointer"
            style={{
              border: `1px solid ${dueDate ? 'var(--accent)' : 'var(--nm-border)'}`,
              background: dueDate ? 'var(--accent-muted)' : 'transparent',
              color: dueDate ? 'var(--accent)' : 'var(--nm-muted)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>{dueDate ? dueDate.replace(/-/g, '.') : '날짜 선택'}</span>
            <input
              ref={dateInputRef}
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="sr-only"
            />
          </button>
          {dueDate && (
            <button
              type="button"
              onClick={() => setDueDate('')}
              className="text-xs w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'var(--border)', color: 'var(--muted)' }}
            >
              ×
            </button>
          )}
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--nm-muted)' }}>카테고리</span>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-lg nm-inset border-none"
            style={{ ...inputStyle, background: 'transparent' }}
          >
            <option value="">선택</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Recurring */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--nm-muted)' }}>반복</span>
          <select
            value={recurring}
            onChange={e => setRecurring(e.target.value as RecurringType)}
            className="text-xs px-2.5 py-1 rounded-lg nm-inset border-none"
            style={{ ...inputStyle, background: 'transparent' }}
          >
            <option value="none">없음</option>
            <option value="daily">매일</option>
            <option value="weekly">매주</option>
            <option value="monthly">매월</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--nm-accent)22', color: 'var(--nm-accent)' }}
          >
            #{tag}
            <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="leading-none">×</button>
          </span>
        ))}
        <input
          type="text"
          placeholder="태그 추가..."
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } if (e.key === ',' ) { e.preventDefault(); addTag(); } }}
          onBlur={addTag}
          className="text-xs px-2 py-1 rounded-lg nm-inset placeholder:opacity-40"
          style={{ ...inputStyle, minWidth: 80 }}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-xl nm-btn"
            style={{ color: 'var(--nm-muted)' }}
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-5 py-2 text-sm font-semibold rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--nm-accent)' }}
        >
          {initialData ? '수정' : '추가'}
        </button>
      </div>
    </form>
  );
}
