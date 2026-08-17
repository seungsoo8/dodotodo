"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LineChart, Swords, Inbox } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: LayoutDashboard },
  { href: "/metrics", label: "지표 리포트", icon: LineChart },
  { href: "/competitors", label: "경쟁작 트래커", icon: Swords },
  { href: "/feedback", label: "피드백 보드", icon: Inbox },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--panel-border)] bg-[var(--panel)]">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-3 sm:px-6">
        <span className="mr-4 shrink-0 text-sm font-semibold text-[var(--text)]">
          게임PM 툴킷
        </span>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-[var(--accent-dim)] text-[var(--text)]"
                  : "text-[var(--text-dim)] hover:bg-white/5 hover:text-[var(--text)]"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
