"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Mail, Lock, Users, User, LogOut } from "lucide-react";
import { getSupabaseClient } from "@/app/lib/supabase";

interface Membership {
  id: string;
  name: string;
  role: "member" | "treasurer";
  group_id: string;
  groupName: string;
  groupType: "savings" | "agricultural" | "sacco";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();

  const [step, setStep] = useState<"login" | "register" | "select_group">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For registration
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [memberships, setMemberships] = useState<Membership[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message);
        setIsSubmitting(false);
        return;
      }

      const userEmail = authData.user?.email;
      if (!userEmail) {
        setError("Could not resolve authenticated user email.");
        setIsSubmitting(false);
        return;
      }

      await checkMemberships(userEmail);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email.trim() || !password.trim() || !name.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Account created successfully!");
      
      const userEmail = authData.user?.email || email.trim();
      
      // Auto-query memberships if signed in immediately, otherwise prompt them to sign in
      if (authData.session) {
        await checkMemberships(userEmail);
      } else {
        setStep("login");
        setSuccessMessage("Account created! Please sign in with your password.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during sign up.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkMemberships = async (userEmail: string) => {
    try {
      // Query memberships associated with this email
      const { data: dbMembers, error: dbError } = await supabase
        .from("members")
        .select(`
          id,
          name,
          role,
          group_id,
          groups (
            name,
            type
          )
        `)
        .eq("email", userEmail.toLowerCase().trim());

      if (dbError) {
        console.error("Database query failed:", dbError);
        setError("Could not retrieve membership records.");
        return;
      }

      if (!dbMembers || dbMembers.length === 0) {
        // Logged in but not in any database groups
        setError("This account is not yet registered in any savings circle or cooperative. Please ask your group treasurer to add your email, or create a new circle.");
        return;
      }

      // Format membership items
      const userMemberships: Membership[] = dbMembers.map((m: any) => ({
        id: m.id,
        name: m.name,
        role: m.role as "member" | "treasurer",
        group_id: m.group_id,
        groupName: m.groups?.name || "Unknown Circle",
        groupType: m.groups?.type || "savings",
      }));

      setMemberships(userMemberships);

      // Routing logic
      if (userMemberships.length === 1) {
        const mem = userMemberships[0];
        if (mem.role === "treasurer") {
          router.push(`/dashboard?id=${mem.group_id}`);
        } else {
          router.push(`/member-dashboard?id=${mem.id}&email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(mem.name)}`);
        }
      } else {
        // Multiple memberships: show selection screen
        setStep("select_group");
      }
    } catch (err: any) {
      setError("Failed to resolve circle membership: " + err.message);
    }
  };

  const handleSelectGroup = (mem: Membership) => {
    const userEmail = email || memberships[0]?.groupName; // fallback safety
    if (mem.role === "treasurer") {
      router.push(`/dashboard?id=${mem.group_id}`);
    } else {
      router.push(`/member-dashboard?id=${mem.id}&email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(mem.name)}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setError("");
    setSuccessMessage("");
    setMemberships([]);
    setStep("login");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-between font-sans">
      
      {/* Header */}
      <header className="h-20 border-b border-[#EBEBEB] bg-white flex items-center shrink-0 z-20 shadow-xs">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-1.5 group w-fit">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0070BA] text-white shadow-sm font-display text-lg font-bold tracking-tight">
              s
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight text-[#001C3D]">
              sa<span className="text-[#0070BA] font-bold">vora</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#EBEBEB] shadow-2xl rounded-3xl p-8 sm:p-10 space-y-6">
          
          {step === "login" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-display font-extrabold text-[#001C3D] tracking-tight">
                  Sign In to Savora
                </h1>
                <p className="text-xs text-[#545658] font-light leading-relaxed">
                  Enter your credentials to access your cooperative or savings dashboard.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-100 font-medium">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 text-green-700 text-xs p-3.5 rounded-xl border border-green-100 font-medium">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-email" className="text-xs font-bold text-[#545658]">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="email"
                      id="login-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mwansa@example.com"
                      className="w-full border border-[#EBEBEB] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-password" className="text-xs font-bold text-[#545658]">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <Lock className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="password"
                      id="login-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-[#EBEBEB] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0070BA] hover:bg-[#005EA6] disabled:bg-gray-300 text-white font-bold text-sm py-3 px-4 rounded-full active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center text-xs">
                <span className="text-[#545658] font-light">Don't have an account? </span>
                <button
                  onClick={() => {
                    setError("");
                    setSuccessMessage("");
                    setStep("register");
                  }}
                  className="text-[#0070BA] font-bold hover:underline"
                >
                  Register Here
                </button>
              </div>
            </div>
          )}

          {step === "register" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-display font-extrabold text-[#001C3D] tracking-tight">
                  Register Account
                </h1>
                <p className="text-xs text-[#545658] font-light leading-relaxed">
                  Create a new Savora credentials profile to get started.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-100 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-name" className="text-xs font-bold text-[#545658]">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="text"
                      id="reg-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Mwansa Kalunga"
                      className="w-full border border-[#EBEBEB] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-email" className="text-xs font-bold text-[#545658]">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="email"
                      id="reg-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mwansa@example.com"
                      className="w-full border border-[#EBEBEB] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reg-password" className="text-xs font-bold text-[#545658]">
                    Create Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <Lock className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="password"
                      id="reg-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full border border-[#EBEBEB] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0070BA] hover:bg-[#005EA6] disabled:bg-gray-300 text-white font-bold text-sm py-3 px-4 rounded-full active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Register Account</span>
                  )}
                </button>
              </form>

              <div className="text-center text-xs">
                <span className="text-[#545658] font-light">Already have an account? </span>
                <button
                  onClick={() => {
                    setError("");
                    setSuccessMessage("");
                    setStep("login");
                  }}
                  className="text-[#0070BA] font-bold hover:underline"
                >
                  Sign In Here
                </button>
              </div>
            </div>
          )}

          {step === "select_group" && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-display font-extrabold text-[#001C3D] tracking-tight">
                  Select Workspace
                </h1>
                <p className="text-xs text-[#545658] font-light leading-relaxed">
                  You are registered in multiple groups. Select which ledger you would like to access.
                </p>
              </div>

              <div className="space-y-3">
                {memberships.map((mem) => (
                  <button
                    key={mem.id}
                    onClick={() => handleSelectGroup(mem)}
                    className="w-full border border-[#EBEBEB] hover:border-[#0070BA] hover:bg-slate-50/50 rounded-2xl p-4 transition-all text-left flex items-center justify-between group active:scale-98 cursor-pointer"
                  >
                    <div className="space-y-1 overflow-hidden pr-2">
                       <p className="text-sm font-bold text-[#001C3D] truncate">{mem.groupName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-[#545658]/70">
                        <span className="capitalize">{mem.groupType} circle</span>
                        <span className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className="capitalize font-semibold text-[#0070BA]">{mem.role}</span>
                      </div>
                    </div>
                    <div className="h-8 w-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-[#0070BA]/10 group-hover:text-[#0070BA] transition-colors shrink-0">
                      {mem.role === "treasurer" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-3 text-center text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out of session</span>
              </button>
            </div>
          )}

          <div className="text-center text-[10px] text-[#545658]/60 flex items-center justify-center gap-1.5 font-mono pt-4 border-t border-[#EBEBEB]">
            <ShieldCheck className="h-4 w-4 text-[#0070BA]" />
            <span>Secure account registration & login • chi-limba verification nodes</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-[#EBEBEB] bg-white flex items-center justify-between px-6 shrink-0 text-[11px] text-[#545658]/60">
        <p>© {new Date().getFullYear()} chi-limba ledger platform.</p>
        <p>Lusaka, Zambia</p>
      </footer>

    </div>
  );
}
