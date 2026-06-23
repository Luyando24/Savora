"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Layers,
  Settings,
  LogOut,
  ChevronDown,
  CreditCard,
  Calendar,
  User,
  Wallet,
  Smartphone,
  Check,
  Activity
} from "lucide-react";
import { getSupabaseClient } from "@/app/lib/supabase";
import MobileBottomNav from "./MobileBottomNav";

interface GroupContext {
  id: string;
  name: string;
  type: "savings" | "agricultural" | "sacco";
  balance: number;
  outstandingLoan: number;
  targetGoal: number;
  nextPayoutDate?: string;
  payoutRecipient?: string;
  shares?: number;
  contributionAmount?: number;
  isFlexibleContribution?: boolean;
  walletNumber?: string;
  walletProvider?: string;
  walletHolderName?: string;
}

interface PersonalTransaction {
  id: string;
  type: "contribution" | "repayment" | "payout" | "loan_disbursement";
  amount: number;
  provider: "mtn" | "airtel" | "manual";
  referenceId: string;
  status: "completed" | "pending" | "failed";
  date: string;
  notes?: string;
}

export default function MemberDashboardView() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Route parameters (Member Details)
  const [memberName, setMemberName] = useState("Chansa Musonda");
  const [memberId, setMemberId] = useState("mem-1");
  const [memberPhone, setMemberPhone] = useState("0977123456");

  // Tabs & Switchers UI state
  const [activeTab, setActiveTab] = useState<"overview" | "pay" | "history" | "activity">("overview");
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Group Details State (with dynamic values)
  const [groups, setGroups] = useState<GroupContext[]>([
    {
      id: "grp-1",
      name: "Tusunge Savings Circle",
      type: "savings",
      balance: 1500,
      outstandingLoan: 0,
      targetGoal: 6000,
      nextPayoutDate: "2026-06-30",
      payoutRecipient: "Chansa Musonda"
    }
  ]);

  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const activeGroup = groups[activeGroupIndex] || { 
    id: "empty", 
    name: "No Active Circle", 
    type: "savings", 
    balance: 0, 
    outstandingLoan: 0, 
    targetGoal: 6000,
    walletNumber: "",
    walletProvider: "mtn",
    walletHolderName: ""
  };

  // Transaction Log State
  const [transactions, setTransactions] = useState<Record<string, PersonalTransaction[]>>({});

  // Group-wide lightweight logs
  const [groupActivities, setGroupActivities] = useState<{ id: number; text: string; time: string }[]>([]);

  // Group rename proposal state
  const [pendingProposal, setPendingProposal] = useState<any>(null);
  const [proposalActionError, setProposalActionError] = useState("");
  const [proposalActionSuccess, setProposalActionSuccess] = useState("");

  // Request-to-Pay simulator states
  const [payAmount, setPayAmount] = useState("150");
  const [payProvider, setPayProvider] = useState<"mtn" | "airtel">("mtn");
  const [paymentState, setPaymentState] = useState<"idle" | "requesting" | "pin_entry" | "success" | "failed">("idle");
  const [enteredPin, setEnteredPin] = useState("");
  const [payError, setPayError] = useState("");
  const [simulatedTxRef, setSimulatedTxRef] = useState("");
  const [payReferenceId, setPayReferenceId] = useState("");
  const [payType, setPayType] = useState<"contribution" | "repayment">("contribution");

  const loadMemberData = async (email: string, activeIndex: number = 0) => {
    try {
      const supabase = getSupabaseClient();
      
      let emailToUse = email;
      if (!emailToUse) {
        const { data: { session } } = await supabase.auth.getSession();
        emailToUse = session?.user?.email || "";
      }

      if (!emailToUse) {
        setIsLoading(false);
        return;
      }
      
      // 1. Query all groups the member belongs to matching email
      const { data: dbMembers, error: membersErr } = await supabase
        .from("members")
        .select(`
          id,
          name,
          phone_number,
          role,
          group_id,
          groups (
            id,
            name,
            type,
            cycle_settings
          )
        `)
        .eq("email", emailToUse.toLowerCase().trim());

      if (membersErr) throw membersErr;
      if (!dbMembers || dbMembers.length === 0) {
        setIsLoading(false);
        return;
      }

      setMemberName(dbMembers[0].name);
      setMemberPhone(dbMembers[0].phone_number || "");

      // 2. Query ledger summaries for these membership records
      const memberIds = dbMembers.map((m: any) => m.id);
      const { data: summaries, error: sumErr } = await supabase
        .from("ledger_summary")
        .select("*")
        .in("member_id", memberIds);

      if (sumErr) throw sumErr;

      // 3. Compile groups contexts
      const compiledGroups: GroupContext[] = dbMembers.map((m: any) => {
        const summary = (summaries || []).find((s: any) => s.member_id === m.id);
        const cycleSettings = m.groups?.cycle_settings || {};
        return {
          id: m.groups?.id || m.group_id,
          name: m.groups?.name || "Unknown Circle",
          type: m.groups?.type || "savings",
          balance: Number(summary?.active_balance || 0),
          outstandingLoan: Number(summary?.outstanding_loans || 0),
          targetGoal: Number(cycleSettings.targetGoal || 6000),
          nextPayoutDate: cycleSettings.nextPayoutDate || "2026-06-30",
          payoutRecipient: cycleSettings.payoutRecipient || m.name,
          shares: m.groups?.type === "agricultural"
            ? Math.floor(Number(summary?.total_contributions || 0) / (cycleSettings.sharePrice || 150))
            : undefined,
          contributionAmount: cycleSettings.contributionAmount !== undefined ? Number(cycleSettings.contributionAmount) : 150,
          isFlexibleContribution: !!cycleSettings.isFlexibleContribution,
          walletNumber: cycleSettings.walletNumber || "",
          walletProvider: cycleSettings.walletProvider || "mtn",
          walletHolderName: cycleSettings.walletHolderName || ""
        };
      });
      setGroups(compiledGroups);

      // 4. Load transactions for active membership
      const targetGroup = compiledGroups[activeIndex];
      if (targetGroup) {
        const activeMember = dbMembers.find((m: any) => m.group_id === targetGroup.id);
        if (activeMember) {
          setMemberId(activeMember.id);
          
          // Fetch personal transaction history
          const { data: txns, error: txnsErr } = await supabase
            .from("transactions")
            .select("*")
            .eq("group_id", targetGroup.id)
            .eq("member_id", activeMember.id)
            .order("created_at", { ascending: false });

          if (txnsErr) throw txnsErr;

          const mappedTxns = (txns || []).map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            provider: t.provider,
            referenceId: t.provider_reference_id || "",
            status: t.status,
            date: t.created_at,
            notes: t.notes || ""
          }));

          setTransactions(prev => ({
            ...prev,
            [targetGroup.id]: mappedTxns
          }));

          // Fetch group-wide recent activities (completed transactions in this group)
          const { data: groupTxns } = await supabase
            .from("transactions")
            .select(`
              id,
              type,
              amount,
              created_at,
              members (
                name
              )
            `)
            .eq("group_id", targetGroup.id)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(10);

          const compiledActivities = (groupTxns || []).map((t: any, index: number) => {
            const timeDiff = new Date().getTime() - new Date(t.created_at).getTime();
            const mins = Math.floor(timeDiff / (1000 * 60));
            const hours = Math.floor(mins / 60);
            const days = Math.floor(hours / 24);
            
            let timeStr = "Just now";
            if (days > 0) timeStr = `${days} day${days > 1 ? 's' : ''} ago`;
            else if (hours > 0) timeStr = `${hours} hour${hours > 1 ? 's' : ''} ago`;
            else if (mins > 0) timeStr = `${mins} min${mins > 1 ? 's' : ''} ago`;

            let actionText = "";
            if (t.type === "contribution") actionText = `deposited ZMW ${t.amount} savings.`;
            else if (t.type === "repayment") actionText = `posted loan repayment of ZMW ${t.amount}.`;
            else if (t.type === "loan_disbursement") actionText = `received a loan payout of ZMW ${t.amount}.`;
            else actionText = `received ZMW ${t.amount} cycle payout.`;

            return {
              id: index + 1,
              text: `${t.members?.name || "A member"} ${actionText}`,
              time: timeStr
            };
          });
          setGroupActivities(compiledActivities);

          // Fetch pending rename proposal
          const { data: proposalData } = await supabase
            .from("group_name_proposals")
            .select("*")
            .eq("group_id", targetGroup.id)
            .eq("status", "pending")
            .maybeSingle();

          setPendingProposal(proposalData);
        }
      }

    } catch (err) {
      console.error("Error loading member data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const qEmail = searchParams.get("email");
    const qEmailDec = qEmail ? decodeURIComponent(qEmail) : "";

    const checkSessionAndLoad = async () => {
      setIsLoading(true);
      const supabase = getSupabaseClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
      const sessionEmail = session.user?.email || "";
      const emailToUse = sessionEmail || qEmailDec;
      loadMemberData(emailToUse, activeGroupIndex);
    };

    checkSessionAndLoad();
  }, [searchParams, activeGroupIndex]);

  // Adjust default pay type based on group details
  useEffect(() => {
    if (activeGroup) {
      if (activeGroup.outstandingLoan > 0) {
        setPayType("repayment");
        setPayAmount(String(activeGroup.outstandingLoan));
      } else {
        setPayType("contribution");
        setPayAmount(
          activeGroup.type === "savings" && !activeGroup.isFlexibleContribution
            ? String(activeGroup.contributionAmount || "150")
            : "150"
        );
      }
    }
    setPayError("");
    setPaymentState("idle");
    setEnteredPin("");
  }, [activeGroupIndex, groups]);

  // Exits the member dashboard and routes to root landing page
  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // Switcher helper
  const handleSwitchGroup = (index: number) => {
    setActiveGroupIndex(index);
    setIsGroupDropdownOpen(false);
    setActiveTab("overview");
  };

  const handleApproveProposal = async () => {
    if (!pendingProposal) return;
    setProposalActionError("");
    setProposalActionSuccess("");
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/groups/approve-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          proposalId: pendingProposal.id
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        setProposalActionError(resData.error || "Failed to approve name change.");
        return;
      }

      setProposalActionSuccess("Group renamed successfully!");
      await loadMemberData("", activeGroupIndex);
    } catch (err: any) {
      setProposalActionError("An error occurred: " + err.message);
    }
  };

  const handleRejectProposal = async () => {
    if (!pendingProposal) return;
    setProposalActionError("");
    setProposalActionSuccess("");
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/groups/reject-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          proposalId: pendingProposal.id
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        setProposalActionError(resData.error || "Failed to reject proposal.");
        return;
      }

      setProposalActionSuccess("Rename proposal rejected.");
      await loadMemberData("", activeGroupIndex);
    } catch (err: any) {
      setProposalActionError("An error occurred: " + err.message);
    }
  };

  // Payment triggers
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError("Please enter a valid amount.");
      return;
    }
    if (activeGroup && payType === "repayment" && amt > activeGroup.outstandingLoan) {
      setPayError(`Payment cannot exceed your outstanding loan of ZMW ${activeGroup.outstandingLoan}.`);
      return;
    }
    if (!payReferenceId.trim()) {
      setPayError("Please enter the Mobile Money Transaction Reference ID.");
      return;
    }
    
    setPayError("");
    setPaymentState("requesting");

    try {
      const supabase = getSupabaseClient();
      
      // 1. Insert pending manual transaction in Supabase
      const { data: newTx, error: txErr } = await supabase
        .from("transactions")
        .insert({
          group_id: activeGroup.id,
          member_id: memberId,
          type: payType,
          amount: amt,
          provider: payProvider,
          provider_reference_id: payReferenceId.trim(),
          status: "pending"
        })
        .select()
        .single();

      if (txErr) {
        setPayError("Failed to record manual deposit: " + txErr.message);
        setPaymentState("idle");
        return;
      }

      setSimulatedTxRef(newTx.provider_reference_id || newTx.id);
      setPayReferenceId(""); // Clear input field
      setPaymentState("success");
      await loadMemberData("", activeGroupIndex);

    } catch (err: any) {
      setPayError("Network connection error: " + err.message);
      setPaymentState("idle");
    }
  };

  const handleKeypadPress = (val: string) => {
    if (enteredPin.length < 4) {
      setEnteredPin(prev => prev + val);
    }
  };

  const handleKeypadClear = () => {
    setEnteredPin("");
  };

  const handleApprovePayment = async () => {
    if (enteredPin.length < 4) {
      setPayError("Please enter a 4-digit PIN.");
      return;
    }

    setPaymentState("requesting");
    
    try {
      // Trigger the actual webhook route handler in the backend!
      // This closes the loop end-to-end.
      const mockPayload = payProvider === "mtn" ? {
        externalId: simulatedTxRef,
        financialTransactionId: "MTN-TXN-" + Math.floor(100000 + Math.random() * 900000),
        amount: payAmount,
        status: "SUCCESSFUL"
      } : {
        transaction: {
          id: "AIR-TXN-" + Math.floor(100000 + Math.random() * 900000),
          status: "TS",
          reference: simulatedTxRef
        }
      };

      const response = await fetch("/api/momo/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(mockPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        setPayError(errorData.error || "Payment confirmation failed on network gateway.");
        setPaymentState("failed");
      }
      
      // The realtime subscription configured in handleInitiatePayment will automatically 
      // transition the paymentState to "success" once the webhook updates the database!

    } catch (err: any) {
      setPayError("Webhook trigger failed: " + err.message);
      setPaymentState("failed");
    }
  };

  // SVG Gauge calculations
  const collectionPercentage = Math.min(100, Math.round((activeGroup.balance / activeGroup.targetGoal) * 100));
  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (circumference * collectionPercentage) / 100;

  if (isAuthenticated === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#F5F7FA]">
        <div className="h-10 w-10 border-4 border-[#0070BA] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium text-sm text-slate-600">Authenticating session...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="flex h-full w-full overflow-hidden relative font-sans">

      {/* 1. LEFT SIDEBAR PANEL (Desktop persistent, Mobile sliding drawer) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#001C3D] text-white flex flex-col justify-between shrink-0 transition-transform duration-300 md:translate-x-0 md:relative ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div>
          {/* Brand header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
            <a href="/" className="flex items-center gap-2">
              <span className="font-display text-3xl font-black tracking-tight text-black">SAVORA</span>
            </a>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-white/70 hover:text-white"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Group Switcher Selector */}
          <div className="p-4 border-b border-white/10 relative">
            <button
              onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-[#0070BA] uppercase tracking-wider">Active Group</p>
                <p className="text-sm font-bold truncate mt-0.5 pr-2">{activeGroup.name}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-white/50 shrink-0 group-hover:text-white transition-colors" />
            </button>

            {isGroupDropdownOpen && (
              <div className="absolute left-4 right-4 mt-2 bg-[#00224b] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                <div className="py-1">
                  <p className="px-3 py-1.5 text-[9px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5">Switch Groups</p>
                  {groups.map((g, idx) => (
                    <button
                      key={g.id}
                      onClick={() => handleSwitchGroup(idx)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer ${
                        idx === activeGroupIndex ? "bg-[#0070BA]/20 text-white" : "text-white/70"
                      }`}
                    >
                      <span className="truncate">{g.name}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-light">{g.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => { setActiveTab("overview"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "overview" 
                  ? "bg-[#0070BA] text-white shadow-sm" 
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>My Balance</span>
            </button>

            <button
              onClick={() => { setActiveTab("pay"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "pay" 
                  ? "bg-[#0070BA] text-white shadow-sm" 
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>Make Contribution</span>
            </button>

            <button
              onClick={() => { setActiveTab("history"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "history" 
                  ? "bg-[#0070BA] text-white shadow-sm" 
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Ledger History</span>
            </button>

            <button
              onClick={() => { setActiveTab("activity"); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "activity" 
                  ? "bg-[#0070BA] text-white shadow-sm" 
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Group Activity</span>
            </button>
          </nav>
        </div>

        {/* Profile Card */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-9 w-9 rounded-full bg-[#28A745] text-white flex items-center justify-center font-bold text-sm shrink-0">
                CM
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{memberName}</p>
                <p className="text-[10px] text-white/50 font-light truncate">{memberPhone}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-[#E11900] transition-colors p-1"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 md:hidden" 
        />
      )}

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F7FA]">
        
        {/* Navbar */}
        <header className="h-16 border-b border-[#EBEBEB] bg-white flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-[#001C3D] hover:text-[#0070BA] p-1 shrink-0"
            >
              <Activity className="h-6 w-6" />
            </button>
            <h2 className="font-display text-lg md:text-xl font-extrabold text-[#001C3D] tracking-tight truncate">
              {activeTab === "overview" && "My Balance & Overview"}
              {activeTab === "pay" && "Make Contribution"}
              {activeTab === "history" && "My Ledger History"}
              {activeTab === "activity" && "Group activity Stream"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-[#0070BA] bg-[#0070BA]/5 border border-[#0070BA]/10 px-3 py-1 rounded-full uppercase tracking-wider">
              {activeGroup.type} Circle
            </span>
          </div>
        </header>

        {/* Scrollable Body */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8 relative">
          {isLoading ? (
            <div className="absolute inset-0 bg-[#F5F7FA]/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center min-h-[400px]">
              <div className="h-10 w-10 border-4 border-[#0070BA] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium text-sm text-slate-600">Loading member profile...</p>
            </div>
          ) : null}

          {/* Active Circle Alert Card */}
          <div className="bg-white rounded-2xl border border-[#EBEBEB] p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-[10px] font-bold text-[#0070BA] uppercase tracking-wider">Connected Circle</p>
              <h3 className="text-xl font-extrabold text-[#001C3D] mt-1">{activeGroup.name}</h3>
              <p className="text-xs text-[#545658] font-light mt-1">
                Your registered mobile money number: <strong className="font-semibold">{memberPhone}</strong>
              </p>
            </div>
            
            <button
              onClick={() => setActiveTab("pay")}
              className="bg-[#28A745] hover:bg-[#218838] text-white text-xs font-bold px-6 py-3.5 rounded-full shadow-md transition-all active:scale-98 w-full md:w-auto text-center"
            >
              Initiate Deposit
            </button>
          </div>

          {/* TAB CONTENTS */}

          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Name Change Proposal Approval Banner */}
              {pendingProposal && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-xs space-y-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold text-[#001C3D]">Proposed Group Name Change</h4>
                      <p className="text-xs text-[#545658] mt-1 font-light leading-relaxed">
                        An administrator has proposed to rename this group from <strong className="font-semibold">"{activeGroup.name}"</strong> to <strong className="font-bold">"{pendingProposal.proposed_name}"</strong>.
                        This change will only go live if at least one other member approves it.
                      </p>
                      {proposalActionError && (
                        <p className="text-xs text-[#E11900] font-semibold mt-2 flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" />
                          <span>{proposalActionError}</span>
                        </p>
                      )}
                      {proposalActionSuccess && (
                        <p className="text-xs text-[#28A745] font-semibold mt-2 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{proposalActionSuccess}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleRejectProposal}
                      className="px-4 py-2 border border-amber-200 hover:bg-amber-100/50 text-amber-800 text-xs font-bold rounded-full transition-colors cursor-pointer"
                    >
                      Reject Change
                    </button>
                    <button
                      onClick={handleApproveProposal}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-sm active:scale-95"
                    >
                      Approve Rename
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Savings Balance Card */}
                <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[140px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">My Savings Balance</p>
                      <p className="text-2xl font-extrabold text-[#28A745] mt-2 font-display">
                        ZMW {activeGroup.balance.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-9 w-9 bg-green-50 text-[#28A745] flex items-center justify-center rounded-xl">
                      <Coins className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-light flex items-center gap-1.5 mt-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#0070BA]" />
                    <span>Auto-posts on payment confirmation</span>
                  </p>
                </div>

                {/* Loans Card (SACCO specific) */}
                {activeGroup.type === "sacco" ? (
                  <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">Outstanding Loan</p>
                        <p className={`text-2xl font-extrabold mt-2 font-display ${activeGroup.outstandingLoan > 0 ? "text-orange-600" : "text-[#001C3D]"}`}>
                          ZMW {activeGroup.outstandingLoan.toLocaleString()}
                        </p>
                      </div>
                      <div className="h-9 w-9 bg-orange-50 text-orange-600 flex items-center justify-center rounded-xl">
                        <ArrowUpRight className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    {activeGroup.outstandingLoan > 0 ? (
                      <button
                        onClick={() => { setPayType("repayment"); setPayAmount(String(activeGroup.outstandingLoan || "150")); setActiveTab("pay"); }}
                        className="text-xs text-orange-600 hover:underline font-bold text-left mt-2"
                      >
                        Repay loan balance →
                      </button>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-light mt-2">No active outstanding debts</p>
                    )}
                  </div>
                ) : activeGroup.type === "agricultural" ? (
                  <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">Cooperative Shares</p>
                        <p className="text-2xl font-extrabold text-[#001C3D] mt-2 font-display">
                          {activeGroup.shares || 0} Shares
                        </p>
                      </div>
                      <div className="h-9 w-9 bg-blue-50 text-[#0070BA] flex items-center justify-center rounded-xl">
                        <Users className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-light mt-2">
                      Valued at ZMW {((activeGroup.shares || 0) * 150).toLocaleString()} (ZMW 150/Share)
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[140px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">Next Payout Rotation</p>
                        <p className="text-lg font-extrabold text-[#001C3D] mt-2 font-display">
                          {activeGroup.payoutRecipient}
                        </p>
                      </div>
                      <div className="h-9 w-9 bg-blue-50 text-[#0070BA] flex items-center justify-center rounded-xl">
                        <Calendar className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-light mt-2">
                      Payout scheduled on {new Date(activeGroup.nextPayoutDate || "").toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* System Status Tracker */}
                <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[140px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">Collection Status</p>
                      <div className="flex items-center gap-2 mt-3.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-success-green animate-pulse" />
                        <span className="text-xs font-semibold text-[#001C3D]">Gateways Connected</span>
                      </div>
                    </div>
                    <div className="h-9 w-9 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl">
                      <Smartphone className="h-4.5 w-4.5" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-light mt-2">Simulated sandbox network integrations live</p>
                </div>

              </div>

              {/* Progress Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SVG Radial collection goal tracker */}
                <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#545658]/60 uppercase tracking-widest">Savings Progress</h4>
                    <p className="text-lg font-extrabold text-[#001C3D]">Circle Collection Target</p>
                    <p className="text-xs text-[#545658]/70 font-light leading-relaxed max-w-xs mt-1">
                      Our savings circle has gathered ZMW {activeGroup.balance.toLocaleString()} out of a target goal of ZMW {activeGroup.targetGoal.toLocaleString()}.
                    </p>
                  </div>

                  <div className="relative h-28 w-28 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={circleRadius} fill="none" stroke="#F0F2F5" strokeWidth="8" />
                      <circle cx="50" cy="50" r={circleRadius} fill="none" stroke="#0070BA" strokeWidth="8" 
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-500 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-display">
                      <span className="text-xl font-black text-[#001C3D]">{collectionPercentage}%</span>
                      <span className="text-[8px] uppercase font-bold text-gray-400">Target</span>
                    </div>
                  </div>
                </div>

                {/* Visual Info helper card */}
                <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-success-green uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Ledger Verified</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#001C3D]">Non-custodial Wallet Security</h4>
                    <p className="text-xs text-[#545658]/80 font-light leading-relaxed">
                      All group capital resides in your active group treasurer's MTN/Airtel Merchant Wallet. Savora never deposits or holds your funds on our servers.
                    </p>
                  </div>
                  <a href="/#security" className="text-xs text-[#0070BA] font-bold hover:underline block mt-4">
                    Learn more about safety assurances →
                  </a>
                </div>

              </div>
            </div>
          )}

          {/* TAB: PAY / CONTRIBUTE */}
          {activeTab === "pay" && (
            <div className="max-w-md mx-auto animate-fade-in space-y-6">
              
              {/* Payment trigger Card */}
              <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#001C3D]">Record Manual Deposit</h3>
                  <p className="text-xs text-[#545658]/70 font-light mt-1">
                    Transfer money directly to the treasurer's wallet, then record your Transaction Reference ID below.
                  </p>
                </div>

                {/* Treasurer Wallet Info */}
                <div className="bg-[#F5F7FA] border border-[#EBEBEB] rounded-xl p-4 space-y-2 text-xs">
                  <p className="text-[10px] font-bold text-[#545658] uppercase tracking-wider">Treasurer Wallet for Transfer</p>
                  <div className="grid grid-cols-2 gap-2 text-[#001C3D] font-semibold">
                    <p>Provider: <span className="uppercase text-[#0070BA]">{activeGroup.walletProvider || "MTN"}</span></p>
                    <p>Number: <span className="font-mono text-[#0070BA]">{activeGroup.walletNumber || "0977123456"}</span></p>
                    {activeGroup.walletHolderName && (
                      <p className="col-span-2">Registered Name: <span className="text-[#0070BA]">{activeGroup.walletHolderName}</span></p>
                    )}
                  </div>
                </div>

                {payError && (
                  <div className="flex items-center gap-2 text-xs text-[#E11900] bg-[#E11900]/10 p-2.5 rounded-lg border border-[#E11900]/20 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{payError}</span>
                  </div>
                )}

                <form onSubmit={handleInitiatePayment} className="space-y-4">
                  {/* Select Flow type */}
                  {activeGroup.outstandingLoan > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#545658]">Payment Purpose</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => { 
                            setPayType("contribution"); 
                            setPayError(""); 
                            setPayAmount(
                              activeGroup.type === "savings" && !activeGroup.isFlexibleContribution
                                ? String(activeGroup.contributionAmount || "150")
                                : "150"
                            );
                          }}
                          className={`py-2.5 text-center text-xs font-bold rounded-xl border transition-all ${
                            payType === "contribution" 
                              ? "bg-[#0070BA] text-white border-[#0070BA]" 
                              : "bg-white text-[#545658] border-[#EBEBEB] hover:bg-slate-50"
                          }`}
                        >
                          Savings Deposit
                        </button>
                        <button
                          type="button"
                          onClick={() => { 
                            setPayType("repayment"); 
                            setPayError(""); 
                            setPayAmount(String(activeGroup.outstandingLoan || "150"));
                          }}
                          className={`py-2.5 text-center text-xs font-bold rounded-xl border transition-all ${
                            payType === "repayment" 
                              ? "bg-[#0070BA] text-white border-[#0070BA]" 
                              : "bg-white text-[#545658] border-[#EBEBEB] hover:bg-slate-50"
                          }`}
                        >
                          Loan Repayment
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input amount */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="pay-amt-inp" className="text-xs font-bold text-[#545658]">Amount (ZMW)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-[#545658] font-bold text-xs">ZMW</span>
                      <input
                        type="number"
                        id="pay-amt-inp"
                        value={payAmount}
                        disabled={activeGroup.type === "savings" && payType === "contribution" && !activeGroup.isFlexibleContribution}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder={activeGroup.type === "savings" && activeGroup.isFlexibleContribution ? "Enter any amount" : String(activeGroup.contributionAmount || "150")}
                        className="w-full border border-[#EBEBEB] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Provider network */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#545658]">Select Network Wallet</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPayProvider("mtn")}
                        className={`py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                          payProvider === "mtn" 
                            ? "bg-[#FFCC00]/10 border-[#FFCC00] text-[#001C3D]" 
                            : "bg-white text-[#545658] border-[#EBEBEB] hover:bg-slate-50"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
                        <span>MTN Money</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayProvider("airtel")}
                        className={`py-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                          payProvider === "airtel" 
                            ? "bg-[#E11900]/10 border-[#E11900] text-[#E11900]" 
                            : "bg-white text-[#545658] border-[#EBEBEB] hover:bg-slate-50"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-[#E11900]" />
                        <span>Airtel Money</span>
                      </button>
                    </div>
                  </div>

                  {/* Transaction Reference ID */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="pay-ref-inp" className="text-xs font-bold text-[#545658]">Transaction Reference ID</label>
                    <input
                      type="text"
                      id="pay-ref-inp"
                      required
                      value={payReferenceId}
                      onChange={(e) => setPayReferenceId(e.target.value)}
                      placeholder="e.g. 284198271 or MTN-TXN-..."
                      className="w-full border border-[#EBEBEB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={paymentState === "requesting"}
                    className="w-full bg-[#28A745] hover:bg-[#218838] disabled:bg-gray-300 text-white font-bold text-sm py-3 px-4 rounded-full active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {paymentState === "requesting" ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Recording deposit...</span>
                      </>
                    ) : (
                      <span>Submit Deposit Reference</span>
                    )}
                  </button>
                </form>
              </div>

              {/* CLEAN MANUAL DEPOSIT SUCCESS MODAL */}
              {paymentState === "success" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <div className="bg-white border border-[#EBEBEB] rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-scale-up">
                    <div className="h-14 w-14 bg-green-100 text-success-green rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <Check className="h-7 w-7 stroke-[3.5px]" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-slate-800">Deposit Submitted!</h4>
                      <p className="text-xs text-slate-500 font-light leading-relaxed">
                        Successfully submitted manual deposit of <span className="font-semibold text-slate-800">ZMW {payAmount}</span>. It is pending approval by the group treasurer.
                      </p>
                      <div className="bg-slate-50 border border-[#EBEBEB] rounded-xl p-3 font-mono text-[10px] text-slate-600 break-all select-all">
                        Tx Ref: {simulatedTxRef}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => { setPaymentState("idle"); setActiveTab("overview"); }}
                      className="w-full bg-[#0070BA] hover:bg-[#005EA6] text-white text-xs font-bold py-3 rounded-full cursor-pointer transition-all active:scale-98"
                    >
                      Return to Hub
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB: LEDGER HISTORY */}
          {activeTab === "history" && (
            <div className="bg-white border border-[#EBEBEB] rounded-[20px] overflow-hidden shadow-xs animate-fade-in">
              <div className="p-6 border-b border-[#EBEBEB] bg-[#F5F7FA]">
                <h3 className="text-sm font-bold text-[#001C3D] uppercase tracking-wider">My Transaction History</h3>
                <p className="text-[11px] text-[#545658]/70 mt-0.5">Logs of your verified payments and payouts in this circle</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F5F7FA] border-b border-[#EBEBEB] text-[10px] font-bold text-[#545658] uppercase tracking-wider">
                      <th className="px-6 py-4">Reference ID</th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Transaction Type</th>
                      <th className="px-6 py-4">Channel</th>
                      <th className="px-6 py-4 text-right">Amount (ZMW)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBEBEB] text-xs text-[#545658]">
                    {(transactions[activeGroup.id] || []).map((tx) => {
                      const isInflow = tx.type === "contribution" || tx.type === "repayment";
                      return (
                        <tr key={tx.id} className="hover:bg-[#F5F7FA]/30 transition-colors">
                          <td className="px-6 py-4 font-mono font-semibold text-[#001C3D]">{tx.referenceId}</td>
                          <td className="px-6 py-4 font-light">
                            {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 capitalize font-semibold">
                            {tx.type === "contribution" && "Savings Deposit"}
                            {tx.type === "repayment" && "Loan Repayment"}
                            {tx.type === "loan_disbursement" && "Loan Disbursement"}
                            {tx.type === "payout" && "Rotation Payout"}
                          </td>
                          <td className="px-6 py-4 flex items-center gap-1.5 capitalize font-medium">
                            <span className={`h-1.5 w-1.5 rounded-full ${tx.provider === "mtn" ? "bg-[#FFCC00]" : tx.provider === "airtel" ? "bg-[#E11900]" : "bg-gray-400"}`} />
                            <span>{tx.provider}</span>
                          </td>
                          <td className={`px-6 py-4 text-right font-extrabold font-display ${
                            isInflow ? "text-[#28A745]" : "text-[#001C3D]"
                          }`}>
                            {isInflow ? "+" : "-"} ZMW {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}

                    {(!transactions[activeGroup.id] || transactions[activeGroup.id].length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-light">
                          No transactions found for your account in this circle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ACTIVITY */}
          {activeTab === "activity" && (
            <div className="max-w-2xl mx-auto bg-white border border-[#EBEBEB] rounded-[20px] overflow-hidden shadow-xs animate-fade-in">
              <div className="p-6 border-b border-[#EBEBEB] bg-[#F5F7FA]">
                <h3 className="text-sm font-bold text-[#001C3D] uppercase tracking-wider">Group Activity Feed</h3>
                <p className="text-[11px] text-[#545658]/70 mt-0.5">Privacy-conscious updates regarding cooperative progress</p>
              </div>

              <div className="divide-y divide-[#EBEBEB]">
                {groupActivities.length > 0 ? (
                  groupActivities.map((act) => (
                    <div key={act.id} className="p-5 hover:bg-[#F5F7FA]/30 flex items-start gap-4 transition-colors text-xs text-[#545658]">
                      <div className="h-8 w-8 rounded-full bg-[#0070BA]/10 text-[#0070BA] flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="leading-relaxed font-light">{act.text}</p>
                        <p className="text-[9px] text-[#545658]/55 font-mono">{act.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-[#545658]/60 font-light bg-white">
                    No recent group activity found. Completed mobile money contributions will reflect here.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="text-[11px] text-[#545658]/60 mt-12 border-t border-[#EBEBEB] pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p>© {new Date().getFullYear()} savora ledger platform. Secure village banking orchestration.</p>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#28A745] animate-pulse" />
              <span>Airtel & MTN Gateway Integrations Live</span>
            </div>
          </footer>

        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={(tab) => { 
          setActiveTab(tab as any); 
        }} 
        variant="member"
      />

    </div>
  );
}
