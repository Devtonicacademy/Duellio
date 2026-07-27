/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, HelpCircle, Eye, EyeOff, Sparkles } from 'lucide-react';

interface InteractiveLudoBoardProps {
  entryFee: number;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winnerIsMe: boolean) => void;
  onAddLog: (log: string) => void;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  isBot?: boolean;
  sessionId?: string;
  isHost?: boolean;
  liveGameState?: any;
  onUpdateLiveState?: (newState: any) => void;
}

interface LudoToken {
  id: string;
  color: 'red' | 'green' | 'blue' | 'gold';
  position: number; // -1 means home base, 0 to 51 is common path, 52-57 is home runway
  status: 'home' | 'board' | 'finished';
}

// 15x15 grid coordinates mapping for standard Ludo path cell indexes (0 to 51)
const PATH_COORDINATES: Array<[number, number]> = [
  // Left arm going right from Red Start [6,0] to [6,5]
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Top arm going up from [5,6] to [0,6]
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Top arm top cross [0,7]
  [0, 7],
  // Top arm going down from Green Start [0,8] to [5,8]
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Right arm going right from [6,9] to [6,14]
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Right arm right cross [7,14]
  [7, 14],
  // Right arm going left from Yellow Start [8,14] to [8,9]
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Bottom arm going down from [9,8] to [14,8]
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Bottom arm bottom cross [14,7]
  [14, 7],
  // Bottom arm going up from Blue Start [14,6] to [9,6]
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Left arm going left from [8,5] to [8,0]
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Left arm left cross [7,0]
  [7, 0]
];

const RED_START_INDEX = 0;
const GREEN_START_INDEX = 13;

const SAFE_COORDS: Array<[number, number]> = [
  [6, 0], [0, 8], [8, 14], [14, 6]
];

// Decorative static tokens for non-player colors (Blue & Yellow/Gold) so all 4 quadrants are populated
const DECORATIVE_TOKENS = [
  { id: 'blue_1', color: 'blue' as const, position: -1, status: 'home' as const },
  { id: 'blue_2', color: 'blue' as const, position: -1, status: 'home' as const },
  { id: 'blue_3', color: 'blue' as const, position: -1, status: 'home' as const },
  { id: 'blue_4', color: 'blue' as const, position: -1, status: 'home' as const },
  { id: 'gold_1', color: 'gold' as const, position: -1, status: 'home' as const },
  { id: 'gold_2', color: 'gold' as const, position: -1, status: 'home' as const },
  { id: 'gold_3', color: 'gold' as const, position: -1, status: 'home' as const },
  { id: 'gold_4', color: 'gold' as const, position: -1, status: 'home' as const },
];

export const InteractiveLudoBoard: React.FC<InteractiveLudoBoardProps> = ({
  entryFee,
  opponentName,
  opponentAvatar,
  onGameOver,
  onAddLog,
  botDifficulty,
  isBot = true,
  sessionId,
  isHost = true,
  liveGameState,
  onUpdateLiveState
}) => {
  // 3D camera mode configuration
  const [view3D, setView3D] = useState<boolean>(true);

  // Playable tokens: 4 Red (Host/User) vs 4 Green (Guest/Bot)
  const [tokens, setTokens] = useState<LudoToken[]>(() => liveGameState?.tokens || [
    { id: 'red_1', color: 'red', position: -1, status: 'home' },
    { id: 'red_2', color: 'red', position: -1, status: 'home' },
    { id: 'red_3', color: 'red', position: -1, status: 'home' },
    { id: 'red_4', color: 'red', position: -1, status: 'home' },
    { id: 'green_1', color: 'green', position: -1, status: 'home' },
    { id: 'green_2', color: 'green', position: -1, status: 'home' },
    { id: 'green_3', color: 'green', position: -1, status: 'home' },
    { id: 'green_4', color: 'green', position: -1, status: 'home' }
  ]);

  const [activePlayer, setActivePlayer] = useState<'red' | 'green'>(() => liveGameState?.activePlayer || 'red');
  const [diceRollValue, setDiceRollValue] = useState<number>(5);
  const [secondDiceValue, setSecondDiceValue] = useState<number>(3);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [gameResult, setGameResult] = useState<'playing' | 'red_won' | 'green_won'>('playing');
  const [botIsThinking, setBotIsThinking] = useState<boolean>(false);
  const [showHelperRules, setShowHelperRules] = useState<boolean>(false);

  const myColor: 'red' | 'green' = isBot ? 'red' : (isHost ? 'red' : 'green');

  // Sync live state from Firestore snapshot
  useEffect(() => {
    if (!isBot && liveGameState) {
      if (liveGameState.tokens) setTokens(liveGameState.tokens);
      if (liveGameState.activePlayer) setActivePlayer(liveGameState.activePlayer);
      if (liveGameState.diceRollValue) setDiceRollValue(liveGameState.diceRollValue);
      if (liveGameState.secondDiceValue) setSecondDiceValue(liveGameState.secondDiceValue);
      if (liveGameState.gameResult) {
        setGameResult(liveGameState.gameResult);
        if (liveGameState.gameResult === (myColor + '_won')) onGameOver(true);
        else if (liveGameState.gameResult !== 'playing') onGameOver(false);
      }
    }
  }, [liveGameState, isBot, myColor, onGameOver]);

  // Auto Bot trigger on startup if it's Bot's turn
  useEffect(() => {
    if (isBot && activePlayer === 'green' && gameResult === 'playing' && !botIsThinking) {
      triggerBotTurn();
    }
  }, [activePlayer, isBot]);

  const rollDice = () => {
    if (isRolling || hasRolled || gameResult !== 'playing' || activePlayer !== myColor || botIsThinking) return;

    setIsRolling(true);
    onAddLog(`[DICE SEED] Dispatching crypto-secure random integer from validation engine.`);
    
    setTimeout(() => {
      const outcome1 = Math.floor(Math.random() * 6) + 1;
      const outcome2 = Math.floor(Math.random() * 6) + 1;
      setDiceRollValue(outcome1);
      setSecondDiceValue(outcome2);
      setIsRolling(false);
      setHasRolled(true);
      
      const totalSteps = outcome1;
      onAddLog(`[DICE SEED] Generated outcomes: ${outcome1} & ${outcome2}`);

      const nextPlayer = myColor === 'red' ? 'green' : 'red';

      // Check consecutive sixes rule
      if (totalSteps === 6) {
        const nextSixes = consecutiveSixes + 1;
        onAddLog(`[ROLL-SIX METER] Existing consecutive sixes count: ${consecutiveSixes}`);
        
        if (nextSixes >= 3) {
          setConsecutiveSixes(0);
          setHasRolled(false);
          setActivePlayer(nextPlayer);
          onAddLog(`[ROLL-SIX METER] Max sixes limit reached (3 consecutive sixes). Pass turn.`);
          if (!isBot && onUpdateLiveState) {
            onUpdateLiveState({ tokens, activePlayer: nextPlayer, diceRollValue: outcome1, secondDiceValue: outcome2, gameResult });
          }
          return;
        } else {
          setConsecutiveSixes(nextSixes);
        }
      } else {
        setConsecutiveSixes(0);
      }

      // Check if player has moves available
      const playable = tokens.filter(t => t.color === myColor && canMoveToken(t, totalSteps));
      if (playable.length === 0) {
        onAddLog(`[TURN GUARD] No valid moves available for ${myColor.toUpperCase()} with dice roll ${totalSteps}. Passing turn.`);
        setTimeout(() => {
          setActivePlayer(nextPlayer);
          setHasRolled(false);
          if (!isBot && onUpdateLiveState) {
            onUpdateLiveState({ tokens, activePlayer: nextPlayer, diceRollValue: outcome1, secondDiceValue: outcome2, gameResult });
          }
        }, 300);
      } else if (!isBot && onUpdateLiveState) {
        onUpdateLiveState({ tokens, activePlayer: myColor, diceRollValue: outcome1, secondDiceValue: outcome2, gameResult });
      }
    }, 300);
  };

  const triggerBotTurn = () => {
    setBotIsThinking(true);
    onAddLog(`[TURN KICK] Bot player ${opponentName} initiates dice throw process.`);
    
    setTimeout(() => {
      const outcome1 = Math.floor(Math.random() * 6) + 1;
      const outcome2 = Math.floor(Math.random() * 6) + 1;
      setDiceRollValue(outcome1);
      setSecondDiceValue(outcome2);
      onAddLog(`[DICE ROLL] Bot generates outcomes: ${outcome1} and ${outcome2}`);

      const botTokens = tokens.filter(t => t.color === 'green');
      const playable = botTokens.filter(t => canMoveToken(t, outcome1));

      if (playable.length === 0) {
        onAddLog(`[TURN LOCK] No valid board steps for Bot. Passing turn to you.`);
        setTimeout(() => {
          setActivePlayer('red');
          setBotIsThinking(false);
        }, 300);
        return;
      }

      const isHard = botDifficulty === 'hard' || entryFee > 0;
      let selection: LudoToken;

      if (isHard) {
        const redTokens = tokens.filter(t => t.color === 'red' && t.status === 'board');
        const captureMove = playable.find(t => {
          if (t.status !== 'board') return false;
          const nextPos = t.position + outcome1;
          return redTokens.some(r => r.position === nextPos);
        });
        const exiting = playable.find(t => t.status === 'home');
        const furthestOnBoard = [...playable.filter(t => t.status === 'board')].sort((a, b) => b.position - a.position)[0];

        selection = captureMove || exiting || furthestOnBoard || playable[0];
      } else {
        const exiting = playable.find(t => t.status === 'home');
        selection = exiting || playable[0];
      }

      setTimeout(() => {
        onAddLog(`[BOT PIECE MOVE] Bot moves token ${selection.id.toUpperCase()}`);
        executeTokenMovement(selection.id, outcome1, 'green');
        setBotIsThinking(false);
      }, 200);

    }, 300);
  };

  const canMoveToken = (token: LudoToken, roll: number): boolean => {
    if (token.status === 'finished') return false;
    if (token.status === 'home') {
      return roll === 6 || roll === 5;
    }
    const currentPos = token.position;
    if (currentPos + roll > 57) {
      return false;
    }
    return true;
  };

  const handleSelectToken = (token: LudoToken) => {
    if (activePlayer !== myColor || !hasRolled || !canMoveToken(token, diceRollValue) || gameResult !== 'playing') return;
    onAddLog(`[USER TOKEN SELECT] Moving token ${token.id.toUpperCase()} by ${diceRollValue} tiles.`);
    executeTokenMovement(token.id, diceRollValue, myColor);
  };

  const executeTokenMovement = (tokenId: string, steps: number, playerColor: 'red' | 'green') => {
    let nextResult = gameResult;
    let nextTokens: LudoToken[] = [];
    
    setTokens(prev => {
      const updated = prev.map(t => {
        if (t.id !== tokenId) return t;

        let nextPos = t.position;
        let nextStatus = t.status;

        if (t.status === 'home') {
          nextPos = 0;
          nextStatus = 'board' as const;
        } else {
          nextPos += steps;
          if (nextPos === 57) {
            nextStatus = 'finished' as const;
            onAddLog(`[SUCCESS] Token ${t.id} successfully finished its run!`);
          }
        }

        return { ...t, position: nextPos, status: nextStatus };
      });

      // Collision Engine
      const movingToken = updated.find(t => t.id === tokenId)!;
      if (movingToken.status === 'board' && movingToken.position < 52) {
        const targetCell = getTokenCell(movingToken);
        const isSafeSpace = SAFE_COORDS.some(([r, c]) => r === targetCell[0] && c === targetCell[1]);

        const collided = updated.find(t => {
          if (t.id === tokenId || t.color === movingToken.color || t.status !== 'board' || t.position >= 52) return false;
          const cell = getTokenCell(t);
          return cell[0] === targetCell[0] && cell[1] === targetCell[1];
        });

        if (collided) {
          if (isSafeSpace) {
            onAddLog(`[GRID COLLISION] Safe zone immunity. No capture.`);
          } else {
            onAddLog(`[GRID COLLISION] Capture! Opponent piece ${collided.id.toUpperCase()} returned to home base.`);
            collided.position = -1;
            collided.status = 'home';
          }
        }
      }

      // Win Checks
      const redFinished = updated.filter(t => t.color === 'red' && t.status === 'finished').length;
      const greenFinished = updated.filter(t => t.color === 'green' && t.status === 'finished').length;

      if (redFinished === 4) {
        nextResult = 'red_won';
        setGameResult('red_won');
        onAddLog(`[LUDO VICTORY] Red wins the match!`);
        setTimeout(() => onGameOver(myColor === 'red'), 3000);
      } else if (greenFinished === 4) {
        nextResult = 'green_won';
        setGameResult('green_won');
        onAddLog(`[LUDO VICTORY] Green wins the match!`);
        setTimeout(() => onGameOver(myColor === 'green'), 3000);
      }

      nextTokens = updated;
      return updated;
    });

    setHasRolled(false);
    const nextPlayer = (steps === 6 && nextResult === 'playing')
      ? playerColor
      : (playerColor === 'red' ? 'green' : 'red');

    if (steps === 6 && nextResult === 'playing') {
      onAddLog(`[ROLL-SIX BONUS] Roll of 6 grants extra turn. Roll again!`);
    } else {
      setActivePlayer(nextPlayer);
    }

    if (!isBot && onUpdateLiveState) {
      onUpdateLiveState({
        tokens: nextTokens,
        activePlayer: nextPlayer,
        diceRollValue: steps,
        secondDiceValue,
        gameResult: nextResult
      });
    }
  };

  // Maps token to 15x15 board cell [row, col]
  const getTokenCell = (token: LudoToken | typeof DECORATIVE_TOKENS[0]): [number, number] => {
    if (token.status === 'home') {
      const idNum = token.id.split('_')[1];
      if (token.color === 'red') {
        if (idNum === '1') return [1, 1];
        if (idNum === '2') return [1, 3];
        if (idNum === '3') return [3, 1];
        return [3, 3];
      }
      if (token.color === 'green') {
        if (idNum === '1') return [1, 10];
        if (idNum === '2') return [1, 12];
        if (idNum === '3') return [3, 10];
        return [3, 12];
      }
      if (token.color === 'blue') {
        if (idNum === '1') return [10, 1];
        if (idNum === '2') return [10, 3];
        if (idNum === '3') return [12, 1];
        return [12, 3];
      }
      // Gold / Yellow
      if (idNum === '1') return [10, 10];
      if (idNum === '2') return [10, 12];
      if (idNum === '3') return [12, 10];
      return [12, 12];
    }

    if (token.status === 'finished') {
      if (token.color === 'red') return [7, 6];
      if (token.color === 'green') return [6, 7];
      if (token.color === 'blue') return [8, 7];
      return [7, 8];
    }

    const pos = token.position;

    if (token.color === 'red') {
      if (pos >= 52) {
        const redRunway: Array<[number, number]> = [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]];
        return redRunway[Math.min(pos - 52, 5)];
      }
      return PATH_COORDINATES[pos % 52];
    }

    if (token.color === 'green') {
      if (pos >= 52) {
        const greenRunway: Array<[number, number]> = [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]];
        return greenRunway[Math.min(pos - 52, 5)];
      }
      return PATH_COORDINATES[(GREEN_START_INDEX + pos) % 52];
    }

    if (token.color === 'blue') {
      if (pos >= 52) {
        const blueRunway: Array<[number, number]> = [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]];
        return blueRunway[Math.min(pos - 52, 5)];
      }
      return PATH_COORDINATES[(39 + pos) % 52];
    }

    // Gold / Yellow
    if (pos >= 52) {
      const yellowRunway: Array<[number, number]> = [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]];
      return yellowRunway[Math.min(pos - 52, 5)];
    }
    return PATH_COORDINATES[(26 + pos) % 52];
  };

  return (
    <div className="relative min-h-[520px] sm:min-h-[640px] bg-[#03060D] rounded-2xl sm:rounded-3xl overflow-hidden border border-cyan-500/30 p-1 sm:p-2.5 font-sans flex flex-col justify-between shadow-[0_25px_60px_rgba(0,0,0,0.9)] select-none">
      
      {/* Studio lighting environment glows */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent rounded-full blur-[110px] pointer-events-none" />

      {/* VIEWPORT HEADER CONTROLS */}
      <div className="flex justify-between items-center px-4 pt-3 pb-2 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-[#091522] rounded-lg border border-cyan-500/30 flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>BLENDER 3D ISOMETRIC LUDO ARENA (8K)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelperRules(!showHelperRules)}
            className="p-1.5 bg-[#090F1B]/90 hover:bg-neutral-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1 font-mono uppercase"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>
          
          <button
            onClick={() => setView3D(!view3D)}
            className="p-1.5 bg-[#0e1627] hover:bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 rounded-lg transition-all text-xs flex items-center gap-1.5 font-mono uppercase font-bold shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          >
            {view3D ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{view3D ? '2D View' : '3D Camera'}</span>
          </button>
        </div>
      </div>

      {/* RULES PANEL DRAWER OVERLAY */}
      <AnimatePresence>
        {showHelperRules && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-6 right-6 bg-[#070D18]/95 backdrop-blur-md border border-cyan-500/40 p-4 rounded-2xl text-xs text-slate-350 space-y-2 z-40 shadow-2xl"
          >
            <h4 className="font-display font-black text-white uppercase text-sm tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Blender 3D Ludo Contract Rules</span>
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 font-mono text-[11px]">
              <li>You command the <span className="text-rose-400 font-bold">RED Pawns</span> in the Top-Left Base. Bot commands <span className="text-emerald-400 font-bold">GREEN Pawns</span> in Top-Right Base.</li>
              <li>A dice roll of <span className="text-yellow-300 font-bold">5 or 6</span> releases your pawn onto the Red starting square on the left arm.</li>
              <li>Land on opponent pawns to capture them back to base (except on colored start/safe squares).</li>
              <li>First player to navigate all 4 pawns into the central home triangle wins the match stake pool!</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* CORE 3D ARENA VIEWPORT FRAME */}
      {/* ========================================================== */}
      <div className="relative w-full flex-1 flex items-center justify-center py-6 transition-all duration-700">
        
        <div 
          className="relative transition-all duration-1000 ease-out flex items-center justify-center"
          style={{
            transform: view3D 
              ? 'perspective(1200px) rotateX(46deg) rotateZ(-22deg) translateY(-2%) scale(0.94)' 
              : 'perspective(1200px) rotateX(0deg) rotateZ(0deg) translateY(0) scale(1)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Soft studio grid floor projection */}
          {view3D && (
            <div className="absolute inset-[-80px] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] pointer-events-none" />
          )}

          {/* ========================================================== */}
          {/* MAHOGANY WOODEN BOARD SLAB & GLOSSY TRACK (BLENDER STYLE) */}
          {/* ========================================================== */}
          <div 
            className="relative w-[340px] h-[340px] sm:w-[430px] sm:h-[430px] bg-[#0f0b08] rounded-[36px] border-[4px] border-[#2a1d13] p-[3px] shadow-[0_45px_100px_rgba(0,0,0,0.95),0_16px_0px_#160d07,0_20px_35px_rgba(0,0,0,0.85)] ludo-board-container"
            style={{ transform: view3D ? 'translateZ(14px)' : 'none', transformStyle: 'preserve-3d' }}
          >
            {/* Polished mahogany wood sheen layer */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/15 via-transparent to-black/30 pointer-events-none z-10" />

            {/* 15x15 Grid Layout */}
            <div className="grid grid-cols-15 grid-rows-15 w-full h-full bg-black gap-[1px] rounded-2xl overflow-hidden shadow-2xl">
              {Array.from({ length: 15 }).map((_, r) =>
                Array.from({ length: 15 }).map((_, c) => {
                  // Center 3x3 Home Box (rows 6..8, cols 6..8)
                  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
                    if (r === 6 && c === 6) {
                      return (
                        <div
                          key="center-home"
                          className="relative overflow-hidden bg-white border border-black"
                          style={{ gridRow: '7 / span 3', gridColumn: '7 / span 3' }}
                        >
                          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Left triangle (Red) */}
                            <polygon points="0,0 50,50 0,100" fill="#E52521" stroke="#000000" strokeWidth="1.5" />
                            {/* Top triangle (Green) */}
                            <polygon points="0,0 50,50 100,0" fill="#009A44" stroke="#000000" strokeWidth="1.5" />
                            {/* Right triangle (Yellow) */}
                            <polygon points="100,0 50,50 100,100" fill="#FFCC00" stroke="#000000" strokeWidth="1.5" />
                            {/* Bottom triangle (Blue) */}
                            <polygon points="0,100 50,50 100,100" fill="#1B4EAB" stroke="#000000" strokeWidth="1.5" />
                          </svg>

                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[7.5px] sm:text-[9.5px] font-black text-black tracking-tighter uppercase opacity-35 font-mono">HOME</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }

                  // Top-Left Yard (Red)
                  if (r <= 5 && c <= 5) {
                    if (r >= 1 && r <= 4 && c >= 1 && c <= 4) {
                      const isCircle = (r === 1 && c === 1) || (r === 1 && c === 3) || (r === 3 && c === 1) || (r === 3 && c === 3);
                      return (
                        <div key={`${r}-${c}`} className="relative bg-white border border-black flex items-center justify-center" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                          {isCircle && <div className="w-[68%] h-[68%] rounded-full bg-[#E52521] border border-black shadow-inner" />}
                        </div>
                      );
                    }
                    return <div key={`${r}-${c}`} className="bg-[#E52521] border border-black" style={{ gridRow: r + 1, gridColumn: c + 1 }} />;
                  }

                  // Top-Right Yard (Green)
                  if (r <= 5 && c >= 9) {
                    if (r >= 1 && r <= 4 && c >= 10 && c <= 13) {
                      const isCircle = (r === 1 && c === 10) || (r === 1 && c === 12) || (r === 3 && c === 10) || (r === 3 && c === 12);
                      return (
                        <div key={`${r}-${c}`} className="relative bg-white border border-black flex items-center justify-center" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                          {isCircle && <div className="w-[68%] h-[68%] rounded-full bg-[#009A44] border border-black shadow-inner" />}
                        </div>
                      );
                    }
                    return <div key={`${r}-${c}`} className="bg-[#009A44] border border-black" style={{ gridRow: r + 1, gridColumn: c + 1 }} />;
                  }

                  // Bottom-Left Yard (Blue)
                  if (r >= 9 && c <= 5) {
                    if (r >= 10 && r <= 13 && c >= 1 && c <= 4) {
                      const isCircle = (r === 10 && c === 1) || (r === 10 && c === 3) || (r === 12 && c === 1) || (r === 12 && c === 3);
                      return (
                        <div key={`${r}-${c}`} className="relative bg-white border border-black flex items-center justify-center" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                          {isCircle && <div className="w-[68%] h-[68%] rounded-full bg-[#1B4EAB] border border-black shadow-inner" />}
                        </div>
                      );
                    }
                    return <div key={`${r}-${c}`} className="bg-[#1B4EAB] border border-black" style={{ gridRow: r + 1, gridColumn: c + 1 }} />;
                  }

                  // Bottom-Right Yard (Yellow)
                  if (r >= 9 && c >= 9) {
                    if (r >= 10 && r <= 13 && c >= 10 && c <= 13) {
                      const isCircle = (r === 10 && c === 10) || (r === 10 && c === 12) || (r === 12 && c === 10) || (r === 12 && c === 12);
                      return (
                        <div key={`${r}-${c}`} className="relative bg-white border border-black flex items-center justify-center" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                          {isCircle && <div className="w-[68%] h-[68%] rounded-full bg-[#FFCC00] border border-black shadow-inner" />}
                        </div>
                      );
                    }
                    return <div key={`${r}-${c}`} className="bg-[#FFCC00] border border-black" style={{ gridRow: r + 1, gridColumn: c + 1 }} />;
                  }

                  // Top Arm (r 0..5, c 6..8)
                  if (r <= 5 && c >= 6 && c <= 8) {
                    const isGreenPath = (c === 7 && r >= 1) || (r === 0 && (c === 7 || c === 8));
                    const isGreenStart = r === 0 && c === 8;
                    const isGreenEntry = r === 0 && c === 7;

                    return (
                      <div 
                        key={`${r}-${c}`} 
                        className={`border border-black relative flex items-center justify-center ${isGreenPath ? 'bg-[#009A44]' : 'bg-white'}`} 
                        style={{ gridRow: r + 1, gridColumn: c + 1 }}
                      >
                        {isGreenStart && <span className="text-[8px] sm:text-[10px] font-black text-white leading-none drop-shadow-sm">⬇</span>}
                        {isGreenEntry && <span className="text-[8px] sm:text-[10px] font-black text-[#009A44] leading-none drop-shadow-sm">⬇</span>}
                      </div>
                    );
                  }

                  // Left Arm (r 6..8, c 0..5)
                  if (r >= 6 && r <= 8 && c <= 5) {
                    const isRedPath = (r === 7) || (r === 6 && c === 0);
                    const isRedStart = r === 6 && c === 0;
                    const isRedEntry = r === 7 && c === 0;

                    return (
                      <div 
                        key={`${r}-${c}`} 
                        className={`border border-black relative flex items-center justify-center ${isRedPath ? 'bg-[#E52521]' : 'bg-white'}`} 
                        style={{ gridRow: r + 1, gridColumn: c + 1 }}
                      >
                        {isRedStart && <span className="text-[8px] sm:text-[10px] font-black text-white leading-none drop-shadow-sm">➔</span>}
                        {isRedEntry && <span className="text-[8px] sm:text-[10px] font-black text-[#E52521] leading-none drop-shadow-sm">➔</span>}
                      </div>
                    );
                  }

                  // Right Arm (r 6..8, c 9..14)
                  if (r >= 6 && r <= 8 && c >= 9) {
                    const isYellowPath = (r === 7) || (r === 8 && c === 14);
                    const isYellowStart = r === 8 && c === 14;
                    const isYellowEntry = r === 7 && c === 14;

                    return (
                      <div 
                        key={`${r}-${c}`} 
                        className={`border border-black relative flex items-center justify-center ${isYellowPath ? 'bg-[#FFCC00]' : 'bg-white'}`} 
                        style={{ gridRow: r + 1, gridColumn: c + 1 }}
                      >
                        {isYellowStart && <span className="text-[8px] sm:text-[10px] font-black text-black leading-none drop-shadow-sm">⬅</span>}
                        {isYellowEntry && <span className="text-[8px] sm:text-[10px] font-black text-[#D9A300] leading-none drop-shadow-sm">⬅</span>}
                      </div>
                    );
                  }

                  // Bottom Arm (r 9..14, c 6..8)
                  if (r >= 9 && c >= 6 && c <= 8) {
                    const isBluePath = (c === 7 && r >= 9) || (r === 14 && c === 6);
                    const isBlueStart = r === 14 && c === 6;
                    const isBlueEntry = r === 14 && c === 7;

                    return (
                      <div 
                        key={`${r}-${c}`} 
                        className={`border border-black relative flex items-center justify-center ${isBluePath ? 'bg-[#1B4EAB]' : 'bg-white'}`} 
                        style={{ gridRow: r + 1, gridColumn: c + 1 }}
                      >
                        {isBlueStart && <span className="text-[8px] sm:text-[10px] font-black text-white leading-none drop-shadow-sm">⬆</span>}
                        {isBlueEntry && <span className="text-[8px] sm:text-[10px] font-black text-[#1B4EAB] leading-none drop-shadow-sm">⬆</span>}
                      </div>
                    );
                  }

                  return <div key={`${r}-${c}`} className="bg-white border border-black" style={{ gridRow: r + 1, gridColumn: c + 1 }} />;
                })
              )}

              {/* Render Standing 3D Glossy Pawns placed precisely inside cell coordinates */}
              {[...tokens, ...DECORATIVE_TOKENS].map((token) => {
                const isDec = 'isDecoration' in token || token.id.startsWith('blue') || token.id.startsWith('gold');
                const [r, c] = getTokenCell(token as any);
                const isMine = token.color === 'red';
                const isPlayable = !isDec && isMine && hasRolled && canMoveToken(token as LudoToken, diceRollValue);

                return (
                  <div
                    key={token.id}
                    onClick={() => !isDec && handleSelectToken(token as LudoToken)}
                    className="relative z-30 flex items-center justify-center w-full h-full pointer-events-auto"
                    style={{ gridRow: r + 1, gridColumn: c + 1 }}
                  >
                    <LudoPawn3D
                      color={token.color}
                      isPlayable={isPlayable}
                      view3D={view3D}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================== */}
          {/* TWO SEMI-TRANSLUCENT WHITE DICE RESTING ON THE BOARD */}
          {/* ========================================================== */}
          <div 
            className="absolute bottom-[-15px] right-[80px] z-30"
            style={{
              transform: view3D 
                ? 'translateZ(50px) rotateX(25deg) rotateY(-30deg) rotateZ(35deg)' 
                : 'none',
              transformStyle: 'preserve-3d'
            }}
          >
            <SemiTranslucentWhiteDice value={diceRollValue} isRolling={isRolling} />
          </div>

          <div 
            className="absolute bottom-[-5px] right-[25px] z-30"
            style={{
              transform: view3D 
                ? 'translateZ(38px) rotateX(-20deg) rotateY(42deg) rotateZ(-12deg)' 
                : 'none',
              transformStyle: 'preserve-3d'
            }}
          >
            <SemiTranslucentWhiteDice value={secondDiceValue} isRolling={isRolling} />
          </div>

        </div>

      </div>

      {/* ========================================================== */}
      {/* ACTION CONTROLS HUD */}
      {/* ========================================================== */}
      <div className="relative sm:absolute sm:bottom-4 sm:left-4 mx-auto mt-2 sm:mt-0 w-full max-w-[300px] sm:w-auto bg-[#080d1a]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-500/30 flex flex-col gap-1.5 shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-30">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${activePlayer === 'green' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
            {activePlayer === 'green' ? 'GREEN\'S TURN (BOT)' : 'YOUR MOVE (RED)'}
          </span>
        </div>
        
        <button
          onClick={rollDice}
          disabled={activePlayer !== 'red' || hasRolled || isRolling || gameResult !== 'playing' || botIsThinking}
          className={`w-full py-1.5 font-extrabold tracking-widest uppercase font-display text-center rounded-xl transition-all border text-xs cursor-pointer ${
            activePlayer === 'red' && !hasRolled && !isRolling && gameResult === 'playing'
              ? 'bg-emerald-500/20 border-emerald-500 hover:bg-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-pulse'
              : 'bg-[#0f1524] border-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isRolling ? 'ROLLING...' : 'ROLL DICE'}
        </button>
      </div>

      {/* FLOATING LEADERBOARD PANEL */}
      <div className="relative sm:absolute sm:top-16 sm:right-4 mx-auto mt-2 sm:mt-0 w-full max-w-[300px] sm:w-auto sm:max-w-[160px] bg-[#090F1B]/95 backdrop-blur-md py-2.5 px-3.5 rounded-2xl border border-cyan-500/25 shadow-2xl space-y-2 z-30">
        <div className="flex justify-between items-center text-[8px] font-mono border-b border-cyan-500/15 pb-1">
          <span className="font-extrabold text-[9.5px] tracking-wide text-cyan-300">⚔️ LUDO MATCH</span>
        </div>

        <div className="flex justify-between items-center bg-[#050B14]/90 px-2 py-1 rounded-lg border border-slate-800">
          <span className="text-[7.5px] text-slate-500 font-black uppercase">STAKE POOL</span>
          <span className="text-[9.5px] text-[#FBBF24] font-black flex items-center gap-0.5">
            🪙 {entryFee}
          </span>
        </div>

        <div className="space-y-1 text-[8.5px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="truncate max-w-[60px] font-medium">{opponentName}</span>
            <span className="font-mono text-emerald-400 font-bold">Green</span>
          </div>
          <div className="flex items-center justify-between text-slate-350">
            <span className="truncate max-w-[60px] font-bold text-rose-300">You</span>
            <span className="font-mono text-cyan-400 font-bold">Red</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

// ==========================================================
// GLOSSY 3D PLASTIC PAWN (BLENDER RENDER STYLE)
// ==========================================================
const LudoPawn3D: React.FC<{ color: 'red' | 'green' | 'blue' | 'gold', isPlayable?: boolean, view3D?: boolean }> = ({ color, isPlayable, view3D }) => {
  const pawnColors = {
    red: {
      head: '#E52521',
      headLight: '#FF7D7A',
      collar: '#FFE5E5',
      bodyGrad: 'from-[#FF3B30] via-[#E52521] to-[#990D0D]',
      border: '#990D0D'
    },
    green: {
      head: '#009A44',
      headLight: '#55F292',
      collar: '#E5FFE9',
      bodyGrad: 'from-[#34C759] via-[#009A44] to-[#005425]',
      border: '#005425'
    },
    blue: {
      head: '#1B4EAB',
      headLight: '#6BA2FF',
      collar: '#E5EEFF',
      bodyGrad: 'from-[#007AFF] via-[#1B4EAB] to-[#092B70]',
      border: '#092B70'
    },
    gold: {
      head: '#FFCC00',
      headLight: '#FFF299',
      collar: '#FFFCE5',
      bodyGrad: 'from-[#FFD60A] via-[#FFCC00] to-[#997A00]',
      border: '#997A00'
    }
  };

  const style = pawnColors[color] || pawnColors.red;

  return (
    <div className="relative flex flex-col items-center justify-center w-6 h-8 sm:w-7 sm:h-9 cursor-pointer group">
      {/* 1. Oval drop shadow cast on board cell surface */}
      <div 
        className="absolute bottom-0 w-5 h-1.5 rounded-full blur-[0.8px] pointer-events-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', transform: view3D ? 'scaleY(0.5) translateY(3px)' : 'none' }}
      />

      {/* 2. Upright Standing 3D Halma Pawn Structure */}
      <motion.div 
        whileHover={isPlayable ? { scale: 1.3, y: -5 } : { scale: 1.12 }}
        className="relative flex flex-col items-center transition-all duration-300 z-20"
        style={{
          transform: view3D ? 'translateZ(24px) rotateX(-46deg) rotateY(22deg)' : 'none',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Pawn Sphere Head */}
        <div 
          className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border shadow-md z-20"
          style={{ 
            background: `radial-gradient(circle at 32% 32%, ${style.headLight}, ${style.head})`,
            borderColor: style.border
          }}
        >
          {/* Glossy specular reflection highlight */}
          <div className="absolute top-[2px] left-[2.5px] w-1.5 h-1.5 rounded-full bg-white/85 blur-[0.2px]" />
        </div>

        {/* Pawn Tapered Neck Ring Collar */}
        <div 
          className="w-2.5 h-1 -mt-0.5 rounded-full border-t border-b z-15 shadow-inner"
          style={{ backgroundColor: style.collar, borderColor: style.border }}
        />

        {/* Pawn Wide Conical Base / Skirt */}
        <div 
          className={`w-4.5 h-4.5 sm:w-5 sm:h-5 -mt-0.5 rounded-b-xl rounded-t-sm bg-gradient-to-b ${style.bodyGrad} border flex items-center justify-center shadow-lg relative overflow-hidden`}
          style={{ borderColor: style.border }}
        >
          {/* Vertical sheen highlight strip */}
          <div className="absolute top-0 left-1 w-1 h-full bg-white/40 skew-x-[-15deg] blur-[0.4px]" />
        </div>
      </motion.div>

      {/* Highlight ring for active playable token */}
      {isPlayable && (
        <span className="absolute bottom-0 w-6 h-6 rounded-full border-2 border-yellow-300 animate-ping pointer-events-none z-10" />
      )}
    </div>
  );
};

// ==========================================================
// TWO SEMI-TRANSLUCENT WHITE DICE (BLENDER 3D RENDER STYLE)
// ==========================================================
const SemiTranslucentWhiteDice: React.FC<{ value: number, isRolling: boolean }> = ({ value, isRolling }) => {
  const faceTransforms = [
    'rotateX(0deg) rotateY(0deg)',
    'rotateY(180deg)',
    'rotateX(-90deg)',
    'rotateX(90deg)',
    'rotateY(-90deg)',
    'rotateY(90deg)'
  ];
  
  const style = {
    transform: isRolling
      ? 'rotateX(720deg) rotateY(1440deg) rotateZ(365deg)'
      : `${faceTransforms[value - 1]} rotateX(15deg) rotateY(-10deg)`,
    transition: isRolling ? 'transform 1s linear infinite' : 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
  };

  const renderDots = (num: number) => {
    const dotsMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };
    const activeDots = dotsMap[num] || [4];
    return (
      <div className="grid grid-cols-3 gap-1 w-full h-full p-1.5">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activeDots.includes(i) && (
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-950 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-8 h-8 sm:w-9 sm:h-9" style={{ perspective: '300px' }}>
      <div 
        className="relative w-full h-full transition-transform duration-700" 
        style={{ ...style, transformStyle: 'preserve-3d' }}
      >
        {/* Semi-translucent frosted white acrylic dice faces with rounded corners */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.4),0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center backface-hidden" style={{ transform: 'translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(5)}
        </div>
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.4),0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(180deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(2)}
        </div>
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.4),0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateX(90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(3)}
        </div>
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.4),0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateX(-90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(4)}
        </div>
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.4),0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(-90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(1)}
        </div>
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.4),0_0_12px_rgba(255,255,255,0.4)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(6)}
        </div>
      </div>
    </div>
  );
};
