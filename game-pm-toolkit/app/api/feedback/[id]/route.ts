import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { FeedbackItem } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const allowed = ["source", "content", "tags", "impact", "status", "priority_score"] as const;

  const updates: string[] = [];
  const values: (string | number)[] = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "변경할 필드가 없습니다." }, { status: 400 });
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  const result = db
    .prepare(`UPDATE feedback_items SET ${updates.join(", ")} WHERE id = ?`)
    .run(...values);

  if (result.changes === 0) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }

  const updated = db.prepare("SELECT * FROM feedback_items WHERE id = ?").get(id) as FeedbackItem;
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = db.prepare("DELETE FROM feedback_items WHERE id = ?").run(id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
