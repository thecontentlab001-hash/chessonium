"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { seedOpenings, Opening } from "@/lib/chess/openings";
import { chessAudio } from "@/utils/chessAudio";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Plus, 
  Save, 
  Play, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Settings, 
  HelpCircle, 
  RotateCw, 
  ChevronRight, 
  ChevronLeft, 
  Undo, 
  CheckCircle2, 
  Award, 
  ArrowRight, 
  Search, 
  Sparkles, 
  Star,
  X, 
  ArrowLeft, 
  Info, 
  BrainCircuit,
  MessageSquare
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

// Interface for user-created custom opening repertoires
interface CustomRepertoire {
  id: string;
  name: string;
  color: "white" | "black";
  moves: string[]; // e.g. ["1. e4 e5", "2. Nf3 Nc6", "3. Bb5"]
  movesSequence: string[]; // uci format e.g. ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"]
  description: string;
  theory: string;
  createdAt: number;
}

function OpeningsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation states
  const [activeTab, setActiveTab] = useState<"explorer" | "repertoire" | "trainer">("explorer");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterColor, setFilterColor] = useState<"all" | "white" | "black">("all");
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Local storage lists
  const [customRepertoires, setCustomRepertoires] = useState<CustomRepertoire[]>([]);
  const [spacedRepData, setSpacedRepData] = useState<Record<string, { mastery: number; lastCompleted: number; nextReviewAt: number }>>({});

  // Active opening select state
  const [selectedOpening, setSelectedOpening] = useState<Opening | CustomRepertoire | null>(seedOpenings[0]);
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  // Chess board instance states
  const [game, setGame] = useState<Chess>(new Chess());
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [moveIndex, setMoveIndex] = useState(0);

  // Study Mode vs Practice Mode
  const [playMode, setPlayMode] = useState<"study" | "practice">("study");

  // Repertoire Builder states
  const [isRecording, setIsRecording] = useState(false);
  const [newRepName, setNewRepName] = useState("");
  const [newRepColor, setNewRepColor] = useState<"white" | "black">("white");
  const [recordedMoves, setRecordedMoves] = useState<string[]>([]);
  const [recordedMovesSeq, setRecordedMovesSeq] = useState<string[]>([]);
  const [recordingGame, setRecordingGame] = useState<Chess>(new Chess());
  const [recordingHistory, setRecordingHistory] = useState<string[]>([]); // stores FEN history for undoing

  // Training / Practice Active states
  const [practiceState, setPracticeState] = useState<"idle" | "ready" | "playing" | "correct" | "failed" | "success">("idle");
  const [coachMood, setCoachMood] = useState<"happy" | "thinking" | "warning" | "excited">("thinking");
  const [coachText, setCoachText] = useState("Select an opening and let's start studying, or test your memory in Practice Mode!");
  const [showShake, setShowShake] = useState(false);
  const [showSuccessParticles, setShowSuccessParticles] = useState(false);
  const [particleCoords, setParticleCoords] = useState<Array<{ id: number; dx: string; dy: string }>>([]);

  // Load local data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load custom repertoires
    const storedReps = localStorage.getItem("custom-chess-repertoires");
    if (storedReps) {
      try {
        setCustomRepertoires(JSON.parse(storedReps));
      } catch (e) {
        console.error("Failed to load custom repertoires", e);
      }
    }

    // Load spaced repetition academy data (shared with academy page)
    const storedSR = localStorage.getItem("opening-spaced-rep");
    if (storedSR) {
      try {
        setSpacedRepData(JSON.parse(storedSR));
      } catch (e) {
        console.error("Failed to load spaced rep data", e);
      }
    }

    // Load audio preference
    const audioPref = localStorage.getItem("chess-audio-enabled");
    if (audioPref !== null) {
      const enabled = audioPref === "true";
      setSoundEnabled(enabled);
      chessAudio.setEnabled(enabled);
    }
  }, []);

  // Update sound preference globally
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    chessAudio.setEnabled(nextVal);
    localStorage.setItem("chess-audio-enabled", nextVal.toString());
  };

  // Sync orientation with the selected opening or color
  useEffect(() => {
    if (selectedOpening) {
      if ("color" in selectedOpening) {
        setBoardOrientation(selectedOpening.color);
      } else {
        // Preset openings guess orientation based on e4 / d4 structure
        const firstMove = selectedOpening.movesSequence[0];
        if (firstMove === "e2e4" || firstMove === "d2d4") {
          // If first move sequence is black-skewed, set black orientation
          setBoardOrientation("white");
        } else {
          setBoardOrientation("white");
        }
      }
      resetBoardState(selectedOpening);
    }
  }, [selectedOpening]);

  // Handle URL query parameters if loaded
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "repertoire") {
      setActiveTab("repertoire");
    } else if (tab === "trainer") {
      setActiveTab("trainer");
    }
  }, [searchParams]);

  // Save Spaced Repetition mastery updates to local storage
  const saveSpacedRep = (openingId: string, success: boolean) => {
    const now = Date.now();
    const current = spacedRepData[openingId] || { mastery: 0, lastCompleted: 0, nextReviewAt: 0 };
    let newMastery = current.mastery;
    let nextReviewDelay = 24 * 60 * 60 * 1000; // 24 hours default

    if (success) {
      newMastery = Math.min(100, current.mastery + 20);
      if (newMastery === 20) nextReviewDelay = 4 * 60 * 60 * 1000; // 4 hrs
      else if (newMastery === 40) nextReviewDelay = 12 * 60 * 60 * 1000; // 12 hrs
      else if (newMastery === 60) nextReviewDelay = 24 * 60 * 60 * 1000; // 1 day
      else if (newMastery === 80) nextReviewDelay = 3 * 24 * 60 * 60 * 1000; // 3 days
      else nextReviewDelay = 7 * 24 * 60 * 60 * 1000; // 7 days
    } else {
      newMastery = Math.max(0, current.mastery - 20);
      nextReviewDelay = 1 * 60 * 60 * 1000; // 1 hour
    }

    const updated = {
      mastery: newMastery,
      lastCompleted: now,
      nextReviewAt: now + nextReviewDelay
    };

    const nextSRData = {
      ...spacedRepData,
      [openingId]: updated
    };

    setSpacedRepData(nextSRData);
    localStorage.setItem("opening-spaced-rep", JSON.stringify(nextSRData));
  };

  // Helper: Reset Chess instance and index
  const resetBoardState = (op: Opening | CustomRepertoire) => {
    const newG = new Chess();
    setGame(newG);
    setMoveIndex(0);
    setPracticeState("idle");
    setPlayMode("study");
    setShowSuccessParticles(false);
    
    // Set appropriate coach messages
    if ("color" in op) {
      setCoachText(`Let's study your custom repertoire "${op.name}"! You are playing as ${op.color.toUpperCase()}.`);
    } else {
      setCoachText(`This is the ${op.name} (${op.eco}). Let's check out the theory.`);
    }
    setCoachMood("thinking");
  };

  // ── Step Through Opening (Study Mode) ──────────────────────────────────
  const stepForward = () => {
    if (!selectedOpening || moveIndex >= selectedOpening.movesSequence.length) return;
    
    const move = selectedOpening.movesSequence[moveIndex];
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    const promo = move.substring(4) || undefined;

    try {
      const moveResult = game.move({ from, to, promotion: promo });
      if (moveResult) {
        if (moveResult.captured) {
          chessAudio.playCapture();
        } else if (game.inCheck()) {
          chessAudio.playCheck();
        } else {
          chessAudio.playBook();
        }
        setGame(new Chess(game.fen()));
        setMoveIndex((prev) => prev + 1);

        // Find standard SAN move text for coach feedback
        const fullHistory = game.history();
        const latestSan = fullHistory[fullHistory.length - 1];
        setCoachText(`Move ${Math.floor(moveIndex / 2) + 1}: ${latestSan}. Play it forward to learn the layout.`);
        setCoachMood("happy");
      }
    } catch (e) {
      console.error("Step forward failed", e);
    }
  };

  const stepBackward = () => {
    if (moveIndex <= 0) return;
    
    try {
      game.undo();
      setGame(new Chess(game.fen()));
      setMoveIndex((prev) => prev - 1);
      chessAudio.playMove();
      setCoachText("Stepped back a move. Examine the board positions.");
      setCoachMood("thinking");
    } catch (e) {
      console.error("Step backward failed", e);
    }
  };

  const jumpToStart = () => {
    const newG = new Chess();
    setGame(newG);
    setMoveIndex(0);
    chessAudio.playMove();
    setCoachText("Returned to initial position.");
    setCoachMood("thinking");
  };

  const jumpToEnd = () => {
    if (!selectedOpening) return;
    const newG = new Chess();
    for (const move of selectedOpening.movesSequence) {
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      const promo = move.substring(4) || undefined;
      newG.move({ from, to, promotion: promo });
    }
    setGame(newG);
    setMoveIndex(selectedOpening.movesSequence.length);
    chessAudio.playBook();
    setCoachText("Viewing the completed opening layout.");
    setCoachMood("happy");
  };

  // ── Practice Mode (Memory Trainer) Loop ────────────────────────────────
  const startPractice = () => {
    if (!selectedOpening) return;
    const newG = new Chess();
    setGame(newG);
    setMoveIndex(0);
    setPlayMode("practice");
    setPracticeState("ready");
    setShowSuccessParticles(false);

    const isCustom = "color" in selectedOpening;
    const playerColor = isCustom ? (selectedOpening as CustomRepertoire).color : "white";

    if (playerColor === "black") {
      setCoachText("Practice started! Opponent (White) is moving first...");
      setCoachMood("thinking");
      
      // Auto-play White's first move
      setTimeout(() => {
        const firstMove = selectedOpening.movesSequence[0];
        const from = firstMove.substring(0, 2);
        const to = firstMove.substring(2, 4);
        const promo = firstMove.substring(4) || undefined;
        
        newG.move({ from, to, promotion: promo });
        setGame(new Chess(newG.fen()));
        setMoveIndex(1);
        chessAudio.playMove();
        
        setCoachText("Your turn! Play the matching response for Black.");
        setCoachMood("happy");
      }, 800);
    } else {
      setCoachText("Practice started! Make the first move for White.");
      setCoachMood("happy");
    }
  };

  // Trigger custom particle celebration on completing
  const triggerSuccessCelebration = () => {
    setShowSuccessParticles(true);
    const coords = [];
    for (let i = 0; i < 40; i++) {
      const dx = `${(Math.random() * 400 - 200).toFixed(0)}px`;
      const dy = `${(Math.random() * 400 - 200).toFixed(0)}px`;
      coords.push({ id: i, dx, dy });
    }
    setParticleCoords(coords);
    setTimeout(() => {
      setShowSuccessParticles(false);
    }, 2000);
  };

  const handlePracticeMove = ({ piece, sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!selectedOpening || playMode !== "practice" || practiceState === "success") return false;
    if (!targetSquare) return false;

    const isPromotion = 
      (game.get(sourceSquare as any)?.type === "p" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
      (game.get(sourceSquare as any)?.type === "p" && sourceSquare[1] === "2" && targetSquare[1] === "1");

    const moveStr = `${sourceSquare}${targetSquare}${isPromotion ? "q" : ""}`;
    const expectedMove = selectedOpening.movesSequence[moveIndex];

    const isCustom = "color" in selectedOpening;
    const playerColor = isCustom ? (selectedOpening as CustomRepertoire).color : "white";

    if (moveStr === expectedMove) {
      try {
        const moveObj = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: isPromotion ? "q" : undefined
        });

        if (!moveObj) return false;

        // Play correct move sound
        if (moveObj.captured) {
          chessAudio.playCapture();
        } else if (game.inCheck()) {
          chessAudio.playCheck();
        } else {
          chessAudio.playMove();
        }

        setGame(new Chess(game.fen()));
        const nextIdx = moveIndex + 1;

        if (nextIdx >= selectedOpening.movesSequence.length) {
          // Finished the entire opening line!
          setPracticeState("success");
          setMoveIndex(nextIdx);
          setCoachMood("excited");
          setCoachText("Fantastic job! You've perfectly matched the repertoire line!");
          chessAudio.playBrilliant();
          triggerSuccessCelebration();
          saveSpacedRep(selectedOpening.id, true);
        } else {
          // Play opponent response
          setPracticeState("correct");
          setMoveIndex(nextIdx);
          setCoachText("Correct move! Waiting for opponent response...");
          setCoachMood("happy");

          setTimeout(() => {
            const oppMove = selectedOpening.movesSequence[nextIdx];
            const oppFrom = oppMove.substring(0, 2);
            const oppTo = oppMove.substring(2, 4);
            const oppProm = oppMove.substring(4) || undefined;

            const oppMoveObj = game.move({
              from: oppFrom,
              to: oppTo,
              promotion: oppProm
            });

            if (oppMoveObj) {
              if (oppMoveObj.captured) {
                chessAudio.playCapture();
              } else if (game.inCheck()) {
                chessAudio.playCheck();
              } else {
                chessAudio.playMove();
              }
            }

            setGame(new Chess(game.fen()));
            const oppNextIdx = nextIdx + 1;
            setMoveIndex(oppNextIdx);

            if (oppNextIdx >= selectedOpening.movesSequence.length) {
              // Opponent move completed the sequence (defense lines)
              setPracticeState("success");
              setCoachMood("excited");
              setCoachText("Superb memory! You completed the full sequence successfully.");
              chessAudio.playBrilliant();
              triggerSuccessCelebration();
              saveSpacedRep(selectedOpening.id, true);
            } else {
              setPracticeState("playing");
              setCoachText(`Opponent played ${oppMoveObj?.san || oppMove}. Now find your next move!`);
              setCoachMood("thinking");
            }
          }, 800);
        }
        return true;
      } catch {
        return false;
      }
    } else {
      // Deviation!
      chessAudio.playBlunder();
      setPracticeState("failed");
      setShowShake(true);
      setTimeout(() => setShowShake(false), 500);

      // Save failure to Spaced Repetition queue
      saveSpacedRep(selectedOpening.id, false);

      // Guess the move SAN for cleaner feedback if possible
      let illegalSan = moveStr;
      try {
        const dummyG = new Chess(game.fen());
        const mockMove = dummyG.move({ from: sourceSquare, to: targetSquare, promotion: isPromotion ? "q" : undefined });
        if (mockMove) illegalSan = mockMove.san;
      } catch {}

      // Get expected SAN move name from dummy simulation
      let expectedSan = expectedMove;
      try {
        const dummyG2 = new Chess(game.fen());
        const mockExpected = dummyG2.move({ 
          from: expectedMove.substring(0, 2), 
          to: expectedMove.substring(2, 4), 
          promotion: expectedMove.substring(4) || undefined 
        });
        if (mockExpected) expectedSan = mockExpected.san;
      } catch {}

      setCoachText(`Deviation! You played ${illegalSan}, but the repertoire expected ${expectedSan}. Keep trying!`);
      setCoachMood("warning");

      setTimeout(() => {
        setPracticeState("playing");
      }, 1800);
      
      return false;
    }
  };

  // ── Custom Repertoire Builder ──────────────────────────────────────────
  const startRecording = () => {
    if (!newRepName.trim()) {
      alert("Please enter a name for your custom opening.");
      return;
    }
    const newG = new Chess();
    setRecordingGame(newG);
    setRecordedMoves([]);
    setRecordedMovesSeq([]);
    setRecordingHistory([newG.fen()]);
    setIsRecording(true);
    setCoachText(`Recording mode active! Play moves on the board for ${newRepColor.toUpperCase()}.`);
    setCoachMood("thinking");
  };

  const handleRecordingMove = ({ piece, sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!isRecording) return false;
    if (!targetSquare) return false;

    const isPromotion = 
      (recordingGame.get(sourceSquare as any)?.type === "p" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
      (recordingGame.get(sourceSquare as any)?.type === "p" && sourceSquare[1] === "2" && targetSquare[1] === "1");

    try {
      const mockGame = new Chess(recordingGame.fen());
      const moveObj = mockGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? "q" : undefined
      });

      if (moveObj) {
        if (moveObj.captured) {
          chessAudio.playCapture();
        } else if (mockGame.inCheck()) {
          chessAudio.playCheck();
        } else {
          chessAudio.playMove();
        }

        const uciMove = `${sourceSquare}${targetSquare}${isPromotion ? "q" : ""}`;
        
        // Format turn count to display neat PGN
        const turn = recordingGame.turn();
        const moveNumber = Math.floor(recordedMovesSeq.length / 2) + 1;
        const sanText = turn === "w" ? `${moveNumber}. ${moveObj.san}` : moveObj.san;

        setRecordingGame(mockGame);
        setRecordedMoves((prev) => [...prev, sanText]);
        setRecordedMovesSeq((prev) => [...prev, uciMove]);
        setRecordingHistory((prev) => [...prev, mockGame.fen()]);

        setCoachText(`Added move: ${moveObj.san}. Continue playing lines, or click save.`);
        setCoachMood("happy");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const undoLastRecordedMove = () => {
    if (recordedMovesSeq.length === 0 || recordingHistory.length <= 1) return;
    
    const prevHistory = [...recordingHistory];
    prevHistory.pop(); // Remove current FEN
    const previousFen = prevHistory[prevHistory.length - 1];

    const prevMoves = [...recordedMoves];
    prevMoves.pop();

    const prevMovesSeq = [...recordedMovesSeq];
    prevMovesSeq.pop();

    setRecordingGame(new Chess(previousFen));
    setRecordedMoves(prevMoves);
    setRecordedMovesSeq(prevMovesSeq);
    setRecordingHistory(prevHistory);
    chessAudio.playMove();

    setCoachText("Undid last recorded move. Play your next variation.");
    setCoachMood("thinking");
  };

  const saveCustomRepertoire = () => {
    if (recordedMovesSeq.length === 0) {
      alert("Please play at least one move to save your repertoire.");
      return;
    }

    const newRep: CustomRepertoire = {
      id: `custom-${Date.now()}`,
      name: newRepName,
      color: newRepColor,
      moves: recordedMoves,
      movesSequence: recordedMovesSeq,
      description: `User defined custom opening line with ${recordedMovesSeq.length} moves.`,
      theory: `This is your custom saved opening repertoire line. Play through this line to lock in your strategy.`,
      createdAt: Date.now()
    };

    const updatedReps = [...customRepertoires, newRep];
    setCustomRepertoires(updatedReps);
    localStorage.setItem("custom-chess-repertoires", JSON.stringify(updatedReps));

    // Cleanup recording variables
    setIsRecording(false);
    setNewRepName("");
    setSelectedOpening(newRep);
    setIsCustomSelected(true);
    setActiveTab("repertoire");
    chessAudio.playBrilliant();
    alert(`Success! Repertoire "${newRep.name}" has been saved.`);
  };

  const deleteCustomRepertoire = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom opening repertoire?")) return;

    const filtered = customRepertoires.filter((r) => r.id !== id);
    setCustomRepertoires(filtered);
    localStorage.setItem("custom-chess-repertoires", JSON.stringify(filtered));

    if (selectedOpening && selectedOpening.id === id) {
      setSelectedOpening(seedOpenings[0]);
      setIsCustomSelected(false);
    }
    chessAudio.playBlunder();
  };

  // Filtered preset openings list
  const filteredPresets = seedOpenings.filter((op) => {
    const matchesSearch = op.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          op.eco.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          op.description.toLowerCase().includes(searchQuery.toLowerCase());

    const firstMove = op.movesSequence[0];
    const isWhite = firstMove === "e2e4" || firstMove === "d2d4" || firstMove === "c2c4" || firstMove === "g1f3"; // white opening moves
    
    if (filterColor === "white" && !isWhite) return false;
    if (filterColor === "black" && isWhite) return false;

    return matchesSearch;
  });

  // Calculate Spaced Repetition Due status
  const getReviewStatus = (opId: string) => {
    const data = spacedRepData[opId];
    if (!data) return { text: "New", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" };
    
    const now = Date.now();
    if (now >= data.nextReviewAt) {
      return { text: "Due Now ⚡", color: "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse" };
    }
    
    const diffMs = data.nextReviewAt - now;
    const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
    if (diffHours >= 24) {
      const diffDays = Math.ceil(diffHours / 24);
      return { text: `Review in ${diffDays}d`, color: "bg-surface-200 border-white/5 text-slate-400" };
    }
    return { text: `Review in ${diffHours}h`, color: "bg-surface-200 border-white/5 text-slate-400" };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Dynamic Style block for Piece Shake & Star Particles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake-board {
          animation: shake 0.35s ease-in-out;
        }
        @keyframes particleFly {
          0% { transform: translate(0, 0) scale(1.2); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.4); opacity: 0; }
        }
        .celeb-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: particleFly 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>

      {/* ── Header Row ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-50/20 p-6 rounded-3xl border border-[#1a201b] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-500/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Opening Repertoire Master
              <span className="text-[10px] font-black bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/30 uppercase tracking-widest">
                Premium
              </span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Explore popular opening theories, build custom lines, and practice repertoire memory</p>
          </div>
        </div>

        <div className="flex gap-2 relative z-10">
          <button
            onClick={handleToggleSound}
            className="w-10 h-10 rounded-xl border border-[#1a201b] bg-[#121613] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-primary-400" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={() => router.push("/academy")}
            className="px-4 py-2 border border-[#1a201b] hover:border-[#303c32] hover:bg-surface-100/50 text-white rounded-xl text-xs font-black transition-all btn-press cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Academy
          </button>
        </div>
      </div>

      {/* ── Main Two Column Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Columns (Chessboard & Controls) */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-[#121613] border border-[#1d241f] rounded-3xl p-6 relative overflow-hidden">
          
          {/* Recording Mode banner */}
          {isRecording && (
            <div className="absolute top-4 left-6 right-6 z-10 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-xs font-black text-red-400">RECORDING MOVES FOR {newRepColor.toUpperCase()}</span>
              </div>
              <div className="text-[10px] text-slate-400">Play moves on the board to record your line</div>
            </div>
          )}

          {/* Success Overlay */}
          {practiceState === "success" && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
              {/* Particle effects simulation */}
              {showSuccessParticles && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {particleCoords.map((pt) => (
                    <div 
                      key={pt.id} 
                      className="celeb-particle bg-primary-400" 
                      style={{ 
                        left: "50%", 
                        top: "50%", 
                        "--dx": pt.dx, 
                        "--dy": pt.dy, 
                        backgroundColor: pt.id % 3 === 0 ? "#8ae43c" : pt.id % 3 === 1 ? "#ffd700" : "#ffffff"
                      } as any}
                    />
                  ))}
                </div>
              )}

              <div className="w-20 h-20 rounded-full bg-primary-500/20 border border-primary-500 flex items-center justify-center animate-bounce shadow-2xl shadow-primary-500/20">
                <Trophy className="w-10 h-10 text-primary-400" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Repertoire Completed!</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  You have successfully completed the full sequence of <strong>{selectedOpening?.name}</strong>!
                </p>
              </div>

              <div className="bg-[#0a0c0a] border border-[#1a201b] px-6 py-3 rounded-2xl flex items-center gap-3">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="text-xs font-black text-white">+50 Repertoire Mastery XP</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => resetBoardState(selectedOpening!)}
                  className="px-6 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-xl text-xs font-black transition-all btn-press shadow-lg shadow-primary-500/20 cursor-pointer"
                >
                  Restart Practice
                </button>
                <button
                  onClick={() => { setPlayMode("study"); setPracticeState("idle"); }}
                  className="px-6 py-2.5 border border-[#1a201b] hover:bg-surface-200/50 text-white rounded-xl text-xs font-black transition-all btn-press cursor-pointer"
                >
                  Study Mode
                </button>
              </div>
            </div>
          )}

          {/* Chessboard Area Container */}
          <div className="flex flex-col items-center justify-center flex-1 py-8 relative">
            <div 
              className={`w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden border border-[#1a201b] relative transition-transform ${showShake ? "shake-board" : ""}`}
            >
              <Chessboard
                options={{
                  position: isRecording ? recordingGame.fen() : game.fen(),
                  boardOrientation: boardOrientation,
                  allowDragging: isRecording || playMode === "practice",
                  onPieceDrop: isRecording ? handleRecordingMove : handlePracticeMove,
                  darkSquareStyle: { backgroundColor: "#769656" },
                  lightSquareStyle: { backgroundColor: "#eeeed2" }
                }}
              />
            </div>
          </div>

          {/* Bottom Move Info & Steppers */}
          <div className="space-y-4 pt-4 border-t border-[#1a201b]">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              
              {/* Active mode indicator */}
              <div>
                {isRecording ? (
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    Recorded moves: {recordedMovesSeq.length}
                  </div>
                ) : playMode === "study" ? (
                  <div className="text-xs font-bold text-slate-400">
                    Study Mode · Move {moveIndex} / {selectedOpening?.movesSequence.length || 0}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary-400" />
                    Practice Mode · {moveIndex} of {selectedOpening?.movesSequence.length || 0} moves played
                  </div>
                )}
              </div>

              {/* Study steppers */}
              {!isRecording && playMode === "study" && (
                <div className="flex items-center bg-[#0a0c0a] border border-[#1a201b] p-1 rounded-xl gap-0.5">
                  <button
                    onClick={jumpToStart}
                    disabled={moveIndex === 0}
                    className="p-2 hover:bg-surface-200 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                    title="Jump to Start"
                  >
                    <ChevronLeft className="w-4 h-4 double-arrow" />
                  </button>
                  <button
                    onClick={stepBackward}
                    disabled={moveIndex === 0}
                    className="p-2 hover:bg-surface-200 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                    title="Step Backward"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={stepForward}
                    disabled={moveIndex >= (selectedOpening?.movesSequence.length || 0)}
                    className="p-2 hover:bg-surface-200 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                    title="Step Forward"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={jumpToEnd}
                    disabled={moveIndex >= (selectedOpening?.movesSequence.length || 0)}
                    className="p-2 hover:bg-surface-200 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                    title="Jump to End"
                  >
                    <ChevronRight className="w-4 h-4 double-arrow" />
                  </button>
                </div>
              )}

              {/* Recording controls */}
              {isRecording && (
                <div className="flex gap-2">
                  <button
                    onClick={undoLastRecordedMove}
                    disabled={recordedMovesSeq.length === 0}
                    className="px-4 py-2 border border-[#1a201b] hover:bg-surface-200/50 disabled:opacity-30 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Undo className="w-3.5 h-3.5" /> Undo Move
                  </button>
                  <button
                    onClick={saveCustomRepertoire}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Repertoire
                  </button>
                </div>
              )}

              {/* Switch to Practice button */}
              {!isRecording && playMode === "study" && (
                <button
                  onClick={startPractice}
                  className="px-4 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-xl text-xs font-black transition-all btn-press shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Practice Memory
                </button>
              )}

              {!isRecording && playMode === "practice" && (
                <button
                  onClick={() => { setPlayMode("study"); resetBoardState(selectedOpening!); }}
                  className="px-4 py-2.5 border border-[#1a201b] hover:bg-surface-200/50 text-white rounded-xl text-xs font-black transition-all btn-press cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Reset to Study
                </button>
              )}
            </div>

            {/* Simulated AI Coach Commentary Feedback Card */}
            <div className="p-4 bg-surface-50/40 border border-[#1a201b] rounded-2xl flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center font-black text-white text-xs select-none shrink-0 mt-0.5">
                {coachMood === "happy" ? "😊" : coachMood === "excited" ? "🤩" : coachMood === "warning" ? "🤔" : "🧠"}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-primary-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <BrainCircuit className="w-3 h-3" /> AI Opening Coach
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {coachText}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Column (Tabs & Info Panels) */}
        <div className="flex flex-col gap-4">
          
          {/* Main Tab bar */}
          <div className="flex bg-[#0a0c0a] border border-[#1a201b] p-1 rounded-2xl">
            <button
              onClick={() => { setActiveTab("explorer"); setIsRecording(false); }}
              className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "explorer" ? "bg-surface-200 text-white border border-white/5" : "text-slate-400 hover:text-white"
              }`}
            >
              Explorer
            </button>
            <button
              onClick={() => { setActiveTab("repertoire"); setIsRecording(false); }}
              className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "repertoire" ? "bg-surface-200 text-white border border-white/5" : "text-slate-400 hover:text-white"
              }`}
            >
              My Repertoire
            </button>
          </div>

          {/* TAB CONTENT: EXPLORER */}
          {activeTab === "explorer" && (
            <div className="bg-[#121613] border border-[#1d241f] rounded-3xl p-5 flex flex-col gap-4 flex-1 h-[68vh] overflow-hidden">
              
              {/* Search and Filters */}
              <div className="space-y-2 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search master openings..."
                    className="w-full bg-[#0a0c0a] border border-[#1a201b] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="flex bg-[#0a0c0a] border border-[#1a201b] p-0.5 rounded-xl text-[11px] font-bold">
                  <button
                    onClick={() => setFilterColor("all")}
                    className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer ${filterColor === "all" ? "bg-surface-200 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterColor("white")}
                    className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer ${filterColor === "white" ? "bg-surface-200 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    White
                  </button>
                  <button
                    onClick={() => setFilterColor("black")}
                    className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer ${filterColor === "black" ? "bg-surface-200 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Black
                  </button>
                </div>
              </div>

              {/* Scrollable list of openings */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredPresets.length === 0 ? (
                  <div className="text-center py-12 text-xs font-bold text-slate-500">
                    No openings match your search.
                  </div>
                ) : (
                  filteredPresets.map((op) => {
                    const status = getReviewStatus(op.id);
                    const mastery = spacedRepData[op.id]?.mastery || 0;
                    const isSelected = selectedOpening?.id === op.id;

                    return (
                      <button
                        key={op.id}
                        onClick={() => {
                          setSelectedOpening(op);
                          setIsCustomSelected(false);
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border flex flex-col gap-1 transition-all ${
                          isSelected
                            ? "bg-primary-500/10 border-primary-500 text-white shadow-sm"
                            : "bg-[#0d100d]/50 hover:bg-[#0d100d] border-[#1a201b] text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-extrabold text-xs text-white">{op.name}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono bg-slate-800 text-slate-400 px-1 rounded border border-white/5">{op.eco}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{op.description}</span>
                        </div>
                        {mastery > 0 && (
                          <div className="w-full mt-1.5 space-y-0.5">
                            <div className="flex justify-between text-[8px] font-bold text-slate-500">
                              <span>Mastery</span>
                              <span>{mastery}%</span>
                            </div>
                            <div className="h-1 bg-[#0a0c0a] rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${mastery}%` }}></div>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Selected Opening Details Card */}
              {selectedOpening && !isCustomSelected && (
                <div className="p-4 bg-[#0a0c0a] border border-[#1a201b] rounded-2xl space-y-3 shrink-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-white">{(selectedOpening as Opening).name}</h4>
                      <p className="text-[9px] font-mono text-slate-500 uppercase">Theory Summary</p>
                    </div>
                    <span className="text-[9px] font-black text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full">
                      {(selectedOpening as Opening).eco}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 leading-relaxed max-h-[80px] overflow-y-auto">
                    {(selectedOpening as Opening).theory}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="p-1 bg-green-500/5 rounded-lg border border-green-500/10">
                      <div className="text-green-400 font-black">{(selectedOpening as Opening).whiteWinRate}%</div>
                      <div className="text-[7px] text-slate-500 font-bold uppercase">White win</div>
                    </div>
                    <div className="p-1 bg-slate-500/5 rounded-lg border border-slate-500/10">
                      <div className="text-slate-300 font-black">{(selectedOpening as Opening).drawRate}%</div>
                      <div className="text-[7px] text-slate-500 font-bold uppercase">Draws</div>
                    </div>
                    <div className="p-1 bg-red-500/5 rounded-lg border border-red-500/10">
                      <div className="text-red-400 font-black">{(selectedOpening as Opening).blackWinRate}%</div>
                      <div className="text-[7px] text-slate-500 font-bold uppercase">Black win</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: MY REPERTOIRE */}
          {activeTab === "repertoire" && (
            <div className="bg-[#121613] border border-[#1d241f] rounded-3xl p-5 flex flex-col gap-4 flex-1 h-[68vh] overflow-hidden">
              
              {/* Creator Controls */}
              {!isRecording ? (
                <div className="space-y-3 bg-[#0a0c0a] p-4 border border-[#1a201b] rounded-2xl shrink-0">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-primary-400" /> Build Custom Repertoire
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. My Sicilian Najdorf"
                      value={newRepName}
                      onChange={(e) => setNewRepName(e.target.value)}
                      className="w-full bg-[#121613] border border-[#1a201b] rounded-xl py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewRepColor("white")}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                          newRepColor === "white" ? "bg-white text-black border-white" : "border-[#1a201b] text-slate-400 hover:text-white"
                        }`}
                      >
                        Play White
                      </button>
                      <button
                        onClick={() => setNewRepColor("black")}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                          newRepColor === "black" ? "bg-[#2b2925] text-white border-[#2b2925]" : "border-[#1a201b] text-slate-400 hover:text-white"
                        }`}
                      >
                        Play Black
                      </button>
                    </div>

                    <button
                      onClick={startRecording}
                      className="w-full py-2.5 bg-[#6fa93f] hover:bg-primary-400 text-white rounded-xl text-xs font-black transition-all btn-press cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-current" /> Start Recording Moves
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0a0c0a] p-4 border border-[#1a201b] rounded-2xl shrink-0 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">RECORDING BOARD</span>
                    <button
                      onClick={() => setIsRecording(false)}
                      className="text-slate-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Play moves on the board. We will save the exact sequence as your opening layout.
                  </div>
                </div>
              )}

              {/* List of Custom Repertoires */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block select-none">Saved Repertoires</span>
                
                {isRecording ? (
                  <div className="bg-[#0d100d]/50 p-4 border border-[#1a201b] rounded-2xl space-y-2 max-h-[30vh] overflow-y-auto">
                    <span className="text-[9px] font-extrabold text-slate-500 block uppercase">Recorded Sequence</span>
                    {recordedMoves.length === 0 ? (
                      <span className="text-[10px] text-slate-600 block italic">Play moves on the board...</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                        {recordedMoves.map((mv, idx) => (
                          <span key={idx} className="bg-slate-800 border border-white/5 text-slate-300 px-2 py-0.5 rounded">
                            {mv}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : customRepertoires.length === 0 ? (
                  <div className="text-center py-12 text-xs font-bold text-slate-500 bg-[#0d100d]/20 border border-white/5 rounded-2xl">
                    No custom repertoires saved yet. Create one above!
                  </div>
                ) : (
                  customRepertoires.map((rep) => {
                    const isSelected = selectedOpening?.id === rep.id;
                    return (
                      <button
                        key={rep.id}
                        onClick={() => {
                          setSelectedOpening(rep);
                          setIsCustomSelected(true);
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border flex flex-col gap-1 transition-all ${
                          isSelected
                            ? "bg-primary-500/10 border-primary-500 text-white shadow-sm"
                            : "bg-[#0d100d]/50 hover:bg-[#0d100d] border-[#1a201b] text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-extrabold text-xs text-white">{rep.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                              rep.color === "white" ? "bg-white text-black border-white" : "bg-[#2b2925] text-white border-[#2b2925]"
                            }`}>
                              {rep.color}
                            </span>
                            <span
                              onClick={(e) => deleteCustomRepertoire(rep.id, e)}
                              className="text-slate-500 hover:text-red-400 p-0.5 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                              title="Delete Repertoire"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>

                        {/* Move sequence preview */}
                        <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-mono">
                          {rep.moves.slice(0, 4).map((mv, idx) => (
                            <span key={idx} className="bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-white/5">
                              {mv}
                            </span>
                          ))}
                          {rep.moves.length > 4 && <span className="text-slate-600 font-bold">...</span>}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default function OpeningsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OpeningsContent />
    </Suspense>
  );
}
