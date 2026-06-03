"use client";

import React from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { BarChart3, TrendingUp, Zap, Clock, ShieldCheck, BrainCircuit, Activity } from "lucide-react";

export default function AnalyticsPage() {
  useAuthRedirect();
  // Mock performance metrics
  const strengths = [
    { name: "Opening Strength", score: 72, color: "bg-blue-500 text-blue-400" },
    { name: "Tactical Strength", score: 84, color: "bg-purple-500 text-purple-400" },
    { name: "Positional Strength", score: 68, color: "bg-cyan-500 text-cyan-400" },
    { name: "Endgame Strength", score: 52, color: "bg-orange-500 text-orange-400" },
    { name: "Time Management", score: 78, color: "bg-green-500 text-green-400" },
  ];

  const accuracyTrend = [72, 75, 71, 78, 80, 84, 82, 85];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Dashboard Banner */}
      <section className="relative overflow-hidden rounded-3xl glass-card p-8 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-500/25 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Performance Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Deep analysis of your tactical strength, game accuracy trends, and endgame conversions.</p>
          </div>
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left/Center side dashboard charts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Accuracy Trend Chart (SVG Line) */}
          <section className="glass-card border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                Accuracy Trend (Last 8 Games)
              </h3>
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                +13% Growth
              </span>
            </div>

            {/* SVG Line Chart */}
            <div className="h-48 w-full relative pt-4">
              <svg className="w-full h-full" viewBox="0 0 700 150">
                {/* Grid Lines */}
                <line x1="0" y1="25" x2="700" y2="25" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="75" x2="700" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="125" x2="700" y2="125" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                
                {/* Trend Line Path */}
                <path
                  d="M 25,120 L 114,110 L 203,123 L 292,90 L 381,85 L 470,60 L 559,70 L 648,50"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                
                {/* Definition for path gradient */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>

                {/* Accuracy dots */}
                {[
                  { x: 25, y: 120, label: "72%" },
                  { x: 114, y: 110, label: "75%" },
                  { x: 203, y: 123, label: "71%" },
                  { x: 292, y: 90, label: "78%" },
                  { x: 381, y: 85, label: "80%" },
                  { x: 470, y: 60, label: "84%" },
                  { x: 559, y: 70, label: "82%" },
                  { x: 648, y: 50, label: "85%" },
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="5" fill="#f8fafc" stroke="#3b82f6" strokeWidth="2" />
                    <text x={pt.x - 10} y={pt.y - 12} fill="#94a3b8" fontSize="10" fontWeight="bold">
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </section>

          {/* Strength Categories Progress Bars */}
          <section className="glass-card border border-white/10 p-6 rounded-2xl space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Chess Attribute Breakdown
            </h3>
            
            <div className="space-y-4">
              {strengths.map((str) => (
                <div key={str.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">{str.name}</span>
                    <span className="text-white">{str.score} / 100</span>
                  </div>
                  <div className="h-2.5 bg-surface-200 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full ${str.color.split(" ")[0]} rounded-full`} style={{ width: `${str.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right side analytics summaries */}
        <div className="space-y-6">
          {/* Win / Loss / Draw stats */}
          <section className="glass-card border border-white/10 p-5 rounded-2xl space-y-4">
            <h4 className="font-bold text-white">Win Ratio Statistics</h4>
            <div className="flex gap-2.5 h-6 rounded-lg overflow-hidden border border-white/5 text-[10px] font-bold text-center text-white">
              <div className="bg-green-500 flex items-center justify-center" style={{ width: "54%" }}>54% W</div>
              <div className="bg-slate-700 flex items-center justify-center" style={{ width: "12%" }}>12% D</div>
              <div className="bg-red-500 flex items-center justify-center" style={{ width: "34%" }}>34% L</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-3 bg-surface-100 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Wins</div>
                <div className="text-sm font-extrabold text-green-400">108</div>
              </div>
              <div className="p-3 bg-surface-100 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Draws</div>
                <div className="text-sm font-extrabold text-slate-400">24</div>
              </div>
              <div className="p-3 bg-surface-100 rounded-xl border border-white/5">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Losses</div>
                <div className="text-sm font-extrabold text-red-400">68</div>
              </div>
            </div>
          </section>

          {/* AI Monthly Performance Report */}
          <section className="glass-card border border-white/10 p-5 rounded-2xl space-y-4">
            <h4 className="font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary-400" />
              AI Insights Report
            </h4>
            <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl text-xs leading-relaxed space-y-3">
              <p className="text-slate-300">
                Your tactical strength rose by <strong>12 points</strong> this month due to an 84% accuracy rate in pin-related puzzles.
              </p>
              <p className="text-slate-300">
                Endgame accuracy (52%) remains your biggest bottleneck. You lost 4 winning positions due to passive rook placement.
              </p>
              <p className="text-slate-300 font-bold text-primary-400">
                Recommendation: Complete the opposition tutorials in the Learning Academy.
              </p>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
