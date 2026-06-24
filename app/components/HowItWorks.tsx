"use client";

import React from "react";
import { UserPlus, Smartphone, FileSpreadsheet, Percent } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      id: "step-1",
      number: "1",
      title: "Set up your group",
      description: "Define savings goals, interest rules, and add members by their registered Airtel or MTN phone numbers.",
      icon: UserPlus,
    },
    {
      id: "step-2",
      number: "2",
      title: "Approve via mobile PIN",
      description: "Members receive direct payment requests on their phones and confirm with their secure wallet PIN.",
      icon: Smartphone,
    },
    {
      id: "step-3",
      number: "3",
      title: "Instant ledger posting",
      description: "As soon as the mobile network completes the transaction, the group ledger updates instantly.",
      icon: FileSpreadsheet,
    },
    {
      id: "step-4",
      number: "4",
      title: "Audit and disburse",
      description: "Track loan outstanding balances, monitor arrears, and handle automated payouts directly.",
      icon: Percent,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white border-b border-[#EBEBEB]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#001C3D] sm:text-4xl">
            Simple. Transparent. Automated.
          </h2>
          <p className="mt-4 text-[17px] text-[#545658] font-light">
            Digitizing the manual ledger process in four clear steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={step.id} className="relative flex flex-col items-start bg-[#F5F7FA]/30 p-8 rounded-[20px] border border-[#EBEBEB] hover:border-[#0070BA]/30 transition-all duration-200" id={step.id}>
                {/* Connecting Line (Desktop) */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-[52px] left-[85%] right-[-15%] h-[1px] bg-gray-200 z-0" />
                )}

                {/* Icon Container */}
                <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#0070BA] text-white font-bold text-sm shadow-sm mb-6">
                  <IconComponent className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#001C3D] text-[10px] text-white font-bold">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-[#001C3D] mb-3">{step.title}</h3>
                <p className="text-sm text-[#545658] leading-relaxed font-light">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
