"use client";

import React, { useEffect, useState } from "react";
import { chessAudio } from "@/utils/chessAudio";

export type MoveClass =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "missed_win";

interface MoveClassBadgeProps {
  classification: MoveClass;
  /** Which square the piece landed on, e.g. "e4" */
  square: string;
  /** Board orientation so we know which corner is h8 */
  orientation?: "white" | "black";
  /** Board pixel size (the full board width in px) */
  boardSize?: number;
}

interface BadgeConfig {
  bgColor: string;
  iconColor: string;
  symbol: string | React.ReactNode;
  label: string;
  animationClass: string;
}

const BADGE_CONFIGS: Record<MoveClass, BadgeConfig> = {
  brilliant: {
    bgColor: "#12c4b8", // cyan/teal
    iconColor: "#ffffff",
    symbol: "!!",
    label: "Brilliant!!",
    animationClass: "animate-brilliant",
  },
  great: {
    bgColor: "#1baca6", // blue-green
    iconColor: "#ffffff",
    symbol: "!",
    label: "Great Move",
    animationClass: "animate-great",
  },
  best: {
    bgColor: "#769656", // green
    iconColor: "#ffffff",
    symbol: "★",
    label: "Best Move",
    animationClass: "animate-best",
  },
  excellent: {
    bgColor: "#96bc4b", // light green
    iconColor: "#ffffff",
    symbol: "👍",
    label: "Excellent",
    animationClass: "animate-excellent",
  },
  good: {
    bgColor: "#3d5e80", // blue/gray
    iconColor: "#ffffff",
    symbol: "✓",
    label: "Good",
    animationClass: "animate-good",
  },
  book: {
    bgColor: "#d5a47e", // brown/tan
    iconColor: "#ffffff",
    symbol: "📖",
    label: "Book Move",
    animationClass: "animate-book",
  },
  inaccuracy: {
    bgColor: "#f0c13b", // yellow
    iconColor: "#ffffff",
    symbol: "?!",
    label: "Inaccuracy",
    animationClass: "animate-inaccuracy",
  },
  mistake: {
    bgColor: "#e58f2a", // orange
    iconColor: "#ffffff",
    symbol: "?",
    label: "Mistake",
    animationClass: "animate-mistake",
  },
  blunder: {
    bgColor: "#ca3431", // red
    iconColor: "#ffffff",
    symbol: "??",
    label: "Blunder",
    animationClass: "animate-blunder",
  },
  missed_win: {
    bgColor: "#7f7f7f", // gray
    iconColor: "#ffffff",
    symbol: "🎯", // target/flag symbol
    label: "Missed Win",
    animationClass: "animate-missed-win",
  },
};

/** Convert chess square notation ("e4") to {file: 0-7, rank: 0-7} */
function squareToCoords(square: string, orientation: "white" | "black") {
  const file = square.charCodeAt(0) - 97; // a=0 … h=7
  const rank = parseInt(square[1], 10) - 1; // 1=0 … 8=7

  // In white orientation: a1 is bottom-left (col 0, row 7)
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;
  return { col, row };
}

// Ensure style tags are injected
const STYLE_ID = "chesscom-move-classification-styles";
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* Circular Badge entry animations */
    @keyframes badgePop {
      0% { transform: scale(0) rotate(-15deg); opacity: 0; }
      70% { transform: scale(1.22) rotate(5deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    @keyframes blunderPop {
      0% { transform: scale(0) rotate(15deg); opacity: 0; }
      40% { transform: scale(1.4) rotate(-8deg); }
      70% { transform: scale(0.9) rotate(4deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    
    @keyframes inaccuracyPop {
      0%, 100% { transform: scale(1) translateX(0); opacity: 1; }
      20% { transform: scale(1.1) translateX(-3px); }
      40% { transform: scale(1.1) translateX(3px); }
      60% { transform: scale(1) translateX(-2px); }
      80% { transform: scale(1) translateX(2px); }
    }

    /* Floating Tooltip text animation */
    @keyframes tooltipFly {
      0% { transform: translateY(8px) scale(0.85); opacity: 0; }
      15% { transform: translateY(-4px) scale(1.05); opacity: 1; }
      25% { transform: translateY(-4px) scale(1); opacity: 1; }
      80% { transform: translateY(-4px) scale(1); opacity: 1; }
      100% { transform: translateY(-16px) scale(0.85); opacity: 0; }
    }

    @keyframes brilliantSpark {
      0% { transform: translate(-50%, -50%) translate(0, 0) scale(0); opacity: 0; }
      15% { opacity: 1; }
      100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(1.1); opacity: 0; }
    }
    
    .brilliant-particle {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #12c4b8;
      box-shadow: 0 0 8px #12c4b8, 0 0 16px #12c4b8;
      pointer-events: none;
    }

    .animate-badge-brilliant { animation: badgePop 0.5s cubic-bezier(0.34, 1.7, 0.64, 1) forwards; }
    .animate-badge-great { animation: badgePop 0.4s cubic-bezier(0.34, 1.6, 0.64, 1) forwards; }
    .animate-badge-best { animation: badgePop 0.4s cubic-bezier(0.34, 1.6, 0.64, 1) forwards; }
    .animate-badge-excellent { animation: badgePop 0.4s cubic-bezier(0.34, 1.6, 0.64, 1) forwards; }
    .animate-badge-good { animation: badgePop 0.35s cubic-bezier(0.34, 1.5, 0.64, 1) forwards; }
    .animate-badge-book { animation: badgePop 0.35s cubic-bezier(0.34, 1.5, 0.64, 1) forwards; }
    .animate-badge-inaccuracy { animation: badgePop 0.4s ease forwards, inaccuracyPop 0.5s ease 0.4s; }
    .animate-badge-mistake { animation: badgePop 0.4s ease forwards, inaccuracyPop 0.55s ease 0.4s; }
    .animate-badge-blunder { animation: blunderPop 0.55s cubic-bezier(0.34, 1.8, 0.64, 1) forwards; }
    .animate-badge-missed_win { animation: badgePop 0.4s ease forwards; }

    .animate-label-fly {
      animation: tooltipFly 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    }
  `;
  document.head.appendChild(style);
}

export default function MoveClassBadge({
  classification,
  square,
  orientation = "white",
  boardSize = 480,
}: MoveClassBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(true);
  const cfg = BADGE_CONFIGS[classification];

  useEffect(() => {
    ensureStyles();
    setShowTooltip(true);

    // Play the corresponding sound effect
    switch (classification) {
      case "brilliant":
        chessAudio.playBrilliant();
        break;
      case "great":
        chessAudio.playBest();
        break;
      case "blunder":
        chessAudio.playBlunder();
        break;
      case "best":
        chessAudio.playBest();
        break;
      case "excellent":
        chessAudio.playExcellent();
        break;
      case "good":
        chessAudio.playMove();
        break;
      case "book":
        chessAudio.playBook();
        break;
      case "inaccuracy":
        chessAudio.playInaccuracy();
        break;
      case "mistake":
        chessAudio.playMistake();
        break;
      case "missed_win":
        chessAudio.playMistake(); // Play mistake sound for missed win
        break;
    }

    // Hide tooltip text after 1.7 seconds, matching Chess.com style
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 1700);

    return () => clearTimeout(timer);
  }, [square, classification]);

  const squareSize = boardSize / 8;
  const { col, row } = squareToCoords(square, orientation);

  // Position the circle badge exactly at the top-right intersection corner of the square
  // (In Chess.com, the badge overlaps the grid lines)
  const badgeSize = Math.max(16, Math.min(26, boardSize * 0.052)); // responsive size e.g. 25px for 480px board
  const left = col * squareSize + squareSize - badgeSize / 2;
  const top  = row * squareSize - badgeSize / 2;

  // Render the specific animation class for each badge type
  const badgeAnimClass = `animate-badge-${classification}`;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: badgeSize,
        height: badgeSize,
        zIndex: 40,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {/* Brilliant Particle Explosion overlay */}
      {classification === "brilliant" && (
        <div
          style={{
            position: "absolute",
            left: -squareSize / 2 + badgeSize / 2,
            top: squareSize / 2 + badgeSize / 2,
            width: 0,
            height: 0,
            pointerEvents: "none",
            zIndex: 35,
          }}
        >
          {[
            { tx: "-35px", ty: "-35px", delay: "0s" },
            { tx: "35px", ty: "-35px", delay: "0.05s" },
            { tx: "-35px", ty: "35px", delay: "0.1s" },
            { tx: "35px", ty: "35px", delay: "0.15s" },
            { tx: "0px", ty: "-50px", delay: "0.02s" },
            { tx: "0px", ty: "50px", delay: "0.08s" },
            { tx: "-50px", ty: "0px", delay: "0.12s" },
            { tx: "50px", ty: "0px", delay: "0.04s" },
          ].map((part, idx) => (
            <div
              key={idx}
              className="brilliant-particle animate-brilliant-spark"
              style={{
                "--tx": part.tx,
                "--ty": part.ty,
                animation: `brilliantSpark 1.1s cubic-bezier(0.1, 0.8, 0.3, 1) ${part.delay} forwards`,
              } as any}
            />
          ))}
        </div>
      )}

      {/* ── 1. The Circular Badge (Stays visible) ────────────────────────── */}
      <div
        className={`${badgeAnimClass} flex items-center justify-center rounded-full border-2 border-[#ffffff] shadow-lg`}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: cfg.bgColor,
          boxShadow: `0 3px 6px rgba(0,0,0,0.35), 0 0 10px ${cfg.bgColor}30`,
        }}
      >
        <span
          style={{
            color: cfg.iconColor,
            fontSize: classification === "book" ? `${badgeSize * 0.5}px` : `${badgeSize * 0.48}px`,
            fontWeight: 900,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          {cfg.symbol}
        </span>
      </div>

      {/* ── 2. The Floating Text Tooltip (Fades out after 1.5s) ──────────── */}
      {showTooltip && (
        <div
          className="animate-label-fly absolute flex flex-col items-center"
          style={{
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "6px",
            zIndex: 50,
          }}
        >
          {/* Tooltip Pill */}
          <div
            style={{
              backgroundColor: "rgba(20, 20, 22, 0.94)",
              color: cfg.bgColor,
              fontSize: "10px",
              fontWeight: 800,
              padding: "4px 8px",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              border: `1px solid ${cfg.bgColor}40`,
              whiteSpace: "nowrap",
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              letterSpacing: "0.02em",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontWeight: 900 }}>{cfg.symbol}</span>
            <span style={{ color: "#ffffff", fontWeight: 700 }}>{cfg.label}</span>
          </div>

          {/* Tooltip Arrow */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid rgba(20, 20, 22, 0.94)",
              marginTop: "-1px",
            }}
          />
        </div>
      )}
    </div>
  );
}
