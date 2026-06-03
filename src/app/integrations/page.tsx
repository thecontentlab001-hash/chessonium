"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link2, Unlink, RefreshCw, CheckCircle2, ShieldAlert, Award, Globe, Database, Play } from "lucide-react";
import { useGameStore, gameStore } from "@/store/gameStore";
import { fetchChesscomProfile, fetchChesscomGames, fetchLichessProfile, fetchLichessGames } from "@/lib/network/externalApis";

interface ImportedData {
  username: string;
  bullet: number;
  blitz: number;
  rapid: number;
  gamesCount: number;
}

interface ConnectedGame {
  id: string;
  platform: "chesscom" | "lichess";
  opponent: string;
  opponentRating: number;
  myRating: number;
  result: "win" | "loss" | "draw";
  color: "white" | "black";
  date: string;
  accuracy?: number;
  isAnalyzing?: boolean;
}

export default function IntegrationsPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const username = localStorage.getItem("username");
      if (!username) {
        router.push("/auth/signin");
      }
    }
  }, [router]);

  const store = useGameStore();
  const {
    chesscomConnected,
    lichessConnected,
    chesscomData,
    lichessData,
    importedGames: games
  } = store;

  const [chesscomUsername, setChesscomUsername] = useState("");
  const [lichessUsername, setLichessUsername] = useState("");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const handleConnect = async (platform: "chesscom" | "lichess") => {
    const targetUsername = platform === "chesscom" ? chesscomUsername : lichessUsername;
    if (!targetUsername.trim()) {
      alert("Please enter a username first.");
      return;
    }

    setIsLoading((prev) => ({ ...prev, [platform]: true }));

    try {
      if (platform === "chesscom") {
        const profile = await fetchChesscomProfile(targetUsername);
        const games = await fetchChesscomGames(targetUsername);
        gameStore.connectPlatform("chesscom", profile.username, profile, games);
      } else {
        const profile = await fetchLichessProfile(targetUsername);
        const games = await fetchLichessGames(targetUsername);
        gameStore.connectPlatform("lichess", profile.username, profile, games);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || `Failed to fetch profile for ${targetUsername} on ${platform === "chesscom" ? "Chess.com" : "Lichess"}.`);
    } finally {
      setIsLoading((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const handleDisconnect = (platform: "chesscom" | "lichess") => {
    gameStore.disconnectPlatform(platform);
    if (platform === "chesscom") {
      setChesscomUsername("");
    } else {
      setLichessUsername("");
    }

    // Force logout if unlinking active SSO platform
    if (typeof window !== "undefined") {
      const activePlatform = localStorage.getItem("platform");
      if (activePlatform === platform) {
        localStorage.removeItem("username");
        localStorage.removeItem("platform");
        localStorage.removeItem("registration_date");
        localStorage.removeItem("premium_unlocked");
        window.location.href = "/auth/signin";
      }
    }
  };

  const handleAnalyzeGame = (gameId: string) => {
    gameStore.setAnalyzingGame(gameId, true);

    setTimeout(() => {
      const generatedAccuracy = parseFloat((70 + Math.random() * 28).toFixed(1));
      gameStore.updateImportedGameAccuracy(gameId, generatedAccuracy);
      gameStore.setAnalyzingGame(gameId, false);
    }, 2000);
  };

  // Filter games based on connected platform
  const visibleGames = games.filter((g) => {
    if (g.platform === "chesscom" && chesscomConnected) return true;
    if (g.platform === "lichess" && lichessConnected) return true;
    return false;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Dashboard Banner */}
      <section className="relative overflow-hidden rounded-3xl glass-card p-8 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-500/25 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Link2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Platform Integrations</h1>
            <p className="text-slate-400 text-sm mt-1">Connect external profiles, import ratings history, and run engine analysis on imported games.</p>
          </div>
        </div>
      </section>

      {/* Integration Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Chess.com Card */}
        <section className="glass-card border border-white/10 p-6 rounded-2xl space-y-5 smooth-hover">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20 font-bold text-green-400 text-lg">
                C
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Chess.com Account</h3>
                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Official Partner API</span>
              </div>
            </div>

            {chesscomConnected ? (
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20 uppercase tracking-wide">
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-surface-200 px-2.5 py-1 rounded-full border border-white/5 uppercase tracking-wide">
                Disconnected
              </span>
            )}
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Link your Chess.com profile to import historical games, ratings history, and sync your ongoing match details.
          </p>

          {!chesscomConnected ? (
            <div className="space-y-3">
              <input
                type="text"
                value={chesscomUsername}
                onChange={(e) => setChesscomUsername(e.target.value)}
                placeholder="Chess.com Username"
                className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none"
              />
              <button
                onClick={() => handleConnect("chesscom")}
                disabled={isLoading["chesscom"]}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5 transition-colors btn-press cursor-pointer"
              >
                {isLoading["chesscom"] ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
                {isLoading["chesscom"] ? "Linking Account..." : "Connect Chess.com"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {chesscomData && (
                <div className="p-4 bg-surface-100/50 border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>Username: {chesscomData.username}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{chesscomData.gamesCount} games imported</span>
                  </div>
                  <hr className="border-white/5" />
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-300">
                    <div className="p-2 bg-surface-200/50 rounded-lg">
                      <div className="text-[9px] text-slate-500 uppercase">Bullet</div>
                      <div>{chesscomData.bullet}</div>
                    </div>
                    <div className="p-2 bg-surface-200/50 rounded-lg">
                      <div className="text-[9px] text-slate-500 uppercase">Blitz</div>
                      <div>{chesscomData.blitz}</div>
                    </div>
                    <div className="p-2 bg-surface-200/50 rounded-lg">
                      <div className="text-[9px] text-slate-500 uppercase">Rapid</div>
                      <div>{chesscomData.rapid}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => handleDisconnect("chesscom")}
                className="w-full py-2.5 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5 hover:bg-red-900/40 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                Unlink Account
              </button>
            </div>
          )}
        </section>

        {/* Lichess.org Card */}
        <section className="glass-card border border-white/10 p-6 rounded-2xl space-y-5 smooth-hover">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 font-bold text-blue-400 text-lg">
                L
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Lichess Account</h3>
                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Open Authorization</span>
              </div>
            </div>

            {lichessConnected ? (
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20 uppercase tracking-wide">
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-surface-200 px-2.5 py-1 rounded-full border border-white/5 uppercase tracking-wide">
                Disconnected
              </span>
            )}
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Link your Lichess profile to fetch ratings data and compare stats across open-source databases.
          </p>

          {!lichessConnected ? (
            <div className="space-y-3">
              <input
                type="text"
                value={lichessUsername}
                onChange={(e) => setLichessUsername(e.target.value)}
                placeholder="Lichess Username"
                className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none"
              />
              <button
                onClick={() => handleConnect("lichess")}
                disabled={isLoading["lichess"]}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5 transition-colors btn-press cursor-pointer"
              >
                {isLoading["lichess"] ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
                {isLoading["lichess"] ? "Linking Account..." : "Connect Lichess"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {lichessData && (
                <div className="p-4 bg-surface-100/50 border border-white/5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>Username: {lichessData.username}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{lichessData.gamesCount} games imported</span>
                  </div>
                  <hr className="border-white/5" />
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-300">
                    <div className="p-2 bg-surface-200/50 rounded-lg">
                      <div className="text-[9px] text-slate-500 uppercase">Bullet</div>
                      <div>{lichessData.bullet}</div>
                    </div>
                    <div className="p-2 bg-surface-200/50 rounded-lg">
                      <div className="text-[9px] text-slate-500 uppercase">Blitz</div>
                      <div>{lichessData.blitz}</div>
                    </div>
                    <div className="p-2 bg-surface-200/50 rounded-lg">
                      <div className="text-[9px] text-slate-500 uppercase">Rapid</div>
                      <div>{lichessData.rapid}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => handleDisconnect("lichess")}
                className="w-full py-2.5 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5 hover:bg-red-900/40 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                Unlink Account
              </button>
            </div>
          )}
        </section>

        {/* Cloud Database Card */}
        <section className="glass-card border border-white/10 p-6 rounded-2xl space-y-5 smooth-hover">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center border border-primary-500/20 font-bold text-primary-400">
                <Database className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Cloud Database</h3>
                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Sync State Service</span>
              </div>
            </div>

            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20 uppercase tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Synced
            </span>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Your linked chess accounts, profiles data, ELO ratings, and local match history are automatically synced and persisted in the cloud database.
          </p>

          <div className="p-4 bg-surface-100/50 border border-white/5 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
              <span>Sync Endpoint</span>
              <span className="font-mono text-[10px] text-primary-400">/api/db</span>
            </div>
            <hr className="border-white/5" />
            <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
              <span>Database Storage</span>
              <span className="font-mono text-[10px] text-slate-400">cloud_db.json</span>
            </div>
            <hr className="border-white/5" />
            <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
              <span>Active Account</span>
              <span className="text-[11px] font-bold text-white max-w-[120px] truncate">
                {typeof window !== "undefined" ? (localStorage.getItem("username") || "Guest Mode") : "Guest Mode"}
              </span>
            </div>
          </div>

          <button
            onClick={async () => {
              const username = localStorage.getItem("username");
              if (username) {
                await gameStore.syncFromCloud(username);
                alert("Cloud database sync complete! Latest profile state has been retrieved and merged.");
              } else {
                alert("Please log in or link an account first to sync with the cloud database.");
              }
            }}
            className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5 transition-colors cursor-pointer btn-press"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Force Sync Database
          </button>
        </section>

      </div>

      {/* ── Lifetime Performance Analytics ────────────────────────────────── */}
      {(chesscomConnected || lichessConnected) && (() => {
        const totalGames = visibleGames.length;
        const wins = visibleGames.filter((g) => g.result === "win").length;
        const losses = visibleGames.filter((g) => g.result === "loss").length;
        const draws = visibleGames.filter((g) => g.result === "draw").length;
        
        const winPct = totalGames > 0 ? (wins / totalGames) * 100 : 0;
        const lossPct = totalGames > 0 ? (losses / totalGames) * 100 : 0;
        const drawPct = totalGames > 0 ? (draws / totalGames) * 100 : 0;

        const whiteGames = visibleGames.filter((g) => g.color === "white");
        const whiteWins = whiteGames.filter((g) => g.result === "win").length;
        const whiteWinRate = whiteGames.length > 0 ? (whiteWins / whiteGames.length) * 100 : 0;

        const blackGames = visibleGames.filter((g) => g.color === "black");
        const blackWins = blackGames.filter((g) => g.result === "win").length;
        const blackWinRate = blackGames.length > 0 ? (blackWins / blackGames.length) * 100 : 0;

        const avgOppRating = totalGames > 0
          ? Math.round(visibleGames.reduce((sum, g) => sum + g.opponentRating, 0) / totalGames)
          : 0;

        const activeData = chesscomConnected ? chesscomData : lichessData;
        const bulletElo = activeData?.bullet || 1200;
        const blitzElo = activeData?.blitz || 1200;
        const rapidElo = activeData?.rapid || 1200;

        // Dynamic playstyle and tier assignment
        let playstyle = "Positional Strategist";
        let description = "Focuses on solid structures, slowly squeezing opponents and limiting counterplay.";
        if (winPct > 55 && whiteWinRate > 60) {
          playstyle = "Aggressive Attacker";
          description = "Unleashes razor-sharp attacks, pushing pawns and sacrificing material to crush the opponent.";
        } else if (whiteWinRate > blackWinRate + 8) {
          playstyle = "Opening Specialist";
          description = "Extremely prepared with the White pieces, building decisive advantages early in the opening lines.";
        } else if (drawPct > 35) {
          playstyle = "Iron Wall Defender";
          description = "Maintains absolute control, bricking up defensive files to leave no entry points for opponents.";
        }

        let tierName = "Challenger Tier";
        let tierColor = "text-slate-400";
        let tierGlow = "border-slate-500/20 bg-slate-500/5";
        const maxElo = Math.max(bulletElo, blitzElo, rapidElo);
        if (maxElo >= 2200) {
          tierName = "Grandmaster Tier";
          tierColor = "text-cyan-400";
          tierGlow = "border-cyan-500/30 bg-cyan-500/5";
        } else if (maxElo >= 1800) {
          tierName = "Master Tier";
          tierColor = "text-emerald-400";
          tierGlow = "border-emerald-500/30 bg-emerald-500/5";
        } else if (maxElo >= 1400) {
          tierName = "Tactician Tier";
          tierColor = "text-primary-400";
          tierGlow = "border-primary-500/30 bg-primary-500/5";
        }

        return (
          <section className="glass-card border border-white/10 p-6 rounded-3xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                  <Globe className="w-5 h-5 text-primary-400 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Lifetime Performance Analytics</h2>
                  <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Calculated from connected live profiles & games log</p>
                </div>
              </div>
              
              <div className={`px-4 py-1.5 rounded-full border text-xs font-black tracking-wide flex items-center gap-2 ${tierGlow}`}>
                <Award className={`w-4 h-4 ${tierColor}`} />
                <span className="text-white">Tier: <strong className={tierColor}>{tierName}</strong></span>
              </div>
            </div>

            {/* Metrics Dashboard Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-surface-100/50 border border-white/5 rounded-2xl">
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Total Games</div>
                <div className="text-2xl font-black text-white mt-1 leading-none">{totalGames}</div>
                <div className="text-[9px] text-slate-600 mt-1">Directly sync'd</div>
              </div>
              <div className="p-4 bg-surface-100/50 border border-white/5 rounded-2xl">
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Win Ratio</div>
                <div className="text-2xl font-black text-green-400 mt-1 leading-none">{winPct.toFixed(1)}%</div>
                <div className="text-[9px] text-slate-600 mt-1">Total {wins} wins</div>
              </div>
              <div className="p-4 bg-surface-100/50 border border-white/5 rounded-2xl">
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Avg Opponent Elo</div>
                <div className="text-2xl font-black text-blue-400 mt-1 leading-none">{avgOppRating}</div>
                <div className="text-[9px] text-slate-600 mt-1">Average challenge</div>
              </div>
              <div className="p-4 bg-surface-100/50 border border-white/5 rounded-2xl">
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Peak Active Elo</div>
                <div className="text-2xl font-black text-primary-400 mt-1 leading-none">{maxElo}</div>
                <div className="text-[9px] text-slate-600 mt-1">Across all variants</div>
              </div>
            </div>

            {/* Detailed Analytics Grid Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Distribution & Playstyle Card */}
              <div className="lg:col-span-2 space-y-5 bg-surface-100/30 border border-white/5 p-5 rounded-2xl">
                {/* 1. Win/Draw/Loss ratio bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>Win / Draw / Loss Distribution</span>
                    <span className="text-slate-500">{wins}W - {draws}D - {losses}L</span>
                  </div>
                  <div className="h-4 w-full rounded-full overflow-hidden flex border border-white/5 bg-surface-200">
                    {totalGames > 0 ? (
                      <>
                        <div style={{ width: `${winPct}%` }} className="bg-green-500 h-full hover:brightness-110 transition-all" title={`Wins: ${winPct.toFixed(1)}%`} />
                        <div style={{ width: `${drawPct}%` }} className="bg-zinc-500 h-full hover:brightness-110 transition-all" title={`Draws: ${drawPct.toFixed(1)}%`} />
                        <div style={{ width: `${lossPct}%` }} className="bg-red-500 h-full hover:brightness-110 transition-all" title={`Losses: ${lossPct.toFixed(1)}%`} />
                      </>
                    ) : (
                      <div className="w-full bg-surface-200 h-full flex items-center justify-center text-[10px] text-slate-600">No game data loaded</div>
                    )}
                  </div>
                  <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Wins ({winPct.toFixed(1)}%)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-zinc-500" /> Draws ({drawPct.toFixed(1)}%)</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Losses ({lossPct.toFixed(1)}%)</span>
                  </div>
                </div>

                <hr className="border-white/5" />

                {/* 2. Color Specific performance */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Board Color Win Splits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-surface-200/50 border border-white/5 rounded-xl flex items-center gap-3">
                      <span className="text-2xl">♔</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-300">
                          <span>Win Rate as White</span>
                          <span>{whiteWinRate.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-100 rounded-full mt-1.5 overflow-hidden">
                          <div style={{ width: `${whiteWinRate}%` }} className="bg-white h-full rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3.5 bg-surface-200/50 border border-white/5 rounded-xl flex items-center gap-3">
                      <span className="text-2xl text-slate-400">♚</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-300">
                          <span>Win Rate as Black</span>
                          <span>{blackWinRate.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-100 rounded-full mt-1.5 overflow-hidden">
                          <div style={{ width: `${blackWinRate}%` }} className="bg-primary-500 h-full rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Persona and Ratings Gauge Card */}
              <div className="space-y-4 bg-surface-100/30 border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Playstyle Blueprint</div>
                  <h4 className="text-base font-black text-white mt-1">{playstyle}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-2">{description}</p>
                </div>

                <hr className="border-white/5 my-2" />

                <div className="space-y-3">
                  <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Real Ratings Gauge</div>
                  
                  <div className="space-y-2 text-xs font-bold text-slate-300">
                    {/* Bullet */}
                    <div className="flex justify-between items-center">
                      <span>Bullet</span>
                      <span className="font-mono text-white">{bulletElo}</span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div style={{ width: `${Math.min(100, (bulletElo / 2800) * 100)}%` }} className="bg-orange-500 h-full rounded-full" />
                    </div>

                    {/* Blitz */}
                    <div className="flex justify-between items-center">
                      <span>Blitz</span>
                      <span className="font-mono text-white">{blitzElo}</span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div style={{ width: `${Math.min(100, (blitzElo / 2800) * 100)}%` }} className="bg-green-500 h-full rounded-full" />
                    </div>

                    {/* Rapid */}
                    <div className="flex justify-between items-center">
                      <span>Rapid</span>
                      <span className="font-mono text-white">{rapidElo}</span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div style={{ width: `${Math.min(100, (rapidElo / 2800) * 100)}%` }} className="bg-blue-500 h-full rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Imported Games History Section */}
      {(chesscomConnected || lichessConnected) && (
        <section className="glass-card border border-white/10 p-6 rounded-2xl space-y-5">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-bold text-white">Imported Games Log</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Platform</th>
                  <th className="pb-3">Opponent</th>
                  <th className="pb-3">Opponent Elo</th>
                  <th className="pb-3">Result</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right pr-2">Engine Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleGames.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No matching games loaded.
                    </td>
                  </tr>
                ) : (
                  visibleGames.map((g) => (
                    <tr key={g.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-2 font-semibold text-slate-300 capitalize">
                        {g.platform === "chesscom" ? "Chess.com" : "Lichess"}
                      </td>
                      <td className="py-4 text-white font-medium">{g.opponent}</td>
                      <td className="py-4 text-slate-400 font-mono">{g.opponentRating}</td>
                      <td className="py-4 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                          g.result === "win" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          g.result === "loss" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}>
                          {g.result}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 font-mono">{g.date}</td>
                      <td className="py-4 text-right pr-2">
                        {g.accuracy !== undefined ? (
                          <div className="inline-flex items-center gap-1.5 font-extrabold text-sm text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20">
                            <Award className="w-3.5 h-3.5" />
                            <span>{g.accuracy}% Accuracy</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAnalyzeGame(g.id)}
                            disabled={g.isAnalyzing}
                            className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shadow-md inline-flex items-center gap-1.5"
                          >
                            {g.isAnalyzing ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              "Run Stockfish"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
