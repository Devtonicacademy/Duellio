/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createInitialGameState,
  handleDiceRoll,
  executeMove,
  getLegalMoves,
  LudoGameState,
  LudoTokenState
} from './ludoEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ TEST FAILED: ${message}`);
  }
}

console.log("==================================================");
console.log("🧪 RUNNING OFFICIAL TWO-DICE LUDO GAME ENGINE TEST SUITE");
console.log("==================================================");

let passedCount = 0;

function runTest(testName: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ [PASS] ${testName}`);
    passedCount++;
  } catch (err: any) {
    console.error(`❌ [FAIL] ${testName}:`, err.message);
  }
}

// ----------------------------------------------------
// TEST 1: Leaving Base Yard with a 6 on at least one die ([6, 3])
// ----------------------------------------------------
runTest("1. Leaving Base Yard with a 6 on at least one die ([6, 3])", () => {
  let state = createInitialGameState(['red', 'blue']);
  state = handleDiceRoll(state, [6, 3]);
  const legalMoves = getLegalMoves(state, 'red', [6, 3]);

  assert(legalMoves.length === 4, "Should have 4 legal moves for 4 tokens in yard on [6, 3]");
  assert(legalMoves[0].isLeavingBase === true, "Legal move should indicate leaving base");
  assert(legalMoves[0].toPosition === 3, "Token leaving base with [6, 3] should reach position 3 (0 + 3)");

  state = executeMove(state, 'red_1', [6, 3]);
  const movedToken = state.tokens.find(t => t.id === 'red_1')!;
  assert(movedToken.position === 3, "Token red_1 should be at position 3");
  assert(movedToken.status === 'board', "Token red_1 status should be 'board'");
});

// ----------------------------------------------------
// TEST 2: Leaving Base Yard without a 6 ([5, 4])
// ----------------------------------------------------
runTest("2. Leaving Base Yard without a 6 ([5, 4])", () => {
  let state = createInitialGameState(['red', 'blue']);
  state = handleDiceRoll(state, [5, 4]);
  const legalMoves = getLegalMoves(state, 'red', [5, 4]);

  assert(legalMoves.length === 0, "Tokens in base yard cannot move on a roll of [5, 4]");
});

// ----------------------------------------------------
// TEST 3: Capturing Opponent Token (Single opponent piece)
// ----------------------------------------------------
runTest("3. Capturing Opponent Token (Single opponent piece)", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Place Red token at position 2
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 2, status: 'board' } : t);
  // Place Blue token at position 44 (which maps to common index 5 = cell [5, 6])
  state.tokens = state.tokens.map(t => t.id === 'blue_1' ? { ...t, position: 44, status: 'board' } : t);

  // Red rolls [1, 2] (total 3) to land on position 5 (cell [5, 6])
  state = handleDiceRoll(state, [1, 2]);
  state = executeMove(state, 'red_1', [1, 2]);

  const capturedBlue = state.tokens.find(t => t.id === 'blue_1')!;
  assert(capturedBlue.position === -1, "Captured blue_1 should be returned to base yard (-1)");
  assert(capturedBlue.status === 'home', "Captured blue_1 status should be 'home'");
  assert(state.activePlayerIndex === 1, "Turn should pass to Blue because roll was [1, 2] (no double 6)");
});

// ----------------------------------------------------
// TEST 4: Safe Squares (Prevents capture)
// ----------------------------------------------------
runTest("4. Safe Squares (Prevents capture)", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Place Red token at position 10
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 10, status: 'board' } : t);
  // Place Blue token at Blue Start Square (Position 13, which is safe)
  state.tokens = state.tokens.map(t => t.id === 'blue_1' ? { ...t, position: 13, status: 'board' } : t);

  // Red rolls [1, 2] (total 3) to land on safe position 13
  state = handleDiceRoll(state, [1, 2]);
  state = executeMove(state, 'red_1', [1, 2]);

  const blueToken = state.tokens.find(t => t.id === 'blue_1')!;
  assert(blueToken.position === 13, "Blue token on safe start square should NOT be captured");
  assert(blueToken.status === 'board', "Blue token should remain on board");
});

// ----------------------------------------------------
// TEST 5: Blockades (Creation & Blocking Opponent Movement)
// ----------------------------------------------------
runTest("5. Blockades (Creation & Blocking Opponent Movement)", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Create Blue Blockade at Blue position 0 (cell [0, 8]) using blue_1 and blue_2
  state.tokens = state.tokens.map(t => {
    if (t.id === 'blue_1' || t.id === 'blue_2') return { ...t, position: 0, status: 'board' };
    if (t.id === 'red_1') return { ...t, position: 10, status: 'board' }; // Cell [0, 6], 2 steps away from [0, 8]
    return t;
  });

  // Red rolls [2, 3] to attempt moving red_1 to or past Blue blockade
  state = handleDiceRoll(state, [2, 3]);
  const legalMoves = getLegalMoves(state, 'red', [2, 3]);

  // The move targeting position 13 (which lands on Blue's blockade at cell [0, 8]) must be blocked!
  const blockedMove = legalMoves.find(m => m.tokenId === 'red_1' && m.toPosition === 13);
  assert(!blockedMove, "Red token should be BLOCKED from landing on or passing through Blue blockade");
});

// ----------------------------------------------------
// TEST 6: Exact Home Entry (Disallows Overshooting)
// ----------------------------------------------------
runTest("6. Exact Home Entry (Disallows Overshooting)", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Place Red token at runway step 55 (needs 2 to reach 57)
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 55, status: 'board' } : t);

  // Roll [2, 3] (total 5, overshoots 57)
  state = handleDiceRoll(state, [2, 3]);
  const legalMovesOver = getLegalMoves(state, 'red', [2, 3]);
  assert(legalMovesOver.length === 0, "Roll of [2, 3] should produce 0 legal moves for token at position 55");

  // Roll [1, 1] (total 2, exact finish)
  state = handleDiceRoll(state, [1, 1]);
  const legalMovesExact = getLegalMoves(state, 'red', [1, 1]);
  assert(legalMovesExact.length === 1, "Roll of [1, 1] should produce 1 legal move to position 57");

  state = executeMove(state, 'red_1', [1, 1]);
  const finishedRed = state.tokens.find(t => t.id === 'red_1')!;
  assert(finishedRed.position === 57, "Red token should reach position 57");
  assert(finishedRed.status === 'finished', "Red token status should be 'finished'");
});

// ----------------------------------------------------
// TEST 7: Double-Six Extra Roll ([6, 6])
// ----------------------------------------------------
runTest("7. Double-Six Extra Roll ([6, 6])", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 0, status: 'board' } : t);

  // Roll [6, 6] -> moves token and retains active player index (Red)
  state = handleDiceRoll(state, [6, 6]);
  state = executeMove(state, 'red_1', [6, 6]);
  assert(state.activePlayerIndex === 0, "Red should retain turn after rolling double-6 ([6, 6])");

  // Next Roll [2, 3] -> moves token and passes turn to Blue
  state = handleDiceRoll(state, [2, 3]);
  state = executeMove(state, 'red_1', [2, 3]);
  assert(state.activePlayerIndex === 1, "Turn should pass to Blue after non-double-6 roll");
});

// ----------------------------------------------------
// TEST 8: Three Consecutive Double-Sixes Turn Penalty
// ----------------------------------------------------
runTest("8. Three Consecutive Double-Sixes Turn Penalty", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 0, status: 'board' };
    if (t.id === 'red_2') return { ...t, position: 5, status: 'board' };
    return t;
  });

  // Roll 1: [6, 6]
  state = handleDiceRoll(state, [6, 6]);
  state = executeMove(state, 'red_1', [6, 6]);

  // Roll 2: [6, 6]
  state = handleDiceRoll(state, [6, 6]);
  state = executeMove(state, 'red_2', [6, 6]);

  // Roll 3: Third Double-Six [6, 6] -> TRIPLE DOUBLE-SIX PENALTY!
  state = handleDiceRoll(state, [6, 6]);

  const restoredRed1 = state.tokens.find(t => t.id === 'red_1')!;
  const restoredRed2 = state.tokens.find(t => t.id === 'red_2')!;

  assert(restoredRed1.position === 0, "red_1 should be restored back to 0 (turn start position)");
  assert(restoredRed2.position === 5, "red_2 should be restored back to 5 (turn start position)");
  assert(state.activePlayerIndex === 1, "Turn should forfeit and pass immediately to Blue");
});

// ----------------------------------------------------
// TEST 9: Winning Condition (All 4 Tokens Home)
// ----------------------------------------------------
runTest("9. Winning Condition (All 4 Tokens Home)", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1' || t.id === 'red_2' || t.id === 'red_3') return { ...t, position: 57, status: 'finished' };
    if (t.id === 'red_4') return { ...t, position: 55, status: 'board' };
    return t;
  });

  // Roll [1, 1] for Red to finish red_4
  state = handleDiceRoll(state, [1, 1]);
  state = executeMove(state, 'red_4', [1, 1]);

  assert(state.gameStatus === 'completed', "Game status should be 'completed'");
  assert(state.winner === 'red', "Winner should be 'red'");
});

// ----------------------------------------------------
// TEST 10: Invalid Move Rejection (Security check)
// ----------------------------------------------------
runTest("10. Invalid Move Rejection (Security check)", () => {
  let state = createInitialGameState(['red', 'blue']);
  state = handleDiceRoll(state, [3, 4]);

  let errorThrown = false;
  try {
    // Attempt to move an opponent token on Red's turn
    state = executeMove(state, 'blue_1', [3, 4]);
  } catch (err) {
    errorThrown = true;
  }
  assert(errorThrown === true, "Moving opponent token or illegal move must throw an Error");
});

console.log("==================================================");
console.log(`🎉 ALL ${passedCount}/10 AUTOMATED LUDO ENGINE TESTS PASSED!`);
console.log("==================================================");
