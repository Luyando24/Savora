"use client";

import React from "react";
import Header from "../components/Header";
import CreateGroupForm from "../components/CreateGroupForm";
import Footer from "../components/Footer";

export default function CreateGroupPage() {
  return (
    <div className="flex flex-col min-h-screen bg-light-ice">
      {/* Navigation Header */}
      <Header />

      {/* Main Form Content Area */}
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Typography */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#001C3D] sm:text-4xl">
              Initialize Group Ledger
            </h1>
            <p className="mt-3 text-[16px] text-[#545658] font-light leading-relaxed">
              Digitize your savings group, agricultural cooperative, or SACCO in Zambia. Configure your custom rules and link your Airtel or MTN merchant wallet.
            </p>
          </div>

          {/* Form Step Wizard */}
          <CreateGroupForm />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
