'use client';

import { useState } from 'react';
import { Todo } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  trashedTodos: Todo[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
  onBack?: () => void;
}

export default function TrashView({ trashedTodos, onRestore, onPermanentDelete, onEmptyTrash, onBack }: Props) {
  const { t } = useLanguage();
  const [emptyConfirm, setEmptyConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function formatDeletedAt(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return t.trash.deletedToday;
    if (diffDays === 1) return t.trash.deletedYesterday;
    return t.trash.deletedDaysAgo(diffDays);
  }

  return (
    <div className="mx-auto px-4 md:px-8 py-6 md:py-8" style={{ maxWidth: 720 }}>
<div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t.trash.title}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {trashedTodos.length > 0 ? t.trash.items(trashedTodos.length) : t.trash.emptyLabel}
          </p>
        </div>

        {trashedTodos.length > 0 && (
          emptyConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{t.trash.confirmDelete}</span>
              <button
                onClick={() => { onEmptyTrash(); setEmptyConfirm(false); }}
                className="px-3 py-1.5 text-xs rounded-lg font-medium"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
              >
                {t.common.delete}
              </button>
              <button
                onClick={() => setEmptyConfirm(false)}
                className="px-3 py-1.5 text-xs rounded-lg"
                style={{ color: 'var(--muted)' }}
              >
                {t.common.cancel}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEmptyConfirm(true)}
              className="px-4 py-2 text-sm rounded-xl font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
            >
              {t.common.deleteAll}
            </button>
          )
        )}
      </div>

      {trashedTodos.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🗑️</div>
          <p className="font-medium" style={{ color: 'var(--text)' }}>{t.trash.empty}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{t.trash.emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trashedTodos.map(todo => (
            <div
              key={todo.id}
              className="rounded-xl px-4 py-3"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-through truncate" style={{ color: 'var(--muted)' }}>
                    {todo.title}
                  </p>
                  {todo.deletedAt && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                      {formatDeletedAt(todo.deletedAt)}
                    </p>
                  )}
                </div>

                {deleteConfirmId === todo.id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{t.trash.permanentDelete}</span>
                    <button
                      onClick={() => { onPermanentDelete(todo.id); setDeleteConfirmId(null); }}
                      className="px-2.5 py-1 text-xs rounded-lg font-medium"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                    >
                      {t.common.delete}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 text-xs rounded-lg"
                      style={{ color: 'var(--muted)' }}
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onRestore(todo.id)}
                      className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors"
                      style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                    >
                      {t.common.restore}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(todo.id)}
                      className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                    >
                      {t.common.delete}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
