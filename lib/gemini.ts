
export interface GeminiTodoDraft {
  title: string;
  priority: 'high' | 'medium' | 'low';
  urgency: 'urgent' | 'not-urgent';
  dueDate?: string | null;
  description?: string | null;
  recurring?: string;
}

export interface GeminiTodoUpdate {
  id: string;
  currentTitle: string;
  changes: {
    title?: string;
    priority?: 'high' | 'medium' | 'low';
    urgency?: 'urgent' | 'not-urgent';
    dueDate?: string;
  };
}

export interface GeminiSubtaskGroup {
  parentTodoId: string;
  parentTitle: string;
  subtasks: string[];
}

export interface GeminiChatResult {
  reply: string;
  todosToAdd: GeminiTodoDraft[];
  todosToUpdate: GeminiTodoUpdate[];
  subtasksToAdd: GeminiSubtaskGroup[];
}

export async function callGemini(
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  todoList: { id: string; title: string }[]
): Promise<GeminiChatResult> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, todoList }),
  });

  if (!res.ok) {
    if (res.status === 503) throw new Error('GEMINI_OVERLOAD');
    if (res.status === 429) throw new Error('GEMINI_QUOTA');
    throw new Error('GEMINI_ERROR');
  }

  const data = await res.json();
  return {
    reply: data.reply ?? '죄송해요, 다시 말씀해 주세요.',
    todosToAdd: data.todosToAdd ?? [],
    todosToUpdate: data.todosToUpdate ?? [],
    subtasksToAdd: data.subtasksToAdd ?? [],
  };
}

export async function callGeminiSearch(
  query: string,
  todos: { id: string; title: string; dueDate?: string; priority: string; completed: boolean; description?: string }[]
): Promise<string[]> {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, todos }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
