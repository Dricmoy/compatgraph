"use client";

import {
  ArrowRight,
  CheckCircle2,
  FileCode2,
  LoaderCircle,
  RefreshCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

export function ContractComparisonForm({
  initialBaseline,
  initialCandidate,
}: {
  initialBaseline: string;
  initialCandidate: string;
}) {
  const router = useRouter();
  const baselineId = useId();
  const candidateId = useId();
  const [baseline, setBaseline] = useState(initialBaseline);
  const [candidate, setCandidate] = useState(initialCandidate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/analyses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectSlug: "analysis-lab",
          baseline,
          candidate,
        }),
      });
      const payload = (await response.json()) as {
        data?: { url: string };
        error?: { message: string; issues?: string[] };
      };

      if (!response.ok || !payload.data) {
        const issue = payload.error?.issues?.[0];
        throw new Error(
          issue
            ? `${payload.error?.message ?? "Analysis failed"} ${issue}`
            : (payload.error?.message ?? "The analysis could not be created."),
        );
      }

      router.push(payload.data.url as Route);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "The analysis could not be created.",
      );
      setSubmitting(false);
    }
  }

  function resetExamples() {
    setBaseline(initialBaseline);
    setCandidate(initialCandidate);
    setError(null);
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <div className="grid overflow-hidden rounded-[28px] border border-black/[0.08] bg-white shadow-[0_30px_90px_rgba(24,43,58,0.10)] lg:grid-cols-2">
        <ContractEditor
          id={baselineId}
          label="Baseline contract"
          badge="CURRENT"
          value={baseline}
          onChange={setBaseline}
          onFile={(content) => setBaseline(content)}
        />
        <ContractEditor
          id={candidateId}
          label="Candidate contract"
          badge="PROPOSED"
          value={candidate}
          onChange={setCandidate}
          onFile={(content) => setCandidate(content)}
          candidate
        />
      </div>

      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-black/[0.07] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--mint)]/55 text-[var(--mint-deep)]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Deterministic by design</p>
            <p className="mt-0.5 text-xs leading-5 text-black/45">
              No model calls, remote references, or hidden heuristics. Results
              are stored with exact evidence.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={resetExamples}
            className="flex h-11 items-center gap-2 rounded-xl border border-black/10 px-4 text-xs font-semibold transition-colors hover:bg-black/[0.025]"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Reset example
          </button>
          <button
            type="submit"
            disabled={submitting || !baseline.trim() || !candidate.trim()}
            className="flex h-11 min-w-40 items-center justify-center gap-2 rounded-xl bg-[var(--signal)] px-5 text-xs font-bold text-white shadow-[var(--signal)]/20 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[var(--signal-deep)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Analyzing
              </>
            ) : (
              <>
                Run analysis <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-[var(--signal)]/20 bg-[var(--signal)]/[0.06] px-4 py-3 text-sm text-[var(--signal-deep)]"
        >
          {error}
        </div>
      ) : null}
    </form>
  );
}

function ContractEditor({
  id,
  label,
  badge,
  value,
  onChange,
  onFile,
  candidate = false,
}: {
  id: string;
  label: string;
  badge: string;
  value: string;
  onChange: (value: string) => void;
  onFile: (value: string) => void;
  candidate?: boolean;
}) {
  const fileId = `${id}-file`;

  async function readFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFile(await file.text());
    event.target.value = "";
  }

  return (
    <section
      className={`min-w-0 ${candidate ? "border-t border-black/[0.07] lg:border-t-0 lg:border-l" : ""}`}
    >
      <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <FileCode2 className="h-4 w-4 text-black/35" />
          <label htmlFor={id} className="text-sm font-semibold">
            {label}
          </label>
          <span
            className={`rounded-md px-2 py-1 font-mono text-[9px] font-bold tracking-[0.12em] ${candidate ? "bg-[var(--violet)] text-[#59449b]" : "bg-black/[0.055] text-black/45"}`}
          >
            {badge}
          </span>
        </div>
        <div>
          <input
            id={fileId}
            type="file"
            accept=".json,.yaml,.yml,application/json,text/yaml"
            className="sr-only"
            onChange={readFile}
          />
          <label
            htmlFor={fileId}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-black/45 hover:text-black"
          >
            <Upload className="h-3.5 w-3.5" /> Upload
          </label>
        </div>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className="min-h-[470px] w-full resize-y bg-[#111815] p-5 font-mono text-[12px] leading-6 text-[#d9f8e8] outline-none focus-visible:outline-none"
      />
      <div className="flex items-center justify-between border-t border-black/[0.07] bg-[#fbfbf7] px-5 py-3 text-[10px] text-black/35">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-[var(--mint-deep)]" /> JSON or
          YAML · OpenAPI 3.x
        </span>
        <span>
          {new TextEncoder().encode(value).byteLength.toLocaleString()} bytes
        </span>
      </div>
    </section>
  );
}
