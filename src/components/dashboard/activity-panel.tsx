import { ArrowRight } from "lucide-react";

import { activity } from "@/lib/demo-data";

export function ActivityPanel() {
  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white">
      <div className="border-b border-black/[0.07] px-5 py-4">
        <h2 className="font-semibold tracking-tight">Release activity</h2>
        <p className="mt-1 text-xs text-black/45">Payments API · v3.0.0</p>
      </div>
      <div className="px-5 py-2">
        {activity.map((event, index) => (
          <div key={event.label} className="relative flex gap-3 py-3.5">
            {index < activity.length - 1 ? (
              <span className="absolute top-9 bottom-[-12px] left-[7px] w-px bg-black/10" />
            ) : null}
            <span
              className={`relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgb(16_18_17_/_0.12)] ${index === activity.length - 1 ? "bg-[var(--signal)]" : "bg-[var(--mint-deep)]"}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">{event.label}</p>
              <p className="mt-1 text-[11px] text-black/40">
                {event.actor} · {event.time}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="flex w-full items-center justify-between border-t border-black/[0.07] px-5 py-4 text-xs font-semibold text-black/55 hover:text-black"
      >
        Open audit trail <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}
