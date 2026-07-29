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
   * Helper to robustly check if a piece belongs to Player 1 (top 3 rows at start / Cyan).
   */
  static isPlayer1(piece: DraftPiece, state: { playerIds?: string[] }): boolean {
    if (piece.id.startsWith('p1-')) return true;
    if (piece.id.startsWith('p2-')) return false;
    if (state.playerIds && state.playerIds[0]) {
      if (piece.playerId === state.playerIds[0]) return true;
    }
    return piece.playerId === 'host' || piece.playerId === 'player-user';
  }

  /**
   * Helper to check if a piece belongs to the active player whose turn it is.
   */
  static isPieceActive(piece: DraftPiece, state: DraftGameState): boolean {
    if (piece.playerId === state.activePlayerId) return true;
    const activeIsP1 = state.activePlayerId === state.playerIds[0] || state.activePlayerId === 'host' || state.activePlayerId === 'player-user';
    const pieceIsP1 = this.isPlayer1(piece, state);
    return activeIsP1 === pieceIsP1;
  }

  /**
   * Validates if a move is legal.
   * A highly simplified version - checking bounds and destination emptiness.
   */
  static isValidMove(state: DraftGameState, pieceId: string, targetRow: number, targetCol: number): boolean {
    const piece = state.pieces.find(p => p.id === pieceId);
    if (!piece) return false;

    // Check active player turn
    if (!this.isPieceActive(piece, state)) return false;

    // Basic bounds check
    if (targetRow < 0 || targetRow > 7 || targetCol < 0 || targetCol > 7) return false;
    
    // Check if moving to a dark square
    if ((targetRow + targetCol) % 2 === 0) return false;

    // Check if target is empty
    const targetOccupied = state.pieces.some(p => p.position.row === targetRow && p.position.col === targetCol);
    if (targetOccupied) return false;

    const rowDiff = Math.abs(targetRow - piece.position.row);
    const colDiff = Math.abs(targetCol - piece.position.col);
    const isP1 = this.isPlayer1(piece, state);
    
    if (rowDiff === 1 && colDiff === 1) {
      // If not king, ensure moving forward
      if (!piece.isKing) {
        if (isP1 && targetRow <= piece.position.row) return false; // P1 moves down (increasing row)
        if (!isP1 && targetRow >= piece.position.row) return false; // P2 moves up (decreasing row)
      }
      return true;
    }

    if (rowDiff === 2 && colDiff === 2) {
      // If not king, ensure moving forward
      if (!piece.isKing) {
        if (isP1 && targetRow <= piece.position.row) return false;
        if (!isP1 && targetRow >= piece.position.row) return false;
      }

      // Check intermediate cell
      const midRow = (piece.position.row + targetRow) / 2;
      const midCol = (piece.position.col + targetCol) / 2;
      const midPiece = state.pieces.find(p => p.position.row === midRow && p.position.col === midCol);
      
      // Must contain opponent's piece
      if (midPiece) {
        const midPieceIsP1 = this.isPlayer1(midPiece, state);
        if (midPieceIsP1 !== isP1) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Helper to check if a specific player has any valid moves remaining.
   */
  static hasValidMoves(state: DraftGameState, playerId: string): boolean {
    const isTargetP1 = playerId === state.playerIds[0] || playerId === 'host' || playerId === 'player-user';
    const playerPieces = state.pieces.filter(p => this.isPlayer1(p, state) === isTargetP1);
    if (playerPieces.length === 0) return false;

    // Temporarily create state with activePlayerId set to this player for validation
    const tempState = { ...state, activePlayerId: playerId };

    for (const piece of playerPieces) {
      const isP1 = this.isPlayer1(piece, state);
      const forwardDir = isP1 ? 1 : -1;
      const directions = piece.isKing
        ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
        : [[forwardDir, 1], [forwardDir, -1]];

      for (const [rDir, cDir] of directions) {
        // Step move
        if (this.isValidMove(tempState, piece.id, piece.position.row + rDir, piece.position.col + cDir)) {
          return true;
        }
        // Jump move
        if (this.isValidMove(tempState, piece.id, piece.position.row + rDir * 2, piece.position.col + cDir * 2)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Helper to check if a specific piece has any jump (capture) moves available.
   */
  static getValidJumps(state: DraftGameState, pieceId: string): Array<{ row: number; col: number }> {
    const piece = state.pieces.find(p => p.id === pieceId);
    if (!piece) return [];

    const jumps: Array<{ row: number; col: number }> = [];
    const isPlayer1 = piece.playerId === state.playerIds[0];
    const forwardDir = isPlayer1 ? 1 : -1;
    const directions = piece.isKing
      ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
      : [[forwardDir, 1], [forwardDir, -1]];

    for (const [rDir, cDir] of directions) {
      const targetRow = piece.position.row + rDir * 2;
      const targetCol = piece.position.col + cDir * 2;
      if (this.isValidMove(state, piece.id, targetRow, targetCol)) {
        jumps.push({ row: targetRow, col: targetCol });
      }
    }

    return jumps;
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
    let justPromotedToKing = false;

    let nextPieces = state.pieces.map(p => {
      if (p.id !== pieceId) return p;
      
      const isPlayer1 = p.playerId === state.playerIds[0];
      const newlyKinged = !p.isKing && ((isPlayer1 && targetRow === 7) || (!isPlayer1 && targetRow === 0));
      if (newlyKinged) justPromotedToKing = true;

      return {
        ...p,
        position: { row: targetRow, col: targetCol },
        isKing: p.isKing || newlyKinged
      };
    });

    // If jump move (dist 2), remove the captured piece
    if (rowDiff === 2) {
      const midRow = (piece.position.row + targetRow) / 2;
      const midCol = (piece.position.col + targetCol) / 2;
      nextPieces = nextPieces.filter(p => !(p.position.row === midRow && p.position.col === midCol));
    }

    const updatedStateBeforeTurnSwitch: DraftGameState = {
      ...state,
      pieces: nextPieces
    };

    // Check multi-jump possibility: If a jump occurred and piece was NOT just crowned king, check if more jumps exist
    let keepTurnForMultiJump = false;
    if (rowDiff === 2 && !justPromotedToKing) {
      const extraJumps = this.getValidJumps(updatedStateBeforeTurnSwitch, pieceId);
      if (extraJumps.length > 0) {
        keepTurnForMultiJump = true;
      }
    }

    const nextActivePlayer = keepTurnForMultiJump
      ? state.activePlayerId
      : (state.activePlayerId === state.playerIds[0] ? state.playerIds[1] : state.playerIds[0]);

    return {
      ...updatedStateBeforeTurnSwitch,
      activePlayerId: nextActivePlayer,
      lastMoveMessage: rowDiff === 2 
        ? (keepTurnForMultiJump 
            ? `Multi-jump active! Player captured piece at row ${(piece.position.row + targetRow) / 2}, col ${(piece.position.col + targetCol) / 2}` 
            : `Player jumped and captured piece at row ${(piece.position.row + targetRow) / 2}, col ${(piece.position.col + targetCol) / 2}`)
        : `Player moved to row ${targetRow}, col ${targetCol}`
    };
  }
}
