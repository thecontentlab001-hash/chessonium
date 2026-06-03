"use client";

import React, { useState, useEffect } from "react";
import { Check, X, ShieldCheck, Sparkles, CreditCard, RefreshCw } from "lucide-react";

export default function PricingPage() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");
  const [isPremium, setIsPremium] = useState(false);
  
  // Checkout form details
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  useEffect(() => {
    const checkPremium = () => {
      setIsPremium(localStorage.getItem("premium_unlocked") === "true");
    };
    checkPremium();
    window.addEventListener("storage", checkPremium);
    window.addEventListener("premium_updated", checkPremium);
    return () => {
      window.removeEventListener("storage", checkPremium);
      window.removeEventListener("premium_updated", checkPremium);
    };
  }, []);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus("processing");
    
    setTimeout(() => {
      localStorage.setItem("premium_unlocked", "true");
      window.dispatchEvent(new Event("premium_updated"));
      setPaymentStatus("success");
    }, 2000);
  };

  const handleCloseModal = () => {
    setIsCheckoutOpen(false);
    setPaymentStatus("idle");
    setCardName("");
    setCardNumber("");
  };

  const features = [
    { name: "Unlimited Chess Games", free: true, premium: true },
    { name: "Basic Puzzle Exercises", free: true, premium: true },
    { name: "Unlimited Stockfish Analysis", free: false, premium: true },
    { name: "Personalized Performance Metrics", free: false, premium: true },
    { name: "FIDE Strength Prediction", free: false, premium: true },
    { name: "Custom Chess Board Themes", free: false, premium: true },
    { name: "Prize Tournaments Support", free: false, premium: true }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Upgrade Your Chess Journey</h1>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          Unlock unlimited tactical exercises, personalized Stockfish review, and deep game reviews.
        </p>
      </div>

      {/* Subscription Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
        
        {/* Free Plan */}
        <div className="glass-card border border-white/10 p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Free Plan</h3>
              <p className="text-xs text-slate-400 mt-1">Core chess game play and basic exercises.</p>
            </div>
            
            <div className="text-3xl font-extrabold text-white">$0 <span className="text-xs text-slate-400 font-medium">/ month</span></div>
            
            <hr className="border-white/5" />
            
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 shrink-0" />
                Unlimited chess matches
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 shrink-0" />
                Basic daily tactical puzzles
              </li>
              <li className="flex items-center gap-2 text-slate-500 line-through">
                <X className="w-4 h-4 text-slate-600 shrink-0" />
                Unlimited Stockfish analysis
              </li>
              <li className="flex items-center gap-2 text-slate-500 line-through">
                <X className="w-4 h-4 text-slate-600 shrink-0" />
                Personalized study plans
              </li>
            </ul>
          </div>

          <button 
            onClick={() => {
              if (isPremium) {
                localStorage.removeItem("premium_unlocked");
                window.dispatchEvent(new Event("premium_updated"));
              }
            }}
            disabled={!isPremium}
            className={`w-full py-3 rounded-xl text-xs font-bold transition-colors ${
              isPremium 
                ? "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20" 
                : "bg-surface-200 border border-white/5 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isPremium ? "Downgrade to Free" : "Current Active Plan"}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="glass-card border-2 border-primary-500 p-6 rounded-2xl flex flex-col justify-between space-y-6 relative">
          <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary-600 border border-primary-400 px-3 py-1 rounded-full text-[9px] font-extrabold text-white uppercase tracking-wider">
            Most Popular
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Premium Plan</h3>
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">The complete next-generation chess training ecosystem.</p>
            
            <div className="text-3xl font-extrabold text-white">$14.99 <span className="text-xs text-slate-400 font-medium">/ month</span></div>
            
            <hr className="border-white/5" />
            
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 shrink-0" />
                Everything in Free plan
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 shrink-0" />
                Unlimited Stockfish 18 review
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 shrink-0" />
                Interactive Chess Training
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400 shrink-0" />
                Estimated FIDE ratings trends
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              if (!isPremium) {
                setIsCheckoutOpen(true);
              }
            }}
            disabled={isPremium}
            className={`w-full py-3 text-white rounded-xl text-xs font-bold transition-colors shadow-lg ${
              isPremium 
                ? "bg-green-600/25 border border-green-500/20 text-green-400 cursor-default" 
                : "bg-primary-600 hover:bg-primary-500 shadow-primary-500/20"
            }`}
          >
            {isPremium ? "Premium Active" : "Upgrade to Premium"}
          </button>
        </div>

      </div>

      {/* Comparison Grid Table */}
      <section className="glass-card border border-white/10 p-6 rounded-2xl max-w-3xl mx-auto space-y-4">
        <h3 className="text-lg font-bold text-white">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-300">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                <th className="pb-3">Feature Option</th>
                <th className="pb-3 text-center">Free</th>
                <th className="pb-3 text-center">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {features.map((feat) => (
                <tr key={feat.name}>
                  <td className="py-3 font-semibold">{feat.name}</td>
                  <td className="py-3 text-center">
                    {feat.free ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="py-3 text-center">
                    {feat.premium ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MOCK CHECKOUT OVERLAY (Stripe Checkout style modal) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-[#0a0c10] border border-white/15 rounded-3xl p-6 shadow-2xl relative space-y-6">
            
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-400" />
                  Premium Checkout
                </h4>
                <p className="text-slate-400 text-xs mt-1">Direct mock transaction processed via Sandbox APIs.</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentStatus === "idle" && (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div className="p-4 bg-primary-500/5 border border-primary-500/10 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">Total Charged today:</span>
                  <span className="font-extrabold text-white">$14.99 / month</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. Toby Spassky"
                    className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry</label>
                    <input
                      type="text"
                      required
                      placeholder="MM / YY"
                      className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CVC</label>
                    <input
                      type="text"
                      required
                      placeholder="123"
                      className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg mt-2"
                >
                  Pay $14.99 and Upgrade
                </button>
              </form>
            )}

            {paymentStatus === "processing" && (
              <div className="text-center py-12 space-y-4">
                <RefreshCw className="w-12 h-12 text-primary-400 animate-spin mx-auto" />
                <div>
                  <h5 className="font-bold text-white text-sm">Processing Payment</h5>
                  <p className="text-xs text-slate-400 mt-1">Contacting Stripe simulation server...</p>
                </div>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="text-center py-12 space-y-4 animate-bounce">
                <ShieldCheck className="w-16 h-16 text-green-400 mx-auto" />
                <div>
                  <h5 className="font-bold text-white text-lg">Upgrade Successful!</h5>
                  <p className="text-xs text-slate-400 mt-1">Thank you {cardName}! Premium features are now unlocked.</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl transition-colors mt-2"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
