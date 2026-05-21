'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Todo } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';

interface MatrixViewProps {
  allTodos: Todo[];
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onToggle: (id: string) => void;
}

type Quadrant = 'q1' | 'q2' | 'q3' | 'q4';

type QuadrantDef = {
  id: Quadrant;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
};

function isUrgent(todo: Todo): boolean {
  if (!todo.dueDate) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(todo.dueDate + 'T00:00:00');
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
  return diff <= 2; // 오늘~내일모레
}

function getQuadrant(todo: Todo): Quadrant {
  const important = todo.important ?? false;
  const urgent = isUrgent(todo);
  if (urgent && important) return 'q1';
  if (!urgent && important) return 'q2';
  if (urgent && !important) return 'q3';
  return 'q4';
}

// 드래그로 분면 이동 시 important/dueDate 업데이트
function getUpdatesForQuadrant(quadrant: Quadrant, todo: Todo): Partial<Omit<Todo, 'id' | 'createdAt'>> {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

  switch (quadrant) {
    case 'q1': // 긴급+중요: important ON, 마감일 없으면 오늘로
      return {
        important: true,
        dueDate: todo.dueDate && isUrgent(todo) ? todo.dueDate : toDateStr(today),
      };
    case 'q2': // 중요: important ON, 마감일 제거
      return { important: true, dueDate: undefined };
    case 'q3': // 긴급: important OFF, 마감일 없으면 내일로
      return {
        important: false,
        dueDate: todo.dueDate && isUrgent(todo) ? todo.dueDate : toDateStr(tomorrow),
      };
    case 'q4': // 나중에: important OFF, 마감일 제거
      return { important: false, dueDate: undefined };
  }
}

function DraggableTodo({ todo, onToggle, onUpdate }: { todo: Todo; onToggle: (id: string) => void; onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: todo.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-2.5 rounded-lg cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onToggle(todo.id); }}
        className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all"
        style={{
          background: todo.completed ? 'var(--accent)' : 'transparent',
          borderColor: todo.completed ? 'var(--accent)' : 'var(--border)',
        }}
      >
        {todo.completed && (
          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p
            className="text-xs font-medium leading-snug flex-1 min-w-0"
            style={{
              color: todo.completed ? 'var(--muted)' : 'var(--text)',
              textDecoration: todo.completed ? 'line-through' : 'none',
            }}
          >
            {todo.title}
          </p>
          {/* 별표 토글 */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onUpdate(todo.id, { important: !todo.important }); }}
            className="flex-shrink-0 transition-colors"
            style={{ color: todo.important ? '#f59e0b' : 'var(--border)' }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill={todo.important ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
        </div>
        {todo.dueDate && (
          <p className="text-xs mt-0.5" style={{ color: isUrgent(todo) ? '#f59e0b' : 'var(--muted)' }}>
            {isUrgent(todo) ? '⚡ ' : ''}{todo.dueDate}
          </p>
        )}
      </div>
    </div>
  );
}

function DroppableQuadrant({
  quadrant,
  todos,
  onToggle,
  onUpdate,
  isOver,
  dragHint,
}: {
  quadrant: QuadrantDef;
  todos: Todo[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  isOver: boolean;
  dragHint: string;
}) {
  const { setNodeRef } = useDroppable({ id: quadrant.id });
  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div
      ref={setNodeRef}
      className="rounded-xl p-3 flex flex-col min-h-[200px] transition-all"
      style={{
        background: isOver ? `${quadrant.color}12` : quadrant.bg,
        border: `1px solid ${isOver ? quadrant.color : 'var(--border)'}`,
        boxShadow: isOver ? `0 0 0 2px ${quadrant.color}40` : 'none',
      }}
    >
      <div className="mb-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: quadrant.color }} />
          <h3 className="text-sm font-bold" style={{ color: quadrant.color }}>{quadrant.title}</h3>
          <span
            className="ml-auto text-xs px-1.5 py-0.5 rounded-full tabular-nums"
            style={{ background: `${quadrant.color}18`, color: quadrant.color }}
          >
            {activeTodos.length}
          </span>
        </div>
        <p className="text-xs pl-3.5" style={{ color: 'var(--muted)' }}>{quadrant.subtitle}</p>
      </div>

      <div className="flex-1 space-y-0.5">
        {activeTodos.map(t => (
          <DraggableTodo key={t.id} todo={t} onToggle={onToggle} onUpdate={onUpdate} />
        ))}
        {activeTodos.length === 0 && (
          <div
            className="flex items-center justify-center h-14 rounded-lg border border-dashed"
            style={{ borderColor: `${quadrant.color}40` }}
          >
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{dragHint}</span>
          </div>
        )}
        {completedTodos.length > 0 && (
          <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--border)' }}>
            {completedTodos.map(t => (
              <DraggableTodo key={t.id} todo={t} onToggle={onToggle} onUpdate={onUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatrixView({ allTodos, onUpdate, onToggle }: MatrixViewProps) {
  const { t, lang } = useLanguage();

  const QUADRANTS: QuadrantDef[] = [
    {
      id: 'q1',
      title: lang === 'ko' ? '⚡ 지금 당장' : '⚡ Do Now',
      subtitle: lang === 'ko' ? '중요하고 마감이 임박' : 'Important & urgent',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.06)',
    },
    {
      id: 'q2',
      title: lang === 'ko' ? '⭐ 계획하기' : '⭐ Schedule',
      subtitle: lang === 'ko' ? '중요하지만 여유 있음' : 'Important, not urgent',
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.06)',
    },
    {
      id: 'q3',
      title: lang === 'ko' ? '🔔 위임하기' : '🔔 Delegate',
      subtitle: lang === 'ko' ? '급하지만 중요하지 않음' : 'Urgent, not important',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.06)',
    },
    {
      id: 'q4',
      title: lang === 'ko' ? '🗑 나중에' : '🗑 Eliminate',
      subtitle: lang === 'ko' ? '급하지도 중요하지도 않음' : 'Not urgent or important',
      color: '#94a3b8',
      bg: 'rgba(148,163,184,0.06)',
    },
  ];

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string); }
  function handleDragOver(e: DragOverEvent) { setOverId(e.over?.id as string ?? null); }
  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    setOverId(null);
    if (!e.over) return;
    const quadrant = QUADRANTS.find(q => q.id === e.over!.id);
    if (!quadrant) return;
    const todo = allTodos.find(t => t.id === e.active.id);
    if (!todo) return;
    onUpdate(e.active.id as string, getUpdatesForQuadrant(quadrant.id, todo));
  }

  const activeTodo = activeId ? allTodos.find(t => t.id === activeId) ?? null : null;
  const activeTodos = allTodos.filter(t => !t.deletedAt);

  return (
    <div className="w-full px-6 py-8 md:px-10 mx-auto" style={{ maxWidth: 960 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{t.nav.matrix}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          {lang === 'ko'
            ? '⭐ 중요 표시 + 마감일로 할 일을 4분면에 자동 배치 · 드래그로 이동 가능'
            : 'Auto-sorted by ⭐ importance & due date · drag to move'}
        </p>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-2">
          {/* Y축 레이블 */}
          <div className="flex flex-col gap-2 flex-shrink-0 w-5 mt-8">
            <div
              className="flex-1 flex items-center justify-center rounded text-xs font-semibold"
              style={{ writingMode: 'vertical-lr', color: '#6366f1', background: 'rgba(99,102,241,0.06)', minHeight: '100px' }}
            >
              {lang === 'ko' ? '⭐ 중요' : '⭐ Important'}
            </div>
            <div
              className="flex-1 flex items-center justify-center rounded text-xs font-semibold"
              style={{ writingMode: 'vertical-lr', color: 'var(--muted)', background: 'var(--accent-muted)', minHeight: '100px' }}
            >
              {lang === 'ko' ? '보통' : 'Normal'}
            </div>
          </div>

          <div className="flex-1">
            {/* X축 레이블 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="text-center text-xs font-semibold py-1 rounded" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.06)' }}>
                {lang === 'ko' ? '⚡ 긴급 (D-2 이내)' : '⚡ Urgent (within 2d)'}
              </div>
              <div className="text-center text-xs font-semibold py-1 rounded" style={{ color: 'var(--muted)', background: 'var(--accent-muted)' }}>
                {lang === 'ko' ? '여유 있음' : 'Not Urgent'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {QUADRANTS.map(q => (
                <DroppableQuadrant
                  key={q.id}
                  quadrant={q}
                  todos={activeTodos.filter(todo => getQuadrant(todo) === q.id)}
                  onToggle={onToggle}
                  onUpdate={onUpdate}
                  isOver={overId === q.id}
                  dragHint={lang === 'ko' ? '여기로 드래그' : 'Drag here'}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeTodo ? (
            <div
              className="p-2.5 rounded-lg shadow-xl text-xs font-medium"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', maxWidth: '180px' }}
            >
              {activeTodo.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 범례 */}
      <div className="mt-4 flex flex-wrap gap-3">
        {QUADRANTS.map(q => (
          <div key={q.id} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: q.color }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              <b style={{ color: q.color }}>{q.title}</b> — {q.subtitle}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
