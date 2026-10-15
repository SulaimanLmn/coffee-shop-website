import Link from "next/link";

export function Logo({ href = "/", suffix }: { href?: string; suffix?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2 rounded-full">
      <span
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-full bg-espresso text-sm text-cream"
      >
        ☕
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-espresso">
        Brew&nbsp;Haven
      </span>
      {suffix && (
        <span className="rounded-full bg-foam px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-coffee">
          {suffix}
        </span>
      )}
    </Link>
  );
}
