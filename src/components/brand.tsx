import Link from "next/link";

import { cn } from "@/lib/utils";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 font-semibold tracking-[-0.035em]",
        inverse ? "text-white" : "text-[var(--ink)]",
      )}
      aria-label="CompatGraph home"
    >
      <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-[10px] bg-[var(--signal)] text-white shadow-[0_5px_14px_rgb(255_92_53_/_0.25)]">
        <span className="absolute h-px w-4 rotate-45 bg-white/75" />
        <span className="absolute h-px w-4 -rotate-45 bg-white/75" />
        <span className="relative h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--signal)]" />
      </span>
      <span className="text-[17px]">CompatGraph</span>
    </Link>
  );
}
