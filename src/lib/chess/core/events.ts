import { GameStatus, PieceColor } from "./types";

export interface EngineEventMap {
  move: { fen: string; moveSan: string; history: string[] };
  gameOver: { winner: PieceColor | "draw"; reason: string; status: GameStatus };
  clockTick: { whiteTime: number; blackTime: number };
  statusChange: { status: GameStatus };
  check: { checkedColor: PieceColor };
}

export type EngineEventName = keyof EngineEventMap;

export type EngineListener<K extends EngineEventName> = (data: EngineEventMap[K]) => void;

export class EngineEventDispatcher {
  private listeners: { [K in EngineEventName]?: Set<any> } = {};

  addEventListener<K extends EngineEventName>(event: K, listener: EngineListener<K>) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set<any>();
    }
    this.listeners[event]!.add(listener);
  }

  removeEventListener<K extends EngineEventName>(event: K, listener: EngineListener<K>) {
    this.listeners[event]?.delete(listener);
  }

  dispatchEvent<K extends EngineEventName>(event: K, data: EngineEventMap[K]) {
    this.listeners[event]?.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error(`Error executing engine listener for event: ${event}`, err);
      }
    });
  }
}
