"use client";

import { useEffect, useMemo, useState } from "react";
import type { Competitor, CompetitorEventType } from "@/lib/types";

interface TimelineRow {
  id: number;
  competitor_id: number;
  competitor_name: string;
  date: string;
  type: CompetitorEventType;
  title: string;
  description: string | null;
}

const TYPE_LABEL: Record<CompetitorEventType, string> = {
  update: "업데이트",
  event: "이벤트",
  promotion: "프로모션",
  ranking: "순위 변동",
  etc: "기타",
};

const TYPE_COLOR: Record<CompetitorEventType, string> = {
  update: "bg-blue-500/20 text-blue-300",
  event: "bg-purple-500/20 text-purple-300",
  promotion: "bg-amber-500/20 text-amber-300",
  ranking: "bg-emerald-500/20 text-emerald-300",
  etc: "bg-gray-500/20 text-gray-300",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [compName, setCompName] = useState("");
  const [compCategory, setCompCategory] = useState("");
  const [compUrl, setCompUrl] = useState("");
  const [compError, setCompError] = useState<string | null>(null);

  const [eventCompetitorId, setEventCompetitorId] = useState<string>("");
  const [eventDate, setEventDate] = useState(todayStr());
  const [eventType, setEventType] = useState<CompetitorEventType>("update");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventError, setEventError] = useState<string | null>(null);

  const [filterCompetitor, setFilterCompetitor] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const [compRes, timelineRes] = await Promise.all([
      fetch("/api/competitors"),
      fetch("/api/competitors/timeline"),
    ]);
    setCompetitors(await compRes.json());
    setTimeline(await timelineRes.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!eventCompetitorId && competitors.length > 0) {
      setEventCompetitorId(String(competitors[0].id));
    }
  }, [competitors, eventCompetitorId]);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompError(null);

    if (!compName.trim()) {
      setCompError("경쟁작 이름을 입력해주세요.");
      return;
    }

    const res = await fetch("/api/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: compName.trim(), category: compCategory, store_url: compUrl }),
    });

    if (!res.ok) {
      const err = await res.json();
      setCompError(err.error ?? "저장에 실패했습니다.");
      return;
    }

    setCompName("");
    setCompCategory("");
    setCompUrl("");
    await load();
  };

  const handleDeleteCompetitor = async (id: number) => {
    await fetch(`/api/competitors/${id}`, { method: "DELETE" });
    await load();
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventError(null);

    if (!eventCompetitorId || !eventDate || !eventTitle.trim()) {
      setEventError("경쟁작, 날짜, 제목은 필수입니다.");
      return;
    }

    const res = await fetch(`/api/competitors/${eventCompetitorId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: eventDate,
        type: eventType,
        title: eventTitle.trim(),
        description: eventDescription,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setEventError(err.error ?? "저장에 실패했습니다.");
      return;
    }

    setEventTitle("");
    setEventDescription("");
    await load();
  };

  const handleDeleteEvent = async (id: number) => {
    await fetch(`/api/competitors/events/${id}`, { method: "DELETE" });
    await load();
  };

  const filteredTimeline = useMemo(() => {
    return timeline.filter((row) => {
      if (filterCompetitor !== "all" && String(row.competitor_id) !== filterCompetitor) return false;
      if (filterType !== "all" && row.type !== filterType) return false;
      return true;
    });
  }, [timeline, filterCompetitor, filterType]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">경쟁작/마켓 트래커</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          경쟁작 업데이트·이벤트·프로모션·순위 변동을 한곳에 기록하고 타임라인으로 확인합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold">경쟁작 등록</h2>
          <form onSubmit={handleAddCompetitor} className="flex flex-col gap-2">
            <input
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              placeholder="경쟁작 이름"
              className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
            <input
              value={compCategory}
              onChange={(e) => setCompCategory(e.target.value)}
              placeholder="카테고리 (예: RPG, 캐주얼)"
              className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
            <input
              value={compUrl}
              onChange={(e) => setCompUrl(e.target.value)}
              placeholder="스토어 링크 (선택)"
              className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              등록
            </button>
          </form>
          {compError && <p className="mt-2 text-sm text-[var(--danger)]">{compError}</p>}

          <div className="mt-4 flex flex-col gap-2">
            {competitors.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border border-[var(--panel-border)] bg-black/20 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-[var(--text-dim)]">{c.category || "-"}</div>
                </div>
                <button
                  onClick={() => handleDeleteCompetitor(c.id)}
                  className="text-xs text-[var(--danger)] hover:underline"
                >
                  삭제
                </button>
              </div>
            ))}
            {competitors.length === 0 && (
              <p className="text-xs text-[var(--text-dim)]">등록된 경쟁작이 없습니다.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">동향 기록</h2>
          <form onSubmit={handleAddEvent} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-dim)]">경쟁작</label>
              <select
                value={eventCompetitorId}
                onChange={(e) => setEventCompetitorId(e.target.value)}
                className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
              >
                {competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-dim)]">날짜</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-dim)]">유형</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as CompetitorEventType)}
                className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
              >
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-xs text-[var(--text-dim)]">제목</label>
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="예: 신규 시즌 패스 출시"
                className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex w-full flex-col gap-1">
              <label className="text-xs text-[var(--text-dim)]">상세 메모 (선택)</label>
              <input
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              기록 추가
            </button>
          </form>
          {eventError && <p className="mt-2 text-sm text-[var(--danger)]">{eventError}</p>}
        </section>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold">타임라인</h2>
          <select
            value={filterCompetitor}
            onChange={(e) => setFilterCompetitor(e.target.value)}
            className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1 text-xs"
          >
            <option value="all">전체 경쟁작</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1 text-xs"
          >
            <option value="all">전체 유형</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--text-dim)]">불러오는 중...</p>
        ) : filteredTimeline.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">기록된 동향이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTimeline.map((row) => (
              <div
                key={row.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
                    <span>{row.date}</span>
                    <span className="font-medium text-[var(--text)]">{row.competitor_name}</span>
                    <span className={`rounded px-1.5 py-0.5 ${TYPE_COLOR[row.type]}`}>
                      {TYPE_LABEL[row.type]}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{row.title}</div>
                  {row.description && (
                    <div className="text-sm text-[var(--text-dim)]">{row.description}</div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteEvent(row.id)}
                  className="shrink-0 text-xs text-[var(--danger)] hover:underline"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
