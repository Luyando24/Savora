"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, Check, Loader2, Sparkles, RefreshCw } from "lucide-react";

type GroupType = "savings" | "coop" | "sacco";

interface Transaction {
  id: string;
  name: string;
  type: string;
  amount: number;
  provider: "MTN MoMo" | "Airtel Money";
  status: "completed" | "pending" | "failed";
  date: string;
}

const groupMetadata = {
  savings: {
    name: "Tigwilizane Savings Circle",
    typeLabel: "Savings Group (Chilimba)",
    initialBalance: 3500,
    increment: 500,
    newTx: {
      name: "Mwansa Phiri",
      type: "Weekly Contribution",
      amount: 500,
      provider: "Airtel Money" as const,
      date: "Today, Just now",
    },
    history: [
      { id: "tx-1", name: "Agness Banda", type: "Weekly Contribution", amount: 500, provider: "MTN MoMo", status: "completed", date: "Yesterday" },
      { id: "tx-2", name: "Chileshe Mulenga", type: "Weekly Contribution", amount: 500, provider: "Airtel Money", status: "completed", date: "2 days ago" },
      { id: "tx-3", name: "Daka Phiri", type: "Weekly Contribution", amount: 500, provider: "MTN MoMo", status: "completed", date: "3 days ago" },
    ] as Transaction[],
  },
  coop: {
    name: "Chongwe Agricultural Union",
    typeLabel: "Agricultural Cooperative",
    initialBalance: 12400,
    increment: 1200,
    newTx: {
      name: "Agness Nakamba",
      type: "Share Purchase",
      amount: 1200,
      provider: "MTN MoMo" as const,
      date: "Today, Just now",
    },
    history: [
      { id: "tx-1", name: "Bwalya Sampa", type: "Share Purchase", amount: 1200, provider: "MTN MoMo", status: "completed", date: "Yesterday" },
      { id: "tx-2", name: "Loveness Tembo", type: "Maize Bag Collection Deposit", amount: 800, provider: "Airtel Money", status: "completed", date: "2 days ago" },
      { id: "tx-3", name: "Mutale Kafwila", type: "Share Purchase", amount: 1200, provider: "Airtel Money", status: "completed", date: "4 days ago" },
    ] as Transaction[],
  },
  sacco: {
    name: "Kalingalinga Credit Union",
    typeLabel: "SACCO / Credit Union",
    initialBalance: 8750,
    increment: 1500,
    newTx: {
      name: "Bwalya Mubanga",
      type: "Loan Repayment",
      amount: 1500,
      provider: "Airtel Money" as const,
      date: "Today, Just now",
    },
    history: [
      { id: "tx-1", name: "Musonda Nkandu", type: "Loan Repayment", amount: 1500, provider: "MTN MoMo", status: "completed", date: "Yesterday" },
      { id: "tx-2", name: "Kabaso Musonda", type: "Membership Fee", amount: 250, provider: "Airtel Money", status: "completed", date: "3 days ago" },
      { id: "tx-3", name: "Josephine Mwanza", type: "Loan Repayment", amount: 1500, provider: "MTN MoMo", status: "completed", date: "5 days ago" },
    ] as Transaction[],
  },
};

function LedgerSimulatorBoard({ groupType }: { groupType: GroupType }) {
  const activeMeta = groupMetadata[groupType];
  const [balance, setBalance] = useState(activeMeta.initialBalance);
  const [simStep, setSimStep] = useState<"idle" | "sending" | "pin" | "network" | "completed">("idle");
  const [targetBalance, setTargetBalance] = useState(activeMeta.initialBalance);

  // Smooth counter effect
  useEffect(() => {
    if (balance < targetBalance) {
      const interval = setInterval(() => {
        setBalance((prev) => {
          if (prev >= targetBalance) {
            clearInterval(interval);
            return targetBalance;
          }
          return prev + Math.ceil((targetBalance - prev) / 10);
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [balance, targetBalance]);

  const triggerSimulation = () => {
    if (simStep !== "idle") return;

    setSimStep("sending");

    // 1. Sending Request-to-Pay (1.5s)
    setTimeout(() => {
      setSimStep("pin");

      // 2. PIN Approval step (2s)
      setTimeout(() => {
        setSimStep("network");

        // 3. Network Confirm (1.5s)
        setTimeout(() => {
          setSimStep("completed");
          setTargetBalance((prev) => prev + activeMeta.increment);
        }, 1500);
      }, 2000);
    }, 1500);
  };

  const resetSimulation = () => {
    setBalance(activeMeta.initialBalance);
    setTargetBalance(activeMeta.initialBalance);
    setSimStep("idle");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* Left panel: Simulator controls */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 rounded-[20px] bg-white border border-[#EBEBEB] shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-[#001C3D] mb-3">Mobile Money Integration</h3>
          <p className="text-sm text-[#545658] leading-relaxed mb-6 font-light">
            Savora connects to MTN MoMo and Airtel Money sandbox environments. Request-to-pay prompts are automatically delivered directly to your members&apos; handsets.
          </p>

          {/* Status Stepper */}
          <div className="space-y-4 mb-8">
            {/* Step 1 */}
            <div className={`flex items-start gap-4 transition-all duration-200 ${simStep === "idle" ? "opacity-35" : "opacity-100"}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                simStep === "sending" ? "bg-[#0070BA] text-white animate-pulse" : 
                simStep !== "idle" ? "bg-[#28A745] text-white" : "bg-gray-100 text-[#001C3D]"
              }`}>
                {simStep !== "idle" && simStep !== "sending" ? <Check className="h-3.5 w-3.5" /> : "1"}
              </div>
              <div>
                <p className="text-sm font-bold text-[#001C3D]">Deploy Webhook Request</p>
                <p className="text-xs text-[#545658] font-light">App dispatches secure API payload to Airtel/MTN gateway</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`flex items-start gap-4 transition-all duration-200 ${
              simStep === "idle" || simStep === "sending" ? "opacity-35" : "opacity-100"
            }`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                simStep === "pin" ? "bg-[#0070BA] text-white animate-pulse" : 
                simStep === "network" || simStep === "completed" ? "bg-[#28A745] text-white" : "bg-gray-100 text-[#001C3D]"
              }`}>
                {simStep === "network" || simStep === "completed" ? <Check className="h-3.5 w-3.5" /> : "2"}
              </div>
              <div>
                <p className="text-sm font-bold text-[#001C3D]">Handset PIN Approval</p>
                <p className="text-xs text-[#545658] font-light">Direct USSD collection prompt triggered on member phone</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`flex items-start gap-4 transition-all duration-200 ${
              simStep === "completed" || simStep === "network" ? "opacity-100" : "opacity-35"
            }`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                simStep === "network" ? "bg-[#0070BA] text-white animate-pulse" :
                simStep === "completed" ? "bg-[#28A745] text-white" : "bg-gray-100 text-[#001C3D]"
              }`}>
                {simStep === "completed" ? <Check className="h-3.5 w-3.5" /> : "3"}
              </div>
              <div>
                <p className="text-sm font-bold text-[#001C3D]">Balance Settlement</p>
                <p className="text-xs text-[#545658] font-light">Payment status verified & ledger posts immediately</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {simStep === "idle" ? (
            <button
              onClick={triggerSimulation}
              className="w-full flex items-center justify-center gap-2 bg-[#0070BA] text-white py-3.5 px-6 rounded-full font-bold text-sm hover:bg-[#005EA6] active:scale-95 transition-all duration-150 shadow-sm cursor-pointer"
              id="trigger-payment-btn"
            >
              <Smartphone className="h-4 w-4" />
              <span>Simulate K{activeMeta.increment} contribution</span>
            </button>
          ) : simStep === "completed" ? (
            <button
              onClick={resetSimulation}
              className="w-full flex items-center justify-center gap-2 bg-[#001C3D] text-white py-3.5 px-6 rounded-full font-bold text-sm hover:bg-[#0070BA] active:scale-95 transition-all duration-150 shadow-sm cursor-pointer"
              id="reset-payment-btn"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset & replay simulator</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-3.5 px-6 rounded-full font-bold text-sm cursor-not-allowed"
            >
              <Loader2 className="h-4 w-4 animate-spin text-[#0070BA]" />
              <span>
                {simStep === "sending" && "Connecting to mobile API..."}
                {simStep === "pin" && "Waiting for handset PIN..."}
                {simStep === "network" && "Verifying network hash..."}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Right panel: Ledger Activity Card (The PayPal Inspired Feed) */}
      <div className="lg:col-span-7 bg-white rounded-[20px] border border-[#EBEBEB] shadow-sm overflow-hidden flex flex-col justify-between">
        {/* Header: Available Balance */}
        <div className="p-6 border-b border-[#EBEBEB] bg-[#F5F7FA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold text-[#545658] uppercase tracking-wider">Account name</p>
            <h4 className="text-base font-bold text-[#001C3D]">{activeMeta.name}</h4>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[11px] font-bold text-[#545658] uppercase tracking-wider">Ledger Balance</p>
            <h4 className="text-2xl font-display font-extrabold text-[#001C3D]">
              K{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>
        </div>

        {/* List Body */}
        <div className="p-6 flex-1 min-h-[300px] flex flex-col justify-start space-y-4">
          <h5 className="text-[11px] font-bold text-[#545658] uppercase tracking-wider mb-2">Activity History</h5>

          {/* Pulsing Pending Row (Only when simulating) */}
          {simStep !== "idle" && (
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              simStep === "completed"
                ? "bg-[#28A745]/5 border-[#28A745]/20"
                : "bg-[#0070BA]/5 border-[#0070BA]/20 animate-pulse"
            }`}>
              <div className="flex items-center gap-3">
                {/* Airtel/MTN provider tag */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeMeta.newTx.provider === "Airtel Money"
                    ? "bg-[#E11900] text-white"
                    : "bg-[#FFCC00] text-[#001C3D]"
                }`}>
                  {activeMeta.newTx.provider === "Airtel Money" ? "A" : "M"}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#001C3D]">{activeMeta.newTx.name}</p>
                  <p className="text-xs text-[#545658]">{activeMeta.newTx.type} • {activeMeta.newTx.provider}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-[#001C3D]">+K{activeMeta.newTx.amount.toFixed(2)}</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                  simStep === "completed"
                    ? "bg-[#28A745]/15 text-[#28A745]"
                    : "bg-[#0070BA]/15 text-[#0070BA]"
                }`}>
                  {simStep === "completed" ? "Settled" : "Processing"}
                </span>
              </div>
            </div>
          )}

          {/* Historic Static Rows */}
          {activeMeta.history.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-[#EBEBEB] hover:bg-[#F5F7FA]/30 transition-all duration-150">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  tx.provider === "Airtel Money"
                    ? "bg-[#E11900] text-white"
                    : "bg-[#FFCC00] text-[#001C3D]"
                }`}>
                  {tx.provider === "Airtel Money" ? "A" : "M"}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#001C3D]">{tx.name}</p>
                  <p className="text-xs text-[#545658]">{tx.type} • {tx.provider}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-[#001C3D]">+K{tx.amount.toFixed(2)}</p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#28A745]/10 text-[#28A745]">
                  Settled
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Ledger Card Footer */}
        <div className="p-4 border-t border-[#EBEBEB] bg-white flex items-center justify-between text-xs text-[#545658]">
          <span className="flex items-center gap-1.5 font-light">
            <Check className="h-4 w-4 text-[#28A745]" />
            Direct API ledger reconciliation
          </span>
          <span className="font-mono text-[10px] text-gray-400">Ref ID: ZM-{groupType}-102</span>
        </div>
      </div>
    </div>
  );
}

export default function LiveLedger() {
  const [groupType, setGroupType] = useState<GroupType>("savings");

  return (
    <section id="demo-ledger" className="py-20 bg-[#F5F7FA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#001C3D] sm:text-4xl">
            Watch how payments post instantly.
          </h2>
          <p className="mt-4 text-[16px] text-[#2C2E2F] font-light leading-relaxed">
            Choose a cooperative type, trigger a mock handset payment, and see how the ledger updates automatically without any treasurer reconciliation steps.
          </p>
        </div>

        {/* Group Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
          {(["savings", "coop", "sacco"] as GroupType[]).map((type) => (
            <button
              key={type}
              onClick={() => setGroupType(type)}
              className={`px-6 py-3 rounded-full text-[14px] font-bold transition-all duration-150 cursor-pointer ${
                groupType === type
                  ? "bg-[#001C3D] text-white shadow-sm"
                  : "bg-white text-[#001C3D] hover:bg-[#F5F7FA] border border-[#EBEBEB]"
              }`}
              id={`tab-select-${type}`}
            >
              {groupMetadata[type].typeLabel}
            </button>
          ))}
        </div>

        {/* Interactive Layout Split (Keyed by groupType to reset state on tab switch) */}
        <LedgerSimulatorBoard key={groupType} groupType={groupType} />
      </div>
    </section>
  );
}
