"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Play, 
  Puzzle, 
  BrainCircuit, 
  Map, 
  GraduationCap, 
  Users, 
  Trophy,
  Tv,
  BarChart3,
  Link2,
  Sparkles,
  Bot,
  Activity,
  LayoutDashboard,
  Eye,
  BookOpen,
  Flag,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Shield
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUsername(storedUser);
  }, []);

  const mainItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Play", href: "/play", icon: Play },
    { name: "Puzzles", href: "/puzzles", icon: Puzzle },
    { name: "My Stats", href: "/stats", icon: BarChart3 },
    { name: "Vision Trainer", href: "/vision-trainer", icon: Eye },
    { name: "Tournaments", href: "/tournaments", icon: Trophy, badge: "Soon" },
  ];

  const learnItems = [
    { name: "Analysis", href: "/analysis", icon: Activity },
    { name: "Courses", href: "/academy", icon: GraduationCap },
    { name: "My Path", href: "/academy/quiz", icon: Map },
    { name: "Openings", href: "/openings", icon: BookOpen },
    { name: "Endgames", href: "/academy?tab=endgames", icon: Flag },
    { name: "Master Games", href: "/watch", icon: Tv },
    { name: "Bots", href: "/bots", icon: Bot },
    { name: "Analytics", href: "/analytics", icon: Activity },
  ];

  const communityItems = [
    { name: "Social", href: "/social", icon: Users },
    { name: "Clubs", href: "/clubs", icon: Shield },
    { name: "Integrations", href: "/integrations", icon: Link2 },
    { name: "About Developers", href: "/about", icon: Sparkles },
  ];

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("platform");
    localStorage.removeItem("registration_date");
    localStorage.removeItem("premium_unlocked");
    window.location.href = "/auth/signin";
  };

  return (
    <aside className={`bg-surface-50 border-r border-surface-300 flex flex-col h-full z-20 hidden md:flex transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
      {/* Logo */}
      <div className={`p-6 border-b border-surface-300 flex items-center ${isCollapsed ? "justify-center px-4" : "justify-between"}`}>
        <Link href="/" className="flex items-center gap-3">
          <svg className="w-8 h-8 text-primary-500 fill-current shrink-0" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15c-6.63 0-12 5.37-12 12 0 4.14 2.1 7.78 5.28 9.9C36.96 40.54 32 47.96 32 56.5c0 2.21 1.79 4 4 4h28c2.21 0 4-1.79 4-4 0-8.54-4.96-15.96-11.28-19.6 3.18-2.12 5.28-5.76 5.28-9.9 0-6.63-5.37-12-12-12zm-20 53h40c2.21 0 4 1.79 4 4v4H26v-4c0-2.21 1.79-4 4-4zm-4 12h48v4H26v-4z" />
          </svg>
          {!isCollapsed && (
            <span className="text-2xl font-black tracking-tight text-white flex items-baseline select-none">
              chess<span className="text-primary-500">onium</span>
            </span>
          )}
        </Link>
      </div>

      {/* Nav Link sections */}
      <nav className="flex-1 px-3 mt-6 space-y-6 overflow-y-auto overflow-x-hidden">
        {/* Main Group */}
        <div className="space-y-1">
          {mainItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group font-bold ${
                  isActive 
                    ? "bg-primary-500/10 text-primary-400 border-l-4 border-primary-500 pl-3" 
                    : "text-slate-400 hover:text-white hover:bg-surface-100/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 transition-all duration-200 ${isActive ? "text-primary-400 scale-110" : "group-hover:text-primary-400 group-hover:scale-110"}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-primary-500/20 text-primary-400 uppercase tracking-widest border border-primary-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* LEARN Group */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 select-none">Learn</div>
          )}
          {learnItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group font-bold ${
                  isActive 
                    ? "bg-primary-500/10 text-primary-400 border-l-4 border-primary-500 pl-3" 
                    : "text-slate-400 hover:text-white hover:bg-surface-100/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 transition-all duration-200 ${isActive ? "text-primary-400 scale-110" : "group-hover:text-primary-400 group-hover:scale-110"}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {/* COMMUNITY Group */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 select-none">Community</div>
          )}
          {communityItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group font-bold ${
                  isActive 
                    ? "bg-primary-500/10 text-primary-400 border-l-4 border-primary-500 pl-3" 
                    : "text-slate-400 hover:text-white hover:bg-surface-100/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 transition-all duration-200 ${isActive ? "text-primary-400 scale-110" : "group-hover:text-primary-400 group-hover:scale-110"}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profile Card & Collapse Toggle */}
      <div className="mt-auto p-3 border-t border-surface-300 space-y-2">
        {username && (
          <div className={`rounded-xl bg-surface-100/40 border border-white/5 flex items-center justify-between gap-2 ${isCollapsed ? "p-2 justify-center" : "px-3 py-2.5"}`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center font-bold text-white text-xs uppercase shrink-0">
                {username[0]}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-white font-extrabold truncate leading-tight">{username}</span>
                  <span className="text-[9px] text-slate-400 font-bold">Free Plan</span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Log out"
                className="text-slate-400 hover:text-red-400 cursor-pointer p-1 rounded hover:bg-red-500/10 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Collapse sidebar button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-surface-100/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 mx-auto text-slate-400 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 text-slate-400 shrink-0" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
