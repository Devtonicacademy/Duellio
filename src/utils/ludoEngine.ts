/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Server-Authoritative & Deterministic Official Ludo Game Engine
 * Strictly enforces official Ludo rules completely separated from UI rendering.
 */

export type PlayerColor = 'red' | 'blue' | 'green' | 'gold';
export type TokenStatus = 'home' | 'board' | 'finished';
export type MatchMode = '2-player' | '4-player';

export interface LudoTokenState {
  id: string;
  color: PlayerColor;
  position: number; // -1 = base yard, 0..51 = common track, 52..57 = home runway / center
  status: TokenStatus;
}

export interface TurnSnapshot {
  tokens: LudoTokenState[];
  activePlayerIndex: number;
}

export interface LegalMove {
  tokenId: string;
  fromPosition: number;
  toPosition: number;
  isLeavingBase: boolean;
  isCapture: boolean;
  isHomeFinish: boolean;
}

export interface LudoGameState {
  mode: MatchMode;
  players: PlayerColor[];
  tokens: LudoTokenState[];
  activePlayerIndex: number;
  currentDiceValue: number | null;
  secondDiceValue: number | null;
  consecutiveSixes: number;
  turnStartState: TurnSnapshot | null;
  gameStatus: 'setup' | 'rolling_for_start' | 'playing' | 'completed';
  winner: PlayerColor | 'team1' | 'team2' | null;
  logs: string[];
  startRolls: Record<PlayerColor, number>;
  startTiedPlayers: PlayerColor[];
}

// 15x15 Grid Path Coordinates
export const PATH_COORDINATES: Array<[number, number]> = [
  // Left arm going right from Red Start [6,0] to [6,5]
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Top arm going up from [5,6] to [0,6]
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Top arm top cross [0,7]
  [0, 7],
  // Top arm going down from Blue Start [0,8] to [5,8]
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Right arm going right from [6,9] to [6,14]
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Right arm right cross [7,14]
  [7, 14],
  // Right arm going left from Green Start [8,14] to [8,9]
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Bottom arm going down from [9,8] to [14,8]
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Bottom arm bottom cross [14,7]
  [14, 7],
  // Bottom arm going up from Yellow Start [14,6] to [9,6]
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Left arm going left from [8,5] to [8,0]
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Left arm left cross [7,0]
  [7, 0]
];

// Standard Ludo Safe Spaces: 4 Start Squares + 4 Star Squares
export const SAFE_COORDS: Array<[number, number]> = [
  [6, 0],  // Red Start
  [0, 8],  // Blue Start
  [8, 14], // Green Start
  [14, 6], // Yellow Start
  [8, 1],  // Red Star
  [1, 6],  // Blue Star
  [6, 13], // Green Star
  [13, 8]  // Yellow Star
];

export const START_INDEX_MAP: Record<PlayerColor, number> = {
  red: 0,
  blue: 13,
  green: 26,
  gold: 39
};

// Module 1: Board State Manager & Initializer
export function createInitialGameState(
  activeColors: PlayerColor[] = ['red', 'blue', 'green', 'gold'],
  mode: MatchMode = '2-player'
): LudoGameState {
  const initialTokens: LudoTokenState[] = [];

  activeColors.forEach(color => {
    for (let i = 1; i <= 4; i++) {
      initialTokens.push({
        id: `${color}_${i}`,
        color,
        position: -1,
        status: 'home'
      });
    }
  });

  return {
    mode,
    players: activeColors,
    tokens: initialTokens,
    activePlayerIndex: 0,
    currentDiceValue: null,
    secondDiceValue: null,
    consecutiveSixes: 0,
    turnStartState: null,
    gameStatus: 'playing',
    winner: null,
    logs: [`[ENGINE INIT] Official Ludo Game Engine initialized (${mode.toUpperCase()}) with players: ${activeColors.join(', ').toUpperCase()}`],
    startRolls: { red: 0, blue: 0, green: 0, gold: 0 },
    startTiedPlayers: []
  };
}

// Determine Team / Friendly Colors in 2-Player mode
export function getFriendlyColors(color: PlayerColor, mode: MatchMode): PlayerColor[] {
  if (mode === '2-player') {
    if (color === 'red' || color === 'gold') return ['red', 'gold'];
    return ['blue', 'green'];
  }
  return [color];
}

// Map token to 15x15 grid [row, col]
export function getTokenCell(token: LudoTokenState): [number, number] {
  if (token.status === 'home') {
    const idNum = token.id.split('_')[1];
    if (token.color === 'red') {
      if (idNum === '1') return [1, 1];
      if (idNum === '2') return [1, 3];
      if (idNum === '3') return [3, 1];
      return [3, 3];
    }
    if (token.color === 'blue') {
      if (idNum === '1') return [1, 10];
      if (idNum === '2') return [1, 12];
      if (idNum === '3') return [3, 10];
      return [3, 12];
    }
    if (token.color === 'green') {
      if (idNum === '1') return [10, 10];
      if (idNum === '2') return [10, 12];
      if (idNum === '3') return [12, 10];
      return [12, 12];
    }
    // Gold / Yellow
    if (idNum === '1') return [10, 1];
    if (idNum === '2') return [10, 3];
    if (idNum === '3') return [12, 1];
    return [12, 3];
  }

  if (token.status === 'finished') {
    if (token.color === 'red') return [7, 6];
    if (token.color === 'blue') return [6, 7];
    if (token.color === 'green') return [7, 8];
    return [8, 7];
  }

  const pos = token.position;

  if (token.color === 'red') {
    if (pos >= 52) {
      const redRunway: Array<[number, number]> = [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]];
      return redRunway[Math.min(pos - 52, 5)];
    }
    return PATH_COORDINATES[pos % 52];
  }

  if (token.color === 'blue') {
    if (pos >= 52) {
      const blueRunway: Array<[number, number]> = [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]];
      return blueRunway[Math.min(pos - 52, 5)];
    }
    return PATH_COORDINATES[(13 + pos) % 52];
  }

  if (token.color === 'green') {
    if (pos >= 52) {
      const greenRunway: Array<[number, number]> = [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]];
      return greenRunway[Math.min(pos - 52, 5)];
    }
    return PATH_COORDINATES[(26 + pos) % 52];
  }

  // Gold / Yellow
  if (pos >= 52) {
    const yellowRunway: Array<[number, number]> = [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]];
    return yellowRunway[Math.min(pos - 52, 5)];
  }
  return PATH_COORDINATES[(39 + pos) % 52];
}

// Module 2: Dice System
export function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// Module 3: Rule Validator & Legal Move Engine
export function getLegalMoves(state: LudoGameState, playerColor: PlayerColor, dieValue: number): LegalMove[] {
  if (state.gameStatus !== 'playing' || state.winner !== null) return [];

  const friendlyColors = getFriendlyColors(playerColor, state.mode);
  const targetTokens = state.tokens.filter(t => friendlyColors.includes(t.color));
  const legalMoves: LegalMove[] = [];

  targetTokens.forEach(token => {
    if (token.status === 'finished') return;

    if (token.status === 'home') {
      // Official Rule: Leaving base requires a roll of EXACTLY 6
      if (dieValue === 6) {
        legalMoves.push({
          tokenId: token.id,
          fromPosition: -1,
          toPosition: 0,
          isLeavingBase: true,
          isCapture: false,
          isHomeFinish: false
        });
      }
    } else {
      const targetPos = token.position + dieValue;
      
      // Official Rule: Exact finish required (max position 57)
      if (targetPos <= 57) {
        let isCap = false;

        // Check capture on common track (position < 52)
        if (targetPos < 52) {
          const testTokenState: LudoTokenState = { ...token, position: targetPos, status: 'board' };
          const targetCell = getTokenCell(testTokenState);
          const isSafe = SAFE_COORDS.some(([r, c]) => r === targetCell[0] && c === targetCell[1]);

          if (!isSafe) {
            const collidedToken = state.tokens.find(t => {
              if (t.id === token.id || friendlyColors.includes(t.color) || t.status !== 'board' || t.position >= 52) return false;
              const cell = getTokenCell(t);
              return cell[0] === targetCell[0] && cell[1] === targetCell[1];
            });

            if (collidedToken) {
              isCap = true;
            }
          }
        }

        legalMoves.push({
          tokenId: token.id,
          fromPosition: token.position,
          toPosition: targetPos,
          isLeavingBase: false,
          isCapture: isCap,
          isHomeFinish: targetPos === 57
        });
      }
    }
  });

  return legalMoves;
}

// Module 4: Turn Manager & Move Execution Engine
export function executeMove(state: LudoGameState, tokenId: string, dieValue: number): LudoGameState {
  const activeColor = state.players[state.activePlayerIndex];
  const legalMoves = getLegalMoves(state, activeColor, dieValue);
  const targetMove = legalMoves.find(m => m.tokenId === tokenId);

  if (!targetMove) {
    throw new Error(`[ILLEGAL MOVE] Token ${tokenId} cannot move with die value ${dieValue}`);
  }

  // Snapshot turn start state if this is the first roll of the turn
  let turnStartState = state.turnStartState;
  if (!turnStartState) {
    turnStartState = {
      tokens: JSON.parse(JSON.stringify(state.tokens)),
      activePlayerIndex: state.activePlayerIndex
    };
  }

  let capturedTokenId: string | null = null;
  const friendlyColors = getFriendlyColors(activeColor, state.mode);

  // Execute token movement
  const nextTokens = state.tokens.map(t => {
    if (t.id !== tokenId) return t;

    let nextPos = t.position;
    let nextStatus = t.status;

    if (t.status === 'home') {
      nextPos = 0;
      nextStatus = 'board' as const;
    } else {
      nextPos += dieValue;
      if (nextPos === 57) {
        nextStatus = 'finished' as const;
      }
    }

    return { ...t, position: nextPos, status: nextStatus };
  });

  // Resolve captures (Module 5: Capture Engine)
  const movedToken = nextTokens.find(t => t.id === tokenId)!;
  if (movedToken.status === 'board' && movedToken.position < 52) {
    const targetCell = getTokenCell(movedToken);
    const isSafe = SAFE_COORDS.some(([r, c]) => r === targetCell[0] && c === targetCell[1]);

    if (!isSafe) {
      nextTokens.forEach(t => {
        if (t.id === tokenId || friendlyColors.includes(t.color) || t.status !== 'board' || t.position >= 52) return;
        const cell = getTokenCell(t);
        if (cell[0] === targetCell[0] && cell[1] === targetCell[1]) {
          t.position = -1;
          t.status = 'home';
          capturedTokenId = t.id;
        }
      });
    }
  }

  // Module 6: Win Detection
  let winner: PlayerColor | 'team1' | 'team2' | null = null;
  if (state.mode === '2-player') {
    const team1Finished = nextTokens.filter(t => (t.color === 'red' || t.color === 'gold') && t.status === 'finished').length;
    const team2Finished = nextTokens.filter(t => (t.color === 'blue' || t.color === 'green') && t.status === 'finished').length;

    const red4 = nextTokens.filter(t => t.color === 'red' && t.status === 'finished').length === 4;
    const gold4 = nextTokens.filter(t => t.color === 'gold' && t.status === 'finished').length === 4;
    const blue4 = nextTokens.filter(t => t.color === 'blue' && t.status === 'finished').length === 4;
    const green4 = nextTokens.filter(t => t.color === 'green' && t.status === 'finished').length === 4;

    if (red4 || gold4 || team1Finished === 8) {
      winner = 'red';
    } else if (blue4 || green4 || team2Finished === 8) {
      winner = 'blue';
    }
  } else {
    const colorTokens = nextTokens.filter(t => t.color === activeColor);
    if (colorTokens.every(t => t.status === 'finished')) {
      winner = activeColor;
    }
  }

  const logs = [...state.logs];
  if (targetMove.isLeavingBase) {
    logs.unshift(`[MOVE] ${activeColor.toUpperCase()} released token ${tokenId.toUpperCase()} from base yard.`);
  } else {
    logs.unshift(`[MOVE] ${activeColor.toUpperCase()} moved token ${tokenId.toUpperCase()} to step ${targetMove.toPosition}.`);
  }

  if (capturedTokenId) {
    logs.unshift(`[CAPTURE] ${activeColor.toUpperCase()} captured token ${capturedTokenId.toUpperCase()}! Returned to base yard.`);
  }

  if (winner) {
    logs.unshift(`[VICTORY] ${String(winner).toUpperCase()} moved all required tokens home and won the match!`);
    return {
      ...state,
      tokens: nextTokens,
      gameStatus: 'completed',
      winner,
      currentDiceValue: null,
      turnStartState: null,
      logs
    };
  }

  // Official Rule: Rolling a 6 grants exactly 1 additional roll.
  // Note: Official rules do NOT award an extra roll for capturing.
  const getsExtraRoll = dieValue === 6;

  let nextPlayerIndex = state.activePlayerIndex;
  let nextConsecutiveSixes = state.consecutiveSixes;
  let nextTurnStartState = turnStartState;

  if (getsExtraRoll) {
    logs.unshift(`[EXTRA ROLL] Rolled a 6! ${activeColor.toUpperCase()} gets another roll.`);
  } else {
    nextPlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
    nextConsecutiveSixes = 0;
    nextTurnStartState = null; // Reset turn start snapshot for next player
  }

  return {
    ...state,
    tokens: nextTokens,
    activePlayerIndex: nextPlayerIndex,
    consecutiveSixes: nextConsecutiveSixes,
    turnStartState: nextTurnStartState,
    currentDiceValue: null,
    logs
  };
}

// Turn Controller for Dice Roll Resolution & Triple-Six Rollback
export function handleDiceRoll(state: LudoGameState, dieValue: number): LudoGameState {
  const activeColor = state.players[state.activePlayerIndex];
  const logs = [...state.logs];
  logs.unshift(`[DICE ROLL] ${activeColor.toUpperCase()} rolled a ${dieValue}.`);

  // Snapshot state at start of turn if not already saved
  let turnStartState = state.turnStartState;
  if (!turnStartState) {
    turnStartState = {
      tokens: JSON.parse(JSON.stringify(state.tokens)),
      activePlayerIndex: state.activePlayerIndex
    };
  }

  let consecutiveSixes = state.consecutiveSixes;

  if (dieValue === 6) {
    consecutiveSixes += 1;
    logs.unshift(`[SIXES METER] Consecutive 6s count: ${consecutiveSixes}`);

    // OFFICIAL RULE: Triple-Six (6 -> 6 -> 6) Rollback Penalty
    if (consecutiveSixes >= 3) {
      logs.unshift(`[TRIPLE SIX PENALTY] 3 consecutive 6s rolled! Forfeiting turn and undoing all movements performed during this turn.`);
      
      // Rollback to turn start state!
      const restoredTokens = JSON.parse(JSON.stringify(turnStartState.tokens));
      const nextPlayerIndex = (state.activePlayerIndex + 1) % state.players.length;

      return {
        ...state,
        tokens: restoredTokens,
        activePlayerIndex: nextPlayerIndex,
        currentDiceValue: null,
        consecutiveSixes: 0,
        turnStartState: null,
        logs
      };
    }
  }

  // Determine legal moves
  const legalMoves = getLegalMoves(state, activeColor, dieValue);

  if (legalMoves.length === 0) {
    logs.unshift(`[NO MOVES] No legal moves available for ${activeColor.toUpperCase()} with roll ${dieValue}.`);
    
    // If die is NOT 6, pass turn immediately
    let nextPlayerIndex = state.activePlayerIndex;
    let nextConsecutiveSixes = consecutiveSixes;
    let nextTurnStartState = turnStartState;

    if (dieValue !== 6) {
      nextPlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
      nextConsecutiveSixes = 0;
      nextTurnStartState = null;
    }

    return {
      ...state,
      currentDiceValue: dieValue,
      activePlayerIndex: nextPlayerIndex,
      consecutiveSixes: nextConsecutiveSixes,
      turnStartState: nextTurnStartState,
      logs
    };
  }

  return {
    ...state,
    currentDiceValue: dieValue,
    consecutiveSixes,
    turnStartState,
    logs
  };
}
