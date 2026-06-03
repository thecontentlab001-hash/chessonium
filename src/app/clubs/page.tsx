"use client";

import React, { useState, useEffect } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { 
  Shield, 
  Plus, 
  Users, 
  MessageSquare, 
  Trophy, 
  Send, 
  ArrowLeft, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  Globe, 
  Lock,
  ChevronRight,
  Flame,
  Award,
  ChevronLeft,
  UserPlus,
  UserCheck,
  UserMinus,
  Crown
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Club {
  id: string;
  name: string;
  motto: string;
  description: string;
  avgRating: number;
  memberCount: number;
  type: "Public" | "Private";
  minRating: number;
  themeColor: string; // e.g. "emerald", "amber", "rose", "blue", "purple"
  owner: string;
}

interface ChatMessage {
  id: string;
  author: string;
  rating: number;
  text: string;
  time: string;
  avatarColor: string;
}

interface ClubChallenge {
  id: string;
  player: string;
  rating: number;
  timeControl: string;
  avatarColor: string;
}

export default function ClubsPage() {
  useAuthRedirect();

  const [username, setUsername] = useState("Player");
  const [userRating, setUserRating] = useState(1450);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("username") || "Player";
      setUsername(storedUser);
      const storedRating = localStorage.getItem("rating");
      if (storedRating) setUserRating(Number(storedRating));

      // Update club_1 owner to match the real user so they are the owner initially!
      setClubs(prev => prev.map(c => {
        if (c.id === "club_1" && c.owner === "Player") {
          return { ...c, owner: storedUser };
        }
        return c;
      }));

      // Update the user's name inside the initial state list
      setClubMembersMap(prev => {
        const next = { ...prev };
        if (next.club_1) {
          next.club_1 = next.club_1.map(m => {
            if (m.name === "Player") {
              return { ...m, name: storedUser };
            }
            return m;
          });
        }
        return next;
      });
    }
  }, []);

  // ── SEED DATA ─────────────────────────────────────────────────────────────
  const initialClubs: Club[] = [
    {
      id: "club_1",
      name: "Chessium Pioneers",
      motto: "Pioneering the next generation of grandmasters.",
      description: "The official guild of the Chessium platform. Open to players of all skill levels who want to study positional play, review their moves, and play casual matches.",
      avgRating: 1550,
      memberCount: 124,
      type: "Public",
      minRating: 800,
      themeColor: "emerald",
      owner: "Player"
    },
    {
      id: "club_2",
      name: "Caro-Kann Crusaders",
      motto: "Resilient defense, explosive counterattacks.",
      description: "Dedicated to the solid 1.e4 c6 defense. We analyze deep lines, exchange theory on structural advantages, and run regular themed blitz tournaments.",
      avgRating: 1720,
      memberCount: 82,
      type: "Public",
      minRating: 1200,
      themeColor: "amber",
      owner: "IM_Defense"
    },
    {
      id: "club_3",
      name: "Evans Gambit Alliance",
      motto: "A pawn for space, time, and immediate glory.",
      description: "For the romantic attackers. If you love early sacrifices, double attacks, Greek gifts, and sharp tactical checkmates, you belong in our ranks.",
      avgRating: 1980,
      memberCount: 45,
      type: "Public",
      minRating: 1500,
      themeColor: "rose",
      owner: "GM_Sacrifice"
    },
    {
      id: "club_4",
      name: "Endgame Masters",
      motto: "Games are won in the final opposition.",
      description: "Focused exclusively on the endgame. Learn Lucena positions, Philidor drawings, square of the pawn, and king activities. Strict ELO minimum is enforced.",
      avgRating: 2150,
      memberCount: 29,
      type: "Private",
      minRating: 2000,
      themeColor: "purple",
      owner: "GM_Endgame"
    }
  ];

  const initialChatMessages: Record<string, ChatMessage[]> = {
    club_1: [
      { id: "msg_1", author: "TacticsFan", rating: 1620, text: "Welcome to the Pioneers! Who is down for some 5-min friendly blitz?", time: "10m ago", avatarColor: "from-blue-400 to-indigo-500" },
      { id: "msg_2", author: "CoachAI", rating: 1800, text: "Just added a new lesson on Pin Tactics in the Academy. Highly recommend trying the interactive challenges!", time: "8m ago", avatarColor: "from-purple-500 to-pink-500" },
      { id: "msg_3", author: "ChessNerd", rating: 1480, text: "Quick question: in the French Defense, do you prefer pushing e5 or playing Nc3 on move 3?", time: "3m ago", avatarColor: "from-amber-400 to-orange-500" },
    ],
    club_2: [
      { id: "msg_4", author: "IM_Defense", rating: 2420, text: "Crusaders! Make sure to study the Advance Variation Bf5 lines. Too many members are struggling against White's space.", time: "2h ago", avatarColor: "from-red-400 to-rose-600" },
      { id: "msg_5", author: "SolidPawn", rating: 1550, text: "Caro-Kann is just so comfortable to play. I went +50 ELO today thanks to the exchange lines.", time: "1h ago", avatarColor: "from-teal-400 to-green-600" },
    ],
    club_3: [
      { id: "msg_6", author: "GM_Sacrifice", rating: 2680, text: "Remember: never capture on c3 if you don't plan to target f7 quickly. Time is more valuable than material.", time: "5h ago", avatarColor: "from-indigo-400 to-purple-600" },
      { id: "msg_7", author: "Gambiter", rating: 1820, text: "Evans Gambit has a 55% win rate in our club games this week! Love it.", time: "30m ago", avatarColor: "from-red-500 to-orange-600" },
    ],
    club_4: [
      { id: "msg_8", author: "GM_Endgame", rating: 2710, text: "Weekly opposition studies start tonight. Bring your rook bridge analysis papers.", time: "1d ago", avatarColor: "from-purple-600 to-blue-700" },
    ],
  };

  const initialChallenges: Record<string, ClubChallenge[]> = {
    club_1: [
      { id: "ch_1", player: "TacticsFan", rating: 1620, timeControl: "5+0 Blitz", avatarColor: "from-blue-400 to-indigo-500" },
      { id: "ch_2", player: "BeginnerBob", rating: 950, timeControl: "10+0 Rapid", avatarColor: "from-green-400 to-teal-500" },
    ],
    club_2: [
      { id: "ch_3", player: "SolidPawn", rating: 1550, timeControl: "3+2 Blitz", avatarColor: "from-teal-400 to-green-600" },
    ],
    club_3: [
      { id: "ch_4", player: "Gambiter", rating: 1820, timeControl: "1+0 Bullet", avatarColor: "from-red-500 to-orange-600" },
    ],
    club_4: []
  };

  const initialClubMembers: Record<string, Array<{ name: string; rating: number; role: string; avatarColor: string }>> = {
    club_1: [
      { name: "GM_Aura", rating: 2850, role: "Grandmaster", avatarColor: "from-yellow-400 to-amber-500" },
      { name: "CoachAI", rating: 1800, role: "Officer", avatarColor: "from-purple-500 to-pink-500" },
      { name: "TacticsFan", rating: 1620, role: "Member", avatarColor: "from-blue-400 to-indigo-500" },
      { name: "ChessNerd", rating: 1480, role: "Member", avatarColor: "from-amber-400 to-orange-500" },
      { name: "BeginnerBob", rating: 950, role: "Recruit", avatarColor: "from-green-400 to-teal-500" },
      { name: "Player", rating: 1450, role: "Owner", avatarColor: "from-primary-400 to-accent-500" }
    ],
    club_2: [
      { name: "IM_Defense", rating: 2420, role: "Owner", avatarColor: "from-red-400 to-rose-600" },
      { name: "SolidPawn", rating: 1550, role: "Member", avatarColor: "from-teal-400 to-green-600" },
      { name: "CaroKing", rating: 1890, role: "Officer", avatarColor: "from-yellow-500 to-red-500" },
    ],
    club_3: [
      { name: "GM_Sacrifice", rating: 2680, role: "Owner", avatarColor: "from-indigo-400 to-purple-600" },
      { name: "Gambiter", rating: 1820, role: "Officer", avatarColor: "from-red-500 to-orange-600" },
      { name: "MatingNet", rating: 1910, role: "Member", avatarColor: "from-emerald-400 to-cyan-500" },
    ],
    club_4: [
      { name: "GM_Endgame", rating: 2710, role: "Owner", avatarColor: "from-purple-600 to-blue-700" },
      { name: "OpposeKing", rating: 2110, role: "Member", avatarColor: "from-slate-400 to-slate-600" },
      { name: "RookBridge", rating: 2050, role: "Member", avatarColor: "from-sky-400 to-indigo-600" },
    ]
  };

  // ── APP STATE ──────────────────────────────────────────────────────────────
  const [clubs, setClubs] = useState<Club[]>(initialClubs);
  const [joinedClubId, setJoinedClubId] = useState<string | null>("club_1"); // Start inside club_1 for better initial presentation
  const [clubMembersMap, setClubMembersMap] = useState<Record<string, Array<{ name: string; rating: number; role: string; avatarColor: string }>>>(initialClubMembers);
  const [friends, setFriends] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(initialChatMessages);
  const [challenges, setChallenges] = useState<Record<string, ClubChallenge[]>>(initialChallenges);
  const [messageText, setMessageText] = useState("");
  const [selectedTab, setSelectedTab] = useState<"chat" | "leaderboard" | "challenges">("chat");

  // Create Club Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubMotto, setNewClubMotto] = useState("");
  const [newClubDesc, setNewClubDesc] = useState("");
  const [newClubMinRating, setNewClubMinRating] = useState(1000);
  const [newClubType, setNewClubType] = useState<"Public" | "Private">("Public");
  const [newClubTheme, setNewClubTheme] = useState("emerald");
  const [errorMessage, setErrorMessage] = useState("");

  const activeClub = clubs.find(c => c.id === joinedClubId);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedTab === "chat" && joinedClubId) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [chatMessages, selectedTab, joinedClubId]);

  // ── HANDLERS ───────────────────────────────────────────────────────────────
  const handleJoinClub = (clubId: string) => {
    const targetClub = clubs.find(c => c.id === clubId);
    if (!targetClub) return;

    if (userRating < targetClub.minRating) {
      alert(`Cannot join: This club requires a minimum ELO of ${targetClub.minRating}. (Your rating is ${userRating})`);
      return;
    }

    const previousClubId = joinedClubId;

    // 1. Update member counts for both target and old club
    setClubs(prev => prev.map(c => {
      let count = c.memberCount;
      if (c.id === clubId) {
        count += 1;
      } else if (previousClubId && c.id === previousClubId) {
        count = Math.max(1, count - 1);
      }
      return { ...c, memberCount: count };
    }));

    // 2. Adjust roster state maps
    setClubMembersMap(prev => {
      const next = { ...prev };
      
      // Remove user from previous roster
      if (previousClubId && next[previousClubId]) {
        next[previousClubId] = next[previousClubId].filter(m => m.name !== username);
      }

      // Add user to new roster
      const roster = next[clubId] || [];
      if (!roster.some(m => m.name === username)) {
        next[clubId] = [
          ...roster,
          { name: username, rating: userRating, role: "Member", avatarColor: "from-primary-400 to-accent-500" }
        ];
      }
      return next;
    });

    setJoinedClubId(clubId);
    setSelectedTab("chat");
  };

  const handleLeaveClub = () => {
    if (!joinedClubId) return;
    const cid = joinedClubId;

    // Remove user from roster state
    setClubMembersMap(prev => {
      const roster = prev[cid] || [];
      return {
        ...prev,
        [cid]: roster.filter(m => m.name !== username)
      };
    });

    setClubs(prev => prev.map(c => {
      if (c.id === cid) {
        return { ...c, memberCount: Math.max(1, c.memberCount - 1) };
      }
      return c;
    }));
    
    setJoinedClubId(null);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !joinedClubId) return;

    const newMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      author: username,
      rating: userRating,
      text: messageText,
      time: "Just now",
      avatarColor: "from-primary-400 to-accent-500"
    };

    setChatMessages(prev => ({
      ...prev,
      [joinedClubId]: [...(prev[joinedClubId] || []), newMessage]
    }));

    setMessageText("");
  };

  const handlePostChallenge = (timeControl: string) => {
    if (!joinedClubId) return;

    const newCh: ClubChallenge = {
      id: `ch_user_${Date.now()}`,
      player: username,
      rating: userRating,
      timeControl,
      avatarColor: "from-primary-400 to-accent-500"
    };

    setChallenges(prev => ({
      ...prev,
      [joinedClubId]: [newCh, ...(prev[joinedClubId] || [])]
    }));
  };

  const handleAcceptChallenge = (chId: string) => {
    alert("Joining matchmaking lobby with club member. Redirecting to game board...");
    window.location.href = `/play?timeControl=blitz`;
  };

  const handleCreateClubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!newClubName.trim()) {
      setErrorMessage("Club Name is required.");
      return;
    }
    if (!newClubMotto.trim()) {
      setErrorMessage("Club Motto is required.");
      return;
    }

    const newClubId = `club_${Date.now()}`;
    const newClub: Club = {
      id: newClubId,
      name: newClubName,
      motto: newClubMotto,
      description: newClubDesc || "No description provided.",
      avgRating: userRating,
      memberCount: 1,
      type: newClubType,
      minRating: newClubMinRating,
      themeColor: newClubTheme,
      owner: username
    };

    setClubs(prev => [...prev, newClub]);

    // Initialize blank chat/challenges/roster
    setChatMessages(prev => ({
      ...prev,
      [newClubId]: [{
        id: "msg_init",
        author: "Club Coach",
        rating: 1800,
        text: `Welcome to ${newClubName}! This is your club wall. Chat, create challenges, and play together!`,
        time: "Just now",
        avatarColor: "from-primary-500 to-accent-500"
      }]
    }));

    setChallenges(prev => ({
      ...prev,
      [newClubId]: []
    }));

    // Add user as the owner in the roster
    setClubMembersMap(prev => ({
      ...prev,
      [newClubId]: [
        { name: username, rating: userRating, role: "Owner", avatarColor: "from-primary-400 to-accent-500" }
      ]
    }));

    setJoinedClubId(newClubId);
    setShowCreateModal(false);
    setSelectedTab("chat");

    // Reset Form
    setNewClubName("");
    setNewClubMotto("");
    setNewClubDesc("");
    setNewClubMinRating(1000);
    setNewClubType("Public");
    setNewClubTheme("emerald");
  };

  const handleToggleFriend = (memberName: string) => {
    setFriends(prev => {
      if (prev.includes(memberName)) {
        return prev.filter(f => f !== memberName);
      } else {
        return [...prev, memberName];
      }
    });
  };

  const handleKickMember = (memberName: string) => {
    if (!joinedClubId || !activeClub) return;
    if (!confirm(`Are you sure you want to kick ${memberName} from the club?`)) return;

    // Remove from roster
    setClubMembersMap(prev => ({
      ...prev,
      [joinedClubId]: (prev[joinedClubId] || []).filter(m => m.name !== memberName)
    }));

    // Decrement memberCount
    setClubs(prev => prev.map(c => {
      if (c.id === joinedClubId) {
        return { ...c, memberCount: Math.max(1, c.memberCount - 1) };
      }
      return c;
    }));

    // Post system message on wall
    const systemMsg: ChatMessage = {
      id: `msg_system_${Date.now()}`,
      author: "Club Announcement",
      rating: 0,
      text: `📢 ${memberName} was kicked from the club by owner ${username}.`,
      time: "Just now",
      avatarColor: "from-red-500 to-red-600"
    };

    setChatMessages(prev => ({
      ...prev,
      [joinedClubId]: [...(prev[joinedClubId] || []), systemMsg]
    }));
  };

  const handleTransferOwnership = (memberName: string) => {
    if (!joinedClubId || !activeClub) return;
    if (!confirm(`Are you sure you want to transfer ownership of the club to ${memberName}? You will be demoted to a regular Member.`)) return;

    // 1. Update Owner in clubs state
    setClubs(prev => prev.map(c => {
      if (c.id === joinedClubId) {
        return { ...c, owner: memberName };
      }
      return c;
    }));

    // 2. Update Roles in roster state
    setClubMembersMap(prev => {
      const roster = prev[joinedClubId] || [];
      const updated = roster.map(m => {
        if (m.name === username) {
          return { ...m, role: "Member" };
        }
        if (m.name === memberName) {
          return { ...m, role: "Owner" };
        }
        return m;
      });
      return {
        ...prev,
        [joinedClubId]: updated
      };
    });

    // 3. Post system message on wall
    const systemMsg: ChatMessage = {
      id: `msg_system_${Date.now()}`,
      author: "Club Announcement",
      rating: 0,
      text: `👑 ${username} has transferred club ownership to ${memberName}.`,
      time: "Just now",
      avatarColor: "from-purple-500 to-indigo-600"
    };

    setChatMessages(prev => ({
      ...prev,
      [joinedClubId]: [...(prev[joinedClubId] || []), systemMsg]
    }));
  };

  // Color theme helpers
  const getThemeClass = (color: string) => {
    switch (color) {
      case "emerald": return { bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", border: "border-emerald-500/30", text: "text-emerald-400", glow: "bg-emerald-500/20" };
      case "amber": return { bg: "bg-amber-500/10 border-amber-500/20 text-amber-400", border: "border-amber-500/30", text: "text-amber-400", glow: "bg-amber-500/20" };
      case "rose": return { bg: "bg-rose-500/10 border-rose-500/20 text-rose-400", border: "border-rose-500/30", text: "text-rose-400", glow: "bg-rose-500/20" };
      case "blue": return { bg: "bg-blue-500/10 border-blue-500/20 text-blue-400", border: "border-blue-500/30", text: "text-blue-400", glow: "bg-blue-500/20" };
      case "purple": return { bg: "bg-purple-500/10 border-purple-500/20 text-purple-400", border: "border-purple-500/30", text: "text-purple-400", glow: "bg-purple-500/20" };
      default: return { bg: "bg-primary-500/10 border-primary-500/20 text-primary-400", border: "border-primary-500/30", text: "text-primary-400", glow: "bg-primary-500/20" };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ── HEADER BANNER ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl glass-card p-8 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Guild Clubs</h1>
            <p className="text-slate-400 text-sm mt-1">Form alliances, chat, challenge members, and dominate the Chessium leaderboards together.</p>
          </div>
        </div>
        
        {!joinedClubId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl shadow-lg shadow-primary-600/25 transition-all z-10 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Club
          </button>
        )}
      </section>

      {joinedClubId && activeClub ? (
        /* ── MY ACTIVE CLUB VIEW ────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Main Workspace (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Club Header Panel */}
            <div className="glass-card border border-white/10 p-6 rounded-2xl relative overflow-hidden space-y-4">
              <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full blur-3xl ${getThemeClass(activeClub.themeColor).glow} pointer-events-none`} />
              
              <div className="flex justify-between items-start">
                <button 
                  onClick={handleLeaveClub}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Leave / Switch Club
                </button>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${getThemeClass(activeClub.themeColor).bg}`}>
                  {activeClub.type} Club
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  {activeClub.name}
                </h2>
                <p className="text-primary-400 text-xs italic font-medium mt-1">“{activeClub.motto}”</p>
                <p className="text-slate-400 text-xs mt-3 leading-relaxed">{activeClub.description}</p>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 text-center text-xs font-bold">
                <div className="bg-surface-100/50 p-2.5 rounded-xl border border-white/5">
                  <div className="text-slate-500 text-[10px] uppercase">Members</div>
                  <div className="text-white text-lg mt-0.5">{activeClub.memberCount}</div>
                </div>
                <div className="bg-surface-100/50 p-2.5 rounded-xl border border-white/5">
                  <div className="text-slate-500 text-[10px] uppercase">Avg Rating</div>
                  <div className="text-white text-lg mt-0.5">{activeClub.avgRating} ELO</div>
                </div>
                <div className="bg-surface-100/50 p-2.5 rounded-xl border border-white/5">
                  <div className="text-slate-500 text-[10px] uppercase">Min ELO</div>
                  <div className="text-white text-lg mt-0.5">{activeClub.minRating}</div>
                </div>
              </div>
            </div>

            {/* Content Tabs Switcher */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setSelectedTab("chat")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedTab === "chat"
                    ? "bg-slate-800 text-white border border-white/10 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Guild Chat & Wall
              </button>
              <button
                onClick={() => setSelectedTab("challenges")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedTab === "challenges"
                    ? "bg-slate-800 text-white border border-white/10 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Play className="w-4 h-4" />
                Active Challenges ({challenges[activeClub.id]?.length || 0})
              </button>
              <button
                onClick={() => setSelectedTab("leaderboard")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  selectedTab === "leaderboard"
                    ? "bg-slate-800 text-white border border-white/10 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </button>
            </div>

            {/* TAB CONTAINER */}
            <div className="flex-1 min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Tab 1: Chat / Wall */}
                  {selectedTab === "chat" && (
                    <div className="glass-card border border-white/10 rounded-2xl p-5 flex flex-col justify-between h-[450px] overflow-hidden">
                      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        {(chatMessages[activeClub.id] || []).map((msg) => (
                      <div key={msg.id} className="flex gap-3 items-start animate-fade-in">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${msg.avatarColor} flex items-center justify-center font-bold text-white text-[11px] uppercase shrink-0`}>
                          {msg.author[0]}
                        </div>
                        <div className="bg-surface-100/60 border border-white/5 p-3 rounded-2xl flex-1 text-xs">
                          <div className="flex justify-between items-baseline mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{msg.author}</span>
                              <span className="text-[9px] font-bold text-slate-500">({msg.rating})</span>
                            </div>
                            <span className="text-[9px] text-slate-600 font-semibold">{msg.time}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-medium">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                        <div ref={chatEndRef} />
                  </div>

                  {/* Send Message Input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-white/5 mt-4 shrink-0">
                    <input
                      type="text"
                      placeholder="Post a message on the guild wall..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 bg-surface-100 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500/50"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="p-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-800 disabled:text-slate-500 text-white rounded-xl transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Challenges */}
              {selectedTab === "challenges" && (
                <div className="glass-card border border-white/10 rounded-2xl p-5 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-sm">Play Club Members</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Post an open challenge or join an active game hosted by your guild mates.</p>
                    </div>
                    
                    {/* Post Challenge buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePostChallenge("3+2 Blitz")}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-white/5 border border-white/5 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                      >
                        ⚡ 3+2 Blitz
                      </button>
                      <button
                        onClick={() => handlePostChallenge("10+0 Rapid")}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-white/5 border border-white/5 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                      >
                        🐢 10+0 Rapid
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(!challenges[activeClub.id] || challenges[activeClub.id].length === 0) ? (
                      <div className="text-center py-12 text-slate-500 text-xs font-semibold">
                        No active challenges. Click one of the buttons above to post yours!
                      </div>
                    ) : (
                      challenges[activeClub.id].map((ch) => (
                        <div 
                          key={ch.id}
                          className="bg-surface-100/50 border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-white/15 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${ch.avatarColor} flex items-center justify-center font-bold text-white text-[11px] uppercase`}>
                              {ch.player[0]}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                                {ch.player}
                                <span className="text-[9px] font-semibold text-slate-500">({ch.rating})</span>
                              </div>
                              <div className="text-[9px] text-primary-400 font-bold uppercase tracking-wider mt-0.5">
                                {ch.timeControl} Match
                              </div>
                            </div>
                          </div>

                          {ch.player === username ? (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-3 py-1.5 rounded-lg border border-white/5">
                              Your Challenge
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAcceptChallenge(ch.id)}
                              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-[10px] uppercase flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Play className="w-3 h-3" />
                              Play Now
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Leaderboard */}
              {selectedTab === "leaderboard" && (
                <div className="glass-card border border-white/10 rounded-2xl p-5 space-y-4">
                  <h4 className="font-bold text-white text-sm">ELO Standings</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="pb-3 pl-2">Rank</th>
                          <th className="pb-3">Player</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3">Rating</th>
                          <th className="pb-3 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {(clubMembersMap[activeClub.id] || []).map((m, idx) => {
                          const isSelf = m.name === username;
                          const isFriend = friends.includes(m.name);
                          const userIsOwner = activeClub.owner === username;

                          return (
                            <tr key={m.name} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 pl-2 text-slate-400 flex items-center gap-2">
                                {idx === 0 && <Award className="w-4 h-4 text-yellow-400" />}
                                {idx === 1 && <Award className="w-4 h-4 text-slate-300" />}
                                {idx === 2 && <Award className="w-4 h-4 text-amber-600" />}
                                {idx > 2 && <span className="pl-1.5">{idx + 1}</span>}
                              </td>
                              <td className="py-3 text-white font-bold">{m.name}</td>
                              <td className="py-3">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${
                                  m.role === "Owner"
                                    ? "bg-purple-500/10 border-purple-500/20 text-purple-400 animate-pulse font-black"
                                    : m.role === "Grandmaster"
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                    : m.role === "Officer"
                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                    : "bg-slate-800 border-white/5 text-slate-400"
                                }`}>
                                  {m.role}
                                </span>
                              </td>
                              <td className="py-3 font-mono text-primary-400 font-bold">{m.rating} ELO</td>
                              <td className="py-3 text-right pr-2">
                                <div className="flex items-center justify-end gap-2.5">
                                  {/* Friend Button */}
                                  {!isSelf && (
                                    <button
                                      onClick={() => handleToggleFriend(m.name)}
                                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                        isFriend
                                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                                          : "bg-surface-200 border-white/5 text-slate-400 hover:text-white hover:bg-surface-300"
                                      }`}
                                      title={isFriend ? "Remove Friend" : "Add Friend"}
                                    >
                                      {isFriend ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                  
                                  {/* Admin Actions */}
                                  {userIsOwner && !isSelf && (
                                    <>
                                      <button
                                        onClick={() => handleTransferOwnership(m.name)}
                                        className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:text-white hover:bg-purple-600 rounded-lg transition-all cursor-pointer"
                                        title="Transfer Ownership"
                                      >
                                        <Crown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleKickMember(m.name)}
                                        className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-all cursor-pointer"
                                        title="Kick Member"
                                      >
                                        <UserMinus className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel: Active Club List / Lobbies */}
          <div className="space-y-6">
            
            {/* Club Lobbies list */}
            <div className="glass-card border border-white/10 p-5 rounded-2xl space-y-4">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4.5 h-4.5 text-primary-400" />
                Active Lobbies
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Join themed lobbies dedicated to specific openings or positional drills, playing other online club members.
              </p>

              <div className="space-y-2">
                {[
                  { name: "Caro-Kann Advance study", type: "Study Board", members: "4 studying", active: true },
                  { name: "Pioneers Arena lobby", type: "Blitz Arena", members: "12 active", active: true },
                  { name: "EndgameOpposition L15", type: "Opposition drills", members: "1 training", active: false },
                ].map((lob, idx) => (
                  <div key={idx} className="bg-surface-100/50 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-white">{lob.name}</div>
                      <div className="text-[9px] text-slate-500 font-semibold mt-0.5">{lob.type} • {lob.members}</div>
                    </div>
                    {lob.active ? (
                      <button
                        onClick={() => alert("Joining this club lobby...")}
                        className="px-2.5 py-1 bg-primary-600/20 hover:bg-primary-500/30 text-primary-400 border border-primary-500/30 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer"
                      >
                        Join
                      </button>
                    ) : (
                      <span className="text-[8px] font-bold text-slate-600 bg-slate-800 px-2 py-1 rounded border border-white/5 uppercase">
                        Inactive
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Friends list in Club */}
            <div className="glass-card border border-white/10 p-5 rounded-2xl space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary-400" />
                Friends Online ({friends.length})
              </h4>
              <div className="space-y-2">
                {friends.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">No friends added yet. Click the friend icon in the leaderboard to add friends!</p>
                ) : (
                  friends.map(fName => {
                    const memberInfo = (clubMembersMap[activeClub.id] || []).find(m => m.name === fName);
                    return (
                      <div key={fName} className="bg-surface-100/50 p-2.5 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${memberInfo?.avatarColor || "from-slate-400 to-slate-500"} flex items-center justify-center font-bold text-white text-[9px] uppercase`}>
                            {fName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white">{fName}</div>
                            <div className="text-[8px] text-green-400 font-semibold">● Online</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleFriend(fName)}
                          className="text-[9px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Suggested Clubs list */}
            <div className="glass-card border border-white/10 p-5 rounded-2xl space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Other Clubs</h4>
              
              <div className="space-y-2.5">
                {clubs.filter(c => c.id !== joinedClubId).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleJoinClub(c.id)}
                    className="w-full text-left p-3.5 rounded-xl border border-white/5 bg-surface-100 hover:bg-surface-200 transition-all flex flex-col gap-1.5 cursor-pointer"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-xs text-white">{c.name}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getThemeClass(c.themeColor).bg}`}>
                        Avg {c.avgRating}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold line-clamp-1">{c.motto}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ── BROWSE CLUBS DIRECTORY ────────────────────────────────────────── */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">Browse Active Clubs</h3>
              <p className="text-xs text-slate-500 mt-1">Select a club that fits your rating and goals. Join and play matches together.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clubs.map((c) => {
              const ratingCheck = userRating >= c.minRating;
              return (
                <div 
                  key={c.id}
                  className="glass-card border border-white/10 p-6 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 rounded-full blur-3xl ${getThemeClass(c.themeColor).glow} pointer-events-none`} />
                  
                  <div className="space-y-2.5 z-10">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-black text-white flex items-center gap-2">
                        {c.name}
                      </h4>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${getThemeClass(c.themeColor).bg}`}>
                        Avg ELO {c.avgRating}
                      </span>
                    </div>

                    <p className="text-primary-400 text-xs italic font-medium">“{c.motto}”</p>
                    <p className="text-slate-400 text-xs leading-relaxed mt-2">{c.description}</p>
                    
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 pt-1.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {c.memberCount} members
                      </span>
                      <span className="flex items-center gap-1">
                        {c.type === "Public" ? <Globe className="w-3.5 h-3.5 text-green-400" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
                        {c.type} Guild
                      </span>
                      <span>
                        Min ELO: {c.minRating}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3.5 z-10">
                    {!ratingCheck ? (
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/10">
                        Requires {c.minRating}+ ELO
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoinClub(c.id)}
                        className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        Join Club
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CREATE CLUB MODAL ────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="w-full max-w-lg bg-[#0e110e] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-52 h-52 bg-primary-500/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1">
              <Shield className="w-5.5 h-5.5 text-primary-400" />
              Create Chess Club
            </h3>
            <p className="text-slate-400 text-xs mb-6">Build your community, host themed games, and analyze strategy with members.</p>

            <form onSubmit={handleCreateClubSubmit} className="space-y-4 text-xs font-semibold text-slate-300">
              
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl mb-4">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Club Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sicilian Saboteurs"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500/50"
                  maxLength={30}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Club Motto</label>
                  <input
                    type="text"
                    placeholder="e.g. Strike fast, sacrifice early."
                    value={newClubMotto}
                    onChange={(e) => setNewClubMotto(e.target.value)}
                    className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500/50"
                    maxLength={50}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Min ELO Requirement</label>
                  <input
                    type="number"
                    min={400}
                    max={3000}
                    value={newClubMinRating}
                    onChange={(e) => setNewClubMinRating(Number(e.target.value))}
                    className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Description</label>
                <textarea
                  placeholder="Tell potential members about your club's goals, strategy studies, and rules..."
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500/50 h-20 resize-none"
                  maxLength={250}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Privacy Type</label>
                  <select
                    value={newClubType}
                    onChange={(e) => setNewClubType(e.target.value as any)}
                    className="w-full bg-surface-100 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Public">Public (Anyone can join)</option>
                    <option value="Private">Private (Approval required)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Club Banner Theme</label>
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {["emerald", "amber", "rose", "blue", "purple"].map((col) => (
                      <button
                        type="button"
                        key={col}
                        onClick={() => setNewClubTheme(col)}
                        className={`w-full py-2 rounded-lg border text-[9px] font-black uppercase transition-all cursor-pointer ${
                          newClubTheme === col
                            ? `${getThemeClass(col).bg} border-white/30`
                            : "bg-surface-100 border-white/5 text-slate-500"
                        }`}
                      >
                        {col[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/25 transition-all cursor-pointer"
                >
                  Create Club
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
