"use client";

import React, { Suspense } from "react";
import InviteView from "./InviteView";

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F7FA]">
          <div className="h-10 w-10 border-4 border-[#0070BA] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-medium text-sm text-slate-600 font-sans">Loading invitation details...</p>
        </div>
      }
    >
      <InviteView />
    </Suspense>
  );
}
