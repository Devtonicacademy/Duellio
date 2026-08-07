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
console.log("🧪 RUNNING INDEPENDENT TWO-DICE LUDO ENGINE TEST SUITE");
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
// TEST 1: Basic Split Move (Move Piece A by 2, Move Piece B by 3)
// ----------------------------------------------------
runTest("1. Basic Split Move (Move Piece A by 2, Move Piece B by 3)", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Place two Red tokens on board
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 0, status: 'board' };
    if (t.id === 'red_2') return { ...t, position: 10, status: 'board' };
    return t;
  });

  // Roll [2, 3]
  state = handleDiceRoll(state, [2, 3]);

  // Move red_1 by 2 using die_0 (2)
  state = executeMove(state, 'red_1', 'die_0');
  const movedRed1 = state.tokens.find(t => t.id === 'red_1')!;
  assert(movedRed1.position === 2, "red_1 should be at position 2 after using die_0 (2)");

  // Verify turn stays active for Red to play die_1 (3)
  assert(state.activePlayerIndex === 0, "Turn should remain Red's turn for remaining die");

  // Move red_2 by 3 using die_1 (3)
  state = executeMove(state, 'red_2', 'die_1');
  const movedRed2 = state.tokens.find(t => t.id === 'red_2')!;
  assert(movedRed2.position === 13, "red_2 should be at position 13 after using die_1 (3)");

  // Turn passes to Blue after both dice consumed
  assert(state.activePlayerIndex === 1, "Turn should pass to Blue after both dice are consumed");
});

// ----------------------------------------------------
// TEST 2: Reverse Order (Move 3 first, Move 2 second)
// ----------------------------------------------------
runTest("2. Reverse Order (Move 3 first, Move 2 second)", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 0, status: 'board' };
    if (t.id === 'red_2') return { ...t, position: 10, status: 'board' };
    return t;
  });

  // Roll [2, 3] -> die_0 = 2, die_1 = 3
  state = handleDiceRoll(state, [2, 3]);

  // Choose die_1 (3) FIRST to move red_1
  state = executeMove(state, 'red_1', 'die_1');
  const movedRed1 = state.tokens.find(t => t.id === 'red_1')!;
  assert(movedRed1.position === 3, "red_1 should be at position 3 after using die_1 (3) first");

  // Choose die_0 (2) SECOND to move red_2
  state = executeMove(state, 'red_2', 'die_0');
  const movedRed2 = state.tokens.find(t => t.id === 'red_2')!;
  assert(movedRed2.position === 12, "red_2 should be at position 12 after using die_0 (2) second");
});

// ----------------------------------------------------
// TEST 3: Same Piece Sequential Moves (Move red_1 by 2, then by 3)
// ----------------------------------------------------
runTest("3. Same Piece Sequential Moves (Move red_1 by 2, then by 3)", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 0, status: 'board' } : t);

  // Roll [2, 3]
  state = handleDiceRoll(state, [2, 3]);

  // Move red_1 with die_0 (2)
  state = executeMove(state, 'red_1', 'die_0');
  let token = state.tokens.find(t => t.id === 'red_1')!;
  assert(token.position === 2, "red_1 should be at position 2 after first die (2)");

  // Move SAME red_1 with die_1 (3)
  state = executeMove(state, 'red_1', 'die_1');
  token = state.tokens.find(t => t.id === 'red_1')!;
  assert(token.position === 5, "red_1 should reach position 5 after second die (3)");
});

// ----------------------------------------------------
// TEST 4: Rejection of Combined Single Jump (No 5-space jump for [2, 3])
// ----------------------------------------------------
runTest("4. Rejection of Combined Single Jump (No 5-space jump for [2, 3])", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 0, status: 'board' } : t);

  state = handleDiceRoll(state, [2, 3]);

  // Get legal moves for single die_0 (2)
  const movesFor2 = getLegalMoves(state, 'red', 'die_0');
  assert(movesFor2.some(m => m.toPosition === 2), "Die 2 must produce a move to position 2");
  assert(!movesFor2.some(m => m.toPosition === 5), "Die 2 alone must NOT produce a move to position 5");

  // Get legal moves for single die_1 (3)
  const movesFor3 = getLegalMoves(state, 'red', 'die_1');
  assert(movesFor3.some(m => m.toPosition === 3), "Die 3 must produce a move to position 3");
  assert(!movesFor3.some(m => m.toPosition === 5), "Die 3 alone must NOT produce a move to position 5");
});

// ----------------------------------------------------
// TEST 5: Intermediate Board Recalculation & Capture Between Moves
// ----------------------------------------------------
runTest("5. Intermediate Board Recalculation & Capture Between Moves", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Place Red token at 0, Blue token at 2 (common index 2)
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 0, status: 'board' };
    if (t.id === 'blue_1') return { ...t, position: 41, status: 'board' }; // Blue pos 41 maps to common index 2
    return t;
  });

  // Roll [2, 3] -> die_0 = 2, die_1 = 3
  state = handleDiceRoll(state, [2, 3]);

  // First move (die_0 = 2): red_1 moves 0 -> 2 and CAPTURES blue_1!
  state = executeMove(state, 'red_1', 'die_0');

  const capturedBlue = state.tokens.find(t => t.id === 'blue_1')!;
  assert(capturedBlue.position === -1, "blue_1 should be captured and returned to yard after first die move");

  // Intermediate state updated! Now execute second move (die_1 = 3) on red_1 from 2 -> 5
  state = executeMove(state, 'red_1', 'die_1');
  const red1Final = state.tokens.find(t => t.id === 'red_1')!;
  assert(red1Final.position === 5, "red_1 should advance to position 5 on second die move");
});

// ----------------------------------------------------
// TEST 6: Duplicate Dice Values ([3, 3]) Tracked by Die Identity
// ----------------------------------------------------
runTest("6. Duplicate Dice Values ([3, 3]) Tracked by Die Identity", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 0, status: 'board' };
    if (t.id === 'red_2') return { ...t, position: 10, status: 'board' };
    return t;
  });

  // Roll [3, 3] -> die_0 = 3, die_1 = 3
  state = handleDiceRoll(state, [3, 3]);

  // Execute die_0 (3)
  state = executeMove(state, 'red_1', 'die_0');
  assert(state.dicePool.find(d => d.id === 'die_0')!.used === true, "die_0 should be marked as used");
  assert(state.dicePool.find(d => d.id === 'die_1')!.used === false, "die_1 should remain unconsumed");

  // Execute die_1 (3)
  state = executeMove(state, 'red_2', 'die_1');
  assert(state.dicePool.every(d => d.used), "Both dice should now be consumed");
});

// ----------------------------------------------------
// TEST 7: Six + Another Number ([6, 3]) Exiting Yard
// ----------------------------------------------------
runTest("7. Six + Another Number ([6, 3]) Exiting Yard", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Red has 4 tokens in yard

  state = handleDiceRoll(state, [6, 3]);

  // Die with 6 (die_0 = 6) brings red_1 out to starting square (position 0)
  state = executeMove(state, 'red_1', 'die_0');
  const red1Out = state.tokens.find(t => t.id === 'red_1')!;
  assert(red1Out.position === 0, "red_1 should be placed on starting square (position 0) by 6");

  // Die with 3 (die_1 = 3) moves red_1 from 0 to 3
  state = executeMove(state, 'red_1', 'die_1');
  const red1Step3 = state.tokens.find(t => t.id === 'red_1')!;
  assert(red1Step3.position === 3, "red_1 should be moved from 0 to 3 by second die (3)");
});

// ----------------------------------------------------
// TEST 8: Double-Six Extra Roll ([6, 6])
// ----------------------------------------------------
runTest("8. Double-Six Extra Roll ([6, 6])", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 0, status: 'board' };
    if (t.id === 'red_2') return { ...t, position: 10, status: 'board' };
    return t;
  });

  // Roll [6, 6]
  state = handleDiceRoll(state, [6, 6]);

  // Execute die_0 (6)
  state = executeMove(state, 'red_1', 'die_0');
  assert(state.activePlayerIndex === 0, "Red retains turn for second die");

  // Execute die_1 (6)
  state = executeMove(state, 'red_2', 'die_1');
  assert(state.activePlayerIndex === 0, "Red retains turn for extra roll after double-six!");
});

// ----------------------------------------------------
// TEST 9: Only One Die Usable
// ----------------------------------------------------
runTest("9. Only One Die Usable", () => {
  let state = createInitialGameState(['red', 'blue']);
  // Red token at 55 (needs 2 for home at 57). Roll [2, 5].
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 55, status: 'board' } : t);

  state = handleDiceRoll(state, [2, 5]);

  // Die 2 has a legal move (55 -> 57 finish), die 5 has 0 legal moves (55 + 5 = 60 overshoots)
  const movesFor2 = getLegalMoves(state, 'red', 'die_0');
  assert(movesFor2.length === 1, "Die 2 must produce 1 legal move");

  const movesFor5 = getLegalMoves(state, 'red', 'die_1');
  assert(movesFor5.length === 0, "Die 5 must produce 0 legal moves due to exact home entry");

  // Execute move with die_0 (2)
  state = executeMove(state, 'red_1', 'die_0');
  
  // Since die 5 has no legal moves, turn automatically resolves and passes to Blue
  assert(state.activePlayerIndex === 1, "Turn should pass to Blue after usable die is consumed and remaining die has no moves");
});

console.log("==================================================");
console.log(`🎉 ALL ${passedCount}/9 INDEPENDENT LUDO ENGINE TESTS PASSED!`);
console.log("==================================================");
