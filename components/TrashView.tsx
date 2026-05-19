'use client';

import { useState } from 'react';
import { Todo } from '@/types/todo';

interface Props {
  trashedTodos: Todo[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
  onBack?: () => void;
}

function formatDeletedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return '오늘 삭제됨';
  if (diffDays === 1) return '어제 삭제됨';
  return `${diffDays}일 전 삭제됨`;
}

export default function TrashView({ trashedTodos, onRestore, onPermanentDelete, onEmptyTrash, onBack }: Props) {
  const [emptyConfirm, setEmptyConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <div className="mx-auto px-4 md:px-8 py-6 md:py-8" style={{ maxWidth: 720 }}>
<div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>휴지통</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {trashedTodos.length > 0 ? `${trashedTodos.length}개 항목` : '비어 있음'}
          </p>
        </div>

        {trashedTodos.length > 0 && (
          emptyConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>정말 삭제할까요?</span>
              <button
                onClick={() => { onEmptyTrash(); setEmptyConfirm(false); }}
                className="px-3 py-1.5 text-xs rounded-lg font-medium"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
              >
                삭제
              </button>
              <button
                onClick={() => setEmptyConfirm(false)}
                className="px-3 py-1.5 text-xs rounded-lg"
                style={{ color: 'var(--muted)' }}
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEmptyConfirm(true)}
              className="px-4 py-2 text-sm rounded-xl font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
            >
              모두 삭제
            </button>
          )
        )}
      </div>

      {trashedTodos.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🗑️</div>
          <p className="font-medium" style={{ color: 'var(--text)' }}>휴지통이 비어 있어요</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>삭제된 할 일이 여기에 나타납니다</p>
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
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>영구 삭제?</span>
                    <button
                      onClick={() => { onPermanentDelete(todo.id); setDeleteConfirmId(null); }}
                      className="px-2.5 py-1 text-xs rounded-lg font-medium"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 text-xs rounded-lg"
                      style={{ color: 'var(--muted)' }}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onRestore(todo.id)}
                      className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors"
                      style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                    >
                      복구
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(todo.id)}
                      className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                    >
                      삭제
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
