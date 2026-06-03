import { GameMode, GameStatus, PieceColor, ClockState, ThreeCheckCounts, GameConfig } from "./types";

export class GameState {
  fen: string;
  history: string[];
  status: GameStatus;
  winner: PieceColor | "draw" | null = null;
  gameOverReason: string = "";
  clocks: ClockState;
  threeCheckCounts: ThreeCheckCounts;
  config: GameConfig;

  constructor(config: GameConfig, initialFen: string) {
    this.config = config;
    this.fen = initialFen;
    this.history = [];
    this.status = "setup";
    
    // Set clock times in seconds
    const initialTime = config.timeControl.initialSeconds;
    this.clocks = {
      whiteTime: initialTime,
      blackTime: initialTime,
      isTicking: false
    };

    this.threeCheckCounts = {
      white: 0,
      black: 0
    };
  }

  updatePosition(fen: string, history: string[]) {
    this.fen = fen;
    this.history = history;
  }

  updateStatus(status: GameStatus, winner: PieceColor | "draw" | null = null, reason = "") {
    this.status = status;
    this.winner = winner;
    this.gameOverReason = reason;
  }

  incrementCheck(color: PieceColor): number {
    this.threeCheckCounts[color]++;
    return this.threeCheckCounts[color];
  }

  tickClock(turn: "w" | "b"): boolean {
    if (!this.clocks.isTicking) return false;

    if (turn === "w") {
      this.clocks.whiteTime = Math.max(0, this.clocks.whiteTime - 1);
      return this.clocks.whiteTime === 0;
    } else {
      this.clocks.blackTime = Math.max(0, this.clocks.blackTime - 1);
      return this.clocks.blackTime === 0;
    }
  }

  addIncrement(turn: "w" | "b") {
    const inc = this.config.timeControl.incrementSeconds;
    if (turn === "w") {
      this.clocks.whiteTime += inc;
    } else {
      this.clocks.blackTime += inc;
    }
  }

  startClock() {
    this.clocks.isTicking = true;
  }

  stopClock() {
    this.clocks.isTicking = false;
  }
}
