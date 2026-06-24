"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/Header";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import GroupCards from "./components/GroupCards";
import TrustSection from "./components/TrustSection";
import LiveLedger from "./components/LiveLedger";
import Footer from "./components/Footer";
import { getSupabaseClient } from "./lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/login");
      }
    };
    checkSession();
  }, [router]);
  return (
    <div className="flex flex-col min-h-screen bg-light-ice">
      {/* Header Navigation */}
      <Header />

      {/* Main Page Layout */}
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />

        {/* Live Interactive Ledger Showcase */}
        <LiveLedger />

        {/* Step-by-Step flow explanation */}
        <HowItWorks />

        {/* Distinct Group Type Cards */}
        <GroupCards />

        {/* Custody, Safety and Transparency assurances */}
        <TrustSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
