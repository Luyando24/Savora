"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative bg-[#FFFFFF] pt-20 pb-24 lg:pt-28 lg:pb-32 border-b border-[#EBEBEB]">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 left-0 h-[500px] bg-gradient-to-b from-[#F5F7FA] to-transparent pointer-events-none z-0" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center lg:max-w-4xl lg:mx-auto">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0070BA]/10 px-4 py-1.5 text-[13px] font-bold tracking-wide text-[#0070BA] mb-8">
            <ShieldCheck className="h-4 w-4" />
            <span>Guaranteed Direct Wallet Settlements</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#001C3D] sm:text-5xl lg:text-6xl leading-[1.1] max-w-3xl">
            The secure way to save, borrow, and grow together.
          </h1>

          {/* Subheading */}
          <p className="mt-8 text-lg sm:text-xl text-[#2C2E2F] leading-relaxed max-w-2xl font-light">
            Digitize your savings circle, cooperative, or SACCO. Request contributions via Airtel Money and MTN MoMo, and track every Kwacha automatically in your group ledger.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              href="/create-group"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FFC439] hover:bg-[#F2B522] text-[#001C3D] text-[16px] font-extrabold px-10 py-4 rounded-full transition-all duration-150 active:scale-95 shadow-sm hover:shadow"
              id="hero-create-btn"
            >
              <span>Create a Group for Free</span>
              <ArrowRight className="h-4 w-4 stroke-[3px]" />
            </Link>
            <Link
              href="#demo-ledger"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-gray-50 text-[#0070BA] border border-[#0070BA] text-[16px] font-bold px-10 py-4 rounded-full transition-all duration-150 active:scale-95"
              id="hero-demo-btn"
            >
              <span>Watch Live Demo</span>
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-[#2C2E2F]/70 border-t border-[#EBEBEB] pt-8 w-full max-w-xl">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success-green"></span>
              No deposit fees
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success-green"></span>
              Zero-custody security
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success-green"></span>
              Real-time SMS alerts
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
