export interface ExternalProfile {
  username: string;
  bullet: number;
  blitz: number;
  rapid: number;
  gamesCount: number;
}

export interface ExternalGame {
  id: string;
  platform: "chesscom" | "lichess";
  opponent: string;
  opponentRating: number;
  myRating: number;
  result: "win" | "loss" | "draw";
  color: "white" | "black";
  date: string;
  pgn: string;
}

export async function fetchChesscomProfile(username: string): Promise<ExternalProfile> {
  const statsRes = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
  if (!statsRes.ok) throw new Error("Chess.com player stats not found");
  const stats = await statsRes.json();

  const bullet = stats.chess_bullet?.last?.rating || 1200;
  const blitz = stats.chess_blitz?.last?.rating || 1200;
  const rapid = stats.chess_rapid?.last?.rating || 1200;

  // Fetch archives to count games
  const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
  let gamesCount = 0;
  if (archivesRes.ok) {
    const data = await archivesRes.json();
    gamesCount = data.archives ? data.archives.length * 20 : 0;
  }

  return { username, bullet, blitz, rapid, gamesCount };
}

export async function fetchChesscomGames(username: string): Promise<ExternalGame[]> {
  try {
    const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
    if (!archivesRes.ok) return [];
    const archives = await archivesRes.json();
    if (!archives.archives || archives.archives.length === 0) return [];

    // Fetch latest archive
    const latestArchiveUrl = archives.archives[archives.archives.length - 1];
    const gamesRes = await fetch(latestArchiveUrl);
    if (!gamesRes.ok) return [];
    const data = await gamesRes.json();

    const games: ExternalGame[] = data.games.slice(-20).map((g: any, index: number) => {
      const isWhite = g.white.username.toLowerCase() === username.toLowerCase();
      const opponent = isWhite ? g.black.username : g.white.username;
      const opponentRating = isWhite ? g.black.rating : g.white.rating;
      const myRating = isWhite ? g.white.rating : g.black.rating;
      const myResult = isWhite ? g.white.result : g.black.result;
      
      let result: "win" | "loss" | "draw" = "draw";
      if (myResult === "win") result = "win";
      else if (["checkmated", "timeout", "resigned", "lose"].includes(myResult)) result = "loss";

      const date = new Date(g.end_time * 1000).toISOString().split("T")[0];

      return {
        id: `cc_${index}_${g.end_time}`,
        platform: "chesscom",
        opponent,
        opponentRating,
        myRating,
        result,
        color: isWhite ? "white" : "black",
        date,
        pgn: g.pgn || `[White "${g.white.username}"]\n[Black "${g.black.username}"]\n[Result "${g.white.result === "win" ? "1-0" : "0-1"}"]\n\n${g.fen}`
      };
    });

    return games.reverse();
  } catch (error) {
    console.error("Failed to fetch Chess.com games:", error);
    return [];
  }
}

export async function fetchLichessProfile(username: string): Promise<ExternalProfile> {
  const res = await fetch(`https://lichess.org/api/user/${username}`);
  if (!res.ok) throw new Error("Lichess user profile not found");
  const data = await res.json();

  return {
    username,
    bullet: data.perfs?.bullet?.rating || 1200,
    blitz: data.perfs?.blitz?.rating || 1200,
    rapid: data.perfs?.rapid?.rating || 1200,
    gamesCount: data.count?.all || 0
  };
}

export async function fetchLichessGames(username: string): Promise<ExternalGame[]> {
  try {
    const res = await fetch(`https://lichess.org/api/games/user/${username}?max=20&moves=true&pgnInJson=false`);
    if (!res.ok) return [];
    const text = await res.text();
    
    // Parse PGN stream from lichess (separated by double newlines + empty line spacing)
    const pgnBlocks = text.split("\n\n\n").filter(Boolean);
    
    return pgnBlocks.map((block, index) => {
      const whiteMatch = block.match(/\[White "([^"]+)"\]/);
      const blackMatch = block.match(/\[Black "([^"]+)"\]/);
      const whiteEloMatch = block.match(/\[WhiteElo "([^"]+)"\]/);
      const blackEloMatch = block.match(/\[BlackElo "([^"]+)"\]/);
      const dateMatch = block.match(/\[UTCDate "([^"]+)"\]/);
      const resultMatch = block.match(/\[Result "([^"]+)"\]/);

      const white = whiteMatch ? whiteMatch[1] : "White";
      const black = blackMatch ? blackMatch[1] : "Black";
      const isWhite = white.toLowerCase() === username.toLowerCase();
      
      const opponent = isWhite ? black : white;
      const opponentRating = Number(isWhite ? (blackEloMatch ? blackEloMatch[1] : "1500") : (whiteEloMatch ? whiteEloMatch[1] : "1500"));
      const myRating = Number(isWhite ? (whiteEloMatch ? whiteEloMatch[1] : "1500") : (blackEloMatch ? blackEloMatch[1] : "1500"));
      
      const rawResult = resultMatch ? resultMatch[1] : "*";
      let result: "win" | "loss" | "draw" = "draw";
      if (rawResult === "1-0") {
        result = isWhite ? "win" : "loss";
      } else if (rawResult === "0-1") {
        result = isWhite ? "loss" : "win";
      }

      const date = dateMatch ? dateMatch[1].replace(/\./g, "-") : new Date().toISOString().split("T")[0];

      return {
        id: `li_${index}_${Date.now()}`,
        platform: "lichess",
        opponent,
        opponentRating,
        myRating,
        result,
        color: isWhite ? "white" : "black",
        date,
        pgn: block
      };
    });
  } catch (error) {
    console.error("Failed to fetch Lichess games:", error);
    return [];
  }
}
