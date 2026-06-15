/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, ShieldCheck, Timer, Award, AlertTriangle, RotateCcw, HelpCircle, Trophy } from 'lucide-react';
import { DraftLogicService } from '../services/draftLogic';
import { DraftGameState, DraftPiece, UserProfile } from '../types';

interface InteractiveDraftBoardProps {
  entryFee: number;
  opponentName: string;
  opponentAvatar: string;
  onGameOver: (winnerIsMe: boolean) => void;
  onAddLog: (log: string) => void;
}

export const InteractiveDraftBoard: React.FC<InteractiveDraftBoardProps> = ({
  entryFee,
  opponentName,
  opponentAvatar,
  onGameOver,
  onAddLog
}) => {
  const player1Id = 'player-user';
  const player2Id = 'bot-user';

  const [gameState, setGameState] = useState<DraftGameState>(() => 
    DraftLogicService.initializeBoard('draft-session', player1Id, player2Id)
  );

  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [playerTimer, setPlayerTimer] = useState<number>(300); // 5 minutes standard
  const [botTimer, setBotTimer] = useState<number>(300);
  const [gameResult, setGameResult] = useState<'playing' | 'player_won' | 'bot_won'>('playing');
  const [moveAttemptLogs, setMoveAttemptLogs] = useState<string[]>([]);
  const [botIsThinking, setBotIsThinking] = useState<boolean>(false);
  const [invalidMoveMessage, setInvalidMoveMessage] = useState<string | null>(null);
  const [showHelperRules, setShowHelperRules] = useState<boolean>(false);

  // Active player turn checking
  const isPlayerTurn = gameState.activePlayerId === player1Id;

  // Active timers countdown logic
  useEffect(() => {
    if (gameResult !== 'playing' || botIsThinking) return;

    const interval = setInterval(() => {
      if (isPlayerTurn) {
        setPlayerTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameResult('bot_won');
            onAddLog(`[TIMER EXPIRED] Player time elapsed! Match forfeited to ${opponentName}.`);
            setTimeout(() => onGameOver(false), 2500);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBotTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameResult('player_won');
            onAddLog(`[TIMER EXPIRED] Opponent AI time elapsed! You win.`);
            setTimeout(() => onGameOver(true), 2500);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayerTurn, gameResult, botIsThinking]);

  // Bot move selector AI
  useEffect(() => {
    if (gameResult !== 'playing' || isPlayerTurn || botIsThinking) return;

    setBotIsThinking(true);

    const timer = setTimeout(() => {
      // Find all bot pieces
      const botPieces = gameState.pieces.filter(p => p.playerId === player2Id);
      const availableMoves: Array<{
        pieceId: string;
        targetRow: number;
        targetCol: number;
        isCapture: boolean;
      }> = [];

      // Look for any legal moves
      for (const piece of botPieces) {
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 === 1) {
              if (DraftLogicService.isValidMove(gameState, piece.id, row, col)) {
                const rowDiff = Math.abs(row - piece.position.row);
                availableMoves.push({
                  pieceId: piece.id,
                  targetRow: row,
                  targetCol: col,
                  isCapture: rowDiff === 2
                });
              }
            }
          }
        }
      }

      // If no moves, bot loses
      if (availableMoves.length === 0) {
        onAddLog(`[AI COLLAPSE] ${opponentName} has no valid moves left. Conceding.`);
        setGameResult('player_won');
        setTimeout(() => onGameOver(true), 2500);
        return;
      }

      // Prioritize capture moves!
      const captureMoves = availableMoves.filter(m => m.isCapture);
      const chosenMove = captureMoves.length > 0
        ? captureMoves[Math.floor(Math.random() * captureMoves.length)]
        : availableMoves[Math.floor(Math.random() * availableMoves.length)];

      const originalPiece = gameState.pieces.find(p => p.id === chosenMove.pieceId)!;
      const targetPosStr = `(${chosenMove.targetRow}, ${chosenMove.targetCol})`;

      onAddLog(
        `[STATE TRANSITION] ${opponentName} played piece ${originalPiece.isKing ? 'KING' : ''} to row ${chosenMove.targetRow}, col ${chosenMove.targetCol}.`
      );

      // Execute move
      const nextState = DraftLogicService.executeMove(
        gameState,
        chosenMove.pieceId,
        chosenMove.targetRow,
        chosenMove.targetCol
      );

      // Check if user has any pieces left
      const playerPiecesCount = nextState.pieces.filter(p => p.playerId === player1Id).length;
      if (playerPiecesCount === 0) {
        setGameState(nextState);
        setGameResult('bot_won');
        onAddLog(`[CRITICAL] All your pieces were captured! Gamedev session lost.`);
        setTimeout(() => onGameOver(false), 2500);
        return;
      }

      // Update state
      setGameState(nextState);
      setBotIsThinking(false);

      setMoveAttemptLogs(prev => [
        `Black: ${originalPiece.isKing ? 'K' : ''} -> ${targetPosStr}${chosenMove.isCapture ? ' (x)' : ''}`,
        ...prev
      ]);

    }, 2000);

    return () => clearTimeout(timer);

  }, [isPlayerTurn, gameState, gameResult]);

  // Handle cell selection
  const handleCellClick = (row: number, col: number) => {
    if (gameResult !== 'playing' || !isPlayerTurn || botIsThinking) return;
    if (!selectedPieceId) return;

    const isValid = DraftLogicService.isValidMove(gameState, selectedPieceId, row, col);
    if (!isValid) {
      setInvalidMoveMessage(`Move target (${row}, ${col}) violates checkers traversal constraint.`);
      return;
    }

    setInvalidMoveMessage(null);
    const piece = gameState.pieces.find(p => p.id === selectedPieceId)!;
    const rowDiff = Math.abs(row - piece.position.row);
    const targetPosStr = `(${row}, ${col})`;

    onAddLog(`[STATE TRANSITION] You played piece ${piece.isKing ? 'KING' : ''} to row ${row}, col ${col}.`);

    const nextState = DraftLogicService.executeMove(gameState, selectedPieceId, row, col);

    // Check if bot has any pieces left
    const botPiecesCount = nextState.pieces.filter(p => p.playerId === player2Id).length;
    if (botPiecesCount === 0) {
      setGameState(nextState);
      setGameResult('player_won');
      onAddLog(`[CELEBRATION] Victory! You captured all of ${opponentName}'s pieces!`);
      setTimeout(() => onGameOver(true), 2500);
      return;
    }

    setGameState(nextState);
    setSelectedPieceId(null);

    setMoveAttemptLogs(prev => [
      `White: ${piece.isKing ? 'K' : ''} -> ${targetPosStr}${rowDiff === 2 ? ' (x)' : ''}`,
      ...prev
    ]);
  };

  // Handle piece click
  const handlePieceClick = (pieceId: string) => {
    if (gameResult !== 'playing' || !isPlayerTurn || botIsThinking) return;

    const piece = gameState.pieces.find(p => p.id === pieceId);
    if (!piece || piece.playerId !== player1Id) {
      setInvalidMoveMessage("You cannot command opponent pieces.");
      return;
    }

    setInvalidMoveMessage(null);
    setSelectedPieceId(pieceId);
  };

  // Format timers
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Pre-calculate valid moves for rendering highlights
  const validDestinations: Array<[number, number]> = [];
  if (selectedPieceId && isPlayerTurn) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          if (DraftLogicService.isValidMove(gameState, selectedPieceId, r, c)) {
            validDestinations.push([r, c]);
          }
        }
      }
    }
  }

  // Render a polished checkers piece
  const renderCheckersPiece = (piece: DraftPiece, isSelected: boolean) => {
    const isPlayer = piece.playerId === player1Id;
    const schemas = isPlayer ? {
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.8)] border-cyan-400',
      bg: 'from-cyan-500 to-cyan-700/60',
      text: 'text-cyan-100 font-black'
    } : {
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.8)] border-amber-400',
      bg: 'from-amber-600 to-amber-800/60',
      text: 'text-amber-100 font-black'
    };

    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <motion.div
          whileHover={{ scale: 1.15, y: -2 }}
          animate={isSelected ? { scale: 1.25, y: -4, translateZ: '20px' } : { scale: 1, y: 0, translateZ: '10px' }}
          className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center cursor-pointer border ${schemas.glow} transition-all z-20`}
        >
          {/* Glass piece core */}
          <div className={`absolute inset-[2px] rounded-full bg-gradient-to-t ${schemas.bg} flex items-center justify-center`}>
            {piece.isKing ? (
              <span className="text-xs md:text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">👑</span>
            ) : (
              <div className="w-4.5 h-4.5 rounded-full border border-white/20 bg-white/5 shadow-inner" />
            )}
          </div>

          {/* Acrylic glossy reflection overlay */}
          <div className="absolute top-[2px] left-[5px] w-4 h-1.5 bg-white/30 rounded-full rotate-[-15deg] blur-[0.4px] pointer-events-none" />

          {/* Inner concentric details */}
          <div className="absolute inset-[6px] rounded-full border border-white/10 pointer-events-none" />

          {/* Glowing active sonar ring */}
          {isSelected && (
            <span className="absolute -inset-1 rounded-full border border-cyan-400/70 animate-ping pointer-events-none" />
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div 
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#03060E] p-5 rounded-3xl border border-cyan-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-fade-in relative overflow-hidden" 
      id="draft-arena-viewport"
    >
      {/* Glow overlays */}
      <div className="absolute top-2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent pointer-events-none" />

      {/* TOP HEADER CONTROLS */}
      <div className="col-span-12 flex justify-between items-center px-2 pb-2.5 border-b border-cyan-500/15 z-10 gap-4 flex-wrap font-sans">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-[#091522] rounded-lg border border-cyan-500/25 flex items-center gap-1.5 text-[9px] font-mono text-cyan-400 tracking-wider">
            <Swords className="w-3.5 h-3.5 animate-pulse" />
            <span>CYBER DRAFTS ARENA MATRIX v1.0.0</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelperRules(!showHelperRules)}
            className="p-1.5 bg-[#090F1B]/90 hover:bg-neutral-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1 font-mono uppercase cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Rules</span>
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
            className="col-span-12 bg-[#070D18]/95 backdrop-blur-md border border-cyan-500/40 p-4 rounded-2xl text-xs text-slate-350 space-y-2 z-40 font-sans"
          >
            <h4 className="font-display font-black text-white uppercase text-sm tracking-wider">Duellio Drafts Contract</h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-450 font-mono text-[11px]">
              <li>You navigate the <span className="text-cyan-400 font-bold">CYAN pieces (White)</span>. Opponent runs the <span className="text-amber-400 font-bold">GOLD pieces (Black)</span>.</li>
              <li>A direct piece touch chooses the unit. Valid diagonal targets glow green on the grid.</li>
              <li>Jumps/Captures require a diagonal step of 2 squares jumping over an enemy piece, which is then removed.</li>
              <li>Timer countdown starts immediately on active turns. If your clock expires, the match is forfeited to Black.</li>
              <li>Eliminate all opponent pieces to claim the stakes ledger pools.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COGNITIVE DYNAMIC HUD ASSISTERS */}
      <div className="col-span-12 space-y-2 z-20 font-sans">
        <AnimatePresence mode="wait">
          {invalidMoveMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              className="bg-rose-500/10 border-2 border-rose-500/45 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-200 shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 animate-bounce flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold uppercase tracking-wider text-rose-455 text-[10px] mb-0.5">Vector Collision / Invalid Move</p>
                <p className="font-mono text-slate-300 text-[11px] leading-relaxed">{invalidMoveMessage}</p>
              </div>
              <button 
                onClick={() => setInvalidMoveMessage(null)}
                className="text-slate-400 hover:text-white font-mono text-[10px] uppercase font-bold cursor-pointer bg-slate-900/60 p-1 px-1.5 rounded hover:bg-slate-950 border border-slate-800 ml-2"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LEFT COLUMN: ACTIVE DRAFTS BOARD GRID CONTAINER */}
      <div className="col-span-12 lg:col-span-8 flex flex-col items-center justify-center relative p-1 md:p-3.5 bg-black/40 border border-white/[0.04] rounded-3xl shadow-inner z-10">
        
        {/* Opponent User Tag Header */}
        <div className="w-full flex items-center justify-between px-4 py-2 border border-white/[0.03] bg-neutral-950/20 rounded-xl mb-4.5">
          <div className="flex items-center gap-2.5">
            <img src={opponentAvatar} className="w-7 h-7 rounded-full object-cover border border-amber-500/30" alt="Bot Avatar" />
            <div>
              <span className="block text-xs font-black text-white">{opponentName}</span>
              <span className="block text-[8px] font-mono text-amber-400 uppercase tracking-widest leading-none mt-0.5">AI Challenger Node</span>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-colors ${
            !isPlayerTurn ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
          }`}>
            <span>⌛ {formatTime(botTimer)}</span>
          </div>
        </div>

        {/* The 8x8 checkers matrix grid board */}
        <div className="w-full max-w-[420px] aspect-square bg-[#050B14] p-1.5 rounded-2xl shadow-2xl border border-cyan-500/30 relative select-none">
          <div className="w-full h-full grid grid-cols-8 grid-rows-8 border border-[#02060D] bg-neutral-950">
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 8 }).map((_, col) => {
                const isDarkCell = (row + col) % 2 === 1;
                
                // Find matching piece on this coordinate
                const piece = gameState.pieces.find(
                  p => p.position.row === row && p.position.col === col
                );
                
                const isPieceSelected = piece ? piece.id === selectedPieceId : false;
                const isHighlightedDestination = validDestinations.some(
                  ([vr, vc]) => vr === row && vc === col
                );

                return (
                  <div
                    key={`${row}-${col}`}
                    onClick={() => {
                      if (isHighlightedDestination) {
                        handleCellClick(row, col);
                      }
                    }}
                    className={`
                      relative flex items-center justify-center transition-all duration-200 aspect-square
                      ${isDarkCell ? 'bg-[#060D1A]' : 'bg-[#0B1426]'}
                      ${isHighlightedDestination ? 'cursor-pointer hover:bg-emerald-500/10' : ''}
                    `}
                  >
                    {/* Render coordinate indicator text details in corners */}
                    {col === 0 && (
                      <span className="absolute top-0.5 left-0.5 text-[6px] font-mono text-neutral-500 select-none pointer-events-none">
                        {8 - row}
                      </span>
                    )}
                    {row === 7 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[6px] font-mono text-neutral-500 select-none pointer-events-none">
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][col]}
                      </span>
                    )}

                    {piece && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePieceClick(piece.id);
                        }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {renderCheckersPiece(piece, isPieceSelected)}
                      </div>
                    )}

                    {/* Glowing coordinate green ring target indicator */}
                    {isHighlightedDestination && (
                      <div className="absolute h-3 w-3 rounded-full bg-emerald-500/30 border border-emerald-400 animate-pulse pointer-events-none flex items-center justify-center">
                        <div className="h-1 w-1 bg-emerald-400 rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Player Local Tag Footer */}
        <div className="w-full flex items-center justify-between px-4 py-2 border border-white/[0.03] bg-neutral-950/20 rounded-xl mt-4.5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-cyan-950 flex items-center justify-center border border-cyan-500/30">
                <span className="text-cyan-400 text-[10px] font-bold">ME</span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <span className="block text-xs font-black text-white">Local Validator Node</span>
              <span className="block text-[8px] font-mono text-cyan-400 uppercase tracking-widest leading-none mt-0.5">Player Escrow Signer</span>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-colors ${
            isPlayerTurn && !botIsThinking ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 animate-pulse' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
          }`}>
            <span>⌛ {formatTime(playerTimer)}</span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: REALTIME LEDGER & TELEMETRY TRANSACTION STATUS LOGS */}
      <div className="col-span-12 lg:col-span-4 flex flex-col justify-between space-y-5 bg-neutral-950/40 p-4 border border-white/[0.04] rounded-3xl z-10 font-mono text-xs">
        
        <div className="space-y-4">
          <div className="border-b border-white/[0.06] pb-2.5">
            <span className="text-[9px] text-cyan-400/80 font-bold uppercase tracking-widest block mb-0.5">Escrow Smart Pool Ledger</span>
            <strong className="text-white text-sm font-black flex items-center gap-1.5 font-display">
              <Trophy className="w-4 h-4 text-purple-400" />
              Match Stake: {entryFee * 2} Coins
            </strong>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] text-neutral-400 uppercase tracking-wider">
              <span>Ledger Event</span>
              <span>Sequence</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {moveAttemptLogs.length > 0 ? (
                moveAttemptLogs.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-white/[0.02] text-neutral-350">
                    <span>{log}</span>
                    <span className="text-[8px] text-cyan-500/60 font-mono">#{moveAttemptLogs.length - idx}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-neutral-500 text-[10px] leading-relaxed">
                  No state transitions recorded on this channel. Begin moving piece targets.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Telemetry Status block */}
        <div className="space-y-3.5 pt-3.5 border-t border-white/[0.05]">
          <div className="p-3 bg-[#08080C] rounded-xl border border-white/[0.03] space-y-1">
            <span className="text-[8px] text-neutral-500 uppercase font-black block">Host Network Status</span>
            {botIsThinking ? (
              <div className="flex items-center gap-2 text-amber-400 animate-pulse text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>AI processing network heuristic...</span>
              </div>
            ) : gameResult !== 'playing' ? (
              <div className="flex items-center gap-2 text-rose-400 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span>Match resolved. Stake ledger finalized.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Standby: Awaiting validator sequence...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-[9px] text-neutral-500 bg-[#08080C] p-2.5 rounded-xl border border-white/[0.03]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted escrow tunnel lock active</span>
          </div>
        </div>

      </div>

      {/* GAME OVER RESOLUTION MODAL OVERLAY */}
      <AnimatePresence>
        {gameResult !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#02050B]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-center font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#070D18] border border-cyan-500/40 p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
            >
              <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center border shadow-lg ${
                gameResult === 'player_won' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              }`}>
                {gameResult === 'player_won' ? <Award className="w-9 h-9" /> : <AlertTriangle className="w-9 h-9" />}
              </div>

              <div className="space-y-2">
                <span className="bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded-full text-[9px] font-mono text-cyan-300 font-bold uppercase tracking-widest leading-none">
                  Ledger Settlement
                </span>
                <h3 className="text-2xl font-black tracking-tight text-white mt-2">
                  {gameResult === 'player_won' ? 'Duel Victory!' : 'Defeat Secured'}
                </h3>
                <p className="text-xs text-neutral-400 max-w-[250px] mx-auto">
                  {gameResult === 'player_won' 
                    ? `You successfully claimed the staking pool ledger of ${entryFee * 2} Coins.` 
                    : `${opponentName} successfully locked your staking fee of ${entryFee} Coins.`}
                </p>
              </div>

              <div className="bg-[#040911] border border-white/[0.04] p-4 rounded-xl flex items-center justify-between font-mono text-[11px] text-left">
                <div>
                  <span className="text-neutral-500 block text-[9px] font-black uppercase">Payout Outcome</span>
                  <strong className={gameResult === 'player_won' ? 'text-emerald-400 text-sm font-bold' : 'text-rose-400 text-sm font-bold'}>
                    {gameResult === 'player_won' ? `+${entryFee * 2}` : `-${entryFee}`} Coins
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block text-[9px] font-black uppercase">Transaction Status</span>
                  <span className="text-cyan-400 font-bold">LEDGER_OK</span>
                </div>
              </div>

              <button
                onClick={() => {
                  // Resolve immediately
                  onGameOver(gameResult === 'player_won');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md hover:scale-[1.02]"
              >
                Close Arena Gate
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
