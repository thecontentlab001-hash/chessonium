import { Chess } from "chess.js";
import { seedOpenings } from "../openings";

export type MoveClass =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "missed_win";

export interface PositionalAnalysis {
  materialBalance: {
    white: number;
    black: number;
    diff: number;
  };
  kingSafety: {
    whiteScore: number;
    blackScore: number;
    whiteStatus: string;
    blackStatus: string;
  };
  pieceActivity: {
    whiteActivePieces: number;
    blackActivePieces: number;
    description: string;
  };
  pawnStructure: {
    whiteDoubled: number;
    blackDoubled: number;
    whiteIsolated: number;
    blackIsolated: number;
    description: string;
  };
  threats: string[];
}

export interface PositionData {
  fenBefore: string;
  fenAfter: string;
  playedMove: string; // SAN format (e.g. "Nf3")
  playedMoveUci: string; // UCI format (e.g. "g1f3")
  bestMove: string; // UCI format (e.g. "g1f3")
  bestMoveSan: string; // SAN format (e.g. "Nf3")
  cpBefore: number; // evaluation before the move (from side-to-move perspective)
  cpAfter: number; // evaluation after the move (from mover's perspective)
  cpLoss: number;
  tacticalMotifs: string[];
  positional: PositionalAnalysis;
  alternativeMoves?: Array<{ move: string; score: number; type: "cp" | "mate" }>;
  previousMoveSan?: string;
  previousMoveUci?: string;
}

export interface CoachExplanation {
  whatHappened: string;
  whyGoodOrBad: string;
  whatWasMissed: string;
  bestContinuation: string;
}

// Helper to get squares of all pieces for a color
function getPieceSquares(chess: Chess, color: "w" | "b"): string[] {
  const squares: string[] = [];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  for (let r = 1; r <= 8; r++) {
    for (const f of files) {
      const sq = `${f}${r}`;
      const piece = chess.get(sq as any);
      if (piece && piece.color === color) {
        squares.push(sq);
      }
    }
  }
  return squares;
}

// Helper to find the king square
function getKingSquare(chess: Chess, color: "w" | "b"): string | null {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  for (let r = 1; r <= 8; r++) {
    for (const f of files) {
      const sq = `${f}${r}`;
      const piece = chess.get(sq as any);
      if (piece && piece.color === color && piece.type === "k") {
        return sq;
      }
    }
  }
  return null;
}

/**
 * Count total material points for a color.
 * Pieces: Q=9, R=5, B=3, N=3, P=1.
 */
export function countMaterial(fen: string, color: "w" | "b"): number {
  const piecePart = fen.split(" ")[0];
  const pieces = color === "w"
    ? piecePart.match(/[QRBNP]/g) || []
    : piecePart.match(/[qrbnp]/g) || [];
  const values: Record<string, number> = { Q: 9, R: 5, B: 3, N: 3, P: 1, q: 9, r: 5, b: 3, n: 3, p: 1 };
  return pieces.reduce((sum, p) => sum + (values[p] ?? 0), 0);
}

/**
 * Checks if the played move offered a sacrifice (is hanging or attacked by lower-value piece).
 */
export function isMovedPieceSacrificed(
  fenBefore: string,
  fenAfter: string,
  playedMoveSan: string,
  moverColor: "w" | "b"
): boolean {
  try {
    const tempBefore = new Chess(fenBefore);
    const m = tempBefore.move(playedMoveSan);
    if (!m) return false;

    const targetSquare = m.to;
    const pieceType = m.piece.toLowerCase();

    const temp = new Chess(fenAfter);
    const opponentMoves = temp.moves({ verbose: true });

    // Check if the opponent can capture our moved piece on targetSquare
    const canBeCaptured = opponentMoves.some(om => om.to === targetSquare && om.captured);
    if (!canBeCaptured) return false;

    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
    const movedValue = pieceValues[pieceType] || 0;

    // If we captured something during our move:
    if (m.captured) {
      const capturedValue = pieceValues[m.captured.toLowerCase()] || 0;
      // If we captured a piece of equal or greater value, it is not a sacrifice
      if (capturedValue >= movedValue) return false;
      return true; // e.g. Bishop captures Pawn, Bishop is now capturable on target square.
    }

    // If we captured nothing:
    const isDefended = temp.isAttacked(targetSquare, moverColor);

    // If not defended, it is hanging (sacrifice!)
    if (!isDefended) return true;

    // If defended, check if opponent can capture with a lower-value piece
    const lowerValueAttacker = opponentMoves.some(om => {
      if (om.to !== targetSquare || !om.captured) return false;
      const attackerType = om.piece.toLowerCase();
      return pieceValues[attackerType] < movedValue;
    });

    return lowerValueAttacker;
  } catch {
    return false;
  }
}

/**
 * Layer 2: Position Analysis
 */
export function analyzePosition(
  fenBefore: string,
  fenAfter: string,
  playedMoveSan: string,
  playedMoveUci: string,
  moverColor: "w" | "b"
): { positional: PositionalAnalysis; motifs: string[] } {
  const chessBefore = new Chess(fenBefore);
  const chessAfter = new Chess(fenAfter);

  // 1. Material balance
  const matBeforeW = countMaterial(fenBefore, "w");
  const matBeforeB = countMaterial(fenBefore, "b");
  const matAfterW = countMaterial(fenAfter, "w");
  const matAfterB = countMaterial(fenAfter, "b");

  const materialBalance = {
    white: matAfterW,
    black: matAfterB,
    diff: matAfterW - matAfterB
  };

  // 2. King safety
  const evaluateKingSafety = (chess: Chess, color: "w" | "b") => {
    const kingSq = getKingSquare(chess, color);
    if (!kingSq) return { score: 50, status: "Unknown" };

    let score = 80;
    const file = kingSq[0];
    const rank = parseInt(kingSq[1]);

    const isCastled = (color === "w" && rank === 1 && (file === "g" || file === "c")) ||
                      (color === "b" && rank === 8 && (file === "g" || file === "c"));
    if (isCastled) score += 15;

    const isCenter = (file === "d" || file === "e") && (rank === 4 || rank === 5 || rank === 1 || rank === 8);
    if (isCenter && !isCastled) score -= 25;

    const fileIdx = file.charCodeAt(0) - 97;
    const startFile = Math.max(0, fileIdx - 1);
    const endFile = Math.min(7, fileIdx + 1);
    const shieldRank = color === "w" ? rank + 1 : rank - 1;

    let shieldPawns = 0;
    for (let f = startFile; f <= endFile; f++) {
      const fChar = String.fromCharCode(97 + f);
      const pawnSq = `${fChar}${shieldRank}`;
      const p = chess.get(pawnSq as any);
      if (p && p.type === "p" && p.color === color) {
        shieldPawns++;
      }
    }

    score += shieldPawns * 5;
    if (shieldPawns === 0 && !isCastled) score -= 20;

    score = Math.max(10, Math.min(100, score));

    let status = "Safe";
    if (score < 40) status = "Exposed";
    else if (score < 70) status = "Moderate";

    return { score, status };
  };

  const kingSafety = {
    whiteScore: evaluateKingSafety(chessAfter, "w").score,
    blackScore: evaluateKingSafety(chessAfter, "b").score,
    whiteStatus: evaluateKingSafety(chessAfter, "w").status,
    blackStatus: evaluateKingSafety(chessAfter, "b").status,
  };

  // 3. Piece activity
  const evaluatePieceActivity = () => {
    const turn = chessAfter.turn();
    const activeMoves = chessAfter.moves().length;

    const fen = chessAfter.fen();
    const parts = fen.split(" ");
    parts[1] = parts[1] === "w" ? "b" : "w";
    const otherFen = parts.join(" ");

    let otherMoves = 0;
    try {
      const temp = new Chess(otherFen);
      otherMoves = temp.moves().length;
    } catch {}

    const whiteMoves = turn === "w" ? activeMoves : otherMoves;
    const blackMoves = turn === "b" ? activeMoves : otherMoves;

    let description = "Both sides have balanced piece activity.";
    if (Math.abs(whiteMoves - blackMoves) > 12) {
      description = whiteMoves > blackMoves
        ? "White's pieces are significantly more active and control more space."
        : "Black's pieces are significantly more active and control more space.";
    } else if (Math.abs(whiteMoves - blackMoves) > 5) {
      description = whiteMoves > blackMoves
        ? "White has a slight development and spatial advantage."
        : "Black has a slight development and spatial advantage.";
    }

    return {
      whiteActivePieces: whiteMoves,
      blackActivePieces: blackMoves,
      description
    };
  };

  const pieceActivity = evaluatePieceActivity();

  // 4. Pawn Structure
  const evaluatePawnStructure = () => {
    const wPawns = getPieceSquares(chessAfter, "w").filter(sq => chessAfter.get(sq as any)?.type === "p");
    const bPawns = getPieceSquares(chessAfter, "b").filter(sq => chessAfter.get(sq as any)?.type === "p");

    const countPawnsByFile = (pawns: string[]) => {
      const counts: Record<string, number> = {};
      pawns.forEach(p => {
        const file = p[0];
        counts[file] = (counts[file] || 0) + 1;
      });
      return counts;
    };

    const wFileCounts = countPawnsByFile(wPawns);
    const bFileCounts = countPawnsByFile(bPawns);

    let wDoubled = 0;
    Object.values(wFileCounts).forEach(c => { if (c > 1) wDoubled += (c - 1); });

    let bDoubled = 0;
    Object.values(bFileCounts).forEach(c => { if (c > 1) bDoubled += (c - 1); });

    let wIsolated = 0;
    Object.keys(wFileCounts).forEach(f => {
      const idx = f.charCodeAt(0) - 97;
      const leftFile = idx > 0 ? String.fromCharCode(97 + idx - 1) : null;
      const rightFile = idx < 7 ? String.fromCharCode(97 + idx + 1) : null;
      const hasLeft = leftFile ? wFileCounts[leftFile] > 0 : false;
      const hasRight = rightFile ? wFileCounts[rightFile] > 0 : false;
      if (!hasLeft && !hasRight) {
        wIsolated += wFileCounts[f];
      }
    });

    let bIsolated = 0;
    Object.keys(bFileCounts).forEach(f => {
      const idx = f.charCodeAt(0) - 97;
      const leftFile = idx > 0 ? String.fromCharCode(97 + idx - 1) : null;
      const rightFile = idx < 7 ? String.fromCharCode(97 + idx + 1) : null;
      const hasLeft = leftFile ? bFileCounts[leftFile] > 0 : false;
      const hasRight = rightFile ? bFileCounts[rightFile] > 0 : false;
      if (!hasLeft && !hasRight) {
        bIsolated += bFileCounts[f];
      }
    });

    let description = "Pawn structures are symmetric and healthy.";
    if (wDoubled > bDoubled + 1 || wIsolated > bIsolated + 1) {
      description = "White has structural weaknesses, including doubled or isolated pawns.";
    } else if (bDoubled > wDoubled + 1 || bIsolated > wIsolated + 1) {
      description = "Black has structural weaknesses, including doubled or isolated pawns.";
    }

    return {
      whiteDoubled: wDoubled,
      blackDoubled: bDoubled,
      whiteIsolated: wIsolated,
      blackIsolated: bIsolated,
      description
    };
  };

  const pawnStructure = evaluatePawnStructure();

  // 5. Tactical motifs & Threat creation
  const motifs: string[] = [];
  try {
    const verboseMoves = chessBefore.moves({ verbose: true });
    const playedMove = verboseMoves.find(m => m.san === playedMoveSan || (m.from + m.to) === playedMoveUci.slice(0, 4));

    if (playedMove) {
      const toSquare = playedMove.to;
      const pieceType = playedMove.piece;
      const opponentColor = moverColor === "w" ? "b" : "w";
      const opponentPieces = getPieceSquares(chessAfter, opponentColor);

      // Checkmate/Check
      if (chessAfter.inCheck()) {
        if (chessAfter.isGameOver() && chessAfter.isCheckmate()) {
          motifs.push("Checkmate");
        } else {
          motifs.push("Check");
        }
      }

      // Promotion
      if (playedMove.promotion) {
        if (playedMove.promotion !== "q") motifs.push("Underpromotion");
        else motifs.push("Pawn Promotion");
      }

      // Capture
      if (playedMove.captured) {
        const pieceNames: Record<string, string> = { p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen" };
        const capName = pieceNames[playedMove.captured.toLowerCase()] || "Piece";
        motifs.push(`Captured ${capName}`);
      }

      // Pin Check (Mover pins opponent piece to king or queen)
      for (const sq of opponentPieces) {
        const piece = chessAfter.get(sq as any);
        if (piece && piece.type !== "k") {
          const tempChess = new Chess(chessAfter.fen());
          tempChess.remove(sq as any);
          const oppKingSq = getKingSquare(tempChess, opponentColor);
          if (oppKingSq) {
            if (tempChess.isAttacked(oppKingSq as any, moverColor)) {
              motifs.push("Pin");
              break;
            }
          }
        }
      }

      // Fork Check
      let attackedCount = 0;
      const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
      for (const sq of opponentPieces) {
        if (chessAfter.isAttacked(sq as any, moverColor)) {
          const tempChess = new Chess(chessAfter.fen());
          tempChess.remove(toSquare as any);
          const stillAttacked = tempChess.isAttacked(sq as any, moverColor);
          if (!stillAttacked) {
            const targetPiece = chessAfter.get(sq as any);
            const targetValue = targetPiece ? pieceValues[targetPiece.type] : 0;
            const movedValue = pieceValues[pieceType];
            const isTargetDefended = chessAfter.isAttacked(sq as any, opponentColor);

            if (!isTargetDefended || targetValue > movedValue || targetPiece?.type === "k") {
              attackedCount++;
            }
          }
        }
      }
      if (attackedCount >= 2) {
        motifs.push("Fork");
      }

      // Threat Creation: check if the mover threatens mate on next move, or attacks a hanging piece
      // If we change turn back to mover, and they can deliver checkmate or win major material next move
      const tempMoverTurn = new Chess(chessAfter.fen());
      const parts = tempMoverTurn.fen().split(" ");
      parts[1] = moverColor;
      tempMoverTurn.load(parts.join(" "));
      const nextMoves = tempMoverTurn.moves({ verbose: true });
      const canMateNext = nextMoves.some(nm => {
        try {
          const c = new Chess(tempMoverTurn.fen());
          c.move(nm.san);
          return c.isGameOver() && c.isCheckmate();
        } catch { return false; }
      });
      if (canMateNext) {
        motifs.push("Mate Threat");
      }
    }
  } catch (err) {
    console.error("Motif detection error:", err);
  }

  return {
    positional: {
      materialBalance,
      kingSafety,
      pieceActivity,
      pawnStructure,
      threats: motifs.filter(m => m.includes("Threat") || m === "Pin" || m === "Fork")
    },
    motifs
  };
}

/**
 * Opening detector: matches move coordinate sequences.
 */
export function detectOpening(playedMovesSequence: string[]): { name: string; eco: string } {
  let longestMatch: typeof seedOpenings[0] | null = null;

  for (const op of seedOpenings) {
    // Check if op.movesSequence is a prefix of playedMovesSequence
    const matches = op.movesSequence.every((m, idx) => playedMovesSequence[idx] === m);
    if (matches) {
      if (!longestMatch || op.movesSequence.length > longestMatch.movesSequence.length) {
        longestMatch = op;
      }
    }
  }

  if (longestMatch) {
    return { name: longestMatch.name, eco: longestMatch.eco };
  }

  return { name: "Custom Opening / Unknown", eco: "A00" };
}

/**
 * Detects if a move offered a sacrifice (material, exchange, or temporary).
 * Also returns whether it is a piece sacrifice (net value offered >= 2).
 */
export function detectSacrifice(
  fenBefore: string,
  fenAfter: string,
  playedMoveSan: string,
  playedMoveUci: string,
  moverColor: "w" | "b"
): { isSacrifice: boolean; isPieceSacrifice: boolean } {
  try {
    const chessBefore = new Chess(fenBefore);
    const m = chessBefore.move(playedMoveSan);
    if (!m) return { isSacrifice: false, isPieceSacrifice: false };

    const targetSquare = m.to;
    const pieceType = m.piece.toLowerCase();
    const chessAfter = new Chess(fenAfter);
    const opponentColor = moverColor === "w" ? "b" : "w";
    const opponentMoves = chessAfter.moves({ verbose: true });

    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

    // 1. Check if the moved piece itself is sacrificed
    const movedPieceCanBeCaptured = opponentMoves.some(om => om.to === targetSquare && om.captured);
    if (movedPieceCanBeCaptured) {
      const attackerTypes = opponentMoves
        .filter(om => om.to === targetSquare && om.captured)
        .map(om => om.piece.toLowerCase());
      const movedValue = pieceValues[pieceType] || 0;

      let capturedValue = 0;
      if (m.captured) {
        capturedValue = pieceValues[m.captured.toLowerCase()] || 0;
      }

      const netValueOffered = movedValue - capturedValue;
      if (netValueOffered > 0) {
        const isDefended = chessAfter.isAttacked(targetSquare, moverColor);
        if (!isDefended) {
          return { isSacrifice: true, isPieceSacrifice: movedValue >= 3 };
        }

        const attackedByLower = attackerTypes.some(at => pieceValues[at] < movedValue);
        if (attackedByLower) {
          return { isSacrifice: true, isPieceSacrifice: netValueOffered >= 2 };
        }
      }
    }

    // 2. Check if another piece of ours is left hanging or under-defended (exchange sacrifice)
    const ourPieces = getPieceSquares(chessAfter, moverColor);
    for (const sq of ourPieces) {
      const piece = chessAfter.get(sq as any);
      if (!piece || piece.type === "k" || sq === targetSquare) continue;

      const pieceVal = pieceValues[piece.type];
      const isAttacked = chessAfter.isAttacked(sq as any, opponentColor);
      if (isAttacked) {
        const canBeCaptured = opponentMoves.some(om => om.to === sq && om.captured);
        if (canBeCaptured) {
          const isDefended = chessAfter.isAttacked(sq as any, moverColor);
          if (!isDefended) {
            return { isSacrifice: true, isPieceSacrifice: pieceVal >= 3 };
          }
          const attackers = opponentMoves
            .filter(om => om.to === sq && om.captured)
            .map(om => om.piece.toLowerCase());
          const attackedByLower = attackers.some(at => pieceValues[at] < pieceVal);
          if (attackedByLower) {
            const minAttackerVal = Math.min(...attackers.map(at => pieceValues[at]));
            return { isSacrifice: true, isPieceSacrifice: (pieceVal - minAttackerVal) >= 2 };
          }
        }
      }
    }
  } catch {
    return { isSacrifice: false, isPieceSacrifice: false };
  }
  return { isSacrifice: false, isPieceSacrifice: false };
}

/**
 * Checks if a move is an obvious recapture of the opponent's previous move.
 */
function isObviousRecapture(data: PositionData): boolean {
  const { playedMove, playedMoveUci, previousMoveUci } = data;
  if (!previousMoveUci) return false;

  const isCapture = playedMove.includes("x");
  if (!isCapture) return false;

  const prevDest = previousMoveUci.slice(2, 4);
  const currentDest = playedMoveUci.slice(2, 4);

  return prevDest === currentDest;
}

/**
 * Measures human difficulty for finding a move.
 */
function isMoveDifficultForHuman(data: PositionData): boolean {
  const { fenBefore, playedMove, alternativeMoves } = data;

  let candidateMovesCount = 20;
  try {
    const chess = new Chess(fenBefore);
    candidateMovesCount = chess.moves().length;
  } catch {}

  if (candidateMovesCount < 12) {
    return false;
  }

  const hasTacticalMotif = data.tacticalMotifs.length > 0;

  let isOnlyWinningMove = false;
  if (alternativeMoves && alternativeMoves.length > 1) {
    const bestScore = alternativeMoves[0].score;
    const secondBestScore = alternativeMoves[1].score;
    if (bestScore - secondBestScore >= 130) {
      isOnlyWinningMove = true;
    }
  }

  const isSimpleCheck = playedMove.includes("+");

  return (isOnlyWinningMove || (candidateMovesCount >= 18 && hasTacticalMotif)) && !isSimpleCheck;
}

function getPieceCount(fen: string): number {
  const piecesPart = fen.split(" ")[0];
  const matches = piecesPart.match(/[qrbnQRBN]/g);
  return matches ? matches.length : 0;
}

/**
 * Layer 3: Move Classifier
 */
export function classifyMove(
  data: PositionData,
  moveIdx: number,
  playerRating: number = 1400
): MoveClass {
  const {
    fenBefore,
    fenAfter,
    playedMove,
    playedMoveUci,
    bestMove,
    cpBefore,
    cpAfter,
    cpLoss,
    tacticalMotifs,
    alternativeMoves
  } = data;

  const isWhiteMove = moveIdx % 2 === 0;
  const moverColor = isWhiteMove ? "w" : "b";

  // ── 1. Book Move ──
  // Check if we are in book (first 10 moves of opening matches)
  if (moveIdx < 10) {
    const inBook = seedOpenings.some(op => {
      if (moveIdx >= op.movesSequence.length) return false;
      return op.movesSequence[moveIdx] === playedMoveUci;
    });
    if (inBook) return "book";
  }

  const legalMovesCount = (() => {
    try {
      const c = new Chess(fenBefore);
      return c.moves().length;
    } catch {
      return 20;
    }
  })();

  const sacResult = detectSacrifice(fenBefore, fenAfter, playedMove, playedMoveUci, moverColor);
  const isRecap = isObviousRecapture(data);

  // ── 2. Brilliant Move Detections ──
  const isTriviallyWinning = cpBefore >= 350 || cpBefore > 20000;
  const isEndgame = getPieceCount(fenBefore) <= 4;
  const isForcedMove = legalMovesCount === 1;

  if (
    moveIdx >= 10 &&
    !isRecap &&
    !isForcedMove &&
    !isTriviallyWinning &&
    playedMoveUci === bestMove &&
    cpAfter >= -50
  ) {
    if (sacResult.isSacrifice && sacResult.isPieceSacrifice) {
      const hasManyCandidates = legalMovesCount >= 15;
      const passEndgameCheck = !isEndgame || !/^[KkPp]/.test(playedMove);

      if (hasManyCandidates && passEndgameCheck) {
        return "brilliant";
      }
    }
  }

  // ── 3. Great Move Detections ──
  const isOnlyMove = alternativeMoves && alternativeMoves.length > 1 &&
    (alternativeMoves[0].score - alternativeMoves[1].score >= 130) &&
    playedMoveUci === bestMove;

  const savesLosing = cpBefore <= -150 && cpAfter >= -50;
  const resolvedThreat = cpBefore < -100 && cpAfter >= cpBefore + 80;
  const isDifficult = isMoveDifficultForHuman(data);

  if (
    moveIdx >= 10 &&
    (playedMoveUci === bestMove || cpLoss <= 10) &&
    cpLoss <= 10 &&
    !sacResult.isSacrifice &&
    (isOnlyMove || savesLosing || resolvedThreat || isDifficult)
  ) {
    return "great";
  }

  // ── 4. Best Move Detections ──
  if (playedMoveUci === bestMove || cpLoss <= 10) {
    return "best";
  }

  // ── 5. Missed Win Detections ──
  const bestIsMate = cpBefore > 20000;
  const bestIsWinning = cpBefore >= 350;
  const playedIsDrawnOrLost = cpAfter <= 90;

  if ((bestIsMate || bestIsWinning) && playedIsDrawnOrLost && cpLoss >= 200) {
    return "missed_win";
  }

  // ── 6. Standard Evaluation Classifications ──
  if (cpLoss <= 25) {
    return "excellent";
  }

  if (cpLoss <= 55) {
    return "good";
  }

  if (cpLoss <= 130) {
    return "inaccuracy";
  }

  if (cpLoss <= 280) {
    return "mistake";
  }

  return "blunder";
}

/**
 * Sigmoid conversion from cp eval to win percentage
 */
function cpToWinPct(cp: number): number {
  const clamped = Math.max(-1000, Math.min(1000, cp));
  return 50 + 50 * Math.tanh(clamped / 290);
}

/**
 * Accuracy system (0-100 score) based on centipawn loss, move quality, complexity,
 * tactical difficulty, and endgame precision.
 */
export function calculateAccuracy(
  moves: Array<{ cpBefore: number; cpAfter: number; cpLoss: number; classification: MoveClass; fenBefore: string }>,
  isWhite: boolean
): number {
  const subjectMoves = moves.filter((_, idx) => (idx % 2 === 0) === isWhite);
  if (subjectMoves.length === 0) return 100;

  let totalWinPctLoss = 0;
  let classScoreSum = 0;

  // Chess.com move weight mapping for move quality distribution
  const classWeights: Record<MoveClass, number> = {
    brilliant: 1.0,
    great: 1.0,
    best: 1.0,
    excellent: 0.95,
    good: 0.85,
    book: 1.0,
    inaccuracy: 0.55,
    mistake: 0.30,
    missed_win: 0.20,
    blunder: 0.02
  };

  subjectMoves.forEach(m => {
    const winBefore = cpToWinPct(m.cpBefore);
    const winAfter = cpToWinPct(m.cpAfter);
    let winPctLoss = Math.max(0, winBefore - winAfter);

    // Apply complexity & endgame penalties
    const fenParts = m.fenBefore.split(" ");
    const activePiecesCount = (fenParts[0].match(/[qrbnQRBN]/g) || []).length;
    const isEndgame = activePiecesCount <= 4; // few major pieces left

    // Endgame Blunder Penalty: blunders in endgames are highly penalized
    if (isEndgame && (m.classification === "blunder" || m.classification === "missed_win")) {
      winPctLoss *= 1.35; // increase loss penalty for endgame blunders
    }

    totalWinPctLoss += winPctLoss;
    classScoreSum += classWeights[m.classification];
  });

  const avgWinPctLoss = totalWinPctLoss / subjectMoves.length;

  // Chess.com style accuracy scale based on Centipawn / Win Pct drop
  const accuracyCp = 103.1668 * Math.exp(-0.04354 * avgWinPctLoss) - 3.1669;
  
  // Discrete classification distribution score
  const accuracyClass = (classScoreSum / subjectMoves.length) * 100;

  // Blend both systems: 30% CP drop, 70% move classification weights
  const finalAccuracy = 0.3 * accuracyCp + 0.7 * accuracyClass;

  return Math.max(0, Math.min(100, parseFloat(finalAccuracy.toFixed(1))));
}

/**
 * Human Explanation Coach Engine
 */
export function generateExplanation(
  data: PositionData,
  openingName: string = "the opening",
  paramClassification?: MoveClass
): CoachExplanation {
  const {
    playedMove,
    bestMoveSan,
    cpBefore,
    cpAfter,
    cpLoss,
    tacticalMotifs,
    positional
  } = data;

  const classification = paramClassification || classifyMove(data, 0);

  let whatHappened = "";
  let whyGoodOrBad = "";
  let whatWasMissed = "";
  let bestContinuation = "";

  // 1. WHAT HAPPENED
  switch (classification) {
    case "brilliant":
      whatHappened = `You played a brilliant piece sacrifice with ${playedMove}!`;
      break;
    case "great":
      whatHappened = `You found a key resource by playing ${playedMove}.`;
      break;
    case "best":
    case "excellent":
      whatHappened = `${playedMove} is a very strong and active move, putting pressure on the board.`;
      break;
    case "good":
      whatHappened = `You played ${playedMove}, which maintains the balance in this position.`;
      break;
    case "book":
      whatHappened = `${playedMove} is part of the established book theory in ${openingName}.`;
      break;
    case "inaccuracy":
      whatHappened = `You played ${playedMove}, which is slightly passive.`;
      break;
    case "mistake":
      whatHappened = `${playedMove} was a mistake that gives away some of your control in this area.`;
      break;
    case "blunder":
      whatHappened = `Blunder! You played ${playedMove}, which misses a tactical threat or drops critical material.`;
      break;
    case "missed_win":
      whatHappened = `You played ${playedMove}, but you missed a major winning opportunity here.`;
      break;
  }

  // 2. WHY GOOD OR BAD
  const hasFork = tacticalMotifs.includes("Fork");
  const hasPin = tacticalMotifs.includes("Pin");
  const hasCheck = tacticalMotifs.includes("Check");
  const hasCheckmate = tacticalMotifs.includes("Checkmate");

  if (["blunder", "mistake", "inaccuracy", "missed_win"].includes(classification)) {
    if (hasFork) {
      whyGoodOrBad = "You overlooked a fork on your pieces. This allows the opponent to attack multiple targets simultaneously, resulting in a forced loss of material.";
    } else if (hasPin) {
      whyGoodOrBad = "You overlooked a pin on your piece. By doing so, the piece is now pinned to a more valuable target or your king, making it immobile and vulnerable to further pressure.";
    } else if (hasCheck) {
      whyGoodOrBad = "This allowed your opponent to deliver a check, forcing your king into an awkward defensive position and disrupting your piece coordination.";
    } else if (cpLoss > 150) {
      whyGoodOrBad = "This seriously weakened your position. The evaluation dropped significantly, giving your opponent concrete targets and open paths to build an attack.";
    } else {
      whyGoodOrBad = "This move is a bit passive, allowing your opponent to activate their pieces, capture central space, and gain a development advantage.";
    }
  } else {
    // Positive moves
    if (classification === "brilliant") {
      whyGoodOrBad = "This sacrifice is completely sound. Rejecting it gives you a winning positional advantage, and accepting it opens up files for a direct attack.";
    } else if (hasCheckmate) {
      whyGoodOrBad = "This beautiful move delivers checkmate, ending the game successfully!";
    } else if (hasCheck) {
      whyGoodOrBad = "This puts the opponent king under check and forces them into a defensive, awkward posture.";
    } else if (hasFork) {
      whyGoodOrBad = "This creates a fork, threatening multiple enemy pieces simultaneously and securing a material gain.";
    } else if (positional.kingSafety.whiteStatus === "Exposed" || positional.kingSafety.blackStatus === "Exposed") {
      whyGoodOrBad = "This move exploits the opponent's exposed king safety and positions your pieces for an attack.";
    } else {
      whyGoodOrBad = "This optimizes your piece development, secures central squares, and aligns with sound strategic chess principles.";
    }
  }

  // 3. WHAT WAS MISSED
  if (["blunder", "mistake", "inaccuracy", "missed_win"].includes(classification)) {
    if (classification === "missed_win") {
      whatWasMissed = `You missed a forced win or major material gain by playing ${bestMoveSan || "the recommended line"}. This would have sealed the victory immediately.`;
    } else {
      whatWasMissed = `You missed a much stronger move: ${bestMoveSan || "another tactical option"}. This alternative would have defended your weaknesses and applied active pressure.`;
    }
  } else {
    whatWasMissed = "Nothing was missed! You found the optimal continuation and played it perfectly.";
  }

  // 4. BEST CONTINUATION
  if (bestMoveSan && bestMoveSan !== "(none)") {
    bestContinuation = `The best plan starts with playing ${bestMoveSan}, followed by active piece coordinating and targeting the opponent's weaknesses.`;
  } else {
    bestContinuation = "Focus on castling, activating your remaining minor pieces, and completing your development.";
  }

  return {
    whatHappened,
    whyGoodOrBad,
    whatWasMissed,
    bestContinuation
  };
}
