"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, CheckCircle2, Zap,
  BookOpen, Target, Clock, Brain, Trophy, Star,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: { id: string; label: string; icon: string; desc?: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "skill",
    question: "What best describes your chess level?",
    options: [
      { id: "beginner",      icon: "🌱", label: "Complete Beginner",   desc: "I just learned the rules" },
      { id: "casual",        icon: "🎮", label: "Casual Player",       desc: "I play occasionally for fun" },
      { id: "intermediate",  icon: "⚔️", label: "Intermediate",        desc: "Around 800–1400 rated" },
      { id: "advanced",      icon: "🎯", label: "Advanced",            desc: "1400–1800 rated" },
      { id: "expert",        icon: "👑", label: "Expert / Master",     desc: "1800+ rated" },
    ],
  },
  {
    id: "style",
    question: "What's your preferred playstyle?",
    options: [
      { id: "tactical",    icon: "⚡", label: "Tactical Fighter",   desc: "I love attacks and combinations" },
      { id: "positional",  icon: "🏰", label: "Positional Player",  desc: "I prefer strategic plans" },
      { id: "endgame",     icon: "♟️", label: "Endgame Specialist", desc: "I win in the endgame" },
      { id: "balanced",    icon: "⚖️", label: "Well Rounded",       desc: "I like all phases equally" },
    ],
  },
  {
    id: "weakness",
    question: "Where do you struggle most?",
    options: [
      { id: "openings",   icon: "📖", label: "Opening Preparation", desc: "I don't know what to play" },
      { id: "tactics",    icon: "🔍", label: "Missing Tactics",      desc: "I hang pieces or miss forks" },
      { id: "plans",      icon: "🗺️", label: "No Clear Plans",       desc: "I don't know what to do" },
      { id: "endgames",   icon: "🏁", label: "Endgame Technique",    desc: "I can't convert winning positions" },
      { id: "timemanage", icon: "⏱️", label: "Time Management",      desc: "I always run out of time" },
    ],
  },
  {
    id: "time",
    question: "How much time can you dedicate daily?",
    options: [
      { id: "5min",   icon: "⚡", label: "5–10 minutes",   desc: "Quick daily practice" },
      { id: "30min",  icon: "🎯", label: "30 minutes",      desc: "Focused sessions" },
      { id: "1hour",  icon: "📚", label: "1 hour",          desc: "Serious study" },
      { id: "2plus",  icon: "🏆", label: "2+ hours",        desc: "Dedicated training" },
    ],
  },
  {
    id: "goal",
    question: "What's your main goal?",
    options: [
      { id: "fun",         icon: "😄", label: "Just have fun",          desc: "Enjoy the game" },
      { id: "improve",     icon: "📈", label: "Improve my rating",      desc: "Climb the leaderboard" },
      { id: "beat_friends",icon: "👥", label: "Beat my friends",        desc: "Never lose to friends again" },
      { id: "competitive", icon: "🥇", label: "Compete seriously",      desc: "Play in tournaments" },
    ],
  },
];

interface Recommendation {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  tag: string;
}

function buildRecommendations(answers: Record<string, string>): Recommendation[] {
  const recs: Recommendation[] = [];

  // Opening recommendations
  if (answers.weakness === "openings" || answers.style === "tactical") {
    recs.push({
      title: "Opening Fundamentals",
      description: "Learn the key principles and most popular openings to never be lost in the first 10 moves again.",
      href: "/academy?tab=openings",
      icon: BookOpen,
      color: "#3b82f6",
      tag: "Priority",
    });
  }

  // Tactics
  if (answers.weakness === "tactics" || answers.skill === "beginner" || answers.skill === "casual") {
    recs.push({
      title: "Puzzle Rush Training",
      description: "Sharpen your tactical vision with daily puzzles. Find forks, pins, skewers and checkmate patterns.",
      href: "/puzzles",
      icon: Zap,
      color: "#f59e0b",
      tag: "Daily",
    });
  }

  // Endgames
  if (answers.weakness === "endgames" || answers.style === "endgame") {
    recs.push({
      title: "Endgame Mastery",
      description: "Learn King & Pawn endings, Rook endings, and key theoretical positions to convert your wins.",
      href: "/academy?tab=endgames",
      icon: Trophy,
      color: "#22c55e",
      tag: "Essential",
    });
  }

  // Play bots
  if (answers.goal === "improve" || answers.goal === "competitive") {
    recs.push({
      title: "Play vs AI Bots",
      description: "Challenge bots at your level to practice what you learn in real games against intelligent opponents.",
      href: "/bots",
      icon: Target,
      color: "#8b5cf6",
      tag: "Practice",
    });
  }

  // Time management → bullet/blitz
  if (answers.weakness === "timemanage" || answers.time === "5min") {
    recs.push({
      title: "Bullet & Blitz Games",
      description: "Fast games sharpen your intuition and improve decision-making under time pressure.",
      href: "/play",
      icon: Clock,
      color: "#ef4444",
      tag: "Speed",
    });
  }

  // Brain training
  if (answers.weakness === "plans" || answers.style === "positional") {
    recs.push({
      title: "Vision Trainer",
      description: "Train your board visualization to calculate deeper and find better long-term plans.",
      href: "/vision-trainer",
      icon: Brain,
      color: "#06b6d4",
      tag: "Training",
    });
  }

  // Always recommend analysis
  recs.push({
    title: "Game Analysis",
    description: "Analyze your recent games with the engine to learn from your mistakes and spot patterns.",
    href: "/analysis",
    icon: Star,
    color: "#f97316",
    tag: "Review",
  });

  return recs.slice(0, 5);
}

export default function LearningPathQuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = intro, 1-5 = questions, 6 = results
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [username, setUsername] = useState("Champion");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUsername(localStorage.getItem("username") || "Champion");
      // Load saved answers
      const saved = localStorage.getItem("learning-path-answers");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAnswers(parsed);
          setRecommendations(buildRecommendations(parsed));
          setStep(QUESTIONS.length + 1); // go to results
        } catch {}
      }
    }
  }, []);

  const currentQuestion = QUESTIONS[step - 1];
  const progress = step === 0 ? 0 : (step / QUESTIONS.length) * 100;

  const handleAnswer = (questionId: string, answerId: string) => {
    const newAnswers = { ...answers, [questionId]: answerId };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length) {
      setTimeout(() => setStep((s) => s + 1), 200);
    } else {
      const recs = buildRecommendations(newAnswers);
      setRecommendations(recs);
      localStorage.setItem("learning-path-answers", JSON.stringify(newAnswers));
      setTimeout(() => setStep(QUESTIONS.length + 1), 200);
    }
  };

  const restart = () => {
    setAnswers({});
    setRecommendations([]);
    localStorage.removeItem("learning-path-answers");
    setStep(0);
  };

  return (
    <div className="max-w-2xl mx-auto pb-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-bold mb-2">
          <Brain className="w-3.5 h-3.5" /> Personalized Learning Path
        </div>
        <h1 className="text-3xl font-black text-white">
          {step === 0 ? "Find Your Chess Path" : step > QUESTIONS.length ? "Your Personal Plan" : QUESTIONS[step - 1]?.question}
        </h1>
        {step === 0 && (
          <p className="text-slate-400 text-sm">
            Answer 5 quick questions and we'll build a personalized study plan just for you.
          </p>
        )}
      </div>

      {/* Progress bar */}
      {step > 0 && step <= QUESTIONS.length && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Question {step} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Intro */}
      {step === 0 && (
        <div className="glass-card border border-white/10 rounded-2xl p-8 text-center space-y-6">
          <div className="text-6xl">🎯</div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Hello, {username}!</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              We'll ask you 5 short questions about your skill level, playing style, and goals to create your perfect learning roadmap.
            </p>
          </div>
          <div className="flex justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Takes 1 minute</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Saved automatically</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Free forever</span>
          </div>
          <button
            onClick={() => setStep(1)}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all flex items-center gap-2 mx-auto"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Question */}
      {step >= 1 && step <= QUESTIONS.length && currentQuestion && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleAnswer(currentQuestion.id, opt.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] ${
                  answers[currentQuestion.id] === opt.id
                    ? "bg-primary-500/15 border-primary-500/40 shadow-lg shadow-primary-500/10"
                    : "glass-card border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <span className="text-2xl shrink-0">{opt.icon}</span>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{opt.label}</p>
                  {opt.desc && <p className="text-slate-500 text-xs mt-0.5">{opt.desc}</p>}
                </div>
                {answers[currentQuestion.id] === opt.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary-400 shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white text-sm border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {step > QUESTIONS.length && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="glass-card border border-primary-500/20 rounded-2xl p-5 bg-primary-500/5">
            <p className="text-center text-sm text-primary-300">
              🎉 Based on your answers, here's your personalized study plan, {username}!
            </p>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <Link
                key={rec.href + i}
                href={rec.href}
                className="glass-card border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-white/20 hover:bg-white/5 transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${rec.color}20`, border: `1px solid ${rec.color}40` }}
                >
                  <rec.icon className="w-5 h-5" style={{ color: rec.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{rec.title}</p>
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0"
                      style={{ background: `${rec.color}20`, color: rec.color }}
                    >
                      {rec.tag}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{rec.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 py-2.5 border border-white/10 text-slate-400 hover:text-white text-sm font-semibold rounded-xl hover:bg-white/5 transition-colors"
            >
              Retake Quiz
            </button>
            <Link
              href="/academy"
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl text-center transition-colors shadow-lg shadow-primary-500/20"
            >
              Go to Academy →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
