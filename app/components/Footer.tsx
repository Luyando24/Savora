"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#EBEBEB] mt-auto py-16 text-[#545658]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top bar: logo + primary navigation links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#EBEBEB] pb-8 mb-8">
          {/* Logo & Name */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0070BA] text-white">
              <span className="font-display text-sm font-bold">s</span>
            </div>
            <span className="font-display text-lg font-bold text-[#001C3D]">
              sa<span className="text-[#0070BA] font-bold">vora</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-8 text-[14px] font-bold text-[#001C3D]">
            <Link href="#demo-ledger" className="hover:text-[#0070BA] transition-colors">
              How it works
            </Link>
            <Link href="#group-types" className="hover:text-[#0070BA] transition-colors">
              Group types
            </Link>
            <Link href="#security" className="hover:text-[#0070BA] transition-colors">
              Trust & Security
            </Link>
          </div>
        </div>

        {/* Bottom bar: legal, copyright and support */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-[13px] text-[#545658]">
          <div className="space-y-1.5 text-center lg:text-left font-light">
            <p className="font-normal text-[#001C3D]">© {new Date().getFullYear()} Savora. All rights reserved.</p>
            <p>Savora is a digital record-keeping system. Direct wallet transactions are processed and secured by registered mobile money operators.</p>
            <p>Contact Support: <a href="mailto:support@savora.co.zm" className="text-[#0070BA] hover:underline font-normal">support@savora.co.zm</a> | +260 971 234567</p>
          </div>

          {/* Network Badges info */}
          <div className="flex items-center gap-3 bg-[#F5F7FA] px-4 py-2.5 rounded-full border border-[#EBEBEB] shrink-0">
            <span className="font-bold text-[10px] uppercase tracking-wider text-[#545658]/60">Integration:</span>
            <div className="flex items-center gap-2 text-[12px] font-bold">
              <span className="text-[#E11900]">Airtel Money</span>
              <span className="h-3 w-px bg-gray-300" />
              <span className="text-[#001C3D] bg-[#FFCC00] px-1.5 py-0.5 rounded text-[10px]">MTN MoMo</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
