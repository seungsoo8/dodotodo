'use client';

import { useState } from 'react';
import { Subtask } from '@/types/todo';

interface SubtaskListProps {
  todoId: string;
  subtasks: Subtask[];
  onAdd: (todoId: string, title: string) => void;
  onToggle: (todoId: string, subtaskId: string) => void;
  onDelete: (todoId: string, subtaskId: string) => void;
}

export default function SubtaskList({ todoId, subtasks, onAdd, onToggle, onDelete }: SubtaskListProps) {
  const [input, setInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const done = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length > 0 ? (done / subtasks.length) * 100 : 0;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && input.trim()) {
      onAdd(todoId, input.trim());
      setInput('');
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
      setInput('');
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {subtasks.length > 0 && (
        <div className="nm-inset p-2.5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium" style={{ color: 'var(--nm-muted)' }}>서브태스크</span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--nm-muted)' }}>{done}/{subtasks.length}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--nm-accent)' }}
            />
          </div>
          <div className="space-y-1 pt-0.5">
            {subtasks.map(s => (
              <div key={s.id} className="flex items-center gap-2 group/sub">
                <button
                  onClick={() => onToggle(todoId, s.id)}
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    s.completed ? 'border-indigo-400 bg-indigo-400' : 'border-current hover:border-indigo-400'
                  }`}
                  style={{ color: 'var(--nm-muted)' }}
                >
                  {s.completed && (
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </button>
                <span
                  className={`text-xs flex-1 leading-relaxed ${s.completed ? 'line-through' : ''}`}
                  style={{ color: s.completed ? 'var(--nm-muted)' : 'var(--nm-text)' }}
                >
                  {s.title}
                </span>
                <button
                  onClick={() => onDelete(todoId, s.id)}
                  className="opacity-0 group-hover/sub:opacity-100 w-4 h-4 flex items-center justify-center rounded text-xs hover:text-red-400 transition-all"
                  style={{ color: 'var(--nm-muted)' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdding ? (
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (!input.trim()) { setIsAdding(false); } }}
          placeholder="입력 후 Enter, Esc로 닫기"
          className="w-full text-xs px-3 py-2 nm-inset outline-none rounded-lg placeholder:opacity-50"
          style={{ color: 'var(--nm-text)', background: 'transparent' }}
          autoFocus
        />
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg hover:opacity-70 transition-opacity"
          style={{ color: 'var(--nm-muted)' }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          서브태스크 추가
        </button>
      )}
    </div>
  );
}
