import { useEffect, useRef, useState } from "react";

export interface StockfishUpdate {
  score: number; // centipawns or mate steps
  type: "cp" | "mate";
  bestMove?: string;
  depth: number;
  topMoves?: Array<{ move: string; score: number; type: "cp" | "mate" }>;
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [evaluation, setEvaluation] = useState<StockfishUpdate>({ score: 0, type: "cp", depth: 0 });
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    // Standard Stockfish loading via Blob to avoid cross-origin Worker issues
    const workerCode = `
      importScripts('${window.location.origin}/stockfish.js');
      // stockfish.js exposes a global function 'STOCKFISH' which initializes the engine
      var engine = typeof STOCKFISH === 'function' ? STOCKFISH() : null;
      
      if (engine) {
        engine.onmessage = function(event) {
          postMessage(event);
        };
        
        onmessage = function(event) {
          engine.postMessage(event.data);
        };
      }
    `;

    try {
      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      
      worker.onmessage = (event: MessageEvent) => {
        const line = event.data;
        
        // Parse Stockfish UCI output
        // Example: "info depth 8 seldepth 8 score cp 24 nodes 13532 nps 386628 time 35 pv e2e4"
        if (line.startsWith("info") && line.includes("score")) {
          const depthMatch = line.match(/depth (\d+)/);
          const cpMatch = line.match(/score cp (-?\d+)/);
          const mateMatch = line.match(/score mate (-?\d+)/);
          const multipvMatch = line.match(/multipv (\d+)/);
          const pvMatch = line.match(/ pv (\S+)/);
          
          const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;
          const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
          const pvMove = pvMatch ? pvMatch[1] : undefined;
          
          let scoreVal = 0;
          let scoreType: "cp" | "mate" = "cp";
          if (cpMatch) {
            scoreVal = parseInt(cpMatch[1], 10) / 100;
            scoreType = "cp";
          } else if (mateMatch) {
            scoreVal = parseInt(mateMatch[1], 10);
            scoreType = "mate";
          }
          
          if (cpMatch || mateMatch) {
            setEvaluation((prev) => {
              // Only update if depth is equal or higher to avoid out of order updates
              if (depth > prev.depth) {
                const newTopMoves: Array<{ move: string; score: number; type: "cp" | "mate" }> = [];
                if (pvMove) {
                  newTopMoves[multipv - 1] = { move: pvMove, score: scoreVal, type: scoreType };
                }
                return { score: scoreVal, type: scoreType, depth, topMoves: newTopMoves };
              } else if (depth === prev.depth) {
                const newTopMoves = [...(prev.topMoves || [])];
                if (pvMove) {
                  newTopMoves[multipv - 1] = { move: pvMove, score: scoreVal, type: scoreType };
                }
                return {
                  ...prev,
                  score: multipv === 1 ? scoreVal : prev.score,
                  type: multipv === 1 ? scoreType : prev.type,
                  topMoves: newTopMoves
                };
              }
              return prev;
            });
          }
        }
        
        // Parse bestmove output
        if (line.startsWith("bestmove")) {
          const parts = line.split(" ");
          const bestMove = parts[1];
          setEvaluation((prev) => ({ ...prev, bestMove }));
          setIsEvaluating(false);
        }
      };

      workerRef.current = worker;
      
      // Initialize UCI engine
      worker.postMessage("uci");
      worker.postMessage("isready");
      worker.postMessage("setoption name MultiPV value 3");

      return () => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
      };
    } catch (e) {
      console.error("Failed to initialize Stockfish worker:", e);
    }
  }, []);

  const analyzePosition = (fen: string, depth: number = 12) => {
    if (!workerRef.current) return;
    
    setIsEvaluating(true);
    setEvaluation({ score: 0, type: "cp", depth: 0, bestMove: undefined });
    // Stop current evaluation
    workerRef.current.postMessage("stop");
    // Load position
    workerRef.current.postMessage(`position fen ${fen}`);
    // Start search
    workerRef.current.postMessage(`go depth ${depth}`);
  };

  return { evaluation, isEvaluating, analyzePosition };
}
