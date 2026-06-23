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
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0070BA] text-white shadow-sm font-display text-lg font-bold tracking-tight">
              s
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight text-[#001C3D]">
              sa<span className="text-[#0070BA] font-bold">vora</span>
            </span>
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
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-[14px] font-bold text-[#0070BA] border border-[#0070BA] hover:bg-[#0070BA]/5 px-6 py-2.5 rounded-full transition-all duration-150 active:scale-95"
            id="nav-login-btn"
          >
            Log In
          </Link>
          <Link
            href="/create-group"
            className="inline-flex items-center gap-2 bg-[#0070BA] text-white text-[14px] font-bold px-6 py-2.5 rounded-full hover:bg-[#005EA6] active:scale-95 transition-all duration-150"
            id="nav-signup-btn"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Sign Up</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
