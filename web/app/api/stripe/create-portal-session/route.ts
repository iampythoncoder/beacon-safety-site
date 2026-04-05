import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/serverAuth";
import { getProfileByUserId } from "../../../../lib/billing";
import { getStripeServerClient } from "../../../../lib/stripe";

export const runtime = "nodejs";

function baseUrlFromRequest(req: Request) {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if ("error" in auth) return auth.error;

    const stripe = getStripeServerClient();
    const profile = await getProfileByUserId(auth.user.id);
    let customerId = profile?.stripe_customer_id || null;

    if (!customerId && auth.user.email) {
      const existing = await stripe.customers.list({ email: auth.user.email, limit: 1 });
      customerId = existing.data[0]?.id || null;
    }

    if (!customerId) {
      return NextResponse.json({ error: "No Stripe customer found for this account." }, { status: 400 });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrlFromRequest(req)}/overview`
    });

    return NextResponse.json({ url: portal.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create billing portal session" }, { status: 500 });
  }
}
