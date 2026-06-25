import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  let email: string | null = null;
  let amount: number | null = null;
  let reference: string | null = null;

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      email = session.customer_details?.email ?? null;
      amount = session.amount_total ?? null;
      reference = session.id;
    } catch (error) {
      console.error("Failed to retrieve Stripe session:", error);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-caramel/15 text-caramel">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-espresso sm:text-4xl">
        Thank you for your order!
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-mocha">
        Your coffee is being roasted and packed. A confirmation is on its way to
        your inbox{email ? ` at ${email}` : ""}.
      </p>

      {(amount !== null || reference) && (
        <dl className="mt-8 w-full max-w-sm divide-y divide-latte rounded-2xl border border-latte bg-white text-left">
          {amount !== null && (
            <div className="flex items-center justify-between px-5 py-4">
              <dt className="text-sm text-mocha">Amount paid</dt>
              <dd className="font-display font-semibold tabular-nums text-espresso">
                {formatPrice(amount)}
              </dd>
            </div>
          )}
          {reference && (
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="shrink-0 text-sm text-mocha">Order reference</dt>
              <dd className="truncate font-mono text-xs text-espresso">
                {reference}
              </dd>
            </div>
          )}
        </dl>
      )}

      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-caramel px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-caramel-dark"
      >
        Back to shop
      </Link>
    </div>
  );
}
