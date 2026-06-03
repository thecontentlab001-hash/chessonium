"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { seedLessons, Lesson } from "@/lib/chess/lessons";
import { seedOpenings, Opening } from "@/lib/chess/openings";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { BookOpen, GraduationCap, Award, CheckCircle2, ChevronRight, HelpCircle, ArrowLeft, Sparkles, Lightbulb, RotateCw } from "lucide-react";
import { useSearchParams } from "next/navigation";

function AcademyContent() {
  useAuthRedirect();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<"lessons" | "openings">("lessons");
  const [filterDifficulty, setFilterDifficulty] = useState<"all" | "new_to_chess" | "beginner" | "intermediate" | "advanced" | "mastery">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Lesson interactive states
  const [lessonGame, setLessonGame] = useState<Chess | null>(null);
  const [lessonStatus, setLessonStatus] = useState<"reading" | "interactive" | "quiz" | "completed">("reading");
  const [moveCorrect, setMoveCorrect] = useState<boolean | null>(null);
  const [lessonMoveIdx, setLessonMoveIdx] = useState(0);
  const [lessonOrientation, setLessonOrientation] = useState<"white" | "black">("white");
  const [showLessonHint, setShowLessonHint] = useState<boolean>(false);
  
  // Quiz states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState<boolean | null>(null);

  // Completed lesson tracking (mock persistence)
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  // Spaced repetition data for openings
  const [openingData, setOpeningData] = useState<Record<string, { mastery: number; lastCompleted: number; nextReviewAt: number }>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("opening-spaced-rep");
    if (stored) {
      try {
        setOpeningData(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse spaced rep data", e);
      }
    }
  }, []);

  const saveOpeningRepData = (openingId: string, success: boolean) => {
    const now = Date.now();
    const current = openingData[openingId] || { mastery: 0, lastCompleted: 0, nextReviewAt: 0 };
    let newMastery = current.mastery;
    let nextReviewDelay = 24 * 60 * 60 * 1000; // 24h default

    if (success) {
      newMastery = Math.min(100, current.mastery + 20);
      if (newMastery === 20) nextReviewDelay = 4 * 60 * 60 * 1000; // 4 hours
      else if (newMastery === 40) nextReviewDelay = 12 * 60 * 60 * 1000; // 12 hours
      else if (newMastery === 60) nextReviewDelay = 24 * 60 * 60 * 1000; // 24 hours
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

    const nextOpeningData = {
      ...openingData,
      [openingId]: updated
    };
    setOpeningData(nextOpeningData);
    localStorage.setItem("opening-spaced-rep", JSON.stringify(nextOpeningData));
  };

  const getReviewStatus = (opId: string) => {
    const data = openingData[opId];
    if (!data) return { text: "New", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" };
    
    const now = Date.now();
    if (now >= data.nextReviewAt) {
      return { text: "Review Due", color: "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse" };
    }
    
    const diffMs = data.nextReviewAt - now;
    const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));
    if (diffHours >= 24) {
      const diffDays = Math.ceil(diffHours / 24);
      return { text: `Review in ${diffDays}d`, color: "bg-slate-800 border-white/5 text-slate-400" };
    }
    return { text: `Review in ${diffHours}h`, color: "bg-slate-800 border-white/5 text-slate-400" };
  };

  // Opening Lab interactive states
  const [activeOpening, setActiveOpening] = useState<Opening>(seedOpenings[0]);
  const [openingGame, setOpeningGame] = useState<Chess>(new Chess());
  const [trainingIndex, setTrainingIndex] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState<"idle" | "training" | "correct" | "failed" | "completed">("idle");
  const [openingOrientation, setOpeningOrientation] = useState<"white" | "black">("white");
  const [showOpeningHint, setShowOpeningHint] = useState<boolean>(false);

  const getLessonHintInfo = () => {
    if (!selectedLesson || !lessonGame) return null;
    const sequence = selectedLesson.sequence || (selectedLesson.interactiveMove ? [selectedLesson.interactiveMove] : []);
    if (sequence.length === 0 || lessonMoveIdx >= sequence.length) return null;

    const expectedMove = sequence[lessonMoveIdx];
    const source = expectedMove.substring(0, 2);
    const target = expectedMove.substring(2, 4);
    const piece = lessonGame.get(source as any);
    
    if (piece) {
      const pieceName = {
        p: "Pawn",
        n: "Knight",
        b: "Bishop",
        r: "Rook",
        q: "Queen",
        k: "King"
      }[piece.type] || "Piece";
      return {
        source,
        target,
        text: `Move your ${pieceName} on ${source} to ${target}`
      };
    }
    return {
      source,
      target,
      text: `Move the piece from ${source} to ${target}`
    };
  };

  const getOpeningHintInfo = () => {
    if (!activeOpening || !openingGame) return null;
    const expectedMove = activeOpening.movesSequence[trainingIndex];
    if (!expectedMove) return null;

    const source = expectedMove.substring(0, 2);
    const target = expectedMove.substring(2, 4);
    const piece = openingGame.get(source as any);
    
    if (piece) {
      const pieceName = {
        p: "Pawn",
        n: "Knight",
        b: "Bishop",
        r: "Rook",
        q: "Queen",
        k: "King"
      }[piece.type] || "Piece";
      return {
        source,
        target,
        text: `Move your ${pieceName} on ${source} to ${target}`
      };
    }
    return {
      source,
      target,
      text: `Move the piece from ${source} to ${target}`
    };
  };

  // Read tab parameter from URL search params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "openings") {
      setActiveSection("openings");
    } else if (tab === "endgames") {
      setActiveSection("lessons");
      setCategoryFilter("Endgames");
      setFilterDifficulty("all");
    } else {
      setActiveSection("lessons");
      setCategoryFilter("all");
      setFilterDifficulty("all");
    }
  }, [searchParams]);

  const startOpeningTraining = (op: Opening) => {
    setActiveOpening(op);
    setOpeningGame(new Chess());
    setTrainingIndex(0);
    setTrainingStatus("training");
    setOpeningOrientation("white");
    setShowOpeningHint(false);
  };

  const handleOpeningMove = ({ piece, sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!openingGame || trainingStatus === "completed" || trainingStatus === "correct") return false;
    if (!targetSquare) return false;

    const isPromotion = 
      (openingGame.get(sourceSquare as any)?.type === "p" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
      (openingGame.get(sourceSquare as any)?.type === "p" && sourceSquare[1] === "2" && targetSquare[1] === "1");

    const moveStr = `${sourceSquare}${targetSquare}${isPromotion ? "q" : ""}`;
    const expectedMove = activeOpening.movesSequence[trainingIndex];

    if (moveStr === expectedMove) {
      try {
        openingGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: isPromotion ? "q" : undefined
        });
        setOpeningGame(new Chess(openingGame.fen()));
        setShowOpeningHint(false);
        
        const nextIdx = trainingIndex + 1;
        
        if (nextIdx >= activeOpening.movesSequence.length) {
          setTrainingStatus("completed");
          saveOpeningRepData(activeOpening.id, true);
        } else {
          setTrainingStatus("correct");
          setTrainingIndex(nextIdx);
          
          setTimeout(() => {
            const oppMove = activeOpening.movesSequence[nextIdx];
            const oppFrom = oppMove.substring(0, 2);
            const oppTo = oppMove.substring(2, 4);
            const oppProm = oppMove.substring(4) || undefined;
            
            openingGame.move({
              from: oppFrom,
              to: oppTo,
              promotion: oppProm
            });
            
            setOpeningGame(new Chess(openingGame.fen()));
            setTrainingIndex(nextIdx + 1);
            setTrainingStatus("training");
          }, 800);
        }
        return true;
      } catch {
        return false;
      }
    } else {
      setTrainingStatus("failed");
      saveOpeningRepData(activeOpening.id, false);
      setTimeout(() => {
        setTrainingStatus("training");
      }, 1500);
      return false;
    }
  };

  // Filtered lessons list (Filtered by difficulty AND category)
  const filteredLessons = seedLessons.filter((l) => {
    if (filterDifficulty !== "all" && l.difficulty !== filterDifficulty) return false;
    if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
    return true;
  });

  // Start a lesson
  const startLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonStatus("reading");
    setMoveCorrect(null);
    setSelectedOption(null);
    setQuizSubmitted(false);
    setQuizCorrect(null);
    setLessonMoveIdx(0);
    setLessonOrientation("white");
    setShowLessonHint(false);
    
    if (lesson.fen) {
      setLessonGame(new Chess(lesson.fen));
    } else {
      setLessonGame(null);
    }
  };

  // Process lesson moves
  const handleLessonMove = ({ piece, sourceSquare, targetSquare }: { piece: any; sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!lessonGame || !selectedLesson) return false;
    if (!targetSquare) return false;

    const isPromotion = 
      (lessonGame.get(sourceSquare as any)?.type === "p" && sourceSquare[1] === "7" && targetSquare[1] === "8") ||
      (lessonGame.get(sourceSquare as any)?.type === "p" && sourceSquare[1] === "2" && targetSquare[1] === "1");

    const moveStr = `${sourceSquare}${targetSquare}${isPromotion ? "q" : ""}`;

    const sequence = selectedLesson.sequence || (selectedLesson.interactiveMove ? [selectedLesson.interactiveMove] : []);
    if (sequence.length === 0 || lessonMoveIdx >= sequence.length) return false;

    const expectedMove = sequence[lessonMoveIdx];

    if (moveStr === expectedMove) {
      try {
        lessonGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: isPromotion ? "q" : undefined,
        });
        setLessonGame(new Chess(lessonGame.fen()));
        setMoveCorrect(true);
        setShowLessonHint(false);

        const nextMoveIdx = lessonMoveIdx + 1;

        if (nextMoveIdx >= sequence.length) {
          // Finished the entire sequence!
          setTimeout(() => {
            if (selectedLesson.quiz) {
              setLessonStatus("quiz");
            } else {
              completeLesson();
            }
          }, 1500);
        } else {
          // Play opponent response automatically from sequence
          setTimeout(() => {
            const oppMove = sequence[nextMoveIdx];
            const oppFrom = oppMove.substring(0, 2);
            const oppTo = oppMove.substring(2, 4);
            const oppProm = oppMove.substring(4) || undefined;

            lessonGame.move({
              from: oppFrom,
              to: oppTo,
              promotion: oppProm,
            });
            setLessonGame(new Chess(lessonGame.fen()));
            setLessonMoveIdx(nextMoveIdx + 1);
            setMoveCorrect(null);
          }, 800);
        }
        return true;
      } catch (err) {
        return false;
      }
    } else {
      setMoveCorrect(false);
      setTimeout(() => setMoveCorrect(null), 1500);
      return false;
    }
  };

  // Submit quiz answer
  const submitQuiz = () => {
    if (!selectedLesson || !selectedLesson.quiz || selectedOption === null) return;
    setQuizSubmitted(true);
    const isCorrect = selectedOption === selectedLesson.quiz.answer;
    setQuizCorrect(isCorrect);
    
    if (isCorrect) {
      setTimeout(() => {
        completeLesson();
      }, 1500);
    }
  };

  // Complete lesson
  const completeLesson = () => {
    setLessonStatus("completed");
    if (selectedLesson && !completedLessonIds.includes(selectedLesson.id)) {
      setCompletedLessonIds((prev) => [...prev, selectedLesson.id]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {selectedLesson ? (
        /* INTERACTIVE LESSON WORKSPACE */
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedLesson(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Academy
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Interactive Chessboard (if required for lesson) */}
            <div className="lg:col-span-2 flex flex-col justify-center items-center">
              {lessonGame ? (
                <>
                  <div className="w-full max-w-[440px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 glass-panel bg-background">
                    <Chessboard
                      options={{
                        position: lessonGame.fen(),
                        onPieceDrop: handleLessonMove,
                        allowDragging: lessonStatus === "interactive",
                        boardOrientation: lessonOrientation,
                        squareStyles: showLessonHint && getLessonHintInfo() ? {
                          [getLessonHintInfo()!.source]: { backgroundColor: "rgba(255, 235, 59, 0.35)", borderRadius: "50%" },
                          [getLessonHintInfo()!.target]: { backgroundColor: "rgba(255, 235, 59, 0.5)" }
                        } : {},
                        arrows: showLessonHint && getLessonHintInfo() ? [
                          { startSquare: getLessonHintInfo()!.source, endSquare: getLessonHintInfo()!.target, color: "rgba(255, 235, 59, 0.85)" }
                        ] : []
                      }}
                    />
                  </div>
                  {lessonStatus === "interactive" && (
                    <div className="flex gap-4 mt-4 w-full max-w-[440px] justify-center">
                      <button
                        onClick={() => setLessonOrientation(prev => prev === "white" ? "black" : "white")}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-white/5 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        Flip Board
                      </button>
                      <button
                        onClick={() => setShowLessonHint(prev => !prev)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          showLessonHint
                            ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                            : "bg-slate-800 border-white/5 text-slate-300 hover:text-white"
                        }`}
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        {showLessonHint ? "Hide Hint" : "Get Hint"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full max-w-[440px] aspect-square rounded-2xl border border-white/10 glass flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <BookOpen className="w-16 h-16 text-primary-400" />
                  <h3 className="text-xl font-bold text-white">Conceptual Lesson</h3>
                  <p className="text-slate-400 text-sm">This lesson contains theoretical principles. Read the guide and proceed to the quiz when ready.</p>
                </div>
              )}
            </div>

            {/* Side panel instructions/theory */}
            <div className="glass-card border border-white/10 p-6 rounded-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-primary-400 bg-primary-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {selectedLesson.category}
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-3">{selectedLesson.title}</h2>
                </div>

                {lessonStatus === "reading" && (
                  <div className="space-y-6">
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {selectedLesson.content}
                    </p>
                    <button
                      onClick={() => {
                        const seq = selectedLesson.sequence || (selectedLesson.interactiveMove ? [selectedLesson.interactiveMove] : []);
                        if (selectedLesson.fen && seq.length > 0) {
                          setLessonStatus("interactive");
                        } else if (selectedLesson.quiz) {
                          setLessonStatus("quiz");
                        } else {
                          completeLesson();
                        }
                      }}
                      className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      {selectedLesson.fen ? "Start Interactive Practice" : "Proceed to Quiz"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {lessonStatus === "interactive" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                      <h4 className="text-sm font-bold text-primary-400 mb-1">Interactive Target</h4>
                      <p className="text-xs text-slate-300">
                        {selectedLesson.sequence ? (
                          `Follow the sequence: Make move ${Math.floor(lessonMoveIdx / 2) + 1} (${selectedLesson.sequence[lessonMoveIdx]})`
                        ) : (
                          "Find the key move described in the text and play it on the board."
                        )}
                      </p>
                    </div>

                    {showLessonHint && getLessonHintInfo() && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300 text-xs font-semibold animate-pulse flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-yellow-400 text-[11px]">Hint</div>
                          <p className="text-[10px] opacity-90 mt-0.5">{getLessonHintInfo()?.text}</p>
                        </div>
                      </div>
                    )}
                    
                    {moveCorrect === true && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
                        Correct Move! Transitioning...
                      </div>
                    )}
                    {moveCorrect === false && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl">
                        Incorrect move. Review the text and try again!
                      </div>
                    )}
                  </div>
                )}

                {lessonStatus === "quiz" && selectedLesson.quiz && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-primary-400" />
                      Lesson Quiz
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{selectedLesson.quiz.question}</p>
                    
                    <div className="space-y-2">
                      {selectedLesson.quiz.options.map((opt, i) => (
                        <button
                          key={i}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedOption(i)}
                          className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-colors ${
                            selectedOption === i
                              ? "bg-primary-600/20 border-primary-500 text-white"
                              : "bg-surface-100 border-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {!quizSubmitted ? (
                      <button
                        onClick={submitQuiz}
                        disabled={selectedOption === null}
                        className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <div>
                        {quizCorrect ? (
                          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-xl">
                            Correct answer! Lesson complete.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl">
                              Incorrect. Let's retry.
                            </div>
                            <button
                              onClick={() => {
                                setQuizSubmitted(false);
                                setSelectedOption(null);
                              }}
                              className="w-full py-2 bg-surface-200 border border-white/5 text-slate-300 hover:bg-surface-300 rounded-xl text-xs font-semibold"
                            >
                              Retry Quiz
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {lessonStatus === "completed" && (
                  <div className="text-center p-8 bg-green-500/10 border border-green-500/20 rounded-2xl space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                    <div>
                      <h4 className="text-lg font-bold text-white">Lesson Completed!</h4>
                      <p className="text-xs text-slate-400 mt-1">You earned +50 Academy XP.</p>
                    </div>
                    <button
                      onClick={() => setSelectedLesson(null)}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Return to Academy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ACADEMY HOMEPAGE */
        <div className="space-y-8">
          {/* Header Dashboard Banner */}
          <section className="relative overflow-hidden rounded-3xl glass-card p-8 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary-500/10 blur-3xl rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Learning Academy</h1>
                <p className="text-slate-400 text-sm mt-1">Structured Chess.com curriculum from basic moves to advanced endgame opposition and mating patterns.</p>
              </div>
            </div>
            
            <div className="glass px-6 py-3 rounded-2xl border border-white/5 flex gap-4 text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lessons Finished</div>
                <div className="text-lg font-extrabold text-white">{completedLessonIds.length} / {seedLessons.length}</div>
              </div>
            </div>
          </section>

          {/* Academy Tab Switcher */}
          <div className="flex gap-4 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveSection("lessons")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSection === "lessons"
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Lessons & Courses
            </button>
            <button
              onClick={() => {
                setActiveSection("openings");
                setTrainingStatus("idle");
                setOpeningGame(new Chess());
                setTrainingIndex(0);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSection === "openings"
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Opening Laboratory
            </button>
          </div>

          {activeSection === "lessons" ? (
            <div className="space-y-6">
              {/* Chess.com Guide Map / Roadmap */}
              <div className="bg-surface-100 border border-[#3d3b38] p-6 rounded-3xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-400" />
                      Your Learning Path
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Master chess concepts systematically from starting moves to grandmaster strategy.</p>
                  </div>
                </div>

                {/* Nodes row */}
                <div className="relative flex flex-col md:flex-row justify-between gap-6 items-center py-4 px-2">
                  {/* Connecting line */}
                  <div className="absolute top-1/2 left-8 right-8 h-1 bg-[#2b2925] -translate-y-1/2 hidden md:block z-0"></div>

                  {[
                    { id: "new_to_chess", label: "New to Chess", color: "border-blue-500 text-blue-400 bg-blue-500/10" },
                    { id: "beginner", label: "Beginner", color: "border-green-500 text-green-400 bg-green-500/10" },
                    { id: "intermediate", label: "Intermediate", color: "border-amber-500 text-amber-400 bg-amber-500/10" },
                    { id: "advanced", label: "Advanced", color: "border-red-500 text-red-400 bg-red-500/10" },
                    { id: "mastery", label: "Mastery", color: "border-purple-500 text-purple-400 bg-purple-500/10" }
                  ].map((level, idx) => {
                    const levelLessons = seedLessons.filter((l) => l.difficulty === level.id);
                    const completedInLevel = levelLessons.filter((l) => completedLessonIds.includes(l.id)).length;
                    const isLevelDone = levelLessons.length > 0 && completedInLevel === levelLessons.length;
                    const isActive = filterDifficulty === level.id;

                    return (
                      <button
                        key={level.id}
                        onClick={() => setFilterDifficulty(level.id as any)}
                        className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                      >
                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all hover:scale-110 ${
                          isActive 
                            ? `${level.color} ring-4 ring-primary-500/20`
                            : isLevelDone
                            ? "border-green-500 text-green-400 bg-green-500/20"
                            : "border-[#3d3b38] text-slate-400 bg-surface-200"
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="text-center">
                          <div className="font-extrabold text-xs text-white group-hover:text-primary-400 transition-colors">{level.label}</div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">{completedInLevel}/{levelLessons.length} Done</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Filters */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All Tiers" },
                    { id: "new_to_chess", label: "New to Chess" },
                    { id: "beginner", label: "Beginner" },
                    { id: "intermediate", label: "Intermediate" },
                    { id: "advanced", label: "Advanced" },
                    { id: "mastery", label: "Mastery" },
                  ].map((difficulty) => (
                    <button
                      key={difficulty.id}
                      onClick={() => setFilterDifficulty(difficulty.id as any)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        filterDifficulty === difficulty.id
                          ? "bg-slate-800 border-white/10 text-white"
                          : "bg-surface-100/50 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {difficulty.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All Categories" },
                    { id: "Openings", label: "Openings" },
                    { id: "Endgames", label: "Endgames" },
                    { id: "Strategy", label: "Strategy" },
                    { id: "Tactics", label: "Tactics" },
                    { id: "Attacking", label: "Attacking" },
                    { id: "Master Games", label: "Master Games" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        categoryFilter === cat.id
                          ? "bg-primary-600 border-primary-500 text-white shadow-sm shadow-primary-500/20"
                          : "bg-surface-100/50 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lessons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredLessons.map((lesson) => {
                  const isCompleted = completedLessonIds.includes(lesson.id);
                  return (
                    <div 
                      key={lesson.id} 
                      className={`glass-card border p-6 rounded-2xl flex justify-between gap-4 items-start relative hover:border-white/20 transition-all group ${
                        isCompleted ? "border-green-500/20 bg-green-500/5" : "border-white/10 bg-surface-100/30"
                      }`}
                    >
                      <div className="space-y-4 flex-1">
                        <div className="flex gap-2 items-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                            lesson.difficulty === "new_to_chess"
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              : lesson.difficulty === "beginner"
                              ? "bg-green-500/10 border-green-500/20 text-green-400"
                              : lesson.difficulty === "intermediate"
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : lesson.difficulty === "advanced"
                              ? "bg-red-500/10 border-red-500/20 text-red-400"
                              : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          }`}>
                            {lesson.difficulty.replace(/_/g, " ")}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-white/5 uppercase">
                            {lesson.category}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2 group-hover:text-primary-400 transition-colors">
                            {lesson.title}
                            {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                          </h3>
                          <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">{lesson.description}</p>
                        </div>

                        <button
                          onClick={() => startLesson(lesson)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            isCompleted
                              ? "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                              : "bg-primary-600 hover:bg-primary-500 text-white"
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          {isCompleted ? "Review Lesson" : "Start Lesson"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {/* Opening Selector List */}
              <div className="glass-card border border-white/10 p-5 rounded-2xl space-y-3 h-[60vh] overflow-y-auto">
                <h4 className="font-bold text-white text-sm">Select Opening</h4>
                <div className="space-y-2">
                  {seedOpenings.map((op) => {
                    const data = openingData[op.id];
                    const status = getReviewStatus(op.id);
                    return (
                      <button
                        key={op.id}
                        onClick={() => {
                          setActiveOpening(op);
                          setOpeningGame(new Chess());
                          setTrainingIndex(0);
                          setTrainingStatus("idle");
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border flex flex-col gap-1.5 transition-all ${
                          activeOpening.id === op.id
                            ? "bg-primary-600/20 border-primary-500 text-white"
                            : "bg-surface-100/50 border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold text-sm text-white">{op.name}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium leading-relaxed">{op.description}</span>
                        
                        {data && data.mastery > 0 && (
                          <div className="w-full mt-1.5 space-y-1">
                            <div className="flex justify-between text-[8px] font-bold text-slate-500">
                              <span>Mastery</span>
                              <span>{data.mastery}%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: `${data.mastery}%` }}></div>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chessboard and controls */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col justify-center items-center">
                  <div className="w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 glass-panel bg-background">
                    <Chessboard
                      options={{
                        position: openingGame.fen(),
                        onPieceDrop: handleOpeningMove,
                        allowDragging: trainingStatus === "training",
                        boardOrientation: openingOrientation,
                        squareStyles: showOpeningHint && getOpeningHintInfo() ? {
                          [getOpeningHintInfo()!.source]: { backgroundColor: "rgba(255, 235, 59, 0.35)", borderRadius: "50%" },
                          [getOpeningHintInfo()!.target]: { backgroundColor: "rgba(255, 235, 59, 0.5)" }
                        } : {},
                        arrows: showOpeningHint && getOpeningHintInfo() ? [
                          { startSquare: getOpeningHintInfo()!.source, endSquare: getOpeningHintInfo()!.target, color: "rgba(255, 235, 59, 0.85)" }
                        ] : []
                      }}
                    />
                  </div>
                  {trainingStatus === "training" && (
                    <>
                      <div className="flex gap-3 mt-3 w-full max-w-[340px] justify-center">
                        <button
                          onClick={() => setOpeningOrientation(prev => prev === "white" ? "black" : "white")}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-white/5 text-slate-300 hover:text-white rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          Flip
                        </button>
                        <button
                          onClick={() => setShowOpeningHint(prev => !prev)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                            showOpeningHint
                              ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                              : "bg-slate-800 border-white/5 text-slate-300 hover:text-white"
                          }`}
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          {showOpeningHint ? "Hide Hint" : "Get Hint"}
                        </button>
                      </div>
                      <span className="text-[11px] font-bold text-primary-400 mt-2 animate-pulse uppercase">
                        Play move: {activeOpening.movesSequence[trainingIndex]}
                      </span>
                    </>
                  )}
                </div>

                <div className="glass-card border border-white/10 p-5 rounded-2xl flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">{activeOpening.name}</h3>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {activeOpening.moves.map((mv, idx) => (
                          <span key={idx} className="text-[10px] font-mono font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                            {mv}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{activeOpening.theory}</p>

                    <div className="p-3 bg-surface-100 rounded-xl space-y-2 border border-white/5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Explorer Stats (Master database)</div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                          <div className="text-green-400 font-extrabold">{activeOpening.whiteWinRate}%</div>
                          <div className="text-[9px] text-slate-500">White Win</div>
                        </div>
                        <div className="p-2 bg-slate-500/5 rounded-lg border border-slate-500/10">
                          <div className="text-slate-300 font-extrabold">{activeOpening.drawRate}%</div>
                          <div className="text-[9px] text-slate-500">Draws</div>
                        </div>
                        <div className="p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                          <div className="text-red-400 font-extrabold">{activeOpening.blackWinRate}%</div>
                          <div className="text-[9px] text-slate-500">Black Win</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {trainingStatus === "idle" && (
                      <button
                        onClick={() => startOpeningTraining(activeOpening)}
                        className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        Train Repertoire Memory
                      </button>
                    )}
                    {trainingStatus === "training" && (
                      <div className="space-y-3">
                        <div className="p-3 bg-primary-500/5 border border-primary-500/10 text-primary-400 text-xs font-semibold rounded-xl text-center">
                          Memorize the sequence by playing the moves.
                        </div>
                        {showOpeningHint && getOpeningHintInfo() && (
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-300 text-xs font-semibold flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-yellow-400 text-[11px]">Hint</div>
                              <p className="text-[10px] opacity-95 mt-0.5">{getOpeningHintInfo()?.text}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {trainingStatus === "correct" && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-xl text-center animate-pulse">
                        Correct! Opponent responding...
                      </div>
                    )}
                    {trainingStatus === "failed" && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl text-center">
                        Wrong move! Try again.
                      </div>
                    )}
                    {trainingStatus === "completed" && (
                      <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl space-y-2">
                        <div className="text-xs font-bold text-green-400">Repertoire Memorized!</div>
                        <div className="text-[10px] text-slate-400">You earned +10 Academy XP.</div>
                        <button
                          onClick={() => setTrainingStatus("idle")}
                          className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[11px] font-bold rounded-lg transition-colors"
                        >
                          Practice Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AcademyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AcademyContent />
    </Suspense>
  );
}
