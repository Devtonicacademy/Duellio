import { TicTacToeGameState } from '../types';

export class TicTacToeLogicService {
  static WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  static initializeBoard(sessionId: string, player1Id: string, player2Id: string): TicTacToeGameState {
    return {
      sessionId,
      playerIds: [player1Id, player2Id],
      board: Array(9).fill(null),
      activePlayerId: player1Id, // Player 1 ('X') goes first
      status: 'playing',
      turnTimer: 30
    };
  }

  static checkWinner(board: Array<'X' | 'O' | null>): { winner: 'X' | 'O' | 'draw' | null; line?: number[] } {
    for (const line of this.WINNING_LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }

    const isFull = board.every(cell => cell !== null);
    if (isFull) {
      return { winner: 'draw' };
    }

    return { winner: null };
  }

  static isValidMove(board: Array<'X' | 'O' | null>, index: number): boolean {
    if (index < 0 || index > 8) return false;
    return board[index] === null;
  }

  static isPlayer1(playerId: string, state: TicTacToeGameState): boolean {
    if (!playerId || !state.playerIds || state.playerIds.length === 0) return true;
    return (
      playerId === state.playerIds[0] ||
      playerId === 'host' ||
      playerId === 'player-user'
    );
  }

  static executeMove(state: TicTacToeGameState, index: number): TicTacToeGameState {
    if (state.status !== 'playing' || !this.isValidMove(state.board, index)) {
      return state;
    }

    const isP1 = this.isPlayer1(state.activePlayerId, state);
    const marker: 'X' | 'O' = isP1 ? 'X' : 'O';

    const newBoard = [...state.board];
    newBoard[index] = marker;

    const { winner, line } = this.checkWinner(newBoard);

    if (winner) {
      const winnerId = winner === 'draw' ? 'draw' : (winner === 'X' ? state.playerIds[0] : (state.playerIds[1] || 'guest'));
      return {
        ...state,
        board: newBoard,
        status: 'completed',
        winnerId,
        winningLine: line,
        lastMoveMessage: winner === 'draw' 
          ? 'Match ended in a tactical Draw!' 
          : `Player (${marker}) secured victory at cells [${line?.map(i => i + 1).join(', ')}]!`
      };
    }

    const nextActivePlayer = isP1 ? (state.playerIds[1] || 'guest') : (state.playerIds[0] || 'host');

    return {
      ...state,
      board: newBoard,
      activePlayerId: nextActivePlayer,
      lastMoveMessage: `Player (${marker}) claimed cell position ${index + 1}`
    };
  }

  static getBotMove(
    board: Array<'X' | 'O' | null>,
    botMarker: 'X' | 'O',
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): number {
    const availableIndices = board
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (availableIndices.length === 0) return -1;

    const opponentMarker: 'X' | 'O' = botMarker === 'X' ? 'O' : 'X';

    // Easy mode: Random moves
    if (difficulty === 'easy') {
      return availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }

    // Check if bot can win immediately in 1 move
    for (const idx of availableIndices) {
      const tempBoard = [...board];
      tempBoard[idx] = botMarker;
      if (this.checkWinner(tempBoard).winner === botMarker) {
        return idx;
      }
    }

    // Check if bot needs to block opponent's immediate winning move
    for (const idx of availableIndices) {
      const tempBoard = [...board];
      tempBoard[idx] = opponentMarker;
      if (this.checkWinner(tempBoard).winner === opponentMarker) {
        return idx;
      }
    }

    // Medium mode: Strategic priority (Center -> Corners -> Edges) with slight randomness
    if (difficulty === 'medium') {
      if (board[4] === null && Math.random() > 0.2) return 4;

      const corners = [0, 2, 6, 8].filter(i => board[i] === null);
      if (corners.length > 0 && Math.random() > 0.3) {
        return corners[Math.floor(Math.random() * corners.length)];
      }

      return availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }

    // Hard mode: Minimax Algorithm for unbeatable AI
    let bestScore = -Infinity;
    let bestMove = availableIndices[0];

    for (const idx of availableIndices) {
      const tempBoard = [...board];
      tempBoard[idx] = botMarker;
      const score = this.minimax(tempBoard, 0, false, botMarker, opponentMarker);
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }

    return bestMove;
  }

  private static minimax(
    board: Array<'X' | 'O' | null>,
    depth: number,
    isMaximizing: boolean,
    botMarker: 'X' | 'O',
    opponentMarker: 'X' | 'O'
  ): number {
    const { winner } = this.checkWinner(board);
    if (winner === botMarker) return 10 - depth;
    if (winner === opponentMarker) return depth - 10;
    if (winner === 'draw') return 0;

    const availableIndices = board
      .map((val, idx) => (val === null ? idx : null))
      .filter((val): val is number => val !== null);

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const idx of availableIndices) {
        board[idx] = botMarker;
        const score = this.minimax(board, depth + 1, false, botMarker, opponentMarker);
        board[idx] = null;
        bestScore = Math.max(score, bestScore);
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (const idx of availableIndices) {
        board[idx] = opponentMarker;
        const score = this.minimax(board, depth + 1, true, botMarker, opponentMarker);
        board[idx] = null;
        bestScore = Math.min(score, bestScore);
      }
      return bestScore;
    }
  }
}
