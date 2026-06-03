import { Chess } from "chess.js";
import { GameConfig, GameStatus, PieceColor } from "./types";
import { GameState } from "./GameState";
import { EngineEventDispatcher } from "./events";
import { MoveExecutor } from "./MoveExecutor";
import { generateChess960FEN } from "../variants";

export class GameEngine extends EngineEventDispatcher {
  state: GameState;
  private chess: Chess;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: GameConfig, initialFen?: string) {
    super();
    let startFen = initialFen;
    if (!startFen) {
      if (config.mode === "chess960") {
        startFen = generateChess960FEN();
      } else {
        startFen = undefined; // defaults to starting position in chess.js
      }
    }

    this.chess = new Chess(startFen);
    this.state = new GameState(config, this.chess.fen());
  }

  // Getters for proxying state
  get fen(): string {
    return this.state.fen;
  }

  get history(): string[] {
    return this.state.history;
  }

  get status(): GameStatus {
    return this.state.status;
  }

  get winner(): PieceColor | "draw" | null {
    return this.state.winner;
  }

  get gameOverReason(): string {
    return this.state.gameOverReason;
  }

  get clocks() {
    return this.state.clocks;
  }

  get threeCheckCounts() {
    return this.state.threeCheckCounts;
  }

  get chessInstance(): Chess {
    return this.chess;
  }

  startGame() {
    this.state.updateStatus("active");
    this.dispatchEvent("statusChange", { status: "active" });
    this.startClock();
  }

  stopGame(winner: PieceColor | "draw", reason: string, status: GameStatus = "resignation") {
    this.stopClock();
    this.state.updateStatus(status, winner, reason);
    this.dispatchEvent("statusChange", { status });
    this.dispatchEvent("gameOver", { winner, reason, status });
  }

  makeMove(from: string, to: string, promotion?: string): boolean {
    if (this.state.status !== "active" && this.state.status !== "setup") {
      return false;
    }

    const currentTurn = this.chess.turn() as "w" | "b";

    const result = MoveExecutor.executeMove(this.state, this.chess, from, to, promotion);
    if (!result.success) {
      return false;
    }

    // Success! Add time increment if the game is active
    if (this.state.status === "active") {
      this.state.addIncrement(currentTurn);
    }

    // Dispatch move event
    this.dispatchEvent("move", {
      fen: this.state.fen,
      moveSan: result.moveSan || "",
      history: this.state.history,
    });

    if (result.inCheck) {
      const checkedColor: PieceColor = this.chess.turn() === "b" ? "black" : "white";
      this.dispatchEvent("check", { checkedColor });
    }

    // Dispatch status change or game over if applicable
    if (result.variantWin) {
      this.stopClock();
      this.dispatchEvent("statusChange", { status: this.state.status });
      this.dispatchEvent("gameOver", {
        winner: result.variantWin,
        reason: result.winReason || "Variant win condition met",
        status: this.state.status,
      });
    } else if (this.chess.isGameOver()) {
      this.stopClock();
      this.dispatchEvent("statusChange", { status: this.state.status });
      this.dispatchEvent("gameOver", {
        winner: this.state.winner!,
        reason: this.state.gameOverReason,
        status: this.state.status,
      });
    }

    return true;
  }

  startClock() {
    if (this.intervalId) return;

    this.state.startClock();
    this.intervalId = setInterval(() => {
      const turn = this.chess.turn();
      const isTimeout = this.state.tickClock(turn);

      this.dispatchEvent("clockTick", {
        whiteTime: this.state.clocks.whiteTime,
        blackTime: this.state.clocks.blackTime,
      });

      if (isTimeout) {
        const winner: PieceColor = turn === "w" ? "black" : "white";
        this.stopGame(winner, "Timeout", "timeout");
      }
    }, 1000);
  }

  stopClock() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.state.stopClock();
  }

  destroy() {
    this.stopClock();
  }
}
