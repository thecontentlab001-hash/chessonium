export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: "new_to_chess" | "beginner" | "intermediate" | "advanced" | "mastery";
  category: "Openings" | "Strategy" | "Tactics" | "Endgames" | "Attacking" | "Master Games";
  content: string;
  fen?: string;
  interactiveMove?: string;
  sequence?: string[];
  quiz?: {
    question: string;
    options: string[];
    answer: number;
  };
}

export const seedLessons: Lesson[] = [
  // NEW TO CHESS (Level 1)
  {
    id: "l1",
    title: "How to Set Up the Board",
    description: "Learn the layout of files, ranks, and how coordinates work.",
    difficulty: "new_to_chess",
    category: "Strategy",
    content: "The chessboard is an 8x8 grid of alternating light and dark squares. Files are vertical columns labeled 'a' through 'h', and Ranks are horizontal rows labeled 1 through 8. White always sets up on ranks 1 and 2, and Black on ranks 7 and 8. The bottom-right square for each player must always be a light-colored square. Remember: 'Queen on her own color' (white Queen on d1, black Queen on d8). Let's practice a simple Queen pawn advance.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sequence: ["d2d4", "d7d5", "c2c4"],
    quiz: {
      question: "Which file is the Queen placed on during initial setup?",
      options: ["e-file", "c-file", "d-file", "f-file"],
      answer: 2
    }
  },
  {
    id: "l2",
    title: "How Pawn and Knight Move",
    description: "Understand the straight-stepping pawn and the jumping knight.",
    difficulty: "new_to_chess",
    category: "Strategy",
    content: "Pawns move one square forward, but capture diagonally. On their first move, they can advance two squares. Knights move in an 'L' shape (two squares in one direction, one square perpendicular) and are the only pieces that can jump over other pieces. Let's practice opening with a pawn and developing our knight toward the center.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sequence: ["e2e4", "e7e5", "g1f3"],
    quiz: {
      question: "Which of these is the only piece that can jump over other pieces?",
      options: ["Pawn", "Knight", "Rook", "Bishop"],
      answer: 1
    }
  },
  {
    id: "l3",
    title: "Rook and Bishop Movements",
    description: "Learn the straight lines of the rook and the diagonals of the bishop.",
    difficulty: "new_to_chess",
    category: "Strategy",
    content: "Rooks move horizontally and vertically as many squares as they want, provided no piece blocks their way. Bishops move diagonally on their color square forever. You start with one light-squared bishop and one dark-squared bishop. Let's practice developing the light-squared bishop.",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    sequence: ["b7b6", "f1c4", "c8b7"],
    quiz: {
      question: "If your bishop starts on a dark square, can it ever move to a light square?",
      options: ["Yes, after castling", "No, it must remain on dark squares the entire match", "Only if it captures an enemy pawn", "Yes, by moving to the 8th rank"],
      answer: 1
    }
  },
  {
    id: "l4",
    title: "Queen and King Roles",
    description: "Master the powers of the Queen and the ultimate protection of the King.",
    difficulty: "new_to_chess",
    category: "Strategy",
    content: "The Queen is the most powerful attacking piece, combining the moves of a Rook and a Bishop. The King can move only one square in any direction. The objective of chess is not to capture the King, but to trap it so it cannot escape. Let's practice moving the Queen out early, a common novice tactic.",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    sequence: ["d1h5", "g7g6", "h5e5"],
    quiz: {
      question: "How many squares can the King move in a single turn (excluding castling)?",
      options: ["Unlimited", "Two squares", "One square", "Three squares"],
      answer: 2
    }
  },
  {
    id: "l5",
    title: "Delivering Check",
    description: "Learn how to threaten the enemy king directly.",
    difficulty: "new_to_chess",
    category: "Tactics",
    content: "When a piece directly attacks the enemy King, it is called a Check. The opponent MUST get out of check immediately on their next turn by moving the king, blocking the attack, or capturing the checking piece. Let's deliver a direct check with our Queen.",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/8/5P2/PPPPP1PP/RNBQKBNR b KQkq - 0 2",
    sequence: ["d8h4", "g2g3", "h4h5"],
    quiz: {
      question: "Which of the following is NOT a legal way to escape a check?",
      options: ["Castling to get to safety", "Blocking the attack with another piece", "Capturing the attacking piece", "Moving the King to an unthreatened square"],
      answer: 0
    }
  },

  // BEGINNER (Level 2)
  {
    id: "l6",
    title: "Opening Principles",
    description: "Learn to control the center, develop pieces, and secure the king.",
    difficulty: "beginner",
    category: "Openings",
    content: "The opening stage determines the balance of the match. Your primary goals are: 1. Control the center squares (e4, d4, e5, d5), 2. Develop your knights and bishops, and 3. Castle early to protect the King. Let's practice standard central pawn development and minor piece activation.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sequence: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"],
    quiz: {
      question: "What are the four center squares that control the board?",
      options: ["a1, h1, a8, h8", "e4, d4, e5, d5", "c3, f3, c6, f6", "d1, e1, d8, e8"],
      answer: 1
    }
  },
  {
    id: "l7",
    title: "En Passant Capture",
    description: "Master the unique diagonal passing capture of advanced pawns.",
    difficulty: "beginner",
    category: "Tactics",
    content: "En Passant ('in passing') is a special capture rule. If your pawn is on the 5th rank and your opponent advances a neighboring pawn two squares forward (landing directly beside yours), you can capture it diagonally on your very next turn as if it had only moved one square. Let's practice it.",
    fen: "rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
    sequence: ["e5d6", "e7e6", "d6c7"],
    quiz: {
      question: "When must you execute an en passant capture?",
      options: ["Anytime within the next 3 turns", "Immediately on the very next turn", "Only if your King is castled", "Only at the end of the game"],
      answer: 1
    }
  },
  {
    id: "l8",
    title: "Pawn Promotion",
    description: "Guide your pawns to the end of the board to promote them into powerful pieces.",
    difficulty: "beginner",
    category: "Endgames",
    content: "If a pawn reaches the opposite end of the board (the 8th rank for White, or 1st rank for Black), it immediately promotes into a Queen, Rook, Bishop, or Knight. Promoting to a Queen is almost always the strongest choice. Let's promote a white pawn to secure a material lead.",
    fen: "8/p5P1/8/8/8/8/6kp/5K2 w - - 0 1",
    sequence: ["g7g8q", "a7a5", "g8d5"],
    quiz: {
      question: "Which piece can a pawn NOT promote into?",
      options: ["King", "Queen", "Rook", "Knight"],
      answer: 0
    }
  },
  {
    id: "l9",
    title: "Checkmate Basics: King & Queen",
    description: "Learn how to deliver checkmate using just a King and a Queen.",
    difficulty: "beginner",
    category: "Endgames",
    content: "To checkmate a lone King with a King and Queen, you must force the enemy King to the edge of the board. Move your Queen to restrict the King's squares (keeping a knight's distance), bring your King forward for support, and deliver the final blow. Let's practice driving the King to the rank.",
    fen: "4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1",
    sequence: ["e2e7", "e8d8", "e1f2", "d8c8", "e2d7"],
    quiz: {
      question: "What is the critical danger when backing the enemy King into a corner?",
      options: ["Stalemate (no legal moves but not in check), which results in a draw", "Losing by clock timeout", "Opponent castling out of danger", "The Queen getting captured by the King without support"],
      answer: 0
    }
  },

  // INTERMEDIATE (Level 3)
  {
    id: "l10",
    title: "The Power of the Pin",
    description: "Learn to freeze enemy pieces in place by threatening more valuable targets behind them.",
    difficulty: "intermediate",
    category: "Tactics",
    content: "A pin occurs when an attacking piece targets a defender that cannot move without exposing a more valuable piece behind it. An 'Absolute Pin' is when the piece behind is the King, making it illegal to move the pinned piece. Let's pin and capture an enemy rook.",
    fen: "4k3/8/8/3r4/8/8/3R4/4K3 w - - 0 1",
    sequence: ["d2d5", "e8e7", "d1d2"],
    quiz: {
      question: "Why is it illegal to move a piece pinned to the King?",
      options: [
        "It would put the King in check, which is a rule violation",
        "Pinned pieces lose all movement rights",
        "It would cause a stalemate",
        "The bishop would capture the king immediately"
      ],
      answer: 0
    }
  },
  {
    id: "l11",
    title: "Fork Tactics: Double Attack",
    description: "Deliver a surprise double attack to capture undefended pieces.",
    difficulty: "intermediate",
    category: "Tactics",
    content: "A fork is a tactical maneuver where one piece attacks two or more enemy targets at the same time. Since the opponent can only move one piece on their turn, they will lose the other. Knights and Queens are excellent fork pieces. Let's execute a knight fork.",
    fen: "4k3/8/3r1q2/4N3/8/8/8/4K3 w - - 0 1",
    sequence: ["e5d6", "e8d8", "d6f6"],
    quiz: {
      question: "Which chess piece is most famous for delivering unexpected, jumping forks?",
      options: ["Bishop", "Pawn", "Knight", "Rook"],
      answer: 2
    }
  },
  {
    id: "l12",
    title: "The Skewer Attack",
    description: "Force high-value pieces to step aside, exposing the vulnerable targets behind.",
    difficulty: "intermediate",
    category: "Tactics",
    content: "A skewer is a reverse pin. You attack a highly valuable piece (such as the King or Queen), forcing it to move, which exposes a less valuable piece standing behind it along the line of attack. Let's skewer the enemy King to capture the Queen.",
    fen: "R7/6P1/7k/8/8/8/8/7q w - - 0 1",
    sequence: ["a8h8", "h6g6", "h8h1"],
    quiz: {
      question: "How does a skewer differ from a pin?",
      options: [
        "A pin attacks the less valuable piece first; a skewer attacks the more valuable piece first",
        "A skewer only works with knights",
        "A pin is always checkmate",
        "Skewers cannot check the king"
      ],
      answer: 0
    }
  },
  {
    id: "l13",
    title: "Discovered Attacks",
    description: "Move one piece out of the way to unleash a hidden attack from a piece behind it.",
    difficulty: "intermediate",
    category: "Tactics",
    content: "A discovered attack occurs when one piece moves, opening up a line of attack for a teammate (Rook, Bishop, or Queen) sitting behind it. If the moving piece also delivers an attack, it creates a powerful double attack. Let's launch one.",
    fen: "k7/7p/8/2B5/8/8/3R4/6K1 w - - 0 1",
    sequence: ["c5d6", "a8b7", "d2d7"],
    quiz: {
      question: "What is a discovered check?",
      options: [
        "A check revealed when another piece moves out of the line of sight of the king",
        "A check delivered by castling",
        "A check that leads to a draw",
        "A check delivered by two knights simultaneously"
      ],
      answer: 0
    }
  },
  {
    id: "l14",
    title: "The Scholar's Mate",
    description: "Learn to spot and defend against the fast 4-move checkmate threat.",
    difficulty: "intermediate",
    category: "Openings",
    content: "Scholar's Mate targets the weakest point in the opponent's starting camp: the f7 square (only guarded by the King). White attacks using the Bishop on c4 and Queen on f3 or h5. Let's play the final mating blow, and remember to defend against this with early pawn advances.",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 1",
    sequence: ["d1f3", "g7g6", "f3f7"],
    quiz: {
      question: "Why is f7 (or f2 for White) the weakest square in the starting setup?",
      options: [
        "It can only be defended by the King",
        "It is always occupied by a knight",
        "It is in the exact center of the board",
        "It cannot be captured"
      ],
      answer: 0
    }
  },

  // ADVANCED (Level 4)
  {
    id: "l15",
    title: "Opposition in Pawn Endgames",
    description: "Master king placement to guide your pawns safely to promotion.",
    difficulty: "advanced",
    category: "Endgames",
    content: "Opposition occurs when two Kings face each other on a file with one square separating them. The player whose turn it is to move must yield, stepping aside and letting the enemy King penetrate key squares. Taking opposition is essential to secure pawn promotion. Let's claim opposition.",
    fen: "8/8/8/4k3/8/4K3/8/8 w - - 0 1",
    sequence: ["e3d3", "e5f5", "d3d4"],
    quiz: {
      question: "If you take the opposition, what are you forcing the opponent's King to do?",
      options: [
        "Step aside and give up control of key squares",
        "Castle on the next move",
        "Promote their own pawn",
        "Resign the game"
      ],
      answer: 0
    }
  },
  {
    id: "l16",
    title: "Greek Gift Sacrifice",
    description: "Sacrifice a bishop on h7 to smash the opponent's king defenses.",
    difficulty: "advanced",
    category: "Attacking",
    content: "The Greek Gift is a classic tactical sacrifice. White captures the h7 pawn with a bishop, drawing the enemy King forward out of safety. This opens up lines for a rapid, crushing attack by the Queen and Knight. Let's play the bishop sacrifice.",
    fen: "r1bq1rk1/ppp1bppp/2n1pn2/3p4/3P4/3BPN2/PPPB1PPP/RN1QR1K1 w - - 0 1",
    sequence: ["d3h7", "g8h7", "f3g5", "h7g8", "d1h5"],
    quiz: {
      question: "What is the key target square of the bishop sacrifice in the Greek Gift?",
      options: ["f7", "g6", "h7", "h8"],
      answer: 2
    }
  },
  {
    id: "l17",
    title: "Anastasia's Mate",
    description: "Deliver a beautiful checkmate using a knight, rook, and queen sacrifice.",
    difficulty: "advanced",
    category: "Tactics",
    content: "Anastasia's Mate traps the enemy King against the side of the board. A Knight on e7 guards the escape squares g6 and g8. You sacrifice the Queen on h7 to decoy the King onto the open h-file, followed by a final rook checkmate from d3 to h3. Let's execute the queen sacrifice and mate.",
    fen: "5r1k/1p2Nppp/8/7Q/8/3R4/5PPP/6K1 w - - 0 1",
    sequence: ["h5h7", "h8h7", "d3h3"],
    quiz: {
      question: "Which file is the enemy King locked on in Anastasia's Mate?",
      options: ["g-file", "h-file", "f-file", "e-file"],
      answer: 1
    }
  },

  // MASTERY (Level 5)
  {
    id: "l18",
    title: "Prophylaxis Strategy",
    description: "Think ahead to prevent your opponent's tactical plans before they happen.",
    difficulty: "mastery",
    category: "Strategy",
    content: "Prophylaxis is the art of identifying your opponent's ideas and playing moves that prevent them before they can even be set up. It stops threats in their tracks and frustrates the opponent's counterplay. Let's play a prophylactic move to block an enemy knight jump.",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    sequence: ["a2a3", "g8f6", "b1c3"],
    quiz: {
      question: "What is the primary goal of a prophylactic move?",
      options: [
        "To prevent and neutralize the opponent's active ideas before they happen",
        "To deliver a check immediately",
        "To sacrifice a major piece for space",
        "To force a quick checkmate"
      ],
      answer: 0
    }
  },
  {
    id: "l19",
    title: "Grandmaster Study: Kasparov's Attack",
    description: "Analyze the attacking patterns of Garry Kasparov against deep computer lines.",
    difficulty: "mastery",
    category: "Master Games",
    content: "Studying master games teaches you how to coordinate pieces at the highest level. In this position from Garry Kasparov, White coordinates the rooks and bishops to squeeze Black's center and force a structural weakness. Let's step through the sequence.",
    fen: "r4rk1/pp1nbppp/2p1pn2/q5B1/2BP2b1/2N2N2/PPP1QPPP/R2R2K1 w - - 4 11",
    sequence: ["g5f4", "a5f5", "f4g3"],
    quiz: {
      question: "Why do grandmasters study past games of world champions?",
      options: [
        "To memorize tactical patterns and strategic ideas that can be adapted in their own games",
        "To copy opening moves exactly without thinking",
        "Because it is required by FIDE regulations",
        "To check if the opponent made rules violations"
      ],
      answer: 0
    }
  },
  {
    id: "l20",
    title: "The Smothered Mate",
    description: "Learn to trap the enemy King using a Knight while it is entirely surrounded by its own pieces.",
    difficulty: "intermediate",
    category: "Tactics",
    content: "Smothered Mate is a famous chess checkmate. It occurs when a Knight checkmates the enemy King because the King is completely blocked in (smothered) by its own friendly pieces, leaving it with no escape squares. This is commonly set up by a forcing Queen sacrifice on the corner square (g8 or b8) to decoy the rook to block the King. Let's practice this classic tactic.",
    fen: "6rk/5ppp/8/6N1/8/8/6QP/5R1K w - - 0 1",
    sequence: ["g2g8", "f8g8", "g5f7"],
    quiz: {
      question: "Which piece delivers the final checkmate in a Smothered Mate?",
      options: ["Queen", "Rook", "Bishop", "Knight"],
      answer: 3
    }
  },
  {
    id: "l21",
    title: "Castling Rules & Safety",
    description: "Learn when you can and cannot castle to secure your King.",
    difficulty: "beginner",
    category: "Strategy",
    content: "Castling is a special move that protects your King and activates your Rook. You can castle kingside (O-O) or queenside (O-O-O). However, you cannot castle if: 1. Your King or Rook has already moved, 2. Your King is currently in check, 3. The King passes through a square threatened by an enemy piece, or 4. There are pieces blocking the path. Let's practice a clean kingside castle.",
    fen: "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1",
    sequence: ["e1g1"],
    quiz: {
      question: "Under which condition is castling temporarily illegal?",
      options: ["Your rook is currently under attack", "Your king is currently in check", "You are castling on the queenside", "It is after move 10"],
      answer: 1
    }
  },
  {
    id: "l22",
    title: "The Windmill Attack",
    description: "Execute a devastating series of discovered checks to capture multiple pieces.",
    difficulty: "advanced",
    category: "Tactics",
    content: "A Windmill is a tactical combination where a player delivers a sequence of alternating direct checks and discovered checks. The enemy King is forced back and forth, while the checking piece captures multiple enemy pieces along the way. It is one of the most destructive tactics in chess. Let's execute a discovered check sequence.",
    fen: "q5rk/p5Rp/5B2/8/8/8/6PP/6K1 w - - 0 1",
    sequence: ["g7g6", "g8h8", "g6g7"],
    quiz: {
      question: "What primary tactical theme is repeated in a Windmill Attack?",
      options: ["En Passant captures", "Discovered checks", "Pawn promotion threats", "Zugzwang"],
      answer: 1
    }
  },
  {
    id: "l23",
    title: "The Deflection Sacrifice",
    description: "Sacrifice a piece to draw away an enemy defender from a key square.",
    difficulty: "intermediate",
    category: "Tactics",
    content: "Deflection is a tactical motif where you force an opponent's piece to move away from a square it is defending. This exposes a vulnerability, allowing you to launch a mating attack or capture material. In this position, the black rook on c8 is overworked, guarding both the back-rank mate and the d8 square. Let's sacrifice our queen on d8 to deflect the rook and deliver a back-rank checkmate.",
    fen: "2r3k1/5ppp/8/3Q4/8/8/5PPP/4R1K1 w - - 0 1",
    sequence: ["d5d8", "c8d8", "e1e8"],
    quiz: {
      question: "What does a deflection sacrifice aim to achieve?",
      options: [
        "To force an enemy defender to abandon a critical square or piece",
        "To promote a pawn immediately",
        "To trade queens in an equal position",
        "To block the enemy king's castling rights"
      ],
      answer: 0
    }
  },
  {
    id: "l24",
    title: "Lucena Position & The Bridge",
    description: "Learn the bridge-building technique to promote a pawn in a rook endgame.",
    difficulty: "mastery",
    category: "Endgames",
    content: "The Lucena position is the cornerstone of rook and pawn endgames. The winning side has a pawn on the 7th rank and their King is blocked directly in front of it. To win, you must step the King out and build a 'bridge' using your rook on the 4th rank. This shield prevents the enemy rook from delivering endless checks. Let's execute the king breakout and block the final check with our rook bridge.",
    fen: "1K6/3P4/k7/8/3R4/8/r7/8 w - - 0 1",
    sequence: ["b8c7", "a2c2", "c7b6", "c2b2", "b6c6", "b2c2", "d4c4"],
    quiz: {
      question: "On which rank is the rook bridge typically constructed in the Lucena Position?",
      options: ["The 1st or 2nd rank", "The 4th or 5th rank", "The 7th or 8th rank", "Any diagonal line"],
      answer: 1
    }
  },
  {
    id: "l25",
    title: "Zugzwang Strategy",
    description: "Place your opponent in a position where any move they make worsens their situation.",
    difficulty: "advanced",
    category: "Strategy",
    content: "Zugzwang is a German word meaning 'compulsion to move'. It describes a scenario where a player is forced to make a move, but any legal move they make will make their position worse. In this pawn endgame, White wants to penetrate Black's position. By playing Ke5, White puts Black in Zugzwang, forcing their King to step back and abandon the defense.",
    fen: "8/8/p1k5/Pp5/1P1K4/8/8/8 w - - 0 1",
    sequence: ["d4e5", "c6c7", "e5e6"],
    quiz: {
      question: "Which of the following describes a Zugzwang?",
      options: [
        "A forced checkmate sequence of 3 moves or less",
        "A situation where having to make a move is a disadvantage that weakens your position",
        "A special opening gambit popular in the 19th century",
        "A draw by threefold repetition of moves"
      ],
      answer: 1
    }
  },
  {
    id: "l26",
    title: "The Ruy Lopez Opening",
    description: "Master White's premier opening seeking early central dominance and bishop pressure.",
    difficulty: "beginner",
    category: "Openings",
    content: "The Ruy Lopez (or Spanish Opening) is one of the oldest and most respected chess openings. After 1. e4 e5 2. Nf3 Nc6, White plays 3. Bb5, applying immediate pressure to the knight that defends the e5 pawn. It leads to rich, strategic battles. Let's play the opening moves up to the Spanish Bishop placement.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sequence: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"],
    quiz: {
      question: "Which square does White's light-squared Bishop target in the Ruy Lopez opening?",
      options: ["c4", "b5", "a4", "d3"],
      answer: 1
    }
  },
  {
    id: "l27",
    title: "The Caro-Kann Defense",
    description: "Master a robust, rock-solid counterattacking opening against White's 1.e4.",
    difficulty: "beginner",
    category: "Openings",
    content: "The Caro-Kann Defense (1. e4 c6) is famous for its solidity and resilience. Unlike the French Defense (1. e4 e6), the Caro-Kann allows Black to develop their light-squared bishop freely before closing the pawn chain. In the Advance Variation, White pushes 3. e5, and Black responds with Bf5. Let's practice the opening moves.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sequence: ["e2e4", "c7c6", "d2d4", "d7d5", "e4e5", "c8f5"],
    quiz: {
      question: "What is a major structural benefit of the Caro-Kann compared to the French Defense?",
      options: [
        "Black can castle on move 3",
        "The light-squared bishop is not trapped behind the e6 pawn chain",
        "White is forced to sacrifice a knight",
        "Black gains an immediate king attack"
      ],
      answer: 1
    }
  },
  {
    id: "l28",
    title: "The King's Indian Defense",
    description: "Learn a dynamic, hypermodern weapon to counter White's 1.d4 using a kingside fianchetto.",
    difficulty: "intermediate",
    category: "Openings",
    content: "The King's Indian Defense (KID) is a hypermodern opening. Instead of occupying the center with pawns early, Black develops pieces, fianchettos the dark-squared bishop, and allows White to build a large center, planning to break it down later. Let's play the classical KID setup.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sequence: ["d2d4", "g8f6", "c2c4", "g7g6", "b1c3", "f8g7"],
    quiz: {
      question: "What does 'hypermodernism' mean in chess openings?",
      options: [
        "Attacking the king on move 2",
        "Controlling the center with pieces from a distance rather than occupying it with pawns early",
        "Developing rooks before knights",
        "Playing without castling"
      ],
      answer: 1
    }
  },
  {
    id: "l29",
    title: "The Sicilian Defense",
    description: "Learn the most popular and combative response to White's 1.e4.",
    difficulty: "intermediate",
    category: "Openings",
    content: "The Sicilian Defense (1. e4 c5) is the most popular counterattack in chess. By fighting for the d4 square with an asymmetric c-pawn instead of e5, Black creates an imbalanced game with active counterplay. In the Open Sicilian, White plays Nf3 and d4, leading to sharp tactical fights. Let's play the starting moves.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sequence: ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6"],
    quiz: {
      question: "Why is the Sicilian Defense considered highly combative?",
      options: [
        "It forces an immediate draw",
        "It creates an asymmetric position that avoids early simplification and leads to rich counterplay",
        "Black is guaranteed to win the white queen",
        "It prevents White from castling"
      ],
      answer: 1
    }
  },
  {
    id: "l30",
    title: "Queen's Gambit Declined",
    description: "Learn one of the most classical, solid answers to White's 1.d4.",
    difficulty: "beginner",
    category: "Openings",
    content: "The Queen's Gambit Declined (1. d4 d5 2. c4 e6) is a cornerstone of opening theory. By declining the gambit pawn, Black maintains a firm foothold in the center with the d5 pawn, supported by the e6 pawn. This leads to deep strategic maneuvering. Let's play the classical line.",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    sequence: ["d2d4", "d7d5", "c2c4", "e7e6", "b1c3", "g8f6"],
    quiz: {
      question: "How does Black defend their center in the Queen's Gambit Declined?",
      options: [
        "By playing f5 to launch a counterattack",
        "By supporting the d5 pawn with the e6 pawn to maintain a strong central foothold",
        "By developing the knight to a6",
        "By advancing the h-pawn"
      ],
      answer: 1
    }
  },
  {
    id: "l31",
    title: "Zwischenzug: The Intermediate Move",
    description: "Surprise your opponent by playing an unexpected forcing move instead of capturing immediately.",
    difficulty: "advanced",
    category: "Tactics",
    content: "A Zwischenzug (German for 'intermediate move') is an unexpected forcing move inserted in the middle of a tactical sequence. Instead of playing the obvious, expected move (like recapturing a piece), you deliver a check or a threat first, improving your position before finishing the sequence. Let's play an intermediate rook check.",
    fen: "r2q1rk1/ppp2ppp/2n1bn2/3p4/8/1B1P1N2/PPP2PPP/RN1QR1K1 w - - 0 1",
    sequence: ["e1e6", "f7e6", "b1c3"],
    quiz: {
      question: "What defines a Zwischenzug?",
      options: [
        "An immediate draw by threefold repetition",
        "A forcing intermediate move played instead of an expected capture or defensive action",
        "A pawn promotion to a knight",
        "Castling on the queenside"
      ],
      answer: 1
    }
  },
  {
    id: "l32",
    title: "King & Rook Checkmate",
    description: "Learn to deliver checkmate using just a King and a Rook.",
    difficulty: "beginner",
    category: "Endgames",
    content: "To deliver checkmate with a King and Rook against a lone King, you must restrict the enemy King, pushing it to the edge of the board. Move your Rook to cut off the King, bring your King to support, and deliver the final blow when the Kings are in opposition. Let's practice a standard waiting move sequence to force checkmate.",
    fen: "3k4/R7/4K3/8/8/8/8/8 w - - 0 1",
    sequence: ["a7h7", "d8e8", "h7h8"],
    quiz: {
      question: "What is the key relationship between the Kings required to deliver checkmate with a Rook?",
      options: [
        "The Kings must be in direct opposition (facing each other with 1 square apart)",
        "The attacking King must be in a corner",
        "The Kings must be diagonally adjacent",
        "Opposition is not required for a Rook checkmate"
      ],
      answer: 0
    }
  },
  {
    id: "l33",
    title: "The Philidor Position",
    description: "Master the classic drawing method in rook and pawn endgames.",
    difficulty: "advanced",
    category: "Endgames",
    content: "The Philidor position is a critical drawing technique in Rook and Pawn endgames. The defender prevents the attacking King from reaching the 6th rank by keeping their rook on the 3rd rank (cutting the King off). Once the attacking pawn advances to the 6th rank, the defender moves their rook to the back rank (1st or 8th) and delivers endless checks from behind. Let's move our rook to the back rank now that the pawn has advanced.",
    fen: "4k3/8/r3P3/4K3/8/8/8/8 b - - 0 1",
    sequence: ["a6a1", "e5d6", "a1d1"],
    quiz: {
      question: "Why does the defender wait for the pawn to advance to the 6th rank before moving the rook to the back rank?",
      options: [
        "Once the pawn moves to the 6th rank, the attacking King can no longer find shelter from checks behind its own pawn",
        "Because moving the rook earlier would result in an immediate checkmate",
        "To allow the defender's King to castle",
        "To capture the pawn on the next move"
      ],
      answer: 0
    }
  },
  {
    id: "l34",
    title: "Square of the Pawn",
    description: "Learn the visual rule to determine if a defending king can catch a runaway pawn.",
    difficulty: "intermediate",
    category: "Endgames",
    content: "The 'Square of the Pawn' is a visualization rule to see if a defending King can catch a runaway pawn without help. Draw a square from the pawn to its promotion rank. If the defending King can step inside this square on its next move, it can catch the pawn. Otherwise, the pawn will promote. In this position, let's step our King into the square to catch the white pawn.",
    fen: "8/8/8/8/P4k2/8/8/4K3 b - - 0 1",
    sequence: ["f4e5", "a4a5", "e5d6"],
    quiz: {
      question: "If a pawn is on a4 and it is the defending King's turn to move, what is the boundary file of the pawn's square?",
      options: ["The c-file", "The d-file", "The e-file", "The f-file"],
      answer: 2
    }
  },
  {
    id: "l35",
    title: "Key Squares & Opposition",
    description: "Learn how to use key squares to secure pawn promotion in king and pawn endgames.",
    difficulty: "advanced",
    category: "Endgames",
    content: "Key squares are critical squares in front of a pawn that, if occupied by your King, guarantee pawn promotion regardless of who has the move. For a pawn on the 4th rank (d4), the key squares are the three squares on the 6th rank (c6, d6, e6). By placing our King on a key square, we box out the enemy King. Let's first take the opposition to force the enemy King aside.",
    fen: "8/3k4/8/4K3/3P4/8/8/8 w - - 0 1",
    sequence: ["e5d5", "d7e7", "d5c6"],
    quiz: {
      question: "What happens if the attacking King successfully occupies a key square in front of its pawn?",
      options: [
        "The pawn promotion is guaranteed with correct play, regardless of who moves next",
        "The game is declared an immediate draw",
        "The defending King can still draw by castling",
        "The attacking King must retreat to defend the pawn"
      ],
      answer: 0
    }
  },
  {
    id: "l36",
    title: "Rook vs Pawn Endgame",
    description: "Learn how to defend or win when a rook fights a runaway pawn.",
    difficulty: "advanced",
    category: "Endgames",
    content: "In Rook vs Pawn endgames, the defending side with the Rook wants to cut off or capture the pawn before it promotes. If the pawn is far advanced, the Rook must block it directly from behind or in front, while the defending King approaches to help. Let's move our Rook to block the pawn from behind, preparing for our King to arrive.",
    fen: "8/8/8/6R1/8/8/6pk/4K3 w - - 0 1",
    sequence: ["g5g8", "h2h3", "e1f2"],
    quiz: {
      question: "What is the key goal of the side with the Rook in Rook vs Pawn endgames?",
      options: [
        "Capture the pawn or block it until the King arrives to capture it",
        "Castle on the next move",
        "Promote their own pawn",
        "Deliver checkmate instantly"
      ],
      answer: 0
    }
  },
  {
    id: "l37",
    title: "Bishop & Knight Mate",
    description: "Deliver checkmate using a bishop and knight.",
    difficulty: "mastery",
    category: "Endgames",
    content: "Mating with a Bishop and Knight is one of the hardest endgames. You can only force checkmate in a corner of the same color as your bishop. You must coordinate your king, bishop, and knight to drive the enemy King to the correct corner. In this position, let's deliver the final checkmate blow with our knight.",
    fen: "k3N3/1B6/1K6/8/8/8/8/8 w - - 0 1",
    sequence: ["e8c7"],
    quiz: {
      question: "In which corner color can you deliver checkmate with a Bishop and Knight?",
      options: [
        "Only in a corner of the same color as the squares your Bishop controls",
        "Only in a corner of the opposite color of your Bishop",
        "In any of the four corners",
        "Checkmate is only possible on the center squares"
      ],
      answer: 0
    }
  },
  {
    id: "l38",
    title: "Stalemate Defenses",
    description: "Use stalemate tactics to save a lost game.",
    difficulty: "advanced",
    category: "Endgames",
    content: "Stalemate is a powerful defensive resource in lost positions. If you have no legal moves and your King is not in check, it is a draw. A common trick is the 'Desperado Piece'—sacrificing your active pieces with check so that your opponent is forced to capture them, leaving you with zero legal moves. Let's sacrifice our Rook with check to force a stalemate draw.",
    fen: "8/6R1/8/8/7q/7k/6p1/7K w - - 0 1",
    sequence: ["g7g3", "h3g3"],
    quiz: {
      question: "What defines a Stalemate?",
      options: [
        "A player has no legal moves and their King is not currently in check, resulting in a draw",
        "A player's King is in checkmate",
        "The game is drawn due to lack of material",
        "The players agree to a draw on move 10"
      ],
      answer: 0
    }
  },
  {
    id: "l39",
    title: "Queen vs Rook",
    description: "Learn to win the Queen vs Rook endgame using tactical forks.",
    difficulty: "mastery",
    category: "Endgames",
    content: "Queen vs Rook is a theoretically won endgame for the Queen, but requires precise play. The winning plan is to use double attacks (forks) to force the Rook away from the King, or force a zugzwang where the Rook must leave the King's defense. Let's deliver a double attack with our Queen to win the Rook.",
    fen: "7k/8/8/r7/4Q3/8/8/4K3 w - - 0 1",
    sequence: ["e4d4", "h8g8", "d4a5"],
    quiz: {
      question: "What is the primary tactical motif used by the Queen to win the enemy Rook in a Queen vs Rook endgame?",
      options: [
        "Double attacks (forks) that check the King and attack the Rook simultaneously",
        "Pins that freeze the Rook indefinitely",
        "Pawn promotion threats",
        "En Passant captures"
      ],
      answer: 0
    }
  }
];

