export interface Opening {
  id: string;
  name: string;
  eco: string; // ECO code, e.g. "C60"
  moves: string[]; // sequence of moves in san format
  movesSequence: string[]; // move coordinates, e.g. ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"]
  description: string;
  whiteWinRate: number;
  blackWinRate: number;
  drawRate: number;
  theory: string;
}

export const seedOpenings: Opening[] = [
  {
    id: "op1",
    name: "Ruy Lopez",
    eco: "C60",
    moves: ["1. e4 e5", "2. Nf3 Nc6", "3. Bb5"],
    movesSequence: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"],
    description: "A classic opening applying pressure on the c6 knight to fight for control of the e5 pawn and center.",
    whiteWinRate: 42,
    blackWinRate: 35,
    drawRate: 23,
    theory: "The Ruy Lopez is one of the oldest and most respected openings. By placing the bishop on b5, White attacks the knight that defends Black's e5 pawn. Key plans include building a strong center with c3 and d4, while Black counterattacks with a6, b5, and Nf6."
  },
  {
    id: "op2",
    name: "Sicilian Defense",
    eco: "B20",
    moves: ["1. e4 c5"],
    movesSequence: ["e2e4", "c7c5"],
    description: "An aggressive, asymmetrical counterattack by Black, fighting for the d4 square using a side pawn.",
    whiteWinRate: 38,
    blackWinRate: 41,
    drawRate: 21,
    theory: "The Sicilian is Black's most successful response to 1. e4. By playing c5, Black creates an asymmetrical position, aiming to trade a flank pawn for White's center d-pawn. This leads to sharp, tactical play with chances for both sides."
  },
  {
    id: "op3",
    name: "Queen's Gambit",
    eco: "D06",
    moves: ["1. d4 d5", "2. c4"],
    movesSequence: ["d2d4", "d7d5", "c2c4"],
    description: "White offers a temporary flank pawn sacrifice to gain central control and active lines.",
    whiteWinRate: 45,
    blackWinRate: 30,
    drawRate: 25,
    theory: "In the Queen's Gambit, White challenges Black's d5 pawn. If Black captures on c4 (Accepted), White gets a strong pawn center. If Black declines, White maintains a spatial advantage and active rook lines on the c-file."
  },
  {
    id: "op4",
    name: "French Defense",
    eco: "C00",
    moves: ["1. e4 e6", "2. d4 d5"],
    movesSequence: ["e2e4", "e7e6", "d2d4", "d7d5"],
    description: "A solid, counter-attacking system where Black establishes a strong pawn chain.",
    whiteWinRate: 40,
    blackWinRate: 36,
    drawRate: 24,
    theory: "The French Defense leads to a closed center, where Black attacks White's pawn chain with c5 and f6. White usually seeks kingside attacking chances, while Black targets White's queenside pawn structure."
  },
  {
    id: "op5",
    name: "Caro-Kann Defense",
    eco: "B12",
    moves: ["1. e4 c6", "2. d4 d5"],
    movesSequence: ["e2e4", "c7c6", "d2d4", "d7d5"],
    description: "A highly resilient defense. Black aims for d5 while keeping the light-squared bishop free.",
    whiteWinRate: 39,
    blackWinRate: 37,
    drawRate: 24,
    theory: "Similar to the French, but Black plays c6 instead of e6. This allows the light-squared bishop to escape to f5 or g4 before e6 is played, avoiding the 'bad bishop' problem of the French."
  },
  {
    id: "op6",
    name: "Italian Game",
    eco: "C50",
    moves: ["1. e4 e5", "2. Nf3 Nc6", "3. Bc4"],
    movesSequence: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"],
    description: "One of the oldest openings, focusing on rapid development and targeting the vulnerable f7 pawn.",
    whiteWinRate: 43,
    blackWinRate: 34,
    drawRate: 23,
    theory: "The Italian Game opens with 1.e4 e5 2.Nf3 Nc6 3.Bc4. Placing the bishop on c4 targets Black's weakest starting square, f7. From here, White can choose aggressive play with the Fried Liver Attack or quieter strategic lines (Giuoco Piano) with c3 and d3."
  },
  {
    id: "op7",
    name: "Scandinavian Defense",
    eco: "B01",
    moves: ["1. e4 d5"],
    movesSequence: ["e2e4", "d7d5"],
    description: "A direct counter-strike challenging White's e4 pawn on the very first move.",
    whiteWinRate: 41,
    blackWinRate: 36,
    drawRate: 23,
    theory: "The Scandinavian Defense (1.e4 d5) forces White to deal with an immediate central threat. After 2.exd5, Black usually recaptures with 2...Qxd5, leading to early queen development, or plays 2...Nf6 (the Portuguese/Modern variation) to avoid bringing the queen out too early."
  },
  {
    id: "op8",
    name: "London System",
    eco: "D02",
    moves: ["1. d4 d5", "2. Bf4"],
    movesSequence: ["d2d4", "d7d5", "c1f4"],
    description: "A highly popular, solid system for White that can be played against almost any response.",
    whiteWinRate: 44,
    blackWinRate: 32,
    drawRate: 24,
    theory: "The London System is a solid opening system where White develops the dark-squared bishop to f4 early, followed by e3, c3, and Nf3, creating a strong defensive pyramid. It is prized for its safety and ease of learning, giving White a stable game with low theory requirements."
  },
  {
    id: "op9",
    name: "King's Indian Defense",
    eco: "E60",
    moves: ["1. d4 Nf6", "2. c4 g6", "3. Nc3 Bg7"],
    movesSequence: ["d2d4", "g8f6", "c2c4", "g7g6", "b1c3", "f8g7"],
    description: "A dynamic hypermodern opening. Black allows White to take the center to launch a counter-attack later.",
    whiteWinRate: 39,
    blackWinRate: 42,
    drawRate: 19,
    theory: "The King's Indian Defense is a sharp, counter-attacking opening. Black lets White build a massive pawn center, castling early and then striking back with ...e5 or ...c5. It often leads to complex, sharp middle-games with opposite-side castling attacks."
  },
  {
    id: "op10",
    name: "English Opening",
    eco: "A10",
    moves: ["1. c4"],
    movesSequence: ["c2c4"],
    description: "A hypermodern flank opening where White fights for the d5 square from the side.",
    whiteWinRate: 41,
    blackWinRate: 33,
    drawRate: 26,
    theory: "The English Opening (1.c4) controls the d5 square using a flank pawn. It is highly flexible and can transpose into various Queens' Pawn lines, the King's Indian, or Sicilian-like structures with colors reversed. It leads to strategic, maneuvering middle-games."
  },
  {
    id: "op11",
    name: "King's Gambit",
    eco: "C30",
    moves: ["1. e4 e5", "2. f4"],
    movesSequence: ["e2e4", "e7e5", "f2f4"],
    description: "A romantic-era, highly aggressive sacrifice seeking rapid development and a direct kingside attack.",
    whiteWinRate: 40,
    blackWinRate: 45,
    drawRate: 15,
    theory: "The King's Gambit is one of the most famous historical openings. White offers the f4 pawn immediately to deflect Black's e5 pawn, planning to build a large center with d4 and attack f7. Black can accept the gambit or decline with moves like 2...Bc5."
  },
  {
    id: "op12",
    name: "Nimzo-Indian Defense",
    eco: "E20",
    moves: ["1. d4 Nf6", "2. c4 e6", "3. Nc3 Bb4"],
    movesSequence: ["d2d4", "g8f6", "c2c4", "e7e6", "b1c3", "f8b4"],
    description: "An incredibly solid hypermodern defense where Black pins White's knight to control the e4 square.",
    whiteWinRate: 37,
    blackWinRate: 40,
    drawRate: 23,
    theory: "The Nimzo-Indian (1.d4 Nf6 2.c4 e6 3.Nc3 Bb4) is one of Black's most reliable responses to 1.d4. By pinning the knight, Black prevents White from playing an easy e4. Black often trades the bishop for the knight to double White's c-pawns and create structural targets."
  },
  {
    id: "op13",
    name: "Reti Opening",
    eco: "A04",
    moves: ["1. Nf3 d5"],
    movesSequence: ["g1f3", "d7d5"],
    description: "A flexible hypermodern flank setup starting with the knight to keep White's central options open.",
    whiteWinRate: 42,
    blackWinRate: 32,
    drawRate: 26,
    theory: "The Reti Opening (1.Nf3 d5) avoids placing pawns in the center immediately. White intends to strike at Black's d5 pawn from the flank with c4 or fianchetto the bishops (double fianchetto) to control the long diagonals. It is highly positional and transpositional."
  },
  {
    id: "op14",
    name: "Slav Defense",
    eco: "D10",
    moves: ["1. d4 d5", "2. c4 c6"],
    movesSequence: ["d2d4", "d7d5", "c2c4", "c7c6"],
    description: "An ultra-solid pawn support defense that keeps Black's light-squared bishop active.",
    whiteWinRate: 38,
    blackWinRate: 36,
    drawRate: 26,
    theory: "The Slav Defense (1.d4 d5 2.c4 c6) supports the d5 pawn with the c-pawn instead of the e-pawn. This keeps the diagonal open for Black's light-squared bishop, avoiding the passive placement typical in the Queen's Gambit Declined."
  },
  {
    id: "op15",
    name: "Scotch Game",
    eco: "C44",
    moves: ["1. e4 e5", "2. Nf3 Nc6", "3. d4"],
    movesSequence: ["e2e4", "e7e5", "g1f3", "b8c6", "d2d4"],
    description: "A direct central strike, opening the board early for active minor piece play.",
    whiteWinRate: 43,
    blackWinRate: 35,
    drawRate: 22,
    theory: "The Scotch Game (1.e4 e5 2.Nf3 Nc6 3.d4) immediately challenges Black's e5 pawn in the center. By playing d4, White forces an open board with active pieces. If Black captures 3...exd4, White recaptures 4.Nxd4, leading to sharp, open tactical games."
  }
];
