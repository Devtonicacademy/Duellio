/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, GameResultPayload } from '../types';
import { 
  getXPThresholdForLevel, 
  getLevelDetailsFromXP, 
  getRankForLevel, 
  processGameOutcome, 
  registerGameProgressionRules,
  calculateGameXP,
  isProtectedAccount
} from './progressionService';
import { ensureProfileProgression } from './progressionMigration';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ ASSERTION FAILED: ${message}`);
  }
}

console.log('🧪 RUNNING UNIVERSAL PROGRESSION SYSTEM TESTS...\n');

// 1. TEST: New User Initialization
console.log('--- TEST 1: NEW USER INITIALIZATION ---');
const rawNewUser: UserProfile = {
  uid: 'user_test_new',
  username: 'NewGamer99',
  email: 'newgamer@example.com',
  avatar: 'https://example.com/avatar.png',
  wins: 0,
  losses: 0,
  draws: 0,
  coins: 1000,
  status: 'online'
};

const newUser = ensureProfileProgression(rawNewUser);
assert(newUser.level === 1, `New user must start at Level 1 (got ${newUser.level})`);
assert(newUser.xp === 0, `New user must start at 0 XP (got ${newUser.xp})`);
assert(newUser.rank === 'Rookie', `New user must start at Rookie rank (got ${newUser.rank})`);
assert(Array.isArray(newUser.processedMatches) && newUser.processedMatches.length === 0, 'Processed matches must be empty array');
console.log('✅ PASS: New User initializes to Level 1, 0 XP, Rookie rank.\n');

// 2. TEST: Protected Account (ojiF@vour) Preservation
console.log('--- TEST 2: PROTECTED ACCOUNT DATA-LAYER MIGRATION ---');
const rawOjiUser: UserProfile = {
  uid: 'user_ojifavour_id',
  username: 'ojiF@vour',
  email: 'ojifavour@duellio.app',
  avatar: 'https://example.com/ojifavour.png',
  wins: 150,
  losses: 12,
  draws: 5,
  coins: 50000,
  status: 'online'
};

const protectedUser = ensureProfileProgression(rawOjiUser);
assert(protectedUser.level === 42, `ojiF@vour must remain Level 42 (got ${protectedUser.level})`);
assert(protectedUser.rank === 'Elite Ops', `ojiF@vour must remain Elite Ops rank (got ${protectedUser.rank})`);
assert(protectedUser.xp! >= getXPThresholdForLevel(42), `ojiF@vour XP must match or exceed Level 42 threshold`);

console.log(`Protected user state: Username="${protectedUser.username}" | Rank="${protectedUser.rank}" | Level=${protectedUser.level} | XP=${protectedUser.xp}`);
assert(isProtectedAccount(protectedUser.username, protectedUser.email), 'isProtectedAccount must return true for ojiF@vour');
console.log('✅ PASS: ojiF@vour explicitly preserved at Elite Ops Lv 42 at the data layer.\n');

// 3. TEST: Scalable XP Curve & Threshold Resolution
console.log('--- TEST 3: XP CURVE & THRESHOLD RESOLUTION ---');
const thresholdLv1 = getXPThresholdForLevel(1);
const thresholdLv2 = getXPThresholdForLevel(2);
const thresholdLv5 = getXPThresholdForLevel(5);
const thresholdLv42 = getXPThresholdForLevel(42);

assert(thresholdLv1 === 0, 'Level 1 threshold must be 0 XP');
assert(thresholdLv2 > 0, `Level 2 threshold must be > 0 (got ${thresholdLv2})`);
assert(thresholdLv5 > thresholdLv2, 'Level 5 threshold must exceed Level 2 threshold');
assert(thresholdLv42 > thresholdLv5, 'Level 42 threshold must exceed Level 5 threshold');

const details500XP = getLevelDetailsFromXP(500);
assert(details500XP.level >= 2, `500 XP should yield Level >= 2 (got ${details500XP.level})`);
console.log(`500 XP yields Level ${details500XP.level} (${details500XP.currentLevelProgressXP}/${details500XP.nextLevelXPRequirement} XP within level)`);
console.log('✅ PASS: Scalable XP curve computes monotonically increasing level thresholds.\n');

// 4. TEST: Game-Agnostic XP Progression & Level-Up
console.log('--- TEST 4: GAME-AGNOSTIC XP AWARD & LEVEL UP ---');
let currentPlayer = ensureProfileProgression(rawNewUser);

const ludoMatch1: GameResultPayload = {
  gameId: 'Ludo',
  sessionId: 'match_ludo_001',
  outcome: 'win',
  placement: 1,
  entryFee: 100
};

const ludoRes = processGameOutcome(currentPlayer, ludoMatch1);
currentPlayer = ludoRes.updatedProfile;

assert(ludoRes.result.xpGained > 0, 'Ludo win must award positive XP');
assert(currentPlayer.xp === ludoRes.result.xpGained, 'Player total XP must equal gained XP');
assert(currentPlayer.processedMatches?.includes('match_ludo_001'), 'Match ID must be recorded in processedMatches');
console.log(`Ludo Win awarded +${ludoRes.result.xpGained} XP. Total XP: ${currentPlayer.xp}`);

// 5. TEST: Cross-Game XP Addition (Chess)
console.log('--- TEST 5: CROSS-GAME XP ADDITION (CHESS) ---');
const chessMatch1: GameResultPayload = {
  gameId: 'Chess',
  sessionId: 'match_chess_002',
  outcome: 'win',
  entryFee: 250,
  botDifficulty: 'hard'
};

const chessRes = processGameOutcome(currentPlayer, chessMatch1);
currentPlayer = chessRes.updatedProfile;

assert(chessRes.result.xpGained > 0, 'Chess win must award positive XP');
assert(currentPlayer.xp! > ludoRes.result.xpGained, 'Total XP must accumulate across different games');
console.log(`Chess Win awarded +${chessRes.result.xpGained} XP. Total Global XP: ${currentPlayer.xp}`);
console.log('✅ PASS: Global XP accumulates across different games (Ludo + Chess).\n');

// 6. TEST: Duplicate Reward Protection (Idempotency)
console.log('--- TEST 6: DUPLICATE REWARD PROTECTION (IDEMPOTENCY) ---');
const duplicateSubmission = processGameOutcome(currentPlayer, chessMatch1);

assert(duplicateSubmission.result.alreadyProcessed === true, 'Duplicate session submission must set alreadyProcessed = true');
assert(duplicateSubmission.result.xpGained === 0, 'Duplicate submission must award 0 XP');
assert(duplicateSubmission.updatedProfile.xp === currentPlayer.xp, 'Player total XP must remain unchanged on duplicate submission');
console.log('✅ PASS: Submitting the same match ID multiple times awards 0 duplicate XP.\n');

// 7. TEST: Future Game Rule Plugin Architecture
console.log('--- TEST 7: FUTURE GAME PLUGIN REGISTRATION ---');
registerGameProgressionRules('CyberRacer', (payload) => {
  let xp = 100;
  if (payload.outcome === 'win') xp += 300;
  return xp;
});

const futureGameMatch: GameResultPayload = {
  gameId: 'CyberRacer',
  sessionId: 'match_future_003',
  outcome: 'win'
};

const calculatedFutureXP = calculateGameXP(futureGameMatch);
assert(calculatedFutureXP === 400, `CyberRacer rule must calculate 400 XP (got ${calculatedFutureXP})`);

const futureRes = processGameOutcome(currentPlayer, futureGameMatch);
currentPlayer = futureRes.updatedProfile;

assert(futureRes.result.xpGained === 400, 'CyberRacer outcome must award 400 XP');
console.log(`Future Game (CyberRacer) awarded +${futureRes.result.xpGained} XP. Total XP: ${currentPlayer.xp}`);
console.log('✅ PASS: Future games can register custom XP reward rules without modifying core engine.\n');

// 8. TEST: Protected Account Stability Under Matches
console.log('--- TEST 8: PROTECTED ACCOUNT STABILITY UNDER MATCH PLAY ---');
const ojiMatch: GameResultPayload = {
  gameId: 'Chess',
  sessionId: 'match_oji_999',
  outcome: 'win',
  entryFee: 500
};

const ojiOutcome = processGameOutcome(protectedUser, ojiMatch);
assert(ojiOutcome.updatedProfile.level === 42, `ojiF@vour Level must remain 42 (got ${ojiOutcome.updatedProfile.level})`);
assert(ojiOutcome.updatedProfile.rank === 'Elite Ops', `ojiF@vour Rank must remain Elite Ops (got ${ojiOutcome.updatedProfile.rank})`);
console.log(`ojiF@vour played match -> Level=${ojiOutcome.updatedProfile.level}, Rank=${ojiOutcome.updatedProfile.rank}, XP=${ojiOutcome.updatedProfile.xp}`);
console.log('✅ PASS: ojiF@vour remains Elite Ops Lv 42.\n');

console.log('🎉 ALL PROGRESSION ENGINE UNIT TESTS COMPLETED SUCCESSFULLY!');
