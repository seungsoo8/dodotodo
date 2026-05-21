'use client';

import { useState, useEffect, useRef } from 'react';
import { Todo } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';

const HISTORY_KEY = 'dodotodo-search-history';
const MAX_HISTORY = 6;

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); } catch { return []; }
}
function pushHistory(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const prev = getHistory().filter(q => q !== trimmed);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([trimmed, ...prev].slice(0, MAX_HISTORY)));
}
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

interface Props {
  allTodos: Todo[];
  onClose: () => void;
  onToggle?: (id: string) => void;
  onSelect?: (todo: Todo) => void;
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

export default function GlobalSearchOverlay({ allTodos, onClose, onToggle, onSelect }: Props) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(getHistory());
    requestAnimationFrame(() => setVisible(true));
    inputRef.current?.focus();
  }, []);

  const q = query.toLowerCase().trim();
  const results = q.length < 1 ? [] : allTodos.filter(todo => {
    if (todo.deletedAt) return false;
    if (todo.title.toLowerCase().includes(q)) return true;
    if (todo.description?.toLowerCase().includes(q)) return true;
    if (todo.tags?.some(tag => tag.toLowerCase().includes(q))) return true;
    if (todo.category?.toLowerCase().includes(q)) return true;
    return false;
  }).slice(0, 20);

  const activeResults = results.filter(t => !t.completed);
  const completedResults = results.filter(t => t.completed);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 180);
  }

  function handleSelect(todo: Todo) {
    pushHistory(query);
    setHistory(getHistory());
    if (onSelect) onSelect(todo);
    else handleClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { handleClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) { handleSelect(results[selectedIdx]); }
  }

  const today = new Date().toISOString().slice(0, 10);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((date.getTime() - todayDate.getTime()) / 86400000);
    if (diff < 0) return t.date.overdue(Math.abs(diff));
    if (diff === 0) return t.date.today;
    if (diff === 1) return t.date.tomorrow;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function ResultRow({ todo, index }: { todo: Todo; index: number }) {
    const isOverdue = todo.dueDate && !todo.completed && todo.dueDate < today;
    const isSelected = index === selectedIdx;
    return (
      <div
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
        style={{ background: isSelected ? 'var(--accent-muted)' : 'transparent' }}
        onClick={() => handleSelect(todo)}
        onMouseEnter={() => setSelectedIdx(index)}
      >
        {onToggle ? (
          <button
            onClick={e => { e.stopPropagation(); onToggle(todo.id); }}
            className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
            style={{
              background: todo.completed ? 'var(--accent)' : 'transparent',
              borderColor: todo.completed ? 'var(--accent)' : (todo.colorTag || 'var(--border)'),
            }}
          >
            {todo.completed && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ) : (
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: todo.completed ? 'var(--border)' : (todo.colorTag || 'var(--accent)') }} />
        )}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-snug truncate"
            style={{ color: todo.completed ? 'var(--muted)' : 'var(--text)', textDecoration: todo.completed ? 'line-through' : 'none' }}
          >
            <Highlighted text={todo.title} query={query} />
          </p>
          {todo.description && (
            <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
              <Highlighted text={todo.description} query={query} />
            </p>
          )}
        </div>
        {todo.dueDate && (
          <span className="text-xs font-medium flex-shrink-0" style={{ color: isOverdue ? 'var(--destructive)' : 'var(--muted)' }}>
            {formatDate(todo.dueDate)}
          </span>
        )}
      </div>
    );
  }

  const quickTodos = q.length === 0
    ? allTodos.filter(t => !t.deletedAt && !t.completed && t.myDay).slice(0, 5)
    : [];

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center"
      style={{
        background: visible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        backdropFilter: 'blur(4px)',
        transition: 'background 0.18s',
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: 640,
          margin: 'calc(env(safe-area-inset-top) + 56px) 16px 0',
          background: 'var(--card)',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
          maxHeight: 'calc(100vh - env(safe-area-inset-top) - 80px)',
          overflow: 'hidden',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.98)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1), opacity 0.18s',
        }}
      >
        {/* 검색 입력 */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={t.globalSearch.placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-base outline-none bg-transparent"
            style={{ color: 'var(--text)' }}
          />
          {query ? (
            <button onClick={() => setQuery('')} className="p-1 rounded-full transition-colors" style={{ color: 'var(--muted)', background: 'var(--border)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
          <button
            onClick={handleClose}
            className="text-sm font-medium px-2 py-1 rounded-lg flex-shrink-0 transition-colors active:opacity-60"
            style={{ color: 'var(--accent)' }}
          >
            취소
          </button>
        </div>

        {/* 결과 */}
        <div className="overflow-y-auto flex-1" ref={listRef}>
          {q.length === 0 ? (
            <div className="py-3">
              {/* 오늘 할 일 빠른 접근 */}
              {quickTodos.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold px-4 py-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>오늘 할 일</p>
                  {quickTodos.map(todo => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors active:opacity-70"
                      style={{ background: 'transparent' }}
                      onClick={() => handleSelect(todo)}
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: todo.colorTag || 'var(--accent)' }} />
                      <p className="text-sm truncate flex-1" style={{ color: 'var(--text)' }}>{todo.title}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 최근 검색 */}
              {history.length > 0 && (
                <div>
                  <div className="flex items-center px-4 py-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider flex-1" style={{ color: 'var(--muted)' }}>최근 검색</p>
                    <button
                      onClick={() => { clearHistory(); setHistory([]); }}
                      className="text-xs active:opacity-60"
                      style={{ color: 'var(--muted)' }}
                    >지우기</button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-4 pb-3">
                    {history.map(q => (
                      <button
                        key={q}
                        onClick={() => setQuery(q)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors active:opacity-70"
                        style={{ background: 'var(--border)', color: 'var(--text)' }}
                      >
                        <svg className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quickTodos.length === 0 && history.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{t.globalSearch.placeholder}</p>
                </div>
              )}
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t.globalSearch.noResults}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{t.globalSearch.noResultsDesc}</p>
            </div>
          ) : (
            <div className="py-1">
              {activeResults.length > 0 && (
                <>
                  {completedResults.length > 0 && (
                    <p className="text-xs font-semibold px-4 py-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>할 일</p>
                  )}
                  {activeResults.map((todo, i) => <ResultRow key={todo.id} todo={todo} index={i} />)}
                </>
              )}
              {completedResults.length > 0 && (
                <>
                  <p className="text-xs font-semibold px-4 py-1.5 mt-1 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>완료됨</p>
                  {completedResults.map((todo, i) => <ResultRow key={todo.id} todo={todo} index={activeResults.length + i} />)}
                </>
              )}
            </div>
          )}
        </div>

        {/* 하단 힌트 */}
        {results.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{t.globalSearch.results(results.length)}</span>
            <span className="text-xs ml-auto hidden md:inline" style={{ color: 'var(--muted)', opacity: 0.6 }}>{t.globalSearch.hint}</span>
          </div>
        )}
      </div>
    </div>
  );
}
