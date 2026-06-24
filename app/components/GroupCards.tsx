"use client";

import React from "react";
import { Users, Sprout, Landmark, Check, Coins } from "lucide-react";

export default function GroupCards() {
  const groups = [
    {
      id: "group-savings",
      type: "Savings Groups (Chilimba)",
      problem: "Paper books get lost, and calculating weekly payouts by hand takes hours.",
      solution: "Tracks contributions automatically, keeps a digital record that every member sees, and flags payout orders when group rotation rounds complete.",
      features: [
        "Automatic member notification",
        "Clear payout order tracking",
        "Full contribution logs",
      ],
      icon: Users,
      badge: "Most Informal Groups",
    },
    {
      id: "group-agricultural",
      type: "Agricultural Cooperatives",
      problem: "Co-op shares and seasonal crop input dividends are difficult to distribute and audit.",
      solution: "Maintains clear registries of shares, validates member standing, and handles automated dividend disbursements through mobile money.",
      features: [
        "Share capital ledger",
        "Input dividend tracker",
        "Mobile disbursement list",
      ],
      icon: Sprout,
      badge: "Farming Communities",
    },
    {
      id: "group-sacco",
      type: "SACCOs & Credit Unions",
      problem: "Calculating loan interest, tracking collateral, and managing arrears on paper leads to defaults.",
      solution: "Enforces loan application steps, automatically calculates interest based on group rules, tracks payment schedules, and sends due date reminders.",
      features: [
        "Loan interest engine",
        "Collateral registries",
        "Payment plan calendars",
      ],
      icon: Landmark,
      badge: "Registered SACCOs",
    },
    {
      id: "group-general",
      type: "General Savings & Fundraising",
      problem: "Tracking custom fundraising targets, causes, or member contributions by chat gets messy.",
      solution: "Consolidates causes into one workspace, showing target progress indicators, flexible contribution support, and direct mobile money collection registers.",
      features: [
        "Flexible savings targets",
        "Target goal progress widgets",
        "Deadline-driven tracking",
      ],
      icon: Coins,
      badge: "Cause & Event Savings",
    },
  ];

  return (
    <section id="group-types" className="py-24 bg-[#F5F7FA] border-b border-[#EBEBEB]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#001C3D] sm:text-4xl">
            Built for your kind of group.
          </h2>
          <p className="mt-4 text-[17px] text-[#545658] font-light leading-relaxed">
            One shared system, tailored to fit the exact financial rules of your cooperative or savings club.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <div
                key={group.id}
                className="bg-white rounded-[20px] border border-[#EBEBEB] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
                id={group.id}
              >
                {/* Upper Body */}
                <div className="p-8">
                  {/* Badge & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[11px] font-bold text-[#0070BA] bg-[#0070BA]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                      {group.badge}
                    </span>
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#F5F7FA] text-[#001C3D]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-[#001C3D] mb-4">{group.type}</h3>

                  {/* Problem & Solution */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-[#545658]/60 uppercase tracking-wide">The Problem</p>
                      <p className="text-sm text-[#2C2E2F] mt-1 italic font-light">&ldquo;{group.problem}&rdquo;</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#0070BA] uppercase tracking-wide">The Solution</p>
                      <p className="text-sm text-[#545658] mt-1 leading-relaxed font-light">{group.solution}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Features */}
                <div className="bg-[#F5F7FA]/50 p-8 border-t border-[#EBEBEB] mt-auto">
                  <h4 className="text-[10px] font-bold text-[#001C3D] uppercase tracking-wider mb-4">Included Features</h4>
                  <ul className="space-y-3">
                    {group.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-[#545658] font-light">
                        <div className="h-5 w-5 rounded-full bg-[#0070BA]/10 flex items-center justify-center text-[#0070BA] shrink-0">
                          <Check className="h-3 w-3 stroke-[3px]" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
