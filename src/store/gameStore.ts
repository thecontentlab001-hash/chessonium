"use client";

import { useSyncExternalStore } from "react";
import { GameMode, PieceColor } from "../lib/chess/core/types";

export interface ImportedData {
  username: string;
  bullet: number;
  blitz: number;
  rapid: number;
  gamesCount: number;
}

export interface ConnectedGame {
  id: string;
  platform: "chesscom" | "lichess";
  opponent: string;
  opponentRating: number;
  myRating: number;
  result: "win" | "loss" | "draw";
  color: "white" | "black";
  date: string;
  accuracy?: number;
  isAnalyzing?: boolean;
  pgn?: string;
}

export interface GameHistoryEntry {
  id: string;
  mode: GameMode;
  opponent: string;
  opponentElo: number;
  userColor: PieceColor;
  result: "win" | "loss" | "draw";
  reason: string;
  date: string;
}

export interface GameStoreState {
  chesscomConnected: boolean;
  lichessConnected: boolean;
  chesscomUsername: string;
  lichessUsername: string;
  chesscomData: ImportedData | null;
  lichessData: ImportedData | null;
  importedGames: ConnectedGame[];
  userElo: number;
  matchHistory: GameHistoryEntry[];
}

const DEFAULT_STATE: GameStoreState = {
  chesscomConnected: false,
  lichessConnected: false,
  chesscomUsername: "",
  lichessUsername: "",
  chesscomData: null,
  lichessData: null,
  importedGames: [
    { id: "g1", platform: "chesscom", opponent: "TacticsFanatic", opponentRating: 1510, myRating: 1490, result: "win", color: "white", date: "2026-06-01" },
    { id: "g2", platform: "lichess", opponent: "SpasskyReborn", opponentRating: 1620, myRating: 1550, result: "loss", color: "black", date: "2026-05-30" },
    { id: "g3", platform: "chesscom", opponent: "ChessLover44", opponentRating: 1450, myRating: 1485, result: "draw", color: "white", date: "2026-05-29" },
    { id: "g4", platform: "lichess", opponent: "StrategicMini", opponentRating: 1700, myRating: 1580, result: "win", color: "black", date: "2026-05-28" }
  ],
  userElo: 1500,
  matchHistory: [],
};

let state: GameStoreState = { ...DEFAULT_STATE };

// Initialize client-side state
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("game-store");
    if (saved) {
      state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
    }
    const username = localStorage.getItem("username");
    if (username) {
      setTimeout(() => {
        gameStore.syncFromCloud(username);
      }, 50);
    }
  } catch (e) {
    console.error("Failed to load game-store preferences from localStorage", e);
  }
}

const listeners = new Set<(state: GameStoreState) => void>();

export const gameStore = {
  getState(): GameStoreState {
    return state;
  },

  subscribe(listener: (state: GameStoreState) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  connectPlatform(platform: "chesscom" | "lichess", username: string, data: ImportedData, games?: ConnectedGame[]) {
    const imported = games || [];
    if (platform === "chesscom") {
      state = {
        ...state,
        chesscomConnected: true,
        chesscomUsername: username,
        chesscomData: data,
        importedGames: [...imported, ...state.importedGames.filter((g) => g.platform !== "chesscom")]
      };
    } else {
      state = {
        ...state,
        lichessConnected: true,
        lichessUsername: username,
        lichessData: data,
        importedGames: [...imported, ...state.importedGames.filter((g) => g.platform !== "lichess")]
      };
    }
    this._notify();
  },

  disconnectPlatform(platform: "chesscom" | "lichess") {
    if (platform === "chesscom") {
      state = {
        ...state,
        chesscomConnected: false,
        chesscomUsername: "",
        chesscomData: null
      };
    } else {
      state = {
        ...state,
        lichessConnected: false,
        lichessUsername: "",
        lichessData: null
      };
    }
    this._notify();
  },

  setAnalyzingGame(gameId: string, isAnalyzing: boolean) {
    state = {
      ...state,
      importedGames: state.importedGames.map((g) =>
        g.id === gameId ? { ...g, isAnalyzing } : g
      )
    };
    this._notify();
  },

  updateImportedGameAccuracy(gameId: string, accuracy: number) {
    state = {
      ...state,
      importedGames: state.importedGames.map((g) =>
        g.id === gameId ? { ...g, accuracy } : g
      )
    };
    this._notify();
  },

  addLocalGameToHistory(
    mode: GameMode,
    opponent: string,
    opponentElo: number,
    userColor: PieceColor,
    result: "win" | "loss" | "draw",
    reason: string
  ) {
    const newEntry: GameHistoryEntry = {
      id: `game_${Date.now()}`,
      mode,
      opponent,
      opponentElo,
      userColor,
      result,
      reason,
      date: new Date().toISOString().split("T")[0]
    };
    state = {
      ...state,
      matchHistory: [newEntry, ...state.matchHistory]
    };
    this._notify();
  },

  updateElo(newElo: number) {
    state = { ...state, userElo: newElo };
    this._notify();
  },

  async syncFromCloud(username: string) {
    try {
      const res = await fetch(`/api/db?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const body = await res.json();
        if (body.status === "success" && body.data) {
          state = {
            ...state,
            ...body.data,
          };
          this._notify(false);
        }
      }
    } catch (e) {
      console.error("Failed to sync store state from cloud database:", e);
    }
  },

  _notify(syncToCloud = true) {
    listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error("Error in gameStore listener:", err);
      }
    });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("game-store", JSON.stringify(state));
        
        // Sync to cloud database if user is logged in
        const username = localStorage.getItem("username");
        if (username && syncToCloud) {
          fetch("/api/db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, state })
          }).catch(err => console.error("Cloud DB sync failed:", err));
        }
      } catch (e) {
        console.error("Failed to save game-store to localStorage", e);
      }
    }
  }
};

export function useGameStore(): GameStoreState {
  return useSyncExternalStore(
    gameStore.subscribe,
    gameStore.getState,
    () => DEFAULT_STATE
  );
}
