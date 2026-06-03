"use client";

import React from "react";

interface EvaluationBarProps {
  score: number;        // pawns (cp / 100), from White's perspective when type="cp"
  type: "cp" | "mate";
  isEvaluating: boolean;
  orientation?: "white" | "black";
  depth?: number;
  sideToMove?: "white" | "black"; // whose turn it is on the board right now
}

/**
 * Converts a pawn advantage into a 0–100 bar percentage using a sigmoid curve.
 * 0   → 50% (equal)
 * +3  → ~85% (White clearly winning)
 * -3  → ~15% (Black clearly winning)
 * ±∞  → approaches 95% / 5% (always leave a sliver visible)
 *
 * Using tanh to mirror Chess.com's smooth, non-linear scaling.
 */
function cpToBarPct(pawns: number): number {
  // tanh maps ℝ → (-1, 1). Scale so ±4 pawns ≈ full bar.
  const scaled = Math.tanh(pawns / 4);
  // Map (-1,1) → (5, 95) so we always show both colors
  return 5 + ((scaled + 1) / 2) * 90;
}

export default function EvaluationBar({
  score,
  type,
  isEvaluating,
  orientation = "white",
  depth,
  sideToMove = "white",
}: EvaluationBarProps) {

  // ── Normalise score to White's perspective ─────────────────────────────────
  // useStockfish reports from the SIDE-TO-MOVE's perspective (both cp and mate).
  // If it's Black's turn, a positive score means Black is better.
  // We flip the sign so a positive score always means White is better.
  const scoreFromWhite = sideToMove === "white" ? score : -score;

  // ── Bar fill percentage (White section grows from bottom) ──────────────────
  let whitePct: number;
  if (type === "mate") {
    // Positive mate = White mates, negative = Black mates
    whitePct = scoreFromWhite > 0 ? 95 : 5;
  } else {
    whitePct = cpToBarPct(scoreFromWhite);
  }

  // When viewing as Black, flip the bar so White is still at bottom
  const displayWhitePct = orientation === "black" ? 100 - whitePct : whitePct;

  // ── Score label ────────────────────────────────────────────────────────────
  const getLabel = () => {
    if (type === "mate") {
      const m = Math.abs(score);
      return scoreFromWhite > 0 ? `M${m}` : `-M${m}`;
    }
    const abs = Math.abs(scoreFromWhite);
    const sign = scoreFromWhite >= 0 ? "+" : "-";
    return `${sign}${abs.toFixed(2)}`;
  };

  // Label sits in whichever color has more room
  const labelInWhite = displayWhitePct >= 50;

  return (
    <div
      className="relative flex flex-col rounded-xl overflow-hidden border border-white/10 shadow-xl"
      style={{ width: 32, height: 400 }}
      title={`Evaluation: ${getLabel()} (depth ${depth ?? "—"})`}
    >
      {/* ── Black section (top) ─────────────────────────────────────────── */}
      <div
        className="w-full bg-[#1c1c1e] transition-all duration-500 ease-out"
        style={{ flexGrow: 100 - displayWhitePct }}
      />

      {/* ── White section (bottom) ──────────────────────────────────────── */}
      <div
        className="w-full bg-[#f4f4f5] transition-all duration-500 ease-out"
        style={{ flexGrow: displayWhitePct }}
      />

      {/* ── Centre divider line ─────────────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 h-px bg-white/20 pointer-events-none"
        style={{ top: "50%" }}
      />

      {/* ── Score label ─────────────────────────────────────────────────── */}
      <div
        className={`
          absolute left-0 right-0 flex flex-col items-center justify-center
          pointer-events-none select-none z-10 transition-all duration-500
          text-[9px] font-black leading-none
          ${labelInWhite ? "text-slate-800" : "text-slate-200"}
        `}
        style={{ [labelInWhite ? "bottom" : "top"]: 8 }}
      >
        {isEvaluating ? (
          <span className="animate-pulse opacity-60">···</span>
        ) : (
          <>
            <span>{getLabel()}</span>
            {depth !== undefined && depth > 0 && (
              <span className="opacity-40 mt-0.5 text-[7px]">d{depth}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
