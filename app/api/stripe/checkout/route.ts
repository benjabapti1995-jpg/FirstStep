import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUrl, getStripe, stripeConfigured } from "@/lib/stripe";

// Form POST from /app/billing → redirect to Stripe Checkout.
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/login?next=/app/billing`, 303);
  if (!stripeConfigured()) return NextResponse.redirect(`${appUrl()}/app/billing`, 303);
  if (user.plan === "pro") return NextResponse.redirect(`${appUrl()}/app/billing`, 303);

  const stripe = getStripe();
  let customer = user.stripe_customer_id;
  if (!customer) {
    const c = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
    customer = c.id;
    db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").run(customer, user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl()}/app/billing?status=success`,
    cancel_url: `${appUrl()}/app/billing?status=cancelled`,
    allow_promotion_codes: true,
    subscription_data: { metadata: { userId: user.id } },
  });
  return NextResponse.redirect(session.url!, 303);
}
