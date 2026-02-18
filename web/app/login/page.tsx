"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

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

  async function handleLogin(event?: React.FormEvent) {
    event?.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    try {
      setLoading(true);
      const response = await supabase.auth.signInWithPassword({ email, password });
      if (response.error) {
        setError(response.error.message);
        return;
      }
      const userId = response.data.user?.id;
      if (!userId) {
        setError("Signed in, but no user session was returned.");
        return;
      }
      await routeAfterAuth(userId);
    } catch {
      setError("Login failed due to a network or auth configuration issue.");
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
        <a className="inline-flex text-xs text-black/55 underline" href="/">
          ← Back to home
        </a>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-black/40">LaunchLab</p>
          <h1 className="hero-title mt-3">Welcome back</h1>
          <p className="text-sm text-black/60 mt-2">Log in to continue your startup journey.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-sand/60 p-4 text-xs text-black/60">
            Continue where you left off with your roadmap.
          </div>
          <div className="rounded-2xl bg-sand/60 p-4 text-xs text-black/60">
            Access your competition matches and mentor notes.
          </div>
        </div>
        <form className="space-y-3" onSubmit={handleLogin}>
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="w-full rounded-full bg-ink text-white py-2 disabled:opacity-70" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
          <a className="text-xs text-black/50 underline" href="/signup">
            Don’t have an account? Sign up
          </a>
          <a className="block text-xs text-black/50 underline" href="/">
            Return to homepage
          </a>
        </form>
      </section>
    </main>
  );
}
