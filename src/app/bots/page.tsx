"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Bot, User, Sword, Sparkles, Trophy, ChevronRight, Check } from "lucide-react";

interface BotProfile {
  id: string;
  name: string;
  elo: number;
  category: "Adaptive" | "Beginner" | "Intermediate" | "Advanced";
  avatarColor: string;
  description: string;
  personality: string;
  strengths: string[];
  weaknesses: string[];
}

const botProfiles: BotProfile[] = [
  // ADAPTIVE
  {
    id: "coach",
    name: "Adaptive Coach",
    elo: 1500,
    category: "Adaptive",
    avatarColor: "bg-emerald-500",
    description: "The Coach automatically adjusts its rating to match yours, giving you a perfectly balanced training match.",
    personality: "Always encouraging, offers helpful hints and analysis as you play.",
    strengths: ["Flexible playstyle", "Real-time adapting"],
    weaknesses: ["None (calibrated to you)"]
  },
  // BEGINNER
  {
    id: "jimmy",
    name: "Jimmy",
    elo: 600,
    category: "Beginner",
    avatarColor: "bg-blue-400",
    description: "Jimmy is just starting out and loves to capture pieces regardless of safety. Watch out for simple blunders!",
    personality: "Slightly confused, plays very fast moves.",
    strengths: ["Fast play"],
    weaknesses: ["Hangs Queen", "Basic checkmates"]
  },
  {
    id: "ned",
    name: "Novice Ned",
    elo: 800,
    category: "Beginner",
    avatarColor: "bg-blue-600",
    description: "Ned understands basic rules but frequently leaves pieces undefended and gets trapped by simple pins.",
    personality: "Slow-paced learner who loves development.",
    strengths: ["Pawn development"],
    weaknesses: ["Absolute Pins", "Hanging pieces"]
  },
  // INTERMEDIATE
  {
    id: "nelson",
    name: "Nelson",
    elo: 1300,
    category: "Intermediate",
    avatarColor: "bg-orange-500",
    description: "Nelson is notorious for bringing his Queen out on move two and attacking aggressively. Be prepared to defend!",
    personality: "Fiercely aggressive, hates draws.",
    strengths: ["Early Queen attacks", "Sharp check paths"],
    weaknesses: ["Overextended pieces", "Refutable openings"]
  },
  {
    id: "abby",
    name: "Aggressive Abby",
    elo: 1200,
    category: "Intermediate",
    avatarColor: "bg-orange-600",
    description: "Abby plays volatile, attacking chess. She loves aggressive pawn storms and will sacrifice pieces for active lines.",
    personality: "Fast attacker who pushes pawns early.",
    strengths: ["Tactical Attacks", "Italian Game"],
    weaknesses: ["King Safety", "Endgame transitions"]
  },
  {
    id: "toby",
    name: "Tactical Toby",
    elo: 1600,
    category: "Intermediate",
    avatarColor: "bg-red-500",
    description: "Toby has sharp tactical vision. He is highly proficient in forks, skewers, and double checks. Guard your pieces carefully!",
    personality: "Tactically sharp, calculates combinations.",
    strengths: ["Pin Tactics", "Fork setups", "Active Rooks"],
    weaknesses: ["Positional maneuvers", "Closed positions"]
  },
  // ADVANCED
  {
    id: "self_1m",
    name: "Your Past Self (1m ago)",
    elo: 1450,
    category: "Advanced",
    avatarColor: "bg-purple-600",
    description: "This bot is trained on your exact game history from 1 month ago. Play it to measure your improvement!",
    personality: "Familiar openings, identical speed and style.",
    strengths: ["Your favorite systems"],
    weaknesses: ["Your own personal biases"]
  },
  {
    id: "magnus",
    name: "Master Magnus",
    elo: 2200,
    category: "Advanced",
    avatarColor: "bg-amber-600",
    description: "Magnus plays deep, positional masterpieces. He minimizes blunders and converts minor pawn advantages into flawless endgame wins.",
    personality: "Cold, calculating master class positional player.",
    strengths: ["Flawless Endgames", "Pawn Structures", "Opposition"],
    weaknesses: ["None (highly optimized)"]
  }
];

export default function BotsPage() {
  useAuthRedirect();
  const router = useRouter();
  const [selectedBot, setSelectedBot] = useState<BotProfile>(botProfiles[0]);

  const handleStartBotMatch = (botId: string) => {
    router.push(`/play?bot=${botId}`);
  };

  const categories: BotProfile["category"][] = ["Adaptive", "Beginner", "Intermediate", "Advanced"];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Page Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-100 p-8 border border-[#3d3b38] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Play vs Computer Bots</h1>
            <p className="text-slate-400 text-sm mt-1">Challenge our engines calibrated with distinct Elo ratings and tactical personalities.</p>
          </div>
        </div>
      </section>

      {/* Main Splits Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* Left Columns: Bot groups (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          {categories.map((cat) => {
            const bots = botProfiles.filter((b) => b.category === cat);
            return (
              <div key={cat} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#3d3b38] pb-2">
                  <h3 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
                    {cat} Bots
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{bots.length} Candidates</span>
                </div>
                
                {/* Round Bot Circular Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {bots.map((bot) => {
                    const isSelected = selectedBot.id === bot.id;
                    return (
                      <button
                        key={bot.id}
                        onClick={() => setSelectedBot(bot)}
                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative hover:scale-105 group ${
                          isSelected
                            ? "bg-primary-600/10 border-primary-500 text-white"
                            : "bg-surface-100 border-[#2b2925] text-slate-400 hover:text-white"
                        }`}
                      >
                        {/* Selected Check overlay */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                          </div>
                        )}

                        {/* Circular Avatar */}
                        <div className={`w-16 h-16 rounded-full ${bot.avatarColor} flex items-center justify-center shadow-lg relative group-hover:rotate-6 transition-transform`}>
                          <User className="w-9 h-9 text-white" />
                          <span className="absolute -bottom-1.5 bg-surface-300 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#2b2925]">
                            {bot.elo}
                          </span>
                        </div>
                        
                        <div className="text-center mt-1">
                          <div className="font-bold text-white text-xs leading-tight truncate max-w-[100px]">
                            {bot.name.split(" ")[0]}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{bot.elo} ELO</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Bot Detail Sticky Panel (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-surface-100 border border-[#3d3b38] rounded-3xl p-6 flex flex-col justify-between h-[75vh] min-h-[500px]">
            {/* Top half: Bot stats */}
            <div className="space-y-6 text-center">
              {/* Giant Avatar Circle */}
              <div className={`w-28 h-28 rounded-full ${selectedBot.avatarColor} flex items-center justify-center shadow-2xl mx-auto border-4 border-[#2b2925] relative`}>
                <User className="w-16 h-16 text-white" />
                <span className="absolute -bottom-2 bg-primary-500 text-white text-xs font-black px-2.5 py-1 rounded-full border-2 border-[#2b2925]">
                  {selectedBot.elo} ELO
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">{selectedBot.name}</h3>
                <span className="text-[10px] text-primary-400 font-black uppercase bg-primary-500/10 border border-primary-500/20 px-3 py-1 rounded-full mt-2 inline-block">
                  {selectedBot.category} Bot
                </span>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed font-medium bg-surface-200 p-4 rounded-2xl border border-[#2b2925] text-left">
                {selectedBot.description}
              </p>

              {/* Bot Personality info */}
              <div className="text-left space-y-3">
                <div>
                  <div className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider mb-1">Personality</div>
                  <div className="text-[11px] text-slate-300 italic">{selectedBot.personality}</div>
                </div>

                <hr className="border-[#2b2925]" />

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-extrabold uppercase">Strengths</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedBot.strengths.map((str) => (
                        <span key={str} className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-bold">
                          {str}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-extrabold uppercase">Weaknesses</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedBot.weaknesses.map((weak) => (
                        <span key={weak} className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
                          {weak}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom half: Play button */}
            <button
              onClick={() => handleStartBotMatch(selectedBot.id)}
              className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary-500/25 cursor-pointer"
            >
              <Sword className="w-5 h-5" />
              Choose & Play
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
