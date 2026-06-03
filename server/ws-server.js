const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 3001 });
console.log("WebSocket Server running on ws://localhost:3001");

// State: active connections, matchmaking queues, and ongoing game rooms
const clients = new Map(); // ws -> user data { id, username, rating }
const matchmakingQueues = {
  bullet: [],
  blitz: [],
  rapid: [],
  classical: []
};
const games = new Map(); // gameId -> game state

// Helper for FIDE-style Elo calculations
function calculateNewRatings(whiteRating, blackRating, outcome, kFactor = 32) {
  // Outcome: 1 = white wins, 0 = black wins, 0.5 = draw
  const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
  const expectedBlack = 1 - expectedWhite;

  const actualWhite = outcome;
  const actualBlack = 1 - outcome;

  const newWhite = Math.round(whiteRating + kFactor * (actualWhite - expectedWhite));
  const newBlack = Math.round(blackRating + kFactor * (actualBlack - expectedBlack));

  return {
    whiteChange: newWhite - whiteRating,
    blackChange: newBlack - blackRating,
    newWhite,
    newBlack
  };
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (messageStr) => {
    try {
      const message = JSON.parse(messageStr);
      const { type, payload } = message;

      switch (type) {
        case "join_session": {
          // Register player
          const { id, username, rating } = payload;
          clients.set(ws, { id, username, rating: rating || 1200 });
          console.log(`Player registered: ${username} (${rating || 1200} Elo)`);
          ws.send(JSON.stringify({ type: "session_joined", payload: { status: "ok" } }));
          break;
        }

        case "join_queue": {
          // Player wants to play a game of specific category
          const player = clients.get(ws);
          if (!player) return;

          const { category } = payload; // bullet, blitz, rapid, classical
          if (!matchmakingQueues[category]) return;

          // Remove player from queue if already there to avoid duplicates
          matchmakingQueues[category] = matchmakingQueues[category].filter(p => p.ws !== ws);
          matchmakingQueues[category].push({ ws, ...player });

          console.log(`${player.username} joined ${category} queue. Queue size: ${matchmakingQueues[category].length}`);
          ws.send(JSON.stringify({ type: "queue_joined", payload: { category } }));

          // Run Matchmaker
          checkMatches(category);
          break;
        }

        case "leave_queue": {
          const player = clients.get(ws);
          if (!player) return;
          const { category } = payload;
          if (matchmakingQueues[category]) {
            matchmakingQueues[category] = matchmakingQueues[category].filter(p => p.ws !== ws);
            console.log(`${player.username} left ${category} queue.`);
            ws.send(JSON.stringify({ type: "queue_left" }));
          }
          break;
        }

        case "send_move": {
          const { gameId, from, to, promotion } = payload;
          const game = games.get(gameId);
          if (!game) return;

          // Send move to opponent
          const opponentWs = ws === game.white.ws ? game.black.ws : game.white.ws;
          if (opponentWs.readyState === ws.OPEN) {
            opponentWs.send(JSON.stringify({
              type: "opponent_move",
              payload: { from, to, promotion }
            }));
          }
          break;
        }

        case "game_over": {
          const { gameId, outcome } = payload; // "white", "black", "draw"
          const game = games.get(gameId);
          if (!game) return;

          let score = 0.5; // Draw
          if (outcome === "white") score = 1;
          if (outcome === "black") score = 0;

          const ratingChanges = calculateNewRatings(
            game.white.rating,
            game.black.rating,
            score
          );

          // Broadcast results to both players
          const gameOverPayload = {
            gameId,
            outcome,
            newWhiteRating: ratingChanges.newWhite,
            newBlackRating: ratingChanges.newBlack,
            whiteChange: ratingChanges.whiteChange,
            blackChange: ratingChanges.blackChange
          };

          const msg = JSON.stringify({ type: "game_finished", payload: gameOverPayload });
          if (game.white.ws.readyState === ws.OPEN) game.white.ws.send(msg);
          if (game.black.ws.readyState === ws.OPEN) game.black.ws.send(msg);

          games.delete(gameId);
          console.log(`Game ${gameId} finished. Winner: ${outcome}. Rating changes calculated.`);
          break;
        }
      }
    } catch (e) {
      console.error("Error processing websocket message:", e);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    // Clean up queues
    Object.keys(matchmakingQueues).forEach(cat => {
      matchmakingQueues[cat] = matchmakingQueues[cat].filter(p => p.ws !== ws);
    });
    clients.delete(ws);
  });
});

function checkMatches(category) {
  const queue = matchmakingQueues[category];
  if (queue.length < 2) return;

  // Simple FIFO matchmaker: take the first two players
  const player1 = queue.shift();
  const player2 = queue.shift();

  const gameId = Math.random().toString(36).substring(2, 11);
  const isP1White = Math.random() > 0.5;

  const white = isP1White ? player1 : player2;
  const black = isP1White ? player2 : player1;

  games.set(gameId, {
    id: gameId,
    white: { ws: white.ws, id: white.id, username: white.username, rating: white.rating },
    black: { ws: black.ws, id: black.id, username: black.username, rating: black.rating },
    category
  });

  // Notify players game is starting
  white.ws.send(JSON.stringify({
    type: "game_start",
    payload: {
      gameId,
      color: "white",
      opponent: { username: black.username, rating: black.rating }
    }
  }));

  black.ws.send(JSON.stringify({
    type: "game_start",
    payload: {
      gameId,
      color: "black",
      opponent: { username: white.username, rating: white.rating }
    }
  }));

  console.log(`Match created: Game ${gameId} (${category}) - White: ${white.username} vs Black: ${black.username}`);
}
