import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import type { MetricEntry } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("metric_name");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  let query = "SELECT * FROM metrics_entries WHERE 1=1";
  const params: (string | number)[] = [];

  if (name) {
    query += " AND metric_name = ?";
    params.push(name);
  }
  if (start) {
    query += " AND date >= ?";
    params.push(start);
  }
  if (end) {
    query += " AND date <= ?";
    params.push(end);
  }
  query += " ORDER BY date DESC, id DESC";

  const rows = db.prepare(query).all(...params) as MetricEntry[];
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, metric_name, value, note } = body;

  if (!date || !metric_name || value === undefined || value === null || Number.isNaN(Number(value))) {
    return NextResponse.json(
      { error: "date, metric_name, value는 필수이며 value는 숫자여야 합니다." },
      { status: 400 }
    );
  }

  const stmt = db.prepare(
    "INSERT INTO metrics_entries (date, metric_name, value, note) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(date, metric_name, Number(value), note ?? null);
  const created = db
    .prepare("SELECT * FROM metrics_entries WHERE id = ?")
    .get(result.lastInsertRowid) as MetricEntry;

  return NextResponse.json(created, { status: 201 });
}
