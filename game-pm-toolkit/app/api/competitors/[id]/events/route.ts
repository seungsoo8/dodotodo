import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { CompetitorEvent } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { date, type, title, description } = body;

  if (!date || !type || !title || !String(title).trim()) {
    return NextResponse.json(
      { error: "date, type, title은 필수입니다." },
      { status: 400 }
    );
  }

  const stmt = db.prepare(
    "INSERT INTO competitor_events (competitor_id, date, type, title, description) VALUES (?, ?, ?, ?, ?)"
  );
  const result = stmt.run(Number(id), date, type, String(title).trim(), description ?? null);
  const created = db
    .prepare("SELECT * FROM competitor_events WHERE id = ?")
    .get(result.lastInsertRowid) as CompetitorEvent;

  return NextResponse.json(created, { status: 201 });
}
