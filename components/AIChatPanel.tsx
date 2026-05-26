'use client';

import { useState, useRef, useEffect } from 'react';
import { Todo, Priority, Urgency, RecurringType } from '@/types/todo';
import { X, Sparkles, Plus, Check, Pencil, Send, Mic } from 'lucide-react';
import { callGemini } from '@/lib/gemini';

// ── Types ──────────────────────────────────────────────────────────────
interface TodoDraft {
  title: string;
  priority: Priority;
  urgency: Urgency;
  dueDate?: string;
  recurring: RecurringType;
  description?: string;
}

interface TodoUpdateDraft {
  id: string;
  currentTitle: string;
  changes: Partial<{ title: string; priority: Priority; dueDate: string; recurring: RecurringType; urgency: Urgency }>;
}

type WizardState =
  | null
  | { step: 'title' }
  | { step: 'dueDate'; title: string }
  | { step: 'recurring'; title: string; startDate?: string; dueDate?: string };

interface SubtaskGroup {
  parentTodoId: string;
  parentTitle: string;
  subtasks: string[];
  addedIndices: Set<number>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  todosToAdd?: TodoDraft[];
  todosToUpdate?: TodoUpdateDraft[];
  subtasksToAdd?: SubtaskGroup[];
  addedIds?: Set<number>;
  updatedIds?: Set<number>;
}

interface Props {
  onAddTodo: (data: Omit<Todo, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'subtasks' | 'pomodoroCount'>) => void;
  onUpdateTodo: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  todos: Todo[];
  isMobile: boolean;
  onAddSubtask?: (todoId: string, title: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const WELCOME_MSG: ChatMessage = {
  role: 'assistant',
  text: '안녕하세요! 할일을 말씀해 주시면 바로 추가해드릴게요 😊\n예: "내일까지 보고서 작성해야 해"',
};

// ── Constants ──────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<Priority, string> = { high: '#ef4444', medium: '#f59e0b', low: '#6366f1' };
const PRIORITY_LABELS: Record<Priority, string> = { high: '높음', medium: '보통', low: '낮음' };

const SUGGESTIONS = [
  { emoji: '✏️', label: '할일 추가', isWizard: true, message: '' },
  { emoji: '🎯', label: '오늘 집중', isWizard: false, message: '지금 내 할일들 중에서 오늘 집중해야 할 것 최대 3개를 추천해줘. 마감일과 우선순위를 고려하고, 각각 한 줄로 이유도 알려줘.' },
  { emoji: '🔀', label: '할일 분해', isWizard: false, message: '내 할일 중 복잡해 보이는 것을 하나 골라서 서브태스크로 세분화해줘.' },
  { emoji: '🔄', label: '루틴 추가', isWizard: false, message: '매일 또는 매주 반복하는 루틴 할일을 추가하고 싶어. 어떤 루틴이 있는지 물어봐줘' },
];

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDueDateOptions() {
  const t = new Date();
  const tom = new Date(t); tom.setDate(t.getDate() + 1);
  const dF = (5 - t.getDay() + 7) % 7 || 7;
  const fri = new Date(t); fri.setDate(t.getDate() + dF);
  const dM = (1 - t.getDay() + 7) % 7 || 7;
  const mon = new Date(t); mon.setDate(t.getDate() + dM);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return [
    { label: '오늘', sub: fmt(t), value: formatDate(t), emoji: '☀️' },
    { label: '내일', sub: fmt(tom), value: formatDate(tom), emoji: '🌅' },
    { label: '이번 주 금요일', sub: fmt(fri), value: formatDate(fri), emoji: '🗓' },
    { label: '다음 주 월요일', sub: fmt(mon), value: formatDate(mon), emoji: '📆' },
    { label: '없음', sub: '미설정', value: '', emoji: '✖️' },
    { label: '직접 설정', sub: '날짜 선택', value: 'custom', emoji: '📝' },
  ];
}

const RECURRING_OPTIONS = [
  { label: '반복 없음', value: 'none' as RecurringType, emoji: '⏹' },
  { label: '매일', value: 'daily' as RecurringType, emoji: '🔁' },
  { label: '매주', value: 'weekly' as RecurringType, emoji: '📅' },
  { label: '매월', value: 'monthly' as RecurringType, emoji: '🗓' },
];

// ── Component ──────────────────────────────────────────────────────────
export default function AIChatPanel({ onAddTodo, onUpdateTodo, onAddSubtask, todos, isMobile, mobileOpen, onMobileClose }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isMobile ? (mobileOpen ?? false) : internalOpen;
  function setOpen(v: boolean) {
    if (isMobile) { if (!v) onMobileClose?.(); }
    else setInternalOpen(v);
  }
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [loading, setLoading] = useState(false);
  const [wizardState, setWizardState] = useState<WizardState>(null);
  const [wizardInput, setWizardInput] = useState('');
  const [customDateStep, setCustomDateStep] = useState<'start' | 'due' | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customDueDate, setCustomDueDate] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wizardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, wizardState]);

  useEffect(() => {
    if (!open || isMobile) return;
    setTimeout(() => {
      if (wizardState?.step === 'title') wizardInputRef.current?.focus();
      else if (!wizardState) inputRef.current?.focus();
    }, 120);
  }, [open, wizardState]);

  // ── Wizard ─────────────────────────────────────────────────────────
  function startWizard() {
    setWizardState({ step: 'title' });
    setCustomDateStep(null);
    setCustomStartDate('');
    setCustomDueDate('');
    setMessages(prev => [...prev, { role: 'assistant', text: '어떤 할 일인가요? ✏️' }]);
    setWizardInput('');
    setTimeout(() => wizardInputRef.current?.focus(), 120);
  }

  function handleWizardTitleSubmit() {
    const title = wizardInput.trim();
    if (!title) return;
    setMessages(prev => [
      ...prev,
      { role: 'user', text: title },
      { role: 'assistant', text: '마감일이 언제인가요? 📅' },
    ]);
    setWizardState({ step: 'dueDate', title });
    setWizardInput('');
  }

  function handleDueDateSelect(opt: { label: string; sub: string; value: string; emoji: string }) {
    if (opt.value === 'custom') {
      setCustomDateStep('start');
      setCustomStartDate('');
      setCustomDueDate('');
      return;
    }
    const ws = wizardState as { step: 'dueDate'; title: string };
    setMessages(prev => [
      ...prev,
      { role: 'user', text: opt.value ? `${opt.label} (${opt.sub})` : '없음' },
      { role: 'assistant', text: '반복 설정을 해볼까요? 🔁' },
    ]);
    setWizardState({ step: 'recurring', title: ws.title, dueDate: opt.value || undefined });
  }

  function fmt(dateStr: string) {
    const [, m, d] = dateStr.split('-');
    return `${parseInt(m)}/${parseInt(d)}`;
  }

  function confirmStartDate(skip: boolean) {
    const start = skip ? undefined : customStartDate || undefined;
    setCustomStartDate(start ?? '');
    setCustomDateStep('due');
    setCustomDueDate('');
  }

  function confirmDueDate(skip: boolean) {
    const ws = wizardState as { step: 'dueDate'; title: string };
    const due = skip ? undefined : customDueDate || undefined;
    const start = customStartDate || undefined;

    const parts = [
      start ? `시작: ${fmt(start)}` : null,
      due ? `마감: ${fmt(due)}` : null,
      !start && !due ? '날짜 없음' : null,
    ].filter(Boolean).join(', ');

    setCustomDateStep(null);
    setMessages(prev => [
      ...prev,
      { role: 'user', text: `직접 설정 (${parts})` },
      { role: 'assistant', text: '반복 설정을 해볼까요? 🔁' },
    ]);
    setWizardState({ step: 'recurring', title: ws.title, startDate: start, dueDate: due });
  }

  function handleRecurringSelect(opt: { label: string; value: RecurringType }) {
    const ws = wizardState as { step: 'recurring'; title: string; startDate?: string; dueDate?: string };
    onAddTodo({
      title: ws.title,
      priority: 'medium',
      urgency: 'not-urgent',
      recurring: opt.value,
      ...(ws.startDate && { startDate: ws.startDate }),
      ...(ws.dueDate && { dueDate: ws.dueDate }),
    });
    const dateInfo = [
      ws.startDate ? `시작: ${ws.startDate}` : null,
      ws.dueDate ? `마감: ${ws.dueDate}` : null,
    ].filter(Boolean).join(' · ') || '날짜 없음';
    setMessages(prev => [
      ...prev,
      { role: 'user', text: opt.label },
      {
        role: 'assistant',
        text: `✅ "${ws.title}" 할일이 추가됐어요!\n${dateInfo} · 반복: ${opt.label}`,
      },
    ]);
    setWizardState(null);
  }

  function cancelWizard() {
    setWizardState(null);
    setWizardInput('');
    setCustomDateStep(null);
    setCustomStartDate('');
    setCustomDueDate('');
    setMessages(prev => [...prev, { role: 'assistant', text: '할일 추가를 취소했어요. 다른 게 필요하시면 말씀해주세요!' }]);
  }

  // ── AI Chat ────────────────────────────────────────────────────────
  function getHistoryForApi() {
    return messages
      .filter((_, i) => i !== 0)
      .map(m => ({ role: m.role === 'assistant' ? 'model' as const : 'user' as const, text: m.text }));
  }

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    if (!overrideText) setInput('');

    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const todoList = todos
        .filter(t => !t.deletedAt && !t.completed)
        .map(t => ({ id: t.id, title: t.title }));
      const data = await callGemini(text, getHistoryForApi(), todoList);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply,
          todosToAdd: data.todosToAdd?.length ? (data.todosToAdd as TodoDraft[]) : undefined,
          todosToUpdate: data.todosToUpdate?.length ? (data.todosToUpdate as TodoUpdateDraft[]) : undefined,
          subtasksToAdd: data.subtasksToAdd?.length
            ? data.subtasksToAdd.map(g => ({ ...g, addedIndices: new Set<number>() }))
            : undefined,
          addedIds: new Set(),
          updatedIds: new Set(),
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      const text =
        msg === 'GEMINI_OVERLOAD' ? 'AI 서버가 잠시 혼잡해요. 1~2분 후 다시 시도해 주세요.' :
        msg === 'GEMINI_QUOTA'    ? 'AI 사용량 한도에 도달했어요. 잠시 후 다시 시도해 주세요.' :
        msg === 'GEMINI_ERROR'    ? 'AI 응답에 실패했어요. 다시 시도해 주세요.' :
                                    '인터넷 연결을 확인해 주세요.';
      setMessages(prev => [...prev, { role: 'assistant', text }]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddTodo(msgIdx: number, todoIdx: number, todo: TodoDraft) {
    onAddTodo({
      title: todo.title,
      priority: todo.priority,
      urgency: todo.urgency,
      recurring: todo.recurring ?? 'none',
      ...(todo.dueDate && { dueDate: todo.dueDate }),
      ...(todo.description && { description: todo.description }),
    });
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx) return m;
      const addedIds = new Set(m.addedIds); addedIds.add(todoIdx);
      return { ...m, addedIds };
    }));
  }

  function handleAddAll(msgIdx: number, todoDrafts: TodoDraft[]) {
    const msg = messages[msgIdx];
    todoDrafts.forEach((todo, idx) => {
      if (msg.addedIds?.has(idx)) return;
      onAddTodo({ title: todo.title, priority: todo.priority, urgency: todo.urgency, recurring: todo.recurring ?? 'none', ...(todo.dueDate && { dueDate: todo.dueDate }) });
    });
    setMessages(prev => prev.map((m, i) =>
      i !== msgIdx ? m : { ...m, addedIds: new Set(todoDrafts.map((_, idx) => idx)) }
    ));
  }

  function handleUpdateTodo(msgIdx: number, updateIdx: number, update: TodoUpdateDraft) {
    onUpdateTodo(update.id, update.changes);
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx) return m;
      const updatedIds = new Set(m.updatedIds); updatedIds.add(updateIdx);
      return { ...m, updatedIds };
    }));
  }

  function handleAddSubtask(msgIdx: number, groupIdx: number, subIdx: number, todoId: string, title: string) {
    onAddSubtask?.(todoId, title);
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx) return m;
      const subtasksToAdd = m.subtasksToAdd?.map((g, gi) => {
        if (gi !== groupIdx) return g;
        const addedIndices = new Set(g.addedIndices); addedIndices.add(subIdx);
        return { ...g, addedIndices };
      });
      return { ...m, subtasksToAdd };
    }));
  }

  function handleAddAllSubtasks(msgIdx: number, groupIdx: number, group: SubtaskGroup) {
    group.subtasks.forEach((title, subIdx) => {
      if (group.addedIndices.has(subIdx)) return;
      onAddSubtask?.(group.parentTodoId, title);
    });
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx) return m;
      const subtasksToAdd = m.subtasksToAdd?.map((g, gi) =>
        gi !== groupIdx ? g : { ...g, addedIndices: new Set(g.subtasks.map((_, idx) => idx)) }
      );
      return { ...m, subtasksToAdd };
    }));
  }

  function toggleVoice() {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  // ── Render ─────────────────────────────────────────────────────────
  const showSuggestions = messages.length === 1 && !loading && !wizardState;
  const panelHeight = isMobile ? '70vh' : '560px';
  const borderRadius = isMobile ? '28px 28px 0 0' : '20px';

  return (
    <>
      {/* Floating button — 데스크탑 전용 */}
      {!isMobile && (
        <button
          onClick={() => setOpen(!open)}
          className="fixed z-30 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{
            width: 56, height: 56,
            bottom: '28px',
            left: 28,
            background: open ? 'var(--border)' : 'linear-gradient(135deg, #a78bfa, #6366f1)',
            boxShadow: open ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, background 0.2s',
          }}
          aria-label="AI 채팅"
        >
          {open
            ? <X className="w-5 h-5" style={{ color: 'var(--muted)' }} />
            : <Sparkles className="w-5 h-5 text-white" />
          }
        </button>
      )}

      {/* Backdrop (mobile) */}
      {open && isMobile && (
        <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setOpen(false)} />
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed z-50 flex flex-col"
          style={{
            width: isMobile ? '100vw' : '380px',
            height: panelHeight,
            right: isMobile ? 0 : 90,
            bottom: isMobile ? 0 : 28,
            left: isMobile ? 0 : undefined,
            borderRadius,
            background: 'var(--card)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            animation: 'chatSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Drag handle */}
          {isMobile && (
            <div className="flex-shrink-0 flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
            >
              <Sparkles className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>AI 어시스턴트</p>
              <p className="text-xs leading-tight mt-0.5" style={{ color: 'var(--muted)' }}>
                {wizardState ? '단계별 할일 추가 중...' : '할일을 말로 추가해보세요'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {wizardState ? (
                <button onClick={cancelWizard} className="text-xs px-2.5 py-1.5 rounded-full font-medium"
                  style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                  취소
                </button>
              ) : messages.length > 1 && (
                <button
                  onClick={() => {
                    setMessages([{ role: 'assistant', text: '안녕하세요! 할일을 말씀해 주시면 바로 추가해드릴게요 😊\n예: "내일까지 보고서 작성해야 해"' }]);
                    setCustomDateStep(null);
                    setCustomStartDate('');
                    setCustomDueDate('');
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-full font-medium"
                  style={{ background: 'var(--bg)', color: 'var(--muted)' }}
                >
                  처음으로
                </button>
              )}
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ scrollbarWidth: 'none' }}>
            {/* Quick suggestions */}
            {showSuggestions && (
              <div className="pb-2">
                <p className="text-sm mb-3 px-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  어떻게 도와드릴까요? ✨
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s.label}
                      onClick={() => s.isWizard ? startWizard() : send(s.message)}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full transition-all active:scale-[0.95]"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    >
                      <span className="text-base leading-none">{s.emoji}</span>
                      <span className="text-sm font-medium whitespace-nowrap">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, msgIdx) => (
              <div key={msgIdx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className="max-w-[88%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #a78bfa, #6366f1)' : 'var(--bg)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text)',
                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                  }}
                >
                  {msg.text}
                </div>

                {/* Add todo cards */}
                {msg.todosToAdd && msg.todosToAdd.length > 0 && (
                  <div className="mt-2 w-full max-w-[88%] space-y-1.5">
                    {msg.todosToAdd.map((todo, todoIdx) => {
                      const added = msg.addedIds?.has(todoIdx) ?? false;
                      return (
                        <div key={todoIdx} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', opacity: added ? 0.55 : 1 }}>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{todo.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                style={{ background: PRIORITY_COLORS[todo.priority] + '22', color: PRIORITY_COLORS[todo.priority] }}>
                                {PRIORITY_LABELS[todo.priority]}
                              </span>
                              {todo.dueDate && <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{todo.dueDate}</span>}
                            </div>
                          </div>
                          <button onClick={() => !added && handleAddTodo(msgIdx, todoIdx, todo)} disabled={added}
                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ background: added ? 'var(--border)' : 'var(--accent)', color: '#fff' }}>
                            {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      );
                    })}
                    {msg.todosToAdd.length > 1 && (msg.addedIds?.size ?? 0) < msg.todosToAdd.length && (
                      <button onClick={() => handleAddAll(msgIdx, msg.todosToAdd!)}
                        className="w-full py-1.5 rounded-xl text-xs font-medium"
                        style={{ background: 'var(--accent)', color: '#fff' }}>
                        전체 추가 ({msg.todosToAdd.length - (msg.addedIds?.size ?? 0)}개)
                      </button>
                    )}
                  </div>
                )}

                {/* Update todo cards */}
                {msg.todosToUpdate && msg.todosToUpdate.length > 0 && (
                  <div className="mt-2 w-full max-w-[88%] space-y-1.5">
                    {msg.todosToUpdate.map((update, updateIdx) => {
                      const updated = msg.updatedIds?.has(updateIdx) ?? false;
                      const changeLabels = Object.entries(update.changes).map(([k, v]) => {
                        if (k === 'priority') return `우선순위: ${PRIORITY_LABELS[v as Priority]}`;
                        if (k === 'dueDate') return `마감일: ${v}`;
                        if (k === 'title') return `제목: ${v}`;
                        if (k === 'urgency') return v === 'urgent' ? '긴급으로 변경' : '일반으로 변경';
                        return `${k}: ${v}`;
                      }).join(' · ');
                      return (
                        <div key={updateIdx} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', opacity: updated ? 0.55 : 1 }}>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{update.currentTitle}</p>
                            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{changeLabels}</p>
                          </div>
                          <button onClick={() => !updated && handleUpdateTodo(msgIdx, updateIdx, update)} disabled={updated}
                            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ background: updated ? 'var(--border)' : '#f59e0b', color: '#fff' }}>
                            {updated ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Subtask breakdown cards */}
                {msg.subtasksToAdd && msg.subtasksToAdd.map((group, groupIdx) => (
                  <div key={groupIdx} className="mt-2 w-full max-w-[88%]">
                    <p className="text-[10px] font-semibold mb-1.5 px-1" style={{ color: 'var(--muted)' }}>
                      "{group.parentTitle}" 서브태스크
                    </p>
                    <div className="space-y-1.5">
                      {group.subtasks.map((subtask, subIdx) => {
                        const added = group.addedIndices.has(subIdx);
                        return (
                          <div key={subIdx} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', opacity: added ? 0.55 : 1 }}>
                            <p className="flex-1 text-xs font-medium" style={{ color: 'var(--text)' }}>{subtask}</p>
                            <button
                              onClick={() => !added && handleAddSubtask(msgIdx, groupIdx, subIdx, group.parentTodoId, subtask)}
                              disabled={added}
                              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                              style={{ background: added ? 'var(--border)' : 'var(--accent)', color: '#fff' }}>
                              {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                      {group.addedIndices.size < group.subtasks.length && (
                        <button
                          onClick={() => handleAddAllSubtasks(msgIdx, groupIdx, group)}
                          className="w-full py-1.5 rounded-xl text-xs font-medium"
                          style={{ background: 'var(--accent)', color: '#fff' }}>
                          전체 추가 ({group.subtasks.length - group.addedIndices.size}개)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex items-start">
                <div className="px-3.5 py-2.5" style={{ background: 'var(--bg)', borderRadius: '20px 20px 20px 4px' }}>
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#a78bfa', animation: `bounce 1s ${i * 0.18}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Wizard bottom sections ─────────────────────────────── */}
          {wizardState && (() => {
            const safeBottom = isMobile ? 'calc(env(safe-area-inset-bottom) + 12px)' : '12px';

            /* Step 1 – Title */
            if (wizardState.step === 'title') return (
              <div className="flex-shrink-0 px-4 pt-3" style={{ borderTop: '1px solid var(--border)', paddingBottom: safeBottom }}>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: 'var(--bg)' }}>
                  <input
                    ref={wizardInputRef}
                    value={wizardInput}
                    onChange={e => setWizardInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleWizardTitleSubmit(); }}
                    placeholder="예: 보고서 작성, 운동하기..."
                    className="flex-1 text-sm bg-transparent outline-none"
                    style={{ color: 'var(--text)' }}
                  />
                  <button
                    onClick={handleWizardTitleSubmit}
                    disabled={!wizardInput.trim()}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{ background: wizardInput.trim() ? 'linear-gradient(135deg,#a78bfa,#6366f1)' : 'transparent', color: wizardInput.trim() ? '#fff' : 'var(--muted)' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );

            /* Step 2 – Due date chips (horizontal scroll) */
            if (wizardState.step === 'dueDate' && !customDateStep) return (
              <div className="flex-shrink-0 pt-3" style={{ borderTop: '1px solid var(--border)', paddingBottom: safeBottom }}>
                <div className="flex gap-2.5 overflow-x-auto px-4" style={{ scrollbarWidth: 'none' }}>
                  {getDueDateOptions().map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => handleDueDateSelect(opt)}
                      className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all active:scale-[0.95]"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 72 }}
                    >
                      <span className="text-2xl leading-none">{opt.emoji}</span>
                      <p className="text-[11px] font-semibold text-center whitespace-nowrap" style={{ color: 'var(--text)' }}>{opt.label}</p>
                      {opt.sub !== '날짜 선택' && opt.sub !== '미설정' && (
                        <p className="text-[10px] whitespace-nowrap" style={{ color: 'var(--muted)' }}>{opt.sub}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );

            /* Step 2 – Custom start date */
            if (wizardState.step === 'dueDate' && customDateStep === 'start') return (
              <div className="flex-shrink-0 px-4 pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)', paddingBottom: safeBottom }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>시작일 <span style={{ color: 'var(--muted)', fontWeight: 400 }}>— 없어도 괜찮아요</span></p>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', colorScheme: 'dark light' }}
                />
                <div className="flex gap-2">
                  <button onClick={() => setCustomDateStep(null)} className="flex-1 py-2.5 rounded-full text-sm font-medium" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← 뒤로</button>
                  <button onClick={() => confirmStartDate(true)} className="flex-1 py-2.5 rounded-full text-sm font-medium" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>없음</button>
                  <button onClick={() => confirmStartDate(false)} disabled={!customStartDate} className="flex-1 py-2.5 rounded-full text-sm font-semibold" style={{ background: customStartDate ? 'linear-gradient(135deg,#a78bfa,#6366f1)' : 'var(--border)', color: '#fff' }}>다음 →</button>
                </div>
              </div>
            );

            /* Step 2 – Custom due date */
            if (wizardState.step === 'dueDate' && customDateStep === 'due') return (
              <div className="flex-shrink-0 px-4 pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)', paddingBottom: safeBottom }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>마감일 선택</p>
                  {customStartDate && (
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>시작 {fmt(customStartDate)}</span>
                  )}
                </div>
                <input
                  type="date"
                  value={customDueDate}
                  min={customStartDate || formatDate(new Date())}
                  onChange={e => setCustomDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', colorScheme: 'dark light' }}
                />
                <div className="flex gap-2">
                  <button onClick={() => setCustomDateStep('start')} className="flex-1 py-2.5 rounded-full text-sm font-medium" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>← 뒤로</button>
                  <button onClick={() => confirmDueDate(true)} className="flex-1 py-2.5 rounded-full text-sm font-medium" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>없음</button>
                  <button onClick={() => confirmDueDate(false)} disabled={!customDueDate} className="flex-1 py-2.5 rounded-full text-sm font-semibold" style={{ background: customDueDate ? 'linear-gradient(135deg,#a78bfa,#6366f1)' : 'var(--border)', color: '#fff' }}>확인</button>
                </div>
              </div>
            );

            /* Step 3 – Recurring chips (horizontal scroll) */
            return (
              <div className="flex-shrink-0 pt-3" style={{ borderTop: '1px solid var(--border)', paddingBottom: safeBottom }}>
                <div className="flex gap-2.5 overflow-x-auto px-4" style={{ scrollbarWidth: 'none' }}>
                  {RECURRING_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleRecurringSelect(opt)}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-6 py-3.5 rounded-2xl transition-all active:scale-[0.95]"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 80 }}
                    >
                      <span className="text-2xl leading-none">{opt.emoji}</span>
                      <p className="text-[11px] font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Bottom: normal chat input */}
          {!wizardState && (
            <div
              className="flex-shrink-0 px-3 pt-2"
              style={{
                borderTop: '1px solid var(--border)',
                paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 10px)' : '10px',
              }}
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: 'var(--bg)' }}>
                {typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (
                  <button
                    onClick={toggleVoice}
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isListening ? '#ef4444' : 'transparent',
                      color: isListening ? '#fff' : 'var(--muted)',
                      animation: isListening ? 'pulse 1s infinite' : undefined,
                    }}
                    aria-label="음성 입력"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={isListening ? '듣는 중...' : '메시지 입력...'}
                  disabled={loading}
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: 'var(--text)' }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: input.trim() && !loading ? 'linear-gradient(135deg, #a78bfa, #6366f1)' : 'transparent',
                    color: input.trim() && !loading ? '#fff' : 'var(--muted)',
                  }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>
    </>
  );
}
