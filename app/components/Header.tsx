"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#EBEBEB] bg-white">
      <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Logo & Navigation */}
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group" id="logo-link">
            <span className="font-display text-3xl font-black tracking-tight text-black">SAVORA</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-[15px] font-bold text-[#001C3D]">
            <Link href="/#demo-ledger" className="text-[#001C3D] hover:text-[#0070BA] transition-colors" id="nav-demo-ledger">
              How it works
            </Link>
            <Link href="/#group-types" className="text-[#001C3D] hover:text-[#0070BA] transition-colors" id="nav-group-types">
              Group types
            </Link>
            <Link href="/#security" className="text-[#001C3D] hover:text-[#0070BA] transition-colors" id="nav-security">
              Trust & Security
            </Link>
          </nav>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="text-xs sm:text-[14px] font-bold text-[#0070BA] border border-[#0070BA] hover:bg-[#0070BA]/5 px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-full transition-all duration-150 active:scale-95 shrink-0"
            id="nav-login-btn"
          >
            Log In
          </Link>
          <Link
            href="/create-group"
            className="inline-flex items-center gap-1 sm:gap-2 bg-[#0070BA] text-white text-xs sm:text-[14px] font-bold px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-full hover:bg-[#005EA6] active:scale-95 transition-all duration-150 shrink-0"
            id="nav-signup-btn"
          >
            <ShieldCheck className="h-3.5 w-3.5 hidden sm:inline" />
            <span>Sign Up</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
