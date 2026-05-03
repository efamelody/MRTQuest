"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, MoveRight, Mail, Loader2 } from "lucide-react";
import { authClient, useSession } from "@/utils/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Redirect to passport if already authenticated
  useEffect(() => {
    if (!isSessionLoading && session?.user) {
      router.push("/passport");
    }
  }, [session, isSessionLoading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/passport",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in with Google"
      );
      setIsLoading(false);
    }
  };

  const handleUsernameSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!username || !password) {
        setError("Username and password are required");
        setIsLoading(false);
        return;
      }

      // Look up email by username
      const emailRes = await fetch("/api/auth/signin-with-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!emailRes.ok) {
        setError("Username not found");
        setIsLoading(false);
        return;
      }

      const { email } = await emailRes.json();

      // Sign in with email and password
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/passport",
      });

      if (error) {
        setError(error.message || "Failed to sign in");
        setIsLoading(false);
        return;
      }

      router.push("/passport");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in"
      );
      setIsLoading(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 p-6 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-slate-600">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 p-6 flex flex-col items-center justify-center">
      
      {/* THE BOARDING PASS */}
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/60">
        
        {/* TOP SECTION: ROUTE */}
        <div className="bg-primary p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <Ticket className="w-8 h-8 opacity-80" />
            <span className="font-brand text-xs uppercase tracking-widest opacity-80">
              Official Boarding Pass
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase opacity-70">From</p>
              <h2 className="text-3xl font-brand">GUEST</h2>
            </div>
            <MoveRight className="w-8 h-8 text-accent animate-pulse" />
            <div className="text-right">
              <p className="text-[10px] uppercase opacity-70">To</p>
              <h2 className="text-3xl font-brand">QUESTER</h2>
            </div>
          </div>
        </div>

        {/* THE PERFORATION LINE */}
        <div className="relative h-6 bg-white flex items-center justify-center">
          <div className="absolute -left-3 w-6 h-6 bg-purple-50 rounded-full shadow-inner" />
          <div className="w-full border-t-2 border-dashed border-slate-100 mx-4" />
          <div className="absolute -right-3 w-6 h-6 bg-purple-50 rounded-full shadow-inner" />
        </div>

        {/* MIDDLE SECTION: LOGIN OPTIONS */}
        <div className="p-8 pt-4">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-heading mb-2">
              Identify Yourself
            </h3>
            <p className="text-sm text-slate-500 font-sans">
              Every explorer needs a permit. Choose your method to begin the
              journey.
            </p>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* SIGNIN FORM */}
          <form onSubmit={handleUsernameSignIn} className="space-y-3 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
                className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                className="w-full mt-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-500">or</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* GOOGLE LOGIN */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              Continue with Google
            </button>

            {/* SIGNUP WITH USERNAME */}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95 shadow-lg"
            >
              <Mail className="w-5 h-5" />
              New? Sign up with Username
            </button>
          </div>
        </div>

        {/* BOTTOM SECTION: THE STUB */}
        <div className="bg-slate-50 p-6 flex flex-col items-center border-t border-slate-100">
          {/* Faux Barcode */}
          <div className="w-full h-12 flex gap-1 items-center justify-center opacity-40">
            {[1, 4, 2, 8, 1, 6, 3, 2, 5, 2, 8, 4, 1].map((h, i) => (
              <div
                key={i}
                className="bg-black w-1 rounded-full"
                style={{ height: `${h * 10}%` }}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-tighter">
            MRTQ-7782-KL-2026
          </p>
        </div>

      </div>

      {/* BACK BUTTON */}
      <button
        onClick={() => router.push("/")}
        className="mt-8 text-slate-500 font-bold text-sm hover:text-primary transition-colors"
      >
        Maybe later, I'm just looking
      </button>

    </div>
  );
}