"use client";

import React from "react";
import { Layers, Users, Activity, Wallet, Settings } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  variant: "treasurer" | "member";
}

export default function MobileBottomNav({ activeTab, onTabChange, variant }: MobileBottomNavProps) {
  const treasurerNavItems = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "members", label: "Members", icon: Users },
    { id: "contributions", label: "MoMo", icon: Activity },
    { id: "loans", label: "Loans", icon: Wallet },
    { id: "cycle", label: "Settings", icon: Settings },
  ];

  const memberNavItems = [
    { id: "overview", label: "Balance", icon: Layers },
    { id: "pay", label: "Pay", icon: Wallet },
    { id: "history", label: "History", icon: Activity },
    { id: "activity", label: "Activity", icon: Users },
  ];

  const navItems = variant === "treasurer" ? treasurerNavItems : memberNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBEB] md:hidden z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
                isActive 
                  ? "text-[#0070BA]" 
                  : "text-[#545658]/60 hover:text-[#545658]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
