"use client";

import { useSyncExternalStore } from "react";

export type BoardTheme = "classic" | "glass" | "emerald" | "wood" | "ocean" | "neon" | "midnight";
export type PieceStyle = "cburnett" | "neo" | "alpha" | "merida";
export type DefaultPromotion = "queen" | "rook" | "bishop" | "knight" | "ask";
export type AnimationSpeed = "none" | "fast" | "normal" | "slow";

export interface UIStoreState {
  boardTheme: BoardTheme;
  pieceStyle: PieceStyle;
  blindfold: boolean;
  coordinates: boolean;
  highlightMoves: boolean;
  defaultPromotion: DefaultPromotion;
  soundVolume: number;          // 0-100
  moveSoundEnabled: boolean;
  captureSoundEnabled: boolean;
  checkSoundEnabled: boolean;
  animationSpeed: AnimationSpeed;
  autoQueen: boolean;           // shortcut for defaultPromotion === "queen"
  showEvalBar: boolean;
  confirmResign: boolean;
}

const DEFAULT_STATE: UIStoreState = {
  boardTheme: "classic",
  pieceStyle: "cburnett",
  blindfold: false,
  coordinates: true,
  highlightMoves: true,
  defaultPromotion: "ask",
  soundVolume: 80,
  moveSoundEnabled: true,
  captureSoundEnabled: true,
  checkSoundEnabled: true,
  animationSpeed: "normal",
  autoQueen: false,
  showEvalBar: true,
  confirmResign: true,
};

let state: UIStoreState = { ...DEFAULT_STATE };

// Initialize client-side state
if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("ui-preferences");
    if (saved) {
      state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load UI preferences from localStorage", e);
  }
}

const listeners = new Set<(state: UIStoreState) => void>();

export const uiStore = {
  getState(): UIStoreState {
    return state;
  },

  subscribe(listener: (state: UIStoreState) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  setTheme(theme: BoardTheme) {
    state = { ...state, boardTheme: theme };
    this._notify();
  },

  setPieceStyle(pieceStyle: PieceStyle) {
    state = { ...state, pieceStyle };
    this._notify();
  },

  setBlindfold(blindfold: boolean) {
    state = { ...state, blindfold };
    this._notify();
  },

  setCoordinates(coordinates: boolean) {
    state = { ...state, coordinates };
    this._notify();
  },

  setHighlightMoves(highlightMoves: boolean) {
    state = { ...state, highlightMoves };
    this._notify();
  },

  setDefaultPromotion(defaultPromotion: DefaultPromotion) {
    state = { ...state, defaultPromotion, autoQueen: defaultPromotion === "queen" };
    this._notify();
  },

  setAutoQueen(autoQueen: boolean) {
    state = { ...state, autoQueen, defaultPromotion: autoQueen ? "queen" : "ask" };
    this._notify();
  },

  setSoundVolume(soundVolume: number) {
    state = { ...state, soundVolume };
    this._notify();
  },

  setMoveSoundEnabled(moveSoundEnabled: boolean) {
    state = { ...state, moveSoundEnabled };
    this._notify();
  },

  setCaptureSoundEnabled(captureSoundEnabled: boolean) {
    state = { ...state, captureSoundEnabled };
    this._notify();
  },

  setCheckSoundEnabled(checkSoundEnabled: boolean) {
    state = { ...state, checkSoundEnabled };
    this._notify();
  },



  setAnimationSpeed(animationSpeed: AnimationSpeed) {
    state = { ...state, animationSpeed };
    this._notify();
  },

  setShowEvalBar(showEvalBar: boolean) {
    state = { ...state, showEvalBar };
    this._notify();
  },

  setConfirmResign(confirmResign: boolean) {
    state = { ...state, confirmResign };
    this._notify();
  },

  _notify() {
    listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error("Error in uiStore listener:", err);
      }
    });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ui-preferences", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save UI preferences to localStorage", e);
      }
    }
  }
};

export function useUIStore(): UIStoreState {
  return useSyncExternalStore(
    uiStore.subscribe,
    uiStore.getState,
    () => DEFAULT_STATE
  );
}
