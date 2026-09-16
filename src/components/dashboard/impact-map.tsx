import { ArrowUpRight, GitBranch, Radio } from "lucide-react";

const consumers = [
  { name: "checkout-web", owner: "Checkout", x: 75, y: 18, exposed: true },
  { name: "billing-worker", owner: "Revenue", x: 79, y: 49, exposed: true },
  { name: "partner-sdk", owner: "Ecosystem", x: 70, y: 80, exposed: true },
  { name: "ledger-sync", owner: "Finance", x: 29, y: 81, exposed: false },
];

export function ImpactMap() {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.07] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold tracking-tight">Consumer impact</h2>
            <span className="rounded-full bg-[var(--signal)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--signal-deep)]">
              3 exposed
            </span>
          </div>
          <p className="mt-1 text-xs text-black/45">
            Live dependencies for the selected breaking change
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 text-xs font-semibold text-black/55 hover:text-black"
          type="button"
        >
          Expand graph <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="dot-field relative min-h-[345px] overflow-hidden bg-[#f8f8f4]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 700 345"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 275 173 C 380 173, 415 62, 525 62"
            fill="none"
            stroke="#ff5c35"
            strokeWidth="2.2"
            strokeDasharray="6 6"
          />
          <path
            d="M 275 173 C 390 173, 450 169, 555 169"
            fill="none"
            stroke="#ff5c35"
            strokeWidth="2.2"
          />
          <path
            d="M 275 173 C 375 173, 405 278, 490 278"
            fill="none"
            stroke="#ff5c35"
            strokeWidth="2.2"
            strokeDasharray="6 6"
          />
          <path
            d="M 275 173 C 245 205, 220 255, 205 278"
            fill="none"
            stroke="#c8cbc4"
            strokeWidth="1.6"
          />
        </svg>
        <div className="pulse-ring absolute top-1/2 left-[39%] w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--signal)] bg-[var(--signal)] p-3.5 text-white shadow-lg">
          <div className="flex items-center gap-2 font-mono text-[10px] text-white/70">
            <Radio className="h-3 w-3" /> API SOURCE
          </div>
          <p className="mt-2 text-sm font-semibold">Payments API</p>
          <p className="mt-0.5 text-xs text-white/60">v3.0.0 candidate</p>
        </div>
        {consumers.map((consumer) => (
          <div
            key={consumer.name}
            className={`absolute w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-3 shadow-sm ${consumer.exposed ? "border-[var(--signal)]/25" : "border-black/[0.08]"}`}
            style={{ left: `${consumer.x}%`, top: `${consumer.y}%` }}
          >
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-black/35 uppercase">
              <GitBranch className="h-3 w-3" /> consumer
            </div>
            <p className="mt-1.5 truncate text-xs font-semibold">
              {consumer.name}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-black/40">
              {consumer.owner}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
