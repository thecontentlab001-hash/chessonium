export interface PastSelfProfile {
  id: string;
  name: string;
  elo: number;
  timeframe: string;
  description: string;
  weaknesses: string[];
  strengths: string[];
  aggression: number; // 0 to 10
  tacticalIndex: number; // 0 to 100
  favoriteOpening: string;
  typicalMistake: string;
}

export const pastSelfProfiles: PastSelfProfile[] = [
  {
    id: "self_1m",
    name: "You (1 Month Ago)",
    elo: 1432,
    timeframe: "1 Month Ago",
    description: "Slightly less polished in endgames, but highly familiar with your current opening choices.",
    weaknesses: ["Rook Endgames", "Time Management"],
    strengths: ["Tactical Combinations", "King's Indian Defense"],
    aggression: 7,
    tacticalIndex: 72,
    favoriteOpening: "King's Indian Defense",
    typicalMistake: "Tends to rush moves under 30 seconds left on the clock."
  },
  {
    id: "self_6m",
    name: "You (6 Months Ago)",
    elo: 1320,
    timeframe: "6 Months Ago",
    description: "Aggressive but prone to tactical oversight. Plays highly volatile middle games.",
    weaknesses: ["Knight Forks", "King Safety"],
    strengths: ["Italian Game", "Aggressive Attacks"],
    aggression: 9,
    tacticalIndex: 58,
    favoriteOpening: "Italian Game (Evans Gambit)",
    typicalMistake: "Overextends pawns in front of the castled king."
  },
  {
    id: "self_1y",
    name: "You (1 Year Ago)",
    elo: 1150,
    timeframe: "1 Year Ago",
    description: "Beginner-Intermediate. Prone to basic pin tactics and hung pieces.",
    weaknesses: ["Pinned Pieces", "Back Rank Mate", "Basic Endgames"],
    strengths: ["Basic Openings", "Queen Development"],
    aggression: 5,
    tacticalIndex: 35,
    favoriteOpening: "Queen's Gambit Accepted",
    typicalMistake: "Often blunders pieces due to absolute pins on the queen."
  }
];
