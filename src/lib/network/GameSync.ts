import { SocketManager, globalSocketManager } from "./SocketManager";
import { GameEngine } from "../chess/core/GameEngine";
import { PieceColor, Player } from "../chess/core/types";

export interface GameSyncListener {
  onMatchFound: (gameId: string, color: PieceColor, opponent: Player) => void;
  onMoveReceived: (from: string, to: string, promotion?: string) => void;
  onGameOverReceived: (winner: PieceColor | "draw", reason: string) => void;
  onQueueStatus: (status: "idle" | "queued" | "playing") => void;
}

export class GameSync {
  private socketManager: SocketManager;
  private unsubscribe: (() => void) | null = null;
  private currentEngine: GameEngine | null = null;
  private currentGameId: string | null = null;
  private localColor: PieceColor = "white";
  private listeners = new Set<GameSyncListener>();

  constructor(socketManager: SocketManager = globalSocketManager) {
    this.socketManager = socketManager;
    this.setupListeners();
  }

  private setupListeners() {
    this.unsubscribe = this.socketManager.subscribe({
      onMessage: (type, payload) => {
        switch (type) {
          case "queue_joined":
            this.listeners.forEach((l) => l.onQueueStatus("queued"));
            break;
          case "queue_left":
            this.listeners.forEach((l) => l.onQueueStatus("idle"));
            break;
          case "game_start":
            this.currentGameId = payload.gameId;
            this.localColor = payload.color;
            this.listeners.forEach((l) => l.onQueueStatus("playing"));
            
            const opponent: Player = {
              id: payload.opponent.id || "opponent_id",
              username: payload.opponent.username,
              rating: payload.opponent.rating,
              color: payload.color === "white" ? "black" : "white"
            };

            this.listeners.forEach((l) => {
              try {
                l.onMatchFound(payload.gameId, payload.color, opponent);
              } catch (err) {
                console.error("Error in onMatchFound listener:", err);
              }
            });
            break;
          case "opponent_move":
            // Apply move to engine if bound and it's opponent's move
            if (this.currentEngine && this.currentGameId) {
              const turnAfter = this.currentEngine.chessInstance.turn();
              const expectedTurn = this.localColor === "white" ? "w" : "b";
              // Only apply move from socket if it's currently our turn to play
              if (turnAfter === expectedTurn) {
                this.currentEngine.makeMove(payload.from, payload.to, payload.promotion);
              }
            }
            this.listeners.forEach((l) => {
              try {
                l.onMoveReceived(payload.from, payload.to, payload.promotion);
              } catch (err) {
                console.error("Error in onMoveReceived listener:", err);
              }
            });
            break;
          case "game_finished":
            this.currentGameId = null;
            this.listeners.forEach((l) => l.onQueueStatus("idle"));
            const winner = payload.winner || payload.outcome;
            this.listeners.forEach((l) => {
              try {
                l.onGameOverReceived(winner, payload.reason || "Game finished");
              } catch (err) {
                console.error("Error in onGameOverReceived listener:", err);
              }
            });
            break;
        }
      },
      onStatusChange: (connected) => {
        if (!connected) {
          this.listeners.forEach((l) => l.onQueueStatus("idle"));
          this.currentGameId = null;
        }
      }
    });
  }

  bindEngine(engine: GameEngine, gameId: string, localColor: PieceColor) {
    this.currentEngine = engine;
    this.currentGameId = gameId;
    this.localColor = localColor;

    // Listen to local engine moves to send them to the server
    engine.addEventListener("move", (data) => {
      if (!this.currentGameId) return;

      // The move was already made, so check if the turn of the move just made matches localColor
      const turnAfterMove = engine.chessInstance.turn();
      const justMovedColor: PieceColor = turnAfterMove === "b" ? "white" : "black";
      
      if (justMovedColor === this.localColor) {
        // Send move to socket
        const history = engine.chessInstance.history({ verbose: true });
        const lastMove = history[history.length - 1];
        if (lastMove) {
          this.sendMove(lastMove.from, lastMove.to, lastMove.promotion);
        }
      }
    });

    // Listen to game over to notify server
    engine.addEventListener("gameOver", (data) => {
      if (!this.currentGameId) return;
      this.declareGameOver(data.winner);
    });
  }

  unbindEngine() {
    this.currentEngine = null;
    this.currentGameId = null;
  }

  joinQueue(category: string) {
    this.socketManager.send("join_queue", { category });
  }

  leaveQueue(category: string) {
    this.socketManager.send("leave_queue", { category });
  }

  sendMove(from: string, to: string, promotion?: string) {
    if (!this.currentGameId) return;
    this.socketManager.send("send_move", {
      gameId: this.currentGameId,
      from,
      to,
      promotion
    });
  }

  declareGameOver(outcome: PieceColor | "draw") {
    if (!this.currentGameId) return;
    this.socketManager.send("game_over", {
      gameId: this.currentGameId,
      outcome
    });
  }

  subscribe(listener: GameSyncListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.listeners.clear();
  }
}

export const globalGameSync = new GameSync();
