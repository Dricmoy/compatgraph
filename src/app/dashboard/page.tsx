import {
  AlertTriangle,
  Boxes,
  Cable,
  GitCompareArrows,
  GitFork,
  Menu,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { ChangeList } from "@/components/dashboard/change-list";
import { ImpactMap } from "@/components/dashboard/impact-map";
import { MetricCard } from "@/components/dashboard/metric-card";
import { getLatestReleaseDashboard } from "@/data/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const releaseOverview = await getLatestReleaseDashboard("payments-api");
  const analyzedLabel = releaseOverview.analyzedAt
    ? new Intl.DateTimeFormat("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Edmonton",
      }).format(releaseOverview.analyzedAt)
    : "analysis in progress";
  const exposedConsumers = releaseOverview.graphConsumers.filter(
    (consumer) => consumer.exposed,
  ).length;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 flex h-19 items-center justify-between border-b border-black/[0.07] bg-[#f3f4ee]/90 px-4 backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl border border-black/10 bg-white lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-sm text-black/40 hover:text-black">
                {releaseOverview.organization}
              </Link>
              <span className="text-black/20">/</span>
              <span className="text-sm font-semibold">
                {releaseOverview.service}
              </span>
            </div>
            <p className="mt-0.5 hidden text-[11px] text-black/35 sm:block">
              Release intelligence workspace
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden h-10 items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3.5 text-xs font-semibold shadow-sm transition-colors hover:bg-black/[0.025] sm:flex">
            <GitFork className="h-4 w-4" />
            Demo workspace
          </span>
          <Link
            href="/analyze"
            className="flex h-10 items-center gap-2 rounded-xl bg-[var(--ink)] px-3.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            New analysis
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 sm:py-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-[var(--signal-deep)] uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Latest candidate
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
              Release intelligence
            </h1>
            <p className="mt-2 text-sm text-black/45">
              {releaseOverview.baseline}{" "}
              <span className="mx-1.5 text-black/25">→</span>{" "}
              {releaseOverview.candidate} · analyzed {analyzedLabel}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--signal)]/15 bg-[var(--signal)]/[0.055] px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-[var(--signal-deep)]" />
            <div>
              <p className="text-xs font-semibold text-[var(--signal-deep)]">
                Release gate {releaseOverview.status}
              </p>
              <p className="mt-0.5 text-[11px] text-black/45">
                {exposedConsumers} consumer migrations required
              </p>
            </div>
          </div>
        </div>

        <section
          className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Release metrics"
        >
          <MetricCard
            label="Risk score"
            value={`${releaseOverview.score}/100`}
            detail="Critical based on breaking changes and exposure."
            icon={AlertTriangle}
            tone="signal"
          />
          <MetricCard
            label="Contract changes"
            value={String(releaseOverview.findings)}
            detail={`${releaseOverview.severityCounts.breaking} breaking, ${releaseOverview.severityCounts.dangerous} dangerous, and ${releaseOverview.severityCounts.safe} additive.`}
            icon={GitCompareArrows}
            tone="violet"
          />
          <MetricCard
            label="Consumers mapped"
            value={String(releaseOverview.consumers)}
            detail={`${releaseOverview.consumerKindCounts.application + releaseOverview.consumerKindCounts.worker} active services and ${releaseOverview.consumerKindCounts.sdk} published SDKs.`}
            icon={Cable}
            tone="mint"
          />
          <MetricCard
            label="Teams involved"
            value={String(releaseOverview.owners)}
            detail="Synthetic ownership modeled from callsite evidence."
            icon={Boxes}
            tone="amber"
          />
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <ImpactMap
            consumers={releaseOverview.graphConsumers}
            service={releaseOverview.service}
            candidate={releaseOverview.candidate}
          />
          <ActivityPanel
            activity={releaseOverview.activity}
            service={releaseOverview.service}
            candidate={releaseOverview.candidate}
          />
          <ChangeList changes={releaseOverview.priorityChanges} />
        </div>
      </div>
    </main>
  );
}
