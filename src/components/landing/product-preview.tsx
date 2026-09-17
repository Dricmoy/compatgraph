import {
  AlertTriangle,
  ArrowRight,
  Check,
  GitBranch,
  Radio,
} from "lucide-react";

const nodes = [
  { name: "Payments API", tone: "signal", x: "16%", y: "50%" },
  { name: "checkout-web", tone: "navy", x: "74%", y: "18%" },
  { name: "billing-worker", tone: "navy", x: "78%", y: "50%" },
  { name: "partner-sdk", tone: "navy", x: "72%", y: "82%" },
];

export function ProductPreview() {
  return (
    <div className="panel-shadow relative overflow-hidden rounded-[28px] border border-black/10 bg-white p-2">
      <div className="overflow-hidden rounded-[22px] border border-black/[0.07] bg-[#f2f3ed]">
        <div className="flex h-12 items-center justify-between border-b border-black/[0.07] bg-white px-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b5e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffc65c]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#5dce88]" />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-black/[0.08] px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-black/65 uppercase">
            <Radio className="h-3 w-3 text-[var(--mint-deep)]" />
            Analysis complete
          </div>
        </div>
        <div className="grid min-h-[430px] grid-cols-1 md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden border-b border-black/[0.07] p-5 md:border-r md:border-b-0">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-black/65 uppercase">
                  Impact graph
                </p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight">
                  Payments API · v3.0.0
                </p>
              </div>
              <span className="rounded-full border border-[var(--signal)]/20 bg-white px-2.5 py-1 font-mono text-[10px] font-semibold text-[var(--signal-deep)]">
                3 breaking
              </span>
            </div>
            <div className="dot-field relative h-[310px] overflow-hidden rounded-2xl border border-black/[0.07] bg-white/65">
              <svg
                className="absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <path
                  d="M 90 155 C 180 155, 210 58, 335 58"
                  fill="none"
                  stroke="#ff5c35"
                  strokeWidth="2"
                  strokeDasharray="5 6"
                />
                <path
                  d="M 90 155 C 215 155, 250 155, 365 155"
                  fill="none"
                  stroke="#ff5c35"
                  strokeWidth="2"
                />
                <path
                  d="M 90 155 C 180 155, 215 255, 330 255"
                  fill="none"
                  stroke="#ff5c35"
                  strokeWidth="2"
                  strokeDasharray="5 6"
                />
              </svg>
              {nodes.map((node) => (
                <div
                  key={node.name}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2.5 text-xs font-semibold shadow-sm ${
                    node.tone === "signal"
                      ? "pulse-ring border-[var(--signal-deep)] bg-[var(--signal-deep)] text-white"
                      : "border-black/10 bg-white text-[var(--navy)]"
                  }`}
                  style={{ left: node.x, top: node.y }}
                >
                  {node.name}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-black/65 uppercase">
                  Release gate
                </p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight">
                  Migration readiness
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-full border-4 border-[var(--signal)] text-sm font-bold">
                78
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--signal)]/20 bg-[var(--signal)]/[0.055] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--signal-deep)]">
                  <AlertTriangle className="h-4 w-4" />
                  currency is now required
                </div>
                <p className="mt-2 font-mono text-[11px] text-black/65">
                  POST /v1/payment_intents
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-black/55">
                  <GitBranch className="h-3.5 w-3.5" />3 consumers need
                  migration
                </div>
              </div>
              <div className="rounded-2xl border border-black/[0.08] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Check className="h-4 w-4 text-[var(--mint-deep)]" />9
                  additive changes verified
                </div>
                <p className="mt-2 text-xs leading-5 text-black/65">
                  No migration required for existing consumers.
                </p>
              </div>
            </div>
            <button
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink)] text-sm font-semibold text-white transition-colors hover:bg-black"
              type="button"
            >
              Open migration plan
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
