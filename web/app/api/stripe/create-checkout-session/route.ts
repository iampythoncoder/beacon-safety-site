import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/serverAuth";
import { getProfileByUserId, upsertProfile } from "../../../../lib/billing";
import { getStripePriceIdOptional, getStripeServerClient } from "../../../../lib/stripe";

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

    const { user } = auth;
    const stripe = getStripeServerClient();
    const priceId = getStripePriceIdOptional();
    const baseUrl = baseUrlFromRequest(req);

    let profile = await getProfileByUserId(user.id);
    if (!profile) {
      profile = await upsertProfile(user.id, {
        email: user.email || null,
        plan: "free",
        plan_status: "inactive"
      });
    }

    let customerId = profile.stripe_customer_id || null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;
      profile = await upsertProfile(user.id, {
        email: user.email || null,
        stripe_customer_id: customer.id,
        stripe_subscription_id: profile.stripe_subscription_id || null,
        plan: profile.plan || "free",
        plan_status: profile.plan_status || "inactive"
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "usd",
                recurring: { interval: "month" },
                unit_amount: 500,
                product_data: { name: "LaunchLab Pro" }
              },
              quantity: 1
            }
          ],
      success_url: `${baseUrl}/overview?upgraded=1`,
      cancel_url: `${baseUrl}/upgrade`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { supabase_user_id: user.id }
      }
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create checkout session" }, { status: 500 });
  }
}
