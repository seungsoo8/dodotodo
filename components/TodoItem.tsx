'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Timer, RefreshCw, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { Project, Todo } from '@/types/todo';
import TodoForm from './TodoForm';
import SubtaskList from './SubtaskList';
import { useLanguage } from '@/contexts/LanguageContext';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  onStartPomodoro?: (todoId: string) => void;
  isDragOverlay?: boolean;
  compact?: boolean;
  autoEdit?: boolean;
  onAutoEditDone?: () => void;
  projects?: Project[];
}

const DEFAULT_DOT_COLOR = 'var(--accent)';

// formatDate is defined inside TodoItem to access t

type DueStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none';

function getDueStatus(dueDate: string | undefined, completed: boolean): DueStatus {
  if (!dueDate || completed) return 'none';
  const date = new Date(dueDate + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((date.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return 'upcoming';
}

function getDDayLabel(dueDate: string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export default function TodoItem({
  todo, onToggle, onUpdate, onDelete,
  onAddSubtask, onToggleSubtask, onDeleteSubtask,
  onStartPomodoro, isDragOverlay, compact = false,
  autoEdit, onAutoEditDone, projects,
}: TodoItemProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (autoEdit) {
      setIsEditing(true);
      onAutoEditDone?.();
    }
  }, [autoEdit, onAutoEditDone]);
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swiping = useRef(false);
  const SWIPE_THRESHOLD = 75;

  function onTouchStart(e: React.TouchEvent) {
    swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    swiping.current = false;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!swipeStart.current) return;
    const dx = e.touches[0].clientX - swipeStart.current.x;
    const dy = e.touches[0].clientY - swipeStart.current.y;
    if (!swiping.current && Math.abs(dx) < Math.abs(dy)) return;
    if (!swiping.current && Math.abs(dx) > 8) swiping.current = true;
    if (!swiping.current) return;
    e.stopPropagation();
    setSwipeX(Math.max(-110, Math.min(110, dx)));
  }
  function onTouchEnd() {
    if (!swiping.current) { swipeStart.current = null; return; }
    if (swipeX > SWIPE_THRESHOLD) onToggle(todo.id);
    else if (swipeX < -SWIPE_THRESHOLD) onDelete(todo.id);
    setSwipeX(0);
    swipeStart.current = null;
    swiping.current = false;
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((date.getTime() - todayDate.getTime()) / 86400000);
    if (diff < 0) return t.date.overdue(Math.abs(diff));
    if (diff === 0) return t.date.today;
    if (diff === 1) return t.date.tomorrow;
    if (diff < 7) return t.date.daysLater(diff);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  const dueStatus = getDueStatus(todo.dueDate, todo.completed);
  const dotColor = todo.colorTag || DEFAULT_DOT_COLOR;
  const subtaskDone = todo.subtasks.filter(s => s.completed).length;
  const hasSubtasks = todo.subtasks.length > 0;

  const dueConfig: Record<DueStatus, { color: string; bg: string }> = {
    overdue:  { color: 'var(--destructive)', bg: 'rgba(255,59,48,0.1)' },
    today:    { color: '#ff9500', bg: 'rgba(255,149,0,0.1)' },
    tomorrow: { color: 'var(--muted)', bg: 'var(--accent-muted)' },
    upcoming: { color: 'var(--muted)', bg: 'var(--border)' },
    none:     { color: '', bg: '' },
  };

  // ─── PC 컴팩트 모드 ───
  if (compact) {
    // 드래그 오버레이
    if (isDragOverlay) {
      return (
        <div
          className="flex items-center gap-2.5 px-4 py-2 rounded-lg"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', maxWidth: 400, opacity: 0.95 }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
          <span className="text-sm truncate" style={{ color: 'var(--text)' }}>{todo.title}</span>
        </div>
      );
    }
    // 편집 폼
    if (isEditing) {
      return (
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="px-4 py-3">
            <TodoForm
              initialData={todo}
              onSubmit={updates => { onUpdate(todo.id, updates); setIsEditing(false); }}
              onCancel={() => setIsEditing(false)}
              projects={projects}
            />
          </div>
        </div>
      );
    }

    const hasDetail = todo.description || (todo.tags?.length ?? 0) > 0 || todo.subtasks.length > 0;

    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      >
        {/* 컴팩트 행 */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`flex items-center gap-2.5 px-4 py-2 transition-colors${dueStatus === 'overdue' ? ' border-red-200' : ''}`}
          style={{
            borderBottom: expanded ? 'none' : '1px solid var(--border)',
            background: isHovered || expanded ? 'var(--card)' : 'transparent',
            opacity: todo.completed ? 0.55 : 1,
          }}
        >
          {/* 라벨 색상 점 */}
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: todo.completed ? 'var(--border)' : dotColor }} />

          {/* 체크박스 */}
          <button
            onClick={() => onToggle(todo.id)}
            className="flex-shrink-0 transition-all"
            style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `1.5px solid ${todo.completed ? 'var(--accent)' : 'var(--border)'}`,
              background: todo.completed ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {todo.completed && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* 제목 + 설명 미리보기 */}
          <div className="flex-1 min-w-0">
            <button
              className="text-left text-sm leading-snug truncate w-full"
              style={{ color: todo.completed ? 'var(--muted)' : 'var(--text)', textDecoration: todo.completed ? 'line-through' : 'none' }}
              onClick={() => hasDetail ? setExpanded(v => !v) : setIsEditing(true)}
            >
              {todo.title}
            </button>
            {todo.description && !expanded && (
              <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{todo.description}</p>
            )}
          </div>

          {/* 인라인 메타 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 반복 배지 */}
            {todo.recurring !== 'none' && (
              <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--accent)', background: 'var(--accent-muted)' }}>
                <RefreshCw className="w-2.5 h-2.5" /> {todo.recurring === 'daily' ? t.recurring.daily : todo.recurring === 'weekly' ? t.recurring.weekly : t.recurring.monthly}
              </span>
            )}

            {/* 날짜 + D-Day */}
            {(todo.startDate || (todo.dueDate && dueStatus !== 'none')) && (
              <span className="text-xs font-medium" style={{ color: todo.dueDate && dueStatus !== 'none' ? dueConfig[dueStatus].color : 'var(--muted)' }}>
                {todo.startDate && todo.dueDate
                  ? `${todo.startDate.slice(5).replace('-', '.')} ~ ${dueStatus === 'overdue' ? '⚠ ' : ''}${formatDate(todo.dueDate)}`
                  : todo.startDate
                  ? todo.startDate.slice(5).replace('-', '.')
                  : `${dueStatus === 'overdue' ? '⚠ ' : ''}${formatDate(todo.dueDate!)}`}
              </span>
            )}
            {todo.dueDate && !todo.completed && dueStatus !== 'none' && (
              <span className="text-xs font-bold px-1 py-0.5 rounded" style={{ color: dueConfig[dueStatus].color, background: dueConfig[dueStatus].bg, fontSize: 10 }}>
                {getDDayLabel(todo.dueDate)}
              </span>
            )}

            {/* 카테고리 */}
            {todo.category && (
              <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ color: 'var(--muted)', background: 'var(--border)' }}>
                {todo.category}
              </span>
            )}

            {/* 서브태스크 버튼 */}
            <button
              className="text-xs tabular-nums"
              style={{ color: 'var(--muted)' }}
              onClick={() => setExpanded(v => !v)}
            >
              {hasSubtasks ? `${subtaskDone}/${todo.subtasks.length}` : t.todo.subtasks}
            </button>

            {/* 포모도로 */}
            {todo.pomodoroCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--muted)' }}><Timer className="w-3 h-3" /> {todo.pomodoroCount}</span>
            )}
          </div>

          {/* 호버 액션 / 삭제 확인 */}
          {!deleteConfirm ? (
            <div
              className="flex items-center gap-0.5 flex-shrink-0 transition-opacity"
              style={{ opacity: isHovered || todo.important ? 1 : 0 }}
            >
              {/* 중요 별표 */}
              <button
                onClick={() => onUpdate(todo.id, { important: !todo.important })}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                title={todo.important ? '중요 해제' : '중요 표시'}
                style={{ color: todo.important ? '#f59e0b' : 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={todo.important ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
              {onStartPomodoro && !todo.completed && (
                <button
                  onClick={() => onStartPomodoro(todo.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                  title={t.analytics.pomodoro}
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-muted)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                ><Timer className="w-3.5 h-3.5" /></button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: 'var(--muted)' }}
                title={t.common.edit}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: 'var(--muted)' }}
                title={t.common.delete}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,59,48,0.1)'; (e.currentTarget as HTMLElement).style.color = 'var(--destructive)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {hasDetail && (
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                  style={{ color: expanded ? 'var(--accent)' : 'var(--muted)' }}
                  title={expanded ? t.common.close : t.todo.detail}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <ChevronDown className="w-3.5 h-3.5 transition-transform duration-150" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
                </button>
              )}
              {/* 드래그 핸들 */}
              <div
                {...attributes}
                {...listeners}
                className="w-6 h-7 flex items-center justify-center cursor-grab transition-colors"
                style={{ color: 'var(--muted)', opacity: 0.4, touchAction: 'none' }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="7" cy="4" r="1.5" /><circle cx="7" cy="10" r="1.5" /><circle cx="7" cy="16" r="1.5" />
                  <circle cx="13" cy="4" r="1.5" /><circle cx="13" cy="10" r="1.5" /><circle cx="13" cy="16" r="1.5" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => { onDelete(todo.id); setDeleteConfirm(false); }}
                className="text-xs px-2 py-1 rounded-md font-medium"
                style={{ background: 'var(--destructive)', color: 'white' }}
              >
                {t.common.delete}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="text-xs px-2 py-1 rounded-md font-medium"
                style={{ background: 'var(--border)', color: 'var(--muted)' }}
              >
                {t.common.cancel}
              </button>
            </div>
          )}
        </div>

        {/* 펼침 상세 */}
        {expanded && (
          <div
            className="px-10 py-3 space-y-2"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)', borderRadius: '0 0 6px 6px' }}
          >
            {todo.description && (
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{todo.description}</p>
            )}
            {(todo.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {todo.tags!.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--muted)', background: 'var(--border)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <SubtaskList todoId={todo.id} subtasks={todo.subtasks} onAdd={onAddSubtask} onToggle={onToggleSubtask} onDelete={onDeleteSubtask} />
          </div>
        )}
      </div>
    );
  }
  // ─── 모바일 카드 모드 ───

  if (isEditing) {
    return (
      <div className="mb-2.5">
        <TodoForm
          initialData={todo}
          onSubmit={updates => { onUpdate(todo.id, updates); setIsEditing(false); }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const hasCollapsedPreview = todo.startDate || todo.dueDate || hasSubtasks || todo.pomodoroCount > 0;
  const swipeProgress = Math.min(1, Math.abs(swipeX) / SWIPE_THRESHOLD);
  const iconScale = 0.55 + swipeProgress * 0.75;
  const swipeTransition = swiping.current
    ? 'opacity 0.3s ease'
    : 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s ease';

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging && !isDragOverlay ? 0 : 1,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: isDragOverlay ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      }}
      className="mb-2.5 relative"
    >
      {/* Swipe background — complete (right swipe) */}
      <div
        className="absolute inset-0 flex items-center px-5"
        style={{ background: 'var(--success)', opacity: swipeX > 0 ? 1 : 0 }}
      >
        <svg
          className="w-6 h-6 text-white"
          style={{ transform: `scale(${iconScale})`, transition: 'transform 0.08s' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      {/* Swipe background — delete (left swipe) */}
      <div
        className="absolute inset-0 flex items-center justify-end px-5"
        style={{ background: 'var(--destructive)', opacity: swipeX < 0 ? 1 : 0 }}
      >
        <svg
          className="w-6 h-6 text-white"
          style={{ transform: `scale(${iconScale})`, transition: 'transform 0.08s' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>

      {/* Card */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swipeTransition,
          background: 'var(--card)',
          opacity: todo.completed ? 0.55 : 1,
          position: 'relative',
        }}
      >
        {/* Color label bar */}
        <div
          className="absolute left-0 top-0 bottom-0"
          style={{ width: 3, background: todo.completed ? 'var(--border)' : dotColor, borderRadius: '16px 0 0 16px' }}
        />

        {/* Main row */}
        <div className="flex items-center gap-3 pl-5 pr-2 py-3.5">
          {/* Checkbox */}
          <button
            onClick={() => onToggle(todo.id)}
            className="flex-shrink-0 active:scale-90"
            style={{
              width: 24, height: 24,
              borderRadius: '50%',
              border: `2px solid ${todo.completed ? 'var(--accent)' : 'var(--border)'}`,
              background: todo.completed ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.25s ease, border-color 0.25s ease, transform 0.15s ease',
              transform: todo.completed ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {todo.completed && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                style={{ animation: 'checkPop 0.2s cubic-bezier(0.22,1,0.36,1)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0" onClick={() => setExpanded(v => !v)}>
            <span
              className="text-sm font-medium leading-snug block"
              style={{
                color: todo.completed ? 'var(--muted)' : 'var(--text)',
                textDecoration: todo.completed ? 'line-through' : 'none',
              }}
            >
              {todo.title}
            </span>

            {/* Collapsed preview row */}
            {!expanded && hasCollapsedPreview && (
              <div className="flex items-center gap-2 mt-0.5">
                {(todo.startDate || (todo.dueDate && dueStatus !== 'none')) && (
                  <span className="text-xs font-medium" style={{ color: todo.dueDate && dueStatus !== 'none' ? dueConfig[dueStatus].color : 'var(--muted)' }}>
                    {todo.startDate && todo.dueDate
                      ? `${todo.startDate.slice(5).replace('-', '.')} ~ ${dueStatus === 'overdue' ? '⚠ ' : ''}${formatDate(todo.dueDate)}`
                      : todo.startDate
                      ? todo.startDate.slice(5).replace('-', '.')
                      : `${dueStatus === 'overdue' ? '⚠ ' : ''}${formatDate(todo.dueDate!)}`}
                  </span>
                )}
                {hasSubtasks && (
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    {subtaskDone}/{todo.subtasks.length} {t.common.done}
                  </span>
                )}
                {todo.pomodoroCount > 0 && (
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>🍅×{todo.pomodoroCount}</span>
                )}
              </div>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center flex-shrink-0">
            {/* 중요 별표 */}
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate(todo.id, { important: !todo.important }); }}
              className="w-8 h-8 flex items-center justify-center transition-all active:scale-90"
              style={{ color: todo.important ? '#f59e0b' : 'var(--muted)', opacity: todo.important ? 1 : 0.4 }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={todo.important ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </button>
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-8 h-8 flex items-center justify-center transition-all active:scale-90"
              style={{ color: expanded ? 'var(--accent)' : 'var(--muted)', opacity: expanded ? 1 : 0.4 }}
            >
              <svg
                className="w-4 h-4 transition-transform duration-200"
                style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              {...attributes}
              {...listeners}
              className="w-7 h-8 flex items-center justify-center flex-shrink-0"
              style={{ color: 'var(--muted)', opacity: 0.25, touchAction: 'none' }}
              aria-label="drag"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="7" cy="4" r="1.5" />
                <circle cx="7" cy="10" r="1.5" />
                <circle cx="7" cy="16" r="1.5" />
                <circle cx="13" cy="4" r="1.5" />
                <circle cx="13" cy="10" r="1.5" />
                <circle cx="13" cy="16" r="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded detail section */}
        {expanded && (
          <div
            className="pb-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {/* Description */}
            {todo.description && (
              <p className="text-xs leading-relaxed px-5 pt-3" style={{ color: 'var(--muted)' }}>
                {todo.description}
              </p>
            )}

            {/* Meta badges */}
            {(todo.startDate || todo.dueDate || todo.category || todo.tags?.length) && (
              <div className="flex flex-wrap items-center gap-1.5 px-5 pt-3">
                {(todo.startDate || (todo.dueDate && dueStatus !== 'none')) && (
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      color: todo.dueDate && dueStatus !== 'none' ? dueConfig[dueStatus].color : 'var(--muted)',
                      background: todo.dueDate && dueStatus !== 'none' ? dueConfig[dueStatus].bg : 'var(--border)',
                    }}
                  >
                    {todo.startDate && todo.dueDate
                      ? <>{todo.startDate.slice(5).replace('-', '.')} ~ {dueStatus === 'overdue' && '⚠ '}{dueStatus === 'today' && '● '}{formatDate(todo.dueDate)}</>
                      : todo.startDate
                      ? todo.startDate.slice(5).replace('-', '.')
                      : <>{dueStatus === 'overdue' && '⚠ '}{dueStatus === 'today' && '● '}{formatDate(todo.dueDate!)}</>}
                  </span>
                )}
                {todo.dueDate && !todo.completed && dueStatus !== 'none' && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ color: dueConfig[dueStatus].color, background: dueConfig[dueStatus].bg }}>
                    {getDDayLabel(todo.dueDate)}
                  </span>
                )}
                {todo.category && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ color: 'var(--accent)', background: 'var(--accent-muted)' }}
                  >
                    {todo.category}
                  </span>
                )}
                {todo.tags?.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ color: 'var(--muted)', background: 'var(--border)' }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 px-5 pt-3">
              {onStartPomodoro && !todo.completed && (
                <button
                  onClick={() => onStartPomodoro(todo.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                  style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                  </svg>
                  {t.analytics.pomodoro}{todo.pomodoroCount > 0 && ` ×${todo.pomodoroCount}`}
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                style={{ background: 'var(--border)', color: 'var(--muted)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {t.common.edit}
              </button>
            </div>

            {/* Subtask section */}
            <div className="px-5 mt-3">
              <SubtaskList
                todoId={todo.id}
                subtasks={todo.subtasks}
                onAdd={onAddSubtask}
                onToggle={onToggleSubtask}
                onDelete={onDeleteSubtask}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
