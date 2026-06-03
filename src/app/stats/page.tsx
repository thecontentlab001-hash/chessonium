"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Award, Target, Activity, BarChart2,
  Zap, Clock, Crown, Flame, Shield, ChevronUp, ChevronDown,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";

// ── helpers ─────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getRatingColor(elo: number) {
  if (elo >= 2000) return "#f59e0b"; // gold
  if (elo >= 1500) return "#6366f1"; // violet
  if (elo >= 1200) return "#3b82f6"; // blue
  return "#64748b";                  // slate
}

function getRatingTitle(elo: number) {
  if (elo >= 2200) return "Master";
  if (elo >= 2000) return "Expert";
  if (elo >= 1800) return "Class A";
  if (elo >= 1600) return "Class B";
  if (elo >= 1400) return "Class C";
  if (elo >= 1200) return "Class D";
  return "Beginner";
}

// ── Mini SVG charts ──────────────────────────────────────────────────────────
function LineChart({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 300, H = 80;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 10) - 5;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `0,${H} ${polyline} ${W},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lgChart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#lgChart)" />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((_, i) => {
        const [x, y] = pts[i].split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

function DonutChart({ wins, draws, losses }: { wins: number; draws: number; losses: number }) {
  const total = wins + draws + losses || 1;
  const winPct  = (wins  / total) * 100;
  const drawPct = (draws / total) * 100;
  const lossPct = (losses / total) * 100;

  const R = 40, C = 50, stroke = 14;
  const circ = 2 * Math.PI * R;

  const segments = [
    { pct: winPct,  color: "#22c55e", label: "Win" },
    { pct: drawPct, color: "#f59e0b", label: "Draw" },
    { pct: lossPct, color: "#ef4444", label: "Loss" },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const len = (seg.pct / 100) * circ;
    const arc = { ...seg, len, offset };
    offset += len;
    return arc;
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
        <circle cx={C} cy={C} r={R} fill="none" stroke="#1e2028" strokeWidth={stroke} />
        {arcs.map((arc, i) => (
          <circle
            key={i} cx={C} cy={C} r={R}
            fill="none" stroke={arc.color} strokeWidth={stroke}
            strokeDasharray={`${arc.len} ${circ - arc.len}`}
            strokeDashoffset={-arc.offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        ))}
        <text x={C} y={C + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13" fontWeight="bold">
          {Math.round(winPct)}%
        </text>
        <text x={C} y={C + 13} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="6">
          Win rate
        </text>
      </svg>
      <div className="space-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-xs text-slate-400">{s.label}</span>
            <span className="text-xs font-bold text-white ml-auto pl-4">{Math.round(s.pct)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ bars }: { bars: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {bars.map((bar) => (
        <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold" style={{ color: bar.color }}>{bar.value}</span>
          <div className="w-full rounded-t-lg transition-all" style={{
            height: `${(bar.value / max) * 72}px`,
            background: `${bar.color}33`,
            border: `1px solid ${bar.color}66`,
          }} />
          <span className="text-[9px] text-slate-500 text-center leading-tight">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "#6366f1" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="glass-card border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const router = useRouter();
  const gameState = useGameStore();
  const [username, setUsername] = useState("Player");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!localStorage.getItem("username")) {
        router.push("/auth/signin");
        return;
      }
      setUsername(localStorage.getItem("username") || "Player");
    }
  }, [router]);

  // Compile stats from imported games + local match history
  const allGames = [
    ...gameState.importedGames.map((g) => ({
      result: g.result,
      accuracy: g.accuracy ?? null,
      date: g.date,
      opponent: g.opponent,
      rating: g.myRating,
      platform: g.platform,
    })),
    ...gameState.matchHistory.map((h) => ({
      result: h.result,
      accuracy: null,
      date: h.date,
      opponent: h.opponent,
      rating: gameState.userElo,
      platform: "local" as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const wins   = allGames.filter((g) => g.result === "win").length;
  const draws  = allGames.filter((g) => g.result === "draw").length;
  const losses = allGames.filter((g) => g.result === "loss").length;
  const total  = allGames.length;

  const accuracies = allGames.filter((g) => g.accuracy != null).map((g) => g.accuracy as number);
  const avgAccuracy = accuracies.length ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length) : null;

  // Rating trend (simulated from ELO + wins)
  const baseElo = gameState.userElo;
  const ratingHistory = [
    baseElo - 120, baseElo - 80, baseElo - 60, baseElo - 30,
    baseElo - 10, baseElo + 20, baseElo + 40, baseElo,
  ];

  // Win streak
  let streak = 0;
  for (const g of allGames) {
    if (g.result === "win") streak++;
    else break;
  }

  const ratingColor = getRatingColor(baseElo);
  const ratingTitle = getRatingTitle(baseElo);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Hero header */}
      <div className="glass-card border border-white/10 rounded-2xl p-6">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shadow-xl shrink-0">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{username}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="text-3xl font-black" style={{ color: ratingColor }}>{baseElo}</span>
              <span className="text-sm text-slate-400 font-semibold">{ratingTitle}</span>
              {streak > 1 && (
                <span className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  <Flame className="w-3 h-3" /> {streak} win streak
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">{total} games played total</p>
          </div>

          {/* Quick W/D/L badges */}
          <div className="flex gap-2 shrink-0">
            {[
              { v: wins,   label: "W", color: "#22c55e" },
              { v: draws,  label: "D", color: "#f59e0b" },
              { v: losses, label: "L", color: "#ef4444" },
            ].map(({ v, label, color }) => (
              <div key={label} className="text-center px-3 py-2 rounded-xl border" style={{ borderColor: `${color}30`, background: `${color}10` }}>
                <div className="text-lg font-black" style={{ color }}>{v}</div>
                <div className="text-[10px] font-bold text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp}  label="Current Rating" value={baseElo} sub={ratingTitle} color={ratingColor} />
        <StatCard icon={Target}      label="Accuracy"    value={avgAccuracy != null ? `${avgAccuracy}%` : "—"} sub="Average" color="#3b82f6" />
        <StatCard icon={Flame}       label="Win Streak"  value={streak} sub="Current" color="#f97316" />
        <StatCard icon={Activity}    label="Total Games"  value={total}  sub="All time" color="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Rating history */}
        <div className="md:col-span-2 glass-card border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-400" /> Rating History
            </h2>
            <span className="text-[10px] text-slate-500">Last 8 games</span>
          </div>
          <div className="h-20">
            <LineChart data={ratingHistory} color="#6366f1" />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>Older</span>
            <span>Recent</span>
          </div>
        </div>

        {/* Win/Draw/Loss donut */}
        <div className="glass-card border border-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary-400" /> Results
          </h2>
          <DonutChart wins={wins} draws={draws} losses={losses} />
        </div>
      </div>

      {/* Performance by time control */}
      <div className="glass-card border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-400" /> Performance by Time Control
        </h2>
        <BarChart bars={[
          { label: "Bullet\n(1 min)",  value: Math.round(wins * 0.3), color: "#ef4444" },
          { label: "Blitz\n(3 min)",   value: Math.round(wins * 0.5), color: "#f59e0b" },
          { label: "Blitz\n(5 min)",   value: Math.round(wins * 0.6), color: "#3b82f6" },
          { label: "Rapid\n(10 min)",  value: Math.round(wins * 0.7), color: "#22c55e" },
          { label: "Classical\n(30+)", value: Math.round(wins * 0.8), color: "#8b5cf6" },
        ]} />
      </div>

      {/* Recent games */}
      <div className="glass-card border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary-400" /> Recent Games
        </h2>
        {allGames.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No games yet. Play some games to see your stats!
          </div>
        ) : (
          <div className="space-y-2">
            {allGames.slice(0, 10).map((game, i) => {
              const resultColor = game.result === "win" ? "#22c55e" : game.result === "draw" ? "#f59e0b" : "#ef4444";
              const resultLabel = game.result === "win" ? "W" : game.result === "draw" ? "D" : "L";
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                    style={{ background: `${resultColor}20`, border: `1px solid ${resultColor}40`, color: resultColor }}
                  >
                    {resultLabel}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{game.opponent}</p>
                    <p className="text-[11px] text-slate-500">{formatDate(game.date)}</p>
                  </div>
                  {game.accuracy && (
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-white">{game.accuracy}%</p>
                      <p className="text-[10px] text-slate-500">accuracy</p>
                    </div>
                  )}
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400 capitalize">{game.platform}</p>
                    <p className="text-[10px] text-slate-600">{game.rating}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="glass-card border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-primary-400" /> Milestones
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "First Win",    icon: "🏆", earned: wins >= 1 },
            { label: "10 Wins",      icon: "⭐", earned: wins >= 10 },
            { label: "50 Games",     icon: "🎯", earned: total >= 50 },
            { label: "Rated 1600+",  icon: "👑", earned: baseElo >= 1600 },
            { label: "3 Win Streak", icon: "🔥", earned: streak >= 3 },
            { label: "First Draw",   icon: "🤝", earned: draws >= 1 },
            { label: "100 Games",    icon: "💎", earned: total >= 100 },
            { label: "Rated 1800+",  icon: "🌟", earned: baseElo >= 1800 },
          ].map((m) => (
            <div
              key={m.label}
              className={`p-3 rounded-xl border text-center transition-all ${
                m.earned
                  ? "bg-primary-500/10 border-primary-500/30"
                  : "bg-white/3 border-white/5 opacity-40"
              }`}
            >
              <div className="text-2xl mb-1">{m.icon}</div>
              <p className="text-[11px] font-semibold text-slate-300">{m.label}</p>
              {m.earned && <p className="text-[9px] text-primary-400 mt-0.5">Earned ✓</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
