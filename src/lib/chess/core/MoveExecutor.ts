import { Chess } from "chess.js";
import { GameState } from "./GameState";
import { PieceColor } from "./types";
import { checkKingOfTheHillCenter } from "../variants";

export interface MoveExecutionResult {
  success: boolean;
  moveSan?: string;
  variantWin?: PieceColor | null;
  winReason?: string;
  inCheck?: boolean;
}

export class MoveExecutor {
  /**
   * Executes a move on the provided chess instance and updates the GameState accordingly.
   * Also evaluates variant win conditions (King of the Hill, Three-Check).
   */
  static executeMove(
    gameState: GameState,
    chess: Chess,
    from: string,
    to: string,
    promotion?: string
  ): MoveExecutionResult {
    try {
      // Find matching move to check if legal
      const moves = chess.moves({ verbose: true });
      const legalMove = moves.find(
        (m) =>
          m.from === from &&
          m.to === to &&
          (!promotion || m.promotion === promotion)
      );

      if (!legalMove) {
        return { success: false };
      }

      // Execute on chess.js
      const move = chess.move({
        from,
        to,
        promotion,
      });

      if (!move) {
        return { success: false };
      }

      // Update position and history in gameState
      gameState.updatePosition(chess.fen(), chess.history());

      // 1. King of the Hill Variant Evaluation
      if (gameState.config.mode === "kingofthehill") {
        const centerKingWinner = checkKingOfTheHillCenter(chess.fen());
        if (centerKingWinner) {
          gameState.updateStatus("variant_win", centerKingWinner, "King in Center");
          return {
            success: true,
            moveSan: move.san,
            variantWin: centerKingWinner,
            winReason: "King in Center",
            inCheck: chess.inCheck()
          };
        }
      }

      // 2. Three-Check Variant Evaluation
      if (gameState.config.mode === "threecheck" && chess.inCheck()) {
        // If in check, the player who made the move checked the opponent.
        // The opponent color is chess.turn() after the move.
        // Wait, if white moved and checked black, black's turn is now active (chess.turn() === "b"),
        // so the checked color is "black".
        const checkedColor: PieceColor = chess.turn() === "b" ? "black" : "white";
        const currentChecks = gameState.incrementCheck(checkedColor);
        
        if (currentChecks >= 3) {
          const winner: PieceColor = checkedColor === "white" ? "black" : "white";
          gameState.updateStatus("variant_win", winner, "Three Checks reached");
          return {
            success: true,
            moveSan: move.san,
            variantWin: winner,
            winReason: "Three Checks reached",
            inCheck: true
          };
        }
      }

      // 3. Standard Game Over Evaluations
      if (chess.isGameOver()) {
        if (chess.isCheckmate()) {
          const winner: PieceColor = chess.turn() === "w" ? "black" : "white";
          gameState.updateStatus("checkmate", winner, "Checkmate");
          return {
            success: true,
            moveSan: move.san,
            variantWin: null,
            inCheck: true
          };
        } else if (chess.isDraw()) {
          gameState.updateStatus("draw", "draw", "Draw");
          return {
            success: true,
            moveSan: move.san,
            variantWin: null,
            inCheck: false
          };
        }
      }

      // Return normal success
      return {
        success: true,
        moveSan: move.san,
        variantWin: null,
        inCheck: chess.inCheck()
      };
    } catch (error) {
      console.error("Error executing move in MoveExecutor:", error);
      return { success: false };
    }
  }
}
