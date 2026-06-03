"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import ChessboardWrapper from "@/components/chess/ChessboardWrapper";
import EvaluationBar from "@/components/chess/EvaluationBar";
import BoardEditor from "@/components/chess/BoardEditor";
import { useStockfish } from "@/hooks/useStockfish";
import { useWebSockets } from "@/hooks/useWebSockets";
import { generateChess960FEN, checkKingOfTheHillCenter } from "@/lib/chess/variants";
import { pastSelfProfiles } from "@/lib/chess/pastSelf";
import { useRouter } from "next/navigation";
import {
  Play, Bot, Edit, Settings, RotateCcw, Award, History,
  Plus, Users, EyeOff, Volume2, VolumeX, RefreshCw,
  FlipVertical, Handshake, Flag, ChevronDown, ChevronUp,
  Mic, MicOff, Brain,
} from "lucide-react";
import { useUIStore, uiStore } from "@/store/uiStore";
import { chessAudio } from "@/utils/chessAudio";
import { motion, AnimatePresence } from "framer-motion";

// ── Time control presets ────────────────────────────────────────────────────
const TIME_CONTROLS = [
  { label: "1+0",   seconds: 60,   increment: 0,  tag: "Bullet" },
  { label: "2+1",   seconds: 120,  increment: 1,  tag: "Bullet" },
  { label: "3+0",   seconds: 180,  increment: 0,  tag: "Blitz"  },
  { label: "3+2",   seconds: 180,  increment: 2,  tag: "Blitz"  },
  { label: "5+0",   seconds: 300,  increment: 0,  tag: "Blitz"  },
  { label: "5+3",   seconds: 300,  increment: 3,  tag: "Blitz"  },
  { label: "10+0",  seconds: 600,  increment: 0,  tag: "Rapid"  },
  { label: "15+10", seconds: 900,  increment: 10, tag: "Rapid"  },
  { label: "30+0",  seconds: 1800, increment: 0,  tag: "Classical" },
];

interface Challenge {
  id: string; player: string; rating: number;
  timeControl: string; variant: string; color: string;
}

export default function PlayPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("username")) {
      router.push("/auth/signin");
    }
  }, [router]);

  // ── Tab / game mode ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab]     = useState<"ai" | "multiplayer" | "editor">("ai");
  const [game, setGame]               = useState<Chess | null>(null);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [gameMode, setGameMode]       = useState<"normal" | "chess960" | "kingofthehill" | "threecheck">("normal");
  const [isFlipped, setIsFlipped]     = useState(false);

  // ── Clock ────────────────────────────────────────────────────────────────
  const [selectedTimeIdx, setSelectedTimeIdx] = useState(3); // default 10 min
  const [whiteTime, setWhiteTime]   = useState(600);
  const [blackTime, setBlackTime]   = useState(600);
  const [isGameActive, setIsGameActive] = useState(false);
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Premoves ─────────────────────────────────────────────────────────────
  const [premoves, setPremovesState]   = useState<Array<{ from: string; to: string; promotion?: string }>>([]);
  const [premovesEnabled, setPremovesEnabled] = useState(true);
  const premovesRef = useRef<Array<{ from: string; to: string; promotion?: string }>>([]);
  const setPremoveQueue = (val: typeof premovesRef.current) => {
    setPremovesState(val);
    premovesRef.current = val;
  };
  const handlePremove       = (from: string, to: string, promotion?: string) =>
    setPremoveQueue([...premovesRef.current, { from, to, promotion }]);
  const handleCancelPremove = () => setPremoveQueue([]);

  // ── Friend challenge room code ────────────────────────────────────────────
  const [friendRoomCode, setFriendRoomCode] = useState("");
  const [joinRoomCode, setJoinRoomCode]     = useState("");
  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFriendRoomCode(code);
    return code;
  };
  const shareLink = typeof window !== "undefined" && friendRoomCode
    ? `${window.location.origin}/play?room=${friendRoomCode}`
    : "";
  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink).catch(() => {});
    }
  };

  // ── Variant / game-over ──────────────────────────────────────────────────
  const [threeCheckCounts, setThreeCheckCounts] = useState({ white: 0, black: 0 });
  const [gameStatusText, setGameStatusText]     = useState("");

  // ── Draw / resign confirm ────────────────────────────────────────────────
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [drawOffered, setDrawOffered]             = useState(false);

  // ── Bot / difficulty ─────────────────────────────────────────────────────
  const [difficulty, setDifficulty]           = useState(3);
  const [activeBotProfile, setActiveBotProfile] = useState<any | null>(null);

  // ── Coach Panel ──────────────────────────────────────────────────────────
  // Coach states and helpers removed



  // ── Engines / sockets ────────────────────────────────────────────────────
  const { evaluation, isEvaluating, analyzePosition } = useStockfish();
  const {
    matchmakingStatus, activeGame, incomingMove, gameResult,
    connect, disconnect, joinQueue, leaveQueue, sendMove, declareGameOver,
  } = useWebSockets();

  const { blindfold, boardTheme } = useUIStore();

  // ── Multiplayer lobby ────────────────────────────────────────────────────
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: "c1", player: "GM_Aura",     rating: 2850, timeControl: "3 min Blitz",  variant: "Standard", color: "Random" },
    { id: "c2", player: "TacticsFan",  rating: 1600, timeControl: "10 min Rapid", variant: "Standard", color: "White"  },
    { id: "c3", player: "ChessWizard", rating: 1200, timeControl: "1 min Bullet", variant: "Standard", color: "Black"  },
    { id: "c4", player: "GrandmasterF", rating: 2100, timeControl: "5 min Blitz",  variant: "Chess960", color: "Random" },
  ]);
  const [customTime, setCustomTime]       = useState("3 min");
  const [customVariant, setCustomVariant] = useState("normal");
  const [customColor, setCustomColor]     = useState("random");


  // ── Load URL bot param ───────────────────────────────────────────────────
  const getBotProperties = () => {
    let bot = activeBotProfile;
    if (!bot) {
      const bots = [
        { id: "jimmy",  name: "Jimmy",            elo: 600,  difficulty: 1 },
        { id: "ned",    name: "Novice Ned",       elo: 800,  difficulty: 2 },
        { id: "nelson", name: "Nelson",           elo: 1300, difficulty: 3 },
        { id: "toby",   name: "Tactical Toby",    elo: 1600, difficulty: 4 },
        { id: "nexus",  name: "Master Nexus",     elo: 2200, difficulty: 5 },
      ];
      bot = bots.find(b => b.difficulty === difficulty) || bots[2];
    }
    
    let depth = 8;
    let blunderChance = 0.1;
    let minDelay = 1500;
    let maxDelay = 3500;
    
    switch (bot.id) {
      case "jimmy":
        depth = 3;
        blunderChance = 0.40;
        minDelay = 1000;
        maxDelay = 2000;
        break;
      case "ned":
        depth = 4;
        blunderChance = 0.30;
        minDelay = 1200;
        maxDelay = 2500;
        break;
      case "abby":
        depth = 6;
        blunderChance = 0.20;
        minDelay = 1500;
        maxDelay = 3500;
        break;
      case "nelson":
        depth = 6;
        blunderChance = 0.15;
        minDelay = 1500;
        maxDelay = 3500;
        break;
      case "coach": {
        const playerRating = typeof window !== "undefined" ? Number(localStorage.getItem("rating") || "1400") : 1400;
        depth = Math.max(3, Math.min(14, Math.round(playerRating / 150)));
        blunderChance = Math.max(0.02, Math.min(0.35, (2200 - playerRating) / 2000));
        minDelay = 1500;
        maxDelay = 3500;
        break;
      }
      case "toby":
        depth = 9;
        blunderChance = 0.08;
        minDelay = 1800;
        maxDelay = 4000;
        break;
      case "self_1m":
      case "self_6m":
      case "self_1y":
        depth = 8;
        blunderChance = 0.10;
        minDelay = 1500;
        maxDelay = 3500;
        break;
      case "nexus":
        depth = 14;
        blunderChance = 0.01;
        minDelay = 2000;
        maxDelay = 4500;
        break;
      default:
        depth = difficulty * 2 + 2;
        blunderChance = Math.max(0.02, 0.45 - difficulty * 0.09);
        minDelay = 1000 + difficulty * 200;
        maxDelay = 2000 + difficulty * 500;
        break;
    }
    return { bot, depth, blunderChance, minDelay, maxDelay };
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const bot = params.get("bot");
    if (!bot) return;
    const standardBots = [
      { id: "coach",  name: "Adaptive Coach",   elo: 1500, description: "The Coach automatically adjusts its rating to match yours, giving you a perfectly balanced training match.", weaknesses: ["None"], strengths: ["Flexible playstyle","Real-time adapting"], difficulty: 3 },
      { id: "jimmy",  name: "Jimmy",            elo: 600,  description: "Jimmy is just starting out and loves to capture pieces regardless of safety.", weaknesses: ["Hangs Queen","Basic checkmates"], strengths: ["Fast play"], difficulty: 1 },
      { id: "ned",    name: "Novice Ned",       elo: 800,  description: "Ned understands basic rules but frequently leaves pieces undefended.", weaknesses: ["Absolute Pins","Hanging pieces"], strengths: ["Pawn development"], difficulty: 1 },
      { id: "nelson", name: "Nelson",           elo: 1300, description: "Nelson is notorious for bringing his Queen out on move two and attacking aggressively.", weaknesses: ["Overextended pieces","Refutable openings"], strengths: ["Early Queen attacks"], difficulty: 2 },
      { id: "abby",   name: "Aggressive Abby",  elo: 1200, description: "Abby plays volatile, attacking chess. She loves aggressive pawn storms.", weaknesses: ["King Safety","Endgame transitions"], strengths: ["Tactical Attacks"], difficulty: 2 },
      { id: "toby",   name: "Tactical Toby",    elo: 1600, description: "Toby has sharp tactical vision. He is highly proficient in forks and skewers.", weaknesses: ["Positional maneuvers","Closed positions"], strengths: ["Pin Tactics","Fork setups"], difficulty: 3 },
      { id: "self_1m",name: "Your Past Self (1m ago)", elo: 1450, description: "This bot is trained on your exact game history from 1 month ago.", weaknesses: ["Your own personal biases"], strengths: ["Your favorite systems"], difficulty: 3 },
      { id: "nexus",  name: "Master Nexus",     elo: 2200, description: "Nexus plays positional masterpieces. He minimizes blunders.", weaknesses: ["None"], strengths: ["Flawless Endgames","Pawn Structures"], difficulty: 5 },
    ];
    const profile = pastSelfProfiles.find((p) => p.id === bot) || standardBots.find((b) => b.id === bot);
    if (!profile) return;
    setActiveBotProfile(profile);
    const diff = standardBots.find((b) => b.id === bot)?.difficulty ?? (bot === "self_1y" ? 1 : bot === "self_6m" ? 2 : 3);
    setDifficulty(diff);
    const newGame = new Chess();
    setGame(newGame); setGameHistory([]); setIsGameActive(true);
    setThreeCheckCounts({ white: 0, black: 0 }); setGameStatusText("");
    const tc = TIME_CONTROLS[selectedTimeIdx].seconds;
    setWhiteTime(tc); setBlackTime(tc);
    
    let targetDepth = 8;
    switch (profile.id) {
      case "jimmy": targetDepth = 3; break;
      case "ned": targetDepth = 4; break;
      case "abby":
      case "nelson": targetDepth = 6; break;
      case "coach": {
        const playerRating = typeof window !== "undefined" ? Number(localStorage.getItem("rating") || "1400") : 1400;
        targetDepth = Math.max(3, Math.min(14, Math.round(playerRating / 150)));
        break;
      }
      case "toby": targetDepth = 9; break;
      case "self_1m":
      case "self_6m":
      case "self_1y": targetDepth = 8; break;
      case "nexus": targetDepth = 14; break;
      default: targetDepth = diff * 2 + 2; break;
    }
    analyzePosition(newGame.fen(), targetDepth);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Clock countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isGameActive || !game) return;
    const tc = TIME_CONTROLS[selectedTimeIdx];
    clockIntervalRef.current = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((p) => {
          if (p <= 1) { handleGameOver("black", "Timeout"); return 0; }
          return p - 1;
        });
      } else {
        setBlackTime((p) => {
          if (p <= 1) { handleGameOver("white", "Timeout"); return 0; }
          return p - 1;
        });
      }
    }, 1000);
    return () => { if (clockIntervalRef.current) clearInterval(clockIntervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameActive, game]);

  // ── Apply increment after each move ─────────────────────────────────────
  const applyIncrement = (color: "white" | "black") => {
    const inc = TIME_CONTROLS[selectedTimeIdx].increment;
    if (inc <= 0) return;
    if (color === "white") setWhiteTime((t) => t + inc);
    else setBlackTime((t) => t + inc);
  };

  // ── Game start ───────────────────────────────────────────────────────────
  const startLocalGame = (mode = gameMode) => {
    const startFen = mode === "chess960" ? generateChess960FEN() : undefined;
    setPremoveQueue([]);
    setShowResignConfirm(false);
    setDrawOffered(false);
    const newGame = new Chess(startFen);
    const tc = TIME_CONTROLS[selectedTimeIdx].seconds;
    setGame(newGame); setGameHistory([]); setWhiteTime(tc); setBlackTime(tc);
    setIsGameActive(true); setThreeCheckCounts({ white: 0, black: 0 }); setGameStatusText("");
    
    const botProps = getBotProperties();
    analyzePosition(newGame.fen(), botProps.depth);
    

  };

  // ── Game over ────────────────────────────────────────────────────────────
  const handleGameOver = (winner: "white" | "black" | "draw", reason: string) => {
    setIsGameActive(false);
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    setShowResignConfirm(false);
    if (activeTab === "multiplayer" && activeGame) {
      declareGameOver(activeGame.gameId, winner);
    } else {
      setGameStatusText(
        winner === "draw"
          ? `Game drawn: ${reason}`
          : `${winner === "white" ? "White" : "Black"} wins by ${reason}!`
      );
    }

  };

  // ── AI move trigger ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "ai" || !isGameActive || !game) return;
    if (game.turn() === (playerColor === "white" ? "w" : "b")) return;
    
    const { bot, blunderChance, minDelay, maxDelay } = getBotProperties();
    const moves = game.moves({ verbose: true });
    if (!moves.length) return;
    
    const delay = moves.length === 1 ? 500 : Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    
    const timer = setTimeout(() => {
      let chosenMoveStr: string | undefined = undefined;
      
      // 1. Check if past-self bot moves override
      if (bot.id === "self_1y" && Math.random() < 0.15) {
        const m = moves[Math.floor(Math.random() * moves.length)];
        chosenMoveStr = m.from + m.to + (m.promotion || "");
      } else if (bot.id === "self_6m" && Math.random() < 0.6) {
        const agg = moves.filter((m) => m.san.includes("+") || m.san.includes("x"));
        if (agg.length) {
          const m = agg[Math.floor(Math.random() * agg.length)];
          chosenMoveStr = m.from + m.to + (m.promotion || "");
        }
      }
      
      // 2. Check blunder/mistake chance
      if (!chosenMoveStr && Math.random() < blunderChance && evaluation.topMoves && evaluation.topMoves.length > 1) {
        const legalUciMoves = moves.map(m => m.from + m.to + (m.promotion || ""));
        const candidateMoves = evaluation.topMoves.filter(tm => tm && tm.move && legalUciMoves.includes(tm.move));
        if (candidateMoves.length > 1) {
          const chosenIdx = Math.floor(Math.random() * (candidateMoves.length - 1)) + 1;
          chosenMoveStr = candidateMoves[chosenIdx].move;
        }
      }
      
      // 3. Personality-specific playstyle overrides
      if (!chosenMoveStr) {
        if (bot.id === "jimmy" && Math.random() < 0.70) {
          const captureMoves = moves.filter(m => m.captured || m.san.includes("x"));
          if (captureMoves.length > 0) {
            const m = captureMoves[Math.floor(Math.random() * captureMoves.length)];
            chosenMoveStr = m.from + m.to + (m.promotion || "");
          }
        } else if (bot.id === "ned" && Math.random() < 0.40) {
          const m = moves[Math.floor(Math.random() * moves.length)];
          chosenMoveStr = m.from + m.to + (m.promotion || "");
        } else if (bot.id === "abby" && Math.random() < 0.50) {
          const aggMoves = moves.filter(m => m.san.includes("+") || m.san.includes("x") || m.piece === "p");
          if (aggMoves.length > 0) {
            const m = aggMoves[Math.floor(Math.random() * aggMoves.length)];
            chosenMoveStr = m.from + m.to + (m.promotion || "");
          }
        } else if (bot.id === "nelson" && gameHistory.length < 15 && Math.random() < 0.60) {
          const queenMoves = moves.filter(m => m.piece === "q");
          if (queenMoves.length > 0) {
            const m = queenMoves[Math.floor(Math.random() * queenMoves.length)];
            chosenMoveStr = m.from + m.to + (m.promotion || "");
          }
        }
      }
      
      // 4. Default to bestMove or random fallback
      if (!chosenMoveStr) {
        if (evaluation.bestMove) {
          chosenMoveStr = evaluation.bestMove;
        } else {
          const m = moves[Math.floor(Math.random() * moves.length)];
          chosenMoveStr = m.from + m.to + (m.promotion || "");
        }
      }
      
      if (chosenMoveStr) {
        const from = chosenMoveStr.slice(0, 2);
        const to = chosenMoveStr.slice(2, 4);
        const promotion = chosenMoveStr.slice(4) || undefined;
        handleMove(from, to, promotion);
      }
    }, delay);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, playerColor, isGameActive, activeTab, evaluation.bestMove, activeBotProfile]);

  // ── Incoming multiplayer moves ───────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "multiplayer" && incomingMove && activeGame)
      handleMove(incomingMove.from, incomingMove.to, incomingMove.promotion, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingMove, activeTab]);

  // ── Move handler ─────────────────────────────────────────────────────────
  const handleMove = (from: string, to: string, promotion?: string, emitSocket = true): boolean => {
    if (!game || !isGameActive) return false;
    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({ from, to, promotion });
      if (!move) return false;

      // Variant: King of the Hill
      if (gameMode === "kingofthehill") {
        const centerKing = checkKingOfTheHillCenter(gameCopy.fen());
        if (centerKing) { setGame(gameCopy); handleGameOver(centerKing, "King in Center"); return true; }
      }
      // Variant: Three-Check
      if (gameMode === "threecheck" && gameCopy.inCheck()) {
        const side = gameCopy.turn() === "b" ? "white" : "black";
        setThreeCheckCounts((prev) => {
          const next = { ...prev, [side]: prev[side] + 1 };
          if (next[side] >= 3) setTimeout(() => handleGameOver(side, "Three Checks"), 100);
          return next;
        });
      }
      // Standard game-over
      if (gameCopy.isGameOver()) {
        if (gameCopy.isCheckmate()) handleGameOver(gameCopy.turn() === "w" ? "black" : "white", "Checkmate");
        else if (gameCopy.isDraw())  handleGameOver("draw", "Draw");
      }

      // Socket emit
      if (activeTab === "multiplayer" && activeGame && emitSocket)
        sendMove(activeGame.gameId, from, to, promotion);

      // Sound
      if (gameCopy.inCheck())          chessAudio.playCheck();
      else if (move.captured || move.san.includes("x")) chessAudio.playCapture();
      else                             chessAudio.playMove();

      // Update state
      setGame(gameCopy); setGameHistory(gameCopy.history());
      
      // Apply increment to the player who just moved
      const movedColor = move.color === "w" ? "white" : "black";
      applyIncrement(movedColor);
      
      const botProps = getBotProperties();
      analyzePosition(gameCopy.fen(), botProps.depth);



      // ── Premove execution ────────────────────────────────────────────────
      const nextTurn = gameCopy.turn();
      const isMyTurnNext = nextTurn === (playerColor === "white" ? "w" : "b");
      const queue = premovesRef.current;
      if (isMyTurnNext && queue.length > 0) {
        const [first, ...rest] = queue;
        setPremoveQueue(rest);
        try {
          const premoveCopy = new Chess(gameCopy.fen());
          const pm = premoveCopy.move({ from: first.from, to: first.to, promotion: first.promotion });
          if (pm) {
            if (premoveCopy.isGameOver()) {
              if (premoveCopy.isCheckmate()) setTimeout(() => handleGameOver(premoveCopy.turn() === "w" ? "black" : "white", "Checkmate"), 10);
              else if (premoveCopy.isDraw())  setTimeout(() => handleGameOver("draw","Draw"), 10);
            }
            if (activeTab === "multiplayer" && activeGame)
              sendMove(activeGame.gameId, first.from, first.to, first.promotion);
            if (premoveCopy.inCheck())          chessAudio.playCheck();
            else if (pm.captured || pm.san.includes("x")) chessAudio.playCapture();
            else                               chessAudio.playMove();
            setGame(premoveCopy); setGameHistory(premoveCopy.history());
            analyzePosition(premoveCopy.fen(), difficulty * 2);
          }
        } catch { setPremoveQueue([]); }
      }
      return true;
    } catch { return false; }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

  // ── Multiplayer connect ──────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "multiplayer") {
      connect("1", localStorage.getItem("username") || "GuestGrandmaster", 1450);
    } else { disconnect(); setIsGameActive(false); setGame(null); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleCreateChallenge = () => {
    const user = localStorage.getItem("username") || "GuestGrandmaster";
    const newC: Challenge = {
      id: `c_${Date.now()}`, player: user, rating: 1450, timeControl: customTime,
      variant: { normal: "Standard", chess960: "Chess960", kingofthehill: "King of the Hill", threecheck: "Three-Check" }[customVariant] ?? "Standard",
      color: customColor.charAt(0).toUpperCase() + customColor.slice(1),
    };
    setChallenges((p) => [newC, ...p]);
  };

  const handleJoinChallenge = (c: Challenge) => {
    setPlayerColor(c.color === "Black" ? "white" : "black");
    setGameMode(c.variant.toLowerCase().replace(/\s+/g, "") as any);
    setPremoveQueue([]);
    const newGame = new Chess();
    setGame(newGame); setGameHistory([]); setWhiteTime(300); setBlackTime(300);
    setIsGameActive(true); setThreeCheckCounts({ white: 0, black: 0 }); setGameStatusText("");
    analyzePosition(newGame.fen(), 6);
  };



  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">

      {/* Tab bar */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        {[
          { id: "ai",          label: "Play Local AI",  icon: Bot  },
          { id: "multiplayer", label: "Play Online",    icon: Play },
          { id: "editor",      label: "Board Editor",   icon: Edit },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {activeTab === "editor" ? (
            <BoardEditor onFenChange={(fen) => console.log("Editor FEN:", fen)} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* Board area */}
          <div className="lg:col-span-3 flex gap-4 items-center justify-center">
            {game && (
              <EvaluationBar
                score={evaluation.score}
                type={evaluation.type}
                isEvaluating={isEvaluating}
                orientation={isFlipped ? (playerColor === "white" ? "black" : "white") : playerColor}
                depth={evaluation.depth}
                sideToMove={game.turn() === "w" ? "white" : "black"}
              />
            )}

            {game ? (
              <div className="flex-1 flex items-center justify-center">
                <ChessboardWrapper
                  game={game}
                  onMove={(from, to, prom) => handleMove(from, to, prom)}
                  userColor={isFlipped ? (playerColor === "white" ? "black" : "white") : playerColor}
                  blindfoldMode={blindfold}
                  boardTheme={boardTheme}
                  premoves={premoves}
                  premovesEnabled={premovesEnabled}
                  onPremove={handlePremove}
                  onCancelPremove={handleCancelPremove}
                />
              </div>
            ) : activeTab === "ai" ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-white/10 rounded-2xl glass p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
                  <Play className="w-8 h-8 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to play</h2>
                  <p className="text-slate-400 text-sm max-w-sm">Configure settings on the right, then start your game.</p>
                </div>
                <button
                  onClick={() => startLocalGame()}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-colors"
                >
                  Start Game
                </button>
              </div>
            ) : (
              /* Multiplayer lobby */
              <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch">
                <div className="flex-1 glass-card border border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-400" /> Open Lobby
                    </h3>
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/10 animate-pulse">
                      ● Active
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Player</th>
                          <th className="pb-3">Rating</th>
                          <th className="pb-3">Time</th>
                          <th className="pb-3">Variant</th>
                          <th className="pb-3 text-right pr-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {challenges.map((c) => (
                          <tr key={c.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 pl-2 text-white font-semibold">{c.player}</td>
                            <td className="py-3 text-slate-300 font-mono">{c.rating}</td>
                            <td className="py-3 text-slate-300">{c.timeControl}</td>
                            <td className="py-3 text-primary-400 font-bold">{c.variant}</td>
                            <td className="py-3 text-right pr-2">
                              <button
                                onClick={() => handleJoinChallenge(c)}
                                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold text-[10px] uppercase transition-colors"
                              >Join</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                  <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary-400" /> Create Match
                    </h3>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Variant</label>
                      <select value={customVariant} onChange={(e) => setCustomVariant(e.target.value)}
                        className="w-full bg-surface-200 border border-[#2b2925] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none">
                        <option value="normal">Standard</option>
                        <option value="chess960">Chess960</option>
                        <option value="kingofthehill">King of the Hill</option>
                        <option value="threecheck">Three-Check</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Time Control</label>
                      <select value={customTime} onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full bg-surface-200 border border-[#2b2925] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none">
                        {TIME_CONTROLS.map((tc) => (
                          <option key={tc.label} value={tc.label}>{tc.label} ({tc.tag})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Color</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["white","random","black"].map((col) => (
                          <button key={col} onClick={() => setCustomColor(col)}
                            className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              customColor === col ? "bg-primary-500/20 border-primary-500 text-white" : "bg-surface-200 border-white/5 text-slate-400"
                            }`}
                          >{col}</button>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleCreateChallenge}
                      className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary-500/25">
                      Post Challenge
                    </button>
                  </div>

                  <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-primary-400" /> Quick Matchmaking
                    </h3>
                    <button onClick={() => joinQueue("blitz")} disabled={matchmakingStatus === "queued"}
                      className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-lg transition-colors">
                      {matchmakingStatus === "queued" ? "Searching…" : "Queue 3 Min Blitz"}
                    </button>
                    {matchmakingStatus === "queued" && (
                      <button onClick={() => leaveQueue("blitz")}
                        className="w-full py-2 bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-xl">
                        Cancel Search
                      </button>
                    )}
                  </div>

                  {/* Challenge a Friend */}
                  <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary-400" /> Challenge a Friend
                    </h3>
                    {!friendRoomCode ? (
                      <button
                        onClick={generateRoomCode}
                        className="w-full py-2.5 bg-accent-600/80 hover:bg-accent-500 text-white font-bold rounded-xl text-xs shadow-lg transition-colors border border-accent-500/30"
                      >
                        🔗 Generate Share Link
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Room Code</p>
                          <p className="text-lg font-black text-primary-300 tracking-[0.3em]">{friendRoomCode}</p>
                        </div>
                        <button
                          onClick={copyShareLink}
                          className="w-full py-2 bg-surface-200 border border-white/10 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-colors"
                        >
                          📋 Copy Share Link
                        </button>
                        <button
                          onClick={() => setFriendRoomCode("")}
                          className="w-full py-1.5 text-slate-500 hover:text-slate-300 text-[10px] transition-colors"
                        >
                          Generate new code
                        </button>
                      </div>
                    )}
                    <div className="border-t border-white/5 pt-3 space-y-2">
                      <p className="text-[10px] text-slate-500 font-bold">Join with a code:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={joinRoomCode}
                          onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                          placeholder="XXXXXX"
                          className="flex-1 bg-surface-100 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-500/50 tracking-widest uppercase"
                        />
                        <button
                          onClick={() => {
                            if (joinRoomCode.length === 6) {
                              window.location.href = `/play?room=${joinRoomCode}`;
                            }
                          }}
                          disabled={joinRoomCode.length < 6}
                          className="px-3 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-200 disabled:text-slate-600 text-white rounded-xl text-[10px] font-bold transition-colors"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Clocks */}
            <div className="glass-card border border-white/10 p-4 rounded-2xl grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border text-center transition-all ${
                game && game.turn() === "b" && isGameActive
                  ? "bg-black border-primary-500/40 shadow-lg shadow-primary-500/10"
                  : "bg-[#1b1c1e] border-white/5"
              }`}>
                <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Black</div>
                <div className={`text-2xl font-mono font-bold ${blackTime < 30 && isGameActive ? "text-red-400 animate-pulse" : "text-white"}`}>
                  {formatTime(blackTime)}
                </div>
              </div>
              <div className={`p-3 rounded-xl border text-center transition-all ${
                game && game.turn() === "w" && isGameActive
                  ? "bg-slate-700 border-primary-500/40 shadow-lg shadow-primary-500/10"
                  : "bg-slate-800 border-white/10"
              }`}>
                <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">White</div>
                <div className={`text-2xl font-mono font-bold ${whiteTime < 30 && isGameActive ? "text-red-400 animate-pulse" : "text-white"}`}>
                  {formatTime(whiteTime)}
                </div>
              </div>
            </div>



            {/* ── SETTINGS (pre-game only) ──────────────────────────────── */}
            {activeTab === "ai" && !isGameActive && (
              <div className="glass-card border border-white/10 p-5 rounded-2xl space-y-4">
                {activeBotProfile ? (
                  <div className="space-y-4">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-primary-400" /> Past Self Challenger
                    </h4>
                    <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl space-y-1">
                      <div className="font-bold text-sm text-white">{activeBotProfile.name}</div>
                      <div className="text-xs text-slate-400">{activeBotProfile.elo} Elo</div>
                      <p className="text-[11px] text-slate-300 italic">{activeBotProfile.description}</p>
                    </div>
                    <button onClick={() => startLocalGame()}
                      className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold">
                      Start Challenger Match
                    </button>
                  </div>
                ) : (
                  <>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-primary-400" /> Match Settings
                    </h4>

                    {/* Time control picker */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-400">Time Control</label>
                        <span className="text-[10px] font-bold text-primary-400">{TIME_CONTROLS[selectedTimeIdx].tag}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {TIME_CONTROLS.map((tc, idx) => (
                          <button key={tc.label} onClick={() => setSelectedTimeIdx(idx)}
                            className={`py-2 px-1 rounded-lg border text-[10px] font-bold transition-colors ${
                              selectedTimeIdx === idx
                                ? "bg-primary-600/20 border-primary-500 text-white"
                                : "bg-surface-100 border-white/5 text-slate-400 hover:text-white"
                            }`}>
                            <div>{tc.label}</div>
                            {(tc as any).increment > 0 && <div className="text-[8px] text-primary-400/70">+{(tc as any).increment}s</div>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Variant */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Game Variant</label>
                      <select value={gameMode} onChange={(e) => setGameMode(e.target.value as any)}
                        className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-sm font-medium text-white focus:outline-none">
                        <option value="normal">Standard Chess</option>
                        <option value="chess960">Chess960 (Fischer)</option>
                        <option value="kingofthehill">King of the Hill</option>
                        <option value="threecheck">Three-Check</option>
                      </select>
                    </div>

                    {/* Player color */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Play as</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["white","black"] as const).map((col) => (
                          <button key={col} onClick={() => setPlayerColor(col)}
                            className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-colors ${
                              playerColor === col
                                ? "bg-primary-600/20 border-primary-500 text-white"
                                : "bg-surface-100 border-white/5 text-slate-400 hover:text-white"
                            }`}
                          >{col}</button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span>Bot Difficulty</span>
                        <span className="text-primary-400">Level {difficulty}</span>
                      </div>
                      <input type="range" min="1" max="5" value={difficulty}
                        onChange={(e) => setDifficulty(Number(e.target.value))}
                        className="w-full accent-primary-500 h-1.5 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    {/* Board theme */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Board Theme</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ id:"classic",label:"Classic"},{ id:"glass",label:"Glass"},{ id:"emerald",label:"Emerald"},{ id:"wood",label:"Wood"}].map((t) => (
                          <button key={t.id} onClick={() => uiStore.setTheme(t.id as any)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                              boardTheme === t.id ? "bg-primary-600/20 border-primary-500 text-white" : "bg-surface-100 border-white/5 text-slate-400 hover:text-white"
                            }`}>{t.label}</button>
                        ))}
                      </div>
                    </div>

                    {/* Flip board */}
                    <button onClick={() => setIsFlipped((f) => !f)}
                      className="w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-colors bg-surface-100 border-white/5 text-slate-300 hover:text-white hover:bg-surface-200">
                      <FlipVertical className="w-4 h-4" /> Flip Board
                    </button>

                    {/* Premoves toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-surface-100/50 rounded-xl border border-white/5">
                      <div>
                        <span className="text-xs font-bold text-white block">Enable Premoves</span>
                        <span className="text-[10px] text-slate-500">Input moves before your turn</span>
                      </div>
                      <button onClick={() => setPremovesEnabled(!premovesEnabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${premovesEnabled ? "bg-primary-500" : "bg-zinc-700"}`}>
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${premovesEnabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* Blindfold */}
                    <button onClick={() => uiStore.setBlindfold(!blindfold)}
                      className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                        blindfold ? "bg-red-500/20 border-red-500 text-red-400" : "bg-surface-100 border-white/5 text-slate-300 hover:text-white"
                      }`}>
                      <EyeOff className="w-4 h-4" />
                      {blindfold ? "Disable Blindfold" : "Blindfold Mode"}
                    </button>

                    {/* Start */}
                    <button onClick={() => startLocalGame()}
                      className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-colors flex items-center justify-center gap-2">
                      <Play className="w-4 h-4" /> Start Game
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── IN-GAME CONTROLS ──────────────────────────────────────── */}
            {game && isGameActive && (
              <div className="glass-card border border-white/10 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-sm">Active Match</h4>
                  {gameMode !== "normal" && (
                    <span className="text-[10px] font-bold text-accent-400 bg-accent-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {gameMode}
                    </span>
                  )}
                </div>

                {/* Three-check counters */}
                {gameMode === "threecheck" && (
                  <div className="flex justify-between items-center text-xs p-3 bg-surface-100 rounded-xl border border-white/5">
                    <span className="font-semibold text-slate-400">Checks:</span>
                    <span className="font-bold text-white">
                      ♔ {threeCheckCounts.white}/3 &nbsp;|&nbsp; ♚ {threeCheckCounts.black}/3
                    </span>
                  </div>
                )}

                {/* Move list */}
                <div className="bg-surface-100/50 border border-white/5 rounded-xl p-3 h-28 overflow-y-auto text-xs space-y-1 font-mono">
                  {gameHistory.length === 0 ? (
                    <div className="text-slate-500 text-center py-6">No moves yet</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-y-1 text-slate-400">
                      {gameHistory.map((mv, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-slate-600">{Math.floor(idx / 2) + 1}.</span>
                          <span className={idx % 2 === 0 ? "text-white font-semibold" : ""}>{mv}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Flip board (mid-game) */}
                <button onClick={() => setIsFlipped((f) => !f)}
                  className="w-full py-2 flex items-center justify-center gap-2 bg-surface-100 border border-white/8 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors">
                  <FlipVertical className="w-3.5 h-3.5" /> Flip Board
                </button>

                {/* Draw offer */}
                {!drawOffered ? (
                  <button onClick={() => {
                    setDrawOffered(true);

                    setTimeout(() => setDrawOffered(false), 8000);
                  }}
                  className="w-full py-2.5 flex items-center justify-center gap-2 bg-surface-200 border border-white/10 text-slate-300 hover:text-white hover:bg-surface-300 rounded-xl text-xs font-semibold transition-colors">
                    <Handshake className="w-3.5 h-3.5" /> Offer Draw
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleGameOver("draw", "Agreement")}
                      className="flex-1 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-bold">
                      Accept Draw
                    </button>
                    <button onClick={() => setDrawOffered(false)}
                      className="flex-1 py-2 bg-surface-200 border border-white/10 text-slate-400 rounded-xl text-xs font-bold">
                      Decline
                    </button>
                  </div>
                )}

                {/* Resign / New game */}
                <div className="flex gap-2">
                  {!showResignConfirm ? (
                    <button onClick={() => setShowResignConfirm(true)}
                      className="flex-1 py-2.5 bg-red-950/40 border border-red-500/20 hover:bg-red-900/40 text-red-400 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5">
                      <Flag className="w-3.5 h-3.5" /> Resign
                    </button>
                  ) : (
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="text-[10px] text-center text-slate-400 font-semibold">Confirm resignation?</div>
                      <div className="flex gap-2">
                        <button onClick={() => handleGameOver(playerColor === "white" ? "black" : "white", "Resignation")}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-[10px]">
                          Yes, Resign
                        </button>
                        <button onClick={() => setShowResignConfirm(false)}
                          className="flex-1 py-2 bg-surface-200 border border-white/5 text-slate-400 rounded-xl text-[10px]">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  <button onClick={() => startLocalGame()}
                    title="New Game"
                    className="py-2.5 px-4 bg-surface-200 border border-white/5 text-slate-300 rounded-xl hover:bg-surface-300 transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Game over banner */}
            {gameStatusText && (
              <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 space-y-3">
                <div className="flex gap-3 items-center">
                  <Award className="w-5 h-5 text-primary-400 shrink-0" />
                  <span className="text-sm font-semibold text-white">{gameStatusText}</span>
                </div>
                <button onClick={() => startLocalGame()}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                  <Play className="w-3.5 h-3.5" /> Play Again
                </button>
              </div>
            )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>


    </div>
  );
}
