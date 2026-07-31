import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, ShieldCheck, Timer, Award, HelpCircle, Trophy, Sparkles, X as XIcon, Circle, AlertCircle, RotateCcw, ArrowRight, SkipBack, SkipForward, Play } from 'lucide-react';
import { TicTacToeLogicService } from '../services/ticTacToeLogic';
import { TicTacToeGameState } from '../types';
import { soundEngine } from '../services/soundEngine';
import { SoundControls } from './SoundControls';

interface InteractiveTicTacToeBoardProps {
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
}

export const InteractiveTicTacToeBoard: React.FC<InteractiveTicTacToeBoardProps> = ({
  entryFee,
  opponentName,
  opponentAvatar,
  onGameOver,
  onAddLog,
  onReMatch,
  botDifficulty = 'medium',
  isBot = true,
  sessionId,
  isHost = true,
  liveGameState,
  onUpdateLiveState
}) => {
  // In PvP, Host (P1) is ALWAYS 'host' (Index 0 => 'X'), Guest (P2) is ALWAYS 'guest' (Index 1 => 'O')
  const player1Id = isBot ? 'player-user' : 'host';
  const player2Id = isBot ? 'bot-user' : 'guest';
  const amIPlayer1 = isBot ? true : isHost;
  const myId = isBot ? 'player-user' : (isHost ? 'host' : 'guest');

  const myMarker = amIPlayer1 ? 'X' : 'O';
  const opponentMarker = amIPlayer1 ? 'O' : 'X';

  const [gameState, setGameState] = useState<TicTacToeGameState>(() =>
    liveGameState || TicTacToeLogicService.initializeBoard(sessionId || 'tictactoe-session', player1Id, player2Id)
  );

  const [boardHistory, setBoardHistory] = useState<Array<Array<'X' | 'O' | null>>>(() => [
    liveGameState?.board || TicTacToeLogicService.initializeBoard(sessionId || 'tictactoe-session', player1Id, player2Id).board
  ]);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);

  const [playerTimer, setPlayerTimer] = useState<number>(180); // 3 minutes standard
  const [botTimer, setBotTimer] = useState<number>(180);
  const [gameResult, setGameResult] = useState<'playing' | 'player_won' | 'bot_won' | 'draw'>('playing');
  const [moveAttemptLogs, setMoveAttemptLogs] = useState<string[]>([]);
  const [botIsThinking, setBotIsThinking] = useState<boolean>(false);
  const [showHelperRules, setShowHelperRules] = useState<boolean>(false);
  const [scores, setScores] = useState<{ player: number; bot: number; draws: number }>({ player: 0, bot: 0, draws: 0 });

  // Start TicTacToe BGM on mount
  useEffect(() => {
    soundEngine.startBgm('TicTacToe');
    return () => {
      soundEngine.stopBgm();
    };
  }, []);

  const activeIsP1 = TicTacToeLogicService.isPlayer1(gameState.activePlayerId, gameState);
  const isPlayerTurn = activeIsP1 === amIPlayer1;

  // Sync live state from Firestore snapshot
  useEffect(() => {
    if (!isBot && liveGameState && liveGameState.board) {
      setGameState(liveGameState);
      if (liveGameState.status === 'completed') {
        const winnerId = liveGameState.winnerId;
        const winnerIsP1 = TicTacToeLogicService.isPlayer1(winnerId || '', liveGameState);
        if (winnerId === 'draw') {
          setGameResult('draw');
        } else if (winnerIsP1 === amIPlayer1) {
          setGameResult('player_won');
        } else {
          setGameResult('bot_won');
        }
      }
    }
  }, [liveGameState, isBot, amIPlayer1]);

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
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlayerTurn, gameResult, botIsThinking, opponentName, onAddLog]);

  const botExecutingRef = React.useRef(false);

  // Bot AI Turn execution
  useEffect(() => {
    if (!isBot || gameResult !== 'playing' || isPlayerTurn || botExecutingRef.current) return;

    botExecutingRef.current = true;
    setBotIsThinking(true);

    const delay = Math.floor(Math.random() * 60) + 80; // Instant 80-140ms bot response delay

    const timer = setTimeout(() => {
      const currentBoard = gameState.board;
      const botMoveIndex = TicTacToeLogicService.getBotMove(
        currentBoard,
        'O',
        (botDifficulty || 'medium') as 'easy' | 'medium' | 'hard'
      );

      if (botMoveIndex !== -1) {
        const nextState = TicTacToeLogicService.executeMove(gameState, botMoveIndex);

        soundEngine.playTicTacToeO();
        setGameState(nextState);
        setBoardHistory(prev => [...prev, nextState.board]);

        if (nextState.lastMoveMessage) {
          onAddLog(`[AI MOVE] ${opponentName} ${nextState.lastMoveMessage}`);
          setMoveAttemptLogs(prev => [`[${opponentName}] Cell ${botMoveIndex + 1}`, ...prev.slice(0, 7)]);
        }

        if (nextState.status === 'completed') {
          if (nextState.winnerId === player1Id) {
            setGameResult('player_won');
            setScores(s => ({ ...s, player: s.player + 1 }));
            soundEngine.playTicTacToeWin();
            onAddLog(`[GAME OVER] VICTORY! You defeated ${opponentName}.`);
          } else if (nextState.winnerId === player2Id) {
            setGameResult('bot_won');
            setScores(s => ({ ...s, bot: s.bot + 1 }));
            soundEngine.playDefeatCadence();
            onAddLog(`[GAME OVER] DEFEAT. ${opponentName} won the match.`);
          } else {
            setGameResult('draw');
            setScores(s => ({ ...s, draws: s.draws + 1 }));
            soundEngine.playTicTacToeDraw();
            onAddLog(`[GAME OVER] DRAW! No winner in this round.`);
          }
        }
      }

      botExecutingRef.current = false;
      setBotIsThinking(false);
    }, delay);

    return () => {
      clearTimeout(timer);
      botExecutingRef.current = false;
      setBotIsThinking(false);
    };
  }, [gameState, isPlayerTurn, gameResult, botDifficulty, opponentName, onAddLog, player1Id, player2Id, isBot]);

  const handleCellClick = (index: number) => {
    if (gameResult !== 'playing' || !isPlayerTurn || botIsThinking) return;
    if (!TicTacToeLogicService.isValidMove(gameState.board, index)) return;

    if (myMarker === 'X') soundEngine.playTicTacToeX();
    else soundEngine.playTicTacToeO();

    const nextState = TicTacToeLogicService.executeMove(gameState, index);
    setGameState(nextState);
    setBoardHistory(prev => [...prev, nextState.board]);

    if (!isBot && onUpdateLiveState) {
      onUpdateLiveState(nextState);
    }

    if (nextState.lastMoveMessage) {
      onAddLog(`[YOU] Claimed cell position ${index + 1}`);
      setMoveAttemptLogs(prev => [`[YOU] Cell ${index + 1}`, ...prev.slice(0, 7)]);
    }

    if (nextState.status === 'completed') {
      const winnerIsP1 = TicTacToeLogicService.isPlayer1(nextState.winnerId || '', nextState);
      if (nextState.winnerId === 'draw') {
        setGameResult('draw');
        setScores(s => ({ ...s, draws: s.draws + 1 }));
        soundEngine.playTicTacToeDraw();
        onAddLog(`[GAME OVER] DRAW! Tactical standoff.`);
      } else if (winnerIsP1 === amIPlayer1) {
        setGameResult('player_won');
        setScores(s => ({ ...s, player: s.player + 1 }));
        soundEngine.playTicTacToeWin();
        onAddLog(`[GAME OVER] VICTORY! You defeated ${opponentName}.`);
      } else {
        setGameResult('bot_won');
        setScores(s => ({ ...s, bot: s.bot + 1 }));
        soundEngine.playDefeatCadence();
        onAddLog(`[GAME OVER] DEFEAT. ${opponentName} won the match.`);
      }
    }
  };

  const handlePlayAgain = () => {
    if (onReMatch) {
      onReMatch();
    }
    const freshBoard = TicTacToeLogicService.initializeBoard(
      sessionId || `tictactoe_${Date.now()}`,
      player1Id,
      player2Id
    );
    setGameState(freshBoard);
    setBoardHistory([freshBoard.board]);
    setReplayIndex(null);
    if (!isBot && onUpdateLiveState) {
      onUpdateLiveState(freshBoard);
    }
    setGameResult('playing');
    setPlayerTimer(180);
    setBotTimer(180);
    setMoveAttemptLogs([]);
    botExecutingRef.current = false;
    setBotIsThinking(false);
    onAddLog(`[REMATCH] Game re-initialized! Stakes locked for next round.`);
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
                {isBot ? `${botDifficulty.toUpperCase()} AI` : 'LIVE PVP'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Entry Stake: <span className="text-emerald-400 font-mono font-bold">{entryFee} Coins</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SoundControls />

          <button
            onClick={() => setShowHelperRules(!showHelperRules)}
            className="p-2 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Rules</span>
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
              <li>Take turns placing your neon <strong>X</strong> or <strong>O</strong> mark on any empty cell in the 3x3 grid.</li>
              <li>Align <strong>3 marks horizontally, vertically, or diagonally</strong> to trigger victory!</li>
              <li>In Live PvP Matches: <strong>Host (P1) plays as X (Cyan)</strong> and moves first; <strong>Guest (P2) plays as O (Pink)</strong>.</li>
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                myMarker === 'X'
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                  : 'bg-pink-500/20 border border-pink-400 text-pink-300'
              }`}>
                {myMarker}
              </div>
              <div>
                <span className="block text-xs font-bold text-white truncate max-w-[100px] md:max-w-[140px]">
                  You ({myMarker})
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm overflow-hidden ${
                opponentMarker === 'O'
                  ? 'bg-pink-500/20 border border-pink-400 text-pink-300'
                  : 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
              }`}>
                {opponentAvatar ? (
                  <img src={opponentAvatar} alt={opponentName} className="w-full h-full object-cover" />
                ) : (
                  opponentMarker
                )}
              </div>
              <div>
                <span className="block text-xs font-bold text-white truncate max-w-[100px] md:max-w-[140px]">
                  {opponentName} ({opponentMarker})
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
              {(replayIndex !== null ? boardHistory[replayIndex] : gameState.board).map((cell, idx) => {
                const isWinningSquare = gameState.winningLine?.includes(idx);

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: cell === null && isPlayerTurn && gameResult === 'playing' ? 1.05 : 1 }}
                    whileTap={{ scale: cell === null && isPlayerTurn && gameResult === 'playing' ? 0.95 : 1 }}
                    onClick={() => handleCellClick(idx)}
                    disabled={cell !== null || !isPlayerTurn || gameResult !== 'playing' || botIsThinking || replayIndex !== null}
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

          {/* Move History Step Replay Controls */}
          {boardHistory.length > 1 && (
            <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-xl p-2 mb-2 flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase">
                Replay: {replayIndex !== null ? `Step ${replayIndex}` : 'Live'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const currentIdx = replayIndex === null ? boardHistory.length - 1 : replayIndex;
                    setReplayIndex(Math.max(0, currentIdx - 1));
                  }}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
                  title="Previous move"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (replayIndex === null) return;
                    if (replayIndex >= boardHistory.length - 1) {
                      setReplayIndex(null);
                    } else {
                      setReplayIndex(replayIndex + 1);
                    }
                  }}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 cursor-pointer"
                  title="Next move"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                {replayIndex !== null && (
                  <button
                    type="button"
                    onClick={() => setReplayIndex(null)}
                    className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer"
                  >
                    Live
                  </button>
                )}
              </div>
            </div>
          )}

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

            {/* Rematch & Exit Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
              <button
                onClick={handlePlayAgain}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again ({entryFee > 0 ? `Restake ${entryFee} Coins` : 'Free'})
              </button>
              <button
                onClick={() => onGameOver(gameResult === 'player_won')}
                className="py-3 px-5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-bold uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
                Exit Arena
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
