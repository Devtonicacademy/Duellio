import { DraftGameState, DraftPiece } from '../types';

export class DraftLogicService {
  /**
   * Initializes a standard 8x8 checkers (Draft) board.
   * Player 1 pieces are on the top 3 rows.
   * Player 2 pieces are on the bottom 3 rows.
   */
  static initializeBoard(sessionId: string, player1Id: string, player2Id: string): DraftGameState {
    const pieces: DraftPiece[] = [];
    const boardSize = 8;

    // Place pieces on dark squares only (row + col) % 2 === 1
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if ((row + col) % 2 === 1) {
          if (row < 3) {
            pieces.push({
              id: `p1-${row}-${col}`,
              playerId: player1Id,
              isKing: false,
              position: { row, col }
            });
          } else if (row > 4) {
            pieces.push({
              id: `p2-${row}-${col}`,
              playerId: player2Id,
              isKing: false,
              position: { row, col }
            });
          }
        }
      }
    }

    return {
      sessionId,
      playerIds: [player1Id, player2Id],
      pieces,
      activePlayerId: player1Id, // player 1 starts
      status: 'playing',
      turnTimer: 30 // 30 seconds per turn
    };
  }

  /**
   * Validates if a move is legal.
   * A highly simplified version - checking bounds and destination emptiness.
   */
  static isValidMove(state: DraftGameState, pieceId: string, targetRow: number, targetCol: number): boolean {
    const piece = state.pieces.find(p => p.id === pieceId);
    if (!piece) return false;

    // Basic bounds check
    if (targetRow < 0 || targetRow > 7 || targetCol < 0 || targetCol > 7) return false;
    
    // Check if moving to a dark square
    if ((targetRow + targetCol) % 2 === 0) return false;

    // Check if target is empty
    const targetOccupied = state.pieces.some(p => p.position.row === targetRow && p.position.col === targetCol);
    if (targetOccupied) return false;

    const rowDiff = Math.abs(targetRow - piece.position.row);
    const colDiff = Math.abs(targetCol - piece.position.col);
    
    if (rowDiff === 1 && colDiff === 1) {
      // If not king, ensure moving forward
      if (!piece.isKing) {
        const isPlayer1 = piece.playerId === state.playerIds[0];
        if (isPlayer1 && targetRow <= piece.position.row) return false; // P1 moves down (increasing row)
        if (!isPlayer1 && targetRow >= piece.position.row) return false; // P2 moves up (decreasing row)
      }
      return true;
    }

    if (rowDiff === 2 && colDiff === 2) {
      // If not king, ensure moving forward (in checkers, standard pieces can only jump forward as well in basic rules, or backward in some. Let's enforce forward jump for standard pieces for simplicity, or allow backward if preferred. Standard rules allow forward jumps only for normal pieces.)
      if (!piece.isKing) {
        const isPlayer1 = piece.playerId === state.playerIds[0];
        if (isPlayer1 && targetRow <= piece.position.row) return false;
        if (!isPlayer1 && targetRow >= piece.position.row) return false;
      }

      // Check intermediate cell
      const midRow = (piece.position.row + targetRow) / 2;
      const midCol = (piece.position.col + targetCol) / 2;
      const midPiece = state.pieces.find(p => p.position.row === midRow && p.position.col === midCol);
      
      // Must contain opponent's piece
      if (midPiece && midPiece.playerId !== piece.playerId) {
        return true;
      }
    }

    return false;
  }

  /**
   * Executes a move and returns the new game state.
   */
  static executeMove(state: DraftGameState, pieceId: string, targetRow: number, targetCol: number): DraftGameState {
    if (!this.isValidMove(state, pieceId, targetRow, targetCol)) {
      return state;
    }

    const piece = state.pieces.find(p => p.id === pieceId)!;
    const rowDiff = Math.abs(targetRow - piece.position.row);

    let nextPieces = state.pieces.map(p => {
      if (p.id !== pieceId) return p;
      
      const newPiece = { ...p, position: { row: targetRow, col: targetCol } };
      
      // Kinging logic: Reach opposite end
      const isPlayer1 = p.playerId === state.playerIds[0];
      if ((isPlayer1 && targetRow === 7) || (!isPlayer1 && targetRow === 0)) {
        newPiece.isKing = true;
      }
      
      return newPiece;
    });

    // If jump move (dist 2), remove the captured piece
    if (rowDiff === 2) {
      const midRow = (piece.position.row + targetRow) / 2;
      const midCol = (piece.position.col + targetCol) / 2;
      nextPieces = nextPieces.filter(p => !(p.position.row === midRow && p.position.col === midCol));
    }

    const nextActivePlayer = state.activePlayerId === state.playerIds[0] ? state.playerIds[1] : state.playerIds[0];

    return {
      ...state,
      pieces: nextPieces,
      activePlayerId: nextActivePlayer,
      lastMoveMessage: rowDiff === 2 
        ? `Player jumped and captured piece at row ${(piece.position.row + targetRow) / 2}, col ${(piece.position.col + targetCol) / 2}`
        : `Player moved to row ${targetRow}, col ${targetCol}`
    };
  }
}
