import { NextResponse } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const authClient =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    : null;

function bearerFromRequest(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

export async function requireAuthenticatedUser(req: Request): Promise<
  | { user: User; accessToken: string }
  | { error: NextResponse }
> {
  if (!authClient) {
    return {
      error: NextResponse.json({ error: "Supabase auth env vars are not configured" }, { status: 500 })
    };
  }

  const accessToken = bearerFromRequest(req);
  if (!accessToken) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data, error } = await authClient.auth.getUser(accessToken);
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user: data.user, accessToken };
}
