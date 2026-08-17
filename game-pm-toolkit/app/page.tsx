"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Swords, Inbox, ArrowRight } from "lucide-react";

interface Summary {
  metricsCount: number;
  metricNamesCount: number;
  competitorsCount: number;
  recentEventsCount: number;
  openFeedbackCount: number;
}

export default function HomePage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/summary")
      .then((r) => r.json())
      .then(setSummary);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">게임 사업PM 툴킷</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          지표 취합, 경쟁작 트래킹, 피드백 우선순위 관리를 한 곳에서.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ModuleCard
          href="/metrics"
          icon={LineChart}
          title="지표 리포트 자동화"
          description="수치를 입력/붙여넣기하면 기간별 증감 리포트를 자동 계산합니다."
          stat={summary ? `최근 7일 입력 ${summary.metricsCount}건 · 지표 ${summary.metricNamesCount}종` : "..."}
        />
        <ModuleCard
          href="/competitors"
          icon={Swords}
          title="경쟁작/마켓 트래커"
          description="경쟁작 업데이트·이벤트·프로모션을 타임라인으로 관리합니다."
          stat={summary ? `등록 ${summary.competitorsCount}개 · 최근 7일 ${summary.recentEventsCount}건` : "..."}
        />
        <ModuleCard
          href="/feedback"
          icon={Inbox}
          title="피드백/버그 트리아지"
          description="여러 채널의 피드백을 한 보드에서 우선순위별로 관리합니다."
          stat={summary ? `진행중 항목 ${summary.openFeedbackCount}건` : "..."}
        />
      </div>
    </div>
  );
}

function ModuleCard({
  href,
  icon: Icon,
  title,
  description,
  stat,
}: {
  href: string;
  icon: typeof LineChart;
  title: string;
  description: string;
  stat: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 transition-colors hover:border-[var(--accent)]"
    >
      <div className="flex items-center justify-between">
        <Icon className="text-[var(--accent)]" size={22} />
        <ArrowRight
          size={16}
          className="text-[var(--text-dim)] transition-transform group-hover:translate-x-1"
        />
      </div>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-[var(--text-dim)]">{description}</p>
      </div>
      <div className="mt-auto text-xs text-[var(--text-dim)]">{stat}</div>
    </Link>
  );
}
