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
import { Todo, Urgency, Priority } from '@/types/todo';

interface MatrixViewProps {
  allTodos: Todo[];
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onToggle: (id: string) => void;
}

type Quadrant = 'q1' | 'q2' | 'q3' | 'q4';

const QUADRANTS: {
  id: Quadrant;
  title: string;
  subtitle: string;
  urgency: Urgency;
  priority: Priority;
  color: string;
  bg: string;
}[] = [
  {
    id: 'q1', title: '지금 해라', subtitle: '긴급 + 중요',
    urgency: 'urgent', priority: 'high',
    color: '#ef4444', bg: 'rgba(239,68,68,0.06)',
  },
  {
    id: 'q2', title: '계획해라', subtitle: '긴급하지 않음 + 중요',
    urgency: 'not-urgent', priority: 'high',
    color: '#6366f1', bg: 'rgba(99,102,241,0.06)',
  },
  {
    id: 'q3', title: '위임해라', subtitle: '긴급 + 덜 중요',
    urgency: 'urgent', priority: 'low',
    color: '#f59e0b', bg: 'rgba(245,158,11,0.06)',
  },
  {
    id: 'q4', title: '버려라', subtitle: '긴급하지 않음 + 덜 중요',
    urgency: 'not-urgent', priority: 'low',
    color: '#94a3b8', bg: 'rgba(148,163,184,0.06)',
  },
];

function getQuadrant(todo: Todo): Quadrant {
  const isImportant = todo.priority === 'high' || todo.priority === 'medium';
  const isUrgent = todo.urgency === 'urgent';
  if (isUrgent && isImportant) return 'q1';
  if (!isUrgent && isImportant) return 'q2';
  if (isUrgent && !isImportant) return 'q3';
  return 'q4';
}

function DraggableTodo({ todo, onToggle }: { todo: Todo; onToggle: (id: string) => void }) {
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
        <p
          className="text-xs font-medium leading-snug"
          style={{
            color: todo.completed ? 'var(--muted)' : 'var(--text)',
            textDecoration: todo.completed ? 'line-through' : 'none',
          }}
        >
          {todo.title}
        </p>
        {todo.dueDate && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{todo.dueDate}</p>
        )}
      </div>
    </div>
  );
}

function DroppableQuadrant({
  quadrant,
  todos,
  onToggle,
  isOver,
}: {
  quadrant: typeof QUADRANTS[0];
  todos: Todo[];
  onToggle: (id: string) => void;
  isOver: boolean;
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
          <DraggableTodo key={t.id} todo={t} onToggle={onToggle} />
        ))}
        {activeTodos.length === 0 && (
          <div
            className="flex items-center justify-center h-14 rounded-lg border border-dashed"
            style={{ borderColor: `${quadrant.color}40` }}
          >
            <span className="text-xs" style={{ color: 'var(--muted)' }}>여기로 드래그</span>
          </div>
        )}
        {completedTodos.length > 0 && (
          <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--border)' }}>
            {completedTodos.map(t => (
              <DraggableTodo key={t.id} todo={t} onToggle={onToggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MatrixView({ allTodos, onUpdate, onToggle }: MatrixViewProps) {
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
    onUpdate(e.active.id as string, { urgency: quadrant.urgency, priority: quadrant.priority });
  }

  const activeTodo = activeId ? allTodos.find(t => t.id === activeId) ?? null : null;

  return (
    <div className="w-full px-6 py-8 md:px-10 mx-auto" style={{ maxWidth: 960 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>우선순위 매트릭스</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>할 일을 드래그해서 사분면을 변경하세요</p>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        {/* 축 레이블 + 그리드를 flex로 분리 — absolute 포지션 사용 안 함 */}
        <div className="flex gap-2">
          {/* Y축: 중요도 레이블 */}
          <div className="flex flex-col gap-2 flex-shrink-0 w-5 mt-8">
            <div
              className="flex-1 flex items-center justify-center rounded text-xs font-semibold"
              style={{
                writingMode: 'vertical-lr',
                color: '#ef4444',
                background: 'rgba(239,68,68,0.06)',
                minHeight: '100px',
              }}
            >
              중요함
            </div>
            <div
              className="flex-1 flex items-center justify-center rounded text-xs font-semibold"
              style={{
                writingMode: 'vertical-lr',
                color: 'var(--muted)',
                background: 'var(--accent-muted)',
                minHeight: '100px',
              }}
            >
              덜 중요함
            </div>
          </div>

          {/* 그리드 영역 */}
          <div className="flex-1">
            {/* X축: 긴급도 레이블 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div
                className="text-center text-xs font-semibold py-1 rounded"
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.06)' }}
              >
                ← 긴급함
              </div>
              <div
                className="text-center text-xs font-semibold py-1 rounded"
                style={{ color: 'var(--muted)', background: 'var(--accent-muted)' }}
              >
                긴급하지 않음 →
              </div>
            </div>

            {/* 4사분면 그리드 */}
            <div className="grid grid-cols-2 gap-2">
              {QUADRANTS.map(q => (
                <DroppableQuadrant
                  key={q.id}
                  quadrant={q}
                  todos={allTodos.filter(t => getQuadrant(t) === q.id)}
                  onToggle={onToggle}
                  isOver={overId === q.id}
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
