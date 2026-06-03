"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import ChessboardWrapper from "@/components/chess/ChessboardWrapper";
import EvaluationBar from "@/components/chess/EvaluationBar";
import { useStockfish } from "@/hooks/useStockfish";
import { useRouter } from "next/navigation";
import { Tv, Sparkles, MessageCircle, Send, Users, Activity } from "lucide-react";

interface StreamMatch {
  id: string;
  white: { name: string; rating: number };
  black: { name: string; rating: number };
  viewers: number;
  status: string;
  pgn: string;
}

const seedMatches: StreamMatch[] = [
  {
    id: "m_1",
    white: { name: "GM Hikaru", rating: 2850 },
    black: { name: "Stockfish 18", rating: 3500 },
    viewers: 1242,
    status: "Live: Round 3",
    pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7"
  },
  {
    id: "m_2",
    white: { name: "WGM Botez", rating: 2024 },
    black: { name: "IM Rozman", rating: 2420 },
    viewers: 850,
    status: "Live: Friendly Blitz",
    pgn: "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6"
  }
];

export default function WatchPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const username = localStorage.getItem("username");
      if (!username) {
        router.push("/auth/signin");
      }
    }
  }, [router]);

  const [activeMatch, setActiveMatch] = useState<StreamMatch>(seedMatches[0]);
  const [game, setGame] = useState<Chess | null>(null);
  const [historyMoves, setHistoryMoves] = useState<string[]>([]);
  const [moveIndex, setMoveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);

  // Spectator Chat & Commentary states
  const [chatMessages, setChatMessages] = useState<{ author: string; text: string; isCommentator?: boolean }[]>([
    { author: "ChessNerd", text: "Is Hikaru really playing the Evans Gambit against Stockfish?" },
    { author: "Commentator AI", text: "Bxh7+ sacrifice is looming here. Excellent positioning by white.", isCommentator: true },
    { author: "GrandmasterSpassky", text: "d3 is a passive choice by black here, opens up too much pressure." }
  ]);
  const [chatInput, setChatInput] = useState("");

  const { evaluation, isEvaluating, analyzePosition } = useStockfish();
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load active match PGN
  useEffect(() => {
    try {
      const parsedGame = new Chess();
      parsedGame.loadPgn(activeMatch.pgn);
      setHistoryMoves(parsedGame.history());
      setMoveIndex(-1);
      setGame(new Chess());
      setIsPlaying(true);
    } catch (e) {
      console.error("Failed to parse stream PGN:", e);
    }
  }, [activeMatch]);

  // Automated gameplay replay mapping live stream moves
  useEffect(() => {
    if (isPlaying && historyMoves.length > 0) {
      playIntervalRef.current = setInterval(() => {
        setMoveIndex((prevIdx) => {
          const nextIdx = prevIdx + 1;
          if (nextIdx >= historyMoves.length) {
            setIsPlaying(false);
            return prevIdx;
          }
          return nextIdx;
        });
      }, 3000); // 3 seconds per move
    }

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, historyMoves]);

  // Synchronize board position and run evaluations on index steps
  useEffect(() => {
    if (moveIndex >= -1 && historyMoves.length >= 0) {
      try {
        const tempGame = new Chess();
        for (let i = 0; i <= moveIndex; i++) {
          tempGame.move(historyMoves[i]);
        }
        setGame(tempGame);
        analyzePosition(tempGame.fen(), 8); // Run stockfish evaluation in background
        
        // Add random bot commentator message occasionally
        if (moveIndex % 4 === 0 && moveIndex > 0) {
          const commentators = [
            "White is gaining space in the center, rook mobility looks strong.",
            "King safety could become an issue for black if they don't castle quickly.",
            "Evaluation bar shifts slightly. Tactical middle game setup here."
          ];
          setChatMessages((prev) => [
            ...prev,
            { author: "Commentator AI", text: commentators[Math.floor(Math.random() * commentators.length)], isCommentator: true }
          ]);
        }
      } catch (e) {
        console.error("Failed to step moves:", e);
      }
    }
  }, [moveIndex, historyMoves]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput) return;
    setChatMessages((prev) => [...prev, { author: "You", text: chatInput }]);
    setChatInput("");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Stream Arena grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch">
        
        {/* Watch Board and stats */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="flex gap-4 items-stretch">
            {game && (
              <EvaluationBar
                score={evaluation.score}
                type={evaluation.type}
                isEvaluating={isEvaluating}
                orientation="white"
                depth={evaluation.depth}
                sideToMove={game.turn() === "w" ? "white" : "black"}
              />
            )}
            
            {game && (
              <div className="flex-1 flex items-center justify-center">
                <ChessboardWrapper
                  game={game}
                  onMove={() => false} // Spectators cannot move
                  userColor="white"
                  boardTheme="classic"
                />
              </div>
            )}
          </div>

          {/* Match information bar */}
          <div className="glass-card border border-white/10 p-5 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 animate-pulse">
                <Tv className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">
                  {activeMatch.white.name} ({activeMatch.white.rating}) vs {activeMatch.black.name} ({activeMatch.black.rating})
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">{activeMatch.status}</span>
              </div>
            </div>

            <div className="flex gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4 text-slate-500" />
                {activeMatch.viewers} watching
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                Live Engine Active
              </span>
            </div>
          </div>
        </div>

        {/* Right sidebar watch feeds selection & Chat room */}
        <div className="space-y-6 flex flex-col h-[70vh] max-h-[640px]">
          
          {/* Active matches lists */}
          <section className="glass-card border border-white/10 p-4 rounded-2xl space-y-3">
            <h4 className="font-bold text-white text-xs">Live Broadcasts</h4>
            <div className="space-y-2">
              {seedMatches.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setActiveMatch(m)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeMatch.id === m.id
                      ? "bg-primary-600/20 border-primary-500 text-white"
                      : "bg-surface-100 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="font-bold text-xs">{m.white.name} vs {m.black.name}</div>
                  <div className="flex justify-between items-center text-[9px] mt-1.5 opacity-80">
                    <span>{m.viewers} viewers</span>
                    <span className="text-red-400 animate-pulse">● LIVE</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Chat room */}
          <section className="glass-card border border-white/10 p-4 rounded-2xl flex-1 flex flex-col justify-between overflow-hidden">
            <h4 className="font-bold text-white text-xs mb-3 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-primary-400" />
              Spectator Chat & Commentary
            </h4>

            {/* Message stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs font-medium">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border ${
                    msg.isCommentator
                      ? "bg-accent-500/10 border-accent-500/20 text-accent-300"
                      : "bg-surface-100/50 border-white/5 text-slate-300"
                  }`}
                >
                  <div className="font-bold mb-0.5 flex items-center gap-1.5">
                    {msg.author}
                    {msg.isCommentator && (
                      <span className="text-[8px] bg-accent-500 text-white font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wide">
                        <Sparkles className="w-2 h-2" /> AI
                      </span>
                    )}
                  </div>
                  <p className="opacity-90">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Input Send Form */}
            <form onSubmit={handleSendChat} className="flex gap-2 pt-3 border-t border-white/5 mt-3">
              <input
                type="text"
                placeholder="Say something in chat..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-surface-100 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              />
              <button
                type="submit"
                className="p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-colors"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </section>

        </div>
      </div>
    </div>
  );
}
