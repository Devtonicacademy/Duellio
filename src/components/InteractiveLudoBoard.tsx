/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, ShieldCheck, Trophy, RotateCcw, HelpCircle, Eye, EyeOff } from 'lucide-react';

interface InteractiveLudoBoardProps {
  entryFee: number;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winnerIsMe: boolean) => void;
  onAddLog: (log: string) => void;
  botDifficulty?: 'easy' | 'medium' | 'hard';
}

interface LudoToken {
  id: string;
  color: 'red' | 'green' | 'blue' | 'gold';
  position: number; // -1 means home base, 0 to 51 is the common path, 52-57 is the home runway
  status: 'home' | 'board' | 'finished';
}

// 15x15 grid coordinates mapping for typical Ludo path cell indexes (0 to 51)
const PATH_COORDINATES: Array<[number, number]> = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0]
];

// Start paths and indices
const RED_START_INDEX = 0;
const GREEN_START_INDEX = 26;

// Safe spaces (stars) index in general map
const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// Decorative static tokens for non-player colors (to mirror visual depth of the reference image)
const DECORATIVE_TOKENS = [
  { id: 'blue_1', color: 'blue' as const, position: 10, status: 'board' as const },
  { id: 'blue_2', color: 'blue' as const, position: -1, status: 'home' as const },
  { id: 'gold_1', color: 'gold' as const, position: 35, status: 'board' as const },
  { id: 'gold_2', color: 'gold' as const, position: -1, status: 'home' as const },
];

export const InteractiveLudoBoard: React.FC<InteractiveLudoBoardProps> = ({
  entryFee,
  opponentName,
  opponentAvatar,
  onGameOver,
  onAddLog,
  botDifficulty
}) => {
  // Game mode configuration
  const [view3D, setView3D] = useState<boolean>(true);

  // Playable tokens: Red (User) vs Green (Bot)
  const [tokens, setTokens] = useState<LudoToken[]>([
    { id: 'red_1', color: 'red', position: -1, status: 'home' },
    { id: 'red_2', color: 'red', position: -1, status: 'home' },
    { id: 'green_1', color: 'green', position: -1, status: 'home' },
    { id: 'green_2', color: 'green', position: -1, status: 'home' }
  ]);

  const [activePlayer, setActivePlayer] = useState<'red' | 'green'>('green'); // Matches image: Green's Turn first
  const [diceRollValue, setDiceRollValue] = useState<number>(5);
  const [secondDiceValue, setSecondDiceValue] = useState<number>(3); // Double dice like the image
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [gameResult, setGameResult] = useState<'playing' | 'red_won' | 'green_won'>('playing');
  const [botIsThinking, setBotIsThinking] = useState<boolean>(false);
  const [showHelperRules, setShowHelperRules] = useState<boolean>(false);

  // Auto Bot trigger on startup if it's Bot's turn
  useEffect(() => {
    if (activePlayer === 'green' && gameResult === 'playing' && !botIsThinking) {
      triggerBotTurn();
    }
  }, [activePlayer]);

  const rollDice = () => {
    if (isRolling || hasRolled || gameResult !== 'playing' || activePlayer !== 'red' || botIsThinking) return;

    setIsRolling(true);
    onAddLog(`[DICE SEED] Dispatching crypto-secure random integer from validation engine.`);
    
    setTimeout(() => {
      const outcome1 = Math.floor(Math.random() * 6) + 1;
      const outcome2 = Math.floor(Math.random() * 6) + 1;
      setDiceRollValue(outcome1);
      setSecondDiceValue(outcome2);
      setIsRolling(false);
      setHasRolled(true);
      
      const totalSteps = outcome1; // We'll use the main dice for Ludo mechanics
      onAddLog(`[DICE SEED] Generated outcomes: ${outcome1} & ${outcome2}`);

      // Check consecutive sixes rule
      if (totalSteps === 6) {
        const nextSixes = consecutiveSixes + 1;
        onAddLog(`[ROLL-SIX METER] Existing consecutive sixes count: ${consecutiveSixes}`);
        
        if (nextSixes >= 3) {
          setConsecutiveSixes(0);
          setHasRolled(false);
          setActivePlayer('green');
          onAddLog(`[ROLL-SIX METER] Max sixes limit reached (3 consecutive sixes). Pass turn.`);
          return;
        } else {
          setConsecutiveSixes(nextSixes);
        }
      } else {
        setConsecutiveSixes(0);
      }

      // Check if player has moves available
      const playable = tokens.filter(t => t.color === 'red' && canMoveToken(t, totalSteps));
      if (playable.length === 0) {
        onAddLog(`[TURN GUARD] No valid moves available for Red with dice roll ${totalSteps}. Passing turn.`);
        setTimeout(() => {
          setActivePlayer('green');
          setHasRolled(false);
        }, 1200);
      }
    }, 1200);
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
        }, 1100);
        return;
      }

      // Heuristic select token
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
      }, 1000);

    }, 1500);
  };

  const canMoveToken = (token: LudoToken, roll: number): boolean => {
    if (token.status === 'finished') return false;
    if (token.status === 'home') {
      return roll === 6 || roll === 5; // Standard 5 or 6 to release from yard
    }
    const currentPos = token.position;
    if (currentPos + roll > 57) {
      return false; // must land exactly on the finish cell
    }
    return true;
  };

  const handleSelectToken = (token: LudoToken) => {
    if (activePlayer !== 'red' || !hasRolled || !canMoveToken(token, diceRollValue) || gameResult !== 'playing') return;
    onAddLog(`[USER TOKEN SELECT] Moving token ${token.id.toUpperCase()} by ${diceRollValue} tiles.`);
    executeTokenMovement(token.id, diceRollValue, 'red');
  };

  const executeTokenMovement = (tokenId: string, steps: number, playerColor: 'red' | 'green') => {
    setTokens(prev => {
      let isCaptured = false;
      const updated = prev.map(t => {
        if (t.id !== tokenId) return t;

        let nextPos = t.position;
        let nextStatus = t.status;

        if (t.status === 'home') {
          nextPos = playerColor === 'red' ? RED_START_INDEX : GREEN_START_INDEX;
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
      if (movingToken.status === 'board') {
        const isSafeSpace = SAFE_INDICES.includes(movingToken.position);
        const collided = updated.find(t => 
          t.color !== movingToken.color && 
          t.status === 'board' && 
          t.position === movingToken.position
        );

        if (collided) {
          if (isSafeSpace) {
            onAddLog(`[GRID COLLISION] Safe zone immunity. No capture.`);
          } else {
            onAddLog(`[GRID COLLISION] Capture! Opponent piece ${collided.id.toUpperCase()} returned to home base.`);
            collided.position = -1;
            collided.status = 'home';
            isCaptured = true;
          }
        }
      }

      // Win Checks
      const redFinished = updated.filter(t => t.color === 'red' && t.status === 'finished').length;
      const greenFinished = updated.filter(t => t.color === 'green' && t.status === 'finished').length;

      if (redFinished === 2) {
        setGameResult('red_won');
        onAddLog(`[LUDO VICTORY] You win the match!`);
        setTimeout(() => onGameOver(true), 3000);
      } else if (greenFinished === 2) {
        setGameResult('green_won');
        onAddLog(`[LUDO LOSS] Green opponent wins the match!`);
        setTimeout(() => onGameOver(false), 3000);
      }

      return updated;
    });

    setHasRolled(false);
    if (steps === 6 && gameResult === 'playing') {
      onAddLog(`[ROLL-SIX BONUS] Roll of 6 grants extra turn. Roll again!`);
    } else {
      setActivePlayer(playerColor === 'red' ? 'green' : 'red');
    }
  };

  // Convert coordinate [r, c] into correct CSS cell class according to our elegant cyberpunk board
  const getCellTheme = (r: number, c: number): string => {
    // Green camp bounds (top-left)
    if (r < 6 && c < 6) return 'bg-[#051C1A]/70 border-[#10b981]/15';
    // Red camp (top-right)
    if (r < 6 && c > 8) return 'bg-[#1C0508]/70 border-[#ef4444]/15';
    // Gold camp (bottom-right)
    if (r > 8 && c > 8) return 'bg-[#1C1605]/70 border-[#f59e0b]/15';
    // Blue camp (bottom-left)
    if (r > 8 && c < 6) return 'bg-[#05111C]/70 border-[#06b6d4]/15';

    // Pathways
    return 'bg-[#0b1329]/50 border-cyan-500/10';
  };

  // Check if position matches safe spots
  const isSafeCoord = (r: number, c: number): boolean => {
    return SAFE_INDICES.some(idx => {
      const coord = PATH_COORDINATES[idx];
      return coord && coord[0] === r && coord[1] === c;
    });
  };

  // Renders the glowing 3D cylindrical token
  const renderTokenItem = (token: LudoToken | typeof DECORATIVE_TOKENS[0], isDecoration = false) => {
    const isMine = token.color === 'red';
    const isPlayable = !isDecoration && isMine && hasRolled && canMoveToken(token as LudoToken, diceRollValue);

    const tokenColors = {
      green: {
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.8)]',
        border: 'border-emerald-400',
        bg: 'from-emerald-500 to-emerald-700/60',
        laserGlow: 'bg-emerald-400/20'
      },
      red: {
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.8)]',
        border: 'border-rose-500',
        bg: 'from-rose-500 to-rose-700/60',
        laserGlow: 'bg-rose-500/20'
      },
      blue: {
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.8)]',
        border: 'border-cyan-400',
        bg: 'from-cyan-500 to-cyan-700/60',
        laserGlow: 'bg-cyan-400/20'
      },
      gold: {
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.8)]',
        border: 'border-amber-400',
        bg: 'from-amber-500 to-amber-700/60',
        laserGlow: 'bg-amber-400/20'
      }
    };

    const style = tokenColors[token.color] || tokenColors.green;

    return (
      <motion.div
        key={token.id}
        onClick={() => !isDecoration && handleSelectToken(token as LudoToken)}
        whileHover={isPlayable ? { scale: 1.3, y: -5 } : { scale: 1.1 }}
        style={{ transform: view3D ? 'translateZ(18px)' : 'none', transformStyle: 'preserve-3d' }}
        className={`relative w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border ${style.border} ${style.glow} transition-colors z-30`}
      >
        {/* Transparent physical cylinders body effect */}
        <div className={`absolute inset-[2px] rounded-full bg-gradient-to-t ${style.bg} flex items-center justify-center`}>
          <span className="text-white text-[12px] font-extrabold font-display tracking-tight text-shadow-[0_0_4px_rgba(255,255,255,1)]">D</span>
        </div>

        {/* Glossy glare overlay representing the 3D acrylic shine of the cylinders */}
        <div className="absolute top-[2px] left-[5px] w-4.5 h-2 bg-white/40 rounded-full rotate-[-15deg] blur-[0.4px] pointer-events-none" />

        {/* Highlight ring for active plays */}
        {isPlayable && (
          <span className="absolute -inset-1 rounded-full border border-emerald-400/80 animate-ping" />
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative min-h-[460px] sm:min-h-[580px] bg-[#03060E] rounded-2xl sm:rounded-3xl overflow-hidden border border-cyan-500/30 p-1 sm:p-2.5 font-sans flex flex-col justify-between shadow-[0_25px_60px_rgba(0,0,0,0.8)] select-none">
      
      {/* Background neon visual line decors exactly mirroring the screenshot */}
      <div className="absolute top-2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent pointer-events-none" />
      <div className="absolute top-12 left-12 w-32 h-2.5 bg-cyan-400/10 rounded-full blur-[10px] rotate-[15deg] animate-pulse pointer-events-none" />

      {/* VIEWPORT HEADER CONTROLS */}
      <div className="flex justify-between items-center px-6 pt-5 pb-2 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-[#091522] rounded-lg border border-cyan-500/25 flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DUELLIO ENCRYPTED MATCHMAKER v1.1.0</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelperRules(!showHelperRules)}
            className="p-1.5 bg-[#090F1B]/90 hover:bg-neutral-900 border border-slate-800 text-slate-450 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1 font-mono uppercase"
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
            className="absolute top-16 left-6 right-6 bg-[#070D18]/95 backdrop-blur-md border border-cyan-500/40 p-4.5 rounded-2xl text-xs text-slate-350 space-y-2 z-40"
          >
            <h4 className="font-display font-black text-white uppercase text-sm tracking-wider">Duellio Cyber-Ludo Contract rules</h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 font-mono text-[11px]">
              <li>You control the <span className="text-rose-400 font-bold">RED Cylinder</span>. Bot adversary runs the <span className="text-emerald-400 font-bold">GREEN Cylinder</span>.</li>
              <li>A dice roll outcome of <span className="text-cyan-300 font-bold">5 or 6</span> releases your acrylic token from home base onto index start 0.</li>
              <li>Land directly on an opponent's cell coordinates to capture their core piece, sending them back to base (excluding Safe Space Stars).</li>
              <li>First player to navigate all pieces to the center Duellio home shield claims the <span className="text-yellow-400 font-bold">🪙 {entryFee * 2} Coins</span> prize database pool!</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* CORE 3D ARENA VIEWPORT FRAME */}
      {/* ========================================================== */}
      <div className="relative w-full flex-1 flex items-center justify-center pb-20 pt-2 transition-all duration-700">
        
        <div 
          className="relative transition-all duration-1000 ease-out flex items-center justify-center"
          style={{
            transform: view3D 
              ? 'perspective(1000px) rotateX(44deg) rotateZ(-22deg) translateY(-3%) translateX(1%) scale(0.95)' 
              : 'perspective(1000px) rotateX(0deg) rotateZ(0deg) translateY(0) translateX(0) scale(1)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Holographic grid matrix projection underneath the board */}
          {view3D && (
            <div className="absolute inset-[-40px] bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] pointer-events-none" />
          )}

          {/* ========================================================== */}
          {/* THE 3D LUDO BOARD CANVAS */}
          {/* ========================================================== */}
          <div 
            className="relative w-[380px] h-[380px] bg-[#070D18]/95 rounded-[28px] border border-cyan-500/35 p-1.5 flex flex-col justify-between shadow-[0_30px_70px_rgba(0,0,0,0.8),0_0_35px_rgba(6,182,212,0.15)] ludo-board-container"
            style={{ transform: view3D ? 'translateZ(10px)' : 'none', transformStyle: 'preserve-3d' }}
          >
            {/* Ambient inner neon board glow lines */}
            <div className="absolute inset-0 rounded-[28px] border border-emerald-500/10 pointer-events-none" />

            {/* Custom Grid quadrants matching standard Ludo structure but meticulously stylized */}
            <div className="grid grid-cols-2 gap-2 w-full h-full">

              {/* [TOP-LEFT] GREEN CAMP base */}
              <div className="bg-[#051C1A] rounded-2xl border border-emerald-500/25 p-3 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-1 right-1 w-6 h-6 border-t border-r border-emerald-500/20 rounded-tr-md" />
                <div className="w-full text-[7px] font-mono font-bold text-emerald-400/40 tracking-widest uppercase">SECURE_A</div>
                
                {/* Central Shield Vector Icon exactly representing the shield artwork in source image */}
                <div className="flex-1 flex items-center justify-center opacity-40">
                  <svg className="w-14 h-14 text-emerald-500/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <circle cx="12" cy="11" r="3" />
                    <line x1="12" y1="5" x2="12" y2="17" />
                  </svg>
                </div>

                {/* Render active Bot green pieces inside yard */}
                <div className="absolute inset-0 flex items-center justify-center gap-4.5">
                  {tokens.filter(t => t.color === 'green' && t.status === 'home').map(t => (
                    renderTokenItem(t)
                  ))}
                </div>
              </div>

              {/* [TOP-RIGHT] RED CAMP (User target camp) */}
              <div className="bg-[#1C0508]/90 rounded-2xl border border-rose-500/20 p-3 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-1 left-1 w-6 h-6 border-t border-l border-rose-500/20 rounded-tl-md" />
                <div className="w-full text-[7px] font-mono font-bold text-rose-500/40 tracking-widest uppercase">REGION_B</div>
                
                <div className="flex-1 flex items-center justify-center opacity-40">
                  <svg className="w-14 h-14 text-rose-500/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <circle cx="12" cy="11" r="3" />
                  </svg>
                </div>

                {/* Main player active/standby pieces inside yard */}
                <div className="absolute inset-0 flex items-center justify-center gap-4.5">
                  {tokens.filter(t => t.color === 'red' && t.status === 'home').map(t => (
                    renderTokenItem(t)
                  ))}
                </div>
              </div>

              {/* [BOTTOM-LEFT] BLUE CAMP (Decorative) */}
              <div className="bg-[#05111C]/90 rounded-2xl border border-cyan-500/20 p-3 flex flex-col justify-between relative overflow-hidden">
                <div className="w-full text-[7px] font-mono font-bold text-cyan-400/30 tracking-widest uppercase">STATION_D</div>
                
                <div className="flex-1 flex items-center justify-center opacity-30">
                  <svg className="w-14 h-14 text-cyan-500/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>

                {/* Decorative inactive standing blue pieces */}
                <div className="absolute inset-0 flex items-center justify-center gap-4.5">
                  {DECORATIVE_TOKENS.filter(t => t.color === 'blue' && t.status === 'home').map(t => (
                    renderTokenItem(t, true)
                  ))}
                </div>
              </div>

              {/* [BOTTOM-RIGHT] GOLD/YELLOW CAMP */}
              <div className="bg-[#1C1605]/95 rounded-2xl border border-amber-500/20 p-3 flex flex-col justify-between relative overflow-hidden">
                <div className="w-full text-[7px] font-mono font-bold text-amber-400/35 tracking-widest uppercase">REGIMENT_C</div>
                
                <div className="flex-1 flex items-center justify-center opacity-40">
                  <svg className="w-14 h-14 text-amber-500/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </div>

                {/* Decorative inactive standing golden pieces */}
                <div className="absolute inset-0 flex items-center justify-center gap-4.5">
                  {DECORATIVE_TOKENS.filter(t => t.color === 'gold' && t.status === 'home').map(t => (
                    renderTokenItem(t, true)
                  ))}
                </div>
              </div>

            </div>

            {/* ========================================================== */}
            {/* LUDO CIRCUITS PATH CHANNELS ON GRID */}
            {/* ========================================================== */}
            {/* Left side green entrance track (As pictured in image with glowing rings) */}
            <div className="absolute top-[148px] left-[15px] flex items-center gap-2 z-20">
              <span className="w-5 h-5 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[7px] text-cyan-300 font-mono">1</span>
              
              {/* Highlight path trail arc */}
              <div className="relative">
                <span className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.6)] border border-emerald-400 flex items-center justify-center" />
                <span className="absolute -inset-0.5 rounded-full border border-emerald-400/40 animate-ping pointer-events-none" />
              </div>
              
              <span className="w-5 h-5 rounded-full bg-[#05111C] border border-cyan-550/30" />
            </div>

            {/* Right side yellow entry row */}
            <div className="absolute bottom-[148px] right-[15px] flex items-center gap-2 z-20">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/45" />
              <span className="w-5 h-5 rounded-full bg-[#070D18] border border-cyan-550/30" />
              <span className="w-5 h-5 rounded-full bg-[#070D18] border border-cyan-550/30" />
            </div>

            {/* Render any Active Token pieces floating on the path spaces */}
            {tokens.map(token => {
              if (token.status !== 'board') return null;
              // Map Ludo index to coordinate pixels
              const coord = PATH_COORDINATES[token.position];
              if (!coord) return null;
              
              // Calculate rough percent alignment
              const leftPercent = 5 + (coord[1] / 14) * 82;
              const topPercent = 5 + (coord[0] / 14) * 82;

              return (
                <div 
                  key={token.id}
                  className="absolute z-30 transition-all duration-500 ease-out" 
                  style={{ 
                    left: `${leftPercent}%`, 
                    top: `${topPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {renderTokenItem(token)}
                </div>
              );
            })}

            {/* Render Decorative extra components to perfectly replicate the image's layout */}
            {DECORATIVE_TOKENS.map(dec => {
              if (dec.status !== 'board') return null;
              const coord = PATH_COORDINATES[dec.position];
              if (!coord) return null;
              const leftPercent = 5 + (coord[1] / 14) * 82;
              const topPercent = 5 + (coord[0] / 14) * 82;

              return (
                <div 
                  key={dec.id}
                  className="absolute z-20" 
                  style={{ 
                    left: `${leftPercent}%`, 
                    top: `${topPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {renderTokenItem(dec, true)}
                </div>
              );
            })}

            {/* Curved trajectory laser arc as pictured in original artwork */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-75" viewBox="0 0 100 100">
              <path 
                d="M 18,52 Q 33,48 45,45" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="1.3" 
                strokeDasharray="2,2" 
                className="animate-pulse"
              />
              <path 
                d="M 33,54 C 42,50 43,46 51,46" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="0.8" 
                className="opacity-45"
              />
            </svg>

            {/* ========================================================== */}
            {/* THE CENTRAL PYRAMID DUEL SHIELD HOMLAND */}
            {/* ========================================================== */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#03060C] border border-cyan-500/65 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.3)] overflow-hidden z-20">
              <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(16,185,129,0.18)_0%,transparent_85%]" />
              
              {/* Crossed Swords Shield Emblem exactly mirroring picture */}
              <svg className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
              
              <span className="text-[11px] font-extrabold text-white tracking-[0.25em] font-display mt-2">DUELLIO</span>
              <span className="text-[6.5px] font-mono text-cyan-400 tracking-[0.15em] mt-0.5 uppercase">CYBER SYSTEMS</span>
            </div>

          </div>

          {/* ========================================================== */}
          {/* THE 3D PHYSICS-BASED METALLIC DICE (FOIL EMBOSSED) */}
          {/* ========================================================== */}
          {/* Dice 1 (representing high value roll 5 / active tilt angle from screenshot) */}
          <div 
            className="absolute bottom-[-15px] right-[100px] z-30"
            style={{
              transform: view3D 
                ? 'translateZ(48px) rotateX(25deg) rotateY(-30deg) rotateZ(35deg)' 
                : 'none',
              transformStyle: 'preserve-3d'
            }}
          >
            <ThreeDDice value={diceRollValue} isRolling={isRolling} />
          </div>

          {/* Dice 2 (secondary detail matching tilted bottom right dice in screenshot) */}
          <div 
            className="absolute bottom-[-5px] right-[40px] z-30"
            style={{
              transform: view3D 
                ? 'translateZ(35px) rotateX(-20deg) rotateY(42deg) rotateZ(-12deg)' 
                : 'none',
              transformStyle: 'preserve-3d'
            }}
          >
            <ThreeDDice value={secondDiceValue} isRolling={isRolling} />
          </div>

        </div>

      </div>

      {/* ========================================================== */}
      {/* GLOWING ACTION CONTROLS HUD (Bottom Left) */}
      {/* ========================================================== */}
      <div className="relative sm:absolute sm:bottom-5 sm:left-5 mx-auto mt-4 sm:mt-0 w-full max-w-[320px] sm:w-auto sm:max-w-none bg-[#080d1a]/95 backdrop-blur-md px-4.5 py-3 rounded-2xl border border-emerald-500/30 flex flex-col gap-1.5 shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-30 min-w-[150px]">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${activePlayer === 'green' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
            {activePlayer === 'green' ? 'GREEN\'S TURN' : 'YOUR MOVE (RED)'}
          </span>
        </div>
        
        {/* Physical Roll controller button */}
        <button
          onClick={rollDice}
          disabled={activePlayer !== 'red' || hasRolled || isRolling || gameResult !== 'playing' || botIsThinking}
          className={`w-full py-1.5 font-extrabold tracking-widest uppercase font-display text-center rounded-xl transition-all border text-xs cursor-pointer ${
            activePlayer === 'red' && !hasRolled && !isRolling && gameResult === 'playing'
              ? 'bg-emerald-500/15 border-emerald-500 hover:bg-emerald-500/25 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-pulse'
              : 'bg-[#0f1524] border-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isRolling ? 'ROLLING...' : 'ROLL'}
        </button>
      </div>

      {/* ========================================================== */}
      {/* FLOATING LEADERBOARD SPECTATOR PANEL (Top Right) */}
      {/* ========================================================== */}
      <div className="relative sm:absolute sm:top-18 sm:right-5 mx-auto mt-4 sm:mt-0 w-full max-w-[320px] sm:w-auto sm:max-w-[170px] bg-[#090F1B]/95 backdrop-blur-md py-3 px-4 rounded-2xl border border-cyan-500/25 shadow-2xl space-y-2.5 z-30">
        <div className="flex justify-between items-center text-[8px] font-mono border-b border-cyan-500/15 pb-1.5">
          <span className="font-extrabold text-[10px] tracking-wide text-cyan-300">⚔️ DUEL RANK: 5</span>
        </div>

        {/* Stake Wallet */}
        <div className="flex justify-between items-center bg-[#050B14]/90 px-2 py-1 rounded-lg border border-slate-800">
          <span className="text-[7.5px] text-slate-500 font-black uppercase">STAKE POOL</span>
          <span className="text-[10px] text-[#FBBF24] font-black flex items-center gap-0.5">
            🪙 {entryFee} Coins
          </span>
        </div>

        {/* Rows exactly mirroring columns shown in top banner HUD */}
        <div className="space-y-1.5 pt-0.5 text-[9px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="truncate max-w-[65px] font-medium">Green Boss</span>
            <span className="font-mono text-emerald-400 font-bold">1st (Active)</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="truncate max-w-[65px] font-medium">Meral</span>
            <span className="font-mono text-slate-500 font-medium">Rank 2</span>
          </div>
          <div className="flex items-center justify-between text-slate-350">
            <span className="truncate max-w-[65px] font-bold text-rose-300">You (Red)</span>
            <span className="font-mono text-cyan-400 font-bold">Playing</span>
          </div>
        </div>
      </div>

      {/* Bottom overlay status gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

// Sub-component rendering physical-looking 3D Cubes
const ThreeDDice: React.FC<{ value: number, isRolling: boolean }> = ({ value, isRolling }) => {
  // Rotate facing coordinates smoothly
  const faceTransforms = [
    'rotateX(0deg) rotateY(0deg)',   // 1
    'rotateY(180deg)',              // 2
    'rotateX(-90deg)',             // 3
    'rotateX(90deg)',              // 4
    'rotateY(-90deg)',             // 5
    'rotateY(90deg)'               // 6
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
      <div className="grid grid-cols-3 gap-1 w-full h-full p-2">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activeDots.includes(i) && (
              <div className="w-1.5 h-1.5 rounded-full bg-slate-100 shadow-[0_0_3px_rgba(255,255,255,0.9)]" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-9 h-9" style={{ perspective: '300px' }}>
      <div 
        className="relative w-full h-full transition-transform duration-700" 
        style={{ ...style, transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div className="absolute inset-0 bg-[#1E2530] border-2 border-slate-700/80 rounded-lg shadow-md flex items-center justify-center backface-hidden" style={{ transform: 'translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(5)}
        </div>
        {/* Back */}
        <div className="absolute inset-0 bg-[#1E2530] border-2 border-slate-700/80 rounded-lg shadow-md flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(180deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(2)}
        </div>
        {/* Top */}
        <div className="absolute inset-0 bg-[#1E2530] border-2 border-slate-700/80 rounded-lg shadow-md flex items-center justify-center backface-hidden" style={{ transform: 'rotateX(90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(3)}
        </div>
        {/* Bottom */}
        <div className="absolute inset-0 bg-[#1E2530] border-2 border-slate-700/80 rounded-lg shadow-md flex items-center justify-center backface-hidden" style={{ transform: 'rotateX(-90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(4)}
        </div>
        {/* Left */}
        <div className="absolute inset-0 bg-[#1E2530] border-2 border-slate-700/80 rounded-lg shadow-md flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(-90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(1)}
        </div>
        {/* Right */}
        <div className="absolute inset-0 bg-[#1E2530] border-2 border-slate-700/80 rounded-lg shadow-md flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(6)}
        </div>

        {/* Back-shield emblem detail engraved on side */}
        <div className="absolute inset-[2.5px] bg-[#0F131A] border border-slate-800 rounded-md flex items-center justify-center opacity-90 pointer-events-none" style={{ transform: 'rotateY(90deg) translateZ(17.8px)' }}>
          <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
