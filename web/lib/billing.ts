import { supabaseServer } from "./supabaseServer";
import { isMissingTableError } from "./legacyRoadmap";

export type ProfileRow = {
  id: string;
  email?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan?: string | null;
  plan_status?: string | null;
  plan_updated_at?: string | null;
};

function fallbackProfile(userId: string, patch?: Partial<ProfileRow> & { email?: string | null }): ProfileRow {
  return {
    id: userId,
    email: patch?.email ?? null,
    stripe_customer_id: patch?.stripe_customer_id ?? null,
    stripe_subscription_id: patch?.stripe_subscription_id ?? null,
    plan: patch?.plan ?? "free",
    plan_status: patch?.plan_status ?? "inactive",
    plan_updated_at: patch?.plan_updated_at ?? new Date().toISOString()
  };
}

export function planStatusIsProEligible(plan: string | null | undefined, planStatus: string | null | undefined) {
  const normalizedPlan = String(plan || "free").toLowerCase();
  const normalizedStatus = String(planStatus || "").toLowerCase();
  return normalizedPlan === "pro" && (normalizedStatus === "active" || normalizedStatus === "trialing");
}

export function derivePlanForSubscriptionStatus(status: string | null | undefined, currentPlan = "free") {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active" || normalized === "trialing") return "pro";
  if (normalized === "canceled" || normalized === "incomplete_expired" || normalized === "unpaid") return "free";
  return currentPlan;
}

export async function getProfileByUserId(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabaseServer.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    if (isMissingTableError(error, "profiles")) {
      return null;
    }
    throw new Error(error.message);
  }
  return (data as ProfileRow | null) || null;
}

export async function getProfileByStripeCustomerId(customerId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabaseServer
    .from("profiles")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error, "profiles")) {
      return null;
    }
    throw new Error(error.message);
  }
  return (data as ProfileRow | null) || null;
}

export async function upsertProfile(
  userId: string,
  patch: Partial<ProfileRow> & { email?: string | null }
): Promise<ProfileRow> {
  const payload: Record<string, any> = {
    id: userId,
    email: patch.email ?? null,
    stripe_customer_id: patch.stripe_customer_id ?? null,
    stripe_subscription_id: patch.stripe_subscription_id ?? null,
    plan: patch.plan ?? "free",
    plan_status: patch.plan_status ?? "inactive",
    plan_updated_at: patch.plan_updated_at ?? new Date().toISOString()
  };

  const { data, error } = await supabaseServer
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error, "profiles")) {
      return fallbackProfile(userId, patch);
    }
    throw new Error(error.message);
  }

  return data as ProfileRow;
}

export async function patchProfileByUserId(userId: string, patch: Partial<ProfileRow>) {
  const { data, error } = await supabaseServer
    .from("profiles")
    .update({
      ...patch,
      plan_updated_at: patch.plan_updated_at ?? new Date().toISOString()
    })
    .eq("id", userId)
    .select("*")
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error, "profiles")) {
      return fallbackProfile(userId, patch);
    }
    throw new Error(error.message);
  }
  return (data as ProfileRow | null) || null;
}

export async function patchProfileByCustomerId(customerId: string, patch: Partial<ProfileRow>) {
  const { data, error } = await supabaseServer
    .from("profiles")
    .update({
      ...patch,
      plan_updated_at: patch.plan_updated_at ?? new Date().toISOString()
    })
    .eq("stripe_customer_id", customerId)
    .select("*")
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error, "profiles")) {
      return null;
    }
    throw new Error(error.message);
  }
  return (data as ProfileRow | null) || null;
}
