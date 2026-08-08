/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types';
import { 
  isProtectedAccount, 
  PROTECTED_ACCOUNT_DEFAULTS, 
  getLevelDetailsFromXP, 
  getRankForLevel, 
  getXPThresholdForLevel 
} from './progressionService';

/**
 * Migration helper to ensure a user profile contains valid global progression fields.
 * Explicitly preserves `ojiF@vour` at Elite Ops Lv 42 at the data layer.
 * Is strictly idempotent.
 */
export function ensureProfileProgression(profile: UserProfile): UserProfile {
  // If profile is already properly initialized and not corrupted, return as-is (with protected check)
  const isProtected = isProtectedAccount(profile.username, profile.email);

  if (isProtected) {
    // Explicitly guarantee data-layer protection for ojiF@vour
    const safeLevel = Math.max(PROTECTED_ACCOUNT_DEFAULTS.level, profile.level || 42);
    const safeXP = Math.max(PROTECTED_ACCOUNT_DEFAULTS.xp, profile.xp || getXPThresholdForLevel(safeLevel));
    const safeRank = profile.rank && profile.rank !== 'Rookie' ? profile.rank : 'Elite Ops';

    return {
      ...profile,
      level: safeLevel,
      rank: safeRank,
      xp: safeXP,
      processedMatches: profile.processedMatches || []
    };
  }

  // For regular profiles that already have level, rank, and xp set
  if (
    profile.level !== undefined && 
    profile.level >= 1 && 
    profile.rank !== undefined && 
    profile.xp !== undefined
  ) {
    return {
      ...profile,
      processedMatches: profile.processedMatches || []
    };
  }

  // Migrate existing profiles based on legacy wins/losses if present, or initialize brand new user
  let initialXP = 0;
  if ((profile.wins || 0) > 0 || (profile.losses || 0) > 0) {
    initialXP = (profile.wins || 0) * 250 + (profile.losses || 0) * 50;
  }

  const levelDetails = getLevelDetailsFromXP(initialXP);
  const initialLevel = levelDetails.level;
  const initialRank = getRankForLevel(initialLevel).name;

  return {
    ...profile,
    xp: initialXP,
    level: initialLevel,
    rank: initialRank,
    processedMatches: profile.processedMatches || []
  };
}
