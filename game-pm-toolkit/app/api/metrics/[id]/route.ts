import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = db.prepare("DELETE FROM metrics_entries WHERE id = ?").run(id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
