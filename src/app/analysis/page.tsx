"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useStockfish } from "@/hooks/useStockfish";
import ChessboardWrapper from "@/components/chess/ChessboardWrapper";
import EvaluationBar from "@/components/chess/EvaluationBar";
import MoveClassBadge from "@/components/chess/MoveClassBadge";
import { useGameStore } from "@/store/gameStore";
import { fetchChesscomGames, fetchLichessGames } from "@/lib/network/externalApis";
import { chessAudio } from "@/utils/chessAudio";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Database,
  FileText,
  Play,
  Sparkles,
  Award,
  Search,
  RefreshCw,
  X,
  Zap,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Shield,
  BookOpen,
  MessageSquare,
  Volume2,
  VolumeX,
  Target,
} from "lucide-react";

import {
  MoveClass,
  PositionData,
  CoachExplanation,
  classifyMove,
  analyzePosition,
  detectOpening,
  calculateAccuracy,
  generateExplanation,
  countMaterial,
} from "@/lib/chess/analysis/MoveClassifier";

interface ReviewedMove {
  san: string;
  fen: string;
  fenBefore: string;
  classification: MoveClass;
  cpBefore: number;
  cpAfter: number;
  cpLoss: number;
  bestMove?: string;
  explanation?: CoachExplanation;
  motifs: string[];
  phase: "Opening" | "Middlegame" | "Endgame";
  alternativeMoves?: Array<{ move: string; score: number; type: "cp" | "mate" }>;
}

interface GameReview {
  moves: ReviewedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
  counts: Record<MoveClass, number>;
  openingName?: string;
  openingEco?: string;
}

function uciToSan(fenBefore: string, uci: string | undefined): string {
  if (!uci) return "";
  try {
    const temp = new Chess(fenBefore);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.slice(4, 5);
    const move = temp.move({ from, to, promotion });
    return move ? move.san : uci;
  } catch {
    return uci;
  }
}

const classConfig: Record<
  MoveClass,
  { label: string; color: string; bg: string; border: string; Icon: React.ElementType }
> = {
  brilliant:  { label: "Brilliant",  color: "text-cyan-300",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20",   Icon: Zap },
  great:      { label: "Great",      color: "text-teal-300",    bg: "bg-teal-500/10",    border: "border-teal-500/20",   Icon: Zap },
  best:       { label: "Best",       color: "text-green-400",   bg: "bg-green-500/10",   border: "border-green-500/20",  Icon: Star },
  excellent:  { label: "Excellent",  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20",Icon: TrendingUp },
  good:       { label: "Good",       color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",   Icon: Shield },
  book:       { label: "Book",       color: "text-slate-400",   bg: "bg-slate-500/10",   border: "border-slate-500/20",  Icon: BookOpen },
  inaccuracy: { label: "Inaccuracy", color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/20", Icon: Minus },
  mistake:    { label: "Mistake",    color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20", Icon: AlertCircle },
  blunder:    { label: "Blunder",    color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",    Icon: TrendingDown },
  missed_win: { label: "Missed Win", color: "text-slate-300",    bg: "bg-slate-500/10",   border: "border-slate-500/20",  Icon: Target },
};

// ─── Game Search Panel ────────────────────────────────────────────────────────
interface SearchGame {
  id: string;
  platform: "chesscom" | "lichess";
  opponent: string;
  opponentRating: number;
  myRating: number;
  result: "win" | "loss" | "draw";
  date: string;
  pgn?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AnalysisPage() {
  useAuthRedirect();

  // Board state
  const [game, setGame] = useState<Chess | null>(null);
  const [historyMoves, setHistoryMoves] = useState<string[]>([]);
  const [historyFens, setHistoryFens] = useState<string[]>([]);
  const [moveIndex, setMoveIndex] = useState(-1);
  const [pgnInput, setPgnInput] = useState("1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5");
  const [sidebarTab, setSidebarTab] = useState<"analysis" | "moves" | "games">("analysis");

  // Position Cache for deep evaluations
  const positionCacheRef = useRef<Record<string, { cp: number; bestMove: string; topMoves?: any[] }>>({});

  // Player info state
  const [whitePlayer, setWhitePlayer] = useState("White");
  const [blackPlayer, setBlackPlayer] = useState("Black");
  const [whiteElo, setWhiteElo] = useState("");
  const [blackElo, setBlackElo] = useState("");

  // Game history filter
  const [gamesFilter, setGamesFilter] = useState("");

  // Helper to calculate material balance and captured pieces
  const getCapturedPieces = (fen: string) => {
    const piecePart = fen.split(" ")[0];
    const counts: Record<string, number> = {
      P: 0, N: 0, B: 0, R: 0, Q: 0,
      p: 0, n: 0, b: 0, r: 0, q: 0
    };
    for (const char of piecePart) {
      if (counts[char] !== undefined) counts[char]++;
    }
    const pieceValues: Record<string, number> = {
      P: 1, N: 3, B: 3, R: 5, Q: 9,
      p: 1, n: 3, b: 3, r: 5, q: 9
    };

    const blackCaptured: string[] = [];
    let whiteValRemaining = 0;
    const maxWhite = { P: 8, N: 2, B: 2, R: 2, Q: 1 };
    Object.entries(maxWhite).forEach(([p, max]) => {
      const remaining = counts[p] || 0;
      const captured = max - remaining;
      whiteValRemaining += remaining * pieceValues[p];
      for (let i = 0; i < captured; i++) blackCaptured.push(p);
    });

    const whiteCaptured: string[] = [];
    let blackValRemaining = 0;
    const maxBlack = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    Object.entries(maxBlack).forEach(([p, max]) => {
      const remaining = counts[p] || 0;
      const captured = max - remaining;
      blackValRemaining += remaining * pieceValues[p.toLowerCase()];
      for (let i = 0; i < captured; i++) whiteCaptured.push(p);
    });

    const scoreDiff = whiteValRemaining - blackValRemaining;
    return { whiteCaptured, blackCaptured, scoreDiff };
  };

  const renderPlayerInfo = (color: "white" | "black") => {
    const isWhite = color === "white";
    const name = isWhite ? whitePlayer : blackPlayer;
    const elo = isWhite ? whiteElo : blackElo;
    const fen = game ? game.fen() : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const { whiteCaptured, blackCaptured, scoreDiff } = getCapturedPieces(fen);
    
    const captured = isWhite ? whiteCaptured : blackCaptured;
    const getPieceImgSrc = (p: string) => {
      const color = p === p.toUpperCase() ? "w" : "b";
      const type = p.toUpperCase();
      return `https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece/cburnett/${color}${type}.svg`;
    };

    const isUp = isWhite ? scoreDiff > 0 : scoreDiff < 0;
    const absDiff = Math.abs(scoreDiff);

    return (
      <div className="flex items-center justify-between px-4 py-2 bg-[#121613]/85 border border-[#1d241f] rounded-xl text-xs font-bold w-full max-w-[560px] mx-auto select-none transition-all">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full border border-white/10 ${isWhite ? "bg-white" : "bg-black"}`} />
          <span className="text-white font-extrabold">{name}</span>
          {elo && <span className="text-slate-500 font-mono text-[10px]">({elo})</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {captured.map((p, idx) => (
              <img
                key={idx}
                src={getPieceImgSrc(p)}
                alt={p}
                className="w-4 h-4 object-contain opacity-75 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
              />
            ))}
          </div>
          {isUp && (
            <span className="text-[9px] font-black bg-primary-500/10 text-primary-400 border border-primary-500/20 px-1.5 py-0.5 rounded">
              +{absDiff}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Game Review state
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewProgress, setReviewProgress] = useState(0);
  const [gameReview, setGameReview] = useState<GameReview | null>(null);

  // Board width measurement for responsive MoveClassBadge
  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const [boardWidth, setBoardWidth] = useState(480);

  useEffect(() => {
    if (!boardContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBoardWidth(entry.contentRect.width);
      }
    });
    observer.observe(boardContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Key Moments States
  const [keyMoments, setKeyMoments] = useState<Array<{ index: number; move: ReviewedMove }>>([]);
  const [currentKeyMomentIdx, setCurrentKeyMomentIdx] = useState<number>(-1);
  const [isKeyMomentMode, setIsKeyMomentMode] = useState<boolean>(false);
  const [trainerFeedback, setTrainerFeedback] = useState<string>("");
  const [isTrainerSolved, setIsTrainerSolved] = useState<boolean>(false);
  const [solvedMoments, setSolvedMoments] = useState<Record<number, boolean>>({});
  const [reviewDepth, setReviewDepth] = useState<number>(16);

  // Celebration state
  const [celebration, setCelebration] = useState<{
    type: "brilliant" | "great" | "best" | null;
    square: string;
    triggerId: number;
  }>({ type: null, square: "", triggerId: 0 });

  // Custom premium upgrades: Speaking coach & interactive arrows
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeCandidateArrow, setActiveCandidateArrow] = useState<{ from: string; to: string } | null>(null);

  // Game search state
  const [searchPlatform, setSearchPlatform] = useState<"chesscom" | "lichess">("chesscom");
  const [searchUsername, setSearchUsername] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchGame[]>([]);
  const [searchError, setSearchError] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showBestMove, setShowBestMove] = useState(true);
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");





  // Imported games from store
  const storeState = useGameStore();
  const importedGames = storeState.importedGames;

  const { evaluation, isEvaluating, analyzePosition: startStockfishAnalysis } = useStockfish();

  const currentReviewEval = (() => {
    if (!gameReview || historyMoves.length === 0) return null;
    const currentFen = game ? game.fen().split(" ").slice(0, 4).join(" ") : "";
    
    if (moveIndex === -1) {
      const firstMove = gameReview.moves[0];
      if (firstMove) {
        const startFen = firstMove.fenBefore.split(" ").slice(0, 4).join(" ");
        if (currentFen === startFen) {
          return {
            score: firstMove.cpBefore / 100,
            type: Math.abs(firstMove.cpBefore) > 20000 ? ("mate" as const) : ("cp" as const),
            depth: reviewDepth,
            bestMove: firstMove.bestMove,
            topMoves: []
          };
        }
      }
    } else {
      const currentMove = gameReview.moves[moveIndex];
      if (currentMove) {
        const afterFen = currentMove.fen.split(" ").slice(0, 4).join(" ");
        if (currentFen === afterFen) {
          const scoreVal = currentMove.cpAfter;
          const isMate = Math.abs(scoreVal) > 20000;
          let finalScore = 0;
          let finalType: "cp" | "mate" = "cp";
          if (isMate) {
            finalType = "mate";
            const mateMoves = 30000 - Math.abs(scoreVal);
            finalScore = scoreVal > 0 ? -mateMoves : mateMoves;
          } else {
            finalScore = -scoreVal / 100;
          }
          return {
            score: finalScore,
            type: finalType,
            depth: reviewDepth,
            bestMove: currentMove.bestMove,
            topMoves: currentMove.alternativeMoves || []
          };
        }
      }
    }
    return null;
  })();

  const activeEval = currentReviewEval || {
    score: evaluation.score,
    type: evaluation.type,
    depth: evaluation.depth,
    bestMove: evaluation.bestMove,
    topMoves: evaluation.topMoves || []
  };

  // Stockfish worker for deep sequential reviews
  const reviewWorkerRef = useRef<Worker | null>(null);

  const speakCoachExplanation = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")) || 
                         voices.find(v => v.lang.startsWith("en") && v.name.toLowerCase().includes("google")) ||
                         voices.find(v => v.lang.startsWith("en"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const getBestMoveArrow = useCallback(() => {
    const arrows = [];
    if (showBestMove && activeEval?.bestMove && activeEval.bestMove !== "(none)") {
      const from = activeEval.bestMove.slice(0, 2);
      const to = activeEval.bestMove.slice(2, 4);
      arrows.push([from, to, "rgba(34, 197, 94, 0.75)"]);
    }
    if (activeCandidateArrow) {
      arrows.push([activeCandidateArrow.from, activeCandidateArrow.to, "rgba(59, 130, 246, 0.85)"]);
    }
    return arrows;
  }, [showBestMove, activeEval?.bestMove, activeCandidateArrow]);

  // Load chess board on mount
  useEffect(() => {
    let startFen = undefined;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("fen")) startFen = params.get("fen") as string;
    }
    try {
      const newGame = new Chess(startFen);
      setGame(newGame);
      setHistoryMoves([]);
      setHistoryFens([newGame.fen()]);
      setMoveIndex(-1);
    } catch {
      const newGame = new Chess();
      setGame(newGame);
      setHistoryMoves([]);
      setHistoryFens([newGame.fen()]);
      setMoveIndex(-1);
    }
  }, []);

  // Re-evaluate position on move index change
  useEffect(() => {
    if (moveIndex >= -1 && historyMoves.length >= 0) {
      try {
        const tempGame = new Chess();
        for (let i = 0; i <= moveIndex; i++) {
          tempGame.move(historyMoves[i]);
        }
        setGame(tempGame);
        startStockfishAnalysis(tempGame.fen(), 12);

        // Play move/capture/check sound effects when stepping through moves
        if (moveIndex >= 0 && moveIndex < historyMoves.length) {
          // Cancel active speech synthesis to avoid overlapping coach readings
          if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
          }
          setActiveCandidateArrow(null); // Reset highlighted candidate arrow

          const classification = gameReview?.moves[moveIndex]?.classification;
          const hasSpecialBadge = classification && classification !== "good";
          
          if (!hasSpecialBadge) {
            const lastMoveSan = historyMoves[moveIndex];
            const isCheck = lastMoveSan.includes("+") || lastMoveSan.includes("#");
            const isCapture = lastMoveSan.includes("x");
            if (isCheck) {
              chessAudio.playCheck();
            } else if (isCapture) {
              chessAudio.playCapture();
            } else {
              chessAudio.playMove();
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse move step:", e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveIndex, historyMoves, gameReview]);

  // Trigger premium celebration overlay on Brilliant, Great, and Best moves
  useEffect(() => {
    if (moveIndex >= 0 && gameReview && gameReview.moves[moveIndex]) {
      const move = gameReview.moves[moveIndex];
      const classification = move.classification;

      if (classification === "brilliant" || classification === "great" || classification === "best") {
        try {
          const temp = new Chess(historyFens[moveIndex]);
          const san = historyMoves[moveIndex];
          const verbose = temp.moves({ verbose: true }).find(m => m.san === san);
          if (verbose) {
            setCelebration({
              type: classification as any,
              square: verbose.to,
              triggerId: Date.now()
            });

            // Automatically dismiss celebrations after their animation lengths
            const duration = classification === "brilliant" ? 2500 : classification === "great" ? 2000 : 1500;
            const timer = setTimeout(() => {
              setCelebration({ type: null, square: "", triggerId: 0 });
            }, duration);

            return () => clearTimeout(timer);
          }
        } catch (e) {
          console.error("Failed to parse celebration coordinates:", e);
        }
      }
    }
    setCelebration({ type: null, square: "", triggerId: 0 });
  }, [moveIndex, gameReview, historyFens, historyMoves]);

  // Load a game from any source (store, search result, etc)
  const handleLoadGame = (g: { pgn?: string; opponent: string; platform?: string; opponentRating?: number; myRating?: number }) => {
    if (!g.pgn) {
      alert("No PGN available for this game.");
      return;
    }
    try {
      const tempGame = new Chess();
      tempGame.loadPgn(g.pgn);
      const moves = tempGame.history();

      // Rebuild fen history
      const fens: string[] = [];
      const replay = new Chess();
      fens.push(replay.fen());
      for (const m of moves) {
        replay.move(m);
        fens.push(replay.fen());
      }

      const headers = tempGame.header();
      setWhitePlayer(headers["White"] || "White");
      setBlackPlayer(headers["Black"] || "Black");
      setWhiteElo(headers["WhiteElo"] || (g.myRating ? String(g.myRating) : ""));
      setBlackElo(headers["BlackElo"] || (g.opponentRating ? String(g.opponentRating) : ""));

      setHistoryMoves(moves);
      setHistoryFens(fens);
      setMoveIndex(moves.length - 1);
      setGameReview(null);
      setSidebarTab("analysis");
    } catch (e) {
      alert("Failed to parse imported game PGN.");
    }
  };

  // Load and automatically trigger full game review
  const handleReviewGame = (g: { pgn?: string; opponent: string; platform?: string; opponentRating?: number; myRating?: number }) => {
    if (!g.pgn) {
      alert("No PGN available for this game.");
      return;
    }
    try {
      const tempGame = new Chess();
      tempGame.loadPgn(g.pgn);
      const moves = tempGame.history();

      // Rebuild fen history
      const fens: string[] = [];
      const replay = new Chess();
      fens.push(replay.fen());
      for (const m of moves) {
        replay.move(m);
        fens.push(replay.fen());
      }

      const headers = tempGame.header();
      setWhitePlayer(headers["White"] || "White");
      setBlackPlayer(headers["Black"] || "Black");
      setWhiteElo(headers["WhiteElo"] || (g.myRating ? String(g.myRating) : ""));
      setBlackElo(headers["BlackElo"] || (g.opponentRating ? String(g.opponentRating) : ""));

      setHistoryMoves(moves);
      setHistoryFens(fens);
      setMoveIndex(moves.length - 1);
      setGameReview(null);
      setSidebarTab("analysis");

      // Launch sequential Stockfish review
      runGameReview(moves, fens);
    } catch (e) {
      alert("Failed to parse game PGN for review.");
    }
  };

  // Compile PGN from text input
  const handleCompilePgn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgnInput) return;
    try {
      const tempGame = new Chess();
      tempGame.loadPgn(pgnInput);
      const moves = tempGame.history();

      const fens: string[] = [];
      const replay = new Chess();
      fens.push(replay.fen());
      for (const m of moves) {
        replay.move(m);
        fens.push(replay.fen());
      }

      const headers = tempGame.header();
      setWhitePlayer(headers["White"] || "White");
      setBlackPlayer(headers["Black"] || "Black");
      setWhiteElo(headers["WhiteElo"] || "");
      setBlackElo(headers["BlackElo"] || "");

      setHistoryMoves(moves);
      setHistoryFens(fens);
      setMoveIndex(moves.length - 1);
      setGameReview(null);
    } catch (e) {
      alert("Failed to parse PGN input. Please check the syntax.");
    }
  };

  // Navigation controls
  const handlePrevMove = () => { if (moveIndex >= 0) setMoveIndex((p) => p - 1); };
  const handleNextMove = () => { if (moveIndex < historyMoves.length - 1) setMoveIndex((p) => p + 1); };
  const handleResetBoard = () => { setMoveIndex(-1); };

  // Key Moments navigation
  const handleKeyMomentNavigation = (direction: number) => {
    const nextIdx = currentKeyMomentIdx + direction;
    if (nextIdx >= 0 && nextIdx < keyMoments.length) {
      setCurrentKeyMomentIdx(nextIdx);
      setIsTrainerSolved(false);
      setTrainerFeedback("");
      
      const blunderMoveIdx = keyMoments[nextIdx].index;
      setMoveIndex(blunderMoveIdx - 1);
    }
  };

  // Board moves
  const handleBoardMove = (from: string, to: string, promotion?: string): boolean => {
    if (!game) return false;
    
    if (isKeyMomentMode && currentKeyMomentIdx !== -1) {
      const currentMoment = keyMoments[currentKeyMomentIdx];
      const bestMoveUci = currentMoment.move.bestMove;
      const playedUci = from + to + (promotion ? promotion.toLowerCase() : "");
      
      if (playedUci === bestMoveUci) {
        try {
          const gameCopy = new Chess(game.fen());
          const move = gameCopy.move({ from, to, promotion });
          if (move) {
            chessAudio.playCheck(); // Play check sound as success alert
            setGame(gameCopy);
            setTrainerFeedback("Excellent! You found the best tactical option. Well played!");
            setIsTrainerSolved(true);
            setSolvedMoments((prev) => ({ ...prev, [currentKeyMomentIdx]: true }));
            return true;
          }
        } catch { return false; }
      } else {
        const playedMoveSan = (() => {
          try {
            const g = new Chess(game.fen());
            const m = g.move({ from, to, promotion });
            return m ? m.san : "";
          } catch { return ""; }
        })();
        
        if (playedMoveSan === currentMoment.move.san) {
          setTrainerFeedback("That was the mistake played in the game! Look for a better tactical response.");
        } else {
          setTrainerFeedback("Not quite the best move. Re-examine the threats and try again!");
        }
        chessAudio.playMove(); // Alert feedback sound
        return false; 
      }
    }

    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({ from, to, promotion });
      if (move) {
        const newMoves = historyMoves.slice(0, moveIndex + 1);
        newMoves.push(move.san);
        const newFens = historyFens.slice(0, moveIndex + 2);
        newFens.push(gameCopy.fen());
        setHistoryMoves(newMoves);
        setHistoryFens(newFens);
        setMoveIndex(newMoves.length - 1);
        setGameReview(null);
        return true;
      }
    } catch { return false; }
    return false;
  };

  // Fetch cloud eval helper
  const fetchCloudEval = async (fen: string): Promise<{ cp: number; bestMove: string; topMoves?: any[] } | null> => {
    try {
      const encodedFen = encodeURIComponent(fen);
      const res = await fetch(`https://lichess.org/api/cloud-eval?fen=${encodedFen}`);
      if (res.status === 200) {
        const data = await res.json();
        if (data && data.pvs && data.pvs.length > 0) {
          const topPv = data.pvs[0];
          const bestMoveUci = topPv.moves.split(" ")[0];
          const turn = fen.split(" ")[1];
          let cp = 0;
          if (topPv.cp !== undefined && topPv.cp !== null) {
            cp = turn === "b" ? -topPv.cp : topPv.cp;
          } else if (topPv.mate !== undefined && topPv.mate !== null) {
            cp = (topPv.mate > 0 === (turn === "w")) ? 30000 : -30000;
          }
          
          const topMoves = data.pvs.map((pv: any) => {
            const moveUci = pv.moves.split(" ")[0];
            let pvCp = 0;
            if (pv.cp !== undefined && pv.cp !== null) {
              pvCp = turn === "b" ? -pv.cp : pv.cp;
            } else if (pv.mate !== undefined && pv.mate !== null) {
              pvCp = (pv.mate > 0 === (turn === "w")) ? 30000 : -30000;
            }
            return {
              move: moveUci,
              score: pvCp,
              type: pv.mate ? "mate" : "cp"
            };
          });

          return { cp, bestMove: bestMoveUci, topMoves };
        }
      }
    } catch (err) {
      console.error("Cloud eval fetch failed:", err);
    }
    return null;
  };

  // ── Full Game Review via Stockfish ──────────────────────────────────────────
  const runGameReview = useCallback(async (customMoves?: string[], customFens?: string[]) => {
    const movesToUse = customMoves || historyMoves;
    const fensToUse = customFens || historyFens;

    if (movesToUse.length === 0) return;
    setIsReviewing(true);
    setReviewProgress(0);
    setGameReview(null);

    const fensToEval = fensToUse; // initial position + one fen per move
    const totalPositions = fensToEval.length;
    const evals = new Array<number>(totalPositions).fill(0);
    const bestMoves = new Array<string>(totalPositions).fill("");
    const alternativeMovesCache: Record<number, Array<{ move: string; score: number; type: "cp" | "mate" }>> = {};

    // 1. Compile list of positions that need local evaluation
    const pendingIndices: number[] = [];
    for (let i = 0; i < totalPositions; i++) {
      const fen = fensToEval[i];
      const cached = positionCacheRef.current[fen];
      if (cached) {
        evals[i] = cached.cp;
        bestMoves[i] = cached.bestMove;
        if (cached.topMoves) alternativeMovesCache[i] = cached.topMoves;
      } else {
        // Try Cloud Evaluation
        const cloudData = await fetchCloudEval(fen);
        if (cloudData) {
          evals[i] = cloudData.cp;
          bestMoves[i] = cloudData.bestMove;
          if (cloudData.topMoves) alternativeMovesCache[i] = cloudData.topMoves;
          positionCacheRef.current[fen] = cloudData;
        } else {
          pendingIndices.push(i);
        }
      }
    }

    let completedCount = totalPositions - pendingIndices.length;
    setReviewProgress(Math.round((completedCount / totalPositions) * 100));

    if (pendingIndices.length > 0) {
      // Setup web workers for remaining positions
      const numWorkers = Math.min(navigator.hardwareConcurrency || 4, 4);
      const workerCode = `
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
        var engine = typeof STOCKFISH === 'function' ? STOCKFISH() : null;
        if (engine) {
          engine.onmessage = function(e) { postMessage(e.data); };
          onmessage = function(e) { engine.postMessage(e.data); };
        }
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);

      // Create workers and wait for readyok
      const initPromises = Array.from({ length: numWorkers }).map((_, idx) => {
        return new Promise<Worker>((resolve) => {
          const w = new Worker(workerUrl);
          const readyHandler = (e: MessageEvent) => {
            if (e.data === "readyok") {
              w.removeEventListener("message", readyHandler);
              resolve(w);
            }
          };
          w.addEventListener("message", readyHandler);
          w.postMessage("uci");
          w.postMessage("isready");
        });
      });

      const activeWorkers = await Promise.all(initPromises);

      // Dynamic task distribution
      let nextPendingIdx = 0;

      const runWorkerTask = async (worker: Worker) => {
        while (nextPendingIdx < pendingIndices.length) {
          const currentIndex = pendingIndices[nextPendingIdx++];
          const fen = fensToEval[currentIndex];

          const cp = await new Promise<{ cp: number; bestMove: string; topMoves: any[] }>((resolveTask) => {
            let bestCp = 0;
            let bestMove = "";
            let depth = 0;
            let resolved = false;
            const topMovesLocal: Array<{ move: string; score: number; type: "cp" | "mate" }> = [];

            const timeout = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                worker.removeEventListener("message", handler);
                resolveTask({ cp: bestCp, bestMove, topMoves: topMovesLocal });
              }
            }, 3000); // 3 seconds max fallback

            const handler = (e: MessageEvent) => {
              if (resolved) return;
              const line: string = e.data;
              if (line.startsWith("info") && line.includes("score")) {
                const depthMatch = line.match(/depth (\d+)/);
                const cpMatch = line.match(/score cp (-?\d+)/);
                const mateMatch = line.match(/score mate (-?\d+)/);
                const multipvMatch = line.match(/multipv (\d+)/);
                const pvMatch = line.match(/ pv (\S+)/);

                const d = depthMatch ? parseInt(depthMatch[1]) : 0;
                const multipv = multipvMatch ? parseInt(multipvMatch[1]) : 1;
                const pvMove = pvMatch ? pvMatch[1] : "";

                if (d >= depth) {
                  depth = d;
                  let sc = 0;
                  let type: "cp" | "mate" = "cp";
                  if (cpMatch) {
                    sc = parseInt(cpMatch[1]);
                  } else if (mateMatch) {
                    sc = parseInt(mateMatch[1]) > 0 ? 30000 : -30000;
                    type = "mate";
                  }
                  
                  if (pvMove) {
                    topMovesLocal[multipv - 1] = { move: pvMove, score: sc, type };
                  }
                  if (multipv === 1) {
                    bestCp = sc;
                  }
                }
              }
              if (line.startsWith("bestmove")) {
                clearTimeout(timeout);
                resolved = true;
                worker.removeEventListener("message", handler);
                
                const parts = line.split(" ");
                if (parts.length > 1) {
                  bestMove = parts[1];
                }
                resolveTask({ cp: bestCp, bestMove, topMoves: topMovesLocal });
              }
            };

            worker.addEventListener("message", handler);
            worker.postMessage("stop");
            worker.postMessage("setoption name MultiPV value 3");
            worker.postMessage(`position fen ${fen}`);
            worker.postMessage(`go depth ${reviewDepth}`);
          });

          evals[currentIndex] = cp.cp;
          bestMoves[currentIndex] = cp.bestMove;
          alternativeMovesCache[currentIndex] = cp.topMoves;
          
          // Cache position evaluation
          positionCacheRef.current[fen] = {
            cp: cp.cp,
            bestMove: cp.bestMove,
            topMoves: cp.topMoves
          };

          completedCount++;
          setReviewProgress(Math.round((completedCount / totalPositions) * 100));
        }
      };

      // Start all workers concurrently
      const workerPromises = activeWorkers.map(w => runWorkerTask(w));
      await Promise.all(workerPromises);

      // Clean up
      activeWorkers.forEach(w => w.terminate());
      URL.revokeObjectURL(workerUrl);
    }

    // 2. Perform opening detection
    const playedUcis: string[] = [];
    for (let idx = 0; idx < Math.min(movesToUse.length, 12); idx++) {
      const fb = fensToUse[idx];
      const u = (() => {
        try {
          const temp = new Chess(fb);
          const m = temp.move(movesToUse[idx]);
          return m ? (m.from + m.to + (m.promotion ? m.promotion.toLowerCase() : "")) : "";
        } catch { return ""; }
      })();
      if (u) playedUcis.push(u);
    }
    const openingInfo = detectOpening(playedUcis);

    // 3. Build reviewed move list
    const reviewedMoves: ReviewedMove[] = [];
    const counts: Record<MoveClass, number> = {
      brilliant: 0, great: 0, best: 0, excellent: 0, good: 0,
      book: 0, inaccuracy: 0, mistake: 0, blunder: 0, missed_win: 0,
    };

    for (let i = 0; i < movesToUse.length; i++) {
      const isWhiteMove = i % 2 === 0;
      const moverColor = isWhiteMove ? "w" : "b";

      const cpBefore = evals[i];
      const cpAfter  = -(evals[i + 1] ?? 0);
      let cpLoss   = Math.max(0, cpBefore - cpAfter);

      const fenBefore = fensToUse[i]     ?? fensToUse[0];
      const fenAfter  = fensToUse[i + 1] ?? fensToUse[fensToUse.length - 1];

      // Convert played move to UCI
      const playedUci = (() => {
        try {
          const temp = new Chess(fenBefore);
          const m = temp.move(movesToUse[i]);
          return m ? (m.from + m.to + (m.promotion ? m.promotion.toLowerCase() : "")) : "";
        } catch {
          return "";
        }
      })();

      // If they played the exact best move, cpLoss is 0!
      if (playedUci && playedUci === bestMoves[i]) {
        cpLoss = 0;
      }

      // Layer 2: Position analysis
      const { positional, motifs } = analyzePosition(
        fenBefore,
        fenAfter,
        movesToUse[i],
        playedUci,
        moverColor
      );

      // Calculate previous move coordinates for recapture/blunder analysis
      const previousMoveSan = i > 0 ? movesToUse[i - 1] : undefined;
      const previousMoveUci = i > 0 ? (() => {
        try {
          const temp = new Chess(fensToUse[i - 1]);
          const m = temp.move(movesToUse[i - 1]);
          return m ? (m.from + m.to + (m.promotion ? m.promotion.toLowerCase() : "")) : "";
        } catch {
          return "";
        }
      })() : undefined;

      // Construct position data
      const posData: PositionData = {
        fenBefore,
        fenAfter,
        playedMove: movesToUse[i],
        playedMoveUci: playedUci,
        bestMove: bestMoves[i],
        bestMoveSan: uciToSan(fenBefore, bestMoves[i]),
        cpBefore,
        cpAfter,
        cpLoss,
        tacticalMotifs: motifs,
        positional,
        alternativeMoves: alternativeMovesCache[i],
        previousMoveSan,
        previousMoveUci
      };

      // Layer 3: Move Classifier
      const ratingStr = isWhiteMove ? whiteElo : blackElo;
      const playerRating = ratingStr ? parseInt(ratingStr, 10) : 1400;
      const classification = classifyMove(posData, i, playerRating);
      counts[classification]++;

      // Explanation
      const explanation = generateExplanation(posData, openingInfo.name, classification);

      // Phase classification
      let phase: "Opening" | "Middlegame" | "Endgame" = "Middlegame";
      if (i < 12) {
        phase = "Opening";
      } else {
        const materialW = countMaterial(fenAfter, "w");
        const materialB = countMaterial(fenAfter, "b");
        if (materialW + materialB <= 14) {
          phase = "Endgame";
        }
      }

      reviewedMoves.push({
        san: movesToUse[i],
        fen: fenAfter,
        fenBefore: fenBefore,
        classification,
        cpBefore,
        cpAfter,
        cpLoss,
        bestMove: bestMoves[i],
        explanation,
        motifs,
        phase,
        alternativeMoves: alternativeMovesCache[i]
      });
    }

    // Filter Key Moments: blunders, mistakes, inaccuracy, missed wins
    const moments: Array<{ index: number; move: ReviewedMove }> = [];
    reviewedMoves.forEach((m, idx) => {
      if (m.classification === "blunder" || m.classification === "mistake" || m.classification === "inaccuracy" || m.classification === "missed_win") {
        moments.push({ index: idx, move: m });
      }
    });

    setKeyMoments(moments);
    setCurrentKeyMomentIdx(moments.length > 0 ? 0 : -1);
    setIsKeyMomentMode(false); // Default to review tab
    setSolvedMoments({}); // Reset solved moments when running a new review

    setGameReview({
      moves: reviewedMoves,
      whiteAccuracy: calculateAccuracy(reviewedMoves, true),
      blackAccuracy: calculateAccuracy(reviewedMoves, false),
      counts,
      openingName: openingInfo.name,
      openingEco: openingInfo.eco
    });
    setIsReviewing(false);
    setReviewProgress(100);
  }, [historyMoves, historyFens, reviewDepth, whiteElo, blackElo]);

  // ── Game Search ─────────────────────────────────────────────────────────────
  const handleSearchGames = async () => {
    if (!searchUsername.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    try {
      const games = searchPlatform === "chesscom"
        ? await fetchChesscomGames(searchUsername)
        : await fetchLichessGames(searchUsername);
      setSearchResults(games.slice(0, 20) as SearchGame[]);
      if (games.length === 0) setSearchError("No recent games found for this user.");
    } catch (e: any) {
      setSearchError(e.message || "Failed to fetch games. Check username.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Combined games list: store imports + search results (deduplicated)
  const allGames: SearchGame[] = [
    ...searchResults,
    ...importedGames.filter(
      (g) => !searchResults.find((s) => s.id === g.id)
    ).map((g) => ({ ...g, pgn: g.pgn ?? "" })),
  ];

  const filteredGames = allGames.filter((g) =>
    g.opponent.toLowerCase().includes(gamesFilter.toLowerCase())
  );



  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-100 p-8 border border-[#3d3b38] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Game Analysis</h1>
            <p className="text-slate-400 text-sm mt-1">
              Deep Stockfish engine review — Brilliant, Best, Good, Inaccuracy, Mistake & Blunder classifications.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSearch((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          Search Player Games
        </button>
      </section>

      {/* Game Search Panel */}
      {showSearch && (
        <section className="bg-surface-100 border border-[#3d3b38] rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-primary-400" />
              Search Games from Chess.com or Lichess
            </h3>
            <button onClick={() => setShowSearch(false)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Platform Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              <button
                onClick={() => setSearchPlatform("chesscom")}
                className={`px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  searchPlatform === "chesscom"
                    ? "bg-green-600 text-white"
                    : "bg-surface-200 text-slate-400 hover:text-white"
                }`}
              >
                Chess.com
              </button>
              <button
                onClick={() => setSearchPlatform("lichess")}
                className={`px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  searchPlatform === "lichess"
                    ? "bg-zinc-700 text-white"
                    : "bg-surface-200 text-slate-400 hover:text-white"
                }`}
              >
                Lichess
              </button>
            </div>

            {/* Username Input + Search Button */}
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchGames()}
                placeholder={`e.g. ${searchPlatform === "chesscom" ? "magnuscarlsen" : "DrNykterstein"}`}
                className="flex-1 bg-surface-200 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
              />
              <button
                onClick={handleSearchGames}
                disabled={searchLoading}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                {searchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {searchLoading ? "Searching..." : "Fetch Games"}
              </button>
            </div>
          </div>

          {/* Error */}
          {searchError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl">
              {searchError}
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
              {searchResults.map((g) => (
                <div
                  key={g.id}
                  onClick={() => { handleLoadGame(g); setShowSearch(false); }}
                  className="p-3.5 bg-surface-200 hover:bg-[#2b2925] border border-[#2b2925] rounded-xl cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                    <span className={`uppercase tracking-wide ${g.platform === "chesscom" ? "text-green-400" : "text-blue-400"}`}>
                      {g.platform === "chesscom" ? "Chess.com" : "Lichess"}
                    </span>
                    <span className="text-slate-500 font-mono">{g.date}</span>
                  </div>
                  <div className="text-xs font-extrabold text-white group-hover:text-primary-400 transition-colors">
                    vs {g.opponent} ({g.opponentRating})
                  </div>
                  <div className="flex justify-between items-center mt-3 gap-2">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                      g.result === "win" ? "text-green-400 bg-green-500/10 border-green-500/20" :
                      g.result === "loss" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                      "text-slate-400 bg-slate-500/10 border-slate-500/20"
                    }`}>
                      {g.result.toUpperCase()}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadGame(g);
                          setShowSearch(false);
                        }}
                        className="px-2 py-1 bg-surface-300 hover:bg-surface-100 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-white/5 transition-all cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReviewGame(g);
                          setShowSearch(false);
                        }}
                        className="px-2.5 py-1 bg-primary-600/80 hover:bg-primary-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 border border-primary-500/20 transition-all cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">

        {/* Chessboard + Eval Bar (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex gap-4 items-stretch justify-center">
            {game && (
              <div className={celebration.type === "brilliant" ? "animate-eval-dramatic" : ""}>
                <EvaluationBar
                  score={activeEval.score}
                  type={activeEval.type}
                  isEvaluating={currentReviewEval ? false : isEvaluating}
                  orientation={boardOrientation}
                  depth={activeEval.depth}
                  sideToMove={game.turn() === "w" ? "white" : "black"}
                />
              </div>
            )}
            {game && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                {/* Top Player Info */}
                {renderPlayerInfo(boardOrientation === "white" ? "black" : "white")}

                <div 
                  ref={boardContainerRef} 
                  className={`relative w-full max-w-[560px] transition-all duration-500 ${
                    celebration.type === "brilliant"
                      ? "animate-brilliant-zoom"
                      : celebration.type === "great"
                      ? "animate-great-pulse"
                      : ""
                  }`}
                >
                  {(() => {
                    const currentReviewedMove = gameReview && moveIndex >= 0 && moveIndex < gameReview.moves.length
                      ? gameReview.moves[moveIndex]
                      : null;

                    const lastMoveSquares = (() => {
                      if (moveIndex < 0 || historyMoves.length === 0) return null;
                      try {
                        const temp = new Chess(historyFens[moveIndex] ?? historyFens[0]);
                        const san = historyMoves[moveIndex];
                        const verbose = temp.moves({ verbose: true }).find(m => m.san === san);
                        return verbose ? { from: verbose.from, to: verbose.to } : null;
                      } catch {
                        return null;
                      }
                    })();

                    return (
                      <>
                        <ChessboardWrapper
                          game={game}
                          onMove={handleBoardMove}
                          userColor="both"
                          orientation={boardOrientation}
                          boardTheme="classic"
                          customArrows={getBestMoveArrow()}
                          lastMove={lastMoveSquares}
                          lastMoveClassification={currentReviewedMove ? currentReviewedMove.classification : null}
                        />
                        {currentReviewedMove && lastMoveSquares && (
                          <MoveClassBadge
                            key={`${moveIndex}-${currentReviewedMove.classification}`}
                            classification={currentReviewedMove.classification}
                            square={lastMoveSquares.to}
                            orientation={boardOrientation}
                            boardSize={boardWidth}
                          />
                        )}

                        {/* Premium Celebration Overlay System */}
                        {celebration.type && celebration.square && (
                          <div 
                            key={celebration.triggerId}
                            className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex flex-col justify-between items-center"
                          >
                            <style>{`
                              @keyframes brilliantBoardZoom {
                                0% { transform: scale(1); }
                                15% { transform: scale(1.04); filter: brightness(1.08); }
                                80% { transform: scale(1.04); filter: brightness(1.08); }
                                100% { transform: scale(1); filter: brightness(1); }
                              }

                              @keyframes greatBoardPulse {
                                0% { transform: scale(1); }
                                20% { transform: scale(1.025); }
                                40% { transform: scale(0.99); }
                                60% { transform: scale(1.01); }
                                100% { transform: scale(1); }
                              }

                              @keyframes evalBarDramatic {
                                0% { transform: translateY(0); }
                                10% { transform: translateY(-12px) scaleY(1.08); }
                                20% { transform: translateY(12px) scaleY(0.92); }
                                30% { transform: translateY(-6px); }
                                40% { transform: translateY(4px); }
                                100% { transform: translateY(0); }
                              }

                              @keyframes energyGlow {
                                0% { transform: scale(0.6); opacity: 0; box-shadow: 0 0 0 0 rgba(18, 196, 184, 0.8), inset 0 0 0 0 rgba(18, 196, 184, 0.8); }
                                20% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 35px 12px rgba(18, 196, 184, 1), inset 0 0 20px 6px rgba(18, 196, 184, 1); }
                                80% { opacity: 1; transform: scale(1); box-shadow: 0 0 40px 15px rgba(18, 196, 184, 0.9), inset 0 0 25px 8px rgba(18, 196, 184, 0.9); }
                                100% { opacity: 0; transform: scale(1.35); box-shadow: 0 0 0 0 rgba(18, 196, 184, 0), inset 0 0 0 0 rgba(18, 196, 184, 0); }
                              }

                              @keyframes greatEnergyGlow {
                                0% { transform: scale(0.6); opacity: 0; box-shadow: 0 0 0 0 rgba(27, 172, 166, 0.8), inset 0 0 0 0 rgba(27, 172, 166, 0.8); }
                                20% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 25px 8px rgba(27, 172, 166, 1), inset 0 0 15px 4px rgba(27, 172, 166, 1); }
                                80% { opacity: 1; transform: scale(1); box-shadow: 0 0 30px 12px rgba(27, 172, 166, 0.9), inset 0 0 20px 6px rgba(27, 172, 166, 0.9); }
                                100% { opacity: 0; transform: scale(1.3); box-shadow: 0 0 0 0 rgba(27, 172, 166, 0), inset 0 0 0 0 rgba(27, 172, 166, 0); }
                              }

                              .glow-energy-brilliant {
                                animation: energyGlow 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                              }

                              .glow-energy-great {
                                animation: greatEnergyGlow 2.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                              }

                              @keyframes bannerSlideIn {
                                0% { transform: scaleY(0); opacity: 0; }
                                8% { transform: scaleY(1.15); opacity: 1; }
                                14% { transform: scaleY(1); opacity: 1; }
                                86% { transform: scaleY(1); opacity: 1; filter: brightness(1); }
                                92% { filter: brightness(1.2); }
                                100% { transform: scaleY(0); opacity: 0; }
                              }

                              @keyframes textGlowShimmer {
                                0%, 100% { text-shadow: 0 0 10px var(--color), 0 0 20px var(--color), 0 0 30px var(--color); letter-spacing: 0.12em; }
                                50% { text-shadow: 0 0 22px var(--color), 0 0 45px var(--color), 0 0 65px var(--color); letter-spacing: 0.18em; }
                              }

                              .celebration-banner {
                                animation: bannerSlideIn 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                              }

                              .celebration-banner-great {
                                animation: bannerSlideIn 2.0s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                              }

                              .glow-text-shimmer {
                                animation: textGlowShimmer 2.0s ease-in-out infinite;
                              }

                              @keyframes particleFloat {
                                0% { transform: translate(0, 0) scale(1); opacity: 1; }
                                100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
                              }

                              .particle-move {
                                animation: particleFloat 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
                              }
                            `}</style>

                            {/* 1. Glowing energy ring around the square */}
                            {(() => {
                              const file = celebration.square[0];
                              const rank = celebration.square[1];
                              const files = ["a","b","c","d","e","f","g","h"];
                              const ranks = ["8","7","6","5","4","3","2","1"];
                              let col = files.indexOf(file);
                              let row = ranks.indexOf(rank);
                              if (boardOrientation === "black") { col = 7 - col; row = 7 - row; }
                              
                              const left = `${col * 12.5}%`;
                              const top = `${row * 12.5}%`;
                              
                              if (celebration.type === "best") {
                                return (
                                  <div 
                                    style={{ left, top, width: "12.5%", height: "12.5%" }}
                                    className="absolute rounded-xl border-2 border-green-400 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse pointer-events-none"
                                  />
                                );
                              }

                              return (
                                <div 
                                  style={{ left, top, width: "12.5%", height: "12.5%" }}
                                  className={`absolute rounded-xl pointer-events-none ${
                                    celebration.type === "brilliant" ? "glow-energy-brilliant" : "glow-energy-great"
                                  }`}
                                />
                              );
                            })()}

                            {/* 2. Sparkling particle effects */}
                            {celebration.type !== "best" && (
                              <div 
                                style={{
                                  position: "absolute",
                                  left: `${(() => {
                                    const file = celebration.square[0];
                                    const files = ["a","b","c","d","e","f","g","h"];
                                    let col = files.indexOf(file);
                                    if (boardOrientation === "black") col = 7 - col;
                                    return (col * 12.5) + 6.25;
                                  })()}%`,
                                  top: `${(() => {
                                    const rank = celebration.square[1];
                                    const ranks = ["8","7","6","5","4","3","2","1"];
                                    let row = ranks.indexOf(rank);
                                    if (boardOrientation === "black") row = 7 - row;
                                    return (row * 12.5) + 6.25;
                                  })()}%`,
                                  width: 0,
                                  height: 0,
                                }}
                              >
                                {Array.from({ length: celebration.type === "brilliant" ? 24 : 12 }).map((_, idx) => {
                                  const angle = (idx * (2 * Math.PI)) / (celebration.type === "brilliant" ? 24 : 12);
                                  const distance = 50 + Math.random() * 90;
                                  const dx = `${Math.cos(angle) * distance}px`;
                                  const dy = `${Math.sin(angle) * distance}px`;
                                  const color = celebration.type === "brilliant" ? "bg-cyan-400" : "bg-teal-400";
                                  const delay = `${Math.random() * 0.2}s`;
                                  return (
                                    <div
                                      key={idx}
                                      className={`absolute w-1.5 h-1.5 rounded-full ${color} shadow-[0_0_8px_rgba(255,255,255,0.8)] particle-move`}
                                      style={{
                                        "--dx": dx,
                                        "--dy": dy,
                                        animationDelay: delay,
                                      } as any}
                                    />
                                  );
                                })}
                              </div>
                            )}

                            {/* 3. Banner overlay for Brilliant/Great */}
                            {celebration.type !== "best" && (
                              <div 
                                className="absolute inset-x-0 top-[38%] flex items-center justify-center pointer-events-auto"
                                onClick={() => setCelebration({ type: null, square: "", triggerId: 0 })}
                              >
                                <div 
                                  className={`w-full py-4 text-center border-y backdrop-blur-md select-none cursor-pointer flex flex-col justify-center items-center gap-1 ${
                                    celebration.type === "brilliant" 
                                      ? "celebration-banner bg-cyan-950/80 border-cyan-500/30" 
                                      : "celebration-banner-great bg-teal-950/80 border-teal-500/30"
                                  }`}
                                  style={{
                                    boxShadow: `0 12px 36px rgba(0,0,0,0.6), 0 0 50px ${
                                      celebration.type === "brilliant" ? "rgba(18,196,184,0.2)" : "rgba(27,172,166,0.2)"
                                    }`
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Sparkles className={`w-5 h-5 animate-spin ${celebration.type === "brilliant" ? "text-cyan-400" : "text-teal-400"}`} />
                                    <span 
                                      className="font-black text-2xl tracking-widest text-white glow-text-shimmer uppercase"
                                      style={{ 
                                        "--color": celebration.type === "brilliant" ? "#12c4b8" : "#1baca6",
                                      } as any}
                                    >
                                      {celebration.type === "brilliant" ? "Brilliant Move!!" : "Great Move!"}
                                    </span>
                                    <Sparkles className={`w-5 h-5 animate-spin ${celebration.type === "brilliant" ? "text-cyan-400" : "text-teal-400"}`} />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                                    {celebration.type === "brilliant" ? "A sound piece sacrifice with compensation" : "Saves a worse position / Only winning resource"}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-medium">Click to skip celebration</span>
                                </div>
                              </div>
                            )}

                            {/* 4. Banner for Best move */}
                            {celebration.type === "best" && (
                              <div 
                                className="absolute bottom-4 bg-[#16181e]/95 text-green-400 px-4 py-1.5 rounded-full border border-green-500/20 shadow-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-bounce"
                                style={{ animationDuration: "2.2s" }}
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                                Best Move
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Bottom Player Info */}
                {renderPlayerInfo(boardOrientation === "white" ? "white" : "black")}
              </div>
            )}
          </div>

          {/* Stepper Controls */}
          <div className="bg-surface-100 border border-[#3d3b38] p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetBoard}
                className="p-2.5 bg-surface-200 border border-[#2b2925] text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Reset to beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBoardOrientation((o) => (o === "white" ? "black" : "white"))}
                className="p-2.5 bg-surface-200 border border-[#2b2925] text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Flip Board"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrevMove}
                disabled={moveIndex < 0}
                className="p-2.5 bg-surface-200 border border-[#2b2925] text-slate-400 hover:text-white disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
                title="Previous Move"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMove}
                disabled={moveIndex >= historyMoves.length - 1}
                className="p-2.5 bg-surface-200 border border-[#2b2925] text-slate-400 hover:text-white disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
                title="Next Move"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs font-mono font-bold text-slate-400 bg-surface-200 px-3 py-1.5 rounded-lg border border-[#2b2925]">
              Move {moveIndex + 1} / {historyMoves.length}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={reviewDepth}
                onChange={(e) => setReviewDepth(parseInt(e.target.value))}
                disabled={isReviewing}
                className="bg-surface-200 border border-[#2b2925] text-slate-300 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer disabled:opacity-50"
              >
                <option value={10}>Depth 10 (Fast)</option>
                <option value={13}>Depth 13 (Standard)</option>
                <option value={16}>Depth 16 (Thorough)</option>
                <option value={18}>Depth 18 (Deep)</option>
              </select>
              
              <button
                onClick={() => runGameReview()}
                disabled={isReviewing || historyMoves.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
              >
                {isReviewing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Reviewing... {reviewProgress}%
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run Game Review
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Review progress bar */}
          {isReviewing && (
            <div className="bg-surface-100 border border-[#3d3b38] p-4 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-400" />
                  Stockfish analyzing position {Math.round(reviewProgress / 100 * historyMoves.length)} / {historyMoves.length}...
                </span>
                <span className="text-primary-400">{reviewProgress}%</span>
              </div>
              <div className="h-2 bg-surface-200 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
                  style={{ width: `${reviewProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Accuracy Summary (shown after review) */}
          {gameReview && !isReviewing && (
            <div className="bg-surface-100 border border-[#3d3b38] p-5 rounded-2xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  Game Review Summary
                </h3>
                
                {keyMoments.length > 0 && (
                  <button
                    onClick={() => {
                      setIsKeyMomentMode(true);
                      setCurrentKeyMomentIdx(0);
                      setTrainerFeedback("");
                      setIsTrainerSolved(false);
                      const firstBlunderIdx = keyMoments[0].index;
                      setMoveIndex(firstBlunderIdx - 1);
                    }}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-extrabold rounded-xl text-[10px] uppercase transition-all shadow-md flex items-center gap-1 cursor-pointer animate-pulse"
                  >
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    Solve Key Moments ({keyMoments.length})
                  </button>
                )}
              </div>

              {/* Opening & ECO tag */}
              {gameReview.openingName && (
                <div className="bg-surface-200 rounded-2xl p-4 border border-white/5 flex items-center justify-between transition-all select-none">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Opening Name</span>
                    <h4 className="text-xs font-extrabold text-white mt-0.5">{gameReview.openingName}</h4>
                  </div>
                  <span className="text-[10px] font-mono font-black bg-primary-500/10 text-primary-400 border border-primary-500/20 px-2.5 py-1 rounded">
                    {gameReview.openingEco || "A00"}
                  </span>
                </div>
              )}

              {/* Circular SVG Accuracy Progress Gauges */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "White Accuracy", acc: gameReview.whiteAccuracy, isWhite: true },
                  { label: "Black Accuracy", acc: gameReview.blackAccuracy, isWhite: false },
                ].map((side) => {
                  const radius = 32;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (side.acc / 100) * circumference;
                  const colorClass = 
                    side.acc >= 85 ? "stroke-green-400 text-green-400" :
                    side.acc >= 70 ? "stroke-blue-400 text-blue-400" :
                    side.acc >= 55 ? "stroke-yellow-400 text-yellow-400" : "stroke-red-400 text-red-400";
                  return (
                    <div key={side.label} className="bg-surface-200 rounded-2xl p-4 text-center border border-white/5 flex flex-col items-center space-y-2 select-none">
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{side.label}</div>
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="40" cy="40" r={radius} className="stroke-white/5 fill-none" strokeWidth="5" />
                          <circle cx="40" cy="40" r={radius} className={`${colorClass} fill-none transition-all duration-1000 ease-out`} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-xl font-black text-white">{side.acc}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Horizontal Comparison Bar */}
              <div className="space-y-1.5 px-1 select-none">
                <div className="flex justify-between text-[9px] text-slate-500 font-black uppercase tracking-wide">
                  <span>White ({gameReview.whiteAccuracy}%)</span>
                  <span>Black ({gameReview.blackAccuracy}%)</span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden flex border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                    style={{ width: `${(gameReview.whiteAccuracy / (gameReview.whiteAccuracy + gameReview.blackAccuracy || 1)) * 100}%` }}
                  />
                  <div className="h-full bg-zinc-900 flex-1" />
                </div>
              </div>

              {/* Game Phases Timeline & Interactive Dots Sequence */}
              {(() => {
                const totalMoves = gameReview.moves.length;
                const openingCount = gameReview.moves.filter(m => m.phase === "Opening").length;
                const middlegameCount = gameReview.moves.filter(m => m.phase === "Middlegame").length;
                const endgameCount = gameReview.moves.filter(m => m.phase === "Endgame").length;
                
                const classHexColors: Record<MoveClass, string> = {
                  brilliant: "#12c4b8",
                  great: "#1baca6",
                  best: "#769656",
                  excellent: "#96bc4b",
                  good: "#3d5e80",
                  book: "#d5a47e",
                  inaccuracy: "#f0c13b",
                  mistake: "#e58f2a",
                  blunder: "#ca3431",
                  missed_win: "#7f7f7f",
                };

                return (
                  <div className="bg-surface-200 rounded-2xl p-4 border border-white/5 space-y-4 select-none">
                    <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider text-left">Game Timeline & Phases</div>
                    
                    {/* Visual phase segments */}
                    <div className="h-4 bg-zinc-800 rounded-full overflow-hidden flex border border-white/5 text-[8px] font-black text-white text-center">
                      {openingCount > 0 && (
                        <div 
                          className="bg-blue-500/40 border-r border-white/10 flex items-center justify-center transition-all"
                          style={{ width: `${(openingCount / totalMoves) * 100}%` }}
                          title={`Opening: ${openingCount} moves`}
                        >
                          Opening ({openingCount})
                        </div>
                      )}
                      {middlegameCount > 0 && (
                        <div 
                          className="bg-purple-500/40 border-r border-white/10 flex items-center justify-center transition-all"
                          style={{ width: `${(middlegameCount / totalMoves) * 100}%` }}
                          title={`Middlegame: ${middlegameCount} moves`}
                        >
                          Middlegame ({middlegameCount})
                        </div>
                      )}
                      {endgameCount > 0 && (
                        <div 
                          className="bg-amber-500/40 flex items-center justify-center transition-all"
                          style={{ width: `${(endgameCount / totalMoves) * 100}%` }}
                          title={`Endgame: ${endgameCount} moves`}
                        >
                          Endgame ({endgameCount})
                        </div>
                      )}
                    </div>

                    {/* Move dots sequence */}
                    <div className="flex flex-wrap gap-1.5 py-1 justify-start">
                      {gameReview.moves.map((m, idx) => {
                        const cfg = classConfig[m.classification];
                        const isCurrent = moveIndex === idx;
                        const colorHex = classHexColors[m.classification];
                        return (
                          <button
                            key={idx}
                            onClick={() => setMoveIndex(idx)}
                            className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer flex items-center justify-center text-[7px] font-black ${
                              isCurrent 
                                ? "ring-2 ring-white scale-125 z-10" 
                                : "opacity-80 hover:opacity-100 hover:scale-110"
                            }`}
                            style={{
                              backgroundColor: colorHex,
                              borderColor: isCurrent ? "#ffffff" : "transparent",
                              color: "#ffffff"
                            }}
                            title={`Move ${idx + 1}: ${m.san} (${cfg.label})`}
                          >
                            {m.classification === "brilliant" ? "!!" : m.classification === "blunder" ? "??" : m.classification === "missed_win" ? "🎯" : ""}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-500 font-extrabold uppercase">
                      <span>Start</span>
                      <span>Click a dot to jump to move</span>
                      <span>End</span>
                    </div>
                  </div>
                );
              })()}

              {/* Chess.com-Style Move Breakdown Grid Table */}
              <div className="bg-surface-200/50 rounded-2xl border border-white/5 p-4 space-y-3 select-none">
                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-left">Move Breakdown</div>
                <div className="space-y-2">
                  {(Object.entries(classConfig) as [MoveClass, typeof classConfig[MoveClass]][]).map(([cls, cfg]) => {
                    const whiteCount = gameReview.moves.filter((m, idx) => idx % 2 === 0 && m.classification === cls).length;
                    const blackCount = gameReview.moves.filter((m, idx) => idx % 2 !== 0 && m.classification === cls).length;
                    
                    if (whiteCount === 0 && blackCount === 0) return null;
                    const { Icon } = cfg;
                    
                    return (
                      <div key={cls} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-b-0">
                        <span className="w-10 text-center font-black text-white">{whiteCount}</span>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider min-w-[120px] justify-center ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </div>
                        <span className="w-10 text-center font-black text-slate-400">{blackCount}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar (1 col) */}
        <div className="lg:col-span-1 bg-surface-100 border border-[#3d3b38] rounded-3xl overflow-hidden flex flex-col h-[75vh] min-h-[500px]">
          {isKeyMomentMode && currentKeyMomentIdx !== -1 ? (
            <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-4">
                {/* Header with Exit */}
                <div className="flex justify-between items-center border-b border-[#2b2925] pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="font-extrabold text-xs text-white uppercase tracking-wider font-sans">Key Moments</span>
                  </div>
                  <button
                    onClick={() => setIsKeyMomentMode(false)}
                    className="p-1 hover:bg-surface-200 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Step dots navigation */}
                <div className="flex items-center justify-between bg-surface-200/50 p-2.5 rounded-xl border border-white/5">
                  <button
                    onClick={() => handleKeyMomentNavigation(-1)}
                    disabled={currentKeyMomentIdx === 0}
                    className="p-1 bg-surface-300 hover:bg-surface-200 disabled:opacity-40 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1.5">
                    {keyMoments.map((mom, idx) => {
                      const isCurrent = idx === currentKeyMomentIdx;
                      const isSolved = solvedMoments[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setCurrentKeyMomentIdx(idx);
                            setIsTrainerSolved(false);
                            setTrainerFeedback("");
                            setMoveIndex(mom.index - 1);
                          }}
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black cursor-pointer transition-all border ${
                            isCurrent
                              ? "bg-primary-600 border-primary-400 ring-2 ring-primary-500/20 text-white scale-110"
                              : isSolved
                              ? "bg-green-600 border-green-500 text-white"
                              : "bg-zinc-800 border-zinc-700 text-slate-500 hover:border-slate-400"
                          }`}
                          title={`Moment ${idx + 1}`}
                        >
                          {isSolved ? "✓" : idx + 1}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleKeyMomentNavigation(1)}
                    disabled={currentKeyMomentIdx === keyMoments.length - 1}
                    className="p-1 bg-surface-300 hover:bg-surface-200 disabled:opacity-40 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Scenario details */}
                {(() => {
                  const moment = keyMoments[currentKeyMomentIdx];
                  const originalMoveIdx = moment.index;
                  const originalMoveClass = moment.move.classification;
                  const cfg = classConfig[originalMoveClass];
                  const turn = (originalMoveIdx % 2 === 0) ? "White" : "Black";
                  
                  return (
                    <div className="space-y-4">
                      <div className="bg-surface-200 p-4 rounded-2xl border border-[#2b2925] space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                          <span>Tactical Scenario</span>
                          <span className="text-primary-400 font-mono">Move {Math.floor(originalMoveIdx / 2) + 1}</span>
                        </div>
                        
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                          {turn} played <span className="font-bold text-white bg-surface-300 px-1.5 py-0.5 rounded font-mono">{moment.move.san}</span>, which was classified as a <span className={`font-extrabold ${cfg.color}`}>{originalMoveClass}</span>.
                        </p>
                        <p className="text-xs font-bold text-white pt-1">
                          Find a better move for {turn}!
                        </p>
                      </div>

                      {/* Feedback status */}
                      {trainerFeedback ? (
                        <div className={`p-4 rounded-2xl border text-xs font-semibold animate-in zoom-in-95 duration-200 ${
                          isTrainerSolved
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : trainerFeedback.includes("mistake")
                            ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        }`}>
                          <div className="flex items-start gap-2.5">
                            {isTrainerSolved ? (
                              <Star className="w-4 h-4 shrink-0 text-green-400 animate-bounce" />
                            ) : (
                              <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            <p className="leading-relaxed">{trainerFeedback}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl border border-dashed border-white/5 text-center text-xs text-slate-500 font-semibold py-8 select-none">
                          Make your move on the board to solve
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-4 border-t border-[#2b2925]">
                {!isTrainerSolved ? (
                  <button
                    onClick={() => {
                      const currentMoment = keyMoments[currentKeyMomentIdx];
                      const bestMoveUci = currentMoment.move.bestMove;
                      if (!bestMoveUci) return;
                      
                      const solutionSan = (() => {
                        try {
                          const g = new Chess(game?.fen());
                          const from = bestMoveUci.slice(0, 2);
                          const to = bestMoveUci.slice(2, 4);
                          const promotion = bestMoveUci.slice(4, 5);
                          const m = g.move({ from, to, promotion });
                          return m ? m.san : bestMoveUci;
                        } catch {
                          return bestMoveUci;
                        }
                      })();
                      
                      setTrainerFeedback(`The best move was ${solutionSan}. Try to play it!`);
                      setShowBestMove(true);
                    }}
                    className="w-full py-2.5 bg-surface-200 hover:bg-surface-300 text-white rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer"
                  >
                    Show Solution
                  </button>
                ) : (
                  currentKeyMomentIdx < keyMoments.length - 1 ? (
                    <button
                      onClick={() => handleKeyMomentNavigation(1)}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-green-500/20 cursor-pointer"
                    >
                      Next Moment
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-center text-[10px] text-green-400 font-extrabold uppercase animate-pulse">🎉 All Moments Solved!</div>
                      <button
                        onClick={() => setIsKeyMomentMode(false)}
                        className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        Back to Game Review
                      </button>
                    </div>
                  )
                )}

                <button
                  onClick={() => setIsKeyMomentMode(false)}
                  className="w-full py-2 bg-transparent hover:bg-surface-200 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  Exit Trainer
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab switcher */}
              <div className="flex border-b border-[#2b2925] bg-surface-200">
                {[
                  { id: "analysis", label: "Analysis" },
                  { id: "moves",    label: "Moves" },
                  { id: "games",    label: "Games" },
                ].map((tab) => {
                  const isActive = sidebarTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSidebarTab(tab.id as any)}
                      className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                        isActive
                          ? "border-primary-500 text-white bg-surface-100"
                          : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab contents */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">

                {/* ── ANALYSIS TAB ── */}
                {sidebarTab === "analysis" && (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                      Engine Evaluation
                    </h4>

                    {/* Current engine score */}
                    <div className="bg-surface-200 p-4 rounded-2xl border border-[#2b2925] text-center space-y-1">
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Position Score</div>
                      <div className={`text-3xl font-black ${activeEval.score >= 0 ? "text-white" : "text-slate-400"}`}>
                        {activeEval.type === "mate"
                          ? `M${Math.abs(activeEval.score)}`
                          : (activeEval.score >= 0 ? "+" : "") + activeEval.score.toFixed(2)
                        }
                      </div>
                      <div className="text-[10px] text-slate-500">Depth {activeEval.depth}</div>
                    </div>

                    {/* Engine Options / Best Move Toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-surface-200 rounded-2xl border border-[#2b2925]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">Show Best Move</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Highlight engine's suggestion</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowBestMove(!showBestMove)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showBestMove ? "bg-green-500" : "bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showBestMove ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Interactive Engine Candidate Lines */}
                    {activeEval.topMoves && activeEval.topMoves.length > 0 && (
                      <div className="p-4 bg-surface-200 border border-[#2b2925] rounded-2xl space-y-3 text-xs select-none animate-in fade-in duration-200">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                          <span>Top Engine Lines</span>
                          <span>MultiPV ({activeEval.topMoves.filter(Boolean).length})</span>
                        </div>
                        
                        <div className="space-y-1.5">
                          {activeEval.topMoves.filter(Boolean).map((mv, idx) => {
                            const san = uciToSan(game ? game.fen() : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", mv.move);
                            const isCurrentBest = activeEval.bestMove === mv.move;
                            const isHovered = activeCandidateArrow?.from === mv.move.slice(0, 2) && activeCandidateArrow?.to === mv.move.slice(2, 4);

                            const scoreText = mv.type === "mate" 
                              ? `M${Math.abs(mv.score)}` 
                              : (mv.score >= 0 ? "+" : "") + mv.score.toFixed(2);

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  if (isHovered) {
                                    setActiveCandidateArrow(null);
                                  } else {
                                    setActiveCandidateArrow({
                                      from: mv.move.slice(0, 2),
                                      to: mv.move.slice(2, 4)
                                    });
                                  }
                                }}
                                onMouseEnter={() => {
                                  setActiveCandidateArrow({
                                    from: mv.move.slice(0, 2),
                                    to: mv.move.slice(2, 4)
                                  });
                                }}
                                onMouseLeave={() => {
                                  setActiveCandidateArrow(null);
                                }}
                                className={`w-full p-2.5 rounded-xl flex justify-between items-center transition-colors border cursor-pointer ${
                                  isHovered
                                    ? "bg-primary-500/10 border-primary-500/30 text-primary-300 font-bold"
                                    : "bg-surface-100 hover:bg-surface-300 border-[#2b2925] text-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">#{idx + 1}</span>
                                  <span className="font-mono font-black text-white bg-surface-200 px-1.5 py-0.5 rounded text-[10px]">
                                    {san || mv.move}
                                  </span>
                                  {isCurrentBest && (
                                    <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 px-1 py-0.2 rounded font-black uppercase">
                                      Best
                                    </span>
                                  )}
                                </div>
                                <span className={`font-mono font-extrabold ${mv.score >= 0 ? "text-green-400" : "text-slate-400"}`}>
                                  {scoreText}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-[8px] text-slate-500 text-center font-medium leading-none">
                          Hover or click a line to draw a path arrow on the board
                        </div>
                      </div>
                    )}

                    {/* Move Explanation Card */}
                    {gameReview && moveIndex >= 0 && moveIndex < gameReview.moves.length && (() => {
                      const rev = gameReview.moves[moveIndex];
                      const cfg = classConfig[rev.classification];
                      const { Icon } = cfg;
                      const bestMoveSan = uciToSan(rev.fenBefore, rev.bestMove);
                      
                      const coach = rev.explanation || {
                        whatHappened: `You played ${rev.san}.`,
                        whyGoodOrBad: `This move was classified as a ${cfg.label} move by the engine.`,
                        whatWasMissed: ["blunder", "mistake", "inaccuracy", "missed_win"].includes(rev.classification)
                          ? `You missed the stronger option: ${bestMoveSan || "a different plan"}.`
                          : "Nothing was missed! You found the optimal continuation.",
                        bestContinuation: bestMoveSan && bestMoveSan !== "(none)"
                          ? `The best continuation plan starts with ${bestMoveSan}.`
                          : "Focus on developing your pieces and securing the center."
                      };
                      
                      return (
                        <div className={`p-5 rounded-2xl border space-y-4 animate-in slide-in-from-top-2 duration-200 bg-[#121613]/90 backdrop-blur-md ${cfg.border}`}>
                          {/* Coach Header */}
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                                <Icon className={`w-5 h-5 ${cfg.color}`} />
                              </div>
                              <div className="text-left">
                                <span className={`text-[10px] font-black uppercase tracking-wider ${cfg.color}`}>
                                  {cfg.label} Move
                                </span>
                                <h5 className="text-xs font-bold text-white mt-0.5">Coach Review</h5>
                              </div>
                            </div>
                            
                            {/* Coach Voice Commentary Toggle Button */}
                            <button
                              onClick={() => {
                                const fullCoachText = `${coach.whatHappened} ${coach.whyGoodOrBad} ${
                                  ["blunder", "mistake", "inaccuracy", "missed_win"].includes(rev.classification)
                                    ? coach.whatWasMissed
                                    : ""
                                } ${coach.bestContinuation}`;
                                speakCoachExplanation(fullCoachText);
                              }}
                              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wider select-none ${
                                isSpeaking 
                                  ? "bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20" 
                                  : "bg-primary-500/10 border-primary-500/25 text-primary-400 hover:bg-primary-500/20"
                              }`}
                              title="Listen to Coach Voice explanation"
                            >
                              {isSpeaking ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 animate-pulse text-red-400" />
                                  Stop Voice
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 text-primary-400" />
                                  Speak Coach
                                </>
                              )}
                            </button>
                          </div>

                          {/* 4-Part Explanation Grid */}
                          <div className="space-y-3.5 text-xs text-left">
                            {/* Part 1: What Happened */}
                            <div className="space-y-1">
                              <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">What happened</div>
                              <p className="text-slate-200 font-medium leading-relaxed">{coach.whatHappened}</p>
                            </div>

                            {/* Part 2: Why */}
                            <div className="space-y-1">
                              <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Why</div>
                              <p className="text-slate-300 font-medium leading-relaxed">{coach.whyGoodOrBad}</p>
                            </div>

                            {/* Part 3: What was Missed */}
                            {["blunder", "mistake", "inaccuracy", "missed_win"].includes(rev.classification) && (
                              <div className="space-y-1 bg-red-500/5 p-2.5 rounded-xl border border-red-500/10">
                                <div className="text-[10px] text-red-400 font-extrabold uppercase tracking-wider">What was missed</div>
                                <p className="text-slate-300 font-medium leading-relaxed">{coach.whatWasMissed}</p>
                              </div>
                            )}

                            {/* Part 4: Continuation */}
                            <div className="space-y-1 bg-green-500/5 p-2.5 rounded-xl border border-green-500/10">
                              <div className="text-[10px] text-green-400 font-extrabold uppercase tracking-wider">Best Continuation</div>
                              <p className="text-slate-300 font-medium leading-relaxed">{coach.bestContinuation}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Reviewed moves panel (after Game Review) */}
                    {gameReview ? (
                      <div className="space-y-1.5 max-h-[38vh] overflow-y-auto pr-1">
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-2">Move Classifications</div>
                        {gameReview.moves.map((m, idx) => {
                          const cfg = classConfig[m.classification];
                          const { Icon } = cfg;
                          return (
                            <div
                              key={idx}
                              onClick={() => setMoveIndex(idx)}
                              className={`p-2.5 rounded-xl flex justify-between items-center cursor-pointer transition-colors text-xs font-semibold ${
                                moveIndex === idx
                                  ? "bg-primary-600 text-white font-bold"
                                  : "bg-surface-200 hover:bg-surface-300 text-slate-300"
                              }`}
                            >
                              <span className="font-mono">
                                {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}. ` : ""}
                                {m.san}
                              </span>
                              <span className={`flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                moveIndex === idx ? "bg-white/10 text-white border-white/20" : `${cfg.bg} ${cfg.color} ${cfg.border}`
                              }`}>
                                <Icon className="w-2.5 h-2.5" />
                                {cfg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[38vh] overflow-y-auto pr-1">
                        {historyMoves.length === 0 ? (
                          <div className="text-slate-500 text-center py-10 text-xs font-semibold">
                            Load a game or make moves, then click "Run Game Review"
                          </div>
                        ) : (
                          <>
                            <div className="text-[10px] text-slate-500 font-semibold text-center pb-1">
                              {historyMoves.length} moves loaded — click Run Game Review for full analysis
                            </div>
                            {historyMoves.map((m, idx) => (
                              <div
                                key={idx}
                                onClick={() => setMoveIndex(idx)}
                                className={`p-2.5 rounded-xl flex justify-between items-center cursor-pointer transition-colors text-xs font-semibold ${
                                  moveIndex === idx
                                    ? "bg-primary-600 text-white font-bold"
                                    : "bg-surface-200 hover:bg-surface-300 text-slate-300"
                                }`}
                              >
                                <span className="font-mono">
                                  {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}. ` : ""}
                                  {m}
                                </span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── MOVES TAB ── */}
                {sidebarTab === "moves" && (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <FileText className="w-4 h-4 text-primary-400" />
                      PGN Import
                    </h4>

                    <form onSubmit={handleCompilePgn} className="bg-surface-200 border border-[#2b2925] p-4 rounded-2xl space-y-3">
                      <div className="text-[10px] text-slate-500 font-extrabold uppercase">Paste PGN text</div>
                      <textarea
                        value={pgnInput}
                        onChange={(e) => setPgnInput(e.target.value)}
                        placeholder="1. e4 e5 2. Nf3 Nc6..."
                        rows={4}
                        className="w-full bg-surface-100 border border-[#3d3b38] rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none resize-none"
                      />
                      <button
                        type="submit"
                        className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        Load PGN
                      </button>
                    </form>

                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold max-h-[40vh] overflow-y-auto pr-1">
                      {historyMoves.length === 0 ? (
                        <div className="col-span-2 text-slate-500 text-center py-10">
                          No moves loaded. Paste PGN above or load a game.
                        </div>
                      ) : (
                        historyMoves.map((m, idx) => (
                          <button
                            key={idx}
                            onClick={() => setMoveIndex(idx)}
                            className={`p-2.5 rounded-xl border text-left flex gap-1.5 items-center transition-colors cursor-pointer ${
                              moveIndex === idx
                                ? "bg-primary-600 border-primary-500 text-white font-bold"
                                : "bg-surface-200 border-[#2b2925] text-slate-400 hover:text-white"
                            }`}
                          >
                            <span className="text-[10px] text-slate-500 font-mono">
                              {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}.` : "..."}
                            </span>
                            <span>{m}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ── GAMES TAB ── */}
                {sidebarTab === "games" && (
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <Database className="w-4 h-4 text-primary-400" />
                      Linked Games
                    </h4>

                    {allGames.length > 0 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          value={gamesFilter}
                          onChange={(e) => setGamesFilter(e.target.value)}
                          placeholder="Search opponent name..."
                          className="w-full bg-surface-200 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                        />
                      </div>
                    )}

                    {filteredGames.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-xs font-semibold space-y-2">
                        <Database className="w-8 h-8 mx-auto text-slate-600" />
                        <p>{allGames.length === 0 ? "No games available." : "No matching games found."}</p>
                        {allGames.length === 0 && (
                          <p className="text-[10px]">Connect Chess.com or Lichess in Integrations, or use the Search above.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                        {filteredGames.map((g) => (
                          <div
                            key={g.id}
                            onClick={() => { handleLoadGame(g); setSidebarTab("analysis"); }}
                            className="p-3.5 bg-surface-200 hover:bg-[#2b2925] border border-[#2b2925] rounded-2xl cursor-pointer transition-all group"
                          >
                            <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                              <span className={`uppercase tracking-wide ${
                                g.platform === "chesscom" ? "text-green-400" : "text-blue-400"
                              }`}>
                                {g.platform === "chesscom" ? "Chess.com" : "Lichess"}
                              </span>
                              <span className="text-slate-500 font-mono">{g.date}</span>
                            </div>
                            <div className="text-xs font-extrabold text-white group-hover:text-primary-400 transition-colors">
                              vs {g.opponent} ({g.opponentRating})
                            </div>
                            <div className="flex justify-between items-center mt-3 gap-2">
                              <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${
                                g.result === "win" ? "text-green-400 bg-green-500/10 border-green-500/15" :
                                g.result === "loss" ? "text-red-400 bg-red-500/10 border-red-500/15" :
                                "text-slate-400 bg-slate-500/10 border-slate-500/15"
                              }`}>
                                {g.result?.toUpperCase()}
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLoadGame(g);
                                    setSidebarTab("analysis");
                                  }}
                                  className="px-2 py-1 bg-surface-300 hover:bg-surface-100 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-white/5 transition-all cursor-pointer"
                                >
                                  Load
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReviewGame(g);
                                  }}
                                  className="px-2.5 py-1 bg-primary-600/80 hover:bg-primary-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 border border-primary-500/20 transition-all cursor-pointer shadow-sm"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                                  Review
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
