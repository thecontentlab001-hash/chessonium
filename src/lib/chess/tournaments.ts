export interface Tournament {
  id: string;
  name: string;
  type: "Swiss" | "Arena";
  timeControl: string; // e.g. "3+2", "1+0"
  timeLeft: string;
  playersJoined: number;
  prizeSupport: string;
  status: "active" | "registration" | "completed";
  standings: { rank: number; player: string; rating: number; points: number }[];
}

export const seedTournaments: Tournament[] = [
  {
    id: "t_1",
    name: "Weekly Blitz Championship",
    type: "Swiss",
    timeControl: "3+2",
    timeLeft: "45 mins",
    playersJoined: 248,
    prizeSupport: "$250 Cash Prize + Trophy",
    status: "active",
    standings: [
      { rank: 1, player: "GM Hikaru", rating: 2850, points: 5.5 },
      { rank: 2, player: "IM Rozman", rating: 2420, points: 5.0 },
      { rank: 3, player: "GrandmasterSpassky", rating: 2610, points: 4.5 },
      { rank: 4, player: "TacticalToby", rating: 1450, points: 4.0 },
      { rank: 5, player: "CaroMaster", rating: 1530, points: 3.5 }
    ]
  },
  {
    id: "t_2",
    name: "Bullet Arena (Hourly)",
    type: "Arena",
    timeControl: "1+0",
    timeLeft: "12 mins",
    playersJoined: 512,
    prizeSupport: "Exclusive Board Themes",
    status: "active",
    standings: [
      { rank: 1, player: "DanyaNaroditsky", rating: 2790, points: 28 },
      { rank: 2, player: "ZubairChess", rating: 2310, points: 20 },
      { rank: 3, player: "BulletMaster", rating: 2150, points: 18 }
    ]
  },
  {
    id: "t_3",
    name: "Grandmaster Classical Invitational",
    type: "Swiss",
    timeControl: "90+30",
    timeLeft: "Registration Open",
    playersJoined: 16,
    prizeSupport: "$5000 Grand Prize",
    status: "registration",
    standings: []
  }
];
