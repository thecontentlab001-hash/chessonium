"use client";

import React, { useState, useEffect } from "react";
import { Bell, Search, User, X, Check, Award, Trophy, Zap, Settings } from "lucide-react";
import SettingsModal from "@/components/ui/SettingsModal";

interface NotificationItem {
  id: string;
  type: "achievement" | "tournament" | "friend" | "system";
  text: string;
  time: string;
  read: boolean;
}

export default function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [username, setUsername] = useState("Guest");

  useEffect(() => {
    const checkPremium = () => {
      const storedUser = localStorage.getItem("username");
      if (storedUser) setUsername(storedUser);

      const isUnlocked = localStorage.getItem("premium_unlocked") === "true";
      const regDateStr = localStorage.getItem("registration_date");
      
      if (regDateStr) {
        const regDate = new Date(regDateStr);
        const now = new Date();
        const diffTime = now.getTime() - regDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const daysLeft = 3 - diffDays;
        
        if (daysLeft > 0) {
          setIsPremium(true);
          setTrialDaysLeft(daysLeft);
          localStorage.setItem("premium_unlocked", "true");
        } else {
          if (localStorage.getItem("premium_unlocked_bought") !== "true") {
            localStorage.removeItem("premium_unlocked");
            setIsPremium(false);
            setTrialDaysLeft(null);
          } else {
            setIsPremium(true);
            setTrialDaysLeft(null);
          }
        }
      } else {
        setIsPremium(isUnlocked);
        setTrialDaysLeft(null);
      }
    };
    checkPremium();
    window.addEventListener("storage", checkPremium);
    window.addEventListener("premium_updated", checkPremium);
    return () => {
      window.removeEventListener("storage", checkPremium);
      window.removeEventListener("premium_updated", checkPremium);
    };
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n1",
      type: "friend",
      text: "GrandmasterSpassky liked your Caro-Kann Study",
      time: "10m ago",
      read: false,
    },
    {
      id: "n2",
      type: "tournament",
      text: "Weekly Swiss Arena starts in 15 mins. Join Queue!",
      time: "25m ago",
      read: false,
    },
    {
      id: "n3",
      type: "achievement",
      text: "Daily Mission completed! +50 XP awarded.",
      time: "1h ago",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleReadStatus = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  return (
    <>
    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    <header className="h-16 glass border-b flex items-center justify-between px-6 z-20 sticky top-0">
      {/* Search Input */}
      <div className="flex-1 max-w-xl hidden md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search players, clubs, or lessons..." 
            className="w-full bg-surface-100/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto relative">
        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 rounded-full bg-surface-100/50 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        {/* Bell Icon & Notification Count Dot */}
        <button 
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          className="w-10 h-10 rounded-full bg-surface-100/50 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-surface-50"></span>
          )}
        </button>

        {/* NOTIFICATION SLIDE OUT / DROPDOWN */}
        {isNotificationsOpen && (
          <div className="absolute right-0 top-12 w-80 glass-card border border-white/10 p-4 shadow-2xl rounded-2xl z-30 mt-2 space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  className="text-[10px] text-primary-400 hover:text-white font-bold"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification items list */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {notifications.length === 0 ? (
                <div className="text-slate-500 text-center py-8 text-xs font-semibold">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => toggleReadStatus(n.id)}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors relative ${
                      n.read
                        ? "bg-surface-100/30 border-white/5 text-slate-400"
                        : "bg-primary-500/5 border-primary-500/10 text-slate-200"
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <p className="text-[11px] font-medium leading-relaxed pr-4">{n.text}</p>
                      <span className="text-[9px] text-slate-500 font-semibold">{n.time}</span>
                    </div>

                    <button
                      onClick={(e) => deleteNotification(n.id, e)}
                      className="absolute right-2 top-2 text-slate-500 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-surface-100/50 border border-white/10 hover:bg-white/5 transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-200">{username}</span>
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("username");
              localStorage.removeItem("platform");
              localStorage.removeItem("registration_date");
              localStorage.removeItem("premium_unlocked");
              window.location.href = "/auth/signin";
            }}
            className="w-10 h-10 rounded-full bg-red-950/40 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-900/40 flex items-center justify-center transition-colors cursor-pointer"
            title="Log Out / Sign In with another account"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </div>
      </div>
    </header>
    </>
  );
}
