export interface Post {
  id: string;
  author: string;
  avatarColor: string;
  content: string;
  likes: number;
  comments: { author: string; text: string }[];
  sharedItem?: {
    type: "game" | "puzzle" | "achievement";
    title: string;
    details: string;
    link: string;
  };
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  members: number;
  imageColor: string;
  joined: boolean;
}

export interface ForumTopic {
  id: string;
  title: string;
  author: string;
  replies: number;
  category: "General" | "Openings" | "Tactics" | "Tournaments";
  lastActive: string;
}

export const seedPosts: Post[] = [
  {
    id: "p_1",
    author: "GrandmasterSpassky",
    avatarColor: "from-blue-400 to-indigo-500",
    content: "Just managed to convert this endgame with less than 10 seconds left. Active rooks make all the difference!",
    likes: 84,
    comments: [
      { author: "FischerFanatic", text: "Brilliant defense in the middle game!" },
      { author: "CaroMaster", text: "Lucena bridge in action, love to see it." }
    ],
    sharedItem: {
      type: "game",
      title: "Caro-Kann Advance: GM Spassky vs IM Nakamura",
      details: "1. e4 c6 2. d4 d5 3. e5 Bf5 ... Outcome: White wins (mate)",
      link: "/play"
    },
    createdAt: "2 hours ago"
  },
  {
    id: "p_2",
    author: "TacticalToby",
    avatarColor: "from-yellow-400 to-orange-500",
    content: "Today's daily puzzle was a real mind-bender. Don't fall for the queen trap early on!",
    likes: 31,
    comments: [
      { author: "PawnPusher", text: "Took me three retries but got the underpromotion." }
    ],
    sharedItem: {
      type: "puzzle",
      title: "Daily Puzzle #129",
      details: "Rating: 1500 • Theme: Underpromotion Triumph",
      link: "/puzzles"
    },
    createdAt: "5 hours ago"
  },
  {
    id: "p_3",
    author: "ChessJourneyBot",
    avatarColor: "from-green-400 to-emerald-500",
    content: "Milestone reached! Player 'TacticalToby' just reached Level 15 (Advanced Tactician) and unlocked the 'Greek Gift Master' badge.",
    likes: 120,
    comments: [
      { author: "GrandmasterSpassky", text: "Keep pushing, GM status awaits!" }
    ],
    sharedItem: {
      type: "achievement",
      title: "Level 15 Reached 🎉",
      details: "Unlocked: Master Title • Strength Prediction: 1520 Elo",
      link: "/journey"
    },
    createdAt: "1 day ago"
  }
];

export const seedClubs: Club[] = [
  {
    id: "c_1",
    name: "The London System Haters",
    description: "For players seeking sharp, exciting games. We study tactical Sicilian lines and dynamic counters.",
    members: 1420,
    imageColor: "from-red-500 to-pink-600",
    joined: false
  },
  {
    id: "c_2",
    name: "Endgame Wizards",
    description: "Lucena position, Philidor defense, opposition rules. We master the critical last phase of the board.",
    members: 890,
    imageColor: "from-purple-500 to-indigo-600",
    joined: true
  },
  {
    id: "c_3",
    name: "Evans Gambit Specialists",
    description: "Sacrifice pawns for rapid development and crushing king attacks. Fun and active openings focus.",
    members: 650,
    imageColor: "from-cyan-500 to-blue-600",
    joined: false
  }
];

export const seedForums: ForumTopic[] = [
  {
    id: "f_1",
    title: "Is the Sicilian Najdorf still viable at amateur levels?",
    author: "NajdorfKnight",
    replies: 42,
    category: "Openings",
    lastActive: "10 mins ago"
  },
  {
    id: "f_2",
    title: "Best resources to study pawn structure dynamics?",
    author: "PawnSymmetry",
    replies: 18,
    category: "General",
    lastActive: "1 hour ago"
  },
  {
    id: "f_3",
    title: "Why does Stockfish prefer passive defense in this endgame position?",
    author: "EngineLogic",
    replies: 29,
    category: "Tactics",
    lastActive: "3 hours ago"
  }
];
