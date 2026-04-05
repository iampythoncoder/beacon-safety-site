import { supabase } from "./supabaseClient";

export async function getAuthToken() {
  const session = await supabase.auth.getSession();
  return session.data.session?.access_token || "";
}

export async function withAuthHeaders(base?: HeadersInit) {
  const token = await getAuthToken();
  const headers = new Headers(base || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}
