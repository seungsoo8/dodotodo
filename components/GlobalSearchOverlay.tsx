'use client';

import { useState, useEffect, useRef } from 'react';
import { Todo } from '@/types/todo';

interface Props {
  allTodos: Todo[];
  onClose: () => void;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PRIORITY_COLORS = { high: '#ff3b30', medium: '#ff9500', low: '#34c759' };

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((date.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}일 지남`;
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--accent-muted)', color: 'var(--accent)', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function GlobalSearchOverlay({ allTodos, onClose, onToggle, onDelete }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.toLowerCase().trim();
  const results = q.length < 1 ? [] : allTodos.filter(t => {
    if (t.deletedAt) return false;
    if (t.title.toLowerCase().includes(q)) return true;
    if (t.description?.toLowerCase().includes(q)) return true;
    if (t.tags?.some(tag => tag.toLowerCase().includes(q))) return true;
    if (t.category?.toLowerCase().includes(q)) return true;
    return false;
  }).slice(0, 20);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results.length > 0) { onClose(); }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: 640,
          margin: 'calc(env(safe-area-inset-top) + 48px) 16px 0',
          background: 'var(--card)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-float)',
          maxHeight: 'calc(100vh - env(safe-area-inset-top) - 80px)',
          overflow: 'hidden',
        }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="할 일 검색..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-base outline-none bg-transparent"
            style={{ color: 'var(--text)' }}
          />
          {query ? (
            <button onClick={() => setQuery('')} className="p-1 rounded-md transition-colors" style={{ color: 'var(--muted)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
            style={{ color: 'var(--muted)', background: 'var(--border)' }}
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1" ref={listRef}>
          {q.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-3xl mb-3">🔍</div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>제목, 내용, 태그로 검색</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-3xl mb-3">🕵️</div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>결과가 없어요</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>다른 검색어를 입력해보세요</p>
            </div>
          ) : (
            <div className="py-1">
              {results.map((todo, i) => {
                const isOverdue = todo.dueDate && !todo.completed && todo.dueDate < today;
                const isSelected = i === selectedIdx;
                return (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{ background: isSelected ? 'var(--accent-muted)' : 'transparent' }}
                    onClick={onClose}
                    onMouseEnter={() => setSelectedIdx(i)}
                  >
                    {/* 완료 체크 버튼 */}
                    {onToggle && (
                      <button
                        onClick={e => { e.stopPropagation(); onToggle(todo.id); }}
                        className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                        style={{
                          background: todo.completed ? 'var(--accent)' : 'transparent',
                          borderColor: todo.completed ? 'var(--accent)' : PRIORITY_COLORS[todo.priority],
                        }}
                      >
                        {todo.completed && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )}
                    {!onToggle && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                        style={{ background: todo.completed ? 'var(--border)' : PRIORITY_COLORS[todo.priority] }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium leading-snug"
                        style={{
                          color: todo.completed ? 'var(--muted)' : 'var(--text)',
                          textDecoration: todo.completed ? 'line-through' : 'none',
                        }}
                      >
                        <Highlighted text={todo.title} query={query} />
                      </p>
                      {todo.description && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>
                          <Highlighted text={todo.description} query={query} />
                        </p>
                      )}
                      {(todo.tags?.length ?? 0) > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {todo.tags!.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-1.5 py-0 rounded-full" style={{ background: 'var(--border)', color: 'var(--muted)' }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        {todo.completed && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(52,199,89,0.15)', color: 'var(--success)' }}>완료</span>
                        )}
                        {todo.dueDate && (
                          <span className="text-xs font-medium" style={{ color: isOverdue ? 'var(--destructive)' : 'var(--muted)' }}>
                            {isOverdue && '⚠ '}{formatDate(todo.dueDate)}
                          </span>
                        )}
                      </div>
                      {/* 삭제 버튼 */}
                      {onDelete && (
                        <button
                          onClick={e => { e.stopPropagation(); onDelete(todo.id); }}
                          className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                          style={{ color: 'var(--muted)', background: 'var(--border)' }}
                          title="삭제"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{results.length}개 결과</span>
            <span className="text-xs ml-auto hidden md:inline" style={{ color: 'var(--muted)', opacity: 0.6 }}>↑↓ 이동 · Enter 닫기 · Esc 취소</span>
          </div>
        )}
      </div>
    </div>
  );
}
