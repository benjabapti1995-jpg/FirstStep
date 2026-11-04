import { requireUser } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { PRO_PRICE_LABEL } from "@/lib/plans";
import { stripeConfigured } from "@/lib/stripe";

export const metadata = { title: "Plan — FirstStep" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  const { status } = await searchParams;
  const pro = user.plan === "pro";
  const canBill = stripeConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Your plan</h1>
        <p className="mt-1 text-muted">
          You&apos;re on <span className="font-semibold text-ink">{pro ? "Pro" : "Free"}</span>.
        </p>
      </div>

      {status === "success" && (
        <p role="status" className="rounded-lg bg-calm-soft px-4 py-3 text-sm text-calm">
          Payment received — Pro unlocks as soon as Stripe confirms (usually a few seconds). Refresh if it hasn&apos;t yet.
        </p>
      )}
      {status === "cancelled" && (
        <p role="status" className="rounded-lg bg-surface-2 px-4 py-3 text-sm">No worries — nothing was charged.</p>
      )}

      <div className="card p-6">
        <h2 className="font-semibold">Pro — {PRO_PRICE_LABEL}</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li>✦ AI first steps tailored to your exact task{!aiConfigured() && <span className="text-muted"> (needs ANTHROPIC_API_KEY on the server)</span>}</li>
          <li>✦ Unlimited parking lot</li>
          <li>✦ Full wins history, forever</li>
        </ul>

        <div className="mt-6">
          {!canBill ? (
            <p className="rounded-lg bg-surface-2 px-4 py-3 text-sm text-muted">
              Payments aren&apos;t set up on this server yet. The owner needs to add <code>STRIPE_SECRET_KEY</code>,{" "}
              <code>STRIPE_PRICE_ID</code> and <code>STRIPE_WEBHOOK_SECRET</code> to <code>.env.local</code>.
            </p>
          ) : pro ? (
            <form action="/api/stripe/portal" method="post">
              <button className="btn btn-ghost">Manage or cancel subscription</button>
            </form>
          ) : (
            <form action="/api/stripe/checkout" method="post">
              <button className="btn btn-primary btn-lg">Upgrade to Pro</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
