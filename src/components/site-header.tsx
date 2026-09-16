import { ArrowUpRight, GitFork } from "lucide-react";
import Link from "next/link";

import { Brand } from "./brand";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-black/[0.07] bg-[var(--paper)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-[1240px] items-center justify-between px-5 md:px-8">
        <Brand />
        <nav
          className="hidden items-center gap-8 text-sm font-medium text-[var(--muted-ink)] md:flex"
          aria-label="Main navigation"
        >
          <a className="transition-colors hover:text-black" href="#product">
            Product
          </a>
          <a className="transition-colors hover:text-black" href="#workflow">
            Workflow
          </a>
          <a className="transition-colors hover:text-black" href="#engineering">
            Engineering
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            className="hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-[var(--muted-ink)] transition-colors hover:bg-black/[0.05] hover:text-black sm:flex"
            href="https://github.com/Dricmoy/compatgraph"
            target="_blank"
            rel="noreferrer"
          >
            <GitFork className="h-4 w-4" />
            GitHub
          </a>
          <Link
            href="/dashboard"
            className="flex h-10 items-center gap-2 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-lg"
          >
            Live demo
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
