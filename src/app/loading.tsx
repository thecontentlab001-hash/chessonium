"use client";

import React, { useEffect, useState } from "react";

const CHESS_TIPS = [
  "Controlling the center is one of the most fundamental principles of chess openings.",
  "Knights are usually best placed near the center of the board, where they can control up to 8 squares.",
  "Rooks belong on open and semi-open files where their long-range power can be fully utilized.",
  "King safety is paramount. Castle early to safeguard your king and activate your rook.",
  "Tactics win games. Keep an eye out for forks, pins, skewers, and discovered attacks.",
  "Every pawn move creates permanent weaknesses that can never be undone.",
  "In the endgame, the king becomes an active fighting piece. Don't keep him hidden!",
  "A Knight on the rim is dim. Keep your pieces active and coordinated.",
  "Always check for checks, captures, and threats before finalizing your move.",
];

export default function GlobalLoading() {
  const [tipIndex, setTipIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % CHESS_TIPS.length);
        setFade(true);
      }, 300); // match fade duration
    }, 4500);

    return () => clearInterval(tipInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#161513] text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#81b64c]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-6 z-10">
        {/* Pulsing Knight Logo */}
        <div className="relative w-20 h-20 flex items-center justify-center bg-surface-100/50 border border-white/10 rounded-2xl shadow-2xl animate-pulse">
          <svg
            className="w-12 h-12 text-[#81b64c] fill-current"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M35 80c-2 0-4-2-4-4 0-1 0-2 1-3l5-12c-3-2-5-5-5-9 0-2 1-4 2-5-2-4-2-8-1-12 1-5 4-10 9-13 4-2 9-3 13-3 6 0 11 3 14 8 2 3 3 7 3 11 0 4-1 8-4 11l-3 4c-1 1-1 3-1 4v8c0 2-2 4-4 4H35zm10-50c0-2-2-4-4-4s-4 2-4 4 2 4 4 4 4-2 4-4z" />
            <path d="M25 85h50c2 0 4 2 4 4v4H21v-4c0-2 2-4 4-4z" />
          </svg>
          {/* Subtle spinning glow ring around it */}
          <div className="absolute inset-0 rounded-2xl border border-t-[#81b64c] border-r-transparent border-b-transparent border-l-transparent animate-spin duration-1000" />
        </div>

        {/* Loading status */}
        <div className="space-y-2">
          <h3 className="text-sm font-black tracking-widest text-slate-400 uppercase">
            Loading Chessonium
          </h3>
          {/* Animated loading bar */}
          <div className="h-1 w-44 bg-surface-300 rounded-full overflow-hidden border border-white/5 mx-auto">
            <div className="h-full bg-gradient-to-r from-[#81b64c] to-[#97d457] rounded-full animate-[loading-bar_1.5s_infinite_ease-in-out]" />
          </div>
        </div>

        {/* Chess Tip */}
        <div className="pt-4 border-t border-white/5 w-full min-h-[80px]">
          <p className="text-[10px] font-black tracking-widest text-[#81b64c] uppercase mb-1.5">
            Pro Tip
          </p>
          <p
            className={`text-xs text-slate-300 leading-relaxed font-medium transition-opacity duration-300 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            "{CHESS_TIPS[tipIndex]}"
          </p>
        </div>
      </div>

      {/* Embedded inline keyframes for ease-of-use with custom loader */}
      <style>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
