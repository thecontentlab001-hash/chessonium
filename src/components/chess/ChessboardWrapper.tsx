"use client";

import React, { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, Square } from "chess.js";
import { MoveClass } from "./MoveClassBadge";

interface ChessboardWrapperProps {
  game: Chess;
  onMove: (from: string, to: string, promotion?: string) => boolean;
  userColor?: "white" | "black" | "both";
  blindfoldMode?: boolean;
  boardTheme?: "classic" | "glass" | "emerald" | "wood" | "ocean" | "neon" | "midnight";
  highlightMoves?: boolean;
  customArrows?: any[];
  premoves?: Array<{ from: string; to: string; promotion?: string }>;
  premovesEnabled?: boolean;
  onPremove?: (from: string, to: string, promotion?: string) => void;
  onCancelPremove?: () => void;
  orientation?: "white" | "black";
  lastMove?: { from: string; to: string } | null;
  lastMoveClassification?: MoveClass | null;
}

const PROMO_PIECES = [
  { id: "q", label: "Queen",  desc: "Most powerful" },
  { id: "r", label: "Rook",   desc: "Controls files" },
  { id: "b", label: "Bishop", desc: "Long diagonals" },
  { id: "n", label: "Knight", desc: "L-shaped jumps" },
];

export default function ChessboardWrapper({
  game,
  onMove,
  userColor = "white",
  blindfoldMode = false,
  boardTheme = "classic",
  highlightMoves = true,
  customArrows = [],
  premoves = [],
  premovesEnabled = true,
  onPremove,
  onCancelPremove,
  orientation,
  lastMove = null,
  lastMoveClassification = null,
}: ChessboardWrapperProps) {
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [promotionAnimSquare, setPromotionAnimSquare] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ source: string; target: string; color: "w" | "b" } | null>(null);

  // Generate styles for highlighting legal moves
  const getMoveOptions = (square: string) => {
    if (!highlightMoves) return;
    const moves = game.moves({ square: square as Square, verbose: true });
    if (moves.length === 0) { setOptionSquares({}); return; }

    const newSquares: Record<string, React.CSSProperties> = {};
    newSquares[square] = { background: "rgba(255, 255, 255, 0.15)" };
    moves.forEach((move) => {
      newSquares[move.to] = {
        background: game.get(move.to as Square)
          ? "radial-gradient(circle, rgba(239, 68, 68, 0.5) 20%, transparent 20%)"
          : "radial-gradient(circle, rgba(59, 130, 246, 0.5) 20%, transparent 20%)",
        borderRadius: "50%",
        cursor: "pointer",
      };
    });
    setOptionSquares(newSquares);
  };

  // Manage piece drops (drag and drop)
  const onPieceDrop = ({ piece, sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!targetSquare) return false;
    const pieceType = piece.pieceType;

    const isPromotion =
      (pieceType[1] === "P" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
      (pieceType[1] === "P" && sourceSquare[1] === "2" && targetSquare[1] === "1");

    const isMyTurn = userColor === "both" || game.turn() === (userColor === "white" ? "w" : "b");
    if (!isMyTurn) {
      const isPlayerPiece = pieceType[0] === (userColor === "white" ? "w" : "b");
      if (premovesEnabled && isPlayerPiece) {
        onPremove?.(sourceSquare, targetSquare, isPromotion ? "q" : undefined);
        setOptionSquares({});
        setMoveFrom(null);
        return true;
      }
      return false;
    }

    if (isPromotion) {
      setPendingPromotion({ source: sourceSquare, target: targetSquare, color: pieceType[0] as "w" | "b" });
      setOptionSquares({});
      setMoveFrom(null);
      return false;
    }

    const moveSuccessful = onMove(sourceSquare, targetSquare);
    setOptionSquares({});
    setMoveFrom(null);
    return moveSuccessful;
  };

  // Manage square clicks (click-to-move)
  const onSquareClick = ({ square }: { square: string }) => {
    const isMyTurn = userColor === "both" || game.turn() === (userColor === "white" ? "w" : "b");

    if (!isMyTurn) {
      if (premovesEnabled) {
        if (!moveFrom) {
          const piece = game.get(square as Square);
          if (piece && piece.color === (userColor === "white" ? "w" : "b")) {
            setMoveFrom(square);
            setOptionSquares({ [square]: { background: "rgba(239, 68, 68, 0.2)" } });
          }
        } else {
          if (moveFrom === square) { setMoveFrom(null); setOptionSquares({}); return; }
          const piece = game.get(square as Square);
          if (piece && piece.color === (userColor === "white" ? "w" : "b")) {
            setMoveFrom(square);
            setOptionSquares({ [square]: { background: "rgba(239, 68, 68, 0.2)" } });
            return;
          }
          const isPromotion =
            (game.get(moveFrom as Square)?.type === "p" && moveFrom[1] === "7" && square[1] === "8") ||
            (game.get(moveFrom as Square)?.type === "p" && moveFrom[1] === "2" && square[1] === "1");
          onPremove?.(moveFrom, square, isPromotion ? "q" : undefined);
          setMoveFrom(null);
          setOptionSquares({});
        }
      }
      return;
    }

    if (!moveFrom) {
      const piece = game.get(square as Square);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
        getMoveOptions(square);
      }
    } else {
      const isPromotion =
        (game.get(moveFrom as Square)?.type === "p" && moveFrom[1] === "7" && square[1] === "8") ||
        (game.get(moveFrom as Square)?.type === "p" && moveFrom[1] === "2" && square[1] === "1");

      if (isPromotion) {
        setPendingPromotion({ source: moveFrom, target: square, color: game.get(moveFrom as Square)?.color as "w" | "b" });
        setOptionSquares({});
        setMoveFrom(null);
        return;
      }

      const success = onMove(moveFrom, square);
      if (!success) {
        const piece = game.get(square as Square);
        if (piece && piece.color === game.turn()) {
          setMoveFrom(square);
          getMoveOptions(square);
        } else {
          setMoveFrom(null);
          setOptionSquares({});
        }
      } else {
        setMoveFrom(null);
        setOptionSquares({});
      }
    }
  };

  // Custom styling based on chosen theme
  const getThemeStyles = () => {
    switch (boardTheme) {
      case "emerald":  return { dark: "#70a16c", light: "#ececd7" };
      case "wood":     return { dark: "#b58863", light: "#f0d9b5" };
      case "ocean":    return { dark: "#4b7a9e", light: "#d6e8f5" };
      case "midnight": return { dark: "#3d4f6e", light: "#8fa3c8" };
      case "neon":
        return {
          dark: "#1a3a2a", light: "#2a5a3a",
          customDarkSquareStyle:  { backgroundColor: "#1a3a2a", boxShadow: "inset 0 0 8px rgba(74,222,128,0.1)" },
          customLightSquareStyle: { backgroundColor: "#2a5a3a", boxShadow: "inset 0 0 8px rgba(74,222,128,0.05)" },
        };
      case "glass":
        return {
          dark: "rgba(59,130,246,0.25)", light: "rgba(255,255,255,0.05)",
          customDarkSquareStyle:  { backgroundColor: "rgba(59,130,246,0.15)", backdropFilter: "blur(4px)" },
          customLightSquareStyle: { backgroundColor: "rgba(255,255,255,0.03)", backdropFilter: "blur(4px)" },
        };
      default: // Classic
        return { dark: "#769656", light: "#eeeed2" };
    }
  };

  const themeStyles = getThemeStyles();

  // Blindfold mode: hide all pieces
  const customPieces = blindfoldMode
    ? {
        wP: () => <div />, wN: () => <div />, wB: () => <div />, wR: () => <div />, wQ: () => <div />, wK: () => <div />,
        bP: () => <div />, bN: () => <div />, bB: () => <div />, bR: () => <div />, bQ: () => <div />, bK: () => <div />,
      }
    : undefined;

  // Last move highlights
  const lastMoveStyles: Record<string, React.CSSProperties> = {};
  const activeLastMove = lastMove || (() => {
    try {
      const history = game.history({ verbose: true });
      return history.length > 0 ? history[history.length - 1] : null;
    } catch {
      return null;
    }
  })();

  if (activeLastMove) {
    lastMoveStyles[activeLastMove.from] = {
      backgroundColor: "rgba(247, 247, 105, 0.2)",
    };

    if (lastMoveClassification) {
      const colors: Record<MoveClass, string> = {
        brilliant: "rgba(18, 196, 184, 0.25)",
        great: "rgba(27, 172, 166, 0.25)",
        best: "rgba(118, 150, 86, 0.3)",
        excellent: "rgba(150, 188, 75, 0.25)",
        good: "rgba(61, 94, 128, 0.25)",
        book: "rgba(213, 164, 126, 0.25)",
        inaccuracy: "rgba(240, 193, 59, 0.25)",
        mistake: "rgba(229, 143, 42, 0.25)",
        blunder: "rgba(202, 52, 49, 0.3)",
        missed_win: "rgba(127, 127, 127, 0.25)",
      };
      lastMoveStyles[activeLastMove.to] = {
        backgroundColor: colors[lastMoveClassification],
      };
    } else {
      lastMoveStyles[activeLastMove.to] = {
        backgroundColor: "rgba(247, 247, 105, 0.28)",
      };
    }
  }

  // Premove highlights
  const premoveStyles: Record<string, React.CSSProperties> = {};
  premoves.forEach((pm, index) => {
    const opacity = index === 0 ? "0.3" : "0.15";
    premoveStyles[pm.from] = { backgroundColor: `rgba(239, 68, 68, ${opacity})` };
    premoveStyles[pm.to]   = { backgroundColor: `rgba(239, 68, 68, ${opacity})` };
  });
  const combinedSquareStyles = { ...lastMoveStyles, ...optionSquares, ...premoveStyles };

  // Arrow rendering — deduplicate to avoid React key warnings
  const arrowsToRender = [...(customArrows || [])];
  premoves.forEach((pm, index) => {
    const arrowOpacity = Math.max(0.2, 0.85 - index * 0.25);
    arrowsToRender.push([pm.from, pm.to, `rgba(239, 68, 68, ${arrowOpacity})`]);
  });
  // Deduplicate by from+to key (keep last occurrence)
  const seenArrows = new Map<string, any>();
  arrowsToRender.forEach((arrow) => {
    const key = Array.isArray(arrow) ? `${arrow[0]}-${arrow[1]}` : `${arrow.startSquare}-${arrow.endSquare}`;
    seenArrows.set(key, arrow);
  });
  const dedupedArrows = Array.from(seenArrows.values());

  // Promotion logic
  const handlePromotionSelect = (piece: string) => {
    if (pendingPromotion) {
      const success = onMove(pendingPromotion.source, pendingPromotion.target, piece);
      if (success) {
        setPromotionAnimSquare(pendingPromotion.target);
        setTimeout(() => setPromotionAnimSquare(null), 1500);
      }
    }
    setPendingPromotion(null);
  };

  // ── Promotion Dialog ─────────────────────────────────────────────────────
  const renderPendingPromotionDialog = () => {
    if (!pendingPromotion) return null;
    const color = pendingPromotion.color;

    return (
      <div
        className="absolute inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)" }}
        onClick={() => setPendingPromotion(null)}
      >
        <div
          className="bg-[#16181e] border border-white/15 rounded-2xl shadow-2xl p-5 space-y-4"
          style={{ minWidth: "300px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <div className="text-center space-y-0.5">
            <p className="text-white font-bold text-sm">♟ Pawn Promotion!</p>
            <p className="text-slate-500 text-xs">Choose a piece to promote to</p>
          </div>

          {/* 4 piece buttons */}
          <div className="grid grid-cols-4 gap-2">
            {PROMO_PIECES.map((p) => {
              const imgSrc = `https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/piece/cburnett/${color}${p.id.toUpperCase()}.svg`;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePromotionSelect(p.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-primary-500/20 hover:border-primary-500/50 active:scale-95 transition-all group cursor-pointer"
                >
                  <img
                    src={imgSrc}
                    alt={p.label}
                    className="w-11 h-11 drop-shadow-lg group-hover:scale-110 transition-transform"
                  />
                  <div className="text-center">
                    <p className="text-white text-[11px] font-bold leading-none">{p.label}</p>
                    <p className="text-slate-500 text-[9px] mt-0.5">{p.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPendingPromotion(null)}
            className="w-full py-2 text-slate-600 hover:text-slate-400 text-xs transition-colors"
          >
            Cancel (click outside)
          </button>
        </div>
      </div>
    );
  };

  // ── Post-promotion sparkle overlay ────────────────────────────────────────
  const renderPromotionOverlay = () => {
    if (!promotionAnimSquare) return null;
    const file = promotionAnimSquare[0];
    const rank = promotionAnimSquare[1];
    const files = ["a","b","c","d","e","f","g","h"];
    const ranks = ["8","7","6","5","4","3","2","1"];

    let col = files.indexOf(file);
    let row = ranks.indexOf(rank);

    const boardOrientation = orientation || (userColor === "both" ? "white" : userColor);
    if (boardOrientation === "black") { col = 7 - col; row = 7 - row; }

    return (
      <>
        <style>{`
          @keyframes promoteGlowBoard {
            0%   { transform:scale(0.6); box-shadow:0 0 0 0 rgba(168,85,247,0.7),inset 0 0 0 0 rgba(168,85,247,0.7); opacity:0; }
            15%  { opacity:1; transform:scale(1.15); box-shadow:0 0 35px 12px rgba(168,85,247,0.95),inset 0 0 20px 6px rgba(168,85,247,0.95); }
            50%  { transform:scale(1.0); box-shadow:0 0 50px 20px rgba(236,72,153,0.9),inset 0 0 30px 10px rgba(236,72,153,0.9); }
            100% { transform:scale(1.3); box-shadow:0 0 0 0 rgba(59,130,246,0),inset 0 0 0 0 rgba(59,130,246,0); opacity:0; }
          }
          @keyframes sparklerBoard {
            0%   { transform:translate(0,0) scale(0); opacity:0; }
            50%  { opacity:1; }
            100% { transform:translate(var(--tx),var(--ty)) scale(1.3); opacity:0; }
          }
        `}</style>
        <div className="absolute inset-0 pointer-events-none z-40 grid grid-cols-8 grid-rows-8">
          <div
            style={{ gridColumnStart: col + 1, gridRowStart: row + 1 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            <div className="absolute w-[95%] h-[95%] rounded-xl"
              style={{ animation: "promoteGlowBoard 1.3s cubic-bezier(0.25,1,0.5,1) forwards" }}
            />
            {[
              { x:"-40px", y:"-40px", delay:"0s"    },
              { x:"40px",  y:"-40px", delay:"0.1s"  },
              { x:"-50px", y:"10px",  delay:"0.05s" },
              { x:"50px",  y:"15px",  delay:"0.15s" },
              { x:"-20px", y:"50px",  delay:"0.2s"  },
              { x:"20px",  y:"50px",  delay:"0.08s" },
            ].map((sparkle, idx) => (
              <div
                key={idx}
                className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500"
                style={{ "--tx": sparkle.x, "--ty": sparkle.y, animation: `sparklerBoard 0.8s ease-out ${sparkle.delay} forwards` } as any}
              />
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 glass-panel relative"
      style={{ maxWidth: "560px", aspectRatio: "1 / 1" }}
    >
      {renderPendingPromotionDialog()}
      {renderPromotionOverlay()}
      <Chessboard
        options={{
          position: game.fen(),
          onPieceDrop,
          onSquareClick,
          onSquareRightClick: () => {
            onCancelPremove?.();
            setOptionSquares({});
            setMoveFrom(null);
          },
          canDragPiece: ({ piece }) => {
            if (userColor === "both") return true;
            return piece.pieceType[0] === (userColor === "white" ? "w" : "b");
          },
          boardOrientation: orientation || (userColor === "both" ? "white" : userColor),
          darkSquareStyle:  themeStyles.customDarkSquareStyle  || { backgroundColor: themeStyles.dark },
          lightSquareStyle: themeStyles.customLightSquareStyle || { backgroundColor: themeStyles.light },
          squareStyles: combinedSquareStyles,
          pieces: customPieces,
          allowDragging: true,
          animationDurationInMs: 200,
          arrows: dedupedArrows.map((arrow) => {
            if (Array.isArray(arrow)) {
              return { startSquare: arrow[0], endSquare: arrow[1], color: arrow[2] || "rgba(34,197,94,0.75)" };
            }
            return arrow;
          }),
        }}
      />
    </div>
  );
}
