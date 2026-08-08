/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createInitialGameState,
  handleDiceRoll,
  executeMove,
  getLegalMoves,
  getTokenCell,
  LudoGameState,
  LudoTokenState,
  PlayerColor
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
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 1, status: 'board' };
    if (t.id === 'red_2') return { ...t, position: 10, status: 'board' };
    return t;
  });

  state = handleDiceRoll(state, [2, 3]);

  state = executeMove(state, 'red_1', 'die_0');
  const movedRed1 = state.tokens.find(t => t.id === 'red_1')!;
  assert(movedRed1.position === 3, "red_1 should be at position 3 after using die_0 (2)");

  assert(state.activePlayerIndex === 0, "Turn should remain Red's turn for remaining die");

  state = executeMove(state, 'red_2', 'die_1');
  const movedRed2 = state.tokens.find(t => t.id === 'red_2')!;
  assert(movedRed2.position === 13, "red_2 should be at position 13 after using die_1 (3)");

  assert(state.activePlayerIndex === 1, "Turn should pass to Blue after both dice are consumed");
});

// ----------------------------------------------------
// TEST 2: Reverse Order (Move 3 first, Move 2 second)
// ----------------------------------------------------
runTest("2. Reverse Order (Move 3 first, Move 2 second)", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 1, status: 'board' };
    if (t.id === 'red_2') return { ...t, position: 10, status: 'board' };
    return t;
  });

  state = handleDiceRoll(state, [2, 3]);

  state = executeMove(state, 'red_1', 'die_1');
  const movedRed1 = state.tokens.find(t => t.id === 'red_1')!;
  assert(movedRed1.position === 4, "red_1 should be at position 4 after using die_1 (3) first");

  state = executeMove(state, 'red_2', 'die_0');
  const movedRed2 = state.tokens.find(t => t.id === 'red_2')!;
  assert(movedRed2.position === 12, "red_2 should be at position 12 after using die_0 (2) second");
});

// ----------------------------------------------------
// TEST 3: Same Piece Sequential Moves (Move red_1 by 2, then by 3)
// ----------------------------------------------------
runTest("3. Same Piece Sequential Moves (Move red_1 by 2, then by 3)", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 1, status: 'board' } : t);

  state = handleDiceRoll(state, [2, 3]);

  state = executeMove(state, 'red_1', 'die_0');
  let token = state.tokens.find(t => t.id === 'red_1')!;
  assert(token.position === 3, "red_1 should be at position 3 after first die (2)");

  state = executeMove(state, 'red_1', 'die_1');
  token = state.tokens.find(t => t.id === 'red_1')!;
  assert(token.position === 6, "red_1 should reach position 6 after second die (3)");
});

// ----------------------------------------------------
// TEST 4: Rejection of Combined Single Jump (No 5-space jump for [2, 3])
// ----------------------------------------------------
runTest("4. Rejection of Combined Single Jump (No 5-space jump for [2, 3])", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 1, status: 'board' } : t);

  state = handleDiceRoll(state, [2, 3]);

  const movesFor2 = getLegalMoves(state, 'red', 'die_0');
  assert(movesFor2.some(m => m.toPosition === 3), "Die 2 must produce a move to position 3");
  assert(!movesFor2.some(m => m.toPosition === 6), "Die 2 alone must NOT produce a move to position 6");

  const movesFor3 = getLegalMoves(state, 'red', 'die_1');
  assert(movesFor3.some(m => m.toPosition === 4), "Die 3 must produce a move to position 4");
  assert(!movesFor3.some(m => m.toPosition === 6), "Die 3 alone must NOT produce a move to position 6");
});

// ----------------------------------------------------
// TEST 5: Intermediate Board Recalculation & Capture Between Moves
// ----------------------------------------------------
runTest("5. Intermediate Board Recalculation & Capture Between Moves", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 1, status: 'board' };
    if (t.id === 'blue_1') return { ...t, position: 42, status: 'board' };
    return t;
  });

  state = handleDiceRoll(state, [2, 3]);

  state = executeMove(state, 'red_1', 'die_0');

  const capturedBlue = state.tokens.find(t => t.id === 'blue_1')!;
  assert(capturedBlue.position === -1, "blue_1 should be captured and returned to yard after first die move");

  state = executeMove(state, 'red_1', 'die_1');
  const red1Final = state.tokens.find(t => t.id === 'red_1')!;
  assert(red1Final.position === 6, "red_1 should advance to position 6 on second die move");
});

// ----------------------------------------------------
// TEST 6: Duplicate Dice Values ([3, 3]) Tracked by Die Identity
// ----------------------------------------------------
runTest("6. Duplicate Dice Values ([3, 3]) Tracked by Die Identity", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 1, status: 'board' };
    if (t.id === 'red_2') return { ...t, position: 10, status: 'board' };
    return t;
  });

  state = handleDiceRoll(state, [3, 3]);

  state = executeMove(state, 'red_1', 'die_0');
  assert(state.dicePool.find(d => d.id === 'die_0')!.used === true, "die_0 should be marked as used");
  assert(state.dicePool.find(d => d.id === 'die_1')!.used === false, "die_1 should remain unconsumed");

  state = executeMove(state, 'red_2', 'die_1');
  assert(state.dicePool.every(d => d.used), "Both dice should now be consumed");
});

// ----------------------------------------------------
// TEST 7: Six + Another Number ([6, 3]) Exiting Yard to Position 1
// ----------------------------------------------------
runTest("7. Six + Another Number ([6, 3]) Exiting Yard to Position 1", () => {
  let state = createInitialGameState(['red', 'blue']);

  state = handleDiceRoll(state, [6, 3]);

  state = executeMove(state, 'red_1', 'die_0');
  const red1Out = state.tokens.find(t => t.id === 'red_1')!;
  assert(red1Out.position === 1, "red_1 should be placed 1 space ahead of start (position 1) by 6");

  state = executeMove(state, 'red_1', 'die_1');
  const red1Step3 = state.tokens.find(t => t.id === 'red_1')!;
  assert(red1Step3.position === 4, "red_1 should be moved from 1 to 4 by second die (3)");
});

// ----------------------------------------------------
// TEST 8: Double-Six Extra Roll ([6, 6])
// ----------------------------------------------------
runTest("8. Double-Six Extra Roll ([6, 6])", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => {
    if (t.id === 'red_1') return { ...t, position: 1, status: 'board' };
    if (t.id === 'red_2') return { ...t, position: 10, status: 'board' };
    return t;
  });

  state = handleDiceRoll(state, [6, 6]);

  state = executeMove(state, 'red_1', 'die_0');
  assert(state.activePlayerIndex === 0, "Red retains turn for second die");

  state = executeMove(state, 'red_2', 'die_1');
  assert(state.activePlayerIndex === 0, "Red retains turn for extra roll after double-six!");
});

// ----------------------------------------------------
// TEST 9: Only One Die Usable
// ----------------------------------------------------
runTest("9. Only One Die Usable", () => {
  let state = createInitialGameState(['red', 'blue']);
  state.tokens = state.tokens.map(t => t.id === 'red_1' ? { ...t, position: 55, status: 'board' } : t);

  state = handleDiceRoll(state, [2, 5]);

  const movesFor2 = getLegalMoves(state, 'red', 'die_0');
  assert(movesFor2.length === 1, "Die 2 must produce 1 legal move");

  const movesFor5 = getLegalMoves(state, 'red', 'die_1');
  assert(movesFor5.length === 0, "Die 5 must produce 0 legal moves due to exact home entry");

  state = executeMove(state, 'red_1', 'die_0');
  
  assert(state.activePlayerIndex === 1, "Turn should pass to Blue after usable die is consumed and remaining die has no moves");
});

// ----------------------------------------------------
// TEST 10: All 4 Colors Yard Exit 1-Space-Forward Verification
// ----------------------------------------------------
runTest("10. All 4 Colors Yard Exit 1-Space-Forward Verification", () => {
  const colors: PlayerColor[] = ['red', 'blue', 'green', 'gold'];
  const expectedForwardStartCoords: Record<PlayerColor, [number, number]> = {
    red: [6, 1],
    blue: [1, 8],
    green: [8, 13],
    gold: [13, 6]
  };

  colors.forEach(color => {
    let state = createInitialGameState(['red', 'blue', 'green', 'gold'], '4-player');

    state.activePlayerIndex = state.players.indexOf(color);

    state = handleDiceRoll(state, [6, 1]);

    const tokenId = `${color}_1`;
    state = executeMove(state, tokenId, 'die_0');

    const token = state.tokens.find(t => t.id === tokenId)!;
    assert(token.position === 1, `${color} token position should be 1 (one space ahead of start) upon exiting yard`);

    const cell = getTokenCell(token);
    const expected = expectedForwardStartCoords[color];
    assert(cell[0] === expected[0] && cell[1] === expected[1],
      `${color} yard exit cell [${cell[0]}, ${cell[1]}] must match designated 1-space-forward position [${expected[0]}, ${expected[1]}]`);

    state = executeMove(state, tokenId, 'die_1');
    const tokenStep2 = state.tokens.find(t => t.id === tokenId)!;
    assert(tokenStep2.position === 2, `${color} token position should be 2 after moving 1 step from 1-space-forward start`);
  });
});

console.log("==================================================");
console.log(`🎉 ALL ${passedCount}/10 INDEPENDENT LUDO ENGINE TESTS PASSED!`);
console.log("==================================================");
