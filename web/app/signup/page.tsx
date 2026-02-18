"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [session, setSession] = useState<any>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function routeAfterAuth(userId: string) {
    try {
      const statusRes = await fetch(`/api/onboarding/status?user_id=${userId}`);
      if (!statusRes.ok) {
        router.push("/onboarding");
        return;
      }
      const status = await statusRes.json();
      router.push(status?.has_completed_onboarding ? "/overview" : "/onboarding");
    } catch {
      router.push("/onboarding");
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignup() {
    setError("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    try {
      setLoading(true);
      const response = await supabase.auth.signUp({ email, password });
      if (response.error) {
        setError(response.error.message);
        return;
      }
      setConfirmationSent(true);
      const userId = response.data.user?.id;
      const hasSession = Boolean(response.data.session);
      if (hasSession && userId) {
        await routeAfterAuth(userId);
      }
    } catch {
      setError("Signup failed due to a network or auth configuration issue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      routeAfterAuth(session.user.id);
    }
  }, [session]);

  return (
    <main className="gradient-bg min-h-screen px-6 py-16">
      <section className="max-w-xl mx-auto card p-8 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-black/40">LaunchLab</p>
          <h1 className="hero-title mt-3">Create your founder account</h1>
          <p className="text-sm text-black/60 mt-2">You’re 2 minutes away from your personalized startup plan.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-sand/60 p-4 text-xs text-black/60">
            What you get: roadmap, competition matches, plan in minutes.
          </div>
          <div className="rounded-2xl bg-sand/60 p-4 text-xs text-black/60">
            Your data stays private. You can delete your plan anytime.
          </div>
        </div>
        <div className="space-y-3">
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3"
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3"
            placeholder="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="w-full rounded-full bg-ink text-white py-2 disabled:opacity-70" onClick={handleSignup} disabled={loading}>
            {loading ? "Creating account..." : "Start Building My Startup"}
          </button>
          {confirmationSent && (
            <p className="text-xs text-black/60">Confirmation email has been sent.</p>
          )}
          <p className="text-xs text-black/50">Free to start · No experience required · Takes ~5 minutes</p>
          <a className="text-xs text-black/50 underline" href="/login">
            Already have an account? Log in
          </a>
        </div>
      </section>
    </main>
  );
}
