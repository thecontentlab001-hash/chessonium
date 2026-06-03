export interface Puzzle {
  id: string;
  title: string;
  description: string;
  fen: string;
  solution: string[]; // move sequences, e.g., ["e4e8", "d8e8"]
  rating: number;
  themes: string[];
}

export const seedPuzzles: Puzzle[] = [
  {
    id: "p1",
    title: "Back Rank Deflection",
    description: "Deflect the rook defending the back rank to execute checkmate.",
    fen: "6k1/5ppp/8/8/8/8/1q3PPP/3R2K1 w - - 0 1",
    solution: ["d1d8"],
    rating: 800,
    themes: ["Back Rank", "Mate in 1", "Deflection"]
  },
  {
    id: "p2",
    title: "Smothered Mate",
    description: "Force the opponent to block their own king, setting up a mate with the knight.",
    fen: "5r1k/6pp/7N/8/2Q5/8/6PP/6K1 w - - 0 1",
    solution: ["c4g8", "f8g8", "h6f7"],
    rating: 1000,
    themes: ["Smothered Mate", "Knight", "Tactics"]
  },
  {
    id: "p3",
    title: "The Classic Greek Gift",
    description: "Sacrifice the bishop on h7 to open up the enemy king.",
    fen: "r1bq1rk1/ppp1bppp/2n1pn2/3p4/3P4/3BPN2/PPPB1PPP/RN1QR1K1 w - - 0 1",
    solution: ["d3h7", "g8h7", "f3g5", "h7g8", "d1h5"],
    rating: 1200,
    themes: ["Sacrifice", "Greek Gift", "Attacking King"]
  },
  {
    id: "p4",
    title: "Underpromotion Fork",
    description: "Promoting to a Queen is defendable. Find the winning knight underpromotion fork.",
    fen: "8/4P1k1/3q4/8/8/8/6PP/6K1 w - - 0 1",
    solution: ["e7e8n"],
    rating: 1500,
    themes: ["Underpromotion", "Fork", "Endgame"]
  },
  {
    id: "p5",
    title: "Anastasia's Mate",
    description: "Decoy the king to h7 to deliver a devastating rook mate protected by the knight.",
    fen: "5r1k/1p2Nppp/8/7Q/8/3R4/5PPP/6K1 w - - 0 1",
    solution: ["h5h7", "h8h7", "d3h3"],
    rating: 1800,
    themes: ["Anastasia's Mate", "Sacrifice", "Attacking King"]
  },
  {
    id: "p6",
    title: "Rook Skewer",
    description: "Force the enemy king to step aside, exposing the queen behind it.",
    fen: "R7/6P1/7k/8/8/8/8/7q w - - 0 1",
    solution: ["a8h8", "h6g6", "h8h1"],
    rating: 1100,
    themes: ["Skewer", "Tactics"]
  }
];
