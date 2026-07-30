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
console.log("🧪 RUNNING OFFICIAL LUDO GAME ENGINE TEST SUITE");
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
// TEST 1: Leaving Base with a 6
// ----------------------------------------------------
runTest("1. Leaving Base with a 6", () => {
  let state = createInitialGameState(['red', 'blue']);
  state = handleDiceRoll(state, 6);
  const legalMoves = getLegalMoves(state, 'red', 6);

  assert(legalMoves.length === 4, "Should have 4 legal moves for 4 tokens in base");
  assert(legalMoves[0].isLeavingBase === true, "Legal move should indicate leaving base");

  state = executeMove(state, 'red_1', 6);
  const movedToken = state.tokens.find(t => t.id === 'red_1')!;
  assert(movedToken.position === 0, "Token red_1 should be at position 0");
  assert(movedToken.status === 'board', "Token red_1 status should be 'board'");
});

// ----------------------------------------------------
// TEST 2: Leaving Base without a 6
// ----------------------------------------------------
runTest("2. Leaving Base without a 6", () => {
  let state = createInitialGameState(['red', 'blue']);
  state = handleDiceRoll(state, 5);
  const legalMoves = getLegalMoves(state, 'red', 5);

  assert(legalMoves.length === 0, "Tokens in base cannot move on a roll of 5");
});

// ----------------------------------------------------
// TEST 3: Capturing Opponent Token (No extra roll awarded)
// ----------------------------------------------------
runTest("3. Capturing Opponent Token (No extra roll awarded)", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Place Red token at position 2 (cell [6, 2])
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 2, status: 'board' } : t);
  // Place Blue token at position 44 (which maps to common index 5 = cell [5, 6])
  state.tokens = state.tokens.map(t => t.id === 'blue_1' ? { ...t, position: 44, status: 'board' } : t);

  // Red rolls 3 to land on position 5 (cell [5, 6])
  state = handleDiceRoll(state, 3);
  state = executeMove(state, 'red_1', 3);

  const capturedBlue = state.tokens.find(t => t.id === 'blue_1')!;
  assert(capturedBlue.position === -1, "Captured blue_1 should be returned to base yard (-1)");
  assert(capturedBlue.status === 'home', "Captured blue_1 status should be 'home'");
  assert(state.activePlayerIndex === 1, "Turn should pass to Blue because roll was 3 (no extra roll for capture)");
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

  // Red rolls 3 to land on safe position 13
  state = handleDiceRoll(state, 3);
  state = executeMove(state, 'red_1', 3);

  const blueToken = state.tokens.find(t => t.id === 'blue_1')!;
  assert(blueToken.position === 13, "Blue token on safe start square should NOT be captured");
  assert(blueToken.status === 'board', "Blue token should remain on board");
});

// ----------------------------------------------------
// TEST 5: Exact Home Entry (Disallows Overshooting)
// ----------------------------------------------------
runTest("5. Exact Home Entry (Disallows Overshooting)", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Place Red token at runway step 55 (needs 2 to reach 57)
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 55, status: 'board' } : t);

  // Roll 5 (overshoots 57)
  state = handleDiceRoll(state, 5);
  const legalMovesOver = getLegalMoves(state, 'red', 5);
  assert(legalMovesOver.length === 0, "Roll of 5 should produce 0 legal moves for token at position 55");

  // Roll 2 (exact finish)
  state = handleDiceRoll(state, 2);
  const legalMovesExact = getLegalMoves(state, 'red', 2);
  assert(legalMovesExact.length === 1, "Roll of 2 should produce 1 legal move to position 57");

  state = executeMove(state, 'red_1', 2);
  const finishedRed = state.tokens.find(t => t.id === 'red_1')!;
  assert(finishedRed.position === 57, "Red token should reach position 57");
  assert(finishedRed.status === 'finished', "Red token status should be 'finished'");
});

// ----------------------------------------------------
// TEST 6: Winning Condition (All 4 Tokens Home)
// ----------------------------------------------------
runTest("6. Winning Condition (All 4 Tokens Home)", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Place 3 Red tokens at 57 (finished) and 1 Red token at 56
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1' || t.id === 'red_2' || t.id === 'red_3') return { ...t, position: 57, status: 'finished' };
    if (t.id === 'red_4') return { ...t, position: 56, status: 'board' };
    return t;
  });

  // Roll 1 for Red to finish red_4
  state = handleDiceRoll(state, 1);
  state = executeMove(state, 'red_4', 1);

  assert(state.gameStatus === 'completed', "Game status should be 'completed'");
  assert(state.winner === 'red', "Winner should be 'red'");
});

// ----------------------------------------------------
// TEST 7: Three Consecutive Sixes Turn Rollback Penalty
// ----------------------------------------------------
runTest("7. Three Consecutive Sixes Turn Rollback Penalty", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Initial state: Red token red_1 at position 0, red_2 at position 5
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 0, status: 'board' };
    if (t.id === 'red_2') return { ...t, position: 5, status: 'board' };
    return t;
  });

  // Roll 1: Six
  state = handleDiceRoll(state, 6);
  state = executeMove(state, 'red_1', 6); // red_1 moves 0 -> 6

  // Roll 2: Six
  state = handleDiceRoll(state, 6);
  state = executeMove(state, 'red_2', 6); // red_2 moves 5 -> 11

  // Roll 3: Third Six -> TRIPLE SIX PENALTY!
  state = handleDiceRoll(state, 6);

  // Verification: State must be restored back to turn-start positions (red_1 at 0, red_2 at 5)!
  const restoredRed1 = state.tokens.find(t => t.id === 'red_1')!;
  const restoredRed2 = state.tokens.find(t => t.id === 'red_2')!;

  assert(restoredRed1.position === 0, "red_1 should be restored back to 0 (turn start position)");
  assert(restoredRed2.position === 5, "red_2 should be restored back to 5 (turn start position)");
  assert(state.activePlayerIndex === 1, "Turn should forfeit and pass immediately to Blue");
});

// ----------------------------------------------------
// TEST 8: Invalid Moves (Disallowing illegal executions)
// ----------------------------------------------------
runTest("8. Invalid Moves (Disallowing illegal executions)", () => {
  let state = createInitialGameState(['red', 'blue']);
  state = handleDiceRoll(state, 4);

  // Trying to move a Blue token on Red's turn
  let errorThrown = false;
  try {
    state = executeMove(state, 'blue_1', 4);
  } catch (err) {
    errorThrown = true;
  }
  assert(errorThrown === true, "Moving an opponent token or illegal move must throw an Error");
});

// ----------------------------------------------------
// TEST 9: Consecutive Extra Turns After Rolling 6
// ----------------------------------------------------
runTest("9. Consecutive Extra Turns After Rolling 6", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 0, status: 'board' } : t);

  // Roll 6 -> moves token and retains active player index (Red)
  state = handleDiceRoll(state, 6);
  state = executeMove(state, 'red_1', 6);
  assert(state.activePlayerIndex === 0, "Red should retain turn after rolling a 6");

  // Roll 4 -> moves token and passes turn to Blue
  state = handleDiceRoll(state, 4);
  state = executeMove(state, 'red_1', 4);
  assert(state.activePlayerIndex === 1, "Turn should pass to Blue after non-6 roll");
});

console.log("==================================================");
console.log(`🎉 ALL ${passedCount}/9 AUTOMATED LUDO TESTS PASSED!`);
console.log("==================================================");
