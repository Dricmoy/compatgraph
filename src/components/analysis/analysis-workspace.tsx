"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Code2,
  GitBranch,
  Network,
  Radio,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { AnalysisFindingView, StoredAnalysisView } from "@/data/analyses";
import { cn } from "@/lib/utils";

type Filter = "all" | "breaking" | "dangerous" | "safe";

const severityStyles = {
  breaking: {
    label: "Breaking",
    chip: "bg-[var(--signal)]/10 text-[var(--signal-deep)]",
    icon: "bg-[var(--signal)]/10 text-[var(--signal-deep)]",
  },
  dangerous: {
    label: "Dangerous",
    chip: "bg-[var(--amber)]/30 text-[#855600]",
    icon: "bg-[var(--amber)]/30 text-[#855600]",
  },
  safe: {
    label: "Safe",
    chip: "bg-[var(--mint)]/55 text-[var(--mint-deep)]",
    icon: "bg-[var(--mint)]/55 text-[var(--mint-deep)]",
  },
} as const;

export function AnalysisWorkspace({
  analysis,
}: {
  analysis: StoredAnalysisView;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const visibleFindings = useMemo(
    () =>
      filter === "all"
        ? analysis.findings
        : analysis.findings.filter((finding) => finding.severity === filter),
    [analysis.findings, filter],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    analysis.findings[0]?.id ?? null,
  );
  const selected =
    visibleFindings.find((finding) => finding.id === selectedId) ??
    visibleFindings[0] ??
    null;

  function selectFilter(nextFilter: Filter) {
    setFilter(nextFilter);
    const next =
      nextFilter === "all"
        ? analysis.findings[0]
        : analysis.findings.find((finding) => finding.severity === nextFilter);
    setSelectedId(next?.id ?? null);
  }

  return (
    <>
      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Analysis metrics"
      >
        <Metric
          label="Release gate"
          value={analysis.status === "blocked" ? "Blocked" : "Ready"}
          detail={
            analysis.summary.breaking + " breaking changes require attention"
          }
          icon={analysis.status === "blocked" ? ShieldAlert : CheckCircle2}
          tone="signal"
        />
        <Metric
          label="Risk score"
          value={analysis.riskScore + "/100"}
          detail="Weighted by severity and live consumer exposure"
          icon={AlertTriangle}
          tone="amber"
        />
        <Metric
          label="Findings"
          value={String(analysis.findings.length)}
          detail={
            analysis.summary.breaking +
            " breaking · " +
            analysis.summary.dangerous +
            " dangerous · " +
            analysis.summary.safe +
            " safe"
          }
          icon={Code2}
          tone="violet"
        />
        <Metric
          label="Blast radius"
          value={String(analysis.impactedConsumers)}
          detail="Consumers matched through operation-level evidence"
          icon={Network}
          tone="mint"
        />
      </section>

      <div className="mt-4 grid min-h-[720px] overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(20,30,25,0.07)] lg:grid-cols-[minmax(340px,0.78fr)_minmax(0,1.22fr)]">
        <section className="flex min-h-0 flex-col border-b border-black/[0.07] lg:border-r lg:border-b-0">
          <div className="border-b border-black/[0.07] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold tracking-tight">Change ledger</h2>
                <p className="mt-1 text-xs text-black/40">
                  Select a finding to inspect evidence and exposure.
                </p>
              </div>
              <span className="rounded-full bg-black/[0.055] px-2.5 py-1 font-mono text-[10px] text-black/45">
                {visibleFindings.length} shown
              </span>
            </div>
            <div
              className="mt-4 flex flex-wrap gap-1.5"
              role="group"
              aria-label="Filter findings"
            >
              {(["all", "breaking", "dangerous", "safe"] as const).map(
                (option) => {
                  const count =
                    option === "all"
                      ? analysis.findings.length
                      : analysis.summary[option];
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => selectFilter(option)}
                      aria-pressed={filter === option}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-wide uppercase transition-colors",
                        filter === option
                          ? "bg-[var(--ink)] text-white"
                          : "bg-black/[0.045] text-black/45 hover:bg-black/[0.08]",
                      )}
                    >
                      {option} {count}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="max-h-[760px] flex-1 overflow-y-auto">
            {visibleFindings.map((finding) => (
              <FindingRow
                key={finding.id}
                finding={finding}
                selected={finding.id === selected?.id}
                onSelect={() => setSelectedId(finding.id)}
              />
            ))}
            {visibleFindings.length === 0 ? (
              <div className="grid min-h-48 place-items-center px-6 text-center text-sm text-black/40">
                No findings in this category.
              </div>
            ) : null}
          </div>
        </section>

        <section className="min-w-0 bg-[#fafaf6]">
          {selected ? (
            <FindingDetail finding={selected} project={analysis.project} />
          ) : (
            <div className="grid h-full min-h-96 place-items-center text-sm text-black/40">
              Select a finding to inspect its evidence.
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function FindingRow({
  finding,
  selected,
  onSelect,
}: {
  finding: AnalysisFindingView;
  selected: boolean;
  onSelect: () => void;
}) {
  const styles = severityStyles[finding.severity];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full grid-cols-[auto_1fr_auto] gap-3 border-b border-black/[0.055] p-4 text-left transition-colors sm:p-5",
        selected ? "bg-[var(--signal)]/[0.055]" : "hover:bg-black/[0.018]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid h-8 w-8 place-items-center rounded-xl",
          styles.icon,
        )}
      >
        {finding.severity === "safe" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-black/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-bold">
            {finding.method}
          </span>
          <code className="truncate text-[10px] text-black/40">
            {finding.path}
          </code>
        </span>
        <span className="mt-2 block text-xs leading-5 font-semibold">
          {finding.title}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[10px] text-black/35">
          <Users className="h-3 w-3" /> {finding.consumers.length} consumers
        </span>
      </span>
      <ChevronRight
        className={cn(
          "mt-2 h-4 w-4",
          selected ? "text-[var(--signal)]" : "text-black/20",
        )}
      />
    </button>
  );
}

function FindingDetail({
  finding,
  project,
}: {
  finding: AnalysisFindingView;
  project: string;
}) {
  const styles = severityStyles[finding.severity];
  return (
    <div className="p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase",
              styles.chip,
            )}
          >
            {styles.label}
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
            {finding.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
            {finding.detail}
          </p>
        </div>
        <span className="rounded-xl border border-black/[0.07] bg-white px-3 py-2 font-mono text-[10px] text-black/40">
          {finding.ruleId}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-black/[0.07] bg-white p-4">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-black/35 uppercase">
          <CircleDot className="h-3.5 w-3.5 text-[var(--signal)]" /> Evidence
          pointer
        </div>
        <code className="mt-2 block overflow-x-auto text-[11px] leading-5 text-black/55">
          {finding.pointer}
        </code>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Snapshot label="Before" value={finding.before} />
        <Snapshot label="After" value={finding.after} candidate />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
        <div className="flex items-center justify-between border-b border-black/[0.07] px-4 py-3.5">
          <div>
            <h3 className="text-sm font-semibold">Consumer blast radius</h3>
            <p className="mt-0.5 text-[10px] text-black/40">
              Exact operation matches from repository callsites
            </p>
          </div>
          <span className="rounded-full bg-[var(--signal)]/10 px-2.5 py-1 text-[10px] font-bold text-[var(--signal-deep)]">
            {finding.consumers.length} exposed
          </span>
        </div>
        <div className="dot-field relative min-h-[285px] overflow-hidden bg-[#f8f8f4]">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 700 285"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {finding.consumers.slice(0, 4).map((consumer, index) => (
              <path
                key={consumer.id}
                d={
                  "M 250 142 C 360 142, 410 " +
                  (52 + index * 58) +
                  ", 520 " +
                  (52 + index * 58)
                }
                fill="none"
                stroke="#ff5c35"
                strokeWidth="2"
                strokeDasharray={index % 2 === 0 ? "6 6" : undefined}
              />
            ))}
          </svg>
          <div className="pulse-ring absolute top-1/2 left-[35%] w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--signal)] p-3.5 text-white shadow-lg">
            <span className="flex items-center gap-1.5 font-mono text-[9px] text-white/70">
              <Radio className="h-3 w-3" /> API OPERATION
            </span>
            <p className="mt-2 truncate text-xs font-semibold">{project}</p>
            <p className="mt-1 truncate font-mono text-[9px] text-white/65">
              {finding.method} {finding.path}
            </p>
          </div>
          {finding.consumers.slice(0, 4).map((consumer, index) => (
            <div
              key={consumer.id}
              className="absolute left-[74%] w-40 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--signal)]/20 bg-white p-3 shadow-sm"
              style={{ top: 18 + index * 20 + "%" }}
            >
              <span className="flex items-center gap-1 font-mono text-[8px] text-black/35 uppercase">
                <GitBranch className="h-3 w-3" /> {consumer.kind}
              </span>
              <p className="mt-1 truncate text-[11px] font-semibold">
                {consumer.name}
              </p>
              <p className="mt-0.5 truncate text-[9px] text-black/40">
                {consumer.owner}
              </p>
            </div>
          ))}
          {finding.consumers.length === 0 ? (
            <div className="absolute top-1/2 left-[72%] w-44 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-dashed border-black/15 bg-white/80 p-4 text-center">
              <p className="text-[11px] font-semibold">No known consumers</p>
              <p className="mt-1 text-[9px] leading-4 text-black/40">
                This operation has no indexed callsite evidence yet.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Snapshot({
  label,
  value,
  candidate = false,
}: {
  label: string;
  value: unknown;
  candidate?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-[#111815]">
      <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
        <span className="font-mono text-[9px] font-bold tracking-wider text-white/40 uppercase">
          {label}
        </span>
        {candidate ? (
          <ArrowUpRight className="h-3 w-3 text-[var(--mint)]" />
        ) : null}
      </div>
      <pre className="min-h-24 overflow-x-auto p-3.5 font-mono text-[10px] leading-5 text-[#d9f8e8]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof AlertTriangle;
  tone: "signal" | "amber" | "violet" | "mint";
}) {
  const tones = {
    signal: "bg-[var(--signal)]/10 text-[var(--signal-deep)]",
    amber: "bg-[var(--amber)]/35 text-[#855600]",
    violet: "bg-[var(--violet)]/65 text-[#59449b]",
    mint: "bg-[var(--mint)]/60 text-[var(--mint-deep)]",
  };
  return (
    <article className="rounded-2xl border border-black/[0.07] bg-white p-4.5">
      <div
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl",
          tones[tone],
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-5 text-[10px] font-bold tracking-[0.12em] text-black/35 uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1.5 text-[11px] leading-4 text-black/40">{detail}</p>
    </article>
  );
}
