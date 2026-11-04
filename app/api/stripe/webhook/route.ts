import type Stripe from "stripe";
import { json } from "@/lib/api";
import { db, now } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Stripe → us. Keeps users.plan in sync with the subscription status.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return json({ error: "Webhook secret not configured" }, 500);

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig ?? "", secret);
  } catch {
    return json({ error: "Invalid signature" }, 400);
  }

  // Idempotency: Stripe may deliver the same event more than once.
  const seen = db.prepare("INSERT OR IGNORE INTO stripe_events (id, received_at) VALUES (?, ?)").run(event.id, now());
  if (seen.changes === 0) return json({ received: true, duplicate: true });

  const setPlan = (customer: string, plan: "free" | "pro", subscription: string | null) =>
    db.prepare("UPDATE users SET plan = ?, stripe_subscription_id = ? WHERE stripe_customer_id = ?").run(plan, subscription, customer);

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      if (s.mode === "subscription" && typeof s.customer === "string") {
        // Link the customer to the user in case the customer was created elsewhere.
        if (s.client_reference_id) {
          db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ? AND stripe_customer_id IS NULL").run(s.customer, s.client_reference_id);
        }
        setPlan(s.customer, "pro", typeof s.subscription === "string" ? s.subscription : null);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const active = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
      if (typeof sub.customer === "string") setPlan(sub.customer, active && event.type !== "customer.subscription.deleted" ? "pro" : "free", sub.id);
      break;
    }
  }
  return json({ received: true });
}
