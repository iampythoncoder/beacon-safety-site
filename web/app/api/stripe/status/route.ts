import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../lib/serverAuth";
import { getProfileByUserId, planStatusIsProEligible, upsertProfile } from "../../../../lib/billing";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if ("error" in auth) return auth.error;

    let profile = await getProfileByUserId(auth.user.id);
    if (!profile) {
      profile = await upsertProfile(auth.user.id, {
        email: auth.user.email || null,
        plan: "free",
        plan_status: "inactive"
      });
    }

    const plan = (profile.plan || "free").toLowerCase();
    const planStatus = (profile.plan_status || "inactive").toLowerCase();
    return NextResponse.json({
      plan,
      plan_status: planStatus,
      is_pro: planStatusIsProEligible(plan, planStatus),
      stripe_customer_id: profile.stripe_customer_id || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load billing status" }, { status: 500 });
  }
}
