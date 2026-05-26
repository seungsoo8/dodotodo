import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_PROMPT = `You are a helpful todo assistant for Plenio, a task management app.
You can ADD new tasks, MODIFY existing tasks, BREAKDOWN tasks into subtasks, RECOMMEND tasks from the list, and have general task-related conversations.

TODAY's date: {TODAY}

{TODO_CONTEXT}

Always respond in the SAME language the user used (Korean if Korean, English if English).

You MUST respond with valid JSON only:
{
  "reply": "conversational response — use this freely for recommendations, analysis, answers, encouragement, etc.",
  "todosToAdd": [
    {
      "title": "short action-oriented title",
      "priority": "high" | "medium" | "low",
      "urgency": "urgent" | "not-urgent",
      "dueDate": "YYYY-MM-DD or null",
      "description": "optional or null",
      "recurring": "none" | "daily" | "weekly" | "monthly"
    }
  ],
  "todosToUpdate": [
    {
      "id": "exact todo id from the list",
      "currentTitle": "current title for display",
      "changes": {
        "title": "new title (optional)",
        "priority": "high|medium|low (optional)",
        "urgency": "urgent|not-urgent (optional)",
        "dueDate": "YYYY-MM-DD (optional)"
      }
    }
  ],
  "subtasksToAdd": [
    {
      "parentTodoId": "exact id from todo list",
      "parentTitle": "todo title for display",
      "subtasks": ["subtask title 1", "subtask title 2", "subtask title 3"]
    }
  ]
}

Rules:
- todosToAdd: [] when no new tasks to add
- todosToUpdate: [] when no modifications requested
- subtasksToAdd: [] when no subtask breakdown requested
- "reply" is for ALL conversational responses — including recommendations, analysis, summaries, and answers
- When asked to recommend tasks to focus on: analyze the existing todo list by due date and priority, then write recommendations in "reply". Do NOT refuse.
- When asked about schedule or planning: suggest from the existing list in "reply". Do NOT refuse.
- For modifications/breakdown, match the todo by title and use its exact id
- priority: "high" for important/urgent, "medium" default, "low" for someday
- urgency: "urgent" only for today/tomorrow deadlines or urgent language
- dueDate: extract from context ("내일"=tomorrow, "다음주 월요일"=next monday), null if unclear
- Split compound tasks into separate todosToAdd items
- Keep titles short and actionable
- For subtask breakdown: create 3~6 specific, actionable subtask titles`;

function getTodayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const { message, history, todoList } = await req.json() as {
    message: string;
    history: { role: 'user' | 'model'; text: string }[];
    todoList?: { id: string; title: string }[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const todoContext = todoList?.length
    ? `Current active todos (use these ids for modifications):\n${todoList.map(t => `- [${t.id}] ${t.title}`).join('\n')}`
    : 'No active todos yet.';

  const systemPrompt = SYSTEM_PROMPT
    .replace('{TODAY}', getTodayStr())
    .replace('{TODO_CONTEXT}', todoContext);

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: '{"reply":"안녕하세요! 할일 추가나 수정을 도와드릴게요.","todosToAdd":[],"todosToUpdate":[]}' }] },
    ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Gemini API error:', err);
    return NextResponse.json({ error: 'Gemini API error' }, { status: 502 });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  try {
    const parsed = JSON.parse(text);
    return NextResponse.json({
      reply: parsed.reply ?? '죄송해요, 다시 말씀해 주세요.',
      todosToAdd: parsed.todosToAdd ?? [],
      todosToUpdate: parsed.todosToUpdate ?? [],
      subtasksToAdd: parsed.subtasksToAdd ?? [],
    });
  } catch {
    return NextResponse.json({ reply: text, todosToAdd: [], todosToUpdate: [], subtasksToAdd: [] });
  }
}
