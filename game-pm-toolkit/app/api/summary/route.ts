import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString().slice(0, 10);

  const metricsCount = (
    db.prepare("SELECT COUNT(*) AS c FROM metrics_entries WHERE date >= ?").get(since) as {
      c: number;
    }
  ).c;

  const metricNamesCount = (
    db.prepare("SELECT COUNT(DISTINCT metric_name) AS c FROM metrics_entries").get() as {
      c: number;
    }
  ).c;

  const competitorsCount = (
    db.prepare("SELECT COUNT(*) AS c FROM competitors").get() as { c: number }
  ).c;

  const recentEventsCount = (
    db.prepare("SELECT COUNT(*) AS c FROM competitor_events WHERE date >= ?").get(since) as {
      c: number;
    }
  ).c;

  const feedbackByStatus = db
    .prepare("SELECT status, COUNT(*) AS c FROM feedback_items GROUP BY status")
    .all() as { status: string; c: number }[];

  const openFeedbackCount = feedbackByStatus
    .filter((r) => r.status !== "done")
    .reduce((acc, r) => acc + r.c, 0);

  return NextResponse.json({
    metricsCount,
    metricNamesCount,
    competitorsCount,
    recentEventsCount,
    openFeedbackCount,
    feedbackByStatus,
  });
}
