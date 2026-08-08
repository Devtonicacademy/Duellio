/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, GameResultPayload, ProgressionRewardResult } from '../types';

export interface RankDefinition {
  name: string;
  minLevel: number;
  maxLevel: number; // Use Infinity for the top tier
  color: string;
  badge: string;
}

export const RANKS: RankDefinition[] = [
  { name: 'Rookie', minLevel: 1, maxLevel: 4, color: '#38bdf8', badge: '🌱' },
  { name: 'Challenger', minLevel: 5, maxLevel: 9, color: '#34d399', badge: '⚡' },
  { name: 'Vanguard', minLevel: 10, maxLevel: 16, color: '#fbbf24', badge: '🛡️' },
  { name: 'Specialist', minLevel: 17, maxLevel: 24, color: '#f97316', badge: '🎯' },
  { name: 'Master', minLevel: 25, maxLevel: 32, color: '#a855f7', badge: '👑' },
  { name: 'Grandmaster', minLevel: 33, maxLevel: 40, color: '#ec4899', badge: '🔥' },
  { name: 'Elite Ops', minLevel: 41, maxLevel: 50, color: '#8b5cf6', badge: '⚔️' },
  { name: 'Legend', minLevel: 51, maxLevel: 65, color: '#ef4444', badge: '🌟' },
  { name: 'Apex Champion', minLevel: 66, maxLevel: Infinity, color: '#eab308', badge: '💎' }
];

/**
 * Calculates the total cumulative XP required to reach a specific level.
 * Level 1 = 0 XP.
 * For Level L > 1: Cumulative sum of (150 + 50 * k^1.35) for k = 1 to L - 1.
 */
export function getXPThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  let totalXP = 0;
  for (let k = 1; k < level; k++) {
    totalXP += Math.floor(150 + 50 * Math.pow(k, 1.35));
  }
  return totalXP;
}

/**
 * Returns the XP required to progress from `level` to `level + 1`.
 */
export function getXPForNextLevelStep(level: number): number {
  return Math.floor(150 + 50 * Math.pow(Math.max(1, level), 1.35));
}

/**
 * Resolves level, progress within current level, and target XP for next level step from total XP.
 */
export function getLevelDetailsFromXP(totalXP: number): {
  level: number;
  levelStartXP: number;
  nextLevelXPRequirement: number;
  currentLevelProgressXP: number;
  progressPercent: number;
} {
  const safeXP = Math.max(0, totalXP || 0);
  let level = 1;

  while (getXPThresholdForLevel(level + 1) <= safeXP && level < 1000) {
    level++;
  }

  const levelStartXP = getXPThresholdForLevel(level);
  const nextLevelTotalXP = getXPThresholdForLevel(level + 1);
  const nextLevelXPRequirement = nextLevelTotalXP - levelStartXP;
  const currentLevelProgressXP = safeXP - levelStartXP;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((currentLevelProgressXP / nextLevelXPRequirement) * 100)));

  return {
    level,
    levelStartXP,
    nextLevelXPRequirement,
    currentLevelProgressXP,
    progressPercent
  };
}

/**
 * Finds the rank definition for a given level.
 */
export function getRankForLevel(level: number): RankDefinition {
  const safeLevel = Math.max(1, level || 1);
  const found = RANKS.find(r => safeLevel >= r.minLevel && safeLevel <= r.maxLevel);
  return found || RANKS[RANKS.length - 1];
}

// Registry for game-specific XP calculation rules
type GameXPRuleCalculator = (payload: GameResultPayload) => number;
const gameXPRuleRegistry: Map<string, GameXPRuleCalculator> = new Map();

/**
 * Register a game's XP reward calculation rules.
 * Enables clean, game-agnostic progression plugin integration.
 */
export function registerGameProgressionRules(gameId: string, ruleCalculator: GameXPRuleCalculator): void {
  gameXPRuleRegistry.set(gameId.toLowerCase(), ruleCalculator);
}

// Default game XP rule implementations
const defaultLudoXPRule: GameXPRuleCalculator = (payload) => {
  let baseXP = 50; // participation award for completing a match
  if (payload.outcome === 'win' || payload.placement === 1) {
    baseXP += 200; // 250 XP total for win
  } else if (payload.placement === 2) {
    baseXP += 70; // 120 XP total for 2nd place
  } else if (payload.placement === 3) {
    baseXP += 30; // 80 XP total for 3rd place
  }

  if (payload.entryFee && payload.entryFee > 0) baseXP += 40;
  if (payload.botDifficulty === 'hard') baseXP += 25;
  return baseXP;
};

const defaultChessXPRule: GameXPRuleCalculator = (payload) => {
  let baseXP = 60; // participation base
  if (payload.outcome === 'win') {
    baseXP += 240; // 300 XP total
  } else if (payload.outcome === 'draw') {
    baseXP += 60; // 120 XP total
  }

  if (payload.entryFee && payload.entryFee > 0) baseXP += 40;
  if (payload.botDifficulty === 'hard') baseXP += 25;
  return baseXP;
};

const defaultWhotXPRule: GameXPRuleCalculator = (payload) => {
  let baseXP = 50;
  if (payload.outcome === 'win') baseXP += 200;
  if (payload.entryFee && payload.entryFee > 0) baseXP += 30;
  return baseXP;
};

const defaultDraftXPRule: GameXPRuleCalculator = (payload) => {
  let baseXP = 50;
  if (payload.outcome === 'win') baseXP += 200;
  if (payload.entryFee && payload.entryFee > 0) baseXP += 30;
  return baseXP;
};

const defaultTicTacToeXPRule: GameXPRuleCalculator = (payload) => {
  let baseXP = 30;
  if (payload.outcome === 'win') baseXP += 120;
  else if (payload.outcome === 'draw') baseXP += 45;
  if (payload.entryFee && payload.entryFee > 0) baseXP += 20;
  return baseXP;
};

// Register defaults
registerGameProgressionRules('ludo', defaultLudoXPRule);
registerGameProgressionRules('chess', defaultChessXPRule);
registerGameProgressionRules('whot', defaultWhotXPRule);
registerGameProgressionRules('draft', defaultDraftXPRule);
registerGameProgressionRules('tictactoe', defaultTicTacToeXPRule);

/**
 * Calculates XP reward for any game payload, invoking registered game rules or falling back to standard formula.
 */
export function calculateGameXP(payload: GameResultPayload): number {
  const gameKey = (payload.gameId || '').toLowerCase().trim();
  const customRule = gameXPRuleRegistry.get(gameKey);
  if (customRule) {
    return Math.max(10, customRule(payload));
  }

  // Fallback for future games
  let baseXP = 50;
  if (payload.outcome === 'win') baseXP += 150;
  else if (payload.outcome === 'draw') baseXP += 50;
  if (payload.entryFee && payload.entryFee > 0) baseXP += 25;
  return baseXP;
}

/**
 * Protected account helper for `ojiF@vour`.
 * Ensures ojiF@vour starts at Level 42 and Elite Ops rank at the data layer.
 */
export function isProtectedAccount(username?: string, email?: string): boolean {
  const u = (username || '').toLowerCase().trim();
  const e = (email || '').toLowerCase().trim();
  return (
    u === 'ojif@vour' ||
    u === 'ojifavour' ||
    u === 'oji favour' ||
    e.includes('ojif@vour') ||
    e.includes('ojifavour')
  );
}

export const PROTECTED_ACCOUNT_DEFAULTS = {
  rank: 'Elite Ops',
  level: 42,
  xp: getXPThresholdForLevel(42) // ~205,000 XP
};

/**
 * Centralized, server-authoritative game result progression processor.
 * Guarantees duplicate protection via `processedMatches` tracking.
 */
export function processGameOutcome(
  currentProfile: UserProfile,
  payload: GameResultPayload
): { updatedProfile: UserProfile; result: ProgressionRewardResult } {
  const processed = currentProfile.processedMatches || [];
  const sessionId = payload.sessionId || `session_${Date.now()}`;

  // Idempotency check: prevent duplicate reward processing
  if (processed.includes(sessionId)) {
    const details = getLevelDetailsFromXP(currentProfile.xp || 0);
    const currentRank = currentProfile.rank || getRankForLevel(details.level).name;
    return {
      updatedProfile: currentProfile,
      result: {
        xpGained: 0,
        oldXP: currentProfile.xp || 0,
        newXP: currentProfile.xp || 0,
        oldLevel: details.level,
        newLevel: details.level,
        oldRank: currentRank,
        newRank: currentRank,
        isLevelUp: false,
        isRankUp: false,
        currentLevelXP: details.currentLevelProgressXP,
        nextLevelXP: details.nextLevelXPRequirement,
        alreadyProcessed: true
      }
    };
  }

  // 1. Calculate XP reward based on validated outcome payload
  const xpGained = calculateGameXP(payload);
  const oldXP = currentProfile.xp !== undefined ? currentProfile.xp : 0;
  const oldLevel = currentProfile.level !== undefined ? currentProfile.level : 1;
  const oldRank = currentProfile.rank || getRankForLevel(oldLevel).name;

  // 2. Compute new global totals
  const newXP = oldXP + xpGained;
  const newLevelDetails = getLevelDetailsFromXP(newXP);
  let newLevel = newLevelDetails.level;
  let newRankObj = getRankForLevel(newLevel);
  let newRank = newRankObj.name;

  // Preserve protected account baseline if applicable
  if (isProtectedAccount(currentProfile.username, currentProfile.email)) {
    if (newLevel < 42) newLevel = 42;
    if (oldLevel < 42 || !currentProfile.rank) {
      newRank = 'Elite Ops';
    }
  }

  const isLevelUp = newLevel > oldLevel;
  const isRankUp = newRank !== oldRank && !isProtectedAccount(currentProfile.username, currentProfile.email);

  const updatedProfile: UserProfile = {
    ...currentProfile,
    xp: newXP,
    level: newLevel,
    rank: newRank,
    processedMatches: [...processed, sessionId]
  };

  const result: ProgressionRewardResult = {
    xpGained,
    oldXP,
    newXP,
    oldLevel,
    newLevel,
    oldRank,
    newRank,
    isLevelUp,
    isRankUp,
    currentLevelXP: newLevelDetails.currentLevelProgressXP,
    nextLevelXP: newLevelDetails.nextLevelXPRequirement,
    alreadyProcessed: false
  };

  return { updatedProfile, result };
}
