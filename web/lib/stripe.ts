import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SK || "";

if (!STRIPE_SECRET_KEY) {
  console.warn("Missing Stripe secret key. Set STRIPE_SECRET_KEY in env.");
}

let stripeClient: Stripe | null = null;

export function getStripeServerClient() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured. Missing STRIPE_SECRET_KEY.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export function getStripePriceIdOptional() {
  return process.env.PRICE_ID || process.env.STRIPE_PRICE_ID || "";
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
  }
  return secret;
}
