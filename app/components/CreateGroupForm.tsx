"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Sprout, 
  Landmark, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Phone, 
  MapPin, 
  Coins, 
  User, 
  Calendar,
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface GroupFormData {
  type: "savings" | "agricultural" | "sacco";
  name: string;
  location: string;
  description: string;
  
  // Chilimba rules
  chilimbaContributionAmount: string;
  chilimbaFrequency: "weekly" | "monthly" | "anytime";
  chilimbaRotationMethod: "random" | "ordered" | "manual";
  chilimbaIsFlexibleContribution: boolean;
  chilimbaTargetGoal: string;
  
  // Co-op rules
  coopSharePrice: string;
  coopMaxShares: string;
  coopDividendCycle: "seasonal" | "semi-annual" | "annual";
  
  // SACCO rules
  saccoMinBalanceToBorrow: string;
  saccoInterestRate: string;
  saccoLoanTermMonths: string;
  
  // Mobile money wallet settings
  walletProvider: "mtn" | "airtel";
  walletNumber: string;
  walletHolderName: string;
  
  // Treasurer details
  treasurerName: string;
  treasurerEmail: string;
  treasurerPassword: string;
}

const initialFormData: GroupFormData = {
  type: "savings",
  name: "",
  location: "",
  description: "",
  
  chilimbaContributionAmount: "150",
  chilimbaFrequency: "weekly",
  chilimbaRotationMethod: "random",
  chilimbaIsFlexibleContribution: false,
  chilimbaTargetGoal: "6000",
  
  coopSharePrice: "200",
  coopMaxShares: "100",
  coopDividendCycle: "seasonal",
  
  saccoMinBalanceToBorrow: "500",
  saccoInterestRate: "5",
  saccoLoanTermMonths: "3",
  
  walletProvider: "mtn",
  walletNumber: "",
  walletHolderName: "",
  
  treasurerName: "",
  treasurerEmail: "",
  treasurerPassword: "",
};

const ZAMBIAN_CITIES = [
  "Lusaka", "Ndola", "Kitwe", "Kabwe", "Chingola", "Mufulira", 
  "Luanshya", "Livingstone", "Chipata", "Solwezi", "Kasama", 
  "Mansa", "Mongu", "Choma", "Mazabuka"
];

const cleanAndValidateZambianPhone = (phone: string): { isValid: boolean; normalized: string } => {
  // Remove spaces, dashes, parentheses, plus sign
  let cleaned = phone.replace(/[\s\-\(\)\+]+/g, "");
  
  // Normalize country code prefix to local 10-digit format
  if (cleaned.startsWith("2600") && cleaned.length === 13) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("260") && cleaned.length === 12) {
    cleaned = "0" + cleaned.slice(3);
  }
  
  // Validates 10-digit number starting with valid provider prefixes
  // Airtel: 097, 077, 057
  // MTN: 096, 076
  // Zamtel: 095, 075
  const isValid = /^(097|096|095|077|076|075|057)\d{7}$/.test(cleaned);
  return { isValid, normalized: cleaned };
};

export default function CreateGroupForm() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<GroupFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof GroupFormData | "general", string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState("");

  const updateField = (key: keyof GroupFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof GroupFormData | "general", string>> = {};

    if (currentStep === 1) {
      if (!formData.type) {
        newErrors.type = "Please select a group type.";
      }
    }

    if (currentStep === 2) {
      if (!formData.name.trim()) {
        newErrors.name = "Group Name is required.";
      } else if (formData.name.length < 3) {
        newErrors.name = "Group Name must be at least 3 characters.";
      }
      
      if (!formData.location) {
        newErrors.location = "Please select a location in Zambia.";
      }
    }

    if (currentStep === 3) {
      if (formData.type === "savings") {
        if (!formData.chilimbaIsFlexibleContribution) {
          const amt = parseFloat(formData.chilimbaContributionAmount);
          if (isNaN(amt) || amt <= 0) {
            newErrors.chilimbaContributionAmount = "Contribution amount must be a positive number.";
          }
        }
        const target = parseFloat(formData.chilimbaTargetGoal);
        if (isNaN(target) || target <= 0) {
          newErrors.chilimbaTargetGoal = "Target savings goal must be a positive number.";
        }
      } else if (formData.type === "agricultural") {
        const price = parseFloat(formData.coopSharePrice);
        const max = parseInt(formData.coopMaxShares);
        if (isNaN(price) || price <= 0) {
          newErrors.coopSharePrice = "Share price must be a positive number.";
        }
        if (isNaN(max) || max <= 0) {
          newErrors.coopMaxShares = "Maximum shares must be a positive integer.";
        }
      } else if (formData.type === "sacco") {
        const minBal = parseFloat(formData.saccoMinBalanceToBorrow);
        const rate = parseFloat(formData.saccoInterestRate);
        const term = parseInt(formData.saccoLoanTermMonths);
        if (isNaN(minBal) || minBal < 0) {
          newErrors.saccoMinBalanceToBorrow = "Minimum balance must be 0 or positive.";
        }
        if (isNaN(rate) || rate < 0) {
          newErrors.saccoInterestRate = "Interest rate must be 0 or positive.";
        }
        if (isNaN(term) || term <= 0) {
          newErrors.saccoLoanTermMonths = "Loan term must be at least 1 month.";
        }
      }
    }

    if (currentStep === 4) {
      const phoneValidation = cleanAndValidateZambianPhone(formData.walletNumber);

      if (!formData.walletNumber.trim()) {
        newErrors.walletNumber = "Mobile money wallet number is required.";
      } else if (!phoneValidation.isValid) {
        newErrors.walletNumber = "Enter a valid 10-digit Zambian mobile number (e.g. 097xxxxxxx, 096xxxxxxx, 076xxxxxxx, 077xxxxxxx, 057xxxxxxx).";
      } else {
        formData.walletNumber = phoneValidation.normalized;
      }

      if (!formData.walletHolderName.trim()) {
        newErrors.walletHolderName = "Registered wallet holder name is required.";
      }
    }

    if (currentStep === 5) {
      if (!formData.treasurerName.trim()) {
        newErrors.treasurerName = "Treasurer's name is required.";
      }

      if (!formData.treasurerEmail.trim()) {
        newErrors.treasurerEmail = "Treasurer's email address is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.treasurerEmail)) {
        newErrors.treasurerEmail = "Please enter a valid email address.";
      }

      if (!formData.treasurerPassword) {
        newErrors.treasurerPassword = "Password is required for credentials.";
      } else if (formData.treasurerPassword.length < 6) {
        newErrors.treasurerPassword = "Password must be at least 6 characters.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    try {
      const rules = {
        walletNumber: formData.walletNumber,
        walletProvider: formData.walletProvider,
        walletHolderName: formData.walletHolderName,
        ...(formData.type === "savings" ? {
          contributionAmount: formData.chilimbaIsFlexibleContribution ? 0 : (parseFloat(formData.chilimbaContributionAmount) || 0),
          frequency: formData.chilimbaFrequency,
          rotationMethod: formData.chilimbaRotationMethod,
          isFlexibleContribution: formData.chilimbaIsFlexibleContribution,
          targetGoal: parseFloat(formData.chilimbaTargetGoal) || 6000
        } : formData.type === "agricultural" ? {
          sharePrice: parseFloat(formData.coopSharePrice) || 0,
          maxShares: parseInt(formData.coopMaxShares) || 0,
          dividendCycle: formData.coopDividendCycle
        } : {
          minBalanceToBorrow: parseFloat(formData.saccoMinBalanceToBorrow) || 0,
          interestRate: parseFloat(formData.saccoInterestRate) || 0,
          loanTermMonths: parseInt(formData.saccoLoanTermMonths) || 0
        })
      };

      const response = await fetch("/api/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          location: formData.location,
          rules,
          treasurerName: formData.treasurerName,
          treasurerEmail: formData.treasurerEmail,
          treasurerPassword: formData.treasurerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create group.");
      }

      setCreatedGroupId(data.groupId);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Failed to initialize group ledger:", err);
      setErrors((prev) => ({ ...prev, general: err.message || "An unexpected error occurred." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get step headers
  const steps = [
    { title: "Group Type", desc: "Select structure" },
    { title: "Details", desc: "Name & location" },
    { title: "Rules", desc: "Contribution settings" },
    { title: "Wallet", desc: "Mobile money keys" },
    { title: "Review", desc: "Confirm settings" }
  ];

  if (isSuccess) {
    return (
      <div className="bg-white rounded-[24px] border border-[#EBEBEB] p-8 md:p-12 shadow-xl max-w-2xl mx-auto text-center animate-fade-in">
        <div className="mx-auto h-20 w-20 bg-[#28A745]/15 text-[#28A745] rounded-full flex items-center justify-center mb-6">
          <Check className="h-10 w-10 stroke-[3px]" />
        </div>
        <h2 className="text-3xl font-extrabold text-[#001C3D] tracking-tight">Group Created Successfully!</h2>
        <p className="mt-4 text-[#545658] font-light leading-relaxed max-w-md mx-auto">
          Your digital cooperative ledger for <strong className="font-semibold text-[#001C3D]">{formData.name}</strong> has been initialized.
        </p>

        {/* Ledger Initial State Summary */}
        <div className="mt-8 bg-[#F5F7FA] rounded-[16px] border border-[#EBEBEB] p-6 text-left max-w-md mx-auto">
          <h3 className="text-sm font-bold text-[#001C3D] uppercase tracking-wider mb-4 border-b border-[#EBEBEB] pb-2">
            Ledger Initialization Summary
          </h3>
          <dl className="space-y-2 text-sm text-[#545658]">
            <div className="flex justify-between">
              <dt className="font-light">Group Reference:</dt>
              <dd className="font-mono text-[#001C3D] font-semibold">{createdGroupId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-light">Structure:</dt>
              <dd className="capitalize text-[#001C3D] font-medium">{formData.type} Circle</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-light">Location:</dt>
              <dd className="text-[#001C3D] font-medium">{formData.location}, Zambia</dd>
            </div>
            <div className="flex justify-between border-t border-[#EBEBEB] pt-2 mt-2">
              <dt className="font-light">Mobile Money Wallet:</dt>
              <dd className="text-[#001C3D] font-medium flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${formData.walletProvider === "mtn" ? "bg-[#FFCC00]" : "bg-[#E11900]"}`} />
                <span className="capitalize">{formData.walletProvider}</span> ({formData.walletNumber})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-light">Rules Summary:</dt>
              <dd className="text-[#001C3D] font-medium text-right">
                {formData.type === "savings" && (formData.chilimbaIsFlexibleContribution 
                  ? `Flexible Contribution / member (${formData.chilimbaFrequency === "anytime" ? "Anytime" : formData.chilimbaFrequency})`
                  : `ZMW ${formData.chilimbaContributionAmount} / member (${formData.chilimbaFrequency === "anytime" ? "Anytime" : formData.chilimbaFrequency})`
                )}
                {formData.type === "agricultural" && `ZMW ${formData.coopSharePrice} share price, max ${formData.coopMaxShares} shares`}
                {formData.type === "sacco" && `ZMW ${formData.saccoMinBalanceToBorrow} min bal, ${formData.saccoInterestRate}% interest`}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.href = "/"}
            className="px-8 py-3.5 rounded-full border border-[#0070BA] text-[#0070BA] font-bold hover:bg-[#0070BA]/5 active:scale-95 transition-all text-sm"
          >
            Back to Home
          </button>
          <button
            onClick={() => {
              router.push(
                `/dashboard?id=${createdGroupId}&type=${formData.type}&name=${encodeURIComponent(
                  formData.name
                )}&wallet=${formData.walletNumber}&provider=${formData.walletProvider}&location=${encodeURIComponent(
                  formData.location
                )}`
              );
            }}
            className="px-8 py-3.5 rounded-full bg-[#0070BA] text-white font-bold hover:bg-[#005EA6] active:scale-95 transition-all shadow-sm text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Wizard Header Indicators */}
      <div className="mb-10 block">
        <div className="flex items-center justify-between relative">
          {/* Progress bar line background */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#EBEBEB] -translate-y-1/2 z-0 rounded-full" />
          
          {/* Active progress bar line */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-[#0070BA] -translate-y-1/2 z-0 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((s, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < step;
            const isActive = stepNum === step;
            
            return (
              <div key={index} className="flex flex-col items-center relative z-10">
                <button
                  type="button"
                  onClick={() => stepNum < step && setStep(stepNum)}
                  disabled={stepNum >= step}
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                    isCompleted 
                      ? "bg-[#28A745] text-white border-2 border-[#28A745] shadow-sm cursor-pointer" 
                      : isActive 
                        ? "bg-[#0070BA] text-white border-4 border-white ring-2 ring-[#0070BA] shadow-md" 
                        : "bg-white text-[#545658] border-2 border-[#EBEBEB]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[3px]" />
                  ) : (
                    stepNum
                  )}
                </button>
                <div className="hidden sm:block text-center mt-2.5">
                  <p className={`text-xs font-bold ${isActive ? "text-[#001C3D]" : "text-[#545658]"}`}>{s.title}</p>
                  <p className="text-[10px] text-[#545658]/70 font-light mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-[24px] border border-[#EBEBEB] shadow-md p-6 md:p-10">
        
        {/* Step 1: Select Group Type */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-[#001C3D] tracking-tight">Select your group model</h2>
              <p className="text-sm text-[#545658] font-light mt-1">
                Choose the model that matches how your members save, loan, and share capital.
              </p>
              {errors.type && (
                <div className="mt-4 flex items-center gap-2 text-sm text-[#E11900] bg-[#E11900]/10 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.type}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Option 1: Chilimba */}
              <div
                onClick={() => updateField("type", "savings")}
                className={`group border rounded-[20px] p-6 cursor-pointer transition-all duration-150 relative ${
                  formData.type === "savings"
                    ? "border-[#0070BA] bg-[#0070BA]/5 ring-1 ring-[#0070BA]"
                    : "border-[#EBEBEB] hover:border-gray-300 bg-white"
                }`}
              >
                {formData.type === "savings" && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-[#0070BA] text-white flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                  </div>
                )}
                <div className="h-12 w-12 rounded-xl bg-[#0070BA]/10 text-[#0070BA] flex items-center justify-center mb-6">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#001C3D] mb-2">Savings Group (Chilimba)</h3>
                <p className="text-xs text-[#545658] font-light leading-relaxed mb-4">
                  For informal savings circles where members contribute fixed amounts regularly and payout rotated amounts.
                </p>
                <div className="border-t border-[#EBEBEB] pt-4 mt-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0070BA] bg-[#0070BA]/10 px-2 py-0.5 rounded">
                    Popular Model
                  </span>
                </div>
              </div>

              {/* Option 2: Agricultural Cooperative */}
              <div
                onClick={() => updateField("type", "agricultural")}
                className={`group border rounded-[20px] p-6 cursor-pointer transition-all duration-150 relative ${
                  formData.type === "agricultural"
                    ? "border-[#0070BA] bg-[#0070BA]/5 ring-1 ring-[#0070BA]"
                    : "border-[#EBEBEB] hover:border-gray-300 bg-white"
                }`}
              >
                {formData.type === "agricultural" && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-[#0070BA] text-white flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                  </div>
                )}
                <div className="h-12 w-12 rounded-xl bg-success-green/10 text-success-green flex items-center justify-center mb-6">
                  <Sprout className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#001C3D] mb-2">Agricultural Cooperative</h3>
                <p className="text-xs text-[#545658] font-light leading-relaxed mb-4">
                  For agricultural communities tracking crop input contributions, member share capital, and harvest payouts.
                </p>
                <div className="border-t border-[#EBEBEB] pt-4 mt-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#28A745] bg-[#28A745]/10 px-2 py-0.5 rounded">
                    Co-op Structure
                  </span>
                </div>
              </div>

              {/* Option 3: SACCO */}
              <div
                onClick={() => updateField("type", "sacco")}
                className={`group border rounded-[20px] p-6 cursor-pointer transition-all duration-150 relative ${
                  formData.type === "sacco"
                    ? "border-[#0070BA] bg-[#0070BA]/5 ring-1 ring-[#0070BA]"
                    : "border-[#EBEBEB] hover:border-gray-300 bg-white"
                }`}
              >
                {formData.type === "sacco" && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-[#0070BA] text-white flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                  </div>
                )}
                <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                  <Landmark className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#001C3D] mb-2">SACCO & Credit Union</h3>
                <p className="text-xs text-[#545658] font-light leading-relaxed mb-4">
                  For savings and credit co-ops handling member loans, interest rates, repayment schedules, and collateral.
                </p>
                <div className="border-t border-[#EBEBEB] pt-4 mt-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                    Formal SACCO
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Basic Details */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-extrabold text-[#001C3D] tracking-tight">Tell us about your group</h2>
              <p className="text-sm text-[#545658] font-light mt-1">
                Provide a name and location to initialize your group profile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Group Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="group-name" className="text-sm font-bold text-[#001C3D]">
                  Group Name
                </label>
                <input
                  type="text"
                  id="group-name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Tusunge Savings Circle"
                  className={`border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                    errors.name ? "border-[#E11900] bg-[#E11900]/5" : "border-[#EBEBEB]"
                  }`}
                />
                {errors.name && <span className="text-xs text-[#E11900] font-medium">{errors.name}</span>}
              </div>

              {/* Location Selection */}
              <div className="flex flex-col gap-2">
                <label htmlFor="group-location" className="text-sm font-bold text-[#001C3D]">
                  Primary Location (Zambia)
                </label>
                <div className="relative">
                  <select
                    id="group-location"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] appearance-none bg-white ${
                      errors.location ? "border-[#E11900] bg-[#E11900]/5" : "border-[#EBEBEB]"
                    }`}
                  >
                    <option value="">Select a city/town</option>
                    {ZAMBIAN_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <MapPin className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.location && <span className="text-xs text-[#E11900] font-medium">{errors.location}</span>}
              </div>
            </div>

            {/* Currency Locking notification */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#001C3D]">Currency</label>
              <div className="bg-[#F5F7FA] border border-[#EBEBEB] rounded-lg p-3 flex items-center justify-between text-sm text-[#545658]">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[#0070BA]" />
                  <span className="font-semibold text-[#001C3D]">ZMW - Zambian Kwacha</span>
                </div>
                <span className="text-[11px] font-bold text-[#0070BA] bg-[#0070BA]/10 px-2 py-0.5 rounded uppercase">
                  Default Currency
                </span>
              </div>
              <p className="text-[11px] text-[#545658]/70 font-light">
                We handle transactions in ZMW to support Airtel and MTN Mobile Money networks within Zambia.
              </p>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="group-desc" className="text-sm font-bold text-[#001C3D]">
                Group Description (Optional)
              </label>
              <textarea
                id="group-desc"
                rows={3}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe your group's goals, meeting dates, or rules..."
                className="border border-[#EBEBEB] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA]"
              />
            </div>
          </div>
        )}

        {/* Step 3: Group Rules */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            {/* Rules header */}
            <div>
              <h2 className="text-2xl font-extrabold text-[#001C3D] tracking-tight">Configure Group Rules</h2>
              <p className="text-sm text-[#545658] font-light mt-1">
                Customize the contribution rates and parameters for your {formData.type === "savings" ? "Chilimba Circle" : formData.type === "agricultural" ? "Cooperative" : "SACCO"}.
              </p>
            </div>

            {/* Conditional Fields: Savings (Chilimba) */}
            {formData.type === "savings" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contribution amount */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="chilimba-amt" className="text-sm font-bold text-[#001C3D]">
                    Contribution Amount (ZMW)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-sm text-[#545658] font-semibold">ZMW</span>
                    <input
                      type="number"
                      id="chilimba-amt"
                      value={formData.chilimbaIsFlexibleContribution ? "" : formData.chilimbaContributionAmount}
                      disabled={formData.chilimbaIsFlexibleContribution}
                      onChange={(e) => updateField("chilimbaContributionAmount", e.target.value)}
                      placeholder={formData.chilimbaIsFlexibleContribution ? "Flexible (Any Amount)" : "150"}
                      className={`w-full border rounded-lg p-3 pl-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] disabled:bg-slate-50 disabled:text-slate-400 ${
                        errors.chilimbaContributionAmount ? "border-[#E11900]" : "border-[#EBEBEB]"
                      }`}
                    />
                  </div>
                  {errors.chilimbaContributionAmount && <span className="text-xs text-[#E11900] font-medium">{errors.chilimbaContributionAmount}</span>}
                </div>

                {/* Target savings goal */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="chilimba-target-goal" className="text-sm font-bold text-[#001C3D]">
                    Target Savings Goal (ZMW)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-sm text-[#545658] font-semibold">ZMW</span>
                    <input
                      type="number"
                      id="chilimba-target-goal"
                      value={formData.chilimbaTargetGoal}
                      onChange={(e) => updateField("chilimbaTargetGoal", e.target.value)}
                      placeholder="6000"
                      className={`w-full border rounded-lg p-3 pl-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                        errors.chilimbaTargetGoal ? "border-[#E11900]" : "border-[#EBEBEB]"
                      }`}
                    />
                  </div>
                  {errors.chilimbaTargetGoal && <span className="text-xs text-[#E11900] font-medium">{errors.chilimbaTargetGoal}</span>}
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="chilimba-flexible"
                    checked={formData.chilimbaIsFlexibleContribution}
                    onChange={(e) => updateField("chilimbaIsFlexibleContribution", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#0070BA] focus:ring-[#0070BA] cursor-pointer"
                  />
                  <label htmlFor="chilimba-flexible" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Allow members to deposit any amount (disable fixed contribution)
                  </label>
                </div>

                {/* Frequency */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="chilimba-freq" className="text-sm font-bold text-[#001C3D]">
                    Contribution Frequency
                  </label>
                  <div className="relative">
                    <select
                      id="chilimba-freq"
                      value={formData.chilimbaFrequency}
                      onChange={(e) => updateField("chilimbaFrequency", e.target.value as any)}
                      className="w-full border border-[#EBEBEB] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] appearance-none bg-white"
                    >
                      <option value="weekly">Every Week (Weekly)</option>
                      <option value="monthly">Every Month (Monthly)</option>
                      <option value="anytime">Anytime (On-demand / Flexible)</option>
                    </select>
                    <Calendar className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Payout Rotation Order */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-bold text-[#001C3D] mb-1">
                    Payout Rotation Order Method
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      onClick={() => updateField("chilimbaRotationMethod", "random")}
                      className={`border rounded-xl p-4 cursor-pointer text-left transition-all ${
                        formData.chilimbaRotationMethod === "random"
                          ? "border-[#0070BA] bg-[#0070BA]/5"
                          : "border-[#EBEBEB] hover:border-gray-300"
                      }`}
                    >
                      <p className="text-xs font-bold text-[#001C3D]">Random Draw</p>
                      <p className="text-[11px] text-[#545658] font-light mt-1">System draws a random member order at cycle start.</p>
                    </div>
                    <div 
                      onClick={() => updateField("chilimbaRotationMethod", "ordered")}
                      className={`border rounded-xl p-4 cursor-pointer text-left transition-all ${
                        formData.chilimbaRotationMethod === "ordered"
                          ? "border-[#0070BA] bg-[#0070BA]/5"
                          : "border-[#EBEBEB] hover:border-gray-300"
                      }`}
                    >
                      <p className="text-xs font-bold text-[#001C3D]">Custom Ordered List</p>
                      <p className="text-[11px] text-[#545658] font-light mt-1">The treasurer manual orders members in a priority sequence.</p>
                    </div>
                    <div 
                      onClick={() => updateField("chilimbaRotationMethod", "manual")}
                      className={`border rounded-xl p-4 cursor-pointer text-left transition-all ${
                        formData.chilimbaRotationMethod === "manual"
                          ? "border-[#0070BA] bg-[#0070BA]/5"
                          : "border-[#EBEBEB] hover:border-gray-300"
                      }`}
                    >
                      <p className="text-xs font-bold text-[#001C3D]">Manual Payouts</p>
                      <p className="text-[11px] text-[#545658] font-light mt-1">Distributed dynamically based on consensus or request.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Fields: Agricultural Cooperative */}
            {formData.type === "agricultural" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Share Price */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="coop-price" className="text-sm font-bold text-[#001C3D]">
                    Share Capital Price (ZMW)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-sm text-[#545658] font-semibold">ZMW</span>
                    <input
                      type="number"
                      id="coop-price"
                      value={formData.coopSharePrice}
                      onChange={(e) => updateField("coopSharePrice", e.target.value)}
                      className={`w-full border rounded-lg p-3 pl-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                        errors.coopSharePrice ? "border-[#E11900]" : "border-[#EBEBEB]"
                      }`}
                    />
                  </div>
                  {errors.coopSharePrice && <span className="text-xs text-[#E11900] font-medium">{errors.coopSharePrice}</span>}
                </div>

                {/* Max Shares */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="coop-max" className="text-sm font-bold text-[#001C3D]">
                    Maximum Shares Per Member
                  </label>
                  <input
                    type="number"
                    id="coop-max"
                    value={formData.coopMaxShares}
                    onChange={(e) => updateField("coopMaxShares", e.target.value)}
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                      errors.coopMaxShares ? "border-[#E11900]" : "border-[#EBEBEB]"
                    }`}
                  />
                  {errors.coopMaxShares && <span className="text-xs text-[#E11900] font-medium">{errors.coopMaxShares}</span>}
                </div>

                {/* Dividend Cycle */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label htmlFor="coop-cycle" className="text-sm font-bold text-[#001C3D]">
                    Dividend Distribution Cycle
                  </label>
                  <div className="relative">
                    <select
                      id="coop-cycle"
                      value={formData.coopDividendCycle}
                      onChange={(e) => updateField("coopDividendCycle", e.target.value as any)}
                      className="w-full border border-[#EBEBEB] rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] appearance-none bg-white"
                    >
                      <option value="seasonal">Seasonal Harvest Settlement</option>
                      <option value="semi-annual">Bi-annual Dividend (Every 6 months)</option>
                      <option value="annual">Annual Cooperative Settlement (Yearly)</option>
                    </select>
                    <Calendar className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Fields: SACCO */}
            {formData.type === "sacco" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Min Balance */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="sacco-min" className="text-sm font-bold text-[#001C3D]">
                    Min Balance to Borrow
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-sm text-[#545658] font-semibold">ZMW</span>
                    <input
                      type="number"
                      id="sacco-min"
                      value={formData.saccoMinBalanceToBorrow}
                      onChange={(e) => updateField("saccoMinBalanceToBorrow", e.target.value)}
                      className={`w-full border rounded-lg p-3 pl-12 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                        errors.saccoMinBalanceToBorrow ? "border-[#E11900]" : "border-[#EBEBEB]"
                      }`}
                    />
                  </div>
                  {errors.saccoMinBalanceToBorrow && <span className="text-xs text-[#E11900] font-medium">{errors.saccoMinBalanceToBorrow}</span>}
                </div>

                {/* Interest Rate */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="sacco-rate" className="text-sm font-bold text-[#001C3D]">
                    Interest Rate Per Cycle
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="sacco-rate"
                      value={formData.saccoInterestRate}
                      onChange={(e) => updateField("saccoInterestRate", e.target.value)}
                      className={`w-full border rounded-lg p-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                        errors.saccoInterestRate ? "border-[#E11900]" : "border-[#EBEBEB]"
                      }`}
                    />
                    <span className="absolute right-3 top-3.5 text-sm text-[#545658] font-semibold">%</span>
                  </div>
                  {errors.saccoInterestRate && <span className="text-xs text-[#E11900] font-medium">{errors.saccoInterestRate}</span>}
                </div>

                {/* Loan Term */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="sacco-term" className="text-sm font-bold text-[#001C3D]">
                    Max Loan Duration
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="sacco-term"
                      value={formData.saccoLoanTermMonths}
                      onChange={(e) => updateField("saccoLoanTermMonths", e.target.value)}
                      className={`w-full border rounded-lg p-3 pr-16 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                        errors.saccoLoanTermMonths ? "border-[#E11900]" : "border-[#EBEBEB]"
                      }`}
                    />
                    <span className="absolute right-3 top-3.5 text-sm text-[#545658] font-light">Months</span>
                  </div>
                  {errors.saccoLoanTermMonths && <span className="text-xs text-[#E11900] font-medium">{errors.saccoLoanTermMonths}</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Mobile Money Wallet Setup */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            {/* Wallet header */}
            <div>
              <h2 className="text-2xl font-extrabold text-[#001C3D] tracking-tight">Configure Group Merchant Wallet</h2>
              <p className="text-sm text-[#545658] font-light mt-1">
                Savora is zero-custody. Funds are deposited directly to and disbursed from your group's mobile money merchant wallet.
              </p>
            </div>

            {/* Provider selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#001C3D]">Mobile Money Operator</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MTN MoMo card selection */}
                <div
                  onClick={() => updateField("walletProvider", "mtn")}
                  className={`border rounded-xl p-4 cursor-pointer text-left transition-all flex items-center justify-between ${
                    formData.walletProvider === "mtn"
                      ? "border-[#FFCC00] bg-[#FFCC00]/5 ring-1 ring-[#FFCC00]"
                      : "border-[#EBEBEB] hover:border-gray-300"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-[#001C3D]">MTN Mobile Money</span>
                    <p className="text-[10px] text-[#545658] font-light mt-0.5">Supports MoMo open APIs & Collections.</p>
                  </div>
                  <div className="bg-[#FFCC00] text-[#001C3D] text-[10px] font-bold px-2 py-1 rounded">MTN</div>
                </div>

                {/* Airtel Money selection */}
                <div
                  onClick={() => updateField("walletProvider", "airtel")}
                  className={`border rounded-xl p-4 cursor-pointer text-left transition-all flex items-center justify-between ${
                    formData.walletProvider === "airtel"
                      ? "border-[#E11900] bg-[#E11900]/5 ring-1 ring-[#E11900]"
                      : "border-[#EBEBEB] hover:border-gray-300"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-[#001C3D]">Airtel Money Zambia</span>
                    <p className="text-[10px] text-[#545658] font-light mt-0.5">Supports Airtel collections & disbursements.</p>
                  </div>
                  <div className="bg-[#E11900] text-white text-[10px] font-bold px-2 py-1 rounded">Airtel</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wallet Number */}
              <div className="flex flex-col gap-2">
                <label htmlFor="wallet-num" className="text-sm font-bold text-[#001C3D]">
                  Merchant Wallet / Collections Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="wallet-num"
                    value={formData.walletNumber}
                    onChange={(e) => updateField("walletNumber", e.target.value)}
                    placeholder="e.g. 0977123456"
                    className={`w-full border rounded-lg p-3 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                      errors.walletNumber ? "border-[#E11900] bg-[#E11900]/5" : "border-[#EBEBEB]"
                    }`}
                  />
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.walletNumber && <span className="text-xs text-[#E11900] font-medium">{errors.walletNumber}</span>}
              </div>

              {/* Wallet Owner Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="wallet-name" className="text-sm font-bold text-[#001C3D]">
                  Registered Wallet Holder Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="wallet-name"
                    value={formData.walletHolderName}
                    onChange={(e) => updateField("walletHolderName", e.target.value)}
                    placeholder="e.g. Tusunge Cooperative Wallet"
                    className={`w-full border rounded-lg p-3 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                      errors.walletHolderName ? "border-[#E11900] bg-[#E11900]/5" : "border-[#EBEBEB]"
                    }`}
                  />
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.walletHolderName && <span className="text-xs text-[#E11900] font-medium">{errors.walletHolderName}</span>}
              </div>
            </div>

            {/* Zero Custody Warning Box */}
            <div className="bg-[#F5F7FA] border border-[#EBEBEB] rounded-xl p-4 flex gap-3 text-xs text-[#545658] leading-relaxed">
              <HelpCircle className="h-5 w-5 text-[#0070BA] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#001C3D] font-bold">Important Wallet Verification Note:</strong>
                <p className="mt-1 font-light">
                  Savora acts as a ledger management system. For safety, this merchant wallet must be owned by your group or its Trustees. Members will see this holder name during mobile money prompt authorizations. We will verify the phone credentials via SMS test OTP prior to cycle start.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirm */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            {/* Review header */}
            <div>
              <h2 className="text-2xl font-extrabold text-[#001C3D] tracking-tight">Review & Initialize Ledger</h2>
              <p className="text-sm text-[#545658] font-light mt-1">
                Confirm your parameters below. These settings will structure the cryptographic records and cycle rules on creation.
              </p>
            </div>

            {errors.general && (
              <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-xl border border-red-100 font-medium">
                {errors.general}
              </div>
            )}

            {/* Structured review card */}
            <div className="border border-[#EBEBEB] rounded-[20px] overflow-hidden">
              {/* Header inside review card */}
              <div className="bg-[#F5F7FA] p-6 border-b border-[#EBEBEB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0070BA] bg-[#0070BA]/10 px-2.5 py-1 rounded-full">
                    {formData.type === "savings" ? "Savings Group (Chilimba)" : formData.type === "agricultural" ? "Agricultural Cooperative" : "SACCO"}
                  </span>
                  <h3 className="text-xl font-extrabold text-[#001C3D] mt-2">{formData.name}</h3>
                </div>
                <div className="flex items-center gap-1 text-sm text-[#545658]">
                  <MapPin className="h-4 w-4 text-[#0070BA]" />
                  <span>{formData.location}, Zambia</span>
                </div>
              </div>

              {/* Grid content inside review card */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#545658]">
                {/* Left Col: Setup rules */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#001C3D] uppercase tracking-wider border-b border-[#EBEBEB] pb-2">
                    Cycle Rules
                  </h4>
                  {formData.type === "savings" && (
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-light">Contribution:</dt>
                        <dd className="font-semibold text-[#001C3D]">{formData.chilimbaIsFlexibleContribution ? "Flexible (Any Amount)" : `ZMW ${formData.chilimbaContributionAmount}`}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-light">Target Goal:</dt>
                        <dd className="font-semibold text-[#001C3D]">ZMW {formData.chilimbaTargetGoal}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-light">Frequency:</dt>
                        <dd className="capitalize font-semibold text-[#001C3D]">
                          {formData.chilimbaFrequency === "anytime" ? "Anytime (On-demand)" : formData.chilimbaFrequency}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-light">Payout Order:</dt>
                        <dd className="capitalize font-semibold text-[#001C3D]">{formData.chilimbaRotationMethod} Rotation</dd>
                      </div>
                    </dl>
                  )}

                  {formData.type === "agricultural" && (
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-light">Share price:</dt>
                        <dd className="font-semibold text-[#001C3D]">ZMW {formData.coopSharePrice}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-light">Max shares/member:</dt>
                        <dd className="font-semibold text-[#001C3D]">{formData.coopMaxShares} shares</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-light">Payout settlement:</dt>
                        <dd className="capitalize font-semibold text-[#001C3D]">{formData.coopDividendCycle}</dd>
                      </div>
                    </dl>
                  )}

                  {formData.type === "sacco" && (
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-light">Min share balance:</dt>
                        <dd className="font-semibold text-[#001C3D]">ZMW {formData.saccoMinBalanceToBorrow}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-light">Interest Rate:</dt>
                        <dd className="font-semibold text-[#001C3D]">{formData.saccoInterestRate}% per cycle</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-light">Loan Term:</dt>
                        <dd className="font-semibold text-[#001C3D]">{formData.saccoLoanTermMonths} Months</dd>
                      </div>
                    </dl>
                  )}
                </div>

                {/* Right Col: Wallet Settings */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#001C3D] uppercase tracking-wider border-b border-[#EBEBEB] pb-2">
                    Mobile Money Wallet
                  </h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="font-light">Operator:</dt>
                      <dd className="uppercase font-semibold text-[#001C3D]">{formData.walletProvider}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-light">Wallet number:</dt>
                      <dd className="font-semibold text-[#001C3D]">{formData.walletNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-light">Wallet Holder Name:</dt>
                      <dd className="font-semibold text-[#001C3D]">{formData.walletHolderName}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Treasurer fields */}
            <div className="border-t border-[#EBEBEB] pt-6 space-y-4">
              <h4 className="text-sm font-bold text-[#001C3D]">Primary Group Administrator (Treasurer)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Admin name */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="treasurer-name" className="text-xs font-bold text-[#545658]">
                    Treasurer Full Name
                  </label>
                  <input
                    type="text"
                    id="treasurer-name"
                    value={formData.treasurerName}
                    onChange={(e) => updateField("treasurerName", e.target.value)}
                    placeholder="e.g. Mwansa Kalunga"
                    className={`border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                      errors.treasurerName ? "border-[#E11900]" : "border-[#EBEBEB]"
                    }`}
                  />
                  {errors.treasurerName && <span className="text-xs text-[#E11900] font-medium">{errors.treasurerName}</span>}
                </div>

                {/* Admin email */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="treasurer-email" className="text-xs font-bold text-[#545658]">
                    Treasurer Email Address
                  </label>
                  <input
                    type="email"
                    id="treasurer-email"
                    value={formData.treasurerEmail}
                    onChange={(e) => updateField("treasurerEmail", e.target.value)}
                    placeholder="mwansa@example.com"
                    className={`border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                      errors.treasurerEmail ? "border-[#E11900]" : "border-[#EBEBEB]"
                    }`}
                  />
                  {errors.treasurerEmail && <span className="text-xs text-[#E11900] font-medium">{errors.treasurerEmail}</span>}
                </div>

                {/* Admin password */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="treasurer-password" className="text-xs font-bold text-[#545658]">
                    Create Login Password
                  </label>
                  <input
                    type="password"
                    id="treasurer-password"
                    value={formData.treasurerPassword}
                    onChange={(e) => updateField("treasurerPassword", e.target.value)}
                    placeholder="Min 6 characters"
                    className={`border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0070BA] ${
                      errors.treasurerPassword ? "border-[#E11900]" : "border-[#EBEBEB]"
                    }`}
                  />
                  {errors.treasurerPassword && <span className="text-xs text-[#E11900] font-medium">{errors.treasurerPassword}</span>}
                </div>
              </div>
            </div>

            {/* Agreement note */}
            <p className="text-[11px] text-[#545658]/70 leading-relaxed font-light">
              By initializing the ledger, you agree that Savora is a software interface and that the mobile money wallet credentials provided are correct. Transactions will reflect live balance data from the wallet networks.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-10 border-t border-[#EBEBEB] pt-6 flex justify-between items-center">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#545658] border border-[#EBEBEB] hover:bg-gray-50 px-6 py-3 rounded-full active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 bg-[#0070BA] text-white text-sm font-bold px-8 py-3 rounded-full hover:bg-[#005EA6] active:scale-95 transition-all duration-150"
            >
              <span>Next Step</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-[#FFC439] hover:bg-[#F2B522] text-[#001C3D] text-sm font-extrabold px-10 py-3 rounded-full active:scale-95 transition-all duration-150 disabled:opacity-75 shadow-sm hover:shadow"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-[#001C3D] border-t-transparent rounded-full animate-spin" />
                  <span>Initializing Ledger...</span>
                </>
              ) : (
                <>
                  <span>Create Group</span>
                  <Check className="h-4 w-4 stroke-[3px]" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
