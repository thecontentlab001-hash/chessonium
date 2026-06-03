"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface Opponent {
  username: string;
  rating: number;
}

export interface ActiveGame {
  gameId: string;
  color: "white" | "black";
  opponent: Opponent;
}

export function useWebSockets() {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState<"idle" | "queued" | "playing">("idle");
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [incomingMove, setIncomingMove] = useState<{ from: string; to: string; promotion?: string } | null>(null);
  const [gameResult, setGameResult] = useState<any | null>(null);

  const connect = useCallback((id: string, username: string, rating: number) => {
    if (socketRef.current) return;

    const ws = new WebSocket("ws://localhost:3001");
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Register with server
      ws.send(JSON.stringify({
        type: "join_session",
        payload: { id, username, rating }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;

        switch (type) {
          case "queue_joined":
            setMatchmakingStatus("queued");
            break;
          case "queue_left":
            setMatchmakingStatus("idle");
            break;
          case "game_start":
            setActiveGame({
              gameId: payload.gameId,
              color: payload.color,
              opponent: payload.opponent
            });
            setMatchmakingStatus("playing");
            setGameResult(null);
            setIncomingMove(null);
            break;
          case "opponent_move":
            setIncomingMove({
              from: payload.from,
              to: payload.to,
              promotion: payload.promotion
            });
            break;
          case "game_finished":
            setGameResult(payload);
            setMatchmakingStatus("idle");
            setActiveGame(null);
            break;
        }
      } catch (e) {
        console.error("Failed to parse socket message:", e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setMatchmakingStatus("idle");
      socketRef.current = null;
    };
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const joinQueue = useCallback((category: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: "join_queue",
      payload: { category }
    }));
  }, []);

  const leaveQueue = useCallback((category: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: "leave_queue",
      payload: { category }
    }));
  }, []);

  const sendMove = useCallback((gameId: string, from: string, to: string, promotion?: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: "send_move",
      payload: { gameId, from, to, promotion }
    }));
  }, []);

  const declareGameOver = useCallback((gameId: string, outcome: "white" | "black" | "draw") => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: "game_over",
      payload: { gameId, outcome }
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    matchmakingStatus,
    activeGame,
    incomingMove,
    gameResult,
    connect,
    disconnect,
    joinQueue,
    leaveQueue,
    sendMove,
    declareGameOver,
  };
}
