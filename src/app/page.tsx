"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Chessboard } from "react-chessboard";
import { 
  Flame, 
  Target, 
  Zap, 
  Bot, 
  History, 
  ChevronRight, 
  Link2, 
  Trophy, 
  Activity, 
  Database, 
  RefreshCw,
  Award,
  Play,
  User,
  Users,
  Shield,
  GraduationCap,
  Puzzle,
  Swords,
  TrendingUp,
  Settings
} from "lucide-react";
import { useGameStore, gameStore } from "@/store/gameStore";
import { fetchChesscomProfile, fetchChesscomGames, fetchLichessProfile, fetchLichessGames } from "@/lib/network/externalApis";

export default function Home() {
  const router = useRouter();
  const store = useGameStore();
  const {
    chesscomConnected,
    lichessConnected,
    chesscomData,
    lichessData,
    importedGames
  } = store;

  const [username, setUsername] = useState<string | null>(null);
  const [chesscomInput, setChesscomInput] = useState("");
  const [lichessInput, setLichessInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("username");
      if (!storedUser) {
        router.push("/auth/signin");
      } else {
        setUsername(storedUser);
      }
    }
  }, [router]);

  useEffect(() => {
    if (chesscomConnected && chesscomData) {
      setChesscomInput(chesscomData.username);
    }
    if (lichessConnected && lichessData) {
      setLichessInput(lichessData.username);
    }
  }, [chesscomConnected, chesscomData, lichessConnected, lichessData]);

  const handleSaveAndSync = async () => {
    if (!chesscomInput.trim() && !lichessInput.trim()) {
      alert("Please enter a Chess.com or Lichess username.");
      return;
    }
    setIsSyncing(true);
    try {
      if (chesscomInput.trim() && chesscomInput !== chesscomData?.username) {
        const profile = await fetchChesscomProfile(chesscomInput);
        const games = await fetchChesscomGames(chesscomInput);
        gameStore.connectPlatform("chesscom", profile.username, profile, games);
      }
      if (lichessInput.trim() && lichessInput !== lichessData?.username) {
        const profile = await fetchLichessProfile(lichessInput);
        const games = await fetchLichessGames(lichessInput);
        gameStore.connectPlatform("lichess", profile.username, profile, games);
      }
      alert("Ratings and profile sync complete!");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to sync profiles.");
    } finally {
      setIsSyncing(false);
    }
  };

  const [memberSince, setMemberSince] = useState("June 2026");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const regDate = localStorage.getItem("registration_date");
      if (regDate) {
        setMemberSince(regDate);
      }
    }
  }, []);

  // Derive ratings from connected data
  const rapidRating = chesscomConnected 
    ? (chesscomData?.rapid || "---") 
    : (lichessConnected ? (lichessData?.rapid || "---") : "---");

  const puzzlesRating = typeof window !== "undefined" 
    ? (localStorage.getItem("puzzle_rating") || "---") 
    : "---";

  const avgAccuracy = importedGames.length > 0 
    ? Math.round(importedGames.reduce((sum, g) => sum + (g.accuracy || 0), 0) / importedGames.length)
    : 0;

  const accuracyVal = avgAccuracy > 0 ? `${avgAccuracy}%` : "0%";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* ── Main Two Column Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 cols): Actions, Profile Info, Match Stream */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Chess.com Style User Profile Widget */}
          <div className="bg-surface-100 border border-surface-300 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 shadow-2xl animate-fade-in-up">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-5 relative z-10">
              {/* Avatar circle */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-green-600 flex items-center justify-center font-black text-white text-3xl uppercase shrink-0 border-2 border-surface-300 shadow-lg">
                {username ? username[0] : "P"}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-white tracking-tight">{username || "Player"}</h1>
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8ae43c] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8ae43c]"></span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <span className="px-2 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/25 font-bold uppercase text-[9px] tracking-wider">
                    Diamond Member
                  </span>
                  <span>·</span>
                  <span className="font-bold">Member since {memberSince}</span>
                </div>
                
                {/* Milestone Progress Bar */}
                <div className="pt-2 w-64 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>Rank Progress: {rapidRating !== "---" ? rapidRating : "1200"} ELO</span>
                    <span>Goal: 1600 ELO</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-50 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-green-400 rounded-full" 
                      style={{ width: rapidRating !== "---" ? `${Math.min(100, (Number(rapidRating) / 1600) * 100)}%` : "75%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Summary Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 relative z-10 md:self-center">
              {/* ELO Rating Badge: Rapid */}
              <div className="bg-surface-50 border border-surface-300 rounded-xl px-4 py-2.5 flex flex-col items-center">
                <Target className="w-4 h-4 text-primary-400 mb-1" />
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rapid</span>
                <span className="text-sm font-black text-white mt-0.5">{rapidRating}</span>
              </div>

              {/* ELO Rating Badge: Blitz */}
              <div className="bg-surface-50 border border-surface-300 rounded-xl px-4 py-2.5 flex flex-col items-center">
                <Flame className="w-4 h-4 text-orange-400 mb-1" />
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Blitz</span>
                <span className="text-sm font-black text-white mt-0.5">1520</span>
              </div>

              {/* ELO Rating Badge: Bullet */}
              <div className="bg-surface-50 border border-surface-300 rounded-xl px-4 py-2.5 flex flex-col items-center">
                <Zap className="w-4 h-4 text-yellow-400 mb-1" />
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Bullet</span>
                <span className="text-sm font-black text-white mt-0.5">1480</span>
              </div>

              {/* ELO Rating Badge: Puzzles */}
              <div className="bg-surface-50 border border-surface-300 rounded-xl px-4 py-2.5 flex flex-col items-center">
                <Puzzle className="w-4 h-4 text-blue-400 mb-1" />
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Puzzles</span>
                <span className="text-sm font-black text-white mt-0.5">{puzzlesRating}</span>
              </div>
            </div>
          </div>

          {/* Action Grid (Chess.com style Play/Practice Blocks) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Play Online card */}
            <div 
              onClick={() => router.push("/play")}
              className="bg-gradient-to-br from-[#81b64c] to-[#689439] hover:from-[#91c65c] hover:to-[#78a541] rounded-2xl p-5 shadow-lg relative overflow-hidden group cursor-pointer transition-all duration-300 transform hover:scale-[1.01] animate-fade-in-up delay-75"
            >
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
                <Swords className="w-36 h-36 text-white" />
              </div>
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Swords className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Play Online</h3>
                  <p className="text-white/80 text-[11px] font-bold leading-normal">Play against chess players at your rating level in standard time controls.</p>
                  <span className="text-[9px] font-black uppercase bg-white/20 px-2 py-0.5 rounded text-white inline-block mt-2 tracking-wider">
                    12,504 Active Games
                  </span>
                </div>
              </div>
            </div>

            {/* Play Computer / Bots card */}
            <div 
              onClick={() => router.push("/bots")}
              className="bg-surface-100 hover:bg-surface-200 border border-surface-300 hover:border-white/20 rounded-2xl p-5 relative overflow-hidden group cursor-pointer transition-all duration-300 transform hover:scale-[1.01] animate-fade-in-up delay-100"
            >
              <div className="absolute right-0 bottom-0 opacity-5 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
                <Bot className="w-36 h-36 text-white" />
              </div>
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Play Computer</h3>
                  <p className="text-slate-400 text-[11px] leading-normal font-bold">Challenge custom chess personalities, bots, and adaptive engine levels.</p>
                  <span className="text-[9px] font-black uppercase bg-[#8a33fe]/10 border border-[#8a33fe]/20 px-2 py-0.5 rounded text-purple-400 inline-block mt-2 tracking-wider">
                    25 Personalities Live
                  </span>
                </div>
              </div>
            </div>

            {/* Puzzles card */}
            <div 
              onClick={() => router.push("/puzzles")}
              className="bg-surface-100 hover:bg-surface-200 border border-surface-300 hover:border-white/20 rounded-2xl p-5 relative overflow-hidden group cursor-pointer transition-all duration-300 transform hover:scale-[1.01] animate-fade-in-up delay-150"
            >
              <div className="absolute right-0 bottom-0 opacity-5 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
                <Puzzle className="w-36 h-36 text-white" />
              </div>
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Puzzle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Puzzles & Tactics</h3>
                  <p className="text-slate-400 text-[11px] leading-normal font-bold">Improve calculation, tactical vision, and study custom chess scenarios.</p>
                  <span className="text-[9px] font-black uppercase bg-[#2563eb]/10 border border-[#2563eb]/20 px-2 py-0.5 rounded text-blue-400 inline-block mt-2 tracking-wider">
                    Your Rating: {puzzlesRating}
                  </span>
                </div>
              </div>
            </div>

            {/* Courses / Academy card */}
            <div 
              onClick={() => router.push("/academy")}
              className="bg-surface-100 hover:bg-surface-200 border border-surface-300 hover:border-white/20 rounded-2xl p-5 relative overflow-hidden group cursor-pointer transition-all duration-300 transform hover:scale-[1.01] animate-fade-in-up delay-200"
            >
              <div className="absolute right-0 bottom-0 opacity-5 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-36 h-36 text-white" />
              </div>
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Courses & Academy</h3>
                  <p className="text-slate-400 text-[11px] leading-normal font-bold">Study classic opening theories, endgames, and get interactive hints.</p>
                  <span className="text-[9px] font-black uppercase bg-[#d97706]/10 border border-[#d97706]/20 px-2 py-0.5 rounded text-amber-400 inline-block mt-2 tracking-wider">
                    5 Modules Open
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Game Archive Stream Card */}
          <div className="bg-surface-100 border border-surface-300 rounded-3xl p-6 space-y-4 shadow-xl animate-fade-in-up delay-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-white">Completed Games</h3>
                <p className="text-slate-500 text-[10px] font-bold mt-0.5">Your recently synced matches and performance data.</p>
              </div>
              {importedGames.length > 0 && (
                <button
                  onClick={() => router.push("/analysis")}
                  className="px-3.5 py-1.5 bg-surface-50 border border-surface-300 hover:border-white/20 rounded-xl text-slate-400 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                >
                  View Game Archive
                </button>
              )}
            </div>

            {importedGames.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-bold bg-[#0d100d]/30 border border-white/5 rounded-2xl select-none">
                No recent matches synced. Use the side sync panel to link accounts!
              </div>
            ) : (
              <div className="space-y-2.5">
                {importedGames.slice(0, 4).map((g) => {
                  const isWin = g.result === "win";
                  const isLoss = g.result === "loss";
                  const borderCol = isWin ? "border-l-[#8ae43c]" : isLoss ? "border-l-red-500" : "border-l-slate-500";
                  const badgeCol = isWin ? "bg-green-500/10 text-green-400 border-green-500/20" : isLoss ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20";
                  
                  return (
                    <div 
                      key={g.id} 
                      onClick={() => router.push(`/analysis?gameId=${g.id}`)}
                      className={`p-4 bg-surface-50/60 hover:bg-surface-100 border border-surface-300 border-l-4 ${borderCol} rounded-xl flex justify-between items-center transition-all cursor-pointer hover:border-white/10`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Piece Color Icon */}
                        <div className="w-8 h-8 rounded-lg bg-surface-200 border border-white/5 flex items-center justify-center font-black text-slate-300 text-lg select-none">
                          {g.color === "white" ? "♔" : "♚"}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            vs {g.opponent}
                            <span className="text-[9px] text-slate-500 font-bold">({g.opponentRating})</span>
                          </div>
                          <div className="text-[9px] text-slate-500 font-bold mt-0.5">
                            Played {g.date} · Synced via {chesscomConnected && g.opponentRating ? "Chess.com" : "Lichess"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-black tracking-wider border ${badgeCol}`}>
                          {g.result}
                        </span>
                        {g.accuracy !== undefined && (
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-primary-400 font-black tracking-tight">{g.accuracy}%</span>
                            <span className="text-[8px] text-slate-600 block font-bold">accuracy</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Daily Puzzle & Sync Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Daily Puzzle Widget */}
          <div className="bg-surface-100 border border-surface-300 rounded-3xl p-6 space-y-4 shadow-xl animate-fade-in-up delay-150">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">Daily Puzzle</h3>
              <span className="px-2 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/20 text-[8px] uppercase tracking-wider font-black">
                Tactics
              </span>
            </div>
            
            <div className="aspect-square w-full relative rounded-2xl overflow-hidden border border-surface-300 shadow-lg bg-surface-100 flex items-center justify-center">
              <Chessboard
                options={{
                  position: "r3kb1r/pp2b1pp/3pp3/6q1/P2QPNN1/2N5/BP2N2P/R1B2K2 w - - 0 1",
                  boardOrientation: "white",
                  allowDragging: false,
                  darkSquareStyle: { backgroundColor: "#769656" },
                  lightSquareStyle: { backgroundColor: "#eeeed2" },
                }}
              />
            </div>

            <div className="text-center space-y-0.5">
              <div className="text-xs font-black text-white">White to move and win</div>
              <div className="text-[10px] text-slate-500 font-bold">Rating: ~1903 (Positional Tactics)</div>
            </div>

            <button
              onClick={() => router.push("/puzzles")}
              className="w-full py-3 bg-[#81b64c] hover:bg-[#91c65c] text-white rounded-xl text-xs font-black transition-all btn-press shadow-lg shadow-primary-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Solve Daily Puzzle
            </button>
          </div>

          {/* Connected Accounts Card */}
          <div className="bg-surface-100 border border-surface-300 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in-up delay-300">
            <div className="flex items-center gap-2 pb-1 border-b border-white/5">
              <Database className="w-4 h-4 text-primary-400" />
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Sync Game Profiles</h3>
                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">Import your real ELO ratings instantly.</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Chess.com */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Chess.com Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={chesscomInput}
                    onChange={(e) => setChesscomInput(e.target.value)}
                    placeholder="e.g. Hikaru"
                    className="w-full bg-surface-50 border border-surface-300 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  {chesscomConnected && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-[#8ae43c] bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Lichess */}
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Lichess Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={lichessInput}
                    onChange={(e) => setLichessInput(e.target.value)}
                    placeholder="e.g. thibault"
                    className="w-full bg-surface-50 border border-surface-300 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  {lichessConnected && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-[#8ae43c] bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveAndSync}
              disabled={isSyncing}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all btn-press cursor-pointer flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              Sync Ratings
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
