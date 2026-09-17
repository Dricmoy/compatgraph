import { ArrowLeft, Clock3, GitCompareArrows, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnalysisWorkspace } from "@/components/analysis/analysis-workspace";
import { getAnalysisById } from "@/data/analyses";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReleasePage(props: PageProps<"/releases/[id]">) {
  const { id } = await props.params;
  const analysis = await getAnalysisById(id);
  if (!analysis) notFound();

  const analyzedLabel = analysis.analyzedAt
    ? new Intl.DateTimeFormat("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Edmonton",
      }).format(analysis.analyzedAt)
    : "in progress";

  return (
    <main className="min-h-screen bg-[#f3f4ee]">
      <header className="sticky top-0 z-30 border-b border-black/[0.07] bg-[#f3f4ee]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-19 max-w-[1480px] items-center justify-between px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/10 bg-white text-black/45 hover:text-black"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="truncate text-black/40">
                  {analysis.organization}
                </span>
                <span className="text-black/20">/</span>
                <span className="truncate font-semibold">
                  {analysis.project}
                </span>
              </div>
              <p className="mt-0.5 hidden font-mono text-[9px] text-black/30 sm:block">
                {analysis.id}
              </p>
            </div>
          </div>
          <Link
            href="/analyze"
            className="flex h-10 items-center gap-2 rounded-xl bg-[var(--ink)] px-3.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-lg"
          >
            <Plus className="h-4 w-4" /> New analysis
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-7 sm:py-10">
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.15em] text-[var(--signal-deep)] uppercase">
              <GitCompareArrows className="h-3.5 w-3.5" /> Persisted release
              analysis
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
              {analysis.baselineVersion}{" "}
              <span className="mx-1 text-black/20">→</span>{" "}
              {analysis.candidateVersion}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-black/40">
              <Clock3 className="h-3.5 w-3.5" /> Analyzed {analyzedLabel} ·
              reload-safe PostgreSQL record
            </p>
          </div>
          <div
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-2xl border px-4 py-3",
              analysis.status === "blocked"
                ? "border-[var(--signal)]/20 bg-[var(--signal)]/[0.06] text-[var(--signal-deep)]"
                : "border-[var(--mint-deep)]/15 bg-[var(--mint)]/35 text-[var(--mint-deep)]",
            )}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            <span className="text-xs font-bold uppercase">
              Release {analysis.status}
            </span>
          </div>
        </div>

        <AnalysisWorkspace analysis={analysis} />
      </div>
    </main>
  );
}
