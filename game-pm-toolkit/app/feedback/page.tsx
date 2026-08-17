"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { FeedbackImpact, FeedbackItem, FeedbackStatus } from "@/lib/types";

const STATUS_ORDER: FeedbackStatus[] = [
  "collected",
  "reviewing",
  "prioritized",
  "in_progress",
  "done",
];

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  collected: "수집",
  reviewing: "검토",
  prioritized: "우선순위 지정",
  in_progress: "진행중",
  done: "완료",
};

const IMPACT_LABEL: Record<FeedbackImpact, string> = {
  low: "낮음",
  mid: "보통",
  high: "높음",
};

const IMPACT_COLOR: Record<FeedbackImpact, string> = {
  low: "bg-gray-500/20 text-gray-300",
  mid: "bg-amber-500/20 text-amber-300",
  high: "bg-rose-500/20 text-rose-300",
};

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [source, setSource] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [impact, setImpact] = useState<FeedbackImpact>("mid");
  const [priorityScore, setPriorityScore] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/feedback");
    setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!source.trim() || !content.trim()) {
      setFormError("출처와 내용은 필수입니다.");
      return;
    }

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: source.trim(),
        content: content.trim(),
        tags: tags.trim(),
        impact,
        priority_score: Number(priorityScore) || 0,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setFormError(err.error ?? "저장에 실패했습니다.");
      return;
    }

    setSource("");
    setContent("");
    setTags("");
    setPriorityScore("0");
    await load();
  };

  const updateItem = async (id: number, patch: Partial<FeedbackItem>) => {
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  };

  const moveStatus = (item: FeedbackItem, dir: 1 | -1) => {
    const idx = STATUS_ORDER.indexOf(item.status);
    const next = STATUS_ORDER[idx + dir];
    if (!next) return;
    updateItem(item.id, { status: next });
  };

  const deleteItem = async (id: number) => {
    await fetch(`/api/feedback/${id}`, { method: "DELETE" });
    await load();
  };

  const columns = useMemo(() => {
    const map: Record<FeedbackStatus, FeedbackItem[]> = {
      collected: [],
      reviewing: [],
      prioritized: [],
      in_progress: [],
      done: [],
    };
    for (const item of items) {
      map[item.status].push(item);
    }
    return map;
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">피드백/버그 트리아지 보드</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          여러 채널에서 들어오는 피드백과 버그 제보를 한 보드에 모아 우선순위를 정합니다.
        </p>
      </div>

      <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <h2 className="mb-3 text-sm font-semibold">새 항목 등록</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">출처</label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="예: 스토어리뷰, CS, 디스코드"
              className="w-40 rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">내용</label>
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="피드백/버그 내용"
              className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">태그</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="쉼표로 구분"
              className="w-36 rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">영향도</label>
            <select
              value={impact}
              onChange={(e) => setImpact(e.target.value as FeedbackImpact)}
              className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            >
              {Object.entries(IMPACT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">우선순위 점수</label>
            <input
              type="number"
              value={priorityScore}
              onChange={(e) => setPriorityScore(e.target.value)}
              className="w-24 rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            추가
          </button>
        </form>
        {formError && <p className="mt-2 text-sm text-[var(--danger)]">{formError}</p>}
      </section>

      {loading ? (
        <p className="text-sm text-[var(--text-dim)]">불러오는 중...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STATUS_ORDER.map((status) => (
            <div key={status} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{STATUS_LABEL[status]}</h3>
                <span className="text-xs text-[var(--text-dim)]">{columns[status].length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {columns[status].map((item) => {
                  const idx = STATUS_ORDER.indexOf(item.status);
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs text-[var(--text-dim)]">{item.source}</span>
                        <span className={`rounded px-1.5 py-0.5 text-xs ${IMPACT_COLOR[item.impact]}`}>
                          {IMPACT_LABEL[item.impact]}
                        </span>
                      </div>
                      <p className="text-sm">{item.content}</p>
                      {item.tags && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.tags.split(",").filter(Boolean).map((t) => (
                            <span
                              key={t}
                              className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--text-dim)]"
                            >
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            aria-label="이전 단계로"
                            disabled={idx === 0}
                            onClick={() => moveStatus(item, -1)}
                            className="rounded p-1 text-[var(--text-dim)] hover:bg-white/10 disabled:opacity-30"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span className="text-xs text-[var(--text-dim)]">P{item.priority_score}</span>
                          <button
                            aria-label="다음 단계로"
                            disabled={idx === STATUS_ORDER.length - 1}
                            onClick={() => moveStatus(item, 1)}
                            className="rounded p-1 text-[var(--text-dim)] hover:bg-white/10 disabled:opacity-30"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                        <button
                          aria-label="삭제"
                          onClick={() => deleteItem(item.id)}
                          className="rounded p-1 text-[var(--danger)] hover:bg-white/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {columns[status].length === 0 && (
                  <div className="rounded-lg border border-dashed border-[var(--panel-border)] p-3 text-center text-xs text-[var(--text-dim)]">
                    없음
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
