import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { appUrl, getStripe, stripeConfigured } from "@/lib/stripe";

// Form POST from /app/billing → Stripe's hosted billing portal (cancel, update card, invoices).
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/login?next=/app/billing`, 303);
  if (!stripeConfigured() || !user.stripe_customer_id) return NextResponse.redirect(`${appUrl()}/app/billing`, 303);

  const portal = await getStripe().billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${appUrl()}/app/billing`,
  });
  return NextResponse.redirect(portal.url, 303);
}
