/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type Color = 'w' | 'b';

export interface ChessPiece {
  type: PieceType;
  color: Color;
}

export type BoardGrid = Array<Array<ChessPiece | null>>;

export interface CastlingRights {
  wK: boolean; // White kingside
  wQ: boolean; // White queenside
  bK: boolean; // Black kingside
  bQ: boolean; // Black queenside
}

export const INITIAL_CASTLING_RIGHTS: CastlingRights = {
  wK: true,
  wQ: true,
  bK: true,
  bQ: true
};

export const INITIAL_BOARD: BoardGrid = [
  [
    { type: 'r', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'q', color: 'b' },
    { type: 'k', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'r', color: 'b' }
  ],
  [
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' },
    { type: 'p', color: 'b' }
  ],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'p', color: 'w' }
  ],
  [
    { type: 'r', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'q', color: 'w' },
    { type: 'k', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'r', color: 'w' }
  ]
];

export function normalizeBoard(boardData: any): BoardGrid {
  if (!boardData) return JSON.parse(JSON.stringify(INITIAL_BOARD));
  if (Array.isArray(boardData)) {
    if (boardData.length > 0 && Array.isArray(boardData[0])) {
      return boardData;
    }
  }
  if (typeof boardData === 'object') {
    const grid: BoardGrid = [];
    for (let i = 0; i < 8; i++) {
      const row = boardData[i] || boardData[i.toString()] || [];
      grid.push(Array.isArray(row) ? row : []);
    }
    return grid;
  }
  return JSON.parse(JSON.stringify(INITIAL_BOARD));
}

export class ChessRulesService {
  static normalizeBoard = normalizeBoard;

  static initializeBoard(sessionId: string, hostId: string = 'host', guestId: string = 'guest') {
    return {
      sessionId,
      board: JSON.parse(JSON.stringify(INITIAL_BOARD)),
      activeColor: 'w',
      castlingRights: { ...INITIAL_CASTLING_RIGHTS },
      enPassantTarget: null,
      status: 'playing',
      playerIds: [hostId, guestId]
    };
  }

  // Verify path between from and to is empty (excluding endpoints)
  static isPathClear(board: BoardGrid, fromR: number, fromC: number, toR: number, toC: number): boolean {
    const rStep = Math.sign(toR - fromR);
    const cStep = Math.sign(toC - fromC);

    let currR = fromR + rStep;
    let currC = fromC + cStep;

    while (currR !== toR || currC !== toC) {
      if (board[currR][currC] !== null) {
        return false; // Obstructed
      }
      currR += rStep;
      currC += cStep;
    }

    return true;
  }

  // Check if target square is attacked by enemy pieces
  static isSquareAttacked(board: BoardGrid, targetR: number, targetC: number, attackerColor: Color): boolean {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === attackerColor) {
          if (this.canPieceAttackSquare(board, r, c, targetR, targetC, piece)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Raw attack vector check (ignores self-check protection)
  static canPieceAttackSquare(
    board: BoardGrid,
    fromR: number,
    fromC: number,
    toR: number,
    toC: number,
    piece: ChessPiece
  ): boolean {
    const rowDiff = Math.abs(toR - fromR);
    const colDiff = Math.abs(toC - fromC);

    if (fromR === toR && fromC === toC) return false;

    if (piece.type === 'p') {
      // Pawn attacks diagonally 1 square forward
      const forwardDir = piece.color === 'w' ? -1 : 1;
      return toR - fromR === forwardDir && colDiff === 1;
    }

    if (piece.type === 'n') {
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    if (piece.type === 'b') {
      return rowDiff === colDiff && this.isPathClear(board, fromR, fromC, toR, toC);
    }

    if (piece.type === 'r') {
      return (rowDiff === 0 || colDiff === 0) && this.isPathClear(board, fromR, fromC, toR, toC);
    }

    if (piece.type === 'q') {
      return (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) && this.isPathClear(board, fromR, fromC, toR, toC);
    }

    if (piece.type === 'k') {
      return rowDiff <= 1 && colDiff <= 1;
    }

    return false;
  }

  // Find King location for given color
  static findKing(board: BoardGrid, color: Color): [number, number] | null {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return [r, c];
        }
      }
    }
    return null;
  }

  // Check if King of given color is under check
  static isKingInCheck(board: BoardGrid, color: Color): boolean {
    const kingPos = this.findKing(board, color);
    if (!kingPos) return false;
    const enemyColor: Color = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(board, kingPos[0], kingPos[1], enemyColor);
  }

  // Pseudo-legal move validation (vectors, collisions, castling & en passant)
  static canPiecePseudoMove(
    board: BoardGrid,
    fromR: number,
    fromC: number,
    toR: number,
    toC: number,
    castlingRights: CastlingRights = INITIAL_CASTLING_RIGHTS,
    enPassantTarget: [number, number] | null = null
  ): boolean {
    const piece = board[fromR][fromC];
    if (!piece) return false;

    const targetPiece = board[toR][toC];
    if (targetPiece && targetPiece.color === piece.color) return false; // Cannot capture own piece

    const rowDiff = Math.abs(toR - fromR);
    const colDiff = Math.abs(toC - fromC);

    if (piece.type === 'p') {
      const forwardDir = piece.color === 'w' ? -1 : 1;
      const startRow = piece.color === 'w' ? 6 : 1;

      // 1-step forward
      if (toC === fromC && toR - fromR === forwardDir && targetPiece === null) {
        return true;
      }

      // 2-step forward from starting row
      if (fromR === startRow && toC === fromC && toR - fromR === forwardDir * 2 && targetPiece === null) {
        const midR = fromR + forwardDir;
        if (board[midR][fromC] === null) return true;
      }

      // Standard diagonal capture
      if (toR - fromR === forwardDir && colDiff === 1 && targetPiece !== null && targetPiece.color !== piece.color) {
        return true;
      }

      // En Passant capture
      if (
        enPassantTarget &&
        toR === enPassantTarget[0] &&
        toC === enPassantTarget[1] &&
        toR - fromR === forwardDir &&
        colDiff === 1
      ) {
        return true;
      }

      return false;
    }

    if (piece.type === 'n') {
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    if (piece.type === 'b') {
      return rowDiff === colDiff && this.isPathClear(board, fromR, fromC, toR, toC);
    }

    if (piece.type === 'r') {
      return (rowDiff === 0 || colDiff === 0) && this.isPathClear(board, fromR, fromC, toR, toC);
    }

    if (piece.type === 'q') {
      return (rowDiff === colDiff || rowDiff === 0 || colDiff === 0) && this.isPathClear(board, fromR, fromC, toR, toC);
    }

    if (piece.type === 'k') {
      // 1-step move
      if (rowDiff <= 1 && colDiff <= 1) return true;

      // Castling rules
      const enemyColor: Color = piece.color === 'w' ? 'b' : 'w';

      // Cannot castle if King is currently in check
      if (this.isKingInCheck(board, piece.color)) return false;

      // White Kingside Castling (e1 -> g1)
      if (piece.color === 'w' && fromR === 7 && fromC === 4 && toR === 7 && toC === 6 && castlingRights.wK) {
        if (board[7][5] === null && board[7][6] === null) {
          if (!this.isSquareAttacked(board, 7, 5, enemyColor) && !this.isSquareAttacked(board, 7, 6, enemyColor)) {
            return true;
          }
        }
      }

      // White Queenside Castling (e1 -> c1)
      if (piece.color === 'w' && fromR === 7 && fromC === 4 && toR === 7 && toC === 2 && castlingRights.wQ) {
        if (board[7][3] === null && board[7][2] === null && board[7][1] === null) {
          if (!this.isSquareAttacked(board, 7, 3, enemyColor) && !this.isSquareAttacked(board, 7, 2, enemyColor)) {
            return true;
          }
        }
      }

      // Black Kingside Castling (e8 -> g8)
      if (piece.color === 'b' && fromR === 0 && fromC === 4 && toR === 0 && toC === 6 && castlingRights.bK) {
        if (board[0][5] === null && board[0][6] === null) {
          if (!this.isSquareAttacked(board, 0, 5, enemyColor) && !this.isSquareAttacked(board, 0, 6, enemyColor)) {
            return true;
          }
        }
      }

      // Black Queenside Castling (e8 -> c8)
      if (piece.color === 'b' && fromR === 0 && fromC === 4 && toR === 0 && toC === 2 && castlingRights.bQ) {
        if (board[0][3] === null && board[0][2] === null && board[0][1] === null) {
          if (!this.isSquareAttacked(board, 0, 3, enemyColor) && !this.isSquareAttacked(board, 0, 2, enemyColor)) {
            return true;
          }
        }
      }

      return false;
    }

    return false;
  }

  // Full FIDE legal move validation (filters moves that leave King in check)
  static isMoveLegal(
    board: BoardGrid,
    fromR: number,
    fromC: number,
    toR: number,
    toC: number,
    castlingRights: CastlingRights = INITIAL_CASTLING_RIGHTS,
    enPassantTarget: [number, number] | null = null
  ): boolean {
    const piece = board[fromR][fromC];
    if (!piece) return false;

    // 1. Check basic movement rules & collisions
    if (!this.canPiecePseudoMove(board, fromR, fromC, toR, toC, castlingRights, enPassantTarget)) {
      return false;
    }

    // 2. Simulate move on temp board copy to check self-check
    const tempBoard = board.map(row => [...row]);
    tempBoard[toR][toC] = piece;
    tempBoard[fromR][fromC] = null;

    // En Passant capture removal
    if (
      piece.type === 'p' &&
      enPassantTarget &&
      toR === enPassantTarget[0] &&
      toC === enPassantTarget[1]
    ) {
      const pawnRowToRemove = piece.color === 'w' ? toR + 1 : toR - 1;
      tempBoard[pawnRowToRemove][toC] = null;
    }

    // Castling rook move simulation
    if (piece.type === 'k' && Math.abs(toC - fromC) === 2) {
      if (toC === 6) { // Kingside
        const rook = tempBoard[fromR][7];
        tempBoard[fromR][5] = rook;
        tempBoard[fromR][7] = null;
      } else if (toC === 2) { // Queenside
        const rook = tempBoard[fromR][0];
        tempBoard[fromR][3] = rook;
        tempBoard[fromR][0] = null;
      }
    }

    // 3. Verify player's own King is NOT in check
    if (this.isKingInCheck(tempBoard, piece.color)) {
      return false; // Leaves King exposed to check!
    }

    return true;
  }

  // Get all valid legal destination tiles for piece at [r, c]
  static getLegalMovesForPiece(
    board: BoardGrid,
    fromR: number,
    fromC: number,
    castlingRights: CastlingRights = INITIAL_CASTLING_RIGHTS,
    enPassantTarget: [number, number] | null = null
  ): Array<[number, number]> {
    const piece = board[fromR][fromC];
    if (!piece) return [];

    const legalDestinations: Array<[number, number]> = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.isMoveLegal(board, fromR, fromC, r, c, castlingRights, enPassantTarget)) {
          legalDestinations.push([r, c]);
        }
      }
    }

    return legalDestinations;
  }

  // Get all legal moves for a given color
  static getAllLegalMoves(
    board: BoardGrid,
    color: Color,
    castlingRights: CastlingRights = INITIAL_CASTLING_RIGHTS,
    enPassantTarget: [number, number] | null = null
  ): Array<{ from: [number, number]; to: [number, number] }> {
    const allMoves: Array<{ from: [number, number]; to: [number, number] }> = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === color) {
          const dests = this.getLegalMovesForPiece(board, r, c, castlingRights, enPassantTarget);
          dests.forEach(to => {
            allMoves.push({ from: [r, c], to });
          });
        }
      }
    }

    return allMoves;
  }

  // Evaluate game status (playing, white_won, black_won, draw/stalemate)
  static getGameStateOutcome(
    board: BoardGrid,
    activeColor: Color,
    castlingRights: CastlingRights = INITIAL_CASTLING_RIGHTS,
    enPassantTarget: [number, number] | null = null
  ): 'playing' | 'checkmate' | 'stalemate' {
    const legalMoves = this.getAllLegalMoves(board, activeColor, castlingRights, enPassantTarget);

    if (legalMoves.length === 0) {
      const inCheck = this.isKingInCheck(board, activeColor);
      return inCheck ? 'checkmate' : 'stalemate';
    }

    return 'playing';
  }
}
