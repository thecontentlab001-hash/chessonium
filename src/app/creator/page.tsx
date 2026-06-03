"use client";

import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { seedStudies, Study } from "@/lib/chess/studies";
import { Plus, BookOpen, User, Heart, Share2, ArrowLeft, Send } from "lucide-react";

export default function CreatorPage() {
  const [studies, setStudies] = useState<Study[]>(seedStudies);
  const [activeTab, setActiveTab] = useState<"library" | "create">("library");
  
  // Study viewer state
  const [activeStudy, setActiveStudy] = useState<Study | null>(null);
  const [viewerGame, setViewerGame] = useState<Chess | null>(null);
  const [viewerMoves, setViewerMoves] = useState<string[]>([]);
  const [currentMoveIdx, setCurrentMoveIdx] = useState(-1);

  // Study creator form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [pgn, setPgn] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Setup viewer when study changes
  useEffect(() => {
    if (activeStudy) {
      try {
        const game = new Chess(activeStudy.fen);
        setViewerGame(game);
        
        if (activeStudy.pgn) {
          // Parse PGN to extract individual moves
          const tempGame = new Chess();
          tempGame.loadPgn(activeStudy.pgn);
          setViewerMoves(tempGame.history());
        } else {
          setViewerMoves([]);
        }
        setCurrentMoveIdx(-1);
      } catch (e) {
        console.error("Failed to parse study position/PGN:", e);
      }
    }
  }, [activeStudy]);

  // Navigate through PGN history
  const setHistoryStep = (index: number) => {
    if (!activeStudy || !viewerGame) return;
    try {
      const tempGame = new Chess(activeStudy.fen);
      for (let i = 0; i <= index; i++) {
        tempGame.move(viewerMoves[i]);
      }
      setViewerGame(tempGame);
      setCurrentMoveIdx(index);
    } catch (e) {
      console.error("Failed to step in history:", e);
    }
  };

  // Perform client analysis moves
  const handleAnalysisMove = ({ piece, sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!viewerGame) return false;
    if (!targetSquare) return false;

    const pieceType = piece.pieceType; 
    const isPromotion = 
      (pieceType[1] === "P" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
      (pieceType[1] === "P" && sourceSquare[1] === "2" && targetSquare[1] === "1");

    try {
      const move = viewerGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? "q" : undefined,
      });

      if (move) {
        setViewerGame(new Chess(viewerGame.fen()));
        // If we make a custom move, clear PGN focus index
        setCurrentMoveIdx(-1);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  // Submit study creation
  const handleCreateStudy = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title || !description) {
      setErrorMsg("Please fill out the Title and Description.");
      return;
    }

    try {
      // Validate FEN
      const tempChess = new Chess();
      tempChess.load(fen);

      // Validate PGN if provided
      if (pgn) {
        tempChess.loadPgn(pgn);
      }

      const newStudy: Study = {
        id: `s${studies.length + 1}`,
        title,
        description,
        fen,
        pgn: pgn || undefined,
        creator: "CreatorYou",
        createdAt: new Date().toISOString().split("T")[0],
        likes: 0
      };

      setStudies((prev) => [newStudy, ...prev]);
      setActiveTab("library");
      
      // Reset form
      setTitle("");
      setDescription("");
      setFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
      setPgn("");
    } catch (e) {
      setErrorMsg("Error: Invalid starting FEN or PGN moves list.");
    }
  };

  const handleLikeStudy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStudies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, likes: s.likes + 1 } : s))
    );
    if (activeStudy && activeStudy.id === id) {
      setActiveStudy((prev) => prev ? { ...prev, likes: prev.likes + 1 } : null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {activeStudy ? (
        /* INTERACTIVE STUDY VIEWER */
        <div className="space-y-6">
          <button 
            onClick={() => setActiveStudy(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Studies
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Analysis Chessboard */}
            <div className="lg:col-span-2 flex flex-col justify-center items-center">
              {viewerGame && (
                <div className="w-full max-w-[440px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 glass-panel bg-background">
                  <Chessboard
                    options={{
                      position: viewerGame.fen(),
                      onPieceDrop: handleAnalysisMove,
                      allowDragging: true
                    }}
                  />
                </div>
              )}
            </div>

            {/* Side panel Study Details & PGN review */}
            <div className="glass-card border border-white/10 p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-accent-400 bg-accent-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Study Analysis
                    </span>
                    <button 
                      onClick={(e) => handleLikeStudy(activeStudy.id, e)}
                      className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-xs font-semibold"
                    >
                      <Heart className="w-4 h-4 fill-red-400/10" />
                      {activeStudy.likes}
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-3">{activeStudy.title}</h2>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> By {activeStudy.creator} • {activeStudy.createdAt}
                  </p>
                </div>

                <hr className="border-white/5" />
                <p className="text-slate-300 text-xs leading-relaxed">{activeStudy.description}</p>

                {/* Interactive PGN Viewer moves list */}
                {viewerMoves.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400">Study Moves Line</div>
                    <div className="bg-surface-100/50 border border-white/5 rounded-xl p-3 h-32 overflow-y-auto font-mono text-xs flex flex-wrap gap-2 align-baseline content-start">
                      {viewerMoves.map((move, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHistoryStep(idx)}
                          className={`px-2 py-1 rounded transition-colors ${
                            currentMoveIdx === idx
                              ? "bg-primary-600 text-white font-bold"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}. ` : ""}{move}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const cleanFen = activeStudy.fen;
                    const game = new Chess(cleanFen);
                    setViewerGame(game);
                    setCurrentMoveIdx(-1);
                  }}
                  className="flex-1 py-2.5 bg-surface-200 border border-white/5 text-slate-300 hover:bg-surface-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Reset Position
                </button>
                <button
                  onClick={() => alert(`Share FEN: ${viewerGame?.fen()}`)}
                  className="py-2.5 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl flex items-center justify-center transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN WORKSPACE */
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("library")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "library"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Public Studies
              </button>
              
              <button
                onClick={() => setActiveTab("create")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "create"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Plus className="w-4 h-4" />
                Create Study
              </button>
            </div>
          </div>

          {activeTab === "create" ? (
            /* STUDY CREATOR BOARD PREVIEW PANEL */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <form onSubmit={handleCreateStudy} className="glass-card border border-white/10 p-6 rounded-2xl space-y-4">
                <h3 className="text-xl font-bold text-white mb-2">Create New Study</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Study Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Exploiting the London System"
                    className="w-full bg-surface-100/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Provide context and explain the tactical theme..."
                    className="w-full bg-surface-100/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Starting Position (FEN)</label>
                  <input
                    type="text"
                    value={fen}
                    onChange={(e) => setFen(e.target.value)}
                    className="w-full bg-surface-100/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-300 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">PGN Line (Optional moves catalog)</label>
                  <input
                    type="text"
                    value={pgn}
                    onChange={(e) => setPgn(e.target.value)}
                    placeholder="e.g. 1. e4 e5 2. Nf3 Nc6"
                    className="w-full bg-surface-100/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-300 font-mono"
                  />
                </div>

                {errorMsg && (
                  <div className="text-red-400 text-xs font-semibold bg-red-500/10 border border-red-500/25 p-3 rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                  Publish Study
                </button>
              </form>

              {/* Quick interactive starting preview board */}
              <div className="flex flex-col items-center gap-4">
                <div className="text-sm font-bold text-slate-400">Starting Position Preview</div>
                <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-background">
                  <Chessboard
                    options={{
                      position: fen,
                      allowDragging: false
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* LIBRARY OF STUDIES */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studies.map((study) => (
                <div
                  key={study.id}
                  onClick={() => setActiveStudy(study)}
                  className="glass-card border border-white/10 p-6 rounded-2xl flex flex-col justify-between gap-6 cursor-pointer hover:border-white/20 transition-all hover:scale-[1.02]"
                >
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold text-white line-clamp-1">{study.title}</h4>
                    <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{study.description}</p>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {study.creator}
                    </div>
                    
                    <button
                      onClick={(e) => handleLikeStudy(study.id, e)}
                      className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-xs font-semibold transition-colors"
                    >
                      <Heart className="w-4 h-4 fill-red-400/5 group-hover:fill-red-400/10" />
                      {study.likes}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
