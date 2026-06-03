"use client";

import React, { useState } from "react";
import { seedPosts, seedClubs, seedForums, Post, Club, ForumTopic } from "@/lib/chess/social";
import { MessageSquare, Heart, Share2, Plus, Users, Compass, Globe, MessageCircle } from "lucide-react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import Link from "next/link";

export default function SocialPage() {
  useAuthRedirect();
  const [posts, setPosts] = useState<Post[]>(seedPosts);
  const [clubs, setClubs] = useState<Club[]>(seedClubs);
  const [forums, setForums] = useState<ForumTopic[]>(seedForums);
  
  // Create post state
  const [newPostContent, setNewPostContent] = useState("");
  const [attachType, setAttachType] = useState<"none" | "game" | "puzzle">("none");

  // Comments state tracking
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});

  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent) return;

    let sharedItem = undefined;
    if (attachType === "game") {
      sharedItem = {
        type: "game" as const,
        title: "Your Blitz Match",
        details: "1. e4 e5 2. Nf3 Nc6 ... Custom gameplay analysis.",
        link: "/play"
      };
    } else if (attachType === "puzzle") {
      sharedItem = {
        type: "puzzle" as const,
        title: "Tactical Puzzle Solution",
        details: "Rating: 1420 • Motif: Greek Gift",
        link: "/puzzles"
      };
    }

    const newPost: Post = {
      id: `p_${posts.length + 1}`,
      author: "You",
      avatarColor: "from-primary-400 to-accent-500",
      content: newPostContent,
      likes: 0,
      comments: [],
      sharedItem,
      createdAt: "Just now"
    };

    setPosts((prev) => [newPost, ...prev]);
    setNewPostContent("");
    setAttachType("none");
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId];
    if (!text) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, { author: "You", text }]
          };
        }
        return p;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleJoinClub = (clubId: string) => {
    setClubs((prev) =>
      prev.map((c) => (c.id === clubId ? { ...c, joined: !c.joined, members: c.joined ? c.members - 1 : c.members + 1 } : c))
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Social Feed (2 Columns wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post Card */}
          <form onSubmit={handleCreatePost} className="glass-card border border-white/10 p-5 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Share an Update</h3>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind? Share a tactical insight or opening repertoire..."
              rows={3}
              className="w-full bg-surface-100/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
            
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAttachType(attachType === "game" ? "none" : "game")}
                  className={`px-3.5 py-2 rounded-lg font-semibold border transition-colors ${
                    attachType === "game"
                      ? "bg-primary-500/20 border-primary-500 text-white"
                      : "bg-surface-200 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  Attach Recent Game
                </button>
                <button
                  type="button"
                  onClick={() => setAttachType(attachType === "puzzle" ? "none" : "puzzle")}
                  className={`px-3.5 py-2 rounded-lg font-semibold border transition-colors ${
                    attachType === "puzzle"
                      ? "bg-primary-500/20 border-primary-500 text-white"
                      : "bg-surface-200 border-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  Attach Today's Puzzle
                </button>
              </div>

              <button
                type="submit"
                disabled={!newPostContent}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-750 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-primary-500/15"
              >
                <Plus className="w-4 h-4" />
                Post Update
              </button>
            </div>
          </form>

          {/* Posts List */}
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="glass-card border border-white/10 p-6 rounded-2xl space-y-4">
                {/* Author Card */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${post.avatarColor} flex items-center justify-center font-bold text-white uppercase`}>
                    {post.author[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{post.author}</h4>
                    <span className="text-[10px] text-slate-500 font-semibold">{post.createdAt}</span>
                  </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed">{post.content}</p>

                {/* Shared Items Display (Games / Puzzles) */}
                {post.sharedItem && (
                  <div className="p-4 bg-surface-100/50 border border-white/5 rounded-xl flex justify-between items-center gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-primary-400 bg-primary-400/10 px-2 py-0.5 rounded border border-primary-500/20 uppercase tracking-wide">
                        Shared {post.sharedItem.type}
                      </span>
                      <h5 className="font-bold text-sm text-white mt-1.5">{post.sharedItem.title}</h5>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">{post.sharedItem.details}</p>
                    </div>
                    <Link
                      href={post.sharedItem.link}
                      className="px-4 py-2 bg-primary-600/15 border border-primary-500/20 hover:bg-primary-500 text-primary-400 hover:text-white rounded-lg text-xs font-bold transition-all shrink-0"
                    >
                      View Shared
                    </Link>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-4 border-t border-white/5 pt-4 text-xs font-semibold text-slate-400">
                  <button 
                    onClick={() => handleLikePost(post.id)}
                    className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-red-400/5" />
                    <span>{post.likes} Likes</span>
                  </button>
                  
                  <button
                    onClick={() => setShowComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments.length} Comments</span>
                  </button>
                </div>

                {/* Comments Thread Expanded */}
                {showComments[post.id] && (
                  <div className="border-t border-white/5 pt-4 space-y-4">
                    <div className="space-y-3">
                      {post.comments.map((c, i) => (
                        <div key={i} className="p-3 bg-surface-100/30 border border-white/5 rounded-xl text-xs space-y-1">
                          <div className="font-bold text-white">{c.author}</div>
                          <p className="text-slate-400">{c.text}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        className="flex-1 bg-surface-100 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Clubs & Forums Sidebar (1 Column wide) */}
        <div className="space-y-6">
          {/* Clubs section */}
          <section className="glass-card border border-white/10 p-5 rounded-2xl space-y-4">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-400" />
              Chess Clubs
            </h4>
            <div className="space-y-3">
              {clubs.map((club) => (
                <div key={club.id} className="p-3 bg-surface-100/50 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-xs text-white">{club.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-1">{club.members} Members</p>
                  </div>
                  
                  <button
                    onClick={() => handleJoinClub(club.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      club.joined
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-primary-600 border border-transparent text-white hover:bg-primary-500"
                    }`}
                  >
                    {club.joined ? "Joined" : "Join"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Forums section */}
          <section className="glass-card border border-white/10 p-5 rounded-2xl space-y-4">
            <h4 className="font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary-400" />
              Forums Discussion
            </h4>
            <div className="space-y-3">
              {forums.map((topic) => (
                <div key={topic.id} className="p-3 bg-surface-100/50 border border-white/5 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-xs text-white hover:text-primary-400 transition-colors cursor-pointer">
                    {topic.title}
                  </h5>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold">
                    <span>Replies: {topic.replies}</span>
                    <span>Last active: {topic.lastActive}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
