'use client';

import { useState } from 'react';
import { Todo } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';

interface OverdueBadgeProps {
  overdueTodos: Todo[];
  onToggle: (id: string) => void;
  onEditTodo?: (id: string) => void;
  bottomOffset?: number;
  align?: 'left' | 'right';
  sideOffset?: number;
}

export default function OverdueBadge({
  overdueTodos,
  onToggle,
  onEditTodo,
  bottomOffset = 80,
  align = 'left',
  sideOffset = 16,
}: OverdueBadgeProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  if (overdueTodos.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes overdue-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5), 0 4px 16px rgba(239,68,68,0.35); }
          50%       { box-shadow: 0 0 0 10px rgba(239,68,68,0), 0 4px 16px rgba(239,68,68,0.35); }
        }
        @keyframes overdue-bounce {
          0%, 100% { transform: translateY(0); }
          40%       { transform: translateY(-5px); }
          60%       { transform: translateY(-2px); }
        }
      `}</style>

      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 flex items-center gap-1.5 rounded-full transition-all active:scale-95"
        style={{
          bottom: `calc(env(safe-area-inset-bottom) + ${bottomOffset}px)`,
          [align === 'right' ? 'right' : 'left']: sideOffset,
          background: '#ef4444',
          color: 'white',
          padding: '8px 14px 8px 10px',
          animation: 'overdue-pulse 2s ease-in-out infinite, overdue-bounce 3s ease-in-out infinite',
        }}
      >
        <span className="text-base font-bold leading-none">!</span>
        <span className="text-xs font-bold tabular-nums">{overdueTodos.length}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden"
            style={{
              background: 'var(--card)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="flex-shrink-0 pt-3 pb-0">
              <div className="w-10 h-1 rounded-full mx-auto mb-4 md:hidden" style={{ background: 'var(--border)' }} />
              <div className="flex items-center justify-between px-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: '#ef4444' }}
                  >!</span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {t.date.overdue(overdueTodos.length)}
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--border)', color: 'var(--muted)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {overdueTodos.map(todo => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <button
                    onClick={() => onToggle(todo.id)}
                    className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90"
                    style={{ borderColor: '#ef4444', background: 'transparent' }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>

                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => { if (onEditTodo) { onEditTodo(todo.id); setOpen(false); } }}
                  >
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{todo.title}</p>
                    {todo.dueDate && (
                      <p className="text-xs mt-0.5" style={{ color: '#ef4444' }}>
                        {todo.dueDate.replace(/-/g, '.')}
                      </p>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
