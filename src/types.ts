/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  avatar: string;
  wins: number;
  losses: number;
  draws: number;
  coins: number;
  status: 'online' | 'offline' | 'in-game';
  favorites?: string[];
  archived?: string[];
  deactivated?: boolean;
}

export interface UserReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: 'toxicity' | 'cheating' | 'spam' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'action_taken';
  timestamp: string;
}


export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isChallenge?: boolean;
  challengeId?: string;
  gameType?: 'Chess' | 'Ludo' | 'Whot' | 'Draft' | 'TicTacToe' | 'Stickman';
  entryFee?: number;
  challengeStatus?: 'pending' | 'accepted' | 'declined';
}

export interface MatchChallenge {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  gameType: 'Whot' | 'Ludo' | 'Chess' | 'Draft' | 'TicTacToe' | 'Stickman';
  entryFee: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  timestamp: string;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  opponentType?: 'bot' | 'player';
  rewardMultiplier?: number;
}

export interface WalletTransaction {
  id: string;
  userId?: string;
  type: 'deposit' | 'withdrawal' | 'credit' | 'debit' | 'stake_lock' | 'stake_refund' | 'win_payout';
  amount: number;
  description: string;
  timestamp: string;
  status?: 'pending' | 'completed' | 'failed' | 'reversed';
  referenceId?: string; // e.g. Match ID, or Payment Gateway Ref
  idempotencyKey?: string; // to prevent duplicate processing
}

export interface EndpointSpec {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS';
  path: string;
  description: string;
  requestPayload?: string;
  responsePayload?: string;
}

export interface WhotCard {
  id: string;
  suit: 'Circles' | 'Triangles' | 'Crosses' | 'Stars' | 'Squares' | 'Whot';
  value: number; // 1-14, or 20
}

export interface WhotGameState {
  sessionId: string;
  playerIds: string[];
  playerHands: Record<string, WhotCard[]>;
  deckCount: number;
  discardPile: WhotCard[];
  activeSuit: 'Circles' | 'Triangles' | 'Crosses' | 'Stars' | 'Squares';
  activePlayerId: string;
  status: 'playing' | 'completed';
  winnerId?: string;
  turnTimer: number;
  penaltyCount: number; // Accumulates if "Pick Two" (2) or "Pick Three" (5) are played
  lastActionMessage: string;
  whotClaimedSuit?: 'Circles' | 'Triangles' | 'Crosses' | 'Stars' | 'Squares';
}

export interface BlueprintDetail {
  title: string;
  summary: string;
  technicalDetails: string[];
  endpoints: EndpointSpec[];
}

export interface RoadmapPhase {
  id: number;
  title: string;
  tagline: string;
  status: 'ready_to_build' | 'planned' | 'draft';
  description: string;
  blueprint: BlueprintDetail;
  checklist: string[];
}

export interface DraftPiece {
  id: string;
  playerId: string;
  isKing: boolean;
  position: { row: number; col: number }; // 0-7 for an 8x8 board
}

export interface DraftGameState {
  sessionId: string;
  playerIds: string[]; // typically 2 players
  pieces: DraftPiece[];
  activePlayerId: string;
  status: 'playing' | 'completed';
  winnerId?: string;
  turnTimer: number;
  lastMoveMessage?: string;
}

export interface TicTacToeGameState {
  sessionId: string;
  playerIds: string[];
  board: Array<'X' | 'O' | null>;
  activePlayerId: string;
  status: 'playing' | 'completed';
  winnerId?: string | 'draw';
  winningLine?: number[];
  turnTimer: number;
  lastMoveMessage?: string;
}

