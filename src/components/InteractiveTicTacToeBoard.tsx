import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, ShieldCheck, Timer, Award, RotateCcw, HelpCircle, Trophy, Sparkles, X as XIcon, Circle, AlertCircle } from 'lucide-react';
import { TicTacToeLogicService } from '../services/ticTacToeLogic';
import { TicTacToeGameState } from '../types';

interface InteractiveTicTacToeBoardProps {
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

export const InteractiveTicTacToeBoard: React.FC<InteractiveTicTacToeBoardProps> = ({
  entryFee,
  opponentName,
  opponentAvatar,
  onGameOver,
  onAddLog,
  botDifficulty = 'medium',
  isBot = true,
  sessionId,
  isHost = true,
  liveGameState,
  onUpdateLiveState
}) => {
  const player1Id = isBot ? 'player-user' : 'host';
  const player2Id = isBot ? 'bot-user' : 'guest';
  const myId = isBot ? 'player-user' : (isHost ? 'host' : 'guest');

  const [gameState, setGameState] = useState<TicTacToeGameState>(() =>
    liveGameState || TicTacToeLogicService.initializeBoard(sessionId || 'tictactoe-session', player1Id, player2Id)
  );

  const [playerTimer, setPlayerTimer] = useState<number>(180); // 3 minutes standard
  const [botTimer, setBotTimer] = useState<number>(180);
  const [gameResult, setGameResult] = useState<'playing' | 'player_won' | 'bot_won' | 'draw'>('playing');
  const [moveAttemptLogs, setMoveAttemptLogs] = useState<string[]>([]);
  const [botIsThinking, setBotIsThinking] = useState<boolean>(false);
  const [showHelperRules, setShowHelperRules] = useState<boolean>(false);
  const [scores, setScores] = useState<{ player: number; bot: number; draws: number }>({ player: 0, bot: 0, draws: 0 });

  const isPlayerTurn = isBot
    ? gameState.activePlayerId === player1Id
    : gameState.activePlayerId === myId;

  // Sync live state from Firestore snapshot
  useEffect(() => {
    if (!isBot && liveGameState && liveGameState.board) {
      setGameState(liveGameState);
      if (liveGameState.status === 'completed') {
        const winnerId = liveGameState.winnerId;
        const myId = isHost ? 'host' : 'guest';
        if (winnerId === 'draw') {
          setGameResult('draw');
        } else if (winnerId === myId || winnerId === player1Id) {
          setGameResult('player_won');
        } else {
          setGameResult('bot_won');
        }
      }
    }
  }, [liveGameState, isBot, isHost, player1Id]);

  // Active timers countdown logic
  useEffect(() => {
    if (gameResult !== 'playing' || botIsThinking) return;

    const interval = setInterval(() => {
      if (isPlayerTurn) {
        setPlayerTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameResult('bot_won');
            onAddLog(`[TIMER EXPIRED] Time ran out! Match awarded to ${opponentName}.`);
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
            onAddLog(`[TIMER EXPIRED] ${opponentName} time elapsed! You win.`);
            setTimeout(() => onGameOver(true), 2500);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayerTurn, gameResult, botIsThinking, opponentName, onAddLog, onGameOver]);

  // Bot AI Turn execution
  useEffect(() => {
    if (!isBot || gameResult !== 'playing' || isPlayerTurn || botIsThinking) return;

    setBotIsThinking(true);

    const delay = Math.floor(Math.random() * 150) + 150; // Ultra-fast 150-300ms bot turn response

    const timer = setTimeout(() => {
      const botMoveIndex = TicTacToeLogicService.getBotMove(
        gameState.board,
        'O',
        (botDifficulty || 'medium') as 'easy' | 'medium' | 'hard'
      );

      if (botMoveIndex === -1) {
        setBotIsThinking(false);
        return;
      }

      const nextState = TicTacToeLogicService.executeMove(gameState, botMoveIndex);

      setGameState(nextState);
      setBotIsThinking(false);

      if (nextState.lastMoveMessage) {
        onAddLog(`[AI MOVE] ${opponentName} ${nextState.lastMoveMessage}`);
        setMoveAttemptLogs(prev => [`[${opponentName}] Cell ${botMoveIndex + 1}`, ...prev.slice(0, 7)]);
      }

      if (nextState.status === 'completed') {
        if (nextState.winnerId === player1Id) {
          setGameResult('player_won');
          setScores(s => ({ ...s, player: s.player + 1 }));
          onAddLog(`[GAME OVER] VICTORY! You defeated ${opponentName}.`);
          setTimeout(() => onGameOver(true), 2500);
        } else if (nextState.winnerId === player2Id) {
          setGameResult('bot_won');
          setScores(s => ({ ...s, bot: s.bot + 1 }));
          onAddLog(`[GAME OVER] DEFEAT. ${opponentName} won the match.`);
          setTimeout(() => onGameOver(false), 2500);
        } else {
          setGameResult('draw');
          setScores(s => ({ ...s, draws: s.draws + 1 }));
          onAddLog(`[GAME OVER] DRAW! No winner in this round.`);
          setTimeout(() => onGameOver(false), 2500);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [gameState, isPlayerTurn, gameResult, botIsThinking, botDifficulty, opponentName, onAddLog, onGameOver, player1Id, player2Id, isBot]);

  const handleCellClick = (index: number) => {
    if (gameResult !== 'playing' || !isPlayerTurn || botIsThinking) return;
    if (!TicTacToeLogicService.isValidMove(gameState.board, index)) return;

    const nextState = TicTacToeLogicService.executeMove(gameState, index);
    setGameState(nextState);

    if (!isBot && onUpdateLiveState) {
      onUpdateLiveState(nextState);
    }

    if (nextState.lastMoveMessage) {
      onAddLog(`[YOU] Claimed cell position ${index + 1}`);
      setMoveAttemptLogs(prev => [`[YOU] Cell ${index + 1}`, ...prev.slice(0, 7)]);
    }

    if (nextState.status === 'completed') {
      const myId = isBot ? player1Id : (isHost ? 'host' : 'guest');
      if (nextState.winnerId === myId || nextState.winnerId === player1Id) {
        setGameResult('player_won');
        setScores(s => ({ ...s, player: s.player + 1 }));
        onAddLog(`[GAME OVER] VICTORY! You defeated ${opponentName}.`);
        setTimeout(() => onGameOver(true), 2500);
      } else if (nextState.winnerId === 'draw') {
        setGameResult('draw');
        setScores(s => ({ ...s, draws: s.draws + 1 }));
        onAddLog(`[GAME OVER] DRAW! Tactical standoff.`);
        setTimeout(() => onGameOver(false), 2500);
      } else {
        setGameResult('bot_won');
        setScores(s => ({ ...s, bot: s.bot + 1 }));
        onAddLog(`[GAME OVER] DEFEAT. ${opponentName} won the match.`);
        setTimeout(() => onGameOver(false), 2500);
      }
    }
  };

  const handleResetMatch = () => {
    setGameState(TicTacToeLogicService.initializeBoard('tictactoe-session', player1Id, player2Id));
    setGameResult('playing');
    setPlayerTimer(180);
    setBotTimer(180);
    setBotIsThinking(false);
    onAddLog(`[MATCH RESTART] Board re-initialized.`);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-gradient-to-b from-[#0F1016] to-[#0A0A0E] border border-cyan-500/20 rounded-3xl p-4 md:p-6 shadow-[0_0_50px_rgba(6,182,212,0.1)] text-white font-sans overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Swords className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black tracking-wider uppercase font-display bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                Cyber Tic-Tac-Toe Arena
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold uppercase rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {botDifficulty.toUpperCase()} AI
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Entry Stake: <span className="text-emerald-400 font-mono font-bold">{entryFee} Coins</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelperRules(!showHelperRules)}
            className="p-2 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Rules</span>
          </button>
          <button
            onClick={handleResetMatch}
            className="p-2 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>

      {/* Rules Modal Drawer */}
      <AnimatePresence>
        {showHelperRules && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-4 my-3 text-xs text-neutral-300 space-y-2 relative z-10"
          >
            <div className="flex justify-between items-center font-bold text-cyan-400 uppercase tracking-wider text-xs">
              <span>Cyber Tic-Tac-Toe Rules & Tactical Guide</span>
              <button onClick={() => setShowHelperRules(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-neutral-300">
              <li>Take turns placing your neon <strong>X</strong> mark on any empty cell in the 3x3 grid.</li>
              <li>Align <strong>3 marks horizontally, vertically, or diagonally</strong> to trigger victory!</li>
              <li>You are playing as <span className="text-cyan-400 font-bold">X (Cyan)</span>; Opponent is <span className="text-pink-400 font-bold">O (Pink)</span>.</li>
              <li>Hard Bot difficulty utilizes optimal algorithmic evaluation for high-stakes competition.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Players & Timers Bar */}
      <div className="grid grid-cols-2 gap-3 my-4 relative z-10">
        {/* Player Box */}
        <div className={`p-3 rounded-2xl border transition-all ${
          isPlayerTurn && gameResult === 'playing'
            ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
            : 'bg-neutral-900/50 border-neutral-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-black text-cyan-300 text-sm">
                X
              </div>
              <div>
                <span className="block text-xs font-bold text-white truncate max-w-[100px] md:max-w-[140px]">
                  You (Player)
                </span>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  Score: {scores.player}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
              <Timer className="w-3.5 h-3.5" />
              {formatTimer(playerTimer)}
            </div>
          </div>
        </div>

        {/* Bot / Opponent Box */}
        <div className={`p-3 rounded-2xl border transition-all ${
          !isPlayerTurn && gameResult === 'playing'
            ? 'bg-pink-950/40 border-pink-500/60 shadow-[0_0_20px_rgba(236,72,153,0.2)]'
            : 'bg-neutral-900/50 border-neutral-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-400 flex items-center justify-center font-black text-pink-300 text-sm overflow-hidden">
                {opponentAvatar ? (
                  <img src={opponentAvatar} alt={opponentName} className="w-full h-full object-cover" />
                ) : (
                  'O'
                )}
              </div>
              <div>
                <span className="block text-xs font-bold text-white truncate max-w-[100px] md:max-w-[140px]">
                  {opponentName}
                </span>
                <span className="text-[10px] font-mono text-pink-400 uppercase font-bold">
                  Score: {scores.bot}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs text-pink-300 bg-pink-950/60 border border-pink-500/30 px-2.5 py-1 rounded-lg">
              <Timer className="w-3.5 h-3.5" />
              {formatTimer(botTimer)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Board Grid & Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4 relative z-10 items-center">
        {/* 3x3 Interactive Matrix Board */}
        <div className="md:col-span-2 flex flex-col items-center justify-center">
          <div className="relative p-3 bg-neutral-950/80 border border-cyan-500/30 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md">
            <div className="grid grid-cols-3 gap-2.5 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
              {gameState.board.map((cell, idx) => {
                const isWinningSquare = gameState.winningLine?.includes(idx);

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: cell === null && isPlayerTurn && gameResult === 'playing' ? 1.05 : 1 }}
                    whileTap={{ scale: cell === null && isPlayerTurn && gameResult === 'playing' ? 0.95 : 1 }}
                    onClick={() => handleCellClick(idx)}
                    disabled={cell !== null || !isPlayerTurn || gameResult !== 'playing' || botIsThinking}
                    className={`relative rounded-2xl flex items-center justify-center transition-all cursor-pointer select-none font-black text-3xl sm:text-4xl md:text-5xl border ${
                      isWinningSquare
                        ? 'bg-emerald-500/30 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] z-20'
                        : cell === 'X'
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : cell === 'O'
                        ? 'bg-pink-950/40 border-pink-500/50 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                        : 'bg-neutral-900/60 border-white/10 hover:border-cyan-500/50 hover:bg-neutral-850'
                    }`}
                  >
                    {cell === 'X' && (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="text-cyan-400 font-extrabold flex items-center justify-center drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                      >
                        <XIcon className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 stroke-[3]" />
                      </motion.div>
                    )}

                    {cell === 'O' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-pink-400 font-extrabold flex items-center justify-center drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]"
                      >
                        <Circle className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 stroke-[3]" />
                      </motion.div>
                    )}

                    {cell === null && isPlayerTurn && gameResult === 'playing' && (
                      <span className="opacity-0 hover:opacity-20 text-cyan-300 text-sm font-mono font-bold">
                        {idx + 1}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Thinking Overlay when bot calculating */}
            {botIsThinking && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="w-8 h-8 border-3 border-pink-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono font-bold text-pink-300 uppercase tracking-widest animate-pulse">
                  {opponentName} Thinking...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live Match Console Log Sidebar */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 flex flex-col h-64 sm:h-80 md:h-96">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Tactical Log Feed
            </span>
            <span className="text-[10px] font-mono text-neutral-500">Live</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px]">
            {moveAttemptLogs.length === 0 ? (
              <p className="text-neutral-500 italic text-center py-6">
                Match started. Place your mark on the grid!
              </p>
            ) : (
              moveAttemptLogs.map((log, i) => (
                <div key={i} className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-850 text-neutral-300 flex items-center justify-between">
                  <span>{log}</span>
                  <span className="text-[9px] text-cyan-500/80 font-bold">VALID</span>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-neutral-800 mt-2">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-neutral-400">Match Status:</span>
              <span className={`font-bold uppercase ${
                gameResult === 'player_won' ? 'text-emerald-400' :
                gameResult === 'bot_won' ? 'text-pink-400' :
                gameResult === 'draw' ? 'text-amber-400' : 'text-cyan-400 animate-pulse'
              }`}>
                {gameResult === 'playing' ? (isPlayerTurn ? 'Your Turn' : `${opponentName}'s Turn`) : gameResult.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Banner Overlay */}
      <AnimatePresence>
        {gameResult !== 'playing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center z-30"
          >
            <div className="p-4 bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 rounded-3xl border border-cyan-500/30 mb-4 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
              {gameResult === 'player_won' ? (
                <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
              ) : gameResult === 'bot_won' ? (
                <AlertCircle className="w-16 h-16 text-pink-400 animate-pulse" />
              ) : (
                <Award className="w-16 h-16 text-amber-400" />
              )}
            </div>

            <h3 className="text-2xl md:text-3xl font-black uppercase font-display tracking-tight text-white mb-2">
              {gameResult === 'player_won' ? (
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  VICTORY ACHIEVED!
                </span>
              ) : gameResult === 'bot_won' ? (
                <span className="bg-gradient-to-r from-pink-500 to-red-400 bg-clip-text text-transparent">
                  DEFEAT IN ARENA
                </span>
              ) : (
                <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                  TACTICAL DRAW
                </span>
              )}
            </h3>

            <p className="text-sm text-neutral-300 max-w-md mb-6">
              {gameResult === 'player_won'
                ? `Outstanding strategy! You defeated ${opponentName} and secured ${entryFee * 2} Coins.`
                : gameResult === 'bot_won'
                ? `${opponentName} outmaneuvered the board matrix. Good try!`
                : `Both players matched every line step for step.`}
            </p>

            <button
              onClick={handleResetMatch}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-450 hover:to-blue-550 text-white font-black text-sm uppercase rounded-xl shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              Play Another Match
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
