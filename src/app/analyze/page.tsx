import { ArrowLeft, Braces, GitCompareArrows, Network } from "lucide-react";
import Link from "next/link";

import { ContractComparisonForm } from "@/components/analysis/contract-comparison-form";
import { exampleBaseline, exampleCandidate } from "@/lib/example-contracts";

export default function AnalyzePage() {
  return (
    <main className="min-h-screen bg-[#f4f4ee]">
      <header className="border-b border-black/[0.07] bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1480px] items-center justify-between px-4 sm:px-7">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-black/50 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" /> Back to workspace
          </Link>
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.13em] text-black/35 uppercase">
            <span className="h-2 w-2 rounded-full bg-[var(--mint-deep)]" />
            Engine v1 · ready
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-4 py-10 sm:px-7 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-[var(--signal-deep)] uppercase">
              <GitCompareArrows className="h-4 w-4" /> New release analysis
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.055em] text-balance sm:text-6xl">
              See the blast radius before your customers do.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-black/50 sm:text-base">
              Compare two API contracts. CompatGraph classifies every change,
              stores the evidence, and connects affected operations to real
              consumer ownership.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <MiniStat icon={Braces} value="3.0 + 3.1" label="OpenAPI" />
            <MiniStat icon={Network} value="6" label="mapped consumers" />
          </div>
        </div>

        <ContractComparisonForm
          initialBaseline={exampleBaseline}
          initialCandidate={exampleCandidate}
        />
      </div>
    </main>
  );
}

function MiniStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Braces;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-32 rounded-2xl border border-black/[0.07] bg-white px-4 py-3">
      <Icon className="h-4 w-4 text-[var(--signal)]" />
      <p className="mt-3 text-sm font-semibold">{value}</p>
      <p className="mt-0.5 text-[10px] tracking-wide text-black/35 uppercase">
        {label}
      </p>
    </div>
  );
}
