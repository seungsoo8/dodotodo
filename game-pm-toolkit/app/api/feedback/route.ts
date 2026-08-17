import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { FeedbackItem } from "@/lib/types";

export async function GET() {
  const rows = db
    .prepare("SELECT * FROM feedback_items ORDER BY priority_score DESC, created_at DESC")
    .all() as FeedbackItem[];
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source, content, tags, impact, priority_score } = body;

  if (!source || !content || !String(content).trim()) {
    return NextResponse.json({ error: "출처와 내용은 필수입니다." }, { status: 400 });
  }

  const stmt = db.prepare(
    `INSERT INTO feedback_items (source, content, tags, impact, priority_score)
     VALUES (?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    String(source).trim(),
    String(content).trim(),
    tags ?? null,
    impact ?? "mid",
    Number(priority_score) || 0
  );
  const created = db
    .prepare("SELECT * FROM feedback_items WHERE id = ?")
    .get(result.lastInsertRowid) as FeedbackItem;

  return NextResponse.json(created, { status: 201 });
}
