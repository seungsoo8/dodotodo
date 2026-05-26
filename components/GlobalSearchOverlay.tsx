'use client';

import { useState, useEffect, useRef } from 'react';
import { Todo } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';
import { callGeminiSearch } from '@/lib/gemini';

const MAX_HISTORY = 6;

function historyKey(userId?: string) {
  return userId ? `dodotodo-search-${userId}` : 'dodotodo-search-history';
}
function getHistory(userId?: string): string[] {
  try { return JSON.parse(localStorage.getItem(historyKey(userId)) ?? '[]'); } catch { return []; }
}
function pushHistory(query: string, userId?: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const prev = getHistory(userId).filter(q => q !== trimmed);
  localStorage.setItem(historyKey(userId), JSON.stringify([trimmed, ...prev].slice(0, MAX_HISTORY)));
}
function clearHistory(userId?: string) {
  localStorage.removeItem(historyKey(userId));
}

interface Props {
  allTodos: Todo[];
  onClose: () => void;
  onToggle?: (id: string) => void;
  onSelect?: (todo: Todo) => void;
  userId?: string;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--accent-muted)', color: 'var(--accent)', borderRadius: 3, padding: '0 2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function GlobalSearchOverlay({ allTodos, onClose, onToggle, onSelect, userId }: Props) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [aiMode, setAiMode] = useState(false);
  const [aiResults, setAiResults] = useState<Todo[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(getHistory(userId));
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

  useEffect(() => {
    setSelectedIdx(0);
    if (!aiMode || query.trim().length < 2) { setAiResults(null); return; }
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setAiLoading(true);
    aiTimerRef.current = setTimeout(async () => {
      try {
        const todoData = allTodos.filter(t => !t.deletedAt).map(t => ({
          id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority,
          completed: t.completed, description: t.description,
        }));
        const ids = await callGeminiSearch(query.trim(), todoData);
        const matched = ids.map(id => allTodos.find(t => t.id === id)).filter(Boolean) as Todo[];
        setAiResults(matched);
      } catch {
        setAiResults(null);
      } finally {
        setAiLoading(false);
      }
    }, 700);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [query, aiMode]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 180);
  }

  function handleSelect(todo: Todo) {
    pushHistory(query, userId);
    setHistory(getHistory(userId));
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
    const accentColor = todo.colorTag || 'var(--accent)';
    return (
      <div
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all relative"
        style={{
          background: isSelected ? 'var(--accent-muted)' : 'transparent',
          borderRadius: 12,
          margin: '1px 8px',
        }}
        onClick={() => handleSelect(todo)}
        onMouseEnter={() => setSelectedIdx(index)}
      >
        {/* 컬러 인디케이터 */}
        <div className="w-0.5 h-8 rounded-full flex-shrink-0 self-stretch" style={{
          background: todo.completed ? 'var(--border)' : accentColor,
          opacity: todo.completed ? 0.4 : 0.7,
        }} />

        {onToggle ? (
          <button
            onClick={e => { e.stopPropagation(); onToggle(todo.id); }}
            className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
            style={{
              background: todo.completed ? accentColor : 'transparent',
              borderColor: todo.completed ? accentColor : 'var(--border)',
            }}
          >
            {todo.completed && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ) : (
          <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: todo.completed ? 'var(--border)' : `${accentColor}20`, border: `1.5px solid ${todo.completed ? 'var(--border)' : accentColor}` }}>
            {todo.completed && (
              <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                style={{ color: 'var(--muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-snug truncate"
            style={{
              color: todo.completed ? 'var(--muted)' : 'var(--text)',
              textDecoration: todo.completed ? 'line-through' : 'none',
            }}
          >
            <Highlighted text={todo.title} query={query} />
          </p>
          {(todo.description || (todo.tags && todo.tags.length > 0)) && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {todo.description && (
                <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                  <Highlighted text={todo.description} query={query} />
                </p>
              )}
              {todo.tags && todo.tags.length > 0 && !todo.description && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--border)', color: 'var(--muted)' }}>
                  #{todo.tags[0]}
                </span>
              )}
            </div>
          )}
        </div>

        {todo.urgency === 'urgent' && !todo.completed && (
          <span className="text-xs flex-shrink-0">⚡</span>
        )}
        {todo.dueDate && (
          <span
            className="text-xs font-medium flex-shrink-0 px-2 py-0.5 rounded-full"
            style={{
              background: isOverdue ? 'rgba(239,68,68,0.1)' : 'var(--border)',
              color: isOverdue ? '#ef4444' : 'var(--muted)',
            }}
          >
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
        background: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'background 0.2s',
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: 640,
          margin: 'calc(env(safe-area-inset-top) + 48px) 14px 0',
          background: 'var(--card)',
          borderRadius: 22,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
          maxHeight: 'calc(100vh - env(safe-area-inset-top) - 72px)',
          overflow: 'hidden',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.24s cubic-bezier(0.34,1.2,0.64,1), opacity 0.18s',
        }}
      >
        {/* 검색 입력 */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-2xl"
            style={{ background: 'var(--bg)' }}>
            {aiMode ? (
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#a78bfa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            <input
              ref={inputRef}
              type="text"
              placeholder={aiMode ? '예: 이번 주 마감, 우선순위 높은 것...' : t.globalSearch.placeholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: 'var(--text)' }}
            />
            {aiLoading && (
              <div className="w-3.5 h-3.5 flex-shrink-0 rounded-full border-2 animate-spin"
                style={{ borderColor: '#c4b5fd', borderTopColor: 'transparent' }} />
            )}
            {query && !aiLoading && (
              <button onClick={() => { setQuery(''); setAiResults(null); }}
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--muted)', opacity: 0.5 }}>
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={() => { setAiMode(v => !v); setAiResults(null); }}
            className="text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 transition-all"
            style={{
              background: aiMode ? 'linear-gradient(135deg,#a78bfa,#6366f1)' : 'var(--bg)',
              color: aiMode ? '#fff' : 'var(--muted)',
              boxShadow: aiMode ? '0 2px 12px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            ✦ AI
          </button>
          <button
            onClick={handleClose}
            className="text-sm font-semibold flex-shrink-0 transition-colors active:opacity-60"
            style={{ color: 'var(--accent)' }}
          >
            취소
          </button>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />

        {/* 결과 */}
        <div className="overflow-y-auto flex-1 py-2" ref={listRef}>
          {aiMode && aiResults !== null && q.length > 1 ? (
            <div>
              <SectionLabel icon="✦" label="AI 검색 결과" color="#a78bfa" />
              {aiResults.length === 0 ? (
                <EmptyState icon="✦" title="결과 없음" desc="다른 표현으로 검색해보세요" />
              ) : (
                aiResults.map((todo, i) => <ResultRow key={todo.id} todo={todo} index={i} />)
              )}
            </div>
          ) : q.length === 0 ? (
            <div>
              {quickTodos.length > 0 && (
                <div className="mb-1">
                  <SectionLabel icon="☀️" label="오늘 할 일" />
                  {quickTodos.map(todo => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer active:opacity-70 transition-opacity"
                      style={{ margin: '1px 8px', borderRadius: 12 }}
                      onClick={() => handleSelect(todo)}
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: todo.colorTag || 'var(--accent)' }} />
                      <p className="text-sm truncate flex-1" style={{ color: 'var(--text)' }}>{todo.title}</p>
                    </div>
                  ))}
                </div>
              )}

              {history.length > 0 && (
                <div>
                  <div className="flex items-center px-4 py-2">
                    <p className="text-xs font-semibold flex-1" style={{ color: 'var(--muted)' }}>최근 검색</p>
                    <button
                      onClick={() => { clearHistory(userId); setHistory([]); }}
                      className="text-xs active:opacity-60 transition-opacity"
                      style={{ color: 'var(--muted)', opacity: 0.7 }}
                    >지우기</button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-4 pb-2">
                    {history.map(item => (
                      <button
                        key={item}
                        onClick={() => setQuery(item)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all active:scale-95"
                        style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                      >
                        <svg className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quickTodos.length === 0 && history.length === 0 && (
                <EmptyState icon="🔍" title={t.globalSearch.placeholder} desc="" />
              )}
            </div>
          ) : results.length === 0 ? (
            <EmptyState icon="🔍" title={t.globalSearch.noResults} desc={t.globalSearch.noResultsDesc} />
          ) : (
            <div>
              {activeResults.length > 0 && (
                <>
                  {completedResults.length > 0 && <SectionLabel label="할 일" />}
                  {activeResults.map((todo, i) => <ResultRow key={todo.id} todo={todo} index={i} />)}
                </>
              )}
              {completedResults.length > 0 && (
                <>
                  <SectionLabel label="완료됨" />
                  {completedResults.map((todo, i) => <ResultRow key={todo.id} todo={todo} index={activeResults.length + i} />)}
                </>
              )}
            </div>
          )}
        </div>

        {/* 하단 */}
        {(aiMode ? (aiResults?.length ?? 0) > 0 : results.length > 0) && (
          <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs font-medium" style={{ color: aiMode ? '#a78bfa' : 'var(--muted)' }}>
              {aiMode ? `✦ AI ${aiResults!.length}개` : `${results.length}개`}
            </span>
            <span className="text-xs ml-auto hidden md:inline" style={{ color: 'var(--muted)', opacity: 0.5 }}>
              {t.globalSearch.hint}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ label, icon, color }: { label: string; icon?: string; color?: string }) {
  return (
    <p className="text-xs font-semibold px-4 py-1.5 flex items-center gap-1.5"
      style={{ color: color ?? 'var(--muted)' }}>
      {icon && <span>{icon}</span>}
      {label}
    </p>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="py-10 text-center flex flex-col items-center gap-2">
      <span className="text-3xl opacity-30">{icon}</span>
      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{title}</p>
      {desc && <p className="text-xs" style={{ color: 'var(--muted)' }}>{desc}</p>}
    </div>
  );
}
