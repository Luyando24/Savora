"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Smartphone, 
  Users, 
  Sprout, 
  Landmark, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight 
} from "lucide-react";

interface GroupInfo {
  name: string;
  type: "savings" | "agricultural" | "sacco";
  location: string;
}

export default function InviteView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupId = searchParams.get("groupId");

  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!groupId) {
      setError("Invalid invitation link: Missing Group ID.");
      setIsLoading(false);
      return;
    }

    const fetchGroupDetails = async () => {
      try {
        const response = await fetch(`/api/groups/details?groupId=${groupId}`);
        const data = await response.json();
        
        if (response.ok) {
          setGroupInfo(data);
        } else {
          setError(data.error || "Failed to load invitation details.");
        }
      } catch (err: any) {
        setError("Connection error: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          groupId,
          name: fullName,
          email,
          password,
          phone
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        setFormError(resData.error || "Failed to join group.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(`Welcome! You have successfully joined ${groupInfo?.name || "the circle"} immediately.`);
      
      // Auto redirect to login page after 3 seconds
      setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(email)}`);
      }, 3000);

    } catch (err: any) {
      setFormError("Network error: " + err.message);
      setIsSubmitting(false);
    }
  };

  const getGroupIcon = () => {
    if (!groupInfo) return <Users className="h-6 w-6 text-[#0070BA]" />;
    switch (groupInfo.type) {
      case "agricultural": return <Sprout className="h-6 w-6 text-success-green" />;
      case "sacco": return <Landmark className="h-6 w-6 text-orange-600" />;
      default: return <Users className="h-6 w-6 text-[#0070BA]" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F7FA]">
        <div className="h-10 w-10 border-4 border-[#0070BA] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium text-sm text-slate-600 font-sans">Verifying invitation credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-between font-sans">
      
      {/* Header */}
      <header className="h-20 border-b border-[#EBEBEB] bg-white flex items-center shrink-0 z-20 shadow-xs">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-1.5 group w-fit">
            <span className="font-display text-3xl font-black tracking-tight text-black">SAVORA</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#EBEBEB] shadow-2xl rounded-3xl p-8 sm:p-10 space-y-6">
          
          {error ? (
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-display font-extrabold text-[#001C3D]">Invitation Error</h1>
              <p className="text-sm text-[#545658] font-light leading-relaxed">{error}</p>
              <Link 
                href="/login"
                className="inline-block bg-[#0070BA] hover:bg-[#005EA6] text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Group Metadata Banner */}
              <div className="bg-slate-50 border border-[#EBEBEB] rounded-2xl p-4 flex items-center gap-4">
                <div className="h-12 w-12 bg-white border border-[#EBEBEB] rounded-xl flex items-center justify-center shrink-0">
                  {getGroupIcon()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold text-[#0070BA] uppercase tracking-wider">Invitation To Join</p>
                  <h2 className="text-base font-extrabold text-[#001C3D] truncate mt-0.5">{groupInfo?.name}</h2>
                  <p className="text-[10px] text-[#545658] font-light capitalize">{groupInfo?.type} Circle • {groupInfo?.location}</p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-xl font-display font-extrabold text-[#001C3D] tracking-tight">
                  Cooperative Registration
                </h1>
                <p className="text-xs text-[#545658] font-light leading-relaxed">
                  Enter your details to create an account and join this group instantly.
                </p>
              </div>

              {formError && (
                <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-100 font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {successMessage ? (
                <div className="bg-green-50 text-green-700 text-xs p-4 rounded-xl border border-green-100 font-bold space-y-2 text-center animate-scale-up">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                  <p>{successMessage}</p>
                  <p className="text-[10px] font-normal text-green-600/80">Redirecting you to log in...</p>
                </div>
              ) : (
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-name" className="text-xs font-bold text-[#545658]">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400">
                        <UserIcon className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="text"
                        id="reg-name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Mwansa Kalunga"
                        className="w-full border border-[#EBEBEB] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-email" className="text-xs font-bold text-[#545658]">
                      Email Address (For Login)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400">
                        <Mail className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="email"
                        id="reg-email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mwansa@example.com"
                        className="w-full border border-[#EBEBEB] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-phone" className="text-xs font-bold text-[#545658]">
                      Mobile Money Number (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400">
                        <Smartphone className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="text"
                        id="reg-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 0977123456"
                        className="w-full border border-[#EBEBEB] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-password" className="text-xs font-bold text-[#545658]">
                      Create Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400">
                        <Lock className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="password"
                        id="reg-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full border border-[#EBEBEB] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0070BA] hover:bg-[#005EA6] disabled:bg-gray-300 text-white font-bold text-sm py-3 px-4 rounded-full active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Join Group Circle</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="text-center text-xs border-t border-[#EBEBEB] pt-4">
                <span className="text-[#545658] font-light">Already have an account? </span>
                <Link href="/login" className="text-[#0070BA] font-bold hover:underline">
                  Sign In Here
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-[#EBEBEB] bg-white flex items-center justify-between px-6 shrink-0 text-[11px] text-[#545658]/60">
        <p>© {new Date().getFullYear()} chi-limba ledger platform.</p>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0070BA]" />
          <span>Airtel & MTN Gateway Integrations Live</span>
        </div>
      </footer>

    </div>
  );
}
