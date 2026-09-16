import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "signal" | "mint" | "violet" | "amber";
}) {
  const tones = {
    signal: "bg-[var(--signal)]/10 text-[var(--signal-deep)]",
    mint: "bg-[var(--mint)] text-[var(--mint-deep)]",
    violet: "bg-[var(--violet)] text-[#5f4ca4]",
    amber: "bg-[var(--amber)]/45 text-[#8a5900]",
  };

  return (
    <article className="soft-shadow rounded-2xl border border-black/[0.07] bg-white p-5">
      <div className="flex items-start justify-between">
        <div
          className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-mono text-[10px] font-semibold tracking-wider text-black/30 uppercase">
          Live
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="mt-2 text-xs leading-5 text-black/45">{detail}</p>
    </article>
  );
}
