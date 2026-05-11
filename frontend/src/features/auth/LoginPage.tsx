import { useState } from "react";

import { supabase } from "../../supabaseClient";
import Logo from "../../components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMsg("Logged in!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMsg("Account created! If email confirmation is on, check your inbox.");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMsg("Enter your email first, then click Forgot password.");
      return;
    }
    setMsg("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:5173",
      });
      if (error) throw error;
      setMsg("Password reset email sent (check your inbox).");
    } catch (err: any) {
      setMsg(err?.message ?? "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size={80} className="rounded-2xl shadow-2xl shadow-[#7c5cfc]/30" />
          </div>
          <h1 className="text-4xl font-bold text-[#e8e8ed] mb-2">Task Tutor</h1>
          <p className="text-[#8b8b9e]">Your intelligent study companion</p>
        </div>

        <div className="bg-[#16161e] border border-[#2a2a3a] rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-[#e8e8ed] mb-2 text-center">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-[#8b8b9e] text-center mb-8">
            {mode === "signin"
              ? "Sign in to continue your learning journey"
              : "Sign up to start your learning journey"}
          </p>

          {msg ? (
            <div className="mb-4 rounded-lg border border-[#2a2a3a] bg-[#1c1c27] px-4 py-3 text-sm text-[#e8e8ed]">
              {msg}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#8b8b9e] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#1c1c27] border border-[#2a2a3a] rounded-lg text-[#e8e8ed] placeholder:text-[#5c5c72] focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8b8b9e] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#1c1c27] border border-[#2a2a3a] rounded-lg text-[#e8e8ed] placeholder:text-[#5c5c72] focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1c1c27] text-[#7c5cfc]" />
                <span className="text-[#8b8b9e]">Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[#7c5cfc] hover:text-[#6a4ce0]"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white py-3 rounded-lg transition-colors font-semibold text-base shadow-sm disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-[#8b8b9e] mt-8">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMsg("");
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="text-[#7c5cfc] hover:text-[#6a4ce0] font-medium"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <div className="inline-block bg-[#16161e] border border-[#2a2a3a] rounded-lg px-4 py-2 text-[#8b8b9e] text-sm">
            Supabase Auth is live -- use a real email/password now
          </div>
        </div>
      </div>
    </div>
  );
}
