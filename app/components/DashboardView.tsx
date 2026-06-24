"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Users, 
  Sprout, 
  Landmark, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Search, 
  Calendar, 
  CreditCard, 
  UserPlus, 
  FileSpreadsheet, 
  TrendingUp, 
  ArrowRight,
  HelpCircle,
  X,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Bell,
  Menu,
  LogOut,
  ChevronDown,
  Layers,
  Activity,
  ShieldCheck,
  Settings,
  ArrowLeft,
  MapPin,
  Printer,
  Clock,
  Check
} from "lucide-react";
import { getSupabaseClient } from "@/app/lib/supabase";
import MobileBottomNav from "./MobileBottomNav";

interface Member {
  id: string;
  name: string;
  phone?: string;
  email: string;
  totalContributed: number;
  balance: number;
  status: "active" | "arrears" | "inactive";
  shares?: number; // Agricultural Coop specific
  outstandingLoan?: number; // SACCO specific
}

interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  type: "contribution" | "loan_disbursement" | "repayment" | "payout" | "adjustment";
  amount: number;
  provider: "mtn" | "airtel" | "manual";
  referenceId: string;
  status: "completed" | "pending" | "failed";
  notes?: string;
  date: string;
}

const initialMembers: Member[] = [
  { id: "mem-1", name: "Chansa Musonda", phone: "0977123456", email: "chansa@example.com", totalContributed: 1500, balance: 1500, status: "active", shares: 10, outstandingLoan: 0 },
  { id: "mem-2", name: "Mwape Phiri", phone: "0966987654", email: "mwape@example.com", totalContributed: 1200, balance: 1200, status: "active", shares: 8, outstandingLoan: 450 },
  { id: "mem-3", name: "Sibongile Zulu", phone: "0955112233", email: "sibongile@example.com", totalContributed: 900, balance: 900, status: "active", shares: 6, outstandingLoan: 0 },
  { id: "mem-4", name: "Kondwelani Banda", phone: "0777445566", email: "kondwelani@example.com", totalContributed: 150, balance: 150, status: "arrears", shares: 1, outstandingLoan: 1200 },
  { id: "mem-5", name: "Mutale Chilufya", phone: "0766223344", email: "mutale@example.com", totalContributed: 1500, balance: 1500, status: "active", shares: 10, outstandingLoan: 0 }
];

const initialTransactions: Transaction[] = [
  { id: "tx-101", memberId: "mem-1", memberName: "Chansa Musonda", type: "contribution", amount: 150, provider: "mtn", referenceId: "MTN-98472-882", status: "completed", date: "2026-06-22T10:15:00Z" },
  { id: "tx-102", memberId: "mem-2", memberName: "Mwape Phiri", type: "contribution", amount: 150, provider: "airtel", referenceId: "AIR-44129-901", status: "completed", date: "2026-06-22T09:30:00Z" },
  { id: "tx-103", memberId: "mem-3", memberName: "Sibongile Zulu", type: "contribution", amount: 150, provider: "mtn", referenceId: "MTN-77213-441", status: "completed", date: "2026-06-21T16:45:00Z" },
  { id: "tx-104", memberId: "mem-1", memberName: "Chansa Musonda", type: "contribution", amount: 150, provider: "mtn", referenceId: "MTN-22119-092", status: "completed", date: "2026-06-21T14:10:00Z" },
  { id: "tx-105", memberId: "mem-5", memberName: "Mutale Chilufya", type: "contribution", amount: 150, provider: "airtel", referenceId: "AIR-88992-113", status: "completed", date: "2026-06-20T11:20:00Z" },
  { id: "tx-106", memberId: "mem-2", memberName: "Mwape Phiri", type: "loan_disbursement", amount: 500, provider: "airtel", referenceId: "AIR-DISB-721", status: "completed", date: "2026-06-15T08:00:00Z" },
  { id: "tx-107", memberId: "mem-2", memberName: "Mwape Phiri", type: "repayment", amount: 50, provider: "airtel", referenceId: "AIR-PAY-003", status: "completed", date: "2026-06-19T09:00:00Z" }
];

export default function DashboardView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Group states
  const [groupName, setGroupName] = useState("Loading Workspace...");
  const [groupType, setGroupType] = useState<"savings" | "agricultural" | "sacco" | "general">("savings");
  const [groupRef, setGroupRef] = useState("");
  const [walletNum, setWalletNum] = useState("");
  const [walletProvider, setWalletProvider] = useState<"mtn" | "airtel">("mtn");
  const [locationName, setLocationName] = useState("Lusaka");
  
  // Dashboard UI state
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "contributions" | "loans" | "cycle">("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Treasurer profile details
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("Group Treasurer");
  
  // Lists
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Action Modals State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  
  // Member Form State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberShares, setNewMemberShares] = useState("1");
  const [memberFormError, setMemberFormError] = useState("");
  
  // Adjustment Form State
  const [adjustMemberId, setAdjustMemberId] = useState("");
  const [adjustType, setAdjustType] = useState<"contribution" | "repayment" | "payout">("contribution");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustFormError, setAdjustFormError] = useState("");

  // Payout / Disburse Loan Form State
  const [loanMemberId, setLoanMemberId] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanFormError, setLoanFormError] = useState("");

  // Search & Filter
  const [memberSearch, setMemberSearch] = useState("");
  
  // Audit View State
  const [auditTarget, setAuditTarget] = useState<"group" | "member">("group");
  const [targetMemberId, setTargetMemberId] = useState("");
  const [targetMemberName, setTargetMemberName] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);

  // Analytics Hover State
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string | number; text: string; time: string }[]>([]);

  // Alternates list for group switcher dropdown
  const [alternateGroups, setAlternateGroups] = useState<{ id: string; name: string; type: string }[]>([]);
  const [groupTargetGoal, setGroupTargetGoal] = useState(6000);
  const [cycleSettings, setCycleSettings] = useState<any>({});

  // Group rename state
  const [pendingProposal, setPendingProposal] = useState<any>(null);
  const [proposedNameInput, setProposedNameInput] = useState("");
  const [proposeError, setProposeError] = useState("");
  const [proposeSuccess, setProposeSuccess] = useState("");
  const [isProposing, setIsProposing] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Group cycle settings edit state
  const [isEditingCycleSettings, setIsEditingCycleSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [editLocation, setEditLocation] = useState("");
  const [editWalletProvider, setEditWalletProvider] = useState<"mtn" | "airtel">("mtn");
  const [editWalletNum, setEditWalletNum] = useState("");
  const [editWalletHolderName, setEditWalletHolderName] = useState("");
  const [editContributionAmount, setEditContributionAmount] = useState("");
  const [editFrequency, setEditFrequency] = useState("");
  const [editRotationMethod, setEditRotationMethod] = useState("");
  const [editSharePrice, setEditSharePrice] = useState("");
  const [editMaxShares, setEditMaxShares] = useState("");
  const [editDividendCycle, setEditDividendCycle] = useState("");
  const [editMinBalanceToBorrow, setEditMinBalanceToBorrow] = useState("");
  const [editInterestRate, setEditInterestRate] = useState("");
  const [editLoanTermMonths, setEditLoanTermMonths] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [editIsFlexibleContribution, setEditIsFlexibleContribution] = useState(false);
  const [editTargetGoal, setEditTargetGoal] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  const loadDashboardData = async (groupId: string) => {
    try {
      const supabase = getSupabaseClient();
      
      // 1. Fetch Group Details
      const { data: currentGroup, error: gErr } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();
        
      if (gErr) throw gErr;

      if (currentGroup) {
        setGroupName(currentGroup.name);
        setGroupType(currentGroup.type);
        setGroupRef(currentGroup.id);
        const settings = currentGroup.cycle_settings || {};
        setCycleSettings(settings);
        setWalletNum(settings.walletNumber || "");
        setWalletProvider(settings.walletProvider || "mtn");
        setLocationName(currentGroup.location || "Lusaka");
      }

      // 2. Fetch Members from ledger_summary view
      const { data: dbMembers, error: membersErr } = await supabase
        .from("ledger_summary")
        .select("*")
        .eq("group_id", groupId);
      if (membersErr) throw membersErr;

      const mappedMembers = (dbMembers || []).map((m: any) => ({
        id: m.member_id,
        name: m.member_name,
        phone: m.phone_number || "",
        email: m.email || "",
        totalContributed: Number(m.total_contributions || 0),
        balance: Number(m.active_balance || 0),
        status: Number(m.outstanding_loans || 0) > 0 ? ("arrears" as const) : ("active" as const),
        shares: currentGroup?.type === "agricultural" 
          ? Math.floor(Number(m.total_contributions || 0) / (currentGroup?.cycle_settings?.sharePrice || 150)) 
          : undefined,
        outstandingLoan: Number(m.outstanding_loans || 0)
      }));
      setMembers(mappedMembers);

      // Calculate dynamic target goal
      const settings = currentGroup?.cycle_settings || {};
      let calculatedGoal = Number(settings.targetGoal || 6000);
      if (currentGroup?.type === "savings") {
        if (settings.targetGoal !== undefined && settings.targetGoal !== null) {
          calculatedGoal = Number(settings.targetGoal);
        } else if (settings.contributionAmount && !settings.isFlexibleContribution) {
          const membersCount = mappedMembers.length || 1;
          calculatedGoal = Number(settings.contributionAmount) * membersCount;
        }
      } else if (currentGroup?.type === "agricultural") {
        if (settings.targetGoal !== undefined && settings.targetGoal !== null) {
          calculatedGoal = Number(settings.targetGoal);
        } else if (settings.sharePrice && settings.maxShares) {
          const membersCount = mappedMembers.length || 1;
          calculatedGoal = Number(settings.sharePrice) * Number(settings.maxShares) * membersCount;
        }
      } else if (currentGroup?.type === "general") {
        calculatedGoal = Number(settings.targetGoal || 5000);
      }
      setGroupTargetGoal(calculatedGoal);

      // 3. Fetch Transactions
      const { data: dbTxns, error: txnsErr } = await supabase
        .from("transactions")
        .select(`
          id,
          member_id,
          type,
          amount,
          provider,
          provider_reference_id,
          status,
          notes,
          created_at,
          members (
            name
          )
        `)
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });
      if (txnsErr) throw txnsErr;

      const mappedTxns: Transaction[] = (dbTxns || []).map((tx: any) => ({
        id: tx.id,
        memberId: tx.member_id,
        memberName: tx.members?.name || "Unknown Member",
        type: tx.type as any,
        amount: Number(tx.amount || 0),
        provider: tx.provider as any,
        referenceId: tx.provider_reference_id || "",
        status: tx.status as any,
        notes: tx.notes || "",
        date: tx.created_at
      }));
      setTransactions(mappedTxns);

      // 4. Generate dynamic notifications
      const recentNotifications = [];
      const completedTxns = mappedTxns.filter(t => t.status === "completed").slice(0, 2);
      completedTxns.forEach((tx) => {
        const timeDiff = new Date().getTime() - new Date(tx.date).getTime();
        const mins = Math.floor(timeDiff / (1000 * 60));
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);
        
        let timeStr = "Just now";
        if (days > 0) timeStr = `${days} day${days > 1 ? 's' : ''} ago`;
        else if (hours > 0) timeStr = `${hours} hour${hours > 1 ? 's' : ''} ago`;
        else if (mins > 0) timeStr = `${mins} min${mins > 1 ? 's' : ''} ago`;

        let actionText = "";
        if (tx.type === "contribution") {
          actionText = `${tx.provider.toUpperCase()} Request-to-Pay of ZMW ${tx.amount} confirmed for ${tx.memberName}.`;
        } else if (tx.type === "repayment") {
          actionText = `Loan repayment of ZMW ${tx.amount} received from ${tx.memberName}.`;
        } else if (tx.type === "loan_disbursement") {
          actionText = `Loan of ZMW ${tx.amount} disbursed to ${tx.memberName}.`;
        } else {
          actionText = `Cycle payout of ZMW ${tx.amount} sent to ${tx.memberName}.`;
        }

        recentNotifications.push({
          id: `tx-noti-${tx.id}`,
          text: actionText,
          time: timeStr
        });
      });

      recentNotifications.push({
        id: "system-audit",
        text: "System Audit: Automated ledger matched mobile money node.",
        time: "1 hour ago"
      });

      if (mappedMembers.length > 0) {
        const lastMember = mappedMembers[mappedMembers.length - 1];
        recentNotifications.push({
          id: `mem-noti-${lastMember.id}`,
          text: `Member ${lastMember.name} registered in ${currentGroup?.location || "Lusaka"} node.`,
          time: "1 day ago"
        });
      }
      setNotifications(recentNotifications);

      // 5. Fetch Pending Rename Proposal
      const { data: proposalData } = await supabase
        .from("group_name_proposals")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "pending")
        .maybeSingle();

      setPendingProposal(proposalData);

    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const queryId = searchParams.get("id");
    const queryTarget = searchParams.get("target");
    const queryMemberId = searchParams.get("memberId");
    const queryMemberName = searchParams.get("memberName");

    if (queryTarget === "member") {
      setIsAuditing(true);
      setAuditTarget("member");
      if (queryMemberId) setTargetMemberId(queryMemberId);
      if (queryMemberName) setTargetMemberName(decodeURIComponent(queryMemberName));
    } else if (queryTarget === "group") {
      setIsAuditing(true);
      setAuditTarget("group");
    } else {
      setIsAuditing(false);
    }

    let isMounted = true;
    let channel: any = null;
    const supabase = getSupabaseClient();

    const checkSessionAndLoad = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (isMounted) {
          setIsAuthenticated(false);
          router.push("/login");
        }
        return;
      }

      if (isMounted) {
        setIsAuthenticated(true);
        const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email;
        setUserName(metaName || "");
      }

      try {
        const { data: userMemberships, error: mbError } = await supabase
          .from("members")
          .select(`
            group_id,
            name,
            role,
            groups (
              id,
              name,
              type
            )
          `)
          .eq("email", session.user.email.toLowerCase().trim());

        if (!mbError && userMemberships && isMounted) {
          const mappedGroups = userMemberships
            .map((m: any) => m.groups)
            .filter((g: any) => g !== null);
          setAlternateGroups(mappedGroups);

          const activeMembership = userMemberships.find((m: any) => m.group_id === queryId) || userMemberships[0];
          if (activeMembership) {
            setUserName(activeMembership.name || "");
            setUserRole(activeMembership.role === "treasurer" ? "Group Treasurer" : "Group Member");
          }

          if (!queryId) {
            if (mappedGroups.length > 0) {
              router.push(`/dashboard?id=${mappedGroups[0].id}`);
              return;
            } else {
              router.push("/create-group");
              return;
            }
          }
        }
      } catch (err) {
        console.error("Error loading user memberships:", err);
      }

      if (!queryId) {
        if (isMounted) setIsLoading(false);
        return;
      }

      if (isMounted) {
        setGroupRef(queryId);
        await loadDashboardData(queryId);
      }

      if (!isMounted) return;

      // Realtime subscription using a unique channel name to prevent cache/subscription race conditions
      channel = supabase
        .channel(`group-transactions-${queryId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transactions",
            filter: `group_id=eq.${queryId}`
          },
          (payload: any) => {
            console.log("Realtime transaction event detected:", payload);
            if (isMounted) {
              loadDashboardData(queryId);
            }
          }
        )
        .subscribe();
    };

    checkSessionAndLoad();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [searchParams]);

  // Financial calculations
  const totalContributionsSum = transactions
    .filter(tx => tx.type === "contribution" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalRepaymentsSum = transactions
    .filter(tx => tx.type === "repayment" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDisbursedSum = transactions
    .filter(tx => tx.type === "loan_disbursement" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalPayoutsSum = transactions
    .filter(tx => tx.type === "payout" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const groupWalletBalance = (totalContributionsSum + totalRepaymentsSum) - (totalDisbursedSum + totalPayoutsSum);

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
    (member.phone && member.phone.includes(memberSearch)) ||
    member.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Audit Trace logic
  const auditedTransactions = transactions.filter(tx => {
    if (auditTarget === "group") {
      return true;
    } else {
      return tx.memberId === targetMemberId;
    }
  });

  const auditInflows = auditedTransactions
    .filter(tx => (tx.type === "contribution" || tx.type === "repayment") && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const auditOutflows = auditedTransactions
    .filter(tx => (tx.type === "loan_disbursement" || tx.type === "payout") && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const auditBalanceTotal = auditInflows - auditOutflows;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberFormError("");
    
    if (!newMemberName.trim()) {
      setMemberFormError("Member name is required.");
      return;
    }

    if (!newMemberEmail.trim()) {
      setMemberFormError("Member email address is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail.trim())) {
      setMemberFormError("Please enter a valid email address.");
      return;
    }

    let formattedPhone = "";
    if (newMemberPhone.trim()) {
      const isZambianPhone = (phone: string) => {
        const cleaned = phone.replace(/[\s\-\(\)\+]+/g, "");
        return /^(097|096|095|077|076|075|057)\d{7}$/.test(cleaned);
      };

      if (!isZambianPhone(newMemberPhone)) {
        setMemberFormError("Please enter a valid 10-digit Zambian phone number or leave it blank.");
        return;
      }
      formattedPhone = newMemberPhone.trim();
    }

    try {
      const supabase = getSupabaseClient();
      const { data: newMem, error: memErr } = await supabase
        .from("members")
        .insert({
          phone_number: formattedPhone || null,
          email: newMemberEmail.toLowerCase().trim(),
          name: newMemberName,
          group_id: groupRef,
          role: "member"
        })
        .select()
        .single();
        
      if (memErr) {
        setMemberFormError("Failed to add member: " + memErr.message);
        return;
      }

      setNewMemberName("");
      setNewMemberPhone("");
      setNewMemberEmail("");
      setNewMemberShares("1");
      setIsMemberModalOpen(false);
      
      // Manually trigger reload since members table is not subscribed
      loadDashboardData(groupRef);
    } catch (err: any) {
      setMemberFormError("An error occurred: " + err.message);
    }
  };

  const handleRecordAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustFormError("");
    
    if (!adjustMemberId) {
      setAdjustFormError("Please select a member.");
      return;
    }
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) {
      setAdjustFormError("Please enter a valid amount.");
      return;
    }
    if (!adjustNotes.trim()) {
      setAdjustFormError("Reason notes are required to document manual overrides.");
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error: txErr } = await supabase
        .from("transactions")
        .insert({
          group_id: groupRef,
          member_id: adjustMemberId,
          type: adjustType,
          amount: amt,
          provider: "manual",
          provider_reference_id: "MAN-ADJ-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
          status: "completed",
          notes: adjustNotes
        });

      if (txErr) {
        setAdjustFormError("Failed to record adjustment: " + txErr.message);
        return;
      }

      setAdjustMemberId("");
      setAdjustAmount("");
      setAdjustNotes("");
      setIsAdjustmentModalOpen(false);
    } catch (err: any) {
      setAdjustFormError("An error occurred: " + err.message);
    }
  };

  const handleDisburseLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoanFormError("");
    
    if (!loanMemberId) {
      setLoanFormError("Please select a member.");
      return;
    }
    const amt = parseFloat(loanAmount);
    if (isNaN(amt) || amt <= 0) {
      setLoanFormError("Please enter a valid amount.");
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error: txErr } = await supabase
        .from("transactions")
        .insert({
          group_id: groupRef,
          member_id: loanMemberId,
          type: "loan_disbursement",
          amount: amt,
          provider: walletProvider,
          provider_reference_id: `${walletProvider.toUpperCase()}-LN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          status: "completed"
        });

      if (txErr) {
        setLoanFormError("Failed to disburse loan: " + txErr.message);
        return;
      }

      setLoanMemberId("");
      setLoanAmount("");
      setIsDisbursementModalOpen(false);
    } catch (err: any) {
      setLoanFormError("An error occurred: " + err.message);
    }
  };

  const triggerTrace = (type: "member" | "group", targetId?: string, targetName?: string) => {
    router.push(
      `/dashboard?id=${groupRef}&target=${type}${targetId ? `&memberId=${targetId}` : ""}${
        targetName ? `&memberName=${encodeURIComponent(targetName)}` : ""
      }`
    );
  };

  const handleBackToDashboard = () => {
    router.push(`/dashboard?id=${groupRef}`);
  };

  const handleProposeRename = async () => {
    setProposeError("");
    setProposeSuccess("");
    if (!proposedNameInput.trim()) {
      setProposeError("Please enter a proposed name.");
      return;
    }
    if (proposedNameInput.trim() === groupName) {
      setProposeError("Proposed name must be different from the current name.");
      return;
    }

    setIsProposing(true);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setProposeError("You must be logged in.");
        return;
      }

      const response = await fetch("/api/groups/rename", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          groupId: groupRef,
          proposedName: proposedNameInput
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        setProposeError(resData.error || "Failed to propose rename.");
        return;
      }

      setProposeSuccess("Rename proposal submitted successfully. Waiting for a member to approve.");
      setProposedNameInput("");
      
      await loadDashboardData(groupRef);
    } catch (err: any) {
      setProposeError("An error occurred: " + err.message);
    } finally {
      setIsProposing(false);
    }
  };

  const handleCancelRename = async (proposalId: string) => {
    setProposeError("");
    setProposeSuccess("");
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
          proposalId
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        setProposeError(resData.error || "Failed to cancel proposal.");
        return;
      }

      setProposeSuccess("Proposal cancelled successfully.");
      await loadDashboardData(groupRef);
    } catch (err: any) {
      setProposeError("An error occurred: " + err.message);
    }
  };

  const handleConfirmTransaction = async (txId: string, newStatus: "completed" | "failed") => {
    try {
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from("transactions")
        .update({ status: newStatus })
        .eq("id", txId);

      if (error) {
        alert("Failed to update transaction: " + error.message);
        return;
      }

      await loadDashboardData(groupRef);
    } catch (err: any) {
      alert("Error confirming transaction: " + err.message);
    }
  };

  const handleCopyInviteLink = () => {
    if (typeof window === "undefined") return;
    const inviteUrl = `${window.location.origin}/invite?groupId=${groupRef}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => {
      setCopiedInvite(false);
    }, 2000);
  };

  const handleStartEditingSettings = () => {
    setSettingsError("");
    setSettingsSuccess("");
    setEditLocation(locationName);
    setEditWalletProvider(walletProvider);
    setEditWalletNum(walletNum);
    setEditWalletHolderName(cycleSettings.walletHolderName || "");
    setEditContributionAmount(String(cycleSettings.contributionAmount !== undefined ? cycleSettings.contributionAmount : (groupType === "general" ? "100" : "150")));
    setEditFrequency(cycleSettings.frequency || "anytime");
    setEditRotationMethod(cycleSettings.rotationMethod || "manual");
    setEditIsFlexibleContribution(!!cycleSettings.isFlexibleContribution);
    setEditTargetGoal(String(cycleSettings.targetGoal !== undefined ? cycleSettings.targetGoal : (groupType === "general" ? "5000" : "6000")));
    setEditSharePrice(String(cycleSettings.sharePrice || "150"));
    setEditMaxShares(String(cycleSettings.maxShares || "10"));
    setEditDividendCycle(cycleSettings.dividendCycle || "seasonal");
    setEditMinBalanceToBorrow(String(cycleSettings.minBalanceToBorrow || "500"));
    setEditInterestRate(String(cycleSettings.interestRate || "5"));
    setEditLoanTermMonths(String(cycleSettings.loanTermMonths || "3"));
    setEditDeadline(cycleSettings.deadline || "");
    setIsEditingCycleSettings(true);
  };

  const handleSaveSettings = async () => {
    setSettingsError("");
    setSettingsSuccess("");
    setIsSavingSettings(true);

    try {
      const supabase = getSupabaseClient();
      
      const updatedCycleSettings = {
        ...cycleSettings,
        walletProvider: editWalletProvider,
        walletNumber: editWalletNum.trim(),
        walletHolderName: editWalletHolderName.trim()
      };

      if (groupType === "savings") {
        updatedCycleSettings.contributionAmount = editIsFlexibleContribution ? 0 : (Number(editContributionAmount) || 150);
        updatedCycleSettings.frequency = editFrequency;
        updatedCycleSettings.rotationMethod = editRotationMethod;
        updatedCycleSettings.isFlexibleContribution = editIsFlexibleContribution;
        updatedCycleSettings.targetGoal = Number(editTargetGoal) || 6000;
      } else if (groupType === "agricultural") {
        updatedCycleSettings.sharePrice = Number(editSharePrice) || 150;
        updatedCycleSettings.maxShares = Number(editMaxShares) || 10;
        updatedCycleSettings.dividendCycle = editDividendCycle;
      } else if (groupType === "sacco") {
        updatedCycleSettings.minBalanceToBorrow = Number(editMinBalanceToBorrow) || 500;
        updatedCycleSettings.interestRate = Number(editInterestRate) || 5;
        updatedCycleSettings.loanTermMonths = Number(editLoanTermMonths) || 3;
      } else if (groupType === "general") {
        updatedCycleSettings.contributionAmount = editIsFlexibleContribution ? 0 : (Number(editContributionAmount) || 100);
        updatedCycleSettings.isFlexibleContribution = editIsFlexibleContribution;
        updatedCycleSettings.targetGoal = Number(editTargetGoal) || 5000;
        updatedCycleSettings.deadline = editDeadline;
      }

      const { error: updateErr } = await supabase
        .from("groups")
        .update({
          location: editLocation.trim(),
          cycle_settings: updatedCycleSettings
        })
        .eq("id", groupRef);

      if (updateErr) {
        setSettingsError("Failed to update specifications: " + updateErr.message);
        return;
      }

      setSettingsSuccess("Specifications updated successfully!");
      setIsEditingCycleSettings(false);
      await loadDashboardData(groupRef);
    } catch (err: any) {
      setSettingsError("An error occurred: " + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleExportCSV = () => {
    if (typeof window === "undefined") return;

    // Generate CSV content
    const headers = ["Reference ID", "Timestamp", "Member", "Flow Type", "Channel", "Note", "Amount (ZMW)"];
    const rows = auditedTransactions.map(tx => {
      const isInflow = tx.type === "contribution" || tx.type === "repayment";
      return [
        tx.referenceId,
        new Date(tx.date).toISOString(),
        tx.memberName,
        tx.type,
        tx.provider,
        tx.notes || "",
        `${isInflow ? "" : "-"}${tx.amount}`
      ];
    });

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `savora_audit_${auditTarget}_${groupRef}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Error logging out:", err);
      window.location.href = "/";
    }
  };

  const switchActiveGroup = (selected: { id: string; name: string; type: string }) => {
    setIsGroupDropdownOpen(false);
    router.push(`/dashboard?id=${selected.id}`);
  };

  // Helper to format tab titles
  const getTabTitle = () => {
    if (isAuditing) {
      return auditTarget === "group" ? "Group Transaction Audit Ledger" : "Individual Member Audit Trace";
    }
    switch (activeTab) {
      case "overview": return "Overview Hub";
      case "members": return "Members Directory";
      case "contributions": return "Mobile Money Audit Logs";
      case "loans": return groupType === "sacco" ? "Loans & Repayments" : "Co-op Share Registry";
      case "cycle": return "Group Settings";
    }
  };

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
    <div className="flex h-full w-full overflow-hidden relative">
      
      {/* 1. LEFT SIDEBAR PANEL (Desktop persistent, Mobile sliding drawer) */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-64 bg-[#001C3D] text-white flex flex-col justify-between shrink-0 transition-transform duration-300 md:translate-x-0 md:relative ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Top: Branding + Switcher */}
        <div className="overflow-y-auto flex-1">
          {/* Brand header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
            <a href="/" className="flex items-center gap-2 group">
              <span className="font-display text-3xl font-black tracking-tight text-black">SAVORA</span>
            </a>
            {/* Mobile close sidebar button */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
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
                <p className="text-sm font-bold truncate mt-0.5 pr-2">{groupName}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-white/50 shrink-0 group-hover:text-white transition-colors" />
            </button>

            {/* Switcher Dropdown list */}
            {isGroupDropdownOpen && (
              <div className="absolute left-4 right-4 mt-2 bg-[#00224b] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                <div className="py-1">
                  <p className="px-3 py-1.5 text-[9px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5">Switch Groups</p>
                  {alternateGroups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => switchActiveGroup(g)}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="truncate">{g.name}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-light">{g.type}</span>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => {
                      setIsGroupDropdownOpen(false);
                      router.push("/create-group");
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#38bdf8] hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer border-t border-white/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create New Group</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => { setActiveTab("overview"); setIsSidebarOpen(false); handleBackToDashboard(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "overview" && !isAuditing
                  ? "bg-[#0070BA] text-white shadow-sm" 
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => { setActiveTab("members"); setIsSidebarOpen(false); handleBackToDashboard(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "members" && !isAuditing
                  ? "bg-[#0070BA] text-white shadow-sm" 
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Members Directory</span>
            </button>

            <button
              onClick={() => { setActiveTab("contributions"); setIsSidebarOpen(false); handleBackToDashboard(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "contributions" && !isAuditing
                  ? "bg-[#0070BA] text-white shadow-sm" 
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>MoMo Live Feed</span>
            </button>

            {groupType !== "savings" && (
              <button
                onClick={() => { setActiveTab("loans"); setIsSidebarOpen(false); handleBackToDashboard(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                  activeTab === "loans" && !isAuditing
                    ? "bg-[#0070BA] text-white shadow-sm" 
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {groupType === "sacco" ? <Landmark className="h-4 w-4" /> : <Sprout className="h-4 w-4" />}
                <span>{groupType === "sacco" ? "Loans & Repayments" : "Co-op Share Registry"}</span>
              </button>
            )}

            <button
              onClick={() => { setActiveTab("cycle"); setIsSidebarOpen(false); handleBackToDashboard(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                activeTab === "cycle" && !isAuditing
                  ? "bg-[#0070BA] text-white shadow-sm" 
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Group Settings</span>
            </button>
          </nav>
        </div>

        {/* Bottom Profile Section */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-9 w-9 rounded-full bg-[#0070BA] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {(() => {
                  const fallback = userName || "MK";
                  return fallback
                    .split(" ")
                    .filter(Boolean)
                    .map(n => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                })()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{userName || "Loading..."}</p>
                <p className="text-[10px] text-white/50 font-light truncate">{userRole}</p>
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[55] md:hidden" 
        />
      )}

      {/* 2. MAIN CONTENT AREA CONTAINER (Top Navbar + Dynamic workspace body) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F7FA]">
        
        {/* Top Workspace Header (Navbar) */}
        <header className="h-16 border-b border-[#EBEBEB] bg-white flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
          
          {/* Left Title & Mobile Menu toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-[#001C3D] hover:text-[#0070BA] p-1 shrink-0"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="font-display text-lg md:text-xl font-extrabold text-[#001C3D] tracking-tight truncate">
              {getTabTitle()}
            </h2>
          </div>

          {/* Right widgets */}
          <div className="flex items-center gap-4">
            
            {/* Provider network lights (Zambian context) */}
            <div className="hidden lg:flex items-center gap-2 bg-[#F5F7FA] border border-[#EBEBEB] px-3.5 py-1.5 rounded-full text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
                <span className="text-[10px] uppercase text-[#545658]">MTN</span>
              </span>
              <span className="h-3 w-px bg-gray-300" />
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#E11900]" />
                <span className="text-[10px] uppercase text-[#545658]">Airtel</span>
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-success-green animate-pulse ml-1" />
            </div>

            {/* Notification bell dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="h-9 w-9 rounded-full border border-[#EBEBEB] flex items-center justify-center text-[#545658] hover:bg-gray-50 active:scale-95 transition-all relative cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#E11900] rounded-full" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-[#EBEBEB] rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-[#EBEBEB] flex justify-between items-center bg-[#F5F7FA]">
                    <span className="text-xs font-bold text-[#001C3D]">System Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="text-xs text-[#0070BA] hover:underline font-bold">Clear</button>
                  </div>
                  <div className="divide-y divide-[#EBEBEB] max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-4 hover:bg-[#F5F7FA]/30 text-xs text-[#545658] space-y-1">
                        <p className="leading-relaxed font-light">{n.text}</p>
                        <p className="text-[9px] text-[#545658]/55">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick action trigger button */}
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#0070BA] hover:bg-[#005EA6] text-white text-xs font-bold px-4 py-2 rounded-full active:scale-95 transition-all shadow-xs"
            >
              <Plus className="h-4.5 w-4.5 stroke-[2.5px]" />
              <span>Register Member</span>
            </button>
          </div>
        </header>

        {/* Dynamic workspace body (Scrollable content pane) */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8 relative">
          {isLoading ? (
            <div className="absolute inset-0 bg-[#F5F7FA]/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center min-h-[400px]">
              <div className="h-10 w-10 border-4 border-[#0070BA] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium text-sm text-slate-600">Loading ledger data...</p>
            </div>
          ) : null}
          
          {isAuditing ? (
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Back button link */}
              <button 
                onClick={handleBackToDashboard}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0070BA] hover:text-[#005EA6] transition-colors cursor-pointer group active:scale-98"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Group Dashboard</span>
              </button>

              {/* Main Audit Sheet Container */}
              <div className="bg-white rounded-3xl border border-[#EBEBEB] shadow-lg overflow-hidden flex flex-col print:border-none print:shadow-none">
                
                {/* Top Header Card */}
                <div className="bg-[#001C3D] text-white p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 shrink-0">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-white bg-[#0070BA] px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Audited Ledger Node
                      </span>
                      <span className="font-mono text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded">
                        Ref: {groupRef}
                      </span>
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Transaction Trace Audit
                    </h1>
                    <p className="text-xs text-white/70 font-light flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#0070BA]" />
                      <span>{groupName} • {locationName}, Zambia</span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center justify-center gap-2 bg-[#0070BA] hover:bg-[#005EA6] text-white text-xs font-bold px-5 py-3 rounded-full active:scale-95 transition-all cursor-pointer print:hidden shadow-sm"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Export CSV Ledger</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold px-5 py-3 rounded-full active:scale-95 transition-all cursor-pointer print:hidden"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print Audit Sheet</span>
                    </button>
                    <div className="bg-[#28A745]/15 border border-[#28A745]/30 rounded-xl p-3 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#28A745] shrink-0" />
                      <div className="text-[10px] leading-tight text-white/90">
                        <p className="font-bold text-[#28A745]">AUDIT VERIFIED</p>
                        <p className="font-light text-white/60">Node matched MoMo logs</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scope overview card */}
                <div className="bg-[#F5F7FA] border-b border-[#EBEBEB] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#545658]/60 uppercase tracking-wider">Audit Target Scope</p>
                    <h3 className="text-lg font-bold text-[#001C3D] mt-1">
                      {auditTarget === "group" ? (
                        "All Group Wallet Ledger Transactions"
                      ) : (
                        `Member Registry Trace: ${targetMemberName}`
                      )}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[#545658]/80 font-light">
                    <Calendar className="h-4 w-4 text-[#0070BA]" />
                    <span>Audit Date: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Table Ledger Panel */}
                <div className="flex-1 overflow-x-auto min-h-[300px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F5F7FA] border-b border-[#EBEBEB] text-[10px] font-bold text-[#545658] uppercase tracking-wider">
                        <th className="px-6 py-4">Reference ID</th>
                        <th className="px-6 py-4">Timestamp</th>
                        {auditTarget === "group" && <th className="px-6 py-4">Member</th>}
                        <th className="px-6 py-4">Flow Type</th>
                        <th className="px-6 py-4">Channel</th>
                        <th className="px-6 py-4">Audit Note / Manual Reason</th>
                        <th className="px-6 py-4 text-right">Flow (ZMW)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBEBEB] text-xs text-[#545658]">
                      {auditedTransactions.map((tx) => {
                        const isInflow = tx.type === "contribution" || tx.type === "repayment";
                        return (
                          <tr key={tx.id} className="hover:bg-[#F5F7FA]/30 transition-colors">
                            <td className="px-6 py-4 font-mono font-semibold text-[#001C3D]">{tx.referenceId}</td>
                            <td className="px-6 py-4 font-light">
                              {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            {auditTarget === "group" && (
                              <td className="px-6 py-4 font-bold text-[#001C3D]">{tx.memberName}</td>
                            )}
                            <td className="px-6 py-4 capitalize font-semibold">
                              {tx.type === "contribution" && "Savings Contribution"}
                              {tx.type === "repayment" && "Loan Repayment"}
                              {tx.type === "loan_disbursement" && "Loan Disbursement"}
                              {tx.type === "payout" && "Rotation Payout"}
                              {tx.type === "adjustment" && "Manual Override"}
                            </td>
                            <td className="px-6 py-4 flex items-center gap-1.5 capitalize font-medium">
                              <span className={`h-1.5 w-1.5 rounded-full ${tx.provider === "mtn" ? "bg-[#FFCC00]" : tx.provider === "airtel" ? "bg-[#E11900]" : "bg-gray-400"}`} />
                              <span>{tx.provider}</span>
                            </td>
                            <td className="px-6 py-4 font-light max-w-xs truncate italic">
                              {tx.notes ? tx.notes : "-"}
                            </td>
                            <td className={`px-6 py-4 text-right font-extrabold font-display ${
                              isInflow ? "text-[#28A745]" : "text-[#001C3D]"
                            }`}>
                              {isInflow ? "+" : "-"} ZMW {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}

                      {auditedTransactions.length === 0 && (
                        <tr>
                          <td colSpan={auditTarget === "group" ? 7 : 6} className="px-6 py-12 text-center text-gray-400 font-light">
                            No transactions found for this scope.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Audit Summing Footer Reconciliation Block */}
                <div className="bg-[#F5F7FA] border-t border-[#EBEBEB] p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    
                    {/* Total Inflows */}
                    <div className="border border-[#EBEBEB] bg-white rounded-xl p-4 flex items-center gap-4">
                      <div className="h-10 w-10 bg-green-50 text-[#28A745] rounded-xl flex items-center justify-center shrink-0">
                        <ArrowDownLeft className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#545658]/60 uppercase tracking-wider">Total Inflows</p>
                        <p className="text-lg font-extrabold text-[#001C3D] font-display mt-0.5">
                          ZMW {auditInflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Total Outflows */}
                    <div className="border border-[#EBEBEB] bg-white rounded-xl p-4 flex items-center gap-4">
                      <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#545658]/60 uppercase tracking-wider">Total Outflows</p>
                        <p className="text-lg font-extrabold text-[#001C3D] font-display mt-0.5">
                          ZMW {auditOutflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Net Reconciled Balance */}
                    <div className="border border-[#28A745]/20 bg-green-50/20 rounded-xl p-4 flex items-center gap-4">
                      <div className="h-10 w-10 bg-[#28A745]/15 text-[#28A745] rounded-xl flex items-center justify-center shrink-0">
                        <Coins className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#28A745] uppercase tracking-wider">Audited Balance</p>
                        <p className="text-xl font-black text-[#28A745] font-display mt-0.5">
                          ZMW {auditBalanceTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Reconciliation status notes */}
                  <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 flex gap-3 text-xs text-[#545658] leading-relaxed">
                    <CheckCircle2 className="h-5 w-5 text-[#28A745] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#001C3D]">Audit Reconciled successfully</p>
                      <p className="mt-0.5 font-light">
                        All listed transaction logs (mobile money Request-to-Pay webhook triggers, disburse API outputs, and treasurer approved manual adjustments) sum exactly to the audited balance. Ledger replication verified against mobile network operator database nodes.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Audit verification tag */}
              <div className="text-center text-[10px] text-[#545658]/55 flex items-center justify-center gap-1.5 font-mono">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0070BA]" />
                <span>Savora Digital Ledger Platform • Cryptographically signed node replication</span>
              </div>

            </div>
          ) : (
            <>
              {/* Header Card (Zambian specific info summary) */}
              <div className="bg-white rounded-2xl border border-[#EBEBEB] p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-[#001C3D]">{groupName} Workspace</h3>
                  <p className="text-xs text-[#545658] font-light flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${walletProvider === "mtn" ? "bg-[#FFCC00]" : "bg-[#E11900]"}`} />
                    <span>Default Mobile Wallet: <strong className="font-semibold capitalize text-[#001C3D]">{walletProvider} MoMo</strong> ({walletNum})</span>
                  </p>
                </div>

                <button 
                  onClick={() => triggerTrace("group", undefined, "All Group Wallet Transactions")}
                  className="bg-[#F5F7FA] hover:bg-gray-100 border border-[#EBEBEB] rounded-xl px-5 py-3.5 text-left w-full md:w-auto min-w-[240px] cursor-pointer transition-all duration-150 relative overflow-hidden group/bal active:scale-98 flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] font-bold text-[#545658]/60 uppercase tracking-wider">Group Wallet Balance</p>
                    <p className="text-xl font-extrabold text-[#001C3D] mt-1 font-display">
                      ZMW {groupWalletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-[#0070BA] bg-white border border-[#EBEBEB] px-2.5 py-1 rounded-full group-hover/bal:bg-[#0070BA] group-hover/bal:text-white transition-all">Audit Ledger</span>
                </button>
              </div>

              {/* TAB CONTENTS (Overview / Registry / Logs / Loans / Settings) */}

              {activeTab === "overview" && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Grid cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-[160px]">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">Total Saving Capital</p>
                          <p className="text-2xl font-extrabold text-[#001C3D] mt-2 font-display">
                            ZMW {totalContributionsSum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="h-9 w-9 bg-green-50 text-success-green flex items-center justify-center rounded-xl">
                          <ArrowDownLeft className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerTrace("group", undefined, "Total Group Saving Deposits")}
                        className="text-xs text-[#0070BA] hover:underline font-bold text-left"
                      >
                        Trace saving deposits →
                      </button>
                    </div>

                    {groupType === "sacco" ? (
                      <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-[160px]">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">Outstanding Loan Volume</p>
                            <p className="text-2xl font-extrabold text-orange-600 mt-2 font-display">
                              ZMW {(totalDisbursedSum - totalRepaymentsSum).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="h-9 w-9 bg-orange-50 text-orange-600 flex items-center justify-center rounded-xl">
                            <ArrowUpRight className="h-4.5 w-4.5" />
                          </div>
                        </div>
                        <p className="text-[11px] text-[#545658]/70 font-light">Calculated from total disbursements minus repayments.</p>
                      </div>
                    ) : groupType === "agricultural" ? (
                      <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-[160px]">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">Cooperative Shares Active</p>
                            <p className="text-2xl font-extrabold text-success-green mt-2 font-display">
                              {members.reduce((sum, m) => sum + (m.shares || 0), 0)} Shares
                            </p>
                          </div>
                          <div className="h-9 w-9 bg-green-50 text-success-green flex items-center justify-center rounded-xl">
                            <Sprout className="h-4.5 w-4.5" />
                          </div>
                        </div>
                        <p className="text-[11px] text-[#545658]/70 font-light">Calculated from the shares registry ledger.</p>
                      </div>
                    ) : (
                      (() => {
                        const paidMemberIds = new Set(
                          transactions
                            .filter(tx => tx.type === "payout" && tx.status === "completed")
                            .map(tx => tx.memberId)
                        );
                        const nextRecipient = members.find(m => !paidMemberIds.has(m.id));
                        const recipientName = nextRecipient ? nextRecipient.name : "Rotation Completed";
                        
                        const freq = cycleSettings.frequency || "weekly";
                        const frequencyText = freq === "weekly" ? "Group rotation runs weekly." : freq === "monthly" ? "Group rotation runs monthly." : `Group rotation runs: ${freq}`;

                        return (
                          <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">Group Rotation</p>
                                <p className="text-lg font-extrabold text-[#001C3D] mt-2 font-display">
                                  Active Rotation
                                </p>
                                <p className="text-xs text-[#545658]/80 font-semibold mt-1">Next: {recipientName}</p>
                              </div>
                              <div className="h-9 w-9 bg-[#0070BA]/10 text-[#0070BA] flex items-center justify-center rounded-xl">
                                <Calendar className="h-4.5 w-4.5" />
                              </div>
                            </div>
                            <p className="text-[11px] text-[#545658]/70 font-light">{frequencyText} Flexible payouts.</p>
                          </div>
                        );
                      })()
                    )}

                    <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-[160px]">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">Payment System Status</p>
                          <div className="flex items-center gap-2 mt-3.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#28A745] animate-pulse" />
                            <span className="text-xs font-semibold text-[#001C3D]">MoMo Gateways Active</span>
                          </div>
                        </div>
                        <div className="h-9 w-9 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl">
                          <CreditCard className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <p className="text-[11px] text-[#545658]/70 font-light">Auto-checking collections on MTN & Airtel Money.</p>
                    </div>
                  </div>

                  {/* Analytics Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* SVG Line / Area Chart: Capital Growth */}
                    <div className="bg-white border border-[#EBEBEB] rounded-[20px] p-6 shadow-xs lg:col-span-2 flex flex-col justify-between relative min-h-[300px]">
                      <div>
                        <h4 className="text-sm font-bold text-[#001C3D] uppercase tracking-wider">Capital Growth Trend</h4>
                        <p className="text-xs text-[#545658]/70 font-light mt-1">Village bank savings accumulated in this group (ZMW)</p>
                      </div>

                      {/* Line chart graphic */}
                      <div className="relative mt-4 flex-1 flex items-end justify-center min-h-[160px]">
                        {(() => {
                          const contributionTxns = [...transactions]
                            .filter(tx => tx.type === "contribution" && tx.status === "completed")
                            .reverse();

                          let runningSum = 0;
                          const actualGrowth = contributionTxns.map(tx => {
                            runningSum += tx.amount;
                            const dateObj = new Date(tx.date);
                            const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                            return {
                              date: formattedDate,
                              amount: runningSum
                            };
                          });

                          const baselineGrowth = actualGrowth.length > 0 ? actualGrowth : [
                            { date: "No data", amount: 0 }
                          ];

                          const maxVal = Math.max(...baselineGrowth.map(d => d.amount), 1000);
                          const chartWidth = 500;
                          const chartHeight = 150;
                          const paddingX = 40;
                          const paddingY = 20;

                          const svgPoints = baselineGrowth.map((d, index) => {
                            const x = baselineGrowth.length > 1 
                              ? paddingX + (index / (baselineGrowth.length - 1)) * (chartWidth - paddingX * 2) 
                              : chartWidth / 2;
                            const y = chartHeight - paddingY - (d.amount / maxVal) * (chartHeight - paddingY * 2);
                            return { x, y, date: d.date, amount: d.amount };
                          });

                          const linePath = svgPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                          const areaPath = `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight - paddingY} L ${svgPoints[0].x} ${chartHeight - paddingY} Z`;

                          return (
                            <svg viewBox="0 0 500 150" className="w-full h-[150px] overflow-visible">
                              <defs>
                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#28A745" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="#28A745" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>

                              {/* Horizontal Grid lines */}
                              <line x1="40" y1="20" x2="460" y2="20" stroke="#F0F2F5" strokeWidth="1" strokeDasharray="4,4" />
                              <line x1="40" y1="80" x2="460" y2="80" stroke="#F0F2F5" strokeWidth="1" strokeDasharray="4,4" />
                              <line x1="40" y1="130" x2="460" y2="130" stroke="#F0F2F5" strokeWidth="1" />

                              {/* Shaded Area under the curve */}
                              <path d={areaPath} fill="url(#areaGradient)" />

                              {/* Line path */}
                              <path d={linePath} fill="none" stroke="#28A745" strokeWidth="3" strokeLinecap="round" />

                              {/* Interactive Dots */}
                              {svgPoints.map((p, index) => (
                                <g key={index} className="cursor-pointer group/dot"
                                   onMouseEnter={() => setHoveredPointIndex(index)}
                                   onMouseLeave={() => setHoveredPointIndex(null)}
                                >
                                  <circle cx={p.x} cy={p.y} r="5" fill="#28A745" stroke="#FFFFFF" strokeWidth="2" className="transition-all duration-150 group-hover/dot:r-7" />
                                  {/* Small invisible hover box for easier targeting */}
                                  <circle cx={p.x} cy={p.y} r="15" fill="transparent" />
                                </g>
                              ))}

                              {/* X-axis labels rendered inside the SVG */}
                              {svgPoints.map((p, index) => {
                                const labelInterval = Math.max(1, Math.ceil(baselineGrowth.length / 5));
                                const showLabel = index === 0 || index === svgPoints.length - 1 || index % labelInterval === 0;
                                if (!showLabel) return null;
                                return (
                                  <text
                                    key={`lbl-${index}`}
                                    x={p.x}
                                    y="145"
                                    textAnchor="middle"
                                    fill="#545658"
                                    opacity="0.75"
                                    style={{ fontSize: "9px", fontFamily: "monospace" }}
                                  >
                                    {p.date}
                                  </text>
                                );
                              })}

                              {/* Tooltip display */}
                              {hoveredPointIndex !== null && svgPoints[hoveredPointIndex] && (
                                <foreignObject 
                                  x={Math.max(10, Math.min(360, svgPoints[hoveredPointIndex].x - 65))} 
                                  y={svgPoints[hoveredPointIndex].y - 65} 
                                  width="130" 
                                  height="55"
                                >
                                  <div className="bg-[#001C3D] text-white p-2 rounded-xl text-[10px] text-center shadow-xl border border-white/10 animate-fade-in font-display">
                                    <p className="font-bold text-[#28A745]">ZMW {svgPoints[hoveredPointIndex].amount.toLocaleString()}</p>
                                    <p className="text-white/60 text-[9px] mt-0.5">{svgPoints[hoveredPointIndex].date}</p>
                                  </div>
                                </foreignObject>
                              )}
                            </svg>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Cycle collection gauge & Split breakdown */}
                    <div className="bg-white border border-[#EBEBEB] rounded-[20px] p-6 shadow-xs flex flex-col justify-between min-h-[300px]">
                      <div>
                        <h4 className="text-sm font-bold text-[#001C3D] uppercase tracking-wider">Group Progress</h4>
                        <p className="text-xs text-[#545658]/70 font-light mt-1">Status of collection target goals</p>
                      </div>

                      {/* SVG Circle Gauge */}
                      <div className="flex flex-col items-center justify-center py-2 relative">
                        {(() => {
                          const targetCollectionGoal = groupTargetGoal || 6000;
                          const collectionPercentage = targetCollectionGoal > 0
                            ? Math.min(100, Math.round((totalContributionsSum / targetCollectionGoal) * 100))
                            : 0;
                          const circleRadius = 45;
                          const circumference = 2 * Math.PI * circleRadius;
                          const strokeDashoffset = circumference - (circumference * collectionPercentage) / 100;

                          return (
                            <div className="relative h-28 w-28 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* Base Track */}
                                <circle cx="50" cy="50" r={circleRadius} fill="none" stroke="#F0F2F5" strokeWidth="8" />
                                {/* Progress Stroke */}
                                <circle cx="50" cy="50" r={circleRadius} fill="none" stroke="#0070BA" strokeWidth="8" 
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-500 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center font-display">
                                <span className="text-xl font-black text-[#001C3D]">{collectionPercentage}%</span>
                                <span className="text-[9px] uppercase font-bold text-[#545658]/55 tracking-wider">Saved</span>
                              </div>
                            </div>
                          );
                        })()}
                        
                        <div className="text-center mt-2.5">
                          <p className="text-xs font-bold text-[#001C3D]">
                            ZMW {totalContributionsSum.toLocaleString()} / ZMW {(groupTargetGoal || 6000).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-[#545658]/60 mt-0.5 font-light">Target savings collection limit</p>
                        </div>
                      </div>

                      {/* Allocation split meter bar */}
                      <div className="border-t border-[#EBEBEB] pt-4 space-y-2">
                        <p className="text-[10px] font-bold text-[#545658]/60 uppercase tracking-widest">Asset Allocation Split</p>
                        
                        {(() => {
                          const reserveCap = Math.max(0, groupWalletBalance);
                          const loanCap = Math.max(0, totalDisbursedSum - totalRepaymentsSum);
                          const totalFundsValue = reserveCap + loanCap;

                          const reservePct = totalFundsValue > 0 ? Math.round((reserveCap / totalFundsValue) * 100) : 100;
                          const loanPct = totalFundsValue > 0 ? (100 - reservePct) : 0;

                          return (
                            <div className="space-y-3">
                              {/* Horizontal Segment Bar */}
                              <div className="h-2 w-full rounded-full overflow-hidden flex bg-gray-100">
                                <div style={{ width: `${reservePct}%` }} className="bg-[#28A745] h-full" title={`Reserves: ${reservePct}%`} />
                                <div style={{ width: `${loanPct}%` }} className="bg-[#FFC439] h-full" title={`Loans: ${loanPct}%`} />
                              </div>

                              {/* Labels */}
                              <div className="grid grid-cols-2 gap-1 text-[9px] font-mono leading-none">
                                <div className="text-left">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#28A745] mr-1" />
                                  <span className="text-[#545658]/80 font-bold">{reservePct}%</span>
                                  <p className="text-[8px] text-gray-400 mt-0.5">Reserves</p>
                                </div>
                                <div className="text-right">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFC439] mr-1" />
                                  <span className="text-[#545658]/80 font-bold">{loanPct}%</span>
                                  <p className="text-[8px] text-gray-400 mt-0.5">Outstanding Loans</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === "members" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-[#EBEBEB] rounded-2xl p-4 shadow-xs">
                    <div className="relative w-full sm:w-80">
                      <input
                        type="text"
                        placeholder="Search member registry..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-[#EBEBEB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                      />
                      <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyInviteLink}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full active:scale-95 transition-all cursor-pointer shadow-xs border ${
                          copiedInvite 
                            ? "bg-[#28A745]/10 border-[#28A745] text-[#28A745]" 
                            : "bg-[#F5F7FA] border-[#EBEBEB] text-[#001C3D] hover:bg-gray-100"
                        }`}
                      >
                        {copiedInvite ? (
                          <>
                            <CheckCircle2 className="h-4.5 w-4.5" />
                            <span>Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4.5 w-4.5" />
                            <span>Copy Invite Link</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setIsMemberModalOpen(true)}
                        className="inline-flex items-center gap-1.5 bg-[#0070BA] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#005EA6] active:scale-95 transition-all cursor-pointer shadow-xs"
                      >
                        <UserPlus className="h-4.5 w-4.5" />
                        <span>Register Member</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-[#EBEBEB] rounded-[20px] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#F5F7FA] border-b border-[#EBEBEB] text-[10px] font-bold text-[#545658] uppercase tracking-wider">
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Phone Number</th>
                            {groupType === "agricultural" && <th className="px-6 py-4">Shares</th>}
                            <th className="px-6 py-4">Total Saved</th>
                            {groupType === "sacco" && <th className="px-6 py-4">Outstanding Loan</th>}
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBEBEB] text-xs text-[#545658]">
                          {filteredMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-[#F5F7FA]/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-[#001C3D]">{member.name}</td>
                              <td className="px-6 py-4 font-mono">{member.email}</td>
                              <td className="px-6 py-4 font-mono">{member.phone || "-"}</td>
                              {groupType === "agricultural" && <td className="px-6 py-4 font-semibold text-[#001C3D]">{member.shares || 0}</td>}
                              
                              <td className="px-6 py-4">
                                <button 
                                  onClick={() => triggerTrace("member", member.id, member.name)}
                                  className="font-semibold text-[#0070BA] hover:underline cursor-pointer"
                                >
                                  ZMW {member.totalContributed.toLocaleString()}
                                </button>
                              </td>

                              {groupType === "sacco" && (
                                <td className="px-6 py-4 font-semibold text-orange-600">
                                  {member.outstandingLoan && member.outstandingLoan > 0 ? (
                                    <button 
                                      onClick={() => triggerTrace("member", member.id, member.name)}
                                      className="font-semibold text-orange-600 hover:underline cursor-pointer"
                                    >
                                      ZMW {member.outstandingLoan.toLocaleString()}
                                    </button>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              )}
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  member.status === "active" 
                                    ? "bg-[#28A745]/10 text-[#28A745]" 
                                    : member.status === "arrears" 
                                      ? "bg-red-50 text-[#E11900]" 
                                      : "bg-gray-100 text-gray-500"
                                }`}>
                                  {member.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => triggerTrace("member", member.id, member.name)}
                                  className="text-xs text-[#0070BA] hover:underline font-bold"
                                >
                                  Audit Trace
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "contributions" && (
                <div className="space-y-6 animate-fade-in w-full">
                  
                  {/* PENDING MANUAL DEPOSITS APPROVAL SECTION */}
                  {(() => {
                    const pendingDeposits = transactions.filter(tx => tx.status === "pending");
                    if (pendingDeposits.length === 0) return null;
                    
                    return (
                      <div className="bg-white border border-[#EBEBEB] rounded-[20px] overflow-hidden shadow-md">
                        <div className="p-6 border-b border-[#EBEBEB] bg-[#0070BA]/5 flex justify-between items-center">
                          <div>
                            <h3 className="text-sm font-black text-[#001C3D] uppercase tracking-wider flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                              Pending Manual Deposits ({pendingDeposits.length})
                            </h3>
                            <p className="text-[11px] text-[#545658]/70 mt-0.5">Verify these transfers on your phone statement, then approve to update ledger</p>
                          </div>
                        </div>

                        <div className="divide-y divide-[#EBEBEB]">
                          {pendingDeposits.map((tx) => (
                            <div key={tx.id} className="p-4 hover:bg-[#F5F7FA]/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors text-xs text-[#545658]">
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                  <Clock className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <p className="font-bold text-[#001C3D]">
                                    {tx.memberName} 
                                    <span className="font-light text-[#545658] text-xs ml-1 font-sans">
                                      {tx.type === "contribution" ? "deposited savings" : "paid loan repayment"}
                                    </span>
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 font-medium">
                                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-bold">SMS Ref: {tx.referenceId}</span>
                                    <span>•</span>
                                    <span>{new Date(tx.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className="capitalize">{tx.provider}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 justify-between sm:justify-end">
                                <div className="text-right mr-2">
                                  <span className="font-bold font-display text-amber-600">
                                    + ZMW {tx.amount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleConfirmTransaction(tx.id, "completed")}
                                    className="px-3.5 py-1.5 bg-[#28A745] hover:bg-[#218838] text-white text-[11px] font-bold rounded-full transition-all active:scale-95 cursor-pointer shadow-xs"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleConfirmTransaction(tx.id, "failed")}
                                    className="px-3.5 py-1.5 border border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 text-[11px] font-bold rounded-full transition-all active:scale-95 cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Standard ledger log */}
                  <div className="bg-white border border-[#EBEBEB] rounded-[20px] overflow-hidden shadow-xs">
                    <div className="p-6 border-b border-[#EBEBEB] flex justify-between items-center bg-[#F5F7FA]">
                      <div>
                        <h3 className="text-sm font-bold text-[#001C3D] uppercase tracking-wider">MoMo Ledger Transaction History</h3>
                      </div>
                      <button
                        onClick={() => setIsAdjustmentModalOpen(true)}
                        className="px-4 py-2 border border-[#EBEBEB] hover:bg-gray-50 text-xs font-bold text-[#001C3D] rounded-full cursor-pointer"
                      >
                        Post Manual Adjustment
                      </button>
                    </div>

                    <div className="divide-y divide-[#EBEBEB]">
                      {(() => {
                        const completedOrFailed = transactions.filter(tx => tx.status !== "pending");
                        if (completedOrFailed.length === 0) {
                          return (
                            <div className="p-8 text-center text-gray-400">
                              No completed or rejected transactions recorded yet.
                            </div>
                          );
                        }
                        return completedOrFailed.map((tx) => (
                          <div key={tx.id} className="p-4 hover:bg-[#F5F7FA]/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors text-xs text-[#545658]">
                            <div className="flex items-start gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                tx.status === "failed" ? "bg-red-50 text-red-500" :
                                tx.type === "contribution" || tx.type === "repayment" ? "bg-[#28A745]/15 text-[#28A745]" : "bg-orange-50 text-orange-600"
                              }`}>
                                {tx.type === "contribution" && <ArrowDownLeft className="h-4.5 w-4.5" />}
                                {tx.type === "repayment" && <Coins className="h-4.5 w-4.5" />}
                                {tx.type === "loan_disbursement" && <ArrowUpRight className="h-4.5 w-4.5" />}
                                {tx.type === "adjustment" && <FileSpreadsheet className="h-4.5 w-4.5" />}
                              </div>
                              <div>
                                <p className="font-bold text-[#001C3D]">
                                  {tx.memberName} 
                                  <span className="font-light text-[#545658] text-xs ml-1">
                                    {tx.type === "contribution" && "deposited savings"}
                                    {tx.type === "repayment" && "paid loan repayment"}
                                    {tx.type === "loan_disbursement" && "disbursed loan"}
                                    {tx.type === "adjustment" && `posted ledger adjustment (${tx.notes})`}
                                  </span>
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                  <span className="font-mono">{tx.referenceId}</span>
                                  <span>•</span>
                                  <span>{new Date(tx.date).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span className="capitalize">{tx.provider}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`font-bold font-display ${
                                tx.status === "failed" ? "text-red-500 line-through" :
                                tx.type === "contribution" || tx.type === "repayment" ? "text-[#28A745]" : "text-[#001C3D]"
                              }`}>
                                {tx.type === "contribution" || tx.type === "repayment" ? "+" : "-"} ZMW {tx.amount.toLocaleString()}
                              </span>
                              {tx.status === "failed" && (
                                <p className="text-[9px] text-red-500 font-bold mt-0.5">Rejected</p>
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "loans" && groupType !== "savings" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs">
                      <h4 className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider mb-2">Loan Registry Stats</h4>
                      <dl className="space-y-2 text-xs text-[#545658]">
                        <div className="flex justify-between">
                          <dt className="font-light">Total Disbursed Volume:</dt>
                          <dd className="font-bold text-[#001C3D]">ZMW {totalDisbursedSum.toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between border-t border-[#EBEBEB] pt-2 mt-2">
                          <dt className="font-light">Total Repaid to Date:</dt>
                          <dd className="font-bold text-[#28A745]">ZMW {totalRepaymentsSum.toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between border-t border-[#EBEBEB] pt-2 mt-2">
                          <dt className="font-light">Outstanding Debt:</dt>
                          <dd className="font-bold text-orange-600">ZMW {(totalDisbursedSum - totalRepaymentsSum).toLocaleString()}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#545658]/60 uppercase tracking-wider">Interest Engine status</h4>
                        <p className="text-xs font-semibold text-[#001C3D] mt-2">Group Rate Rule: 5% monthly simple interest</p>
                      </div>
                      <button
                        onClick={() => setIsDisbursementModalOpen(true)}
                        className="w-full mt-4 text-center bg-[#FFC439] hover:bg-[#F2B522] text-[#001C3D] text-xs font-extrabold py-2.5 rounded-full"
                      >
                        Disburse New Loan →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "cycle" && (
                <div className="bg-white border border-[#EBEBEB] rounded-[20px] p-6 shadow-xs space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-[#EBEBEB] pb-4">
                    <h3 className="text-sm font-bold text-[#001C3D] uppercase tracking-wider">Active Group Specifications</h3>
                    {!isEditingCycleSettings ? (
                      userRole === "Group Treasurer" && (
                        <button
                          onClick={handleStartEditingSettings}
                          className="px-4 py-1.5 border border-[#EBEBEB] hover:bg-slate-50 text-xs font-bold text-[#0070BA] rounded-full cursor-pointer transition-colors"
                        >
                          Edit Specifications
                        </button>
                      )
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditingCycleSettings(false)}
                          className="px-4 py-1.5 border border-[#EBEBEB] hover:bg-slate-50 text-xs font-bold text-slate-500 rounded-full cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSettings}
                          disabled={isSavingSettings}
                          className="px-4 py-1.5 bg-[#0070BA] hover:bg-[#005EA6] text-xs font-bold text-white rounded-full cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {isSavingSettings ? "Saving..." : "Save Specifications"}
                        </button>
                      </div>
                    )}
                  </div>

                  {settingsError && (
                    <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-100 font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{settingsError}</span>
                    </div>
                  )}

                  {settingsSuccess && (
                    <div className="bg-green-50 text-green-700 text-xs p-3.5 rounded-xl border border-green-100 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{settingsSuccess}</span>
                    </div>
                  )}

                  {isEditingCycleSettings ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#545658] animate-fade-in">
                      {/* Left Column: Group Info */}
                      <div className="space-y-4">
                        <p className="font-bold text-[#001C3D] border-b border-[#EBEBEB] pb-1.5">Group Information</p>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-slate-500">Structure</span>
                          <span className="capitalize font-bold text-[#001C3D]">{groupType} Group</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="edit-location" className="font-semibold text-slate-500">City Node</label>
                          <input
                            type="text"
                            id="edit-location"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs w-full font-medium"
                          />
                        </div>
                      </div>

                      {/* Right Column: Wallet Info */}
                      <div className="space-y-4">
                        <p className="font-bold text-[#001C3D] border-b border-[#EBEBEB] pb-1.5">Connected Wallet Node</p>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="edit-wallet-provider" className="font-semibold text-slate-500">MoMo Gateway</label>
                          <select
                            id="edit-wallet-provider"
                            value={editWalletProvider}
                            onChange={(e) => setEditWalletProvider(e.target.value as any)}
                            className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs w-full font-medium"
                          >
                            <option value="mtn">MTN MoMo</option>
                            <option value="airtel">Airtel Money</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="edit-wallet-num" className="font-semibold text-slate-500">Collection Target Number</label>
                          <input
                            type="text"
                            id="edit-wallet-num"
                            value={editWalletNum}
                            onChange={(e) => setEditWalletNum(e.target.value)}
                            className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs w-full font-medium"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="edit-wallet-holder" className="font-semibold text-slate-500">Registered Holder</label>
                          <input
                            type="text"
                            id="edit-wallet-holder"
                            value={editWalletHolderName}
                            onChange={(e) => setEditWalletHolderName(e.target.value)}
                            className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs w-full font-medium"
                          />
                        </div>
                      </div>

                      {/* Bottom Span: Cycle Rules */}
                      <div className="space-y-4 md:col-span-2 border-t border-[#EBEBEB] pt-4">
                        <p className="font-bold text-[#001C3D] border-b border-[#EBEBEB] pb-1.5">Active Group Rules</p>
                        
                        {groupType === "savings" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-contrib-amount" className="font-semibold text-slate-500">Contribution Amount (ZMW)</label>
                              <input
                                type="number"
                                id="edit-contrib-amount"
                                value={editIsFlexibleContribution ? "" : editContributionAmount}
                                disabled={editIsFlexibleContribution}
                                onChange={(e) => setEditContributionAmount(e.target.value)}
                                placeholder={editIsFlexibleContribution ? "Flexible (Any Amount)" : "150"}
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium disabled:bg-slate-50 disabled:text-slate-400"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-target-goal" className="font-semibold text-slate-500">Target Savings Goal (ZMW)</label>
                              <input
                                type="number"
                                id="edit-target-goal"
                                value={editTargetGoal}
                                onChange={(e) => setEditTargetGoal(e.target.value)}
                                placeholder="6000"
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-frequency" className="font-semibold text-slate-500">Frequency</label>
                              <input
                                type="text"
                                id="edit-frequency"
                                value={editFrequency}
                                onChange={(e) => setEditFrequency(e.target.value)}
                                placeholder="e.g. Anytime, weekly, monthly"
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-rotation" className="font-semibold text-slate-500">Rotation Method</label>
                              <input
                                type="text"
                                id="edit-rotation"
                                value={editRotationMethod}
                                onChange={(e) => setEditRotationMethod(e.target.value)}
                                placeholder="e.g. Manual, random, fixed"
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>

                            <div className="flex items-center gap-2 sm:col-span-2 pt-2">
                              <input
                                type="checkbox"
                                id="edit-flexible-contrib"
                                checked={editIsFlexibleContribution}
                                onChange={(e) => setEditIsFlexibleContribution(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#0070BA] focus:ring-[#0070BA] cursor-pointer"
                              />
                              <label htmlFor="edit-flexible-contrib" className="text-xs font-bold text-slate-700 cursor-pointer">
                                Allow members to deposit any amount (disable fixed contribution)
                              </label>
                            </div>
                          </div>
                        )}

                        {groupType === "agricultural" && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-share-price" className="font-semibold text-slate-500">Share Price (ZMW)</label>
                              <input
                                type="number"
                                id="edit-share-price"
                                value={editSharePrice}
                                onChange={(e) => setEditSharePrice(e.target.value)}
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-max-shares" className="font-semibold text-slate-500">Maximum Shares Limit</label>
                              <input
                                type="number"
                                id="edit-max-shares"
                                value={editMaxShares}
                                onChange={(e) => setEditMaxShares(e.target.value)}
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-div-cycle" className="font-semibold text-slate-500">Dividend Payout Schedule</label>
                              <input
                                type="text"
                                id="edit-div-cycle"
                                value={editDividendCycle}
                                onChange={(e) => setEditDividendCycle(e.target.value)}
                                placeholder="e.g. Seasonal, annual"
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>
                          </div>
                        )}

                        {groupType === "sacco" && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-min-borrow" className="font-semibold text-slate-500">Minimum Balance to Borrow (ZMW)</label>
                              <input
                                type="number"
                                id="edit-min-borrow"
                                value={editMinBalanceToBorrow}
                                onChange={(e) => setEditMinBalanceToBorrow(e.target.value)}
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-interest" className="font-semibold text-slate-500">Simple Interest Rate (%)</label>
                              <input
                                type="number"
                                id="edit-interest"
                                value={editInterestRate}
                                onChange={(e) => setEditInterestRate(e.target.value)}
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-term" className="font-semibold text-slate-500">Loan Repayment Term (Months)</label>
                              <input
                                type="number"
                                id="edit-term"
                                value={editLoanTermMonths}
                                onChange={(e) => setEditLoanTermMonths(e.target.value)}
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>
                          </div>
                        )}
                        {groupType === "general" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-contrib-amount" className="font-semibold text-slate-500">Contribution Amount (ZMW)</label>
                              <input
                                type="number"
                                id="edit-contrib-amount"
                                value={editIsFlexibleContribution ? "" : editContributionAmount}
                                disabled={editIsFlexibleContribution}
                                onChange={(e) => setEditContributionAmount(e.target.value)}
                                className={`border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] text-xs font-medium ${
                                  editIsFlexibleContribution ? "bg-gray-50 text-gray-400 cursor-not-allowed border-[#EBEBEB]" : "bg-white"
                                }`}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-target-goal" className="font-semibold text-slate-500">Target Savings Goal (ZMW)</label>
                              <input
                                type="number"
                                id="edit-target-goal"
                                value={editTargetGoal}
                                onChange={(e) => setEditTargetGoal(e.target.value)}
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label htmlFor="edit-deadline" className="font-semibold text-slate-500">Target Deadline / End Date</label>
                              <input
                                type="date"
                                id="edit-deadline"
                                value={editDeadline}
                                onChange={(e) => setEditDeadline(e.target.value)}
                                className="border border-[#EBEBEB] rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white text-xs font-medium"
                              />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2 pt-2">
                              <input
                                type="checkbox"
                                id="edit-flexible-contrib"
                                checked={editIsFlexibleContribution}
                                onChange={(e) => setEditIsFlexibleContribution(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#0070BA] focus:ring-[#0070BA] cursor-pointer"
                              />
                              <label htmlFor="edit-flexible-contrib" className="text-xs font-bold text-slate-700 cursor-pointer">
                                Allow members to deposit any amount (disable fixed contribution)
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#545658] animate-fade-in">
                      <div className="space-y-2">
                        <p className="font-bold text-[#001C3D] border-b border-[#EBEBEB] pb-1.5">Group Information</p>
                        <p>Structure: <span className="capitalize font-semibold">{groupType} Group</span></p>
                        <p>City Node: {locationName}, Zambia</p>
                        <p>System Token ID: <span className="font-mono">{groupRef}</span></p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-[#001C3D] border-b border-[#EBEBEB] pb-1.5">Connected Wallet Node</p>
                        <p>MoMo Gateway: <span className="uppercase font-semibold">{walletProvider}</span></p>
                        <p>Collection Target Number: <span className="font-mono">{walletNum}</span></p>
                        {cycleSettings.walletHolderName && <p>Registered Holder: {cycleSettings.walletHolderName}</p>}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <p className="font-bold text-[#001C3D] border-b border-[#EBEBEB] pb-1.5">Active Group Rules</p>
                        {groupType === "savings" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <p>Contribution Amount: <span className="font-semibold text-[#001C3D]">{cycleSettings.isFlexibleContribution ? "Flexible (Any Amount)" : `ZMW ${cycleSettings.contributionAmount || 0}`}</span></p>
                            <p>Target Savings Goal: <span className="font-semibold text-[#001C3D]">ZMW {cycleSettings.targetGoal || 6000}</span></p>
                            <p>Frequency: <span className="capitalize font-semibold">{cycleSettings.frequency || "weekly"}</span></p>
                            <p>Rotation Method: <span className="capitalize font-semibold">{cycleSettings.rotationMethod || "random"}</span></p>
                          </div>
                        )}
                        {groupType === "agricultural" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <p>Share Price: <span className="font-semibold text-[#001C3D]">ZMW {cycleSettings.sharePrice || 0}</span></p>
                            <p>Maximum Shares Limit: <span className="font-semibold text-[#001C3D]">{cycleSettings.maxShares || 0} Shares</span></p>
                            <p>Dividend Payout Schedule: <span className="capitalize font-semibold">{cycleSettings.dividendCycle || "seasonal"}</span></p>
                          </div>
                        )}
                        {groupType === "sacco" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <p>Minimum Balance to Borrow: <span className="font-semibold text-[#001C3D]">ZMW {cycleSettings.minBalanceToBorrow || 0}</span></p>
                            <p>Simple Interest Rate: <span className="font-semibold text-[#001C3D]">{cycleSettings.interestRate || 5}% monthly</span></p>
                            <p>Loan Repayment Term: <span className="font-semibold text-[#001C3D]">{cycleSettings.loanTermMonths || 3} Months</span></p>
                          </div>
                        )}
                        {groupType === "general" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <p>Contribution Amount: <span className="font-semibold text-[#001C3D]">{cycleSettings.isFlexibleContribution ? "Flexible (Any Amount)" : `ZMW ${cycleSettings.contributionAmount || 0}`}</span></p>
                            <p>Target Savings Goal: <span className="font-semibold text-[#001C3D]">ZMW {cycleSettings.targetGoal || 5000}</span></p>
                            {cycleSettings.deadline && <p>Target Deadline: <span className="font-semibold text-[#001C3D]">{new Date(cycleSettings.deadline).toLocaleDateString()}</span></p>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                    {/* Group Renaming Panel */}
                    <div className="space-y-3 md:col-span-2 border-t border-[#EBEBEB] pt-6 mt-2">
                      <p className="font-bold text-[#001C3D]">Rename Group Node</p>
                      <p className="text-[11px] text-[#545658]/70 leading-relaxed font-light">
                        Propose a new name for this group. For security and trust compliance, the name change will only become active once at least one other registered member approves the change.
                      </p>
                      
                      {pendingProposal ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 mt-2">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-amber-800 text-xs">Pending Rename Proposal</p>
                              <p className="text-xs text-[#545658] mt-1">
                                Change group name from <strong className="font-semibold">"{groupName}"</strong> to <strong className="font-bold">"{pendingProposal.proposed_name}"</strong>.
                              </p>
                              <p className="text-[10px] text-amber-600/80 mt-1 font-light">
                                Proposed on {new Date(pendingProposal.created_at).toLocaleDateString()}. Waiting for 1 more member to approve.
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleCancelRename(pendingProposal.id)}
                              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-full transition-colors active:scale-95 cursor-pointer"
                            >
                              Cancel Proposal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3 items-end max-w-md mt-2">
                          <div className="flex-grow flex flex-col gap-1">
                            <label htmlFor="proposed-name-input" className="text-[10px] uppercase font-bold text-slate-500">Proposed New Name</label>
                            <input
                              type="text"
                              id="proposed-name-input"
                              value={proposedNameInput}
                              onChange={(e) => setProposedNameInput(e.target.value)}
                              placeholder="e.g. Tusunge Savings Cooperative"
                              className="border border-[#EBEBEB] rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white w-full"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleProposeRename}
                            disabled={isProposing}
                            className="bg-[#0070BA] hover:bg-[#005EA6] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                          >
                            {isProposing ? "Submitting..." : "Propose Rename"}
                          </button>
                        </div>
                      )}
                      
                      {proposeError && (
                        <p className="text-xs text-[#E11900] font-semibold mt-1 flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" />
                          <span>{proposeError}</span>
                        </p>
                      )}
                      {proposeSuccess && (
                        <p className="text-xs text-[#28A745] font-semibold mt-1 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{proposeSuccess}</span>
                        </p>
                      )}
                    </div>

                  </div>
              )}
            </>
          )}

          {/* 3. Compact Dashboard Footer */}
          <footer className="text-[11px] text-[#545658]/60 mt-12 border-t border-[#EBEBEB] pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p>© {new Date().getFullYear()} Savora Ledger Platform. Secure village banking orchestration.</p>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success-green animate-pulse" />
              <span>Airtel & MTN Gateway Integrations Live</span>
            </div>
          </footer>

        </main>
      </div>



      {/* 6. Action Modals (Add Member, Record Adjustment, Disburse Loan) */}

      {/* MODAL: ADD MEMBER */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleAddMember} className="bg-white rounded-2xl border border-[#EBEBEB] shadow-2xl p-6 max-w-md w-full space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-[#EBEBEB] pb-3">
              <h3 className="text-lg font-bold text-[#001C3D]">Register Cooperative Member</h3>
              <button type="button" onClick={() => setIsMemberModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {memberFormError && (
              <div className="flex items-center gap-2 text-xs text-[#E11900] bg-[#E11900]/10 p-2.5 rounded-lg border border-[#E11900]/20 font-semibold">
                <AlertCircle className="h-4 w-4" />
                <span>{memberFormError}</span>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mem-name-inp" className="text-xs font-bold text-[#545658]">Member Full Name</label>
              <input
                type="text"
                id="mem-name-inp"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Mwansa Chibwe"
                className="border border-[#EBEBEB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mem-email-inp" className="text-xs font-bold text-[#545658]">Member Email (For Login)</label>
              <input
                type="email"
                id="mem-email-inp"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="member@example.com"
                className="border border-[#EBEBEB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mem-phone-inp" className="text-xs font-bold text-[#545658]">Member Phone Number (Optional)</label>
              <input
                type="text"
                id="mem-phone-inp"
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value)}
                placeholder="e.g. 0977123456"
                className="border border-[#EBEBEB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
              />
            </div>
            {groupType === "agricultural" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mem-shares-inp" className="text-xs font-bold text-[#545658]">Initial Purchased Shares</label>
                <input
                  type="number"
                  id="mem-shares-inp"
                  value={newMemberShares}
                  onChange={(e) => setNewMemberShares(e.target.value)}
                  min="1"
                  className="border border-[#EBEBEB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                />
              </div>
            )}
            <div className="flex justify-end gap-3 border-t border-[#EBEBEB] pt-4">
              <button 
                type="button" 
                onClick={() => setIsMemberModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#EBEBEB] hover:bg-gray-50 text-xs font-bold text-[#545658]"
              >
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 rounded-full bg-[#0070BA] text-white hover:bg-[#005EA6] text-xs font-bold">Register Member</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: MANUAL ADJUSTMENT */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleRecordAdjustment} className="bg-white rounded-2xl border border-[#EBEBEB] shadow-2xl p-6 max-w-md w-full space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-[#EBEBEB] pb-3">
              <h3 className="text-lg font-bold text-[#001C3D]">Record Ledger Adjustment</h3>
              <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {adjustFormError && (
              <div className="flex items-center gap-2 text-xs text-[#E11900] bg-[#E11900]/10 p-2.5 rounded-lg border border-[#E11900]/20 font-semibold">
                <AlertCircle className="h-4 w-4" />
                <span>{adjustFormError}</span>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="adj-mem" className="text-xs font-bold text-[#545658]">Target Member</label>
              <select
                id="adj-mem"
                value={adjustMemberId}
                onChange={(e) => setAdjustMemberId(e.target.value)}
                className="border border-[#EBEBEB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white"
              >
                <option value="">Select member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="adj-type" className="text-xs font-bold text-[#545658]">Adjustment Type</label>
                <select
                  id="adj-type"
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="border border-[#EBEBEB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white"
                >
                  <option value="contribution">Contribution</option>
                  <option value="repayment">Loan Repayment</option>
                  <option value="payout">Payout</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="adj-amt" className="text-xs font-bold text-[#545658]">Amount (ZMW)</label>
                <input
                  type="number"
                  id="adj-amt"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="200"
                  className="border border-[#EBEBEB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="adj-notes" className="text-xs font-bold text-[#545658]">Mandatory Audit Note / Reason</label>
              <textarea
                id="adj-notes"
                rows={2}
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="e.g. Cash collected directly due to MTN network outage"
                className="border border-[#EBEBEB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-[#EBEBEB] pt-4">
              <button 
                type="button" 
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#EBEBEB] hover:bg-gray-50 text-xs font-bold text-[#545658]"
              >
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 rounded-full bg-[#0070BA] text-white hover:bg-[#005EA6] text-xs font-bold">Post Adjustment</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DISBURSE LOAN */}
      {isDisbursementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleDisburseLoan} className="bg-white rounded-2xl border border-[#EBEBEB] shadow-2xl p-6 max-w-md w-full space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-[#EBEBEB] pb-3">
              <h3 className="text-lg font-bold text-[#001C3D]">Disburse Loan</h3>
              <button type="button" onClick={() => setIsDisbursementModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {loanFormError && (
              <div className="flex items-center gap-2 text-xs text-[#E11900] bg-[#E11900]/10 p-2.5 rounded-lg border border-[#E11900]/20 font-semibold">
                <AlertCircle className="h-4 w-4" />
                <span>{loanFormError}</span>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ln-mem" className="text-xs font-bold text-[#545658]">Target Member</label>
              <select
                id="ln-mem"
                value={loanMemberId}
                onChange={(e) => setLoanMemberId(e.target.value)}
                className="border border-[#EBEBEB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] bg-white"
              >
                <option value="">Select member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ln-amt" className="text-xs font-bold text-[#545658]">Loan Amount (ZMW)</label>
              <input
                type="number"
                id="ln-amt"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="1000"
                className="border border-[#EBEBEB] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
              />
            </div>
            <p className="text-[11px] text-[#545658]/70 leading-relaxed font-light bg-[#F5F7FA] p-3 rounded-lg border border-[#EBEBEB]">
              This triggers a direct mobile money payout transaction through Airtel/MTN to the member's wallet. The outstanding loan balance and 5% interest schedule will automatically bind to their profile upon confirmation.
            </p>
            <div className="flex justify-end gap-3 border-t border-[#EBEBEB] pt-4">
              <button 
                type="button" 
                onClick={() => setIsDisbursementModalOpen(false)}
                className="px-4 py-2 rounded-full border border-[#EBEBEB] hover:bg-gray-50 text-xs font-bold text-[#545658]"
              >
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 rounded-full bg-[#0070BA] text-white hover:bg-[#005EA6] text-xs font-bold">Initiate Disbursement</button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={(tab) => { 
          setActiveTab(tab as any); 
          handleBackToDashboard(); 
        }} 
        variant="treasurer"
      />

    </div>
  );
}
