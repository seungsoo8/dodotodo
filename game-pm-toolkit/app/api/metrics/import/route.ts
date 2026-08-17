import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

interface ImportRow {
  date: string;
  metric_name: string;
  value: number;
  note: string | null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rows: unknown = body?.rows;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "가져올 행이 없습니다." }, { status: 400 });
  }

  const valid: ImportRow[] = [];
  const errors: string[] = [];

  rows.forEach((r, i) => {
    const row = r as Record<string, unknown>;
    const date = String(row.date ?? "").trim();
    const metric_name = String(row.metric_name ?? "").trim();
    const value = Number(row.value);
    const note = row.note ? String(row.note).trim() : null;

    if (!date || !metric_name || Number.isNaN(value)) {
      errors.push(`${i + 1}번째 행: date/metric_name/value 확인 필요`);
      return;
    }
    valid.push({ date, metric_name, value, note });
  });

  const insert = db.prepare(
    "INSERT INTO metrics_entries (date, metric_name, value, note) VALUES (?, ?, ?, ?)"
  );
  const insertMany = db.transaction((items: ImportRow[]) => {
    for (const item of items) {
      insert.run(item.date, item.metric_name, item.value, item.note);
    }
  });
  insertMany(valid);

  return NextResponse.json({ inserted: valid.length, errors });
}
