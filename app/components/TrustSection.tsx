"use client";

import React from "react";
import { ShieldCheck, Landmark, PiggyBank, RefreshCw } from "lucide-react";

export default function TrustSection() {
  const points = [
    {
      title: "No money pooling",
      description: "We never hold your group's money on our balance sheet. We have no access to your capital, and we do not pool client money into shared bank accounts.",
      icon: PiggyBank,
    },
    {
      title: "Group wallet custody",
      description: "All savings and loan capital reside directly in your group's registered MTN Mobile Money or Airtel Money merchant wallet. You maintain absolute custody.",
      icon: Landmark,
    },
    {
      title: "Direct settlement",
      description: "When a member approves a request-to-pay, their contribution flows directly to your group wallet. Savora only orchestrates the request and updates the ledger.",
      icon: RefreshCw,
    },
  ];

  return (
    <section id="security" className="py-24 bg-[#001C3D] text-white relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full border border-white/5 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Text Content */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              <ShieldCheck className="h-4 w-4 text-[#28A745]" />
              <span>Full Custody & Security</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl leading-tight">
              Where is our money stored?
            </h2>
            <p className="text-white/80 text-base leading-relaxed font-light">
              This is a real financial tool built on absolute transparency. We address the core question directly: <strong>Savora does not hold or store a single Kwacha.</strong>
            </p>
            <p className="text-white/70 text-sm leading-relaxed font-light">
              Our software serves purely as a digital record keeper. Every transaction settles directly through your own MTN MoMo and Airtel Money merchant wallets, maintaining the same security and control you have always trusted.
            </p>
          </div>

          {/* Points Grid */}
          <div className="lg:col-span-7 space-y-4">
            {points.map((point, index) => {
              const Icon = point.icon;
              return (
                <div key={index} className="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-[#0070BA]">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1.5">{point.title}</h3>
                    <p className="text-sm text-white/75 leading-relaxed font-light">{point.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
