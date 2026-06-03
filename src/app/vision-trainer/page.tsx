"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import { 
  Eye, 
  Play, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Clock, 
  Target, 
  ChevronRight,
  TrendingUp,
  Settings,
  HelpCircle
} from "lucide-react";
import { chessAudio } from "@/utils/chessAudio";

type GameMode = "coordinates" | "colors";
type Orientation = "white" | "black";

const SQUARES = [
  "a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1",
  "a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2",
  "a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3",
  "a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4",
  "a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5",
  "a6", "b6", "c6", "d6", "e6", "f6", "g6", "h6",
  "a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7",
  "a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8",
];

// Helper to determine square color (true = light, false = dark)
function isLightSquare(sq: string): boolean {
  const file = sq.charCodeAt(0) - 97; // a=0, b=1, etc.
  const rank = parseInt(sq[1]) - 1;   // 1=0, 2=1, etc.
  return (file + rank) % 2 !== 0;
}

export default function VisionTrainerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("coordinates");
  const [orientation, setOrientation] = useState<Orientation>("white");
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [timeLeft, setTimeLeft] = useState(30);
  const [target, setTarget] = useState("");
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const [squareStyles, setSquareStyles] = useState<Record<string, React.CSSProperties>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`vision_high_${gameMode}`);
      if (saved) setHighScore(parseInt(saved));
    }
  }, [gameMode]);

  const selectNewTarget = useCallback(() => {
    let nextTarget = target;
    while (nextTarget === target) {
      nextTarget = SQUARES[Math.floor(Math.random() * SQUARES.length)];
    }
    setTarget(nextTarget);
  }, [target]);

  const startTraining = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setTimeLeft(30);
    setScore(0);
    setAttempts(0);
    setLastCorrect(null);
    setSquareStyles({});
    selectNewTarget();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endTraining();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endTraining = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Save high score
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(`vision_high_${gameMode}`, score.toString());
    }
  };

  const flashSquareFeedback = (square: string, isCorrect: boolean) => {
    setSquareStyles({
      [square]: { 
        backgroundColor: isCorrect ? "rgba(74, 222, 128, 0.6)" : "rgba(239, 68, 68, 0.6)",
        boxShadow: `inset 0 0 0 3px ${isCorrect ? "#22c55e" : "#ef4444"}`
      }
    });
    setTimeout(() => {
      setSquareStyles({});
    }, 250);
  };

  const handleSquareClick = (square: string) => {
    if (!isPlaying || gameMode !== "coordinates") return;

    setAttempts((prev) => prev + 1);
    const correct = square === target;

    if (correct) {
      setScore((prev) => prev + 1);
      setLastCorrect(true);
      if (soundEnabled) chessAudio.playPuzzleCorrect();
      flashSquareFeedback(square, true);
      selectNewTarget();
    } else {
      setLastCorrect(false);
      if (soundEnabled) chessAudio.playPuzzleWrong();
      flashSquareFeedback(square, false);
    }
  };

  const handleColorChoice = (choice: "light" | "dark") => {
    if (!isPlaying || gameMode !== "colors") return;

    setAttempts((prev) => prev + 1);
    const isLight = isLightSquare(target);
    const correct = (choice === "light" && isLight) || (choice === "dark" && !isLight);

    if (correct) {
      setScore((prev) => prev + 1);
      setLastCorrect(true);
      if (soundEnabled) chessAudio.playPuzzleCorrect();
      flashSquareFeedback(target, true);
    } else {
      setLastCorrect(false);
      if (soundEnabled) chessAudio.playPuzzleWrong();
      flashSquareFeedback(target, false);
    }

    // Always select next target to avoid getting stuck
    selectNewTarget();
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* ── Header banner ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-50/20 p-6 border border-[#1a201b] flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Vision Trainer</h1>
            <p className="text-slate-400 text-xs mt-0.5">Sharpen square notation coordinates and color awareness reflexes</p>
          </div>
        </div>

        {/* Sound & Configuration toggles */}
        <div className="flex gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-10 h-10 rounded-xl border border-[#1a201b] bg-[#121613] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-primary-400" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </section>

      {/* ── Main Panel Split ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Chessboard Wrapper */}
        <div className="lg:col-span-2 bg-[#121613] border border-[#1d241f] rounded-3xl p-6 relative overflow-hidden flex flex-col items-center">
          
          {/* Start Overlay */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center animate-pulse">
                <Play className="w-8 h-8 text-primary-400 fill-current ml-1" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-xl font-black text-white">Board Vision Challenge</h3>
                <p className="text-slate-400 text-xs mt-2">
                  Click matching coordinate squares or guess their color as quickly as you can inside 30 seconds!
                </p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => { setGameMode("coordinates"); startTraining(); }}
                  className="px-6 py-3 bg-[#6fa93f] hover:bg-[#8ae43c] text-white rounded-xl text-xs font-black transition-all btn-press shadow-lg"
                >
                  Start Coordinates (Sight)
                </button>
                <button
                  onClick={() => { setGameMode("colors"); startTraining(); }}
                  className="px-6 py-3 border border-[#1a201b] hover:bg-surface-200/50 text-white rounded-xl text-xs font-black transition-all btn-press"
                >
                  Start Colors Quiz
                </button>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500 flex items-center justify-center animate-bounce">
                <Trophy className="w-8 h-8 text-primary-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Challenge Completed!</h3>
                <div className="text-slate-400 text-xs mt-1">Here is your performance snapshot:</div>
              </div>

              <div className="grid grid-cols-3 gap-6 text-center bg-[#0a0c0a] border border-[#1a201b] p-5 rounded-2xl max-w-md w-full">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Score</div>
                  <div className="text-2xl font-black text-white mt-1">{score}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Accuracy</div>
                  <div className="text-2xl font-black text-primary-400 mt-1">{accuracy}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">High Score</div>
                  <div className="text-2xl font-black text-yellow-400 mt-1">{highScore}</div>
                </div>
              </div>

              <button
                onClick={startTraining}
                className="px-8 py-3 bg-[#6fa93f] hover:bg-[#8ae43c] text-white rounded-xl text-xs font-black transition-all btn-press shadow-lg"
              >
                Restart Session 🔄
              </button>
            </div>
          )}

          {/* Chessboard Container */}
          <div className="aspect-square w-full max-w-[480px] rounded-2xl overflow-hidden border border-[#1a201b]">
            <Chessboard
              options={{
                position: "8/8/8/8/8/8/8/8 w - - 0 1", // Empty board
                boardOrientation: orientation,
                allowDragging: false,
                onSquareClick: ({ square }) => handleSquareClick(square),
                darkSquareStyle: { backgroundColor: "#769656" },
                lightSquareStyle: { backgroundColor: "#eeeed2" },
                squareStyles,
                showNotation: showCoordinates,
              }}
            />
          </div>
        </div>

        {/* Right Side: Ticker Panel & Settings */}
        <div className="space-y-4">
          
          {/* Target Coordinator & Live Ticker */}
          <div className="bg-[#121613] border border-[#1d241f] rounded-3xl p-6 text-center space-y-4">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Target</span>
            
            {isPlaying ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-4">
                <div className="text-6xl font-black text-white uppercase tracking-tight font-mono select-none">{target}</div>
                <div className="text-[11px] text-slate-400 font-bold">
                  {gameMode === "coordinates" ? "Click the square on the board" : "Is it Light or Dark?"}
                </div>

                {gameMode === "colors" && (
                  <div className="flex gap-2 w-full pt-3">
                    <button
                      onClick={() => handleColorChoice("light")}
                      className="flex-1 py-3 bg-white text-black hover:bg-slate-200 border border-slate-300 font-black rounded-xl text-xs transition-all btn-press cursor-pointer"
                    >
                      Light Square
                    </button>
                    <button
                      onClick={() => handleColorChoice("dark")}
                      className="flex-1 py-3 bg-[#2b2925] text-white hover:bg-black border border-[#1a201b] font-black rounded-xl text-xs transition-all btn-press cursor-pointer"
                    >
                      Dark Square
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-3xl font-black text-slate-500 py-6 uppercase font-mono select-none">--</div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-[#0a0c0a] border border-[#1a201b] rounded-xl flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">Time Left</div>
                  <div className="text-lg font-black text-white font-mono leading-none mt-0.5">{timeLeft}s</div>
                </div>
              </div>

              <div className="p-3 bg-[#0a0c0a] border border-[#1a201b] rounded-xl flex items-center gap-3">
                <Target className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[9px] text-slate-500 font-bold uppercase">Score</div>
                  <div className="text-lg font-black text-white font-mono leading-none mt-0.5">{score}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Vision Training Options */}
          <div className="bg-[#121613] border border-[#1d241f] rounded-3xl p-6 space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Training Settings
            </h4>

            {/* Mode selection */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">Select Training Task</label>
              <div className="flex bg-[#0a0c0a] border border-[#1a201b] p-1 rounded-xl">
                <button
                  disabled={isPlaying}
                  onClick={() => setGameMode("coordinates")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    gameMode === "coordinates" ? "bg-surface-200 text-white shadow border border-white/5" : "text-slate-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  Coordinates
                </button>
                <button
                  disabled={isPlaying}
                  onClick={() => setGameMode("colors")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    gameMode === "colors" ? "bg-surface-200 text-white shadow border border-white/5" : "text-slate-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  Colors Quiz
                </button>
              </div>
            </div>

            {/* Orientation */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">Board Orientation</label>
              <div className="flex bg-[#0a0c0a] border border-[#1a201b] p-1 rounded-xl">
                <button
                  disabled={isPlaying}
                  onClick={() => setOrientation("white")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orientation === "white" ? "bg-surface-200 text-white shadow border border-white/5" : "text-slate-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  White
                </button>
                <button
                  disabled={isPlaying}
                  onClick={() => setOrientation("black")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orientation === "black" ? "bg-surface-200 text-white shadow border border-white/5" : "text-slate-400 hover:text-white disabled:opacity-40"
                  }`}
                >
                  Black
                </button>
              </div>
            </div>

            {/* Coordinate labels */}
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-slate-400 font-medium">Show Board Notation Labels</span>
              <button
                onClick={() => setShowCoordinates(!showCoordinates)}
                className={`w-10 h-6 rounded-full p-1 transition-all ${showCoordinates ? "bg-primary-500" : "bg-[#1a201b]"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-all ${showCoordinates ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
