import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { Competitor } from "@/lib/types";

export async function GET() {
  const rows = db.prepare("SELECT * FROM competitors ORDER BY name ASC").all() as Competitor[];
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, category, store_url, memo } = body;

  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "경쟁작 이름은 필수입니다." }, { status: 400 });
  }

  const stmt = db.prepare(
    "INSERT INTO competitors (name, category, store_url, memo) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(String(name).trim(), category ?? null, store_url ?? null, memo ?? null);
  const created = db
    .prepare("SELECT * FROM competitors WHERE id = ?")
    .get(result.lastInsertRowid) as Competitor;

  return NextResponse.json(created, { status: 201 });
}
