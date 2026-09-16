import { AlertTriangle, ArrowRight, Users } from "lucide-react";

import type { DashboardChange } from "@/data/dashboard";

export function ChangeList({ changes }: { changes: DashboardChange[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white lg:col-span-3">
      <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-4">
        <div>
          <h2 className="font-semibold tracking-tight">Priority findings</h2>
          <p className="mt-1 text-xs text-black/45">
            Ordered by severity and consumer exposure
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 text-xs font-semibold text-black/55 hover:text-black"
          type="button"
        >
          View all findings <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="divide-y divide-black/[0.06]">
        {changes.map((change) => (
          <article
            key={change.id}
            className="grid gap-4 px-5 py-5 transition-colors hover:bg-black/[0.015] md:grid-cols-[1fr_auto] md:items-center"
          >
            <div className="flex min-w-0 gap-3.5">
              <div
                className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${change.severity === "breaking" ? "bg-[var(--signal)]/10 text-[var(--signal-deep)]" : "bg-[var(--amber)]/35 text-[#8a5900]"}`}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${change.method === "GET" ? "bg-[var(--mint)] text-[var(--mint-deep)]" : "bg-[var(--violet)] text-[#5f4ca4]"}`}
                  >
                    {change.method}
                  </span>
                  <code className="truncate text-xs text-black/45">
                    {change.path}
                  </code>
                </div>
                <h3 className="mt-2 text-sm font-semibold">{change.title}</h3>
                <p className="mt-1 text-xs leading-5 text-black/45">
                  {change.detail}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-[50px] md:pl-0">
              <Users className="h-3.5 w-3.5 text-black/35" />
              <div className="flex -space-x-1.5">
                {change.consumers.slice(0, 3).map((consumer, index) => (
                  <span
                    key={consumer}
                    title={consumer}
                    className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[var(--navy)] text-[9px] font-semibold text-white"
                    style={{ opacity: 1 - index * 0.16 }}
                  >
                    {consumer.slice(0, 2).toUpperCase()}
                  </span>
                ))}
              </div>
              <span className="text-xs font-medium text-black/45">
                {change.consumers.length}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
