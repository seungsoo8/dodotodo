export interface MetricEntry {
  id: number;
  date: string;
  metric_name: string;
  value: number;
  note: string | null;
  created_at: string;
}

export interface Competitor {
  id: number;
  name: string;
  category: string | null;
  store_url: string | null;
  memo: string | null;
  created_at: string;
}

export type CompetitorEventType = "update" | "event" | "promotion" | "ranking" | "etc";

export interface CompetitorEvent {
  id: number;
  competitor_id: number;
  date: string;
  type: CompetitorEventType;
  title: string;
  description: string | null;
  created_at: string;
}

export type FeedbackStatus = "collected" | "reviewing" | "prioritized" | "in_progress" | "done";
export type FeedbackImpact = "low" | "mid" | "high";

export interface FeedbackItem {
  id: number;
  source: string;
  content: string;
  tags: string | null;
  impact: FeedbackImpact;
  status: FeedbackStatus;
  priority_score: number;
  created_at: string;
  updated_at: string;
}
