"use client";

import React, { useState } from "react";
import { Award, Code, Sparkles, BookOpen, Star, Shield, Heart, Zap, History, ChevronRight, ChevronLeft, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function AboutPage() {
  const [activeChapter, setActiveChapter] = useState(0);

  const developers = [
    {
      name: "Nikunj Bhardwaj",
      role: "Lead Architect & Program Leader",
      roleBadge: "Leader",
      image: "/nikunj.jpeg",
      desc: "The visionary mind behind Chessonium. Nikunj engineered the core architecture, structured the real-time AI chess coach integrations, and led the development team to push limits in chess visualization technology.",
      skills: ["Core Architecture", "AI Integrations", "Project Leadership", "System Design"],
      socials: {
        github: "https://github.com/nikunjbhardwaj",
        linkedin: "https://linkedin.com/in/nikunjbhardwaj",
        email: "mailto:nikunj@chessonium.in"
      }
    },
    {
      name: "Akshath Kataria",
      role: "Co-Developer & Right-Hand Engineer",
      roleBadge: "Co-Developer",
      image: "/akshath.png",
      desc: "The master of logical optimization and right-hand engineer to Nikunj. Akshath refined tactical engines, solved complex state flow algorithms, and brought visual animations and endless puzzle flows to life.",
      skills: ["State Optimization", "UI Engineering", "Engine Tuning", "Algorithmic Efficiency"],
      socials: {
        github: "https://github.com/akshathkataria",
        linkedin: "https://linkedin.com/in/akshathkataria",
        email: "mailto:akshath@chessonium.in"
      }
    },
  ];

  const storyChapters = [
    {
      title: "Chapter 1: The Grind",
      tagline: "Struggle",
      icon: Code,
      content: "Nikunj Bhardwaj, the visionary program leader, and his right-hand developer Akshath Kataria spent countless sleepless nights building Chessonium. Just as they completed the main database, a catastrophic server crash wiped out all their work, leaving them broke, exhausted, and facing immense pressure to quit.",
    },
    {
      title: "Chapter 2: The Darkness",
      tagline: "Emotional",
      icon: Heart,
      content: "With a high-stakes investor demo scheduled in less than 48 hours, a massive storm knocked out the power. Coding on dying laptop batteries in absolute darkness, the emotional strain was crushing as Nikunj and Akshath struggled to recreate months of code entirely from memory.",
    },
    {
      title: "Chapter 3: The Silent Countdown",
      tagline: "Suspense",
      icon: Zap,
      content: "At midnight, the recovery build compiled, but the laptop cooling fans shrieked as system resources collapsed under a massive memory leak. If the server crashed during the demo, the project would die. The creators counted down the minutes in agonizing suspense.",
    },
    {
      title: "Chapter 4: The Betrayal",
      tagline: "Plot Twist",
      icon: Shield,
      content: "In a shocking twist, Akshath discovered that the leak was a Trojan backdoor injected by the lead venture capitalist himself. The investor was actively sabotaging the program to force them to sell Chessonium for pennies. Anger replaced fear, and they set a trap.",
    },
    {
      title: "Chapter 5: The Sunrise",
      tagline: "Good Ending",
      icon: Award,
      content: "During the live demo, Nikunj projected the sabotage logs showing the investor's private IP on the screen. The other partners expelled the corrupt investor and signed a multi-million dollar funding deal. Chessonium rose, built on a leader's vision and a right-hand's loyalty.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-100 p-8 border border-[#3d3b38] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-green-400 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Code className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">About Developers</h1>
            <p className="text-slate-400 text-sm mt-1">
              Meet the creators who built Chessonium and read the odyssey behind the code.
            </p>
          </div>
        </div>
      </section>

      {/* Developer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {developers.map((dev) => (
          <div 
            key={dev.name}
            className="relative overflow-hidden rounded-3xl border border-white/10 glass-card p-6 shadow-2xl hover:scale-[1.01] hover:border-white/20 transition-all duration-300 group"
          >
            {/* Background Glow */}
            <div className="absolute -right-16 -bottom-16 w-48 h-48 blur-3xl rounded-full bg-primary-500/10 opacity-30 group-hover:opacity-45 transition-all duration-500" />
            
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Profile Image container */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border border-white/10 shrink-0 relative group-hover:border-primary-500/50 transition-all duration-500 bg-surface-100 flex items-center justify-center">
                <img
                  src={dev.image}
                  alt={dev.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-white group-hover:text-primary-400 transition-colors">{dev.name}</h3>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/20">
                    {dev.roleBadge}
                  </span>
                </div>
                <p className="text-xs text-primary-400 font-extrabold">{dev.role}</p>
                <p className="text-xs text-slate-300 leading-relaxed pt-2">{dev.desc}</p>
                
                {/* Social Icons */}
                <div className="flex items-center gap-3 pt-3">
                  <a
                    href={dev.socials.github}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-surface-100/80 border border-white/5 text-slate-400 hover:text-white hover:bg-surface-200 transition-all"
                    title="GitHub Profile"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={dev.socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-surface-100/80 border border-white/5 text-slate-400 hover:text-white hover:bg-surface-200 transition-all"
                    title="LinkedIn Profile"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={dev.socials.email}
                    className="p-2 rounded-xl bg-surface-100/80 border border-white/5 text-slate-400 hover:text-white hover:bg-surface-200 transition-all"
                    title="Contact Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2 select-none">Key Areas</span>
              <div className="flex flex-wrap gap-1.5">
                {dev.skills.map((skill) => (
                  <span 
                    key={skill}
                    className="text-[9px] font-bold text-slate-300 bg-surface-100/50 border border-white/5 px-2.5 py-1 rounded-lg hover:border-primary-500/30 hover:text-white transition-all select-none"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Backstory Carousel */}
      <section className="bg-surface-100 border border-[#3d3b38] rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
              <History className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">The Chessonium Odyssey</h2>
              <p className="text-slate-400 text-xs mt-0.5">The emotional true story behind the engineering of the program.</p>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => setActiveChapter((c) => Math.max(0, c - 1))}
              disabled={activeChapter === 0}
              className="p-1.5 bg-surface-200 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-mono font-bold text-slate-400 px-2">
              Chapter {activeChapter + 1} / {storyChapters.length}
            </div>
            <button
              onClick={() => setActiveChapter((c) => Math.min(storyChapters.length - 1, c + 1))}
              disabled={activeChapter === storyChapters.length - 1}
              className="p-1.5 bg-surface-200 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Story Slide Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[220px]">
          {/* Chapter Selector sidebar */}
          <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-thin">
            {storyChapters.map((ch, idx) => {
              const isActive = activeChapter === idx;
              const Icon = ch.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveChapter(idx)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all border shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-primary-500/15 border-primary-500/30 text-primary-400 shadow-md"
                      : "bg-surface-200/50 border-transparent text-slate-400 hover:text-white hover:bg-surface-200"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{ch.title.split(":")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Chapter Content panel */}
          <div className="lg:col-span-9 bg-surface-200/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChapter}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-3 h-full flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-extrabold text-white">{storyChapters[activeChapter].title}</h3>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      activeChapter === 0 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                      activeChapter === 1 ? "bg-pink-500/10 text-pink-400 border-pink-500/20" :
                      activeChapter === 2 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                      activeChapter === 3 ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-green-500/10 text-green-400 border-green-500/20"
                    }`}>
                      {storyChapters[activeChapter].tagline}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {storyChapters[activeChapter].content}
                  </p>
                </div>

                <div className="mt-6 flex justify-between items-center pt-4 border-t border-white/5 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-primary-400 fill-primary-400/20 animate-pulse" />
                    Written by Chessonium
                  </span>
                  <span>
                    {activeChapter === storyChapters.length - 1 ? "Fin." : "Click Next to continue →"}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}
