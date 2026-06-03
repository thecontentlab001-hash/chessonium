export interface Study {
  id: string;
  title: string;
  creator: string;
  description: string;
  fen: string;
  pgn?: string;
  createdAt: string;
  likes: number;
}

export const seedStudies: Study[] = [
  {
    id: "s1",
    title: "Mastering the Caro-Kann Defense",
    creator: "IM_CaroMaster",
    description: "An interactive breakdown of key lines in the Caro-Kann Advance variation, focusing on bishop placement.",
    fen: "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
    pgn: "1. e4 c6 2. d4 d5 3. e5 Bf5",
    createdAt: "2026-05-15",
    likes: 42
  },
  {
    id: "s2",
    title: "Deep Dive: Tal's Knight Sacrifices",
    creator: "TacticianMisha",
    description: "An analysis of Mikhail Tal's legendary piece sacrifices on e6 to break the Sicilian Defense open.",
    fen: "r1bqk2r/pp2bppp/2nppn2/8/3NP3/2N5/PPP1BPPP/R1BQ1RK1 w KQkq - 4 8",
    pgn: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Be2 e6 7. O-O Be7",
    createdAt: "2026-05-20",
    likes: 67
  },
  {
    id: "s3",
    title: "Essential Rook & Pawn Endgames",
    creator: "LucenaLover",
    description: "Understanding the Lucena position and building the bridge to secure victory.",
    fen: "1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1",
    pgn: "1. Rd1+ Ke7 2. Rd4 Ra1 3. Kc7 Rc1+ 4. Kb6 Rb1+ 5. Kc6 Rc1+ 6. Kb5 Rb1+ 7. Rb4",
    createdAt: "2026-05-28",
    likes: 31
  }
];
