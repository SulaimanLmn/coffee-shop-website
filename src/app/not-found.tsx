import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <>
      <header className="border-b border-latte/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto flex max-w-xl flex-1 flex-col items-center px-4 py-24 text-center sm:px-6">
        <span
          aria-hidden="true"
          className="grid h-16 w-16 place-items-center rounded-full bg-foam text-3xl"
        >
          ☕
        </span>
        <p className="mt-6 font-display text-sm font-semibold uppercase tracking-[0.18em] text-caramel-dark">
          404
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">
          This page brewed away
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-mocha">
          We couldn&apos;t find what you were looking for. It may have moved, been
          taken off the menu, or never existed.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-caramel-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coffee"
        >
          Back to the shop
        </Link>
      </main>
    </>
  );
}
