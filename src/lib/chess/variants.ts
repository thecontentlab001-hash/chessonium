// Chess Variant Helpers

// Generates a valid Chess960 starting position FEN
export function generateChess960FEN(): string {
  const pieces = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  const rank = new Array<string>(8).fill("");

  // Place Bishops on opposite colored squares
  const b1 = Math.floor(Math.random() * 4) * 2; // Even indices: 0, 2, 4, 6
  const b2 = Math.floor(Math.random() * 4) * 2 + 1; // Odd indices: 1, 3, 5, 7
  rank[b1] = "B";
  rank[b2] = "B";

  // Place Queen randomly in one of the empty spots
  let emptyIndices = rank.map((p, i) => (p === "" ? i : -1)).filter((i) => i !== -1);
  const qPos = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  rank[qPos] = "Q";

  // Place Knights in empty spots
  emptyIndices = rank.map((p, i) => (p === "" ? i : -1)).filter((i) => i !== -1);
  const n1Pos = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  rank[n1Pos] = "N";
  
  emptyIndices = rank.map((p, i) => (p === "" ? i : -1)).filter((i) => i !== -1);
  const n2Pos = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  rank[n2Pos] = "N";

  // Rooks must flank the King in the remaining 3 spots
  emptyIndices = rank.map((p, i) => (p === "" ? i : -1)).filter((i) => i !== -1);
  rank[emptyIndices[0]] = "R";
  rank[emptyIndices[1]] = "K";
  rank[emptyIndices[2]] = "R";

  const whiteRank = rank.join("");
  const blackRank = rank.join("").toLowerCase();

  // Return full Chess960 starting FEN
  // e.g. "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  // Note: For Chess960 castling, castling rights letters match the initial rook files if they differ,
  // but standard chess.js accepts typical KQkq if r-k-r is in standard order, 
  // or we can use standard FEN structure.
  return `${blackRank}/pppppppp/8/8/8/8/PPPPPPPP/${whiteRank} w KQkq - 0 1`;
}

// Checks if a King is in the center squares (d4, d5, e4, e5)
// Applicable for King of the Hill variant
export function checkKingOfTheHillCenter(fen: string): "white" | "black" | null {
  const parts = fen.split(" ");
  const board = parts[0];
  const rows = board.split("/");

  // Center squares map to rows 3 and 4 (indices 3 and 4 from top, i.e. 8th rank to 1st rank: row 3 is 5th rank, row 4 is 4th rank)
  // And files d and e (indices 3 and 4 in each row)
  // Let's decode rows 3 and 4
  const checkRowForKing = (rowStr: string): { whiteKing: boolean; blackKing: boolean } => {
    let fileIdx = 0;
    let whiteKing = false;
    let blackKing = false;
    for (const char of rowStr) {
      if (isNaN(Number(char))) {
        if (fileIdx === 3 || fileIdx === 4) {
          if (char === "K") whiteKing = true;
          if (char === "k") blackKing = true;
        }
        fileIdx += 1;
      } else {
        fileIdx += Number(char);
      }
    }
    return { whiteKing, blackKing };
  };

  // Row index 3 (rank 5) and index 4 (rank 4) represent the central area (ranks 4,5, files d,e)
  const row5 = checkRowForKing(rows[3]);
  const row4 = checkRowForKing(rows[4]);

  if (row5.whiteKing || row4.whiteKing) return "white";
  if (row5.blackKing || row4.blackKing) return "black";

  return null;
}
