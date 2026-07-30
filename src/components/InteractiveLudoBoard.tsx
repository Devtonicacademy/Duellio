/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, HelpCircle, Eye, EyeOff, Sparkles, Star, Users, UserCheck, CheckCircle2, RotateCcw, ArrowRight, Trophy, AlertTriangle, Award } from 'lucide-react';
import {
  createInitialGameState,
  handleDiceRoll,
  executeMove,
  getLegalMoves,
  rollDie,
  getTokenCell,
  SAFE_COORDS,
  PATH_COORDINATES,
  LudoGameState,
  LudoTokenState,
  PlayerColor
} from '../utils/ludoEngine';

import { Ludo3DCanvas } from './Ludo3DCanvas';

interface InteractiveLudoBoardProps {
  entryFee: number;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winnerIsMe: boolean) => void;
  onAddLog: (log: string) => void;
  onReMatch?: () => void;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  isBot?: boolean;
  sessionId?: string;
  isHost?: boolean;
  liveGameState?: any;
  onUpdateLiveState?: (newState: any) => void;
  initialMode?: '2-player' | '4-player';
}

export const InteractiveLudoBoard: React.FC<InteractiveLudoBoardProps> = ({
  entryFee,
  opponentName,
  opponentAvatar,
  onGameOver,
  onAddLog,
  onReMatch,
  botDifficulty,
  isBot = true,
  sessionId,
  isHost = true,
  liveGameState,
  onUpdateLiveState,
  initialMode
}) => {
  const [view3D, setView3D] = useState<boolean>(true);
  const [playerMode, setPlayerMode] = useState<'2-player' | '4-player'>(initialMode || '2-player');
  const [userSelectedQuadrant, setUserSelectedQuadrant] = useState<'all' | 'red' | 'gold'>('all');

  // Authoritative Ludo Game State
  const [engineState, setEngineState] = useState<LudoGameState>(() => {
    if (liveGameState?.engineState) return liveGameState.engineState;
    return createInitialGameState(['red', 'blue', 'green', 'gold']);
  });

  const handlePlayAgain = () => {
    if (onReMatch) {
      onReMatch();
    }
    const freshEngine = createInitialGameState(['red', 'blue', 'green', 'gold']);
    setEngineState(freshEngine);
    if (!isBot && onUpdateLiveState) {
      onUpdateLiveState({ engineState: freshEngine });
    }
    setHasRolled(false);
    setIsRolling(false);
    setBotIsThinking(false);
    onAddLog(`[REMATCH] Ludo Board re-initialized! Stakes locked for next round.`);
  };

  const [secondDiceValue, setSecondDiceValue] = useState<number>(3);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [botIsThinking, setBotIsThinking] = useState<boolean>(false);
  const [showHelperRules, setShowHelperRules] = useState<boolean>(false);

  const activePlayer = engineState.players[engineState.activePlayerIndex];
  const diceRollValue = engineState.currentDiceValue || 6;
  const gameResult = engineState.winner ? `${engineState.winner}_won` : 'playing';

  // Determine whether current turn color belongs to the Human User
  const isUserTurn = (color: PlayerColor): boolean => {
    if (playerMode === '2-player') {
      return color === 'red' || color === 'gold';
    }
    return color === 'red';
  };

  const playableTokenIds = (hasRolled && isUserTurn(activePlayer) && engineState.currentDiceValue !== null)
    ? getLegalMoves(engineState, activePlayer, engineState.currentDiceValue)
        .filter(m => {
          if (playerMode === '2-player' && userSelectedQuadrant !== 'all') {
            const t = engineState.tokens.find(tok => tok.id === m.tokenId);
            return t?.color === userSelectedQuadrant;
          }
          return true;
        })
        .map(m => m.tokenId)
    : [];

  // Sync logs back to parent container
  useEffect(() => {
    if (engineState.logs.length > 0) {
      onAddLog(engineState.logs[0]);
    }
  }, [engineState.logs, onAddLog]);

  // Sync live state for Firestore / multiplayer
  useEffect(() => {
    if (!isBot && liveGameState?.engineState) {
      setEngineState(liveGameState.engineState);
      if (liveGameState.engineState.winner) {
        const isWinner = liveGameState.engineState.winner === 'red' || (playerMode === '2-player' && liveGameState.engineState.winner === 'gold');
        onGameOver(isWinner);
      }
    }
  }, [liveGameState, isBot, playerMode, onGameOver]);

  // Auto Bot Trigger
  useEffect(() => {
    if (isBot && !isUserTurn(activePlayer) && engineState.gameStatus === 'playing' && !botIsThinking && !isRolling) {
      triggerBotMove(activePlayer);
    }
  }, [activePlayer, isBot, playerMode, engineState.gameStatus, botIsThinking, isRolling]);

  const rollDice = () => {
    if (isRolling || hasRolled || engineState.gameStatus !== 'playing' || !isUserTurn(activePlayer) || botIsThinking) return;

    setIsRolling(true);
    
    setTimeout(() => {
      const outcome1 = rollDie();
      const outcome2 = rollDie();
      setSecondDiceValue(outcome2);
      setIsRolling(false);

      // Pass roll to Authoritative Game Engine
      const nextState = handleDiceRoll(engineState, outcome1);
      setEngineState(nextState);

      const legalMoves = getLegalMoves(nextState, activePlayer, outcome1);
      
      if (legalMoves.length === 0 || nextState.consecutiveSixes === 0 && outcome1 === 6 && nextState.turnStartState === null) {
        // Triple six penalty or no moves -> turn auto-resolved
        setHasRolled(false);
      } else {
        setHasRolled(true);
      }

      if (!isBot && onUpdateLiveState) {
        onUpdateLiveState({ engineState: nextState });
      }
    }, 300);
  };

  const triggerBotMove = (colorToPlay: PlayerColor) => {
    setBotIsThinking(true);
    setIsRolling(true);
    
    setTimeout(() => {
      const outcome1 = rollDie();
      const outcome2 = rollDie();
      setSecondDiceValue(outcome2);
      setIsRolling(false);

      const rolledState = handleDiceRoll(engineState, outcome1);
      setEngineState(rolledState);

      const legalMoves = getLegalMoves(rolledState, colorToPlay, outcome1);

      if (legalMoves.length === 0) {
        setHasRolled(false);
        setBotIsThinking(false);
        return;
      }

      const isHard = botDifficulty === 'hard' || entryFee > 0;
      let selectedMove = legalMoves[0];

      if (isHard) {
        const captureMove = legalMoves.find(m => m.isCapture);
        const homeFinishMove = legalMoves.find(m => m.isHomeFinish);
        const exitBaseMove = legalMoves.find(m => m.isLeavingBase);

        selectedMove = captureMove || homeFinishMove || exitBaseMove || legalMoves[0];
      }

      setTimeout(() => {
        try {
          const movedState = executeMove(rolledState, selectedMove.tokenId, outcome1);
          setEngineState(movedState);

          if (movedState.winner) {
            const isMeWin = movedState.winner === 'red' || (playerMode === '2-player' && movedState.winner === 'gold');
            onGameOver(isMeWin);
          }
        } catch (e) {
          console.error("Bot move execution error:", e);
        }

        setHasRolled(false);
        setBotIsThinking(false);
      }, 500);

    }, 600);
  };

  const isTokenPlayable = (token: LudoTokenState): boolean => {
    if (!hasRolled || isRolling || engineState.gameStatus !== 'playing' || botIsThinking) return false;
    if (!isUserTurn(activePlayer)) return false;

    if (playerMode === '2-player') {
      if (token.color !== 'red' && token.color !== 'gold') return false;
      if (userSelectedQuadrant !== 'all' && token.color !== userSelectedQuadrant) return false;
    } else {
      if (token.color !== activePlayer) return false;
    }

    if (engineState.currentDiceValue === null) return false;
    const legalMoves = getLegalMoves(engineState, token.color, engineState.currentDiceValue);
    return legalMoves.some(m => m.tokenId === token.id);
  };

  const handleSelectToken = (token: LudoTokenState) => {
    if (!isTokenPlayable(token) || engineState.currentDiceValue === null) return;

    try {
      const nextState = executeMove(engineState, token.id, engineState.currentDiceValue);
      setEngineState(nextState);
      setHasRolled(false);

      if (nextState.winner) {
        const isMeWin = nextState.winner === 'red' || (playerMode === '2-player' && nextState.winner === 'gold');
        onGameOver(isMeWin);
      }

      if (!isBot && onUpdateLiveState) {
        onUpdateLiveState({ engineState: nextState });
      }
    } catch (e) {
      console.error("Move execution error:", e);
    }
  };

  return (
    <div className="relative min-h-[540px] sm:min-h-[660px] bg-[radial-gradient(ellipse_at_center,#3b2216_0%,#180d07_100%)] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#543422] p-1 sm:p-3 font-sans flex flex-col justify-between shadow-[0_30px_90px_rgba(0,0,0,0.95)] select-none">
      
      {/* Studio rim lighting environment */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* VIEWPORT HEADER CONTROLS */}
      <div className="flex flex-wrap justify-between items-center px-4 pt-3 pb-2 gap-2 z-10">
        <div className="flex items-center gap-2">
          {/* STATIC MATCH MODE BADGE */}
          <div className="p-1 px-2.5 bg-[#160d07]/90 rounded-lg border border-amber-500/30 flex items-center gap-1.5 text-[9px] font-mono text-amber-300 tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.2)] font-bold uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{playerMode === '2-player' ? '2-PLAYER MATCH (2 QUADRANTS)' : '4-PLAYER BATTLE ROYALE'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelperRules(!showHelperRules)}
            className="p-1.5 bg-[#180f08]/90 hover:bg-[#26170d] border border-amber-900/60 text-amber-200/80 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1 font-mono uppercase"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>
          
          <button
            onClick={() => setView3D(!view3D)}
            className="p-1.5 bg-[#26170d] hover:bg-amber-950/60 border border-amber-500/40 text-amber-300 rounded-lg transition-all text-xs flex items-center gap-1.5 font-mono uppercase font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]"
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
            className="absolute top-16 left-6 right-6 bg-[#160d07]/95 backdrop-blur-md border border-amber-500/40 p-4 rounded-2xl text-xs text-amber-100/90 space-y-2 z-40 shadow-2xl"
          >
            <h4 className="font-display font-black text-white uppercase text-sm tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Official Authoritative Ludo Rules</span>
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-amber-200/80 font-mono text-[11px]">
              <li><span className="text-amber-300 font-bold">Base Exit</span>: Token may ONLY leave base yard after rolling an exact <strong className="text-amber-400">6</strong>.</li>
              <li><span className="text-rose-400 font-bold">3 Sixes Penalty</span>: Rolling 3 consecutive 6s forfeits turn and rolls back ALL turn movements!</li>
              <li><span className="text-emerald-300 font-bold">Exact Finish</span>: Tokens require exact die value to enter center home (step 57).</li>
              <li><span className="text-cyan-300 font-bold">Safe Squares</span>: Safe zones protect tokens from being captured.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE ARENA VIEWPORT FRAME (3D WebGL vs 2D Crisp Grid) */}
      <div className="relative w-full flex-1 flex items-center justify-center py-2 transition-all duration-700">
        {view3D ? (
          <div className="relative w-full max-w-[580px] flex items-center justify-center">
            <Ludo3DCanvas
              tokens={engineState.tokens}
              activePlayer={activePlayer}
              diceRollValue={diceRollValue}
              secondDiceValue={secondDiceValue}
              isRolling={isRolling}
              isUserTurn={isUserTurn(activePlayer)}
              playableTokenIds={playableTokenIds}
              onSelectToken={(tokenId) => {
                const tok = engineState.tokens.find(t => t.id === tokenId);
                if (tok) handleSelectToken(tok);
              }}
              view3D={true}
            />
          </div>
        ) : (
          /* 2D CRISP GRID BOARD VIEW (100% VISIBLE PAWNS) */
          <div className="relative w-[340px] h-[340px] sm:w-[435px] sm:h-[435px] bg-[#1a212d] rounded-[32px] border-[4px] border-[#0f141e] p-[3px] shadow-2xl ludo-board-container-2d">
            <div className="grid grid-cols-15 grid-rows-15 w-full h-full bg-black gap-[1px] rounded-2xl overflow-hidden">
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
                            <polygon points="0,0 50,50 0,100" fill="#E52521" stroke="#000000" strokeWidth="1.5" />
                            <polygon points="0,0 50,50 100,0" fill="#1B4EAB" stroke="#000000" strokeWidth="1.5" />
                            <polygon points="100,0 50,50 100,100" fill="#009A44" stroke="#000000" strokeWidth="1.5" />
                            <polygon points="0,100 50,50 100,100" fill="#FFCC00" stroke="#000000" strokeWidth="1.5" />
                          </svg>
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
                        <div key={`${r}-${c}`} className="relative bg-[#E52521] border border-[#A01010] flex items-center justify-center shadow-inner" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                          {isCircle && <div className="w-[72%] h-[72%] rounded-full bg-[#E52521] border-2 border-[#A01010] shadow-md" />}
                        </div>
                      );
                    }
                    return <div key={`${r}-${c}`} className="bg-[#E52521] border border-[#A01010]" style={{ gridRow: r + 1, gridColumn: c + 1 }} />;
                  }

                  // Top-Right Yard (Blue)
                  if (r <= 5 && c >= 9) {
                    if (r >= 1 && r <= 4 && c >= 10 && c <= 13) {
                      const isCircle = (r === 1 && c === 10) || (r === 1 && c === 12) || (r === 3 && c === 10) || (r === 3 && c === 12);
                      return (
                        <div key={`${r}-${c}`} className="relative bg-[#1B4EAB] border border-[#0F357A] flex items-center justify-center shadow-inner" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                          {isCircle && <div className="w-[72%] h-[72%] rounded-full bg-[#1B4EAB] border-2 border-[#0F357A] shadow-md" />}
                        </div>
                      );
                    }
                    return <div key={`${r}-${c}`} className="bg-[#1B4EAB] border border-[#0F357A]" style={{ gridRow: r + 1, gridColumn: c + 1 }} />;
                  }

                  // Bottom-Right Yard (Green)
                  if (r >= 9 && c >= 9) {
                    if (r >= 10 && r <= 13 && c >= 10 && c <= 13) {
                      const isCircle = (r === 10 && c === 10) || (r === 10 && c === 12) || (r === 3 && c === 10) || (r === 3 && c === 12);
                      return (
                        <div key={`${r}-${c}`} className="relative bg-[#009A44] border border-[#00612B] flex items-center justify-center shadow-inner" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                          {isCircle && <div className="w-[72%] h-[72%] rounded-full bg-[#009A44] border-2 border-[#00612B] shadow-md" />}
                        </div>
                      );
                    }
                    return <div key={`${r}-${c}`} className="bg-[#009A44] border border-[#00612B]" style={{ gridRow: r + 1, gridColumn: c + 1 }} />;
                  }

                  // Bottom-Left Yard (Yellow)
                  if (r >= 9 && c <= 5) {
                    if (r >= 10 && r <= 13 && c >= 1 && c <= 4) {
                      const isCircle = (r === 10 && c === 1) || (r === 10 && c === 3) || (r === 12 && c === 1) || (r === 12 && c === 3);
                      return (
                        <div key={`${r}-${c}`} className="relative bg-[#FFCC00] border border-[#C79F00] flex items-center justify-center shadow-inner" style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                          {isCircle && <div className="w-[72%] h-[72%] rounded-full bg-[#FFCC00] border-2 border-[#C79F00] shadow-md" />}
                        </div>
                      );
                    }
                    return <div key={`${r}-${c}`} className="bg-[#FFCC00] border border-[#C79F00]" style={{ gridRow: r + 1, gridColumn: c + 1 }} />;
                  }

                  // Path Arms
                  if (r <= 5 && c >= 6 && c <= 8) {
                    const isBluePath = (c === 7 && r >= 1) || (r === 0 && (c === 7 || c === 8));
                    const isBlueStart = r === 0 && c === 8;
                    const isBlueStar = r === 1 && c === 6;
                    return (
                      <div key={`${r}-${c}`} className={`border border-black relative flex items-center justify-center ${isBluePath ? 'bg-[#1B4EAB]' : 'bg-white'}`} style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                        {isBlueStart && <span className="text-[8px] font-black text-white">⬇</span>}
                        {isBlueStar && <Star className="w-3 h-3 text-[#1B4EAB] fill-[#1B4EAB]" />}
                      </div>
                    );
                  }

                  if (r >= 6 && r <= 8 && c >= 9) {
                    const isGreenPath = (r === 7) || (r === 8 && c === 14);
                    const isGreenStart = r === 8 && c === 14;
                    const isGreenStar = r === 6 && c === 13;
                    return (
                      <div key={`${r}-${c}`} className={`border border-black relative flex items-center justify-center ${isGreenPath ? 'bg-[#009A44]' : 'bg-white'}`} style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                        {isGreenStart && <span className="text-[8px] font-black text-white">⬅</span>}
                        {isGreenStar && <Star className="w-3 h-3 text-[#009A44] fill-[#009A44]" />}
                      </div>
                    );
                  }

                  if (r >= 9 && c >= 6 && c <= 8) {
                    const isYellowPath = (c === 7 && r >= 9) || (r === 14 && c === 6);
                    const isYellowStart = r === 14 && c === 6;
                    const isYellowStar = r === 13 && c === 8;
                    return (
                      <div key={`${r}-${c}`} className={`border border-black relative flex items-center justify-center ${isYellowPath ? 'bg-[#FFCC00]' : 'bg-white'}`} style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                        {isYellowStart && <span className="text-[8px] font-black text-black">⬆</span>}
                        {isYellowStar && <Star className="w-3 h-3 text-[#D9A300] fill-[#D9A300]" />}
                      </div>
                    );
                  }

                  if (r >= 6 && r <= 8 && c <= 5) {
                    const isRedPath = (r === 7) || (r === 6 && c === 0);
                    const isRedStart = r === 6 && c === 0;
                    const isRedStar = r === 8 && c === 1;
                    return (
                      <div key={`${r}-${c}`} className={`border border-black relative flex items-center justify-center ${isRedPath ? 'bg-[#E52521]' : 'bg-white'}`} style={{ gridRow: r + 1, gridColumn: c + 1 }}>
                        {isRedStart && <span className="text-[8px] font-black text-white">➔</span>}
                        {isRedStar && <Star className="w-3 h-3 text-[#E52521] fill-[#E52521]" />}
                      </div>
                    );
                  }

                  return <div key={`${r}-${c}`} className="bg-white border border-black" style={{ gridRow: r + 1, gridColumn: c + 1 }} />;
                })
              )}

              {/* Render 2D Visible Pawns */}
              {engineState.tokens.map((token) => {
                const [r, c] = getTokenCell(token);
                const isPlayable = playableTokenIds.includes(token.id);

                return (
                  <div
                    key={token.id}
                    onClick={() => handleSelectToken(token)}
                    className="relative z-30 flex items-center justify-center w-full h-full pointer-events-auto cursor-pointer"
                    style={{ gridRow: r + 1, gridColumn: c + 1 }}
                  >
                    <LudoPawn3D
                      color={token.color}
                      isPlayable={isPlayable}
                      view3D={false}
                    />
                  </div>
                );
              })}
            </div>

            {/* 2D VIEW ACRYLIC GLASS DICE */}
            <div className="absolute bottom-3 right-3 z-40 flex items-center gap-2 pointer-events-none drop-shadow-xl">
              <SemiTranslucentWhiteDice value={diceRollValue} isRolling={isRolling} />
              <SemiTranslucentWhiteDice value={secondDiceValue} isRolling={isRolling} />
            </div>
          </div>
        )}
      </div>

      {/* ACTION CONTROLS & HUD */}
      <div className="relative sm:absolute sm:bottom-4 sm:left-4 mx-auto mt-2 sm:mt-0 w-full max-w-[340px] sm:w-auto bg-[#180e08]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-amber-500/30 flex flex-col gap-2 shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isUserTurn(activePlayer) ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest">
              {isUserTurn(activePlayer) 
                ? (playerMode === '2-player' ? "YOUR TURN: SELECT QUADRANT TO MOVE" : "YOUR TURN (RED 🔴)") 
                : `${activePlayer.toUpperCase()}'S TURN (BOT)`}
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 uppercase">
            {playerMode}
          </span>
        </div>

        {/* Dynamic Quadrant Filter Selector in 2-Player mode */}
        {playerMode === '2-player' && isUserTurn(activePlayer) && hasRolled && (
          <div className="flex items-center gap-1.5 p-1 bg-[#0f0905] rounded-xl border border-amber-500/25">
            <span className="text-[9px] font-mono text-amber-500/70 font-bold px-1.5 uppercase">QUADRANT:</span>
            <button
              type="button"
              onClick={() => setUserSelectedQuadrant('all')}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all ${
                userSelectedQuadrant === 'all'
                  ? 'bg-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'text-amber-200/70 hover:text-white'
              }`}
            >
              ANY (🔴 & 🟡)
            </button>
            <button
              type="button"
              onClick={() => setUserSelectedQuadrant('red')}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center gap-1 ${
                userSelectedQuadrant === 'red'
                  ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(225,29,72,0.4)]'
                  : 'text-rose-400/70 hover:text-rose-300'
              }`}
            >
              RED 🔴
            </button>
            <button
              type="button"
              onClick={() => setUserSelectedQuadrant('gold')}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all flex items-center gap-1 ${
                userSelectedQuadrant === 'gold'
                  ? 'bg-yellow-400 text-black shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                  : 'text-yellow-400/70 hover:text-yellow-300'
              }`}
            >
              YELLOW 🟡
            </button>
          </div>
        )}
        
        <button
          onClick={rollDice}
          disabled={!isUserTurn(activePlayer) || hasRolled || isRolling || engineState.gameStatus !== 'playing' || botIsThinking}
          className={`w-full py-1.5 font-extrabold tracking-widest uppercase font-display text-center rounded-xl transition-all border text-xs cursor-pointer ${
            isUserTurn(activePlayer) && !hasRolled && !isRolling && engineState.gameStatus === 'playing'
              ? 'bg-amber-500/20 border-amber-500 hover:bg-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-pulse'
              : 'bg-[#21140c] border-amber-950 text-amber-700/60 cursor-not-allowed'
          }`}
        >
          {isRolling ? 'ROLLING...' : `ROLL DICE FOR YOUR TURN`}
        </button>
      </div>

      {/* LEADERBOARD PANEL */}
      <div className="relative sm:absolute sm:top-16 sm:right-4 mx-auto mt-2 sm:mt-0 w-full max-w-[300px] sm:w-auto sm:max-w-[170px] bg-[#180e08]/95 backdrop-blur-md py-2.5 px-3.5 rounded-2xl border border-amber-500/25 shadow-2xl space-y-2 z-30">
        <div className="flex justify-between items-center text-[8px] font-mono border-b border-amber-500/15 pb-1">
          <span className="font-extrabold text-[9.5px] tracking-wide text-amber-300">⚔️ {playerMode.toUpperCase()} MATCH</span>
        </div>

        <div className="flex justify-between items-center bg-[#0d0704]/90 px-2 py-1 rounded-lg border border-amber-950">
          <span className="text-[7.5px] text-amber-500/70 font-black uppercase">STAKE POOL</span>
          <span className="text-[9.5px] text-[#FBBF24] font-black flex items-center gap-0.5">
            🪙 {entryFee}
          </span>
        </div>

        <div className="space-y-1 text-[8.5px]">
          <div className="flex items-center justify-between text-rose-300">
            <span className="truncate max-w-[65px] font-bold">You (Red)</span>
            <span className="font-mono text-rose-400 font-bold">{engineState.tokens.filter(t => t.color === 'red' && t.status === 'finished').length}/4</span>
          </div>
          <div className="flex items-center justify-between text-blue-300">
            <span className="truncate max-w-[65px] font-medium">{playerMode === '2-player' ? `${opponentName} (Blue)` : 'Bot 1 (Blue)'}</span>
            <span className="font-mono text-blue-400 font-bold">{engineState.tokens.filter(t => t.color === 'blue' && t.status === 'finished').length}/4</span>
          </div>
          <div className="flex items-center justify-between text-emerald-300">
            <span className="truncate max-w-[65px] font-medium">{playerMode === '2-player' ? `${opponentName} (Green)` : 'Bot 2 (Green)'}</span>
            <span className="font-mono text-emerald-400 font-bold">{engineState.tokens.filter(t => t.color === 'green' && t.status === 'finished').length}/4</span>
          </div>
          <div className="flex items-center justify-between text-yellow-300">
            <span className="truncate max-w-[65px] font-medium">{playerMode === '2-player' ? 'You (Yellow)' : 'Bot 3 (Yellow)'}</span>
            <span className="font-mono text-yellow-400 font-bold">{engineState.tokens.filter(t => t.color === 'gold' && t.status === 'finished').length}/4</span>
          </div>
        </div>
      </div>

      {/* Game Over Banner Overlay */}
      <AnimatePresence>
        {engineState.winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center z-50"
          >
            <div className="p-4 bg-gradient-to-tr from-emerald-500/20 to-amber-500/20 rounded-3xl border border-emerald-500/30 mb-4 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              {(engineState.winner === 'red' || (playerMode === '2-player' && engineState.winner === 'gold')) ? (
                <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-rose-400 animate-pulse" />
              )}
            </div>

            <h3 className="text-2xl md:text-3xl font-black uppercase font-display tracking-tight text-white mb-2">
              {(engineState.winner === 'red' || (playerMode === '2-player' && engineState.winner === 'gold')) ? (
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  QUADRANT VICTORY!
                </span>
              ) : (
                <span className="bg-gradient-to-r from-rose-500 to-amber-400 bg-clip-text text-transparent">
                  LUDO DEFEAT
                </span>
              )}
            </h3>

            <p className="text-sm text-neutral-300 max-w-md mb-6">
              {(engineState.winner === 'red' || (playerMode === '2-player' && engineState.winner === 'gold'))
                ? `Sensational path tracking! You navigated all your tokens into the central matrix and won ${entryFee * 2} Coins.`
                : `${opponentName} filled their home matrix first. Great effort!`}
            </p>

            {/* Rematch & Exit Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
              <button
                onClick={handlePlayAgain}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again ({entryFee > 0 ? `Restake ${entryFee} Coins` : 'Free'})
              </button>
              <button
                onClick={() => onGameOver(engineState.winner === 'red' || (playerMode === '2-player' && engineState.winner === 'gold'))}
                className="py-3 px-5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-bold uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
                Exit Arena
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

// GLOSSY 3D PLASTIC PAWN
const LudoPawn3D: React.FC<{ color: PlayerColor, isPlayable?: boolean, view3D?: boolean }> = ({ color, isPlayable, view3D }) => {
  const pawnColors = {
    red: {
      head: '#E52521',
      headLight: '#FF7D7A',
      collar: '#FFE5E5',
      bodyGrad: 'from-[#FF3B30] via-[#E52521] to-[#990D0D]',
      border: '#990D0D'
    },
    blue: {
      head: '#1B4EAB',
      headLight: '#6BA2FF',
      collar: '#E5EEFF',
      bodyGrad: 'from-[#007AFF] via-[#1B4EAB] to-[#092B70]',
      border: '#092B70'
    },
    green: {
      head: '#009A44',
      headLight: '#55F292',
      collar: '#E5FFE9',
      bodyGrad: 'from-[#34C759] via-[#009A44] to-[#005425]',
      border: '#005425'
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
      <div 
        className="absolute bottom-0 w-5 h-1.5 rounded-full blur-[0.8px] pointer-events-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', transform: view3D ? 'scaleY(0.5) translateY(3px)' : 'none' }}
      />

      <motion.div 
        whileHover={isPlayable ? { scale: 1.3, y: -5 } : { scale: 1.12 }}
        className="relative flex flex-col items-center transition-all duration-300 z-20"
        style={{
          transform: view3D ? 'translateZ(24px) rotateX(-46deg) rotateY(22deg)' : 'none',
          transformStyle: 'preserve-3d'
        }}
      >
        <div 
          className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border shadow-md z-20"
          style={{ 
            background: `radial-gradient(circle at 32% 32%, ${style.headLight}, ${style.head})`,
            borderColor: style.border
          }}
        >
          <div className="absolute top-[2px] left-[2.5px] w-1.5 h-1.5 rounded-full bg-white/85 blur-[0.2px]" />
        </div>

        <div 
          className="w-2.5 h-1 -mt-0.5 rounded-full border-t border-b z-15 shadow-inner"
          style={{ backgroundColor: style.collar, borderColor: style.border }}
        />

        <div 
          className={`w-4.5 h-4.5 sm:w-5 sm:h-5 -mt-0.5 rounded-b-xl rounded-t-sm bg-gradient-to-b ${style.bodyGrad} border flex items-center justify-center shadow-lg relative overflow-hidden`}
          style={{ borderColor: style.border }}
        >
          <div className="absolute top-0 left-1 w-1 h-full bg-white/40 skew-x-[-15deg] blur-[0.4px]" />
        </div>
      </motion.div>

      {isPlayable && (
        <span className="absolute bottom-0 w-6 h-6 rounded-full border-2 border-yellow-300 animate-ping pointer-events-none z-10" />
      )}
    </div>
  );
};

// TWO TRANSLUCENT ACRYLIC GLASS DICE
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
        <div className="absolute inset-0 bg-white/98 backdrop-blur-sm border-2 border-slate-300 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_12px_rgba(255,255,255,0.6)] flex items-center justify-center backface-hidden" style={{ transform: 'translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(5)}
        </div>
        <div className="absolute inset-0 bg-white/98 backdrop-blur-sm border-2 border-slate-300 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_12px_rgba(255,255,255,0.6)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(180deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(2)}
        </div>
        <div className="absolute inset-0 bg-white/98 backdrop-blur-sm border-2 border-slate-300 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_12px_rgba(255,255,255,0.6)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateX(90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(3)}
        </div>
        <div className="absolute inset-0 bg-white/98 backdrop-blur-sm border-2 border-slate-300 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_12px_rgba(255,255,255,0.6)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateX(-90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(4)}
        </div>
        <div className="absolute inset-0 bg-white/98 backdrop-blur-sm border-2 border-slate-300 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_12px_rgba(255,255,255,0.6)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(-90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(1)}
        </div>
        <div className="absolute inset-0 bg-white/98 backdrop-blur-sm border-2 border-slate-300 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_12px_rgba(255,255,255,0.6)] flex items-center justify-center backface-hidden" style={{ transform: 'rotateY(90deg) translateZ(18px)', backfaceVisibility: 'hidden' }}>
          {renderDots(6)}
        </div>
      </div>
    </div>
  );
};
