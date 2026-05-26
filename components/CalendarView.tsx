'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Project, Todo } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';

interface CalendarViewProps {
  allTodos: Todo[];
  projects?: Project[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onAdd?: (date: string) => void;
  onToggleSubtask?: (todoId: string, subtaskId: string) => void;
  onStartPomodoro?: (todoId: string) => void;
}

const DEFAULT_EVENT_COLOR = 'var(--accent)';
const LANE_H = 18;
const DATE_ROW_H = 34;
const HOLIDAY_ROW_H = 14;
const PLUS_ROW_H = 16;
const MAX_LANES = 2;
// gridRow 오프셋: row1=날짜, row2=공휴일, row3~=이벤트바, 마지막=+N
const EVENT_ROW_START = 3;

const KOREAN_HOLIDAYS: Record<string, string> = {
  '01-01': '신정', '03-01': '삼일절', '05-01': '근로자의날',
  '05-05': '어린이날', '06-06': '현충일', '08-15': '광복절',
  '10-03': '개천절', '10-09': '한글날', '12-25': '성탄절',
};

function getHoliday(ds: string): string | null {
  return KOREAN_HOLIDAYS[ds.slice(5)] ?? null;
}

function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isRangeEvent(todo: Todo): boolean {
  return !!(todo.startDate && todo.dueDate && todo.startDate < todo.dueDate && todo.recurring === 'none');
}

function matchesRecurring(todo: Todo, ds: string): boolean {
  if (todo.recurring === 'none') return false;
  const ref = todo.startDate || todo.dueDate;
  if (!ref) return false;
  if (ds < ref) return false;
  if (todo.dueDate && ds > todo.dueDate) return false;
  const d = new Date(ds + 'T00:00:00');
  const r = new Date(ref + 'T00:00:00');
  switch (todo.recurring) {
    case 'daily': return true;
    case 'weekly':
      if (todo.weekDays && todo.weekDays.length > 0) return todo.weekDays.includes(d.getDay());
      return d.getDay() === r.getDay();
    case 'monthly': return d.getDate() === r.getDate();
    case 'yearly': return d.getMonth() === r.getMonth() && d.getDate() === r.getDate();
    default: return false;
  }
}

function todosForDate(allTodos: Todo[], ds: string): Todo[] {
  return allTodos.filter(t => {
    if (t.recurring !== 'none') return matchesRecurring(t, ds);
    if (t.startDate && t.dueDate) return t.startDate <= ds && ds <= t.dueDate;
    if (t.startDate && !t.dueDate) return t.startDate === ds;
    return t.dueDate === ds;
  });
}

type WeekEvent = {
  todo: Todo;
  startColIdx: number;
  endColIdx: number;
  isStart: boolean;
  isEnd: boolean;
  lane: number;
};

function buildWeekEvents(
  allTodos: Todo[],
  weekDateStrs: string[],
  weekFirst: string,
  weekLast: string
): WeekEvent[] {
  const events: Omit<WeekEvent, 'lane'>[] = [];

  allTodos
    .filter(t => isRangeEvent(t) && t.startDate! <= weekLast && t.dueDate! >= weekFirst)
    .forEach(todo => {
      const effStart = todo.startDate! < weekFirst ? weekFirst : todo.startDate!;
      const effEnd = todo.dueDate! > weekLast ? weekLast : todo.dueDate!;
      const s = weekDateStrs.indexOf(effStart);
      const e = weekDateStrs.indexOf(effEnd);
      if (s !== -1 && e !== -1)
        events.push({ todo, startColIdx: s, endColIdx: e, isStart: todo.startDate! >= weekFirst, isEnd: todo.dueDate! <= weekLast });
    });

  weekDateStrs.forEach((ds, col) => {
    allTodos
      .filter(t => {
        if (t.recurring !== 'none') return false;
        if (isRangeEvent(t)) return false;
        if (t.startDate && t.dueDate) return t.startDate === ds;
        if (t.startDate) return t.startDate === ds;
        return t.dueDate === ds;
      })
      .forEach(todo => events.push({ todo, startColIdx: col, endColIdx: col, isStart: true, isEnd: true }));
  });

  allTodos
    .filter(t => t.recurring !== 'none')
    .forEach(todo => {
      weekDateStrs.forEach((ds, col) => {
        if (!matchesRecurring(todo, ds)) return;
        events.push({ todo, startColIdx: col, endColIdx: col, isStart: true, isEnd: true });
      });
    });

  events.sort((a, b) => {
    const d = (b.endColIdx - b.startColIdx) - (a.endColIdx - a.startColIdx);
    return d !== 0 ? d : a.startColIdx - b.startColIdx;
  });

  const laneEnds: number[] = [];
  return events.map(ev => {
    let lane = laneEnds.findIndex(end => end < ev.startColIdx);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(-1); }
    laneEnds[lane] = ev.endColIdx;
    return { ...ev, lane };
  });
}

export default function CalendarView({ allTodos, projects = [], onToggle, onUpdate, onAdd, onToggleSubtask, onStartPomodoro }: CalendarViewProps) {
  const { t, lang } = useLanguage();
  const locale = lang === 'ko' ? 'ko-KR' : 'en-US';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetDate, setSheetDate] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const dragTodoIdRef = useRef('');
  const touchGhostRef = useRef<HTMLDivElement | null>(null);
  const lastTapRef = useRef<{ date: string; time: number } | null>(null);
  const swipeTouchStartX = useRef<number | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!showMonthPicker) return;
    function onOutside(e: MouseEvent | TouchEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowMonthPicker(false);
    }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    return () => { document.removeEventListener('mousedown', onOutside); document.removeEventListener('touchstart', onOutside); };
  }, [showMonthPicker]);

  function handleDrop(targetDate: string) {
    if (dragTodoIdRef.current) { onUpdate(dragTodoIdRef.current, { dueDate: targetDate }); dragTodoIdRef.current = ''; }
    setDragOverDate(null);
  }

  function handleMobileDateClick(ds: string) {
    const now = Date.now();
    if (lastTapRef.current?.date === ds && now - lastTapRef.current.time < 400) {
      setSheetDate(ds);
      lastTapRef.current = null;
    } else {
      setSelectedDate(prev => prev === ds ? null : ds);
      lastTapRef.current = { date: ds, time: now };
    }
  }

  const handleTouchDragStart = useCallback((e: React.TouchEvent, todoId: string, title: string) => {
    e.stopPropagation();
    dragTodoIdRef.current = todoId;
    const ghost = document.createElement('div');
    ghost.textContent = title;
    ghost.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;padding:4px 10px;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;opacity:0.9;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;';
    document.body.appendChild(ghost);
    touchGhostRef.current = ghost;
    const touch = e.touches[0];
    ghost.style.left = `${touch.clientX + 12}px`;
    ghost.style.top = `${touch.clientY - 24}px`;
  }, []);

  const handleTouchDragMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touchGhostRef.current) { touchGhostRef.current.style.left = `${touch.clientX + 12}px`; touchGhostRef.current.style.top = `${touch.clientY - 24}px`; touchGhostRef.current.style.display = 'none'; }
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (touchGhostRef.current) touchGhostRef.current.style.display = '';
    const cell = el?.closest('[data-date]') as HTMLElement | null;
    setDragOverDate(cell?.dataset.date ?? null);
  }, []);

  const handleTouchDragEnd = useCallback(() => {
    if (touchGhostRef.current) { document.body.removeChild(touchGhostRef.current); touchGhostRef.current = null; }
    if (dragOverDate && dragTodoIdRef.current) onUpdate(dragTodoIdRef.current, { dueDate: dragOverDate });
    dragTodoIdRef.current = '';
    setDragOverDate(null);
  }, [dragOverDate, onUpdate]);

  const todayStr = localDateStr(now);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

  const cells: Date[] = Array.from({ length: totalCells }, (_, i) => new Date(year, month, i - startPad + 1));
  const weeks: Date[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); setSelectedDate(null); setSheetDate(null); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); setSelectedDate(null); setSheetDate(null); }

  function handleSwipeTouchStart(e: React.TouchEvent) {
    if (dragTodoIdRef.current) return;
    swipeTouchStartX.current = e.touches[0].clientX;
  }
  function handleSwipeTouchEnd(e: React.TouchEvent) {
    if (swipeTouchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeTouchStartX.current;
    swipeTouchStartX.current = null;
    if (dx > 60) prevMonth();
    else if (dx < -60) nextMonth();
  }

  const calendarGrid = (isPC?: boolean) => (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      onTouchStart={!isPC ? handleSwipeTouchStart : undefined}
      onTouchEnd={!isPC ? handleSwipeTouchEnd : undefined}
    >
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        {t.calendar.weekdays.map((d, i) => (
          <div key={d} className="py-2 text-center text-xs font-semibold"
            style={{ color: i === 0 ? '#ef4444' : i === 6 ? 'var(--accent)' : 'var(--muted)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* 주 단위 */}
      {weeks.map((week, weekIdx) => {
        const weekDateStrs = week.map(d => localDateStr(d));
        const weekFirst = weekDateStrs[0];
        const weekLast = weekDateStrs[6];
        const weekEvents = buildWeekEvents(allTodos, weekDateStrs, weekFirst, weekLast);
        const visibleEvents = weekEvents.filter(e => e.lane < MAX_LANES);
        const colHiddenCounts: number[] = Array(7).fill(0);
        weekEvents.forEach(ev => {
          if (ev.lane >= MAX_LANES) {
            for (let c = ev.startColIdx; c <= ev.endColIdx; c++) colHiddenCounts[c]++;
          }
        });
        // row1=날짜, row2=공휴일, row3~4=이벤트, row5=+N
        const gridRows = `${DATE_ROW_H}px ${HOLIDAY_ROW_H}px repeat(${MAX_LANES}, ${LANE_H}px) ${PLUS_ROW_H}px`;
        const totalRows = 2 + MAX_LANES + 1;

        return (
          <div
            key={weekIdx}
            className="border-b"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: gridRows,
              borderColor: 'var(--border)',
              background: 'var(--card)',
              position: 'relative',
            }}
          >
            {/* ① 전체 컬럼 클릭 영역 (row 2+, 이벤트 빈 공간 클릭 지원) */}
            {week.map((date, dayIdx) => {
              const ds = localDateStr(date);
              return (
                <div
                  key={`col-click-${dayIdx}`}
                  data-date={ds}
                  style={{
                    gridColumn: dayIdx + 1,
                    gridRow: `2 / ${totalRows + 1}`,
                    zIndex: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => isPC ? setSelectedDate(prev => prev === ds ? null : ds) : handleMobileDateClick(ds)}
                  onDragOver={e => { e.preventDefault(); setDragOverDate(ds); }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={e => { e.preventDefault(); handleDrop(ds); }}
                />
              );
            })}

            {/* ② 전체 컬럼 배경 오버레이 (선택/드래그) — 가장 먼저 렌더해서 아래에 깔림 */}
            {week.map((date, dayIdx) => {
              const ds = localDateStr(date);
              const isSelected = ds === selectedDate;
              const isDragOver = ds === dragOverDate;
              if (!isSelected && !isDragOver) return null;
              return (
                <div
                  key={`col-bg-${dayIdx}`}
                  style={{
                    gridColumn: dayIdx + 1,
                    gridRow: `1 / ${totalRows + 1}`,
                    background: isDragOver ? 'var(--accent-muted)' : 'var(--accent-muted)',
                    opacity: isDragOver ? 1 : 0.6,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              );
            })}

            {/* ③ 날짜 셀 (row 1) — 숫자만, 항상 일정한 위치 */}
            {week.map((date, dayIdx) => {
              const ds = localDateStr(date);
              const isInMonth = date.getMonth() === month;
              const isToday = ds === todayStr;
              const isPast = ds < todayStr;
              const isSun = dayIdx === 0;
              const isSat = dayIdx === 6;

              return (
                <div
                  key={ds}
                  data-date={ds}
                  style={{
                    gridColumn: dayIdx + 1,
                    gridRow: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    background: 'transparent',
                  }}
                  onClick={() => isPC ? setSelectedDate(prev => prev === ds ? null : ds) : handleMobileDateClick(ds)}
                  onDragOver={e => { e.preventDefault(); setDragOverDate(ds); }}
                  onDragLeave={() => setDragOverDate(null)}
                  onDrop={e => { e.preventDefault(); handleDrop(ds); }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: isToday ? 'var(--accent)' : 'transparent',
                      color: isToday ? '#fff' : !isInMonth ? 'var(--border)' : isSun ? '#ef4444' : isSat ? 'var(--accent)' : isPast ? 'var(--muted)' : 'var(--text)',
                      fontWeight: isToday ? 700 : 600,
                    }}
                  >
                    {date.getDate()}
                  </span>
                </div>
              );
            })}

            {/* ④ 공휴일 바 (row 2) */}
            {week.map((date, dayIdx) => {
              const ds = localDateStr(date);
              const isInMonth = date.getMonth() === month;
              const holiday = isInMonth ? getHoliday(ds) : null;
              if (!holiday) return null;
              return (
                <div
                  key={`hol-${dayIdx}`}
                  style={{
                    gridColumn: dayIdx + 1,
                    gridRow: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 2px',
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                >
                  <span style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: '#fff',
                    background: '#ef4444',
                    borderRadius: 4,
                    padding: '1px 3px',
                    lineHeight: 1.3,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}>
                    {holiday}
                  </span>
                </div>
              );
            })}

            {/* ⑤ 이벤트 바 (row EVENT_ROW_START+) */}
            {visibleEvents.map(({ todo, startColIdx, endColIdx, isStart, isEnd, lane }) => {
              const color = todo.colorTag || DEFAULT_EVENT_COLOR;
              const isRange = isRangeEvent(todo);
              return (
                <div
                  key={`${todo.id}-w${weekIdx}-c${startColIdx}`}
                  draggable
                  onDragStart={e => { e.stopPropagation(); dragTodoIdRef.current = todo.id; }}
                  onTouchStart={e => handleTouchDragStart(e, todo.id, todo.title)}
                  onTouchMove={handleTouchDragMove}
                  onTouchEnd={handleTouchDragEnd}
                  onClick={e => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const span = endColIdx - startColIdx + 1;
                    const clickedCol = startColIdx + Math.min(Math.floor((e.clientX - rect.left) / (rect.width / span)), span - 1);
                    const ds = weekDateStrs[clickedCol] ?? weekDateStrs[startColIdx];
                    if (isPC) setSelectedDate(ds);
                    else setSheetDate(ds);
                  }}
                  style={{
                    gridColumn: `${startColIdx + 1} / ${endColIdx + 2}`,
                    gridRow: lane + EVENT_ROW_START,
                    zIndex: 2,
                    margin: `2px ${isEnd ? 3 : 0}px 2px ${isStart ? 3 : 0}px`,
                    padding: '0 6px',
                    height: LANE_H - 4,
                    background: todo.completed ? 'var(--border)' : color,
                    color: todo.completed ? 'var(--muted)' : '#fff',
                    borderRadius: `${isStart ? 8 : 2}px ${isEnd ? 8 : 2}px ${isEnd ? 8 : 2}px ${isStart ? 8 : 2}px`,
                    fontSize: 10,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    opacity: todo.completed ? 0.55 : 1,
                    cursor: 'pointer',
                    userSelect: 'none',
                    touchAction: 'none',
                    alignSelf: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isRange ? 'center' : 'flex-start',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isRange || isStart ? todo.title : ''}
                  </span>
                </div>
              );
            })}

            {/* ⑥ 날짜별 +N */}
            {colHiddenCounts.map((count, col) =>
              count > 0 ? (
                <div
                  key={`hidden-${weekIdx}-${col}`}
                  style={{
                    gridColumn: col + 1,
                    gridRow: MAX_LANES + EVENT_ROW_START,
                    zIndex: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    const ds = weekDateStrs[col];
                    if (isPC) setSelectedDate(prev => prev === ds ? null : ds);
                    else handleMobileDateClick(ds);
                  }}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    padding: '0 4px',
                    background: '#fde8e8',
                    color: '#e53e3e',
                    fontSize: 9,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}>
                    +{count}
                  </span>
                </div>
              ) : null
            )}
          </div>
        );
      })}
    </div>
  );

  const panelContent = (date: string) => {
    const todos = todosForDate(allTodos, date);
    return (
      <>
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--accent-muted)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{t.calendar.noTodosOnDate}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todos.map(todo => {
              const project = todo.projectId ? projects.find(p => p.id === todo.projectId) : null;
              return (
                <div key={todo.id} className="p-3 rounded-xl"
                  style={{ background: 'var(--bg)', borderLeft: `3px solid ${todo.colorTag || DEFAULT_EVENT_COLOR}` }}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => onToggle(todo.id)}
                      className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                      style={{ background: todo.completed ? 'var(--accent)' : 'transparent', borderColor: todo.completed ? 'var(--accent)' : 'var(--border)' }}>
                      {todo.completed && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: todo.completed ? 'var(--muted)' : 'var(--text)', textDecoration: todo.completed ? 'line-through' : 'none' }}>
                        {todo.title}
                      </p>
                      {todo.description && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{todo.description}</p>}
                      {isRangeEvent(todo) && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{todo.startDate} ~ {todo.dueDate}</p>}
                    </div>
                    {project && (
                      <span className="inline-flex items-center gap-1 flex-shrink-0 text-xs px-1.5 py-0.5 rounded-md"
                        style={{ background: `${project.color}18`, color: project.color }}>
                        <span>{project.icon}</span>
                        <span className="max-w-[60px] truncate">{project.name}</span>
                      </span>
                    )}
                    {onStartPomodoro && !todo.completed && (
                      <button onClick={() => onStartPomodoro(todo.id)} className="flex-shrink-0 text-base leading-none">🍅</button>
                    )}
                  </div>
                  {todo.subtasks?.length > 0 && (
                    <div className="mt-2 ml-7 space-y-1">
                      {todo.subtasks.map(sub => (
                        <button key={sub.id} onClick={() => onToggleSubtask?.(todo.id, sub.id)} className="flex items-center gap-2 w-full text-left">
                          <span className="w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center"
                            style={{ background: sub.completed ? 'var(--accent)' : 'transparent', borderColor: sub.completed ? 'var(--accent)' : 'var(--border)' }}>
                            {sub.completed && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </span>
                          <span className="text-xs" style={{ color: sub.completed ? 'var(--muted)' : 'var(--text)', textDecoration: sub.completed ? 'line-through' : 'none' }}>{sub.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

  const navControls = (
    <div className="relative flex items-center gap-1" ref={pickerRef}>
      <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70" style={{ color: 'rgba(245,158,11,0.9)', background: 'rgba(245,158,11,0.15)' }}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button
        onClick={() => { setPickerYear(year); setShowMonthPicker(v => !v); }}
        className="px-3 py-1.5 rounded-xl text-sm font-bold transition-colors"
        style={{ color: showMonthPicker ? '#f59e0b' : 'var(--text)', background: showMonthPicker ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.12)', minWidth: 100, textAlign: 'center' }}
      >
        {year}년 {month + 1}월
      </button>
      <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70" style={{ color: 'rgba(245,158,11,0.9)', background: 'rgba(245,158,11,0.15)' }}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>

      {showMonthPicker && (
        <div className="absolute top-11 right-0 z-50 rounded-2xl p-4 shadow-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)', width: 228, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
          {/* 연도 선택 */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setPickerYear(y => y - 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--border)', color: 'var(--muted)' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{pickerYear}년</span>
            <button onClick={() => setPickerYear(y => y + 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--border)', color: 'var(--muted)' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          {/* 월 그리드 */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_NAMES.map((name, i) => {
              const isActive = i === month && pickerYear === year;
              const isCurrentMonth = i === now.getMonth() && pickerYear === now.getFullYear();
              return (
                <button
                  key={i}
                  onClick={() => { setYear(pickerYear); setMonth(i); setShowMonthPicker(false); setSelectedDate(null); setSheetDate(null); }}
                  className="py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={isActive
                    ? { background: 'var(--accent)', color: '#fff' }
                    : isCurrentMonth
                    ? { background: 'var(--accent-muted)', color: 'var(--accent)' }
                    : { background: 'var(--bg)', color: 'var(--text)' }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="md:hidden w-full px-4 pt-4 pb-4 mx-auto" style={{ maxWidth: 640 }}>
        {/* 모바일 배너 헤더 — navControls 포함 */}
        <div className="rounded-2xl px-4 py-3 mb-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(251,191,36,0.10) 100%)', border: '1px solid rgba(245,158,11,0.22)' }}>
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full pointer-events-none"
            style={{ background: 'rgba(245,158,11,0.08)' }} />
          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
              style={{ background: 'rgba(245,158,11,0.18)' }}>📅</div>
            <p className="flex-1 text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>{t.nav.calendar}</p>
            {navControls}
          </div>
        </div>
        {calendarGrid()}
      </div>

      {/* 모바일 바텀시트 — 더블탭 시 열림 */}
      {sheetDate && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSheetDate(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
            style={{ background: 'var(--card)', maxHeight: '70vh', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}>
            <div className="flex-shrink-0 px-5 pt-3 pb-4">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--border)' }} />
              <div className="flex items-center justify-between">
                <p className="text-base font-bold" style={{ color: 'var(--text)' }}>
                  {new Date(sheetDate + 'T00:00:00').toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'long' })}
                </p>
                <div className="flex items-center gap-2">
                  {onAdd && (
                    <button onClick={() => { const d = sheetDate!; setSheetDate(null); onAdd(d); }}
                      className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--accent)', color: '#fff' }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </button>
                  )}
                  <button onClick={() => setSheetDate(null)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {panelContent(sheetDate)}
            </div>
          </div>
        </div>
      )}

      {/* PC */}
      <div className="hidden md:flex h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* PC 배너 헤더 */}
          <div className="rounded-2xl px-5 py-4 mb-5 relative overflow-hidden flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(251,191,36,0.07) 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full pointer-events-none"
              style={{ background: 'rgba(245,158,11,0.07)' }} />
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: 'rgba(245,158,11,0.18)' }}>📅</div>
            <div className="flex-1 min-w-0 relative">
              <p className="text-lg font-bold tracking-tight leading-tight" style={{ color: 'var(--text)' }}>{t.nav.calendar}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
              </p>
            </div>
            <div className="relative flex-shrink-0">{navControls}</div>
          </div>
          {calendarGrid(true)}
        </div>
        <div className="w-72 flex-shrink-0 overflow-y-auto px-5 py-6" style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--muted)' }}>
            {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, { month: 'long', day: 'numeric' }) : t.calendar.dateDetail}
          </p>
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long' })}
                </p>
                {onAdd && (
                  <button onClick={() => onAdd(selectedDate)} className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70" style={{ background: 'var(--accent)', color: '#fff' }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </button>
                )}
              </div>
              {panelContent(selectedDate)}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--accent-muted)' }}>
                <svg className="w-6 h-6" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t.calendar.selectDate}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{t.calendar.selectDateDesc}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
