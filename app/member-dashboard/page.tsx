"use client";

import React, { Suspense } from "react";
import MemberDashboardView from "../components/MemberDashboardView";

export default function MemberDashboardPage() {
  return (
    <div className="h-screen w-screen bg-[#F5F7FA] overflow-hidden flex flex-col">
      <Suspense 
        fallback={
          <div className="flex flex-col items-center justify-center flex-grow text-slate-ink">
            <div className="h-10 w-10 border-4 border-[#0070BA] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-medium text-sm">Loading member profile...</p>
          </div>
        }
      >
        <MemberDashboardView />
      </Suspense>
    </div>
  );
}
