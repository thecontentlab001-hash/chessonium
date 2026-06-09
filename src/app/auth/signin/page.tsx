"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Globe, RefreshCw, User, X, Shield, Zap, ChevronRight, Check } from "lucide-react";
import { fetchChesscomProfile, fetchChesscomGames, fetchLichessProfile, fetchLichessGames } from "@/lib/network/externalApis";
import { gameStore } from "@/store/gameStore";

// ── Chess board background squares ────────────────────────────────────────────
const FILES = ["a","b","c","d","e","f","g","h"];
const RANKS = [8,7,6,5,4,3,2,1];
const STARTING_PIECES: Record<string, string> = {
  a8:"♜",b8:"♞",c8:"♝",d8:"♛",e8:"♚",f8:"♝",g8:"♞",h8:"♜",
  a7:"♟",b7:"♟",c7:"♟",d7:"♟",e7:"♟",f7:"♟",g7:"♟",h7:"♟",
  a2:"♙",b2:"♙",c2:"♙",d2:"♙",e2:"♙",f2:"♙",g2:"♙",h2:"♙",
  a1:"♖",b1:"♘",c1:"♗",d1:"♕",e1:"♔",f1:"♗",g1:"♘",h1:"♖",
};

function MiniBoard() {
  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl glass-panel bg-black/40">
      <div className="grid grid-cols-8 w-full h-full opacity-60 select-none pointer-events-none">
        {RANKS.flatMap((rank) =>
          FILES.map((file) => {
            const sq  = `${file}${rank}`;
            const fileIdx = FILES.indexOf(file);
            const rankIdx = RANKS.indexOf(rank);
            const isLight = (fileIdx + rankIdx) % 2 === 0;
            const piece   = STARTING_PIECES[sq];
            return (
              <div
                key={sq}
                className={`flex items-center justify-center font-bold leading-none ${
                  isLight ? "bg-[#1c1d22]/65" : "bg-[#254636]/65"
                } border border-white/[0.02]`}
              >
                {piece && (
                  <span 
                    className={piece.match(/[♙♘♗♖♕♔]/) ? "text-green-300 drop-shadow-[0_0_6px_rgba(74,222,128,0.4)]" : "text-slate-400 drop-shadow-[0_0_6px_rgba(148,163,184,0.3)]"} 
                    style={{ fontSize: "clamp(12px, 2.5vw, 32px)" }}
                  >
                    {piece}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Curved Evaluation path */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-10 opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="evalGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#facc15" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Draw a curved path showing evaluation swing */}
        <path 
          d="M 12.5 87.5 Q 25 30, 50 50 T 87.5 12.5" 
          fill="none" 
          stroke="url(#evalGrad)" 
          strokeWidth="1.2" 
          filter="url(#glow)" 
          className="animate-pulse"
        />
        
        {/* Decorative nodes at chess square centers */}
        <circle cx="12.5" cy="87.5" r="1.5" fill="#ef4444" filter="url(#glow)" />
        <circle cx="50" cy="50" r="1.5" fill="#facc15" filter="url(#glow)" />
        <circle cx="87.5" cy="12.5" r="1.5" fill="#22c55e" filter="url(#glow)" />
      </svg>
    </div>
  );
}

// ── Rotating facts ─────────────────────────────────────────────────────────────
const FACTS = [
  "There are more possible chess games than atoms in the observable universe.",
  "'Checkmate' derives from Persian — 'Shah Mat' meaning 'the King is helpless'.",
  "The Queen became chess's most powerful piece in the 15th century.",
  "Grandmasters can burn up to 6,000 calories per day during tournaments.",
  "The longest possible game of chess would last 5,949 moves.",
  "Magnus Carlsen became a Grandmaster at just 13 years old.",
];

type Platform = "chesscom" | "lichess";

const PLATFORM = {
  chesscom: {
    name:        "Chess.com",
    logo:        "♟",
    logoBg:      "bg-green-500/15 border-green-500/30",
    logoColor:   "text-green-400",
    btnCls:      "bg-green-600 hover:bg-green-500 shadow-green-500/25",
    ringCls:     "focus:ring-green-500/40",
    desc:        "Import your ratings, game history & run engine analysis.",
    placeholder: "e.g. magnuscarlsen",
    badge:       "bg-green-500/10 border-green-500/20 text-green-400",
    cardBorder:  "hover:border-green-500/40 hover:shadow-green-500/5",
  },
  lichess: {
    name:        "Lichess",
    logo:        "♞",
    logoBg:      "bg-blue-500/15 border-blue-500/30",
    logoColor:   "text-blue-400",
    btnCls:      "bg-blue-700 hover:bg-blue-600 shadow-blue-500/20",
    ringCls:     "focus:ring-blue-500/40",
    desc:        "Free & open source. No token needed — just your username.",
    placeholder: "e.g. DrNykterstein",
    badge:       "bg-blue-500/10 border-blue-500/20 text-blue-400",
    cardBorder:  "hover:border-blue-500/40 hover:shadow-blue-500/5",
  },
} as const;

export default function SignInPage() {
  const router = useRouter();

  const [factIdx, setFactIdx]         = useState(0);
  const [modal, setModal]             = useState<Platform | null>(null);
  const [username, setUsername]       = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);

  // Rotate facts
  useEffect(() => {
    const t = setInterval(() => setFactIdx((p) => (p + 1) % FACTS.length), 5500);
    return () => clearInterval(t);
  }, []);

  const openModal = (p: Platform) => { setModal(p); setUsername(""); setError(""); setSuccess(false); };
  const closeModal = () => { if (!loading) setModal(null); };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !modal) return;
    setLoading(true);
    setError("");
    try {
      if (modal === "chesscom") {
        const profile = await fetchChesscomProfile(username.trim());
        const games   = await fetchChesscomGames(username.trim());
        gameStore.connectPlatform("chesscom", profile.username, profile, games);
        localStorage.setItem("username", profile.username);
        localStorage.setItem("platform", "chesscom");
      } else {
        const profile = await fetchLichessProfile(username.trim());
        const games   = await fetchLichessGames(username.trim());
        gameStore.connectPlatform("lichess", profile.username, profile, games);
        localStorage.setItem("username", profile.username);
        localStorage.setItem("platform", "lichess");
      }
      localStorage.setItem("registration_date", new Date().toISOString());
      localStorage.setItem("premium_unlocked", "true");
      window.dispatchEvent(new Event("premium_updated"));
      setSuccess(true);
      setTimeout(() => router.push("/"), 900);
    } catch (err: any) {
      setError(
        err.message ||
          `Could not find "${username}" on ${modal === "chesscom" ? "Chess.com" : "Lichess"}. Check your username.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#060608] relative font-sans">
      
      {/* ── Background Grid ── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.22]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px"
        }}
      />
      {/* Radial ambient glow blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-green-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Left panel — Chess board visual ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 relative flex-col border-r border-[#1a1a1f] p-10 bg-gradient-to-b from-[#08080a] to-[#060608]">
        {/* Board visual wrapper */}
        <div className="flex-1 flex flex-col justify-center max-w-[440px] mx-auto w-full space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 relative z-10 self-start">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain shrink-0" />
            <span className="text-white font-extrabold text-xs tracking-widest uppercase">Ultimate Chess</span>
          </div>

          {/* Glowing board preview */}
          <div className="w-full aspect-square" style={{ maxHeight: "380px" }}>
            <MiniBoard />
          </div>

          {/* Heading block */}
          <blockquote className="space-y-4 text-left">
            <p className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
              Every Grandmaster<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-green-400 drop-shadow-[0_2px_10px_rgba(74,222,128,0.25)]">
                was once a beginner.
              </span>
            </p>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Connect your chess accounts to unlock automated engine reviews, dynamic training plans, and deep gameplay telemetry metrics.
            </p>
          </blockquote>

          {/* Rotating fact glass-card */}
          <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-md shadow-lg shadow-black/40">
            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Did You Know?</div>
                <p key={factIdx} className="text-[11px] text-slate-300 leading-relaxed font-semibold transition-all duration-300" style={{ animation: "fadeInUp 0.5s ease-out" }}>
                  {FACTS[factIdx]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — Auth form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
        <div className="w-full max-w-sm space-y-6 relative z-10">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain shrink-0" />
            <span className="text-white font-extrabold text-xs tracking-widest uppercase">Ultimate Chess</span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5 text-left">
            <h1 className="text-3xl font-black text-white tracking-tight">Welcome back</h1>
            <p className="text-slate-400 text-xs font-medium">Link your platform profiles to initialize sync.</p>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { icon: Zap,    label: "Engine Analysis" },
              { icon: Shield, label: "Official Ratings" },
              { icon: Globe,  label: "Automatic Sync" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full text-[9px] font-extrabold text-slate-400 tracking-wide uppercase">
                <Icon className="w-3 h-3 text-primary-400" />
                {label}
              </span>
            ))}
          </div>

          {/* Platform Cards */}
          <div className="space-y-3.5">
            {(["chesscom", "lichess"] as Platform[]).map((platform) => {
              const cfg = PLATFORM[platform];
              return (
                <button
                  key={platform}
                  onClick={() => openModal(platform)}
                  className={`w-full group flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] ${cfg.cardBorder} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 btn-press cursor-pointer text-left`}
                >
                  {/* Logo */}
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105 shadow-inner ${cfg.logoBg} ${cfg.logoColor}`}>
                    {cfg.logo}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{cfg.name}</span>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${platform === 'chesscom' ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-blue-400 shadow-[0_0_8px_#60a5fa]'}`} />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-snug">{cfg.desc}</div>
                  </div>
                  {/* Badges and Navigation */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${cfg.badge} tracking-wide`}>
                      {platform === "chesscom" ? "Instant Sync" : "Free Import"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-[10px] text-slate-600 font-semibold tracking-wide uppercase">
            Strictly read-only API access. No credentials or passwords stored.
          </p>
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm bg-[#0e0e11]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent glow strip */}
            <div 
              className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${modal === 'chesscom' ? 'from-green-500 to-emerald-400 shadow-[0_2px_12px_rgba(34,197,94,0.4)]' : 'from-blue-600 to-cyan-400 shadow-[0_2px_12px_rgba(59,130,246,0.4)]'}`}
            />

            {success ? (
              /* Success state */
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center shadow-lg shadow-green-500/10">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-white">Connected!</div>
                  <div className="text-xs text-slate-400 mt-1">Redirecting to your dashboard…</div>
                </div>
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-2xl shrink-0 ${PLATFORM[modal].logoBg} ${PLATFORM[modal].logoColor}`}>
                      {PLATFORM[modal].logo}
                    </div>
                    <div className="text-left">
                      <h2 className="font-black text-white text-sm leading-snug">
                        Sign in with {PLATFORM[modal].name}
                      </h2>
                      <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-0.5 ${PLATFORM[modal].badge}`}>
                        Public API · No Password
                      </span>
                    </div>
                  </div>
                  <button onClick={closeModal} disabled={loading} className="text-slate-500 hover:text-white transition-colors cursor-pointer disabled:opacity-30 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed text-left">
                  Enter your public <strong className="text-white">{PLATFORM[modal].name}</strong> username. Your ratings, profiles, and historical games will sync in the background.
                </p>

                <form onSubmit={handleConnect} className="space-y-4 text-left">
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl leading-normal">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Username</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={PLATFORM[modal].placeholder}
                        className={`w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 ${PLATFORM[modal].ringCls} transition-all`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !username.trim()}
                    className={`w-full py-3 text-white rounded-xl text-sm font-black transition-all shadow-lg flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 btn-press ${PLATFORM[modal].btnCls}`}
                  >
                    {loading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Fetching profile…</>
                    ) : (
                      <><Globe className="w-4 h-4" /> Connect & Sign In</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
