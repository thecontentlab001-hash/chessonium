"use client";

import React, { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, PieceSymbol, Color, Square } from "chess.js";
import { Trash2, RotateCcw, Copy, Check } from "lucide-react";

interface BoardEditorProps {
  onFenChange: (fen: string) => void;
  initialFen?: string;
}

export default function BoardEditor({
  onFenChange,
  initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
}: BoardEditorProps) {
  const [fen, setFen] = useState(initialFen);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null); // e.g. 'wP', 'bK'
  const [activeTool, setActiveTool] = useState<"place" | "erase">("place");
  const [copied, setCopied] = useState(false);

  // Helper to load FEN and perform mutations safely
  const mutateBoard = (callback: (game: Chess) => void) => {
    try {
      const tempGame = new Chess();
      tempGame.load(fen);
      callback(tempGame);
      const newFen = tempGame.fen();
      setFen(newFen);
      onFenChange(newFen);
    } catch (e) {
      console.warn("Invalid chess state during edit:", e);
    }
  };

  const handleSquareClick = ({ square }: { square: string }) => {
    if (activeTool === "erase") {
      mutateBoard((g) => {
        g.remove(square as Square);
      });
    } else if (selectedPiece) {
      const color = selectedPiece[0] as Color;
      const type = selectedPiece[1].toLowerCase() as PieceSymbol;
      
      mutateBoard((g) => {
        g.remove(square as Square);
        g.put({ type, color }, square as Square);
      });
    }
  };

  const clearBoard = () => {
    const emptyFen = "8/8/8/8/8/8/8/8 w - - 0 1";
    setFen(emptyFen);
    onFenChange(emptyFen);
  };

  const resetBoard = () => {
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    setFen(startFen);
    onFenChange(startFen);
  };

  const handleFenInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFen = e.target.value;
    setFen(inputFen);
    try {
      const tempGame = new Chess();
      tempGame.load(inputFen);
      onFenChange(inputFen);
    } catch {
      // Silently wait for user to finish typing valid FEN
    }
  };

  const copyFen = () => {
    navigator.clipboard.writeText(fen);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pieces = [
    { name: "wP", label: "♙", type: "place" },
    { name: "wN", label: "♘", type: "place" },
    { name: "wB", label: "♗", type: "place" },
    { name: "wR", label: "♖", type: "place" },
    { name: "wQ", label: "♕", type: "place" },
    { name: "wK", label: "♔", type: "place" },
    { name: "bP", label: "♟", type: "place" },
    { name: "bN", label: "➂", type: "place" },
    { name: "bB", label: "♝", type: "place" },
    { name: "bR", label: "♜", type: "place" },
    { name: "bQ", label: "♛", type: "place" },
    { name: "bK", label: "♚", type: "place" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center max-w-4xl mx-auto p-6 glass-card border border-white/10 rounded-2xl">
      <div 
        className="w-full rounded-xl overflow-hidden shadow-xl border border-white/5"
        style={{ maxWidth: "400px", aspectRatio: "1 / 1" }}
      >
        <Chessboard
          options={{
            position: fen,
            onSquareClick: handleSquareClick,
            allowDragging: false
          }}
        />
      </div>

      <div className="flex-1 space-y-6 w-full">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Custom Board Editor</h3>
          <p className="text-slate-400 text-sm">Select a piece and click on any square to place it, or use the eraser tool.</p>
        </div>

        {/* Piece Selection Tray */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-300">White Pieces</div>
          <div className="flex gap-2">
            {pieces.slice(0, 6).map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setSelectedPiece(p.name);
                  setActiveTool("place");
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl font-bold border transition-all ${
                  selectedPiece === p.name && activeTool === "place"
                    ? "bg-primary-500 border-primary-400 text-white shadow-lg shadow-primary-500/25 scale-110"
                    : "bg-surface-200 border-white/5 text-slate-200 hover:bg-surface-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-sm font-semibold text-slate-300">Black Pieces</div>
          <div className="flex gap-2">
            {pieces.slice(6).map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setSelectedPiece(p.name);
                  setActiveTool("place");
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl font-bold border transition-all ${
                  selectedPiece === p.name && activeTool === "place"
                    ? "bg-primary-500 border-primary-400 text-white shadow-lg shadow-primary-500/25 scale-110"
                    : "bg-surface-200 border-white/5 text-slate-200 hover:bg-surface-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => setActiveTool("erase")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              activeTool === "erase"
                ? "bg-red-500/20 border-red-500 text-red-400"
                : "bg-surface-200 border-white/5 text-slate-300 hover:bg-surface-300"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Eraser
          </button>
          
          <button
            onClick={clearBoard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-surface-200 border border-white/5 text-slate-300 hover:bg-surface-300 transition-colors"
          >
            Clear Board
          </button>

          <button
            onClick={resetBoard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-surface-200 border border-white/5 text-slate-300 hover:bg-surface-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Default
          </button>
        </div>

        {/* FEN Output */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 block">FEN string</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={fen}
              onChange={handleFenInput}
              className="flex-1 bg-surface-100/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
            <button
              onClick={copyFen}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
