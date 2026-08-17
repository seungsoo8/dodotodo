import { NextResponse } from "next/server";
import db from "@/lib/db";

interface TimelineRow {
  id: number;
  competitor_id: number;
  competitor_name: string;
  date: string;
  type: string;
  title: string;
  description: string | null;
}

export async function GET() {
  const rows = db
    .prepare(
      `SELECT e.id, e.competitor_id, c.name AS competitor_name, e.date, e.type, e.title, e.description
       FROM competitor_events e
       JOIN competitors c ON c.id = e.competitor_id
       ORDER BY e.date DESC, e.id DESC`
    )
    .all() as TimelineRow[];

  return NextResponse.json(rows);
}
