"use client";

import React, { useState } from "react";
import {
  X, Monitor, Volume2, Mic, User, ChevronRight,
  Check, Palette, Zap, Eye, EyeOff, Crown,
} from "lucide-react";
import { uiStore, useUIStore, BoardTheme, DefaultPromotion, AnimationSpeed } from "@/store/uiStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BOARD_THEMES: { id: BoardTheme; label: string; dark: string; light: string }[] = [
  { id: "classic",  label: "Classic",  dark: "#769656", light: "#eeeed2" },
  { id: "emerald",  label: "Emerald",  dark: "#70a16c", light: "#ececd7" },
  { id: "wood",     label: "Wood",     dark: "#b58863", light: "#f0d9b5" },
  { id: "ocean",    label: "Ocean",    dark: "#4b7a9e", light: "#d6e8f5" },
  { id: "midnight", label: "Midnight", dark: "#3d4f6e", light: "#8fa3c8" },
  { id: "neon",     label: "Neon",     dark: "#1a3a2a", light: "#2a5a3a" },
  { id: "glass",    label: "Glass",    dark: "rgba(59,130,246,0.25)", light: "rgba(255,255,255,0.08)" },
];

const PROMOTION_OPTIONS: { id: DefaultPromotion; label: string; symbol: string }[] = [
  { id: "ask",    label: "Always Ask", symbol: "?" },
  { id: "queen",  label: "Queen",      symbol: "♛" },
  { id: "rook",   label: "Rook",       symbol: "♜" },
  { id: "bishop", label: "Bishop",     symbol: "♝" },
  { id: "knight", label: "Knight",     symbol: "♞" },
];

const ANIMATION_SPEEDS: { id: AnimationSpeed; label: string }[] = [
  { id: "none",   label: "Instant" },
  { id: "fast",   label: "Fast" },
  { id: "normal", label: "Normal" },
  { id: "slow",   label: "Slow" },
];

type Tab = "board" | "sound" | "gameplay";

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const ui = useUIStore();

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "board",    label: "Board",    icon: Monitor },
    { id: "sound",    label: "Sound",    icon: Volume2 },
    { id: "gameplay", label: "Gameplay", icon: Zap },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#1a1c22] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
              <Palette className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Settings</h2>
              <p className="text-slate-500 text-xs">Customize your experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex h-[520px]">
          {/* Sidebar tabs */}
          <div className="w-36 shrink-0 border-r border-white/10 p-3 flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === tab.id
                    ? "bg-primary-500/15 text-primary-300 border border-primary-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* ── BOARD TAB ── */}
            {activeTab === "board" && (
              <>
                <Section title="Board Theme">
                  <div className="grid grid-cols-4 gap-2">
                    {BOARD_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => uiStore.setTheme(theme.id)}
                        className={`relative p-1 rounded-xl border-2 transition-all ${
                          ui.boardTheme === theme.id
                            ? "border-primary-500 shadow-lg shadow-primary-500/20"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        {/* Mini board preview */}
                        <div className="grid grid-cols-4 grid-rows-4 rounded-lg overflow-hidden aspect-square">
                          {Array.from({ length: 16 }).map((_, i) => {
                            const row = Math.floor(i / 4);
                            const col = i % 4;
                            const isDark = (row + col) % 2 === 1;
                            return (
                              <div
                                key={i}
                                style={{ background: isDark ? theme.dark : theme.light }}
                              />
                            );
                          })}
                        </div>
                        <p className="text-[9px] text-center mt-1 font-semibold text-slate-300">{theme.label}</p>
                        {ui.boardTheme === theme.id && (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary-500 flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Animation Speed">
                  <div className="flex gap-2">
                    {ANIMATION_SPEEDS.map((speed) => (
                      <button
                        key={speed.id}
                        onClick={() => uiStore.setAnimationSpeed(speed.id)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          ui.animationSpeed === speed.id
                            ? "bg-primary-500/15 border-primary-500/40 text-primary-300"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        {speed.label}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Display Options">
                  <div className="space-y-3">
                    <Toggle
                      label="Show Coordinates"
                      description="Show a-h / 1-8 labels on board edges"
                      checked={ui.coordinates}
                      onChange={(v) => uiStore.setCoordinates(v)}
                    />
                    <Toggle
                      label="Highlight Legal Moves"
                      description="Show dots on legal move squares"
                      checked={ui.highlightMoves}
                      onChange={(v) => uiStore.setHighlightMoves(v)}
                    />
                    <Toggle
                      label="Show Evaluation Bar"
                      description="Show engine evaluation beside the board"
                      checked={ui.showEvalBar}
                      onChange={(v) => uiStore.setShowEvalBar(v)}
                    />
                    <Toggle
                      label="Blindfold Mode"
                      description="Hide all pieces (advanced training)"
                      checked={ui.blindfold}
                      onChange={(v) => uiStore.setBlindfold(v)}
                      icon={ui.blindfold ? EyeOff : Eye}
                    />
                  </div>
                </Section>
              </>
            )}

            {/* ── SOUND TAB ── */}
            {activeTab === "sound" && (
              <>
                <Section title="Master Volume">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Volume</span>
                      <span className="text-sm font-bold text-white">{ui.soundVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={ui.soundVolume}
                      onChange={(e) => uiStore.setSoundVolume(Number(e.target.value))}
                      className="w-full accent-primary-500"
                    />
                  </div>
                </Section>

                <Section title="Sound Effects">
                  <div className="space-y-3">
                    <Toggle
                      label="Move Sound"
                      description="Play sound when a piece moves"
                      checked={ui.moveSoundEnabled}
                      onChange={(v) => uiStore.setMoveSoundEnabled(v)}
                    />
                    <Toggle
                      label="Capture Sound"
                      description="Play sound when a piece is captured"
                      checked={ui.captureSoundEnabled}
                      onChange={(v) => uiStore.setCaptureSoundEnabled(v)}
                    />
                    <Toggle
                      label="Check Sound"
                      description="Play sound when the king is in check"
                      checked={ui.checkSoundEnabled}
                      onChange={(v) => uiStore.setCheckSoundEnabled(v)}
                    />
                  </div>
                </Section>
              </>
            )}



            {/* ── GAMEPLAY TAB ── */}
            {activeTab === "gameplay" && (
              <>
                <Section title="Pawn Promotion">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Choose what happens when your pawn reaches the last rank</p>
                    <div className="grid grid-cols-5 gap-2">
                      {PROMOTION_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => uiStore.setDefaultPromotion(opt.id)}
                          className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border text-xs font-semibold transition-all ${
                            ui.defaultPromotion === opt.id
                              ? "bg-primary-500/15 border-primary-500/40 text-primary-300"
                              : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/30"
                          }`}
                        >
                          <span className="text-xl">{opt.symbol}</span>
                          <span className="text-[9px]">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>

                <Section title="Gameplay Options">
                  <div className="space-y-3">
                    <Toggle
                      label="Confirm Resign"
                      description="Ask for confirmation before resigning"
                      checked={ui.confirmResign}
                      onChange={(v) => uiStore.setConfirmResign(v)}
                    />
                    <Toggle
                      label="Auto-Queen Promotion"
                      description="Automatically promote pawns to queens"
                      checked={ui.autoQueen}
                      onChange={(v) => uiStore.setAutoQueen(v)}
                      icon={Crown}
                    />
                  </div>
                </Section>
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm("Reset all settings to defaults?")) {
                localStorage.removeItem("ui-preferences");
                window.location.reload();
              }
            }}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ElementType;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 cursor-pointer group"
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
        <div>
          <p className="text-sm text-white font-medium">{label}</p>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div
        className={`w-10 h-6 rounded-full border transition-all shrink-0 relative ${
          checked
            ? "bg-primary-500 border-primary-400"
            : "bg-white/10 border-white/10 group-hover:border-white/20"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </div>
    </div>
  );
}
