"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { MetricEntry } from "@/lib/types";
import {
  computePeriodRanges,
  summarize,
  deltaPct,
  inRange,
  type PeriodKind,
} from "@/lib/metricsReport";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MetricsPage() {
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(todayStr());
  const [metricName, setMetricName] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [csvText, setCsvText] = useState("");
  const [csvResult, setCsvResult] = useState<string | null>(null);

  const [reportMetric, setReportMetric] = useState("");
  const [reportKind, setReportKind] = useState<PeriodKind>("week");
  const [reportEndDate, setReportEndDate] = useState(todayStr());

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/metrics");
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const metricNames = useMemo(
    () => Array.from(new Set(entries.map((e) => e.metric_name))).sort(),
    [entries]
  );

  useEffect(() => {
    if (!reportMetric && metricNames.length > 0) {
      setReportMetric(metricNames[0]);
    }
  }, [metricNames, reportMetric]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!date || !metricName.trim() || value.trim() === "" || Number.isNaN(Number(value))) {
      setFormError("날짜, 지표명, 숫자 값을 모두 입력해주세요.");
      return;
    }

    const res = await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, metric_name: metricName.trim(), value: Number(value), note }),
    });

    if (!res.ok) {
      const err = await res.json();
      setFormError(err.error ?? "저장에 실패했습니다.");
      return;
    }

    setValue("");
    setNote("");
    await load();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/metrics/${id}`, { method: "DELETE" });
    await load();
  };

  const handleCsvImport = async () => {
    setCsvResult(null);
    const lines = csvText.trim().split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setCsvResult("붙여넣은 내용이 없습니다.");
      return;
    }

    const first = lines[0].toLowerCase();
    const hasHeader = first.includes("date") && first.includes("metric");
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows = dataLines.map((line) => {
      const [d, name, v, ...rest] = line.split(",").map((s) => s.trim());
      return { date: d, metric_name: name, value: v, note: rest.join(",") || null };
    });

    const res = await fetch("/api/metrics/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const result = await res.json();

    if (!res.ok) {
      setCsvResult(result.error ?? "가져오기에 실패했습니다.");
      return;
    }

    let msg = `${result.inserted}개 행을 추가했습니다.`;
    if (result.errors?.length) {
      msg += ` (오류 ${result.errors.length}건: ${result.errors.join(", ")})`;
    }
    setCsvResult(msg);
    setCsvText("");
    await load();
  };

  const report = useMemo(() => {
    if (!reportMetric) return null;
    const ranges = computePeriodRanges(reportEndDate, reportKind);
    const target = entries.filter((e) => e.metric_name === reportMetric);
    const current = target.filter((e) => inRange(e.date, ranges.start, ranges.end));
    const previous = target.filter((e) => inRange(e.date, ranges.prevStart, ranges.prevEnd));
    const currentSummary = summarize(current);
    const previousSummary = summarize(previous);
    const sumDelta = deltaPct(currentSummary.sum, previousSummary.sum);
    const avgDelta = deltaPct(currentSummary.avg, previousSummary.avg);

    const chartData = [...current]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((e) => ({ date: e.date.slice(5), value: e.value }));

    return { ranges, currentSummary, previousSummary, sumDelta, avgDelta, chartData };
  }, [entries, reportMetric, reportKind, reportEndDate]);

  const reportSummaryText = useMemo(() => {
    if (!report || !reportMetric) return "";
    const periodLabel = reportKind === "week" ? "주간" : "월간";
    const fmtDelta = (d: number | null) =>
      d === null ? "N/A" : `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
    return [
      `[${reportMetric}] ${periodLabel} 리포트 (${report.ranges.start} ~ ${report.ranges.end})`,
      `합계: ${report.currentSummary.sum.toLocaleString()} (전기 대비 ${fmtDelta(report.sumDelta)})`,
      `평균: ${report.currentSummary.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })} (전기 대비 ${fmtDelta(report.avgDelta)})`,
      `데이터 포인트: ${report.currentSummary.count}건 (전기 ${report.previousSummary.count}건)`,
    ].join("\n");
  }, [report, reportMetric, reportKind]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">지표 리포트 자동화</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          수치를 입력/붙여넣기 하면 기간별 증감 리포트를 자동으로 계산합니다.
        </p>
      </div>

      <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <h2 className="mb-3 text-sm font-semibold">빠른 입력</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">지표명</label>
            <input
              list="metric-names"
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              placeholder="예: 매출, DAU, 리텐션"
              className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
            <datalist id="metric-names">
              {metricNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">값</label>
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-32 rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">메모 (선택)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-48 rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
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

      <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <h2 className="mb-3 text-sm font-semibold">CSV/스프레드시트 붙여넣기 가져오기</h2>
        <p className="mb-2 text-xs text-[var(--text-dim)]">
          형식: <code>date,metric_name,value,note</code> (헤더 줄 포함 가능, 스프레드시트에서 복사 후 붙여넣기)
        </p>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={5}
          placeholder={"date,metric_name,value,note\n2026-08-10,매출,12500000,\n2026-08-10,DAU,34210,"}
          className="w-full rounded-md border border-[var(--panel-border)] bg-black/20 p-2 font-mono text-xs"
        />
        <button
          onClick={handleCsvImport}
          className="mt-2 rounded-md border border-[var(--panel-border)] px-4 py-1.5 text-sm hover:bg-white/5"
        >
          가져오기
        </button>
        {csvResult && <p className="mt-2 text-sm text-[var(--text-dim)]">{csvResult}</p>}
      </section>

      <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4">
        <h2 className="mb-3 text-sm font-semibold">기간 비교 리포트</h2>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">지표</label>
            <select
              value={reportMetric}
              onChange={(e) => setReportMetric(e.target.value)}
              className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            >
              {metricNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">기준</label>
            <select
              value={reportKind}
              onChange={(e) => setReportKind(e.target.value as PeriodKind)}
              className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            >
              <option value="week">주간 (최근 7일)</option>
              <option value="month">월간 (달력 기준)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-dim)]">기준일</label>
            <input
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              className="rounded-md border border-[var(--panel-border)] bg-black/20 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        {!report || metricNames.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">지표 데이터를 먼저 입력해주세요.</p>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="합계"
                value={report.currentSummary.sum.toLocaleString()}
                delta={report.sumDelta}
              />
              <StatCard
                label="평균"
                value={report.currentSummary.avg.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
                delta={report.avgDelta}
              />
              <StatCard
                label="데이터 포인트"
                value={`${report.currentSummary.count}건`}
                sub={`전기 ${report.previousSummary.count}건`}
              />
            </div>

            {report.chartData.length > 0 && (
              <div className="mb-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262b36" />
                    <XAxis dataKey="date" stroke="#8b93a7" fontSize={12} />
                    <YAxis stroke="#8b93a7" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "#171a21", border: "1px solid #262b36" }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#5b8cff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-dim)]">복사용 요약 (보고서에 붙여넣기)</label>
              <textarea
                readOnly
                value={reportSummaryText}
                rows={4}
                className="w-full rounded-md border border-[var(--panel-border)] bg-black/20 p-2 font-mono text-xs"
              />
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">최근 입력 내역</h2>
        {loading ? (
          <p className="text-sm text-[var(--text-dim)]">불러오는 중...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-[var(--text-dim)]">아직 입력된 지표가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--panel-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--panel)] text-[var(--text-dim)]">
                <tr>
                  <th className="px-3 py-2">날짜</th>
                  <th className="px-3 py-2">지표</th>
                  <th className="px-3 py-2">값</th>
                  <th className="px-3 py-2">메모</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 50).map((e) => (
                  <tr key={e.id} className="border-t border-[var(--panel-border)]">
                    <td className="px-3 py-2">{e.date}</td>
                    <td className="px-3 py-2">{e.metric_name}</td>
                    <td className="px-3 py-2">{e.value.toLocaleString()}</td>
                    <td className="px-3 py-2 text-[var(--text-dim)]">{e.note}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-xs text-[var(--danger)] hover:underline"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  sub,
}: {
  label: string;
  value: string;
  delta?: number | null;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--panel-border)] bg-black/20 p-3">
      <div className="text-xs text-[var(--text-dim)]">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      {delta !== undefined && (
        <div
          className={`mt-1 text-xs ${
            delta === null
              ? "text-[var(--text-dim)]"
              : delta >= 0
                ? "text-[var(--ok)]"
                : "text-[var(--danger)]"
          }`}
        >
          {delta === null ? "전기 데이터 없음" : `전기 대비 ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
        </div>
      )}
      {sub && <div className="mt-1 text-xs text-[var(--text-dim)]">{sub}</div>}
    </div>
  );
}
