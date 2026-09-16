import {
  Activity,
  Bell,
  Boxes,
  Cable,
  FileDiff,
  LayoutDashboard,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";

const primaryItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Analyses", icon: FileDiff },
  { label: "Consumers", icon: Cable },
  { label: "Contracts", icon: Boxes },
  { label: "Activity", icon: Activity },
];

export function DashboardSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[246px] flex-col border-r border-white/[0.08] bg-[var(--navy)] text-white lg:flex">
      <div className="flex h-19 items-center border-b border-white/[0.08] px-5">
        <Brand inverse />
      </div>
      <div className="px-4 pt-5">
        <button
          className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-left text-sm text-white/55"
          type="button"
        >
          <Search className="h-4 w-4" />
          Search
          <span className="ml-auto rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">
            ⌘ K
          </span>
        </button>
      </div>
      <nav className="mt-6 space-y-1 px-3" aria-label="Dashboard navigation">
        {primaryItems.map(({ label, icon: Icon, active }) => (
          <Link
            key={label}
            href="/dashboard"
            className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${active ? "bg-white text-[var(--navy)]" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/[0.08] p-3">
        <button
          className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
          type="button"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/[0.055] p-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--violet)] text-xs font-bold text-[var(--navy)]">
            MC
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Maya Chen</p>
            <p className="truncate text-xs text-white/40">
              Platform engineering
            </p>
          </div>
          <Bell className="ml-auto h-4 w-4 text-white/45" />
        </div>
      </div>
    </aside>
  );
}
