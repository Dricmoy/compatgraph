import {
  ArrowRight,
  Braces,
  GitCompareArrows,
  Network,
  Radar,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import { ProductPreview } from "@/components/landing/product-preview";
import { SiteHeader } from "@/components/site-header";

const capabilities = [
  {
    icon: GitCompareArrows,
    eyebrow: "Contract intelligence",
    title: "Know what broke, not just what changed.",
    copy: "Deterministic OpenAPI analysis explains every compatibility risk down to the method, schema, and JSON pointer.",
    color: "bg-[var(--violet)]",
  },
  {
    icon: Network,
    eyebrow: "Consumer graph",
    title: "See the blast radius before customers do.",
    copy: "Connect changes to repositories, runtime consumers, owners, and active releases in one navigable impact map.",
    color: "bg-[var(--mint)]",
  },
  {
    icon: Workflow,
    eyebrow: "Migration control",
    title: "Turn findings into a release plan.",
    copy: "Track owners, evidence, migration status, and release gates without losing the history behind each decision.",
    color: "bg-[var(--amber)]",
  },
];

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <section className="grid-noise relative overflow-hidden border-b border-black/[0.08]">
        <div className="absolute top-[-12rem] right-[-9rem] h-[32rem] w-[32rem] rounded-full bg-[var(--violet)]/50 blur-3xl" />
        <div className="absolute bottom-[-20rem] left-[-10rem] h-[36rem] w-[36rem] rounded-full bg-[var(--mint)]/45 blur-3xl" />
        <div className="relative mx-auto max-w-[1240px] px-5 pt-20 pb-16 md:px-8 md:pt-28 md:pb-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3.5 py-2 text-xs font-semibold text-black/60 shadow-sm backdrop-blur">
              <Radar className="h-3.5 w-3.5 text-[var(--signal)]" />
              Change intelligence for every API release
            </div>
            <h1 className="text-[clamp(3.2rem,8vw,7.4rem)] leading-[0.87] font-semibold tracking-[-0.075em] text-balance">
              Ship APIs.
              <span className="block text-[var(--signal)]">Keep trust.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-balance text-[var(--muted-ink)] md:text-xl">
              CompatGraph finds breaking contract changes, maps every exposed
              consumer, and turns release risk into a migration plan your team
              can act on.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="group flex h-13 items-center gap-2 rounded-full bg-[var(--ink)] px-6 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-xl"
              >
                Explore the live analysis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="https://github.com/Dricmoy/compatgraph"
                target="_blank"
                rel="noreferrer"
                className="flex h-13 items-center gap-2 rounded-full border border-black/10 bg-white/75 px-6 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
              >
                <Braces className="h-4 w-4" />
                Read the source
              </a>
            </div>
          </div>
          <div id="product" className="mx-auto mt-16 max-w-5xl md:mt-20">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="border-b border-black/[0.08] bg-white py-20 md:py-28"
      >
        <div className="mx-auto max-w-[1240px] px-5 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.2em] text-[var(--signal-deep)] uppercase">
              One release surface
            </p>
            <h2 className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.055em] text-balance md:text-6xl">
              From contract diff to confident rollout.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, ...capability }, index) => (
              <article
                key={capability.title}
                className="group relative overflow-hidden rounded-[28px] border border-black/[0.09] bg-[var(--paper)] p-7 transition-transform hover:-translate-y-1 md:p-8"
              >
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${capability.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-10 text-[11px] font-bold tracking-[0.17em] text-black/40 uppercase">
                  0{index + 1} · {capability.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                  {capability.title}
                </h3>
                <p className="mt-4 text-[15px] leading-7 text-[var(--muted-ink)]">
                  {capability.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="engineering"
        className="overflow-hidden bg-[var(--navy)] py-20 text-white md:py-28"
      >
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/70">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--mint)]" />
              Evidence over guesswork
            </div>
            <h2 className="mt-6 text-4xl leading-tight font-semibold tracking-[-0.055em] text-balance md:text-6xl">
              A release gate engineers can interrogate.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
              Every verdict links back to the exact contract location, consumer
              evidence, owner, and migration state. No opaque risk score. No
              invented certainty.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Deterministic analysis",
              "Consumer-level evidence",
              "Auditable decisions",
              "Retry-safe workflows",
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur"
              >
                <p className="font-mono text-xs text-[var(--mint)]">
                  CG-0{index + 1}
                </p>
                <p className="mt-6 text-lg font-medium tracking-tight">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/[0.08] bg-[var(--paper)] py-8">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 text-sm text-black/50 md:flex-row md:items-center md:justify-between md:px-8">
          <p>Built in public by Dricmoy Bhattacharjee.</p>
          <p className="font-mono text-xs">
            Contracts change. Trust shouldn&apos;t.
          </p>
        </div>
      </footer>
    </main>
  );
}
