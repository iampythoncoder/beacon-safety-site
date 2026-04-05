import { NextResponse } from "next/server";
import { getProfileByUserId, planStatusIsProEligible, upsertProfile } from "./billing";
import { requireAuthenticatedUser } from "./serverAuth";

export async function requireProEntitlement(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if ("error" in auth) return { error: auth.error };

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
  if (!planStatusIsProEligible(plan, planStatus)) {
    return {
      error: NextResponse.json(
        {
          error: "LaunchLab Pro required",
          code: "PRO_REQUIRED",
          upgrade_url: "/upgrade",
          plan,
          plan_status: planStatus
        },
        { status: 402 }
      )
    };
  }

  return { user: auth.user, profile };
}
