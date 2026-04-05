import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  derivePlanForSubscriptionStatus,
  getProfileByStripeCustomerId,
  patchProfileByCustomerId,
  upsertProfile
} from "../../../../lib/billing";
import { getStripeServerClient, getStripeWebhookSecret } from "../../../../lib/stripe";

export const runtime = "nodejs";

async function applySubscriptionState(params: {
  customerId: string;
  subscriptionId: string | null;
  status: string;
  userIdHint?: string | null;
}) {
  const { customerId, subscriptionId, status, userIdHint } = params;
  const existing = await getProfileByStripeCustomerId(customerId);
  const plan = derivePlanForSubscriptionStatus(status, existing?.plan || "free");

  if (existing?.id) {
    await patchProfileByCustomerId(customerId, {
      stripe_subscription_id: subscriptionId,
      plan,
      plan_status: status
    });
    return;
  }

  if (userIdHint) {
    await upsertProfile(userIdHint, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan,
      plan_status: status
    });
  }
}

async function applyDeletedSubscription(params: {
  customerId: string;
  subscriptionId: string | null;
  userIdHint?: string | null;
}) {
  const { customerId, subscriptionId, userIdHint } = params;
  const existing = await getProfileByStripeCustomerId(customerId);
  if (existing?.id) {
    await patchProfileByCustomerId(customerId, {
      stripe_subscription_id: subscriptionId,
      plan: "free",
      plan_status: "canceled"
    });
    return;
  }
  if (userIdHint) {
    await upsertProfile(userIdHint, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan: "free",
      plan_status: "canceled"
    });
  }
}

export async function POST(req: Request) {
  const stripe = getStripeServerClient();
  const webhookSecret = getStripeWebhookSecret();

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : "";
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        const userIdHint =
          (typeof session.client_reference_id === "string" && session.client_reference_id) ||
          (typeof session.metadata?.supabase_user_id === "string" ? session.metadata?.supabase_user_id : null);

        if (customerId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await applySubscriptionState({
            customerId,
            subscriptionId,
            status: subscription.status,
            userIdHint
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : "";
        const userIdHint =
          typeof subscription.metadata?.supabase_user_id === "string"
            ? subscription.metadata.supabase_user_id
            : null;
        if (customerId) {
          await applySubscriptionState({
            customerId,
            subscriptionId: subscription.id,
            status: subscription.status,
            userIdHint
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : "";
        const userIdHint =
          typeof subscription.metadata?.supabase_user_id === "string"
            ? subscription.metadata.supabase_user_id
            : null;
        if (customerId) {
          await applyDeletedSubscription({
            customerId,
            subscriptionId: subscription.id,
            userIdHint
          });
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : "";
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
        if (customerId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await applySubscriptionState({
            customerId,
            subscriptionId,
            status: subscription.status
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : "";
        if (customerId) {
          const existing = await getProfileByStripeCustomerId(customerId);
          if (existing?.id) {
            await patchProfileByCustomerId(customerId, {
              plan: existing.plan || "free",
              plan_status: "past_due"
            });
          }
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Stripe webhook handling failed" }, { status: 500 });
  }
}
