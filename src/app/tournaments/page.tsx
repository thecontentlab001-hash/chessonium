"use client";

import React, { useState, useEffect } from "react";
import { seedTournaments, Tournament } from "@/lib/chess/tournaments";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Trophy, Clock, Users, ShieldAlert, Award, ArrowRight } from "lucide-react";

export default function TournamentsPage() {
  useAuthRedirect();
  const [tournaments, setTournaments] = useState<Tournament[]>(seedTournaments);
  const [activeTournament, setActiveTournament] = useState<Tournament>(seedTournaments[0]);

  // A ticking countdown for the hourly bullet arena and weekly blitz
  const [blitzTime, setBlitzTime] = useState(2700); // 45m
  const [bulletTime, setBulletTime] = useState(720);  // 12m

  useEffect(() => {
    const timer = setInterval(() => {
      setBlitzTime((prev) => (prev > 0 ? prev - 1 : 2700));
      setBulletTime((prev) => (prev > 0 ? prev - 1 : 720));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  const getTimerDisplay = (t: Tournament) => {
    if (t.id === "t_1") return formatTime(blitzTime);
    if (t.id === "t_2") return formatTime(bulletTime);
    return t.timeLeft;
  };

  const handleJoinTournament = (id: string) => {
    setTournaments((prev) => {
      const nextTournaments = prev.map((t) => {
        if (t.id === id) {
          const isRegistered = t.status === "active" ? t.standings.some(s => s.player === "You") : false;
          if (isRegistered) return t; // Already in

          // Mock join
          const updatedJoined = t.playersJoined + 1;
          const updatedStandings = t.status === "active" 
            ? [...t.standings, { rank: t.standings.length + 1, player: "You", rating: 1450, points: 0 }]
            : [];
          
          return {
            ...t,
            playersJoined: updatedJoined,
            standings: updatedStandings
          };
        }
        return t;
      });

      // Update active reference dynamically from the same transaction to avoid stale closures
      const fresh = nextTournaments.find((t) => t.id === id);
      if (fresh) {
        setActiveTournament(fresh);
      }

      return nextTournaments;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Dashboard Banner */}
      <section className="relative overflow-hidden rounded-3xl glass-card p-8 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-500/25 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Tournaments Arena</h1>
            <p className="text-slate-400 text-sm mt-1">Compete in official Swiss or Arena matches, climb the standings, and win cash prizes or digital rewards.</p>
          </div>
        </div>
      </section>

      {/* Main Grid Arena Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left/Center side: Active Tournaments Lists */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Live & Upcoming Tournaments
          </h3>

          <div className="space-y-4">
            {tournaments.map((t) => {
              const isJoined = t.standings.some((s) => s.player === "You");
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTournament(t)}
                  className={`glass-card border p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:border-white/20 transition-all ${
                    activeTournament.id === t.id
                      ? "border-primary-500 bg-primary-500/5 shadow-lg"
                      : "border-white/10 bg-surface-100/30"
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex gap-2 items-center">
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider border ${
                        t.type === "Swiss"
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                      }`}>
                        {t.type} Variation
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-white/5 uppercase">
                        Format: {t.timeControl}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-white">{t.name}</h4>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">Prize: {t.prizeSupport}</p>
                    </div>

                    <div className="flex gap-4 text-[10px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {t.playersJoined} Joined
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Time remaining: {getTimerDisplay(t)}
                      </span>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinTournament(t.id);
                      }}
                      disabled={isJoined}
                      className={`w-full md:w-32 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                        isJoined
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : "bg-primary-600 border-transparent text-white hover:bg-primary-500"
                      }`}
                    >
                      {isJoined ? "Registered" : "Join Tournament"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side: Standings Leaderboard for selected tournament */}
        {activeTournament.standings.length > 0 && (
          <section className="glass-card border border-white/10 p-5 rounded-2xl space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-primary-400" />
              Live Standings: {activeTournament.name}
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-400">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                    <th className="pb-2">Rank</th>
                    <th className="pb-2">Player</th>
                    <th className="pb-2">Elo</th>
                    <th className="pb-2 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeTournament.standings.map((player) => (
                    <tr key={player.player} className={player.player === "You" ? "text-primary-400" : ""}>
                      <td className="py-2.5 font-bold">{player.rank}</td>
                      <td className="py-2.5 font-semibold text-white">{player.player}</td>
                      <td className="py-2.5 font-mono">{player.rating}</td>
                      <td className="py-2.5 font-bold text-right text-white">{player.points.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
