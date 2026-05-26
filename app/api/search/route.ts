import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SEARCH_PROMPT = `You are a todo search assistant. Find matching todos based on the natural language query.

TODAY: {TODAY}

Todo list:
{TODOS}

Query: "{QUERY}"

Match by meaning, not just keywords:
- "마감 임박" or "급한" → due within 3 days from today
- "우선순위 높은" → priority = high
- "완료한/완료된" → completed = true
- "이번 주" → due this week
- "다음 주" → due next week
- "오늘" → due today
- "연체/기한 지난" → due date is past today

Return ONLY a JSON array of matching todo IDs: ["id1", "id2"]
Return [] if nothing matches.`;

function getTodayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  const { query, todos } = await req.json() as {
    query: string;
    todos: { id: string; title: string; dueDate?: string; priority: string; completed: boolean; description?: string }[];
  };

  if (!query?.trim()) return NextResponse.json([]);

  const todosText = todos
    .map(t =>
      `[${t.id}] ${t.title}${t.dueDate ? ` (마감: ${t.dueDate})` : ''} [${t.priority}]${t.completed ? ' [완료]' : ''}${t.description ? ` - ${t.description.slice(0, 50)}` : ''}`
    )
    .join('\n');

  const prompt = SEARCH_PROMPT
    .replace('{TODAY}', getTodayStr())
    .replace('{TODOS}', todosText || '없음')
    .replace('{QUERY}', query);

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 256, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) return NextResponse.json([]);

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  try {
    const parsed = JSON.parse(text);
    return NextResponse.json(Array.isArray(parsed) ? parsed : []);
  } catch {
    return NextResponse.json([]);
  }
}
