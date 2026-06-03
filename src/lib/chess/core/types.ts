export type PieceColor = "white" | "black";

export type GameMode = "normal" | "chess960" | "kingofthehill" | "threecheck";

export type GameStatus = "setup" | "active" | "checkmate" | "draw" | "resignation" | "timeout" | "variant_win";

export interface Player {
  id: string;
  username: string;
  rating: number;
  color: PieceColor;
}

export interface TimeControl {
  initialSeconds: number;
  incrementSeconds: number;
}

export interface ClockState {
  whiteTime: number;
  blackTime: number;
  isTicking: boolean;
}

export interface ThreeCheckCounts {
  white: number;
  black: number;
}

export interface GameConfig {
  mode: GameMode;
  timeControl: TimeControl;
  playerColor: PieceColor;
  botId?: string;
  opponent?: Player;
}
