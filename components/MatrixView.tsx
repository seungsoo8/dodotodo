'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, PointerSensor,
  useSensor, useSensors, DragOverlay, DragStartEvent, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Todo, Priority, RecurringType } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';

interface MatrixViewProps {
  allTodos: Todo[];
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onToggle: (id: string) => void;
  onAdd: (data: { title: string; urgency: 'urgent' | 'not-urgent'; important: boolean; priority: Priority; recurring: RecurringType }) => void;
}

type Quadrant = 'q1' | 'q2' | 'q3' | 'q4';

interface QuadrantDef {
  id: Quadrant;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  border: string;
  hot: boolean;
}

function isUrgentTodo(todo: Todo): boolean {
  if (todo.urgency === 'urgent') return true;
  if (!todo.dueDate) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(todo.dueDate + 'T00:00:00');
  return Math.floor((due.getTime() - today.getTime()) / 86400000) <= 2;
}

function getQuadrant(todo: Todo): Quadrant {
  const urgent = isUrgentTodo(todo);
  const important = todo.important ?? false;
  if (urgent && important) return 'q1';
  if (!urgent && important) return 'q2';
  if (urgent && !important) return 'q3';
  return 'q4';
}

function getUpdatesForQuadrant(q: Quadrant): { urgency: 'urgent' | 'not-urgent'; important: boolean } {
  switch (q) {
    case 'q1': return { urgency: 'urgent', important: true };
    case 'q2': return { urgency: 'not-urgent', important: true };
    case 'q3': return { urgency: 'urgent', important: false };
    case 'q4': return { urgency: 'not-urgent', important: false };
  }
}

// ─── Draggable todo row ───────────────────────────────────────────
function DraggableTodoRow({
  todo, onToggle, onUpdate, isMobile, onMoveRequest,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, u: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  isMobile: boolean;
  onMoveRequest: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: todo.id,
    disabled: isMobile,
  });
  const urgent = isUrgentTodo(todo);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.3 : 1 }}
      className="flex items-center gap-2 px-2 py-1.5 rounded-xl group transition-colors"
      {...attributes}
      {...(!isMobile ? listeners : {})}
    >
      {/* Checkbox */}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onToggle(todo.id); }}
        className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
        style={{ background: todo.completed ? 'var(--accent)' : 'transparent', borderColor: todo.completed ? 'var(--accent)' : 'var(--border)' }}
      >
        {todo.completed && (
          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Title + due date */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-medium leading-snug truncate"
          style={{ color: todo.completed ? 'var(--muted)' : 'var(--text)', textDecoration: todo.completed ? 'line-through' : 'none' }}
        >{todo.title}</p>
        {todo.dueDate && (
          <p className="text-[10px] mt-0.5" style={{ color: urgent && !todo.completed ? '#f59e0b' : 'var(--muted)' }}>
            {urgent && !todo.completed ? '⚡ ' : ''}{todo.dueDate}
          </p>
        )}
      </div>

      {/* Action icons — visible on hover (desktop) or always (mobile) */}
      <div
        className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        onPointerDown={e => e.stopPropagation()}
      >
        <button
          onClick={e => { e.stopPropagation(); onUpdate(todo.id, { urgency: todo.urgency === 'urgent' ? 'not-urgent' : 'urgent' }); }}
          className="w-5 h-5 flex items-center justify-center rounded-md text-xs transition-colors hover:bg-black/10"
          style={{ color: todo.urgency === 'urgent' ? '#f59e0b' : 'var(--border)' }}
        >⚡</button>
        <button
          onClick={e => { e.stopPropagation(); onUpdate(todo.id, { important: !todo.important }); }}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors hover:bg-black/10"
          style={{ color: todo.important ? '#6366f1' : 'var(--border)' }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill={todo.important ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
        {isMobile && (
          <button
            onClick={e => { e.stopPropagation(); onMoveRequest(todo.id); }}
            className="w-5 h-5 flex items-center justify-center rounded-md text-xs transition-colors hover:bg-black/10"
            style={{ color: 'var(--muted)' }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inline add input ─────────────────────────────────────────────
function InlineAdd({ color, onSubmit, onCancel }: { color: string; onSubmit: (t: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
      <input
        ref={ref}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); if (value.trim()) onSubmit(value.trim()); }
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="할 일 제목..."
        className="flex-1 text-xs outline-none bg-transparent"
        style={{ color: 'var(--text)' }}
      />
      <button
        type="button"
        onClick={() => { if (value.trim()) onSubmit(value.trim()); }}
        className="text-xs font-semibold px-2 py-0.5 rounded-lg"
        style={{ color: value.trim() ? color : 'var(--muted)', background: value.trim() ? `${color}15` : 'transparent' }}
      >추가</button>
      <button type="button" onClick={onCancel} className="text-xs w-4 h-4 flex items-center justify-center" style={{ color: 'var(--muted)' }}>✕</button>
    </div>
  );
}

// ─── Droppable quadrant card ──────────────────────────────────────
function QuadrantSection({
  quadrant, todos, onToggle, onUpdate, isMobile, onMoveRequest,
  isOver, isAdding, onAddOpen, onAddSubmit, onAddCancel,
}: {
  quadrant: QuadrantDef;
  todos: Todo[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, u: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  isMobile: boolean;
  onMoveRequest: (id: string) => void;
  isOver: boolean;
  isAdding: boolean;
  onAddOpen: () => void;
  onAddSubmit: (title: string) => void;
  onAddCancel: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: quadrant.id });
  const [showCompleted, setShowCompleted] = useState(false);
  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl flex flex-col transition-all"
      style={{
        background: isOver ? `${quadrant.color}12` : quadrant.bg,
        border: `${quadrant.hot ? '2px' : '1px'} solid ${isOver ? quadrant.color : quadrant.border}`,
        boxShadow: quadrant.hot
          ? `0 4px 16px ${quadrant.color}18`
          : isOver ? `0 0 0 3px ${quadrant.color}20` : 'none',
        minHeight: isMobile ? 0 : 200,
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: quadrant.color, boxShadow: quadrant.hot ? `0 0 6px ${quadrant.color}` : 'none' }}
          />
          <span className="text-sm font-bold" style={{ color: quadrant.color }}>{quadrant.title}</span>
          {activeTodos.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold tabular-nums"
              style={{ background: `${quadrant.color}20`, color: quadrant.color }}
            >{activeTodos.length}</span>
          )}
        </div>
        <p className="text-[11px] mt-0.5 ml-4" style={{ color: 'var(--muted)' }}>{quadrant.subtitle}</p>
      </div>

      {/* Todo list */}
      <div className="flex-1 px-2 pb-1 space-y-0.5">
        {activeTodos.length === 0 && !isAdding && (
          <div
            className="flex items-center justify-center py-4 mx-1 rounded-xl border border-dashed"
            style={{ borderColor: `${quadrant.color}30` }}
          >
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {isMobile ? '비어 있음' : '드래그하거나 + 버튼으로 추가'}
            </span>
          </div>
        )}
        {activeTodos.map(t => (
          <DraggableTodoRow
            key={t.id}
            todo={t}
            onToggle={onToggle}
            onUpdate={onUpdate}
            isMobile={isMobile}
            onMoveRequest={onMoveRequest}
          />
        ))}
        {isAdding && (
          <InlineAdd color={quadrant.color} onSubmit={onAddSubmit} onCancel={onAddCancel} />
        )}
        {completedTodos.length > 0 && (
          <div className="mt-1 pt-1" style={{ borderTop: '1px dashed var(--border)' }}>
            <button
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded mb-0.5"
              style={{ color: 'var(--muted)' }}
              onClick={() => setShowCompleted(v => !v)}
            >
              <span>{showCompleted ? '▾' : '▸'}</span>
              완료 {completedTodos.length}개
            </button>
            {showCompleted && completedTodos.map(t => (
              <DraggableTodoRow
                key={t.id}
                todo={t}
                onToggle={onToggle}
                onUpdate={onUpdate}
                isMobile={isMobile}
                onMoveRequest={onMoveRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add button */}
      {!isAdding && (
        <button
          onClick={onAddOpen}
          className="flex items-center gap-1.5 mx-3 mb-3.5 mt-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:brightness-95"
          style={{ color: quadrant.color, background: `${quadrant.color}12` }}
        >
          <span className="text-sm leading-none font-bold">+</span> 추가
        </button>
      )}
    </div>
  );
}

// ─── Mobile move bottom sheet ─────────────────────────────────────
function MoveSheet({
  quadrants, currentQ, onMove, onClose,
}: {
  quadrants: QuadrantDef[];
  currentQ: Quadrant;
  onMove: (q: Quadrant) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl p-5 pb-10"
        style={{ background: 'var(--card)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>분면 이동</p>
        <div className="space-y-2">
          {quadrants.map(q => (
            <button
              key={q.id}
              onClick={() => { onMove(q.id); onClose(); }}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-98"
              style={{
                background: q.id === currentQ ? q.bg : 'transparent',
                border: `1.5px solid ${q.id === currentQ ? q.color : 'var(--border)'}`,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: q.color }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: q.color }}>{q.title}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{q.subtitle}</p>
              </div>
              {q.id === currentQ && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${q.color}20`, color: q.color }}>현재</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function MatrixView({ allTodos, onUpdate, onToggle, onAdd }: MatrixViewProps) {
  const { lang } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const QUADRANTS: QuadrantDef[] = [
    { id: 'q1', title: lang === 'ko' ? '⚡ 지금 당장' : '⚡ Do Now',     subtitle: lang === 'ko' ? '긴급하고 중요한 것'      : 'Urgent & important',       color: '#ef4444', bg: 'rgba(239,68,68,0.07)',    border: 'rgba(239,68,68,0.30)',    hot: true },
    { id: 'q2', title: lang === 'ko' ? '⭐ 계획하기'  : '⭐ Schedule',    subtitle: lang === 'ko' ? '중요하지만 여유 있음'    : 'Important, not urgent',    color: '#6366f1', bg: 'rgba(99,102,241,0.06)',   border: 'rgba(99,102,241,0.22)',   hot: false },
    { id: 'q3', title: lang === 'ko' ? '🔔 위임하기'  : '🔔 Delegate',   subtitle: lang === 'ko' ? '긴급하지만 중요하지 않음' : 'Urgent, not important',    color: '#f59e0b', bg: 'rgba(245,158,11,0.06)',   border: 'rgba(245,158,11,0.22)',   hot: false },
    { id: 'q4', title: lang === 'ko' ? '🗑 나중에'    : '🗑 Eliminate',   subtitle: lang === 'ko' ? '지금 급하지 않음'        : 'Not urgent or important',  color: '#94a3b8', bg: 'rgba(148,163,184,0.05)', border: 'rgba(148,163,184,0.18)', hot: false },
  ];

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [addingQ, setAddingQ] = useState<Quadrant | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const activeTodos = allTodos.filter(t => !t.deletedAt);
  const activeTodo = activeId ? allTodos.find(t => t.id === activeId) ?? null : null;
  const moveTarget = moveTargetId ? allTodos.find(t => t.id === moveTargetId) ?? null : null;

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string); }
  function handleDragOver(e: DragOverEvent) { setOverId(e.over?.id as string ?? null); }
  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null); setOverId(null);
    if (!e.over) return;
    const q = QUADRANTS.find(q => q.id === e.over!.id);
    if (!q) return;
    onUpdate(e.active.id as string, getUpdatesForQuadrant(q.id));
  }

  function handleQuickAdd(q: Quadrant, title: string) {
    const { urgency, important } = getUpdatesForQuadrant(q);
    onAdd({ title, urgency, important, priority: 'medium' as Priority, recurring: 'none' as RecurringType });
    setAddingQ(null);
  }

  return (
    <div className="w-full px-4 py-6 md:px-8 md:py-8 mx-auto" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {lang === 'ko' ? '아이젠하워 매트릭스' : 'Eisenhower Matrix'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          {lang === 'ko'
            ? '⚡ 긴급 · ⭐ 중요 설정으로 자동 분류 · 드래그하거나 카드에서 직접 변경'
            : 'Auto-sorted by ⚡ urgency & ⭐ importance · drag or toggle directly'}
        </p>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className={isMobile ? 'flex flex-col gap-3' : 'grid grid-cols-2 gap-3'}>
          {QUADRANTS.map(q => (
            <QuadrantSection
              key={q.id}
              quadrant={q}
              todos={activeTodos.filter(t => getQuadrant(t) === q.id)}
              onToggle={onToggle}
              onUpdate={onUpdate}
              isMobile={isMobile}
              onMoveRequest={id => setMoveTargetId(id)}
              isOver={overId === q.id}
              isAdding={addingQ === q.id}
              onAddOpen={() => setAddingQ(q.id)}
              onAddSubmit={title => handleQuickAdd(q.id, title)}
              onAddCancel={() => setAddingQ(null)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTodo ? (
            <div
              className="px-3 py-2 rounded-xl shadow-2xl text-xs font-semibold"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', maxWidth: 200 }}
            >
              {activeTodo.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {moveTarget && (
        <MoveSheet
          quadrants={QUADRANTS}
          currentQ={getQuadrant(moveTarget)}
          onMove={q => { onUpdate(moveTarget.id, getUpdatesForQuadrant(q)); setMoveTargetId(null); }}
          onClose={() => setMoveTargetId(null)}
        />
      )}
    </div>
  );
}
