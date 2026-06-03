"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Puzzle } from "@/lib/chess/puzzles";
import {
  Check, X, HelpCircle, ArrowRight, Lightbulb, Trophy,
  Target, Clock, Zap, ChevronLeft, ChevronRight, BarChart2, TrendingUp,
} from "lucide-react";
import { chessAudio } from "@/utils/chessAudio";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryEntry {
  id: string;
  rating: number;
  success: boolean;
  change: number;
}

interface PuzzleStats {
  solvedTotal: number;
  successRate: number;
  streakCount: number;
  bestStreak: number;
  puzzleRating: number;
}

interface PuzzleBoardProps {
  puzzle: Puzzle;
  onSolve: (success: boolean, isGameOver?: boolean) => void;
  onNext: () => void;
  mode: "daily" | "streak" | "rush" | "endless" | "weakness";
  history: HistoryEntry[];
  stats: PuzzleStats;
}

const THEME_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  fork:           { bg: "bg-orange-500/10",  border: "border-orange-500/20", text: "text-orange-400"  },
  pin:            { bg: "bg-purple-500/10",  border: "border-purple-500/20", text: "text-purple-400"  },
  skewer:         { bg: "bg-blue-500/10",    border: "border-blue-500/20",   text: "text-blue-400"    },
  "back rank":    { bg: "bg-red-500/10",     border: "border-red-500/20",    text: "text-red-400"     },
  checkmate:      { bg: "bg-green-500/10",   border: "border-green-500/20",  text: "text-green-400"   },
  sacrifice:      { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",   text: "text-cyan-400"    },
  discovery:      { bg: "bg-yellow-500/10",  border: "border-yellow-500/20", text: "text-yellow-400"  },
  deflection:     { bg: "bg-pink-500/10",    border: "border-pink-500/20",   text: "text-pink-400"    },
  default:        { bg: "bg-slate-500/10",   border: "border-slate-500/20",  text: "text-slate-400"   },
};

function getTheme(t: string) {
  const lower = t.toLowerCase();
  for (const key of Object.keys(THEME_COLORS)) {
    if (lower.includes(key)) return THEME_COLORS[key];
  }
  return THEME_COLORS.default;
}

export default function PuzzleBoard({ puzzle, onSolve, onNext, mode, history, stats }: PuzzleBoardProps) {
  const autoAdvance = mode === "streak" || mode === "rush" || mode === "endless";
  const [activeTab, setActiveTab]         = useState<"puzzle" | "stats">("puzzle");
  const [game, setGame]                   = useState<Chess | null>(null);
  const [currentMoveIdx, setCurrentMoveIdx] = useState(0);
  const [status, setStatus]               = useState<"solving" | "correct" | "wrong" | "completed">("solving");
  const [attempts, setAttempts]           = useState(0);
  const [hintSquares, setHintSquares]     = useState<Record<string, React.CSSProperties>>({});
  const [lastMoveSquares, setLastMoveSquares] = useState<Record<string, React.CSSProperties>>({});
  const [moveFrom, setMoveFrom]           = useState<string | null>(null);
  const [legalSquares, setLegalSquares]   = useState<Record<string, React.CSSProperties>>({});
  const [flashKey, setFlashKey]           = useState(0);
  const [hintUsed, setHintUsed]           = useState(false);
  const [solveTime, setSolveTime]         = useState(0);
  const [promotionAnimSquare, setPromotionAnimSquare] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(Date.now());

  // Initialize puzzle
  useEffect(() => {
    try {
      const g = new Chess(puzzle.fen);
      setGame(g);
      setCurrentMoveIdx(0);
      setStatus("solving");
      setAttempts(0);
      setHintSquares({});
      setLastMoveSquares({});
      setMoveFrom(null);
      setLegalSquares({});
      setHintUsed(false);
      setSolveTime(0);
      startTimeRef.current = Date.now();
    } catch (e) {
      console.error("Bad FEN:", e);
    }
  }, [puzzle]);

  // Solve timer
  useEffect(() => {
    if (status === "solving") {
      timerRef.current = setInterval(() => {
        setSolveTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const highlightLastMove = (from: string, to: string) => {
    setLastMoveSquares({
      [from]: { background: "rgba(250, 204, 21, 0.35)" },
      [to]:   { background: "rgba(250, 204, 21, 0.55)" },
    });
  };

  const showLegalMoves = (square: string) => {
    if (!game) return;
    const moves = game.moves({ square: square as any, verbose: true });
    if (!moves.length) { setLegalSquares({}); return; }
    const sq: Record<string, React.CSSProperties> = {
      [square]: { background: "rgba(255,255,255,0.18)" },
    };
    moves.forEach((m) => {
      sq[m.to] = {
        background: game.get(m.to as any)
          ? "radial-gradient(circle, rgba(239,68,68,0.55) 60%, transparent 60%)"
          : "radial-gradient(circle, rgba(99,102,241,0.55) 28%, transparent 28%)",
      };
    });
    setLegalSquares(sq);
  };

  const handleSquareClick = ({ square }: { square: string }) => {
    if (!game || status !== "solving") return;

    if (!moveFrom) {
      const piece = game.get(square as any);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
        showLegalMoves(square);
      }
    } else {
      if (square === moveFrom) {
        setMoveFrom(null);
        setLegalSquares({});
        return;
      }
      // Try clicking another own piece
      const piece = game.get(square as any);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
        showLegalMoves(square);
        return;
      }
      attemptMove(moveFrom, square);
    }
  };

  const handleDrop = ({ piece, sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!targetSquare || status !== "solving") return false;
    return attemptMove(sourceSquare, targetSquare);
  };

  const attemptMove = (from: string, to: string): boolean => {
    if (!game) return false;
    setMoveFrom(null);
    setLegalSquares({});
    setHintSquares({});

    const isPromotion =
      (game.get(from as any)?.type === "p" && from[1] === "7" && to[1] === "8") ||
      (game.get(from as any)?.type === "p" && from[1] === "2" && to[1] === "1");

    const expected = puzzle.solution[currentMoveIdx];
    const expectedProm = expected && expected.length === 5 ? expected[4] : "q";
    const moveStr = `${from}${to}${isPromotion ? expectedProm : ""}`;

    const gameCopy = new Chess(game.fen());
    let legal = null;
    try {
      legal = gameCopy.move({ from, to, promotion: isPromotion ? expectedProm : undefined });
    } catch {
      return false;
    }
    if (!legal) return false;

    if (moveStr === expected) {
      // ── Correct move ───────────────────────────────────────────────────────
      // Apply player's move on a COPY so we don't mutate stale state
      const afterPlayer = new Chess(game.fen());
      const playerMoveObj = afterPlayer.move({ from, to, promotion: isPromotion ? expectedProm : undefined });
      highlightLastMove(from, to);
      setFlashKey((k) => k + 1);

      if (isPromotion) {
        setPromotionAnimSquare(to);
        setTimeout(() => setPromotionAnimSquare(null), 1500);
      }

      // Play board sound first
      if (playerMoveObj) {
        const isCheck = afterPlayer.inCheck();
        const isCapture = !!(playerMoveObj.captured || playerMoveObj.san.includes("x"));
        if (isCheck) {
          chessAudio.playCheck();
        } else if (isCapture) {
          chessAudio.playCapture();
        } else {
          chessAudio.playMove();
        }
      }
      
      // Followed by positive puzzle click feedback
      chessAudio.playPuzzleCorrect();

      const nextIdx = currentMoveIdx + 1;

      if (nextIdx >= puzzle.solution.length) {
        // Puzzle fully solved
        setStatus("completed");
        setSolveTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        onSolve(true);
        setGame(afterPlayer);

        if (autoAdvance) {
          setTimeout(() => {
            onNext();
          }, 1000);
        }
      } else {
        // Show player's move immediately, then auto-play opponent after 700ms
        setGame(afterPlayer);
        setStatus("correct");

        setTimeout(() => {
          const opp  = puzzle.solution[nextIdx];
          const oppFrom = opp.slice(0, 2);
          const oppTo   = opp.slice(2, 4);
          const oppProm = opp.slice(4) || undefined;

          // Use functional updater so we ALWAYS work on the latest state,
          // not the stale closure value captured at the time setTimeout was created.
          setGame((prev) => {
            if (!prev) return prev;
            try {
              const afterOpp = new Chess(prev.fen());
              const result   = afterOpp.move({ from: oppFrom, to: oppTo, promotion: oppProm });
              if (!result) {
                console.warn("[Puzzle] Opponent move illegal:", opp, "on FEN:", prev.fen());
                return prev;
              }
              highlightLastMove(oppFrom, oppTo);

              // Play opponent's move sound
              const isCheck = afterOpp.inCheck();
              const isCapture = !!(result.captured || result.san.includes("x"));
              if (isCheck) {
                chessAudio.playCheck();
              } else if (isCapture) {
                chessAudio.playCapture();
              } else {
                chessAudio.playMove();
              }

              return afterOpp;
            } catch (err) {
              console.error("[Puzzle] Opponent move error:", err);
              return prev;
            }
          });

          setCurrentMoveIdx(nextIdx + 1);
          setStatus("solving");
        }, 700);
      }
      return true;
    } else {
      // Wrong
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setStatus("wrong");
      chessAudio.playPuzzleWrong();

      if (autoAdvance) {
        if (mode === "streak") {
          // Streak ends on first mistake!
          setStatus("completed");
          onSolve(false, true);
        } else if (mode === "rush") {
          if (nextAttempts >= 3) {
            // Rush ends on 3rd mistake
            setStatus("completed");
            onSolve(false, true);
          } else {
            // Skip to next puzzle after 1200ms
            setTimeout(() => {
              onSolve(false, false);
              onNext();
            }, 1200);
          }
        }
      } else {
        setTimeout(() => setStatus("solving"), 1200);
      }
      return false;
    }
  };

  const getHint = () => {
    if (status !== "solving" || !puzzle.solution[currentMoveIdx]) return;
    const move = puzzle.solution[currentMoveIdx];
    const from = move.slice(0, 2);
    const to   = move.slice(2, 4);
    setHintSquares({
      [from]: { background: "rgba(234,179,8,0.45)", boxShadow: "inset 0 0 0 3px rgba(234,179,8,0.7)" },
      [to]:   { background: "rgba(234,179,8,0.22)", boxShadow: "inset 0 0 0 2px rgba(234,179,8,0.4)" },
    });
    setHintUsed(true);
  };

  const handleGiveUp = () => {
    if (status === "completed") return;
    setStatus("completed");
    onSolve(false, true);
    let idx = currentMoveIdx;
    const playNext = () => {
      if (idx >= puzzle.solution.length || !game) return;
      const m = puzzle.solution[idx];
      try {
        game.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m.slice(4) || undefined });
        highlightLastMove(m.slice(0, 2), m.slice(2, 4));
        setGame(new Chess(game.fen()));
        idx++;
        setTimeout(playNext, 900);
      } catch { /* ignore */ }
    };
    playNext();
  };

  const orientation = puzzle.fen.split(" ")[1] === "w" ? "white" : "black";
  const progress = puzzle.solution.length > 0
    ? Math.round((currentMoveIdx / puzzle.solution.length) * 100)
    : 0;

  const squareStyles = { ...lastMoveSquares, ...hintSquares, ...legalSquares };

  // Render grid overlay for promotion animation
  const renderPromotionOverlay = () => {
    if (!promotionAnimSquare) return null;
    const file = promotionAnimSquare[0];
    const rank = promotionAnimSquare[1];
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

    let col = files.indexOf(file);
    let row = ranks.indexOf(rank);

    if (orientation === "black") {
      col = 7 - col;
      row = 7 - row;
    }

    return (
      <>
        <style>{`
          @keyframes promoteGlow {
            0% {
              transform: scale(0.6);
              box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7), inset 0 0 0 0 rgba(168, 85, 247, 0.7);
              opacity: 0;
            }
            15% {
              opacity: 1;
              transform: scale(1.15);
              box-shadow: 0 0 35px 12px rgba(168, 85, 247, 0.95), inset 0 0 20px 6px rgba(168, 85, 247, 0.95);
            }
            50% {
              transform: scale(1.0);
              box-shadow: 0 0 50px 20px rgba(236, 72, 153, 0.9), inset 0 0 30px 10px rgba(236, 72, 153, 0.9);
            }
            100% {
              transform: scale(1.3);
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0), inset 0 0 0 0 rgba(59, 130, 246, 0);
              opacity: 0;
            }
          }
          @keyframes sparkler {
            0% { transform: translate(0, 0) scale(0); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(1.3); opacity: 0; }
          }
        `}</style>
        <div className="absolute inset-0 pointer-events-none z-40 grid grid-cols-8 grid-rows-8">
          <div 
            style={{
              gridColumnStart: col + 1,
              gridRowStart: row + 1,
            }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* Glow Aura */}
            <div 
              className="absolute w-[95%] h-[95%] rounded-xl"
              style={{
                animation: "promoteGlow 1.3s cubic-bezier(0.25, 1, 0.5, 1) forwards",
              }}
            />
            {/* Shooting Sparkles */}
            {[
              { x: "-40px", y: "-40px", delay: "0s" },
              { x: "40px", y: "-40px", delay: "0.1s" },
              { x: "-50px", y: "10px", delay: "0.05s" },
              { x: "50px", y: "15px", delay: "0.15s" },
              { x: "-20px", y: "50px", delay: "0.2s" },
              { x: "20px", y: "50px", delay: "0.08s" },
            ].map((sparkle, idx) => (
              <div
                key={idx}
                className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500"
                style={{
                  "--tx": sparkle.x,
                  "--ty": sparkle.y,
                  animation: `sparkler 0.8s ease-out ${sparkle.delay} forwards`,
                } as any}
              />
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="bg-surface-100 border border-[#3d3b38] rounded-3xl overflow-hidden shadow-2xl">
      {/* Top header bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-surface-200 border-b border-[#2b2925]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white">{puzzle.title}</div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{orientation === "white" ? "White" : "Black"} to move</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Rating badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-xl">
            <Trophy className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-xs font-black text-primary-300">{puzzle.rating}</span>
          </div>
          {/* Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 border border-white/10 rounded-xl text-xs font-mono font-bold text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {String(Math.floor(solveTime / 60)).padStart(2, "0")}:{String(solveTime % 60).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0">
        {/* Board */}
        <div className="w-full lg:w-[68%] xl:w-[70%] max-w-[720px] mx-auto lg:mx-0 shrink-0 p-5">
          {/* Progress bar */}
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Progress</span>
              <span>{currentMoveIdx}/{puzzle.solution.length} moves</span>
            </div>
            <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div 
            className="relative rounded-2xl overflow-hidden shadow-xl border border-white/10"
            style={{ aspectRatio: "1 / 1" }}
          >
            {renderPromotionOverlay()}
            {/* Wrong flash overlay */}
            {status === "wrong" && (
              <div
                key={flashKey}
                className="absolute inset-0 z-20 bg-red-500/20 pointer-events-none"
                style={{ animation: "pulse 0.3s ease-in-out 2" }}
              />
            )}
            {/* Correct flash overlay */}
            {status === "correct" && (
              <div className="absolute inset-0 z-20 bg-green-500/10 pointer-events-none" />
            )}
            {/* Completed/Failed overlay */}
            {status === "completed" && (!autoAdvance || (mode === "streak" && attempts > 0) || (mode === "rush" && attempts >= 3)) && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-center space-y-3 animate-in zoom-in duration-300 p-6 max-w-sm">
                  {attempts === 0 || (puzzle.solution.length > 0 && currentMoveIdx >= puzzle.solution.length) ? (
                    <>
                      <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border-2 border-green-400/50 flex items-center justify-center animate-bounce">
                        <Check className="w-10 h-10 text-green-400" />
                      </div>
                      <div className="text-2xl font-black text-white">Solved!</div>
                      <div className="text-sm text-slate-400">
                        {solveTime}s · {attempts} mistake{attempts !== 1 ? "s" : ""}{hintUsed ? " · Hint used" : ""}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 border-2 border-red-400/50 flex items-center justify-center">
                        <X className="w-10 h-10 text-red-400 animate-pulse" />
                      </div>
                      <div className="text-2xl font-black text-white">
                        {mode === "streak" ? "Streak Ended!" : "Failed!"}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {mode === "streak" ? `You reached a streak of ${currentMoveIdx}!` : "You ran out of attempts."}
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={onNext}
                    className="mt-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-green-500 text-white rounded-2xl font-bold text-sm flex items-center gap-2 mx-auto shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    {mode === "streak" && attempts > 0 ? "Restart Streak" : "Next Puzzle"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {game && (
              <Chessboard
                options={{
                  position: game.fen(),
                  onPieceDrop: handleDrop,
                  onSquareClick: handleSquareClick,
                  boardOrientation: orientation,
                  allowDragging: status === "solving",
                  darkSquareStyle: { backgroundColor: "#769656" },
                  lightSquareStyle: { backgroundColor: "#eeeed2" },
                  squareStyles,
                  animationDurationInMs: 180,
                }}
              />
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col p-5 space-y-4 border-t lg:border-t-0 lg:border-l border-[#2b2925] min-h-[400px]">
          {/* Tab selector */}
          <div className="flex bg-surface-200 border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("puzzle")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "puzzle"
                  ? "bg-surface-300 text-white shadow-sm border border-white/5"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Target className="w-3.5 h-3.5" /> Puzzle
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "stats"
                  ? "bg-surface-300 text-white shadow-sm border border-white/5"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Stats
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex-grow flex flex-col space-y-4 min-h-0"
            >
              {activeTab === "puzzle" ? (
                <>
              {/* Target / Turn Indicator */}
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-200/50 border border-white/5 rounded-xl">
                <div className={`w-3 h-3 rounded-full border border-white/20 ${orientation === "white" ? "bg-white" : "bg-black"}`} />
                <span className="text-[10px] font-extrabold text-white">
                  {orientation === "white" ? "White" : "Black"} to Move
                </span>
              </div>

              {/* Puzzle description */}
              <div className="space-y-1.5 bg-surface-200/20 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {puzzle.description}
                </p>
                {/* Theme tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {puzzle.themes.slice(0, 4).map((t) => {
                    const cfg = getTheme(t);
                    return (
                      <span key={t} className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        {t}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Status message */}
              <div className="min-h-14">
                {status === "solving" && (
                  <div className="flex items-center gap-2.5 p-3 bg-surface-200 border border-white/5 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white">Find the best move</div>
                      <div className="text-[10px] text-slate-500">Move {currentMoveIdx + 1} of {puzzle.solution.length}</div>
                    </div>
                  </div>
                )}
                {status === "correct" && (
                  <div className="flex items-center gap-2.5 p-3 bg-green-500/10 border border-green-500/20 rounded-2xl animate-in fade-in duration-200">
                    <Check className="w-5 h-5 text-green-400 shrink-0" />
                    <div>
                      <div className="text-xs font-extrabold text-green-300">Correct!</div>
                      <div className="text-[10px] text-slate-400">Opponent is responding...</div>
                    </div>
                  </div>
                )}
                {status === "wrong" && (
                  <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in duration-100">
                    <X className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <div className="text-xs font-extrabold text-red-300">Not the right move</div>
                      <div className="text-[10px] text-slate-400">Try again!</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Attempts tracker */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mistakes:</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i < attempts ? "bg-red-400" : "bg-surface-300 border border-white/10"}`}
                    />
                  ))}
                  {attempts > 3 && <span className="text-[9px] text-red-400 font-bold">+{attempts - 3}</span>}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                {status !== "completed" && (
                  <>
                    <button
                      onClick={getHint}
                      disabled={status !== "solving"}
                      className="w-full py-2.5 bg-surface-200 border border-white/10 text-slate-300 hover:text-white hover:bg-surface-300 disabled:opacity-40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      Get Hint
                      {hintUsed && <span className="text-[9px] text-yellow-400/60">(used)</span>}
                    </button>
                    <button
                      onClick={handleGiveUp}
                      disabled={status !== "solving"}
                      className="w-full py-2.5 bg-red-500/5 border border-red-500/15 text-red-400 hover:bg-red-500/10 disabled:opacity-40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Give Up & See Solution
                    </button>
                    <button
                      onClick={onNext}
                      className="w-full py-2.5 bg-surface-200 border border-white/10 text-slate-300 hover:text-white hover:bg-surface-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      Skip Puzzle
                    </button>
                  </>
                )}
                {status === "completed" && (
                  <>
                    <button
                      onClick={() => {
                        window.open(`/analysis?fen=${encodeURIComponent(puzzle.fen)}`, "_blank");
                      }}
                      className="w-full py-2.5 bg-surface-200 border border-white/10 text-slate-300 hover:text-white hover:bg-surface-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Target className="w-4 h-4 text-purple-400" /> Analyze with Engine
                    </button>
                    <button
                      onClick={onNext}
                      className="w-full py-3 bg-gradient-to-r from-primary-600 to-green-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 cursor-pointer"
                    >
                      Next Puzzle <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Session History */}
              <div className="pt-3 border-t border-white/5 space-y-2 flex-1 flex flex-col min-h-0">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Session History
                </div>
                {history.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic">No puzzles solved in this session yet.</div>
                ) : (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {history.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold border ${
                          entry.success
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}
                      >
                        {entry.success ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                        <span>#{idx + 1}</span>
                        <span className="opacity-60 font-medium">({entry.rating})</span>
                        <span className="font-mono">{entry.change >= 0 ? `+${entry.change}` : entry.change}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Quick stats grid */}
              <div className="grid grid-cols-2 gap-2 bg-surface-200/30 p-3 rounded-xl border border-white/5">
                {[
                  { label: "Solved Today", value: stats.solvedTotal, color: "text-white" },
                  { label: "Success Rate", value: `${stats.successRate}%`, color: "text-green-400" },
                  { label: "Current Streak", value: stats.streakCount, color: "text-orange-400" },
                  { label: "Best Streak", value: stats.bestStreak, color: "text-yellow-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-surface-200/50 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
                    <span className={`text-sm font-black mt-1 ${color}`}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Progress by Difficulty */}
              <div className="bg-surface-200/20 p-3 rounded-xl border border-white/5 space-y-3">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary-400" /> By Difficulty
                </h4>
                {[
                  { label: "Easy   (<1100)", pct: 92, color: "#4ade80" },
                  { label: "Medium (1100–1499)", pct: 78, color: "#facc15" },
                  { label: "Hard   (1500+)", pct: 61, color: "#f87171" },
                ].map(({ label, pct, color }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                      <span>{label}</span>
                      <span style={{ color }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
