"use client";

import React, { useState, useEffect, useCallback } from "react";
import PuzzleBoard from "@/components/chess/PuzzleBoard";
import { seedPuzzles, Puzzle } from "@/lib/chess/puzzles";
import { Flame, Trophy, Zap, BarChart2, Star, Target,
  Brain, Clock, TrendingUp, ChevronRight, Shuffle, Infinity as InfinityIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Chess } from "chess.js";
import { useGameStore } from "@/store/gameStore";

type Mode = "daily" | "streak" | "rush" | "endless" | "weakness";
type Difficulty = "all" | "easy" | "medium" | "hard";

const DIFFICULTY_CFG = {
  all:    { label: "All",    color: "text-slate-400",  border: "border-slate-500/30",  bg: "bg-slate-500/10"  },
  easy:   { label: "Easy",   color: "text-green-400",  border: "border-green-500/30",  bg: "bg-green-500/10"  },
  medium: { label: "Medium", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
  hard:   { label: "Hard",   color: "text-red-400",    border: "border-red-500/30",    bg: "bg-red-500/10"    },
};

const MODE_CFG = {
  daily:    { label: "Daily Puzzle",     Icon: Star,         desc: "One puzzle per day to sharpen your skills",        accent: "from-primary-600 to-accent-600"    },
  streak:   { label: "Puzzle Streak",    Icon: Flame,        desc: "Solve as many as you can without a single mistake", accent: "from-orange-600 to-red-600"          },
  rush:     { label: "Puzzle Rush",      Icon: Zap,          desc: "Solve as many as possible in 3 minutes",           accent: "from-yellow-600 to-orange-500"      },
  endless:  { label: "Endless Practice", Icon: InfinityIcon, desc: "Solve endless puzzles with no time limits",        accent: "from-blue-600 to-cyan-500"          },
  weakness: { label: "Weakness Training", Icon: Target,       desc: "Solve puzzles targeting your game blunder history",  accent: "from-red-600 to-purple-600"         },
};

const THEME_CFG = {
  all:       { label: "All Themes" },
  mateIn1:   { label: "Mate in 1" },
  mateIn2:   { label: "Mate in 2" },
  fork:      { label: "Forks" },
  pin:       { label: "Pins" },
  skewer:    { label: "Skewers" },
  sacrifice: { label: "Sacrifices" },
  endgame:   { label: "Endgames" },
  opening:   { label: "Openings" },
};

const PUZZLE_COUNTS: Record<Difficulty, Record<string, number>> = {
  all: {
    all: 9728,
    mateIn1: 879,
    mateIn2: 1098,
    fork: 1378,
    pin: 612,
    skewer: 215,
    sacrifice: 719,
    endgame: 4494,
    opening: 1000,
  },
  easy: {
    all: 2361,
    mateIn1: 565,
    mateIn2: 514,
    fork: 461,
    pin: 58,
    skewer: 69,
    sacrifice: 86,
    endgame: 1315,
    opening: 300,
  },
  medium: {
    all: 2545,
    mateIn1: 246,
    mateIn2: 362,
    fork: 387,
    pin: 144,
    skewer: 72,
    sacrifice: 145,
    endgame: 1139,
    opening: 400,
  },
  hard: {
    all: 4838,
    mateIn1: 68,
    mateIn2: 226,
    fork: 531,
    pin: 412,
    skewer: 74,
    sacrifice: 488,
    endgame: 2045,
    opening: 300,
  },
};

export default function PuzzlesPage() {
  const router = useRouter();
  const store = useGameStore();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("username")) {
      router.push("/auth/signin");
    }
  }, [router]);

  const [mode, setMode]               = useState<Mode>("daily");
  const [difficulty, setDifficulty]   = useState<Difficulty>("all");
  const [puzzleIdx, setPuzzleIdx]     = useState(0);

  // Weakness training states
  const [detectedWeaknesses, setDetectedWeaknesses] = useState<string[]>([]);
  const [scanningStatus, setScanningStatus] = useState<"idle" | "scanning" | "done">("idle");

  // Stats
  interface HistoryEntry {
    id: string;
    rating: number;
    success: boolean;
    change: number;
  }

  const [puzzleRating, setPuzzleRating] = useState(1500);
  const [solvedTotal, setSolvedTotal]   = useState(128);
  const [attemptedTotal, setAttemptedTotal] = useState(152); // 128 / 152 = 84.2% success
  const successRate = attemptedTotal > 0 ? parseFloat(((solvedTotal / attemptedTotal) * 100).toFixed(1)) : 0;
  const [streakCount, setStreakCount]   = useState(0);
  const [bestStreak, setBestStreak]     = useState(24);
  const [history, setHistory]           = useState<HistoryEntry[]>([]);

  // Rush
  const [rushScore, setRushScore]       = useState(0);
  const [rushTimeLeft, setRushTimeLeft] = useState(180);
  const [rushActive, setRushActive]     = useState(false);

  const [puzzleCache, setPuzzleCache] = useState<Puzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(seedPuzzles[0]);
  const [isLoadingPuzzle, setIsLoadingPuzzle] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("all");

  const getSeedFallback = useCallback((diff: Difficulty, themeStr: string): Puzzle => {
    const localFiltered = seedPuzzles.filter((p) => {
      if (diff === "easy" && p.rating >= 1100) return false;
      if (diff === "medium" && (p.rating < 1100 || p.rating >= 1500)) return false;
      if (diff === "hard" && p.rating < 1500) return false;
      
      if (themeStr !== "all") {
        const hasTheme = p.themes.some((t) => {
          const cleanT = t.toLowerCase().replace(/\s/g, "");
          const cleanThemeStr = themeStr.toLowerCase();
          return cleanT === cleanThemeStr || cleanT.includes(cleanThemeStr);
        });
        if (!hasTheme) return false;
      }
      return true;
    });

    if (localFiltered.length > 0) {
      return localFiltered[Math.floor(Math.random() * localFiltered.length)];
    }

    const ratingOnly = seedPuzzles.filter((p) => {
      if (diff === "easy") return p.rating < 1100;
      if (diff === "medium") return p.rating >= 1100 && p.rating < 1500;
      if (diff === "hard") return p.rating >= 1500;
      return true;
    });

    return ratingOnly[Math.floor(Math.random() * ratingOnly.length)] ?? seedPuzzles[0];
  }, []);

  const fetchPuzzleBatch = useCallback(async (diff: Difficulty, themeStr: string): Promise<Puzzle[]> => {
    let minRating = 600;
    let maxRating = 3000;
    if (diff === "easy") { minRating = 600; maxRating = 1100; }
    else if (diff === "medium") { minRating = 1100; maxRating = 1500; }
    else if (diff === "hard") { minRating = 1500; maxRating = 3000; }

    const countMap = PUZZLE_COUNTS[diff];
    const totalCount = countMap ? (countMap[themeStr] ?? countMap["all"] ?? 50) : 50;
    const maxStart = Math.max(0, totalCount - 15);
    const start = Math.floor(Math.random() * (maxStart + 1));

    let url = `/api/puzzles?min_rating=${minRating}&max_rating=${maxRating}&limit=15&start=${start}`;
    if (themeStr !== "all") {
      url += `&themes=${themeStr}`;
    }
    
    try {
      let res = await fetch(url);
      let data = await res.json();
      
      // If we got nothing, fallback to start = 0
      if (!Array.isArray(data) || data.length === 0) {
        let fallbackUrl = `/api/puzzles?min_rating=${minRating}&max_rating=${maxRating}&limit=15&start=0`;
        if (themeStr !== "all") {
          fallbackUrl += `&themes=${themeStr}`;
        }
        res = await fetch(fallbackUrl);
        data = await res.json();
      }

      if (Array.isArray(data) && data.length > 0) {
        const parsedPuzzles = data.map((p: any) => {
          try {
            const c = new Chess(p.FEN);
            const moves = p.Moves.split(" ");
            
            // Setup move
            const setupMove = moves[0];
            const from = setupMove.slice(0, 2);
            const to = setupMove.slice(2, 4);
            const prom = setupMove.length === 5 ? setupMove[4] : undefined;
            
            const legal = c.move({ from, to, promotion: prom });
            if (!legal) return null;
            
            const startFen = c.fen();
            const solution = moves.slice(1);
            
            // Verify solution legality
            const verifyC = new Chess(startFen);
            for (const m of solution) {
              const sf = m.slice(0, 2);
              const st = m.slice(2, 4);
              const sp = m.length === 5 ? m[4] : undefined;
              const ok = verifyC.move({ from: sf, to: st, promotion: sp });
              if (!ok) return null;
            }

            return {
              id: "api-" + p.PuzzleId,
              title: p.OpeningTags ? `Opening: ${p.OpeningTags}` : "Tactics Puzzle",
              description: `Find the best move sequence. Play as ${c.turn() === 'w' ? "White" : "Black"}.`,
              fen: startFen,
              solution,
              rating: p.Rating,
              themes: p.Themes ? p.Themes.split(" ") : []
            } as Puzzle;
          } catch (e) {
            return null;
          }
        }).filter((p): p is Puzzle => p !== null);

        if (parsedPuzzles.length > 0) {
          return parsedPuzzles;
        }
      }
    } catch (e) {
      console.error("Error fetching puzzle batch:", e);
    }
    return [];
  }, []);

  // Fetch puzzle batch on mount or when difficulty/theme changes
  useEffect(() => {
    let active = true;
    setIsLoadingPuzzle(true);
    
    async function init() {
      // Clear cache and fetch new batch
      setPuzzleCache([]);
      const batch = await fetchPuzzleBatch(difficulty, selectedTheme);
      if (!active) return;
      
      if (batch.length > 0) {
        setCurrentPuzzle(batch[0]);
        setPuzzleCache(batch.slice(1));
      } else {
        // Fallback to seeds
        setCurrentPuzzle(getSeedFallback(difficulty, selectedTheme));
      }
      setIsLoadingPuzzle(false);
    }
    
    init();
    return () => {
      active = false;
    };
  }, [difficulty, selectedTheme, fetchPuzzleBatch]);

  // Rush countdown
  useEffect(() => {
    if (!rushActive) return;
    if (rushTimeLeft <= 0) { setRushActive(false); return; }
    const t = setInterval(() => setRushTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [rushActive, rushTimeLeft]);

  const handleSolve = useCallback((success: boolean, isGameOver?: boolean) => {
    let change = 0;
    
    if (mode === "daily" || mode === "endless") {
      if (success) {
        change = 12;
        setPuzzleRating((p) => p + 12);
        setSolvedTotal((p) => p + 1);
      } else {
        change = -8;
        setPuzzleRating((p) => Math.max(800, p - 8));
      }
      setAttemptedTotal((p) => p + 1);
    } else if (mode === "streak") {
      setAttemptedTotal((p) => p + 1);
      if (success) {
        change = 12;
        setSolvedTotal((p) => p + 1);
        setStreakCount((p) => {
          const next = p + 1;
          if (next > bestStreak) setBestStreak(next);
          return next;
        });
      } else {
        change = -8;
        setStreakCount(0);
        setPuzzleIdx(0);
      }
    } else if (mode === "rush" && rushActive) {
      setAttemptedTotal((p) => p + 1);
      if (success) {
        change = 12;
        setSolvedTotal((p) => p + 1);
        setRushScore((p) => p + 1);
      } else {
        change = -8;
      }
      if (isGameOver) {
        setRushActive(false);
      }
    }

    setHistory((prev) => [
      ...prev,
      {
        id: currentPuzzle.id,
        rating: currentPuzzle.rating,
        success,
        change,
      },
    ]);
  }, [mode, rushActive, bestStreak, currentPuzzle]);

  const handleNext = useCallback(async () => {
    setPuzzleIdx((p) => p + 1);
    
    if (puzzleCache.length > 0) {
      const next = puzzleCache[0];
      setCurrentPuzzle(next);
      setPuzzleCache((prev) => prev.slice(1));
      
      // If cache is running low, prefetch in background
      if (puzzleCache.length <= 5) {
        fetchPuzzleBatch(difficulty, selectedTheme).then((newBatch) => {
          if (newBatch.length > 0) {
            setPuzzleCache((prev) => [...prev, ...newBatch]);
          }
        });
      }
    } else {
      // Inline load with loading indicator if cache is empty
      setIsLoadingPuzzle(true);
      const batch = await fetchPuzzleBatch(difficulty, selectedTheme);
      if (batch.length > 0) {
        setCurrentPuzzle(batch[0]);
        setPuzzleCache(batch.slice(1));
      } else {
        setCurrentPuzzle(getSeedFallback(difficulty, selectedTheme));
      }
      setIsLoadingPuzzle(false);
    }
  }, [difficulty, selectedTheme, puzzleCache, fetchPuzzleBatch]);

  const startRush = () => {
    setRushScore(0);
    setRushTimeLeft(180);
    setRushActive(true);
    setPuzzleIdx(0);
  };

  const rushPct = (rushTimeLeft / 180) * 100;
  const rushColor = rushTimeLeft > 60 ? "#4ade80" : rushTimeLeft > 30 ? "#facc15" : "#f87171";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-100 p-7 border border-[#3d3b38] flex flex-col sm:flex-row justify-between items-center gap-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Puzzle Training</h1>
            <p className="text-slate-400 text-xs mt-0.5">Sharpen your tactical vision with engine-verified positions</p>
          </div>
        </div>
        {/* Puzzle Elo */}
        <div className="flex items-center gap-3 px-5 py-3 bg-surface-200 border border-[#2b2925] rounded-2xl relative z-10">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Puzzle Elo</div>
            <div className="text-xl font-black text-white">{puzzleRating}</div>
          </div>
          <div className="w-px h-8 bg-white/10 mx-1" />
          <div>
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Solved</div>
            <div className="text-xl font-black text-white">{solvedTotal}</div>
          </div>
        </div>
      </section>

      {/* ── Mode tabs + Difficulty ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Mode tabs */}
        <div className="flex gap-1 bg-surface-100 border border-[#3d3b38] p-1 rounded-2xl">
          {(Object.entries(MODE_CFG) as [Mode, typeof MODE_CFG[Mode]][]).map(([id, cfg]) => (
            <button
              key={id}
              onClick={() => { setMode(id); setRushActive(false); setPuzzleIdx(0); setStreakCount(0); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === id
                  ? `bg-gradient-to-r ${cfg.accent} text-white shadow-lg`
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <cfg.Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Difficulty pills */}
        <div className="flex gap-1 flex-wrap">
          {(Object.entries(DIFFICULTY_CFG) as [Difficulty, typeof DIFFICULTY_CFG[Difficulty]][]).map(([d, cfg]) => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); setPuzzleIdx(0); }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border uppercase tracking-wide transition-all cursor-pointer ${
                difficulty === d ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-[#2b2925] text-slate-500 hover:text-slate-300"
              }`}
            >
              {cfg.label}
            </button>
          ))}
          <button
            onClick={handleNext}
            className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold border border-[#2b2925] text-slate-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
          >
            <Shuffle className="w-3 h-3" />
            Shuffle
          </button>
        </div>
      </div>

      {/* ── Tactical Themes Filter ───────────────────────────────────────── */}
      <div className="bg-surface-100 border border-[#3d3b38] p-4 rounded-2xl space-y-2.5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2 relative z-10">
          <Target className="w-4 h-4 text-primary-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Themes</span>
        </div>
        <div className="flex flex-wrap gap-1.5 relative z-10">
          {(Object.entries(THEME_CFG) as [string, { label: string }][]).map(([t, cfg]) => (
            <button
              key={t}
              onClick={() => { setSelectedTheme(t); setPuzzleIdx(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedTheme === t
                  ? "bg-primary-500/10 border-primary-500/50 text-primary-400 shadow-sm"
                  : "border-[#2b2925] bg-surface-200/55 text-slate-400 hover:text-white hover:border-[#3d3b38]"
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rush banner / Streak banner ──────────────────────────────────── */}
      {mode === "rush" && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-4">
          <Zap className="w-5 h-5 text-yellow-400 shrink-0" />
          {rushActive ? (
            <>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white">Score: <span className="text-yellow-300">{rushScore}</span></span>
                  <span style={{ color: rushColor }} className="font-mono text-sm">
                    {String(Math.floor(rushTimeLeft / 60)).padStart(2, "0")}:{String(rushTimeLeft % 60).padStart(2, "0")}
                  </span>
                </div>
                <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${rushPct}%`, backgroundColor: rushColor }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">Puzzle Rush — 3 Minutes</div>
                <div className="text-[10px] text-slate-400">{rushScore > 0 ? `Last score: ${rushScore}` : "Solve as many puzzles as possible!"}</div>
              </div>
              <button
                onClick={startRush}
                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-yellow-500/25"
              >
                {rushScore > 0 ? "Play Again" : "Start Rush"}
              </button>
            </>
          )}
        </div>
      )}

      {mode === "streak" && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-4">
          <Flame className="w-5 h-5 text-orange-400 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Current Streak: <span className="text-orange-300">{streakCount}</span></div>
            <div className="text-[10px] text-slate-400">One wrong move ends your streak!</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Best</div>
            <div className="text-lg font-black text-orange-300">{bestStreak}</div>
          </div>
        </div>
      )}

      {mode === "endless" && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4">
          <InfinityIcon className="w-5 h-5 text-blue-400 shrink-0 animate-pulse" />
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Endless Practice Mode</div>
            <div className="text-[10px] text-slate-400">
              Practicing <span className="text-blue-300 font-extrabold">{THEME_CFG[selectedTheme as keyof typeof THEME_CFG]?.label ?? "Tactics"}</span> (
              <span className="text-blue-300 font-semibold">{DIFFICULTY_CFG[difficulty]?.label ?? "All"}</span> difficulty) without pressure. Take your time to find the best moves!
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Solved</div>
            <div className="text-lg font-black text-blue-300">{solvedTotal}</div>
          </div>
        </div>
      )}

      {/* ── Rush: show start screen if not active ──────────────────────── */}
      {mode === "rush" && !rushActive && rushScore === 0 ? (
        <div className="bg-surface-100 border border-[#3d3b38] rounded-3xl p-16 text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <Zap className="w-12 h-12 text-yellow-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">Ready for Puzzle Rush?</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
              Solve as many puzzles as you can in 3 minutes. Speed and accuracy both matter!
            </p>
          </div>
          <button
            onClick={startRush}
            className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black rounded-2xl shadow-xl shadow-yellow-500/25 hover:scale-105 transition-all cursor-pointer text-sm"
          >
            Start Rush ⚡
          </button>
        </div>
      ) : (
        <div className="w-full relative">
          {isLoadingPuzzle && (
            <div className="absolute inset-0 z-50 bg-surface-100/50 backdrop-blur-sm flex items-center justify-center rounded-3xl">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <PuzzleBoard
            key={currentPuzzle.id}
            puzzle={currentPuzzle}
            onSolve={handleSolve}
            onNext={handleNext}
            mode={mode}
            history={history}
            stats={{
              solvedTotal,
              successRate,
              streakCount,
              bestStreak,
              puzzleRating
            }}
          />
        </div>
      )}
    </div>
  );
}
